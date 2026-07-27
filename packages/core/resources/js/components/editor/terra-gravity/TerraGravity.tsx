import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Context,
  type ReactNode,
  type RefCallback,
} from 'react';
import type { EditorDragPayload } from '../../../types/editor';

const ACTIVATION_DISTANCE = 5;

type DragPoint = {
  x: number;
  y: number;
};

export type GravityDropEvent<Payload extends EditorDragPayload> = {
  payload: Payload;
  point: DragPoint;
  rect: DOMRect;
  target: HTMLElement;
};

type DragSourceOptions<Payload extends EditorDragPayload> = {
  payload: Payload;
  disabled?: boolean;
  previewLabel: string;
};

type DropTargetOptions<Payload extends EditorDragPayload> = {
  accepts: (payload: EditorDragPayload) => payload is Payload;
  onMove?: (event: GravityDropEvent<Payload>) => void;
  onDrop: (event: GravityDropEvent<Payload>) => void;
  onLeave?: () => void;
};

type RegisteredTarget = {
  id: string;
  node: HTMLElement;
  options: () => DropTargetOptions<EditorDragPayload>;
};

type DragSession = {
  pointerId: number;
  sourceId: string;
  sourceNode: HTMLElement;
  payload: EditorDragPayload;
  previewLabel: string;
  start: DragPoint;
  point: DragPoint;
  active: boolean;
  targetId: string | null;
};

type DragSnapshot = {
  active: boolean;
  sourceId: string | null;
  targetId: string | null;
  payload: EditorDragPayload | null;
};

type TerraGravityContextValue = {
  snapshot: DragSnapshot;
  beginDrag: (
    event: PointerEvent,
    sourceId: string,
    sourceNode: HTMLElement,
    options: DragSourceOptions<EditorDragPayload>,
  ) => void;
  registerTarget: (target: RegisteredTarget) => () => void;
  shouldSuppressClick: (sourceId: string) => boolean;
};

type TerraGravityWindow = Window & {
  __terraGravityContext?: Context<
    TerraGravityContextValue | null
  >;
};

const gravityWindow = window as TerraGravityWindow;
const TerraGravityContext =
  gravityWindow.__terraGravityContext
  ??= createContext<TerraGravityContextValue | null>(null);

const idleSnapshot: DragSnapshot = {
  active: false,
  sourceId: null,
  targetId: null,
  payload: null,
};

function targetAtPoint(
  point: DragPoint,
  payload: EditorDragPayload,
  targets: Map<HTMLElement, RegisteredTarget>,
) {
  const hitElements = document.elementsFromPoint(point.x, point.y);

  for (const hitElement of hitElements) {
    let candidate: Element | null = hitElement;

    while (candidate) {
      const target = candidate instanceof HTMLElement
        ? targets.get(candidate)
        : undefined;
      if (target && target.options().accepts(payload)) return target;
      candidate = candidate.parentElement;
    }
  }

  return null;
}

function scrollNearViewportEdge(point: DragPoint) {
  const edgeSize = 48;
  const maxSpeed = 18;
  const hitElements = document.elementsFromPoint(point.x, point.y);
  let candidate: HTMLElement | null = null;

  for (const hitElement of hitElements) {
    let current = hitElement instanceof HTMLElement
      ? hitElement
      : hitElement.parentElement;

    while (current) {
      const style = window.getComputedStyle(current);
      if (
        /(auto|scroll)/.test(style.overflowY)
        && current.scrollHeight > current.clientHeight
      ) {
        candidate = current;
        break;
      }
      current = current.parentElement;
    }

    if (candidate) break;
  }

  if (!candidate) return;

  const rect = candidate.getBoundingClientRect();
  const distanceFromTop = point.y - rect.top;
  const distanceFromBottom = rect.bottom - point.y;
  const direction = distanceFromTop < edgeSize
    ? -1
    : distanceFromBottom < edgeSize
      ? 1
      : 0;
  if (direction === 0) return;

  const edgeDistance = direction < 0
    ? distanceFromTop
    : distanceFromBottom;
  const intensity = Math.max(
    0,
    Math.min(1, (edgeSize - edgeDistance) / edgeSize),
  );
  candidate.scrollBy({ top: direction * maxSpeed * intensity });
}

export function TerraGravityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const targetsRef = useRef(new Map<HTMLElement, RegisteredTarget>());
  const sessionRef = useRef<DragSession | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const suppressedClickRef = useRef<{
    sourceId: string;
    expiresAt: number;
  } | null>(null);
  const documentStyleRef = useRef<{
    cursor: string;
    userSelect: string;
  } | null>(null);
  const [snapshot, setSnapshot] = useState(idleSnapshot);
  const [previewLabel, setPreviewLabel] = useState<string | null>(null);

  const updatePreviewPosition = useCallback((point: DragPoint) => {
    if (!previewRef.current) return;
    previewRef.current.style.transform =
      `translate3d(${point.x + 14}px, ${point.y + 14}px, 0)`;
  }, []);

  const leaveCurrentTarget = useCallback(() => {
    const session = sessionRef.current;
    if (!session?.targetId) return;

    const currentTarget = Array.from(targetsRef.current.values())
      .find((target) => target.id === session.targetId);
    currentTarget?.options().onLeave?.();
    session.targetId = null;
  }, []);

  const finishDrag = useCallback((cancelled: boolean) => {
    const session = sessionRef.current;
    if (!session) return;

    try {
      if (session.active && !cancelled) {
        const target = targetAtPoint(
          session.point,
          session.payload,
          targetsRef.current,
        );

        if (target) {
          target.options().onDrop({
            payload: session.payload,
            point: session.point,
            rect: target.node.getBoundingClientRect(),
            target: target.node,
          });
        }

        suppressedClickRef.current = {
          sourceId: session.sourceId,
          expiresAt: Date.now() + 250,
        };
      }
    } finally {
      leaveCurrentTarget();
      if (session.sourceNode.hasPointerCapture(session.pointerId)) {
        session.sourceNode.releasePointerCapture(session.pointerId);
      }
      sessionRef.current = null;
      delete document.documentElement.dataset.terraGravityDragging;
      if (documentStyleRef.current) {
        document.body.style.cursor = documentStyleRef.current.cursor;
        document.body.style.userSelect =
          documentStyleRef.current.userSelect;
      }
      documentStyleRef.current = null;
      setPreviewLabel(null);
      setSnapshot(idleSnapshot);
    }
  }, [leaveCurrentTarget]);

  const moveDrag = useCallback((event: PointerEvent) => {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) return;

    session.point = { x: event.clientX, y: event.clientY };
    const distance = Math.hypot(
      session.point.x - session.start.x,
      session.point.y - session.start.y,
    );

    if (!session.active && distance < ACTIVATION_DISTANCE) return;

    event.preventDefault();

    if (!session.active) {
      session.active = true;
      documentStyleRef.current = {
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
      };
      document.documentElement.dataset.terraGravityDragging = 'true';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      setPreviewLabel(session.previewLabel);
      setSnapshot({
        active: true,
        sourceId: session.sourceId,
        targetId: null,
        payload: session.payload,
      });
      requestAnimationFrame(() => updatePreviewPosition(session.point));
    }

    updatePreviewPosition(session.point);
    scrollNearViewportEdge(session.point);
    const target = targetAtPoint(
      session.point,
      session.payload,
      targetsRef.current,
    );
    const nextTargetId = target?.id ?? null;

    if (session.targetId !== nextTargetId) {
      leaveCurrentTarget();
      session.targetId = nextTargetId;
      setSnapshot({
        active: true,
        sourceId: session.sourceId,
        targetId: nextTargetId,
        payload: session.payload,
      });
    }

    if (target) {
      target.options().onMove?.({
        payload: session.payload,
        point: session.point,
        rect: target.node.getBoundingClientRect(),
        target: target.node,
      });
    }
  }, [leaveCurrentTarget, updatePreviewPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => moveDrag(event);
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === sessionRef.current?.pointerId) finishDrag(false);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId === sessionRef.current?.pointerId) finishDrag(true);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sessionRef.current) finishDrag(true);
    };

    window.addEventListener('pointermove', handlePointerMove, {
      capture: true,
      passive: false,
    });
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      finishDrag(true);
    };
  }, [finishDrag, moveDrag]);

  const beginDrag = useCallback((
    event: PointerEvent,
    sourceId: string,
    sourceNode: HTMLElement,
    options: DragSourceOptions<EditorDragPayload>,
  ) => {
    if (
      options.disabled
      || event.button !== 0
      || sessionRef.current
    ) return;

    sessionRef.current = {
      pointerId: event.pointerId,
      sourceId,
      sourceNode,
      payload: options.payload,
      previewLabel: options.previewLabel,
      start: { x: event.clientX, y: event.clientY },
      point: { x: event.clientX, y: event.clientY },
      active: false,
      targetId: null,
    };
    sourceNode.setPointerCapture(event.pointerId);
  }, []);

  const registerTarget = useCallback((target: RegisteredTarget) => {
    targetsRef.current.set(target.node, target);

    return () => {
      targetsRef.current.delete(target.node);
      if (sessionRef.current?.targetId === target.id) {
        target.options().onLeave?.();
        sessionRef.current.targetId = null;
      }
    };
  }, []);

  const shouldSuppressClick = useCallback((sourceId: string) => {
    const suppressedClick = suppressedClickRef.current;
    if (
      !suppressedClick
      || suppressedClick.sourceId !== sourceId
      || suppressedClick.expiresAt < Date.now()
    ) return false;

    suppressedClickRef.current = null;
    return true;
  }, []);

  const contextValue = useMemo<TerraGravityContextValue>(() => ({
    snapshot,
    beginDrag,
    registerTarget,
    shouldSuppressClick,
  }), [beginDrag, registerTarget, shouldSuppressClick, snapshot]);

  return (
    <TerraGravityContext.Provider value={contextValue}>
      {children}
      {previewLabel && (
        <div
          ref={previewRef}
          className="pointer-events-none fixed left-0 top-0 z-[200] rounded-lg border border-indigo-200 bg-white/95 px-3 py-2 text-xs font-medium text-indigo-700 shadow-xl backdrop-blur dark:border-indigo-800 dark:bg-gray-900/95 dark:text-indigo-300"
        >
          {previewLabel}
        </div>
      )}
    </TerraGravityContext.Provider>
  );
}

function useTerraGravity() {
  const context = useContext(TerraGravityContext);
  if (!context) {
    throw new Error(
      'TerraGravity hooks must be used inside TerraGravityProvider.',
    );
  }
  return context;
}

export function useGravitySource<Payload extends EditorDragPayload>({
  payload,
  disabled = false,
  previewLabel,
}: DragSourceOptions<Payload>) {
  const context = useTerraGravity();
  const {
    beginDrag,
    shouldSuppressClick,
    snapshot,
  } = context;
  const sourceId = useId();
  const optionsRef = useRef({ payload, disabled, previewLabel });
  const cleanupRef = useRef<(() => void) | null>(null);
  optionsRef.current = { payload, disabled, previewLabel };

  const dragHandleRef = useCallback<RefCallback<HTMLElement>>((node) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!node) return;

    const handlePointerDown = (event: PointerEvent) => {
      beginDrag(
        event,
        sourceId,
        node,
        optionsRef.current,
      );
    };
    const handleClick = (event: MouseEvent) => {
      if (!shouldSuppressClick(sourceId)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const previousTouchAction = node.style.touchAction;
    node.style.touchAction = 'none';
    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('click', handleClick, true);

    cleanupRef.current = () => {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('click', handleClick, true);
      node.style.touchAction = previousTouchAction;
    };
  }, [beginDrag, shouldSuppressClick, sourceId]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return {
    dragHandleRef,
    isDragging:
      snapshot.active
      && snapshot.sourceId === sourceId,
  };
}

export function useGravityTarget<Payload extends EditorDragPayload>(
  options: DropTargetOptions<Payload>,
) {
  const context = useTerraGravity();
  const { registerTarget, snapshot } = context;
  const targetId = useId();
  const optionsRef = useRef(options);
  const cleanupRef = useRef<(() => void) | null>(null);
  optionsRef.current = options;

  const dropTargetRef = useCallback<RefCallback<HTMLElement>>((node) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!node) return;

    cleanupRef.current = registerTarget({
      id: targetId,
      node,
      options: () =>
        optionsRef.current as unknown as DropTargetOptions<EditorDragPayload>,
    });
  }, [registerTarget, targetId]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const isOver =
    snapshot.active
    && snapshot.targetId === targetId;
  const payload = isOver
    ? snapshot.payload as Payload
    : null;

  return {
    dropTargetRef,
    isOver,
    payload,
  };
}
