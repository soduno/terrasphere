import { useRef, useState, type ReactNode } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { EditorElement } from './ElementTypes';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lock,
  Minus,
  MousePointer2,
  Unlock,
} from 'lucide-react';

interface EditorPropertiesProps {
  element?: EditorElement;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  sectionOrder?: PropertySectionId[];
  onSectionOrderChange?: (order: PropertySectionId[]) => void;
}

export const PROPERTY_SECTION_IDS = [
  'spacing',
  'horizontal-alignment',
  'vertical-alignment',
  'layout',
  'typography',
  'appearance',
  'image',
  'float',
] as const;

export type PropertySectionId = typeof PROPERTY_SECTION_IDS[number];

export function normalizePropertySectionOrder(order: readonly string[]): PropertySectionId[] {
  const validIds = new Set<PropertySectionId>(PROPERTY_SECTION_IDS);
  const savedIds = order.filter(
    (id): id is PropertySectionId => validIds.has(id as PropertySectionId)
  );

  return [...new Set([...savedIds, ...PROPERTY_SECTION_IDS])];
}

export function EditorProperties({
  element,
  updateElement,
  sectionOrder: savedSectionOrder = [...PROPERTY_SECTION_IDS],
  onSectionOrderChange = () => undefined,
}: EditorPropertiesProps) {
  const [sectionOrder, setSectionOrder] = useState<PropertySectionId[]>(
    () => normalizePropertySectionOrder(savedSectionOrder)
  );
  const sectionOrderRef = useRef(sectionOrder);

  if (!element) {
    return (
      <aside className="w-[320px] shrink-0 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <div>
            <h3 className="text-sm text-gray-900 dark:text-white">Properties</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customize your element
            </p>
          </div>

          <div className="mt-16 flex flex-col items-center px-5 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
              <MousePointer2 className="size-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200">
              Select an element
            </p>
            <p className="mt-1.5 max-w-[220px] text-xs leading-5 text-gray-500 dark:text-gray-400">
              Click an element on the canvas to adjust its layout, spacing, and appearance.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const handlePropertyChange = (property: string, value: string | number | boolean) => {
    updateElement(element.id, {
      properties: {
        ...element.properties,
        [property]: value,
      },
    });
  };

  const handlePropertiesChange = (updates: Partial<EditorElement['properties']>) => {
    updateElement(element.id, {
      properties: {
        ...element.properties,
        ...updates,
      },
    });
  };

  const isTextElement = element.type === 'heading' || element.type === 'text' || element.type === 'wysiwyg';
  const isLayoutElement = element.type === 'flex' || element.type === 'grid';
  const isContentOrMediaElement = !isLayoutElement;
  const horizontalAlignment =
    element.properties.contentAlign
    ?? (isTextElement ? element.properties.textAlign : undefined)
    ?? (element.type === 'image' ? element.properties.imageAlign : undefined)
    ?? (element.type === 'calendar' ? 'center' : 'left');

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    setSectionOrder((currentOrder) => {
      const nextOrder = [...currentOrder];
      const [draggedSection] = nextOrder.splice(dragIndex, 1);
      if (!draggedSection) return currentOrder;
      nextOrder.splice(hoverIndex, 0, draggedSection);
      sectionOrderRef.current = nextOrder;
      return nextOrder;
    });
  };

  const persistSectionOrder = () => {
    onSectionOrderChange(sectionOrderRef.current);
  };

  const sortableSectionProps = (sectionId: PropertySectionId) => ({
    sectionId,
    position: sectionOrder.indexOf(sectionId),
    onMove: moveSection,
    onDrop: persistSectionOrder,
  });

  return (
    <aside className="w-[320px] shrink-0 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 overflow-y-auto shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-sm text-gray-900 dark:text-white">Properties</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Customize your element
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Element Type */}
          <div className="order-[-1]">
            <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Element</Label>
            <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-white capitalize">
                {element.type.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Spacing */}
          <PropertySection title="Spacing" defaultOpen {...sortableSectionProps('spacing')}>
            <div className="space-y-4">
            <SpacingControl
              kind="padding"
              properties={element.properties}
              defaultValue={0}
              onChange={handlePropertiesChange}
            />

            <SpacingControl
              kind="margin"
              properties={element.properties}
              defaultValue={0}
              onChange={handlePropertiesChange}
            />
            </div>
          </PropertySection>

          {isContentOrMediaElement && (
            <>
              <PropertySection title="Horizontal alignment" {...sortableSectionProps('horizontal-alignment')}>
                <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                  {([
                    { value: 'left', label: 'Left', Icon: AlignLeft },
                    { value: 'center', label: 'Center', Icon: AlignCenter },
                    { value: 'right', label: 'Right', Icon: AlignRight },
                  ] as const).map(({ value, label, Icon }) => {
                    const isActive = horizontalAlignment === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handlePropertyChange('contentAlign', value)}
                        className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs transition-colors ${
                          isActive
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        title={`Align ${label.toLowerCase()}`}
                        aria-pressed={isActive}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                  Position this element within its container. This does not wrap nearby content.
                </p>
                </div>
              </PropertySection>

              <PropertySection title="Vertical alignment" {...sortableSectionProps('vertical-alignment')}>
                <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                  {([
                    { value: 'top', label: 'Top', Icon: ChevronUp },
                    { value: 'center', label: 'Middle', Icon: Minus },
                    { value: 'bottom', label: 'Bottom', Icon: ChevronDown },
                  ] as const).map(({ value, label, Icon }) => {
                    const isActive = (element.properties.verticalAlign || 'top') === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handlePropertyChange('verticalAlign', value)}
                        className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs transition-colors ${
                          isActive
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        title={`Align ${label.toLowerCase()}`}
                        aria-pressed={isActive}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                  Position this element vertically within the available container height.
                </p>
                </div>
              </PropertySection>
            </>
          )}

          {isLayoutElement && (
            <PropertySection title="Layout" {...sortableSectionProps('layout')}>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="columnGap" className="text-xs text-gray-700 dark:text-gray-300">
                      {element.type === 'flex' ? 'Gap' : 'Column Gap'}
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.columnGap || 20}px</span>
                  </div>
                  <Slider
                    id="columnGap"
                    min={0}
                    max={60}
                    step={5}
                    value={[parseInt(element.properties.columnGap || '20')]}
                    onValueChange={([value]) => handlePropertyChange('columnGap', value.toString())}
                    className="w-full"
                  />
                </div>
              </div>
            </PropertySection>
          )}

          {isTextElement && (
            <PropertySection title="Typography" {...sortableSectionProps('typography')}>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="fontSize" className="text-xs text-gray-700 dark:text-gray-300">Font Size</Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.fontSize || 16}px</span>
                  </div>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={72}
                    step={2}
                    value={[parseInt(element.properties.fontSize || '16')]}
                    onValueChange={([value]) => handlePropertyChange('fontSize', value.toString())}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="color" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={element.properties.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="h-10 w-16 p-1 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={element.properties.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="h-10 flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                    />
                  </div>
                </div>

              </div>
            </PropertySection>
          )}

          {/* Background & Style */}
          <PropertySection title="Appearance" {...sortableSectionProps('appearance')}>
            <div className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Background</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={element.properties.backgroundColor === 'transparent' ? '#ffffff' : element.properties.backgroundColor || '#ffffff'}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="h-10 w-16 p-1 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.properties.backgroundColor || 'transparent'}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="h-10 flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                  placeholder="transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="borderRadius" className="text-xs text-gray-700 dark:text-gray-300">Border Radius</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.borderRadius || 0}px</span>
              </div>
              <Slider
                id="borderRadius"
                min={0}
                max={50}
                step={2}
                value={[parseInt(element.properties.borderRadius || '0')]}
                onValueChange={([value]) => handlePropertyChange('borderRadius', value.toString())}
                className="w-full"
              />
            </div>
            </div>
          </PropertySection>

          {element.type === 'image' && (
            <PropertySection title="Image" {...sortableSectionProps('image')}>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="imageUrl" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="text"
                    value={element.properties.imageUrl || ''}
                    onChange={(e) => handlePropertyChange('imageUrl', e.target.value)}
                    className="h-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
                <Separator className="bg-gray-100 dark:bg-gray-800" />
                <div className="space-y-4">
                  <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Proportions
                  </Label>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="imageWidth" className="text-xs text-gray-700 dark:text-gray-300">
                        Width
                      </Label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {parseInt(element.properties.imageWidth || '100')}%
                      </span>
                    </div>
                    <Slider
                      id="imageWidth"
                      min={10}
                      max={100}
                      step={5}
                      value={[parseInt(element.properties.imageWidth || '100')]}
                      onValueChange={([value]) => handlePropertyChange('imageWidth', `${value}%`)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="imageHeight" className="text-xs text-gray-700 dark:text-gray-300">
                        Height
                      </Label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {!element.properties.imageHeight || element.properties.imageHeight === 'auto'
                          ? 'Auto'
                          : `${parseInt(element.properties.imageHeight || '0')}px`}
                      </span>
                    </div>
                    <Slider
                      id="imageHeight"
                      min={0}
                      max={800}
                      step={10}
                      value={[
                        !element.properties.imageHeight || element.properties.imageHeight === 'auto'
                          ? 0
                          : parseInt(element.properties.imageHeight || '0')
                      ]}
                      onValueChange={([value]) =>
                        handlePropertyChange('imageHeight', value === 0 ? 'auto' : `${value}px`)
                      }
                      className="w-full"
                    />
                  </div>
                  <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                    Set height to Auto to preserve the image's natural aspect ratio.
                  </p>
                </div>
              </div>
            </PropertySection>
          )}

          <PropertySection title="Float" {...sortableSectionProps('float')}>
            <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {(['none', 'left', 'right'] as const).map((float) => {
                const isActive = (element.properties.float || 'none') === float;

                return (
                  <button
                    key={float}
                    type="button"
                    onClick={() => handlePropertyChange('float', float)}
                    className={`h-8 rounded-md text-xs capitalize transition-colors ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {float}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
              Float content left or right and let following content wrap around it.
            </p>
            </div>
          </PropertySection>
        </div>
      </div>
    </aside>
  );
}

interface PropertySectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  sectionId: PropertySectionId;
  position: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDrop: () => void;
}

function PropertySection({
  title,
  children,
  defaultOpen = false,
  sectionId,
  position,
  onMove,
  onDrop,
}: PropertySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'property-section',
    item: { id: sectionId, index: position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const [, drop] = useDrop({
    accept: 'property-section',
    hover: (item: { id: PropertySectionId; index: number }, monitor) => {
      if (!sectionRef.current || item.id === sectionId) return;

      const bounds = sectionRef.current.getBoundingClientRect();
      const pointer = monitor.getClientOffset();
      if (!pointer) return;

      const middle = (bounds.bottom - bounds.top) / 2;
      const pointerOffset = pointer.y - bounds.top;
      if (item.index < position && pointerOffset < middle) return;
      if (item.index > position && pointerOffset > middle) return;

      onMove(item.index, position);
      item.index = position;
    },
    drop: onDrop,
  });

  drag(handleRef);
  drop(sectionRef);

  return (
    <div
      ref={sectionRef}
      style={{ order: position }}
      className={`relative transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={`Drag to reorder ${title}`}
        title={`Drag to reorder ${title}`}
        className="absolute left-2.5 top-3.5 z-10 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-300"
      >
        <GripVertical className="size-3.5" />
      </button>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? 'content' : undefined}
        className="w-full"
      >
        <AccordionItem
          value="content"
          className="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 shadow-sm last:border-b dark:border-gray-700 dark:bg-gray-900"
        >
          <AccordionTrigger className="py-3 pl-4 text-xs font-medium uppercase tracking-wide text-gray-600 hover:no-underline dark:text-gray-300">
            {title}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface SpacingControlProps {
  kind: 'padding' | 'margin';
  properties: EditorElement['properties'];
  defaultValue: number;
  onChange: (updates: Partial<EditorElement['properties']>) => void;
}

function SpacingControl({
  kind,
  properties,
  defaultValue,
  onChange,
}: SpacingControlProps) {
  const isPadding = kind === 'padding';
  const linked = isPadding
    ? properties.paddingLinked !== false
    : properties.marginLinked !== false;
  const baseValue = parseInt(
    (isPadding ? properties.padding : properties.margin) || defaultValue.toString()
  );
  const linkedKey = isPadding ? 'paddingLinked' : 'marginLinked';
  const baseKey = isPadding ? 'padding' : 'margin';
  const sides = [
    {
      label: 'Top',
      key: isPadding ? 'paddingTop' : 'marginTop',
    },
    {
      label: 'Right',
      key: isPadding ? 'paddingRight' : 'marginRight',
    },
    {
      label: 'Bottom',
      key: isPadding ? 'paddingBottom' : 'marginBottom',
    },
    {
      label: 'Left',
      key: isPadding ? 'paddingLeft' : 'marginLeft',
    },
  ] as const;

  const getSideValue = (key: typeof sides[number]['key']) =>
    parseInt((properties[key] as string | undefined) || baseValue.toString());

  const setAllSides = (value: number) => {
    onChange({
      [baseKey]: value.toString(),
      [sides[0].key]: value.toString(),
      [sides[1].key]: value.toString(),
      [sides[2].key]: value.toString(),
      [sides[3].key]: value.toString(),
    } as Partial<EditorElement['properties']>);
  };

  const toggleLinked = () => {
    if (linked) {
      onChange({
        [linkedKey]: false,
        [sides[0].key]: baseValue.toString(),
        [sides[1].key]: baseValue.toString(),
        [sides[2].key]: baseValue.toString(),
        [sides[3].key]: baseValue.toString(),
      } as Partial<EditorElement['properties']>);
      return;
    }

    const value = getSideValue(sides[0].key);
    onChange({
      [linkedKey]: true,
      [baseKey]: value.toString(),
      [sides[0].key]: value.toString(),
      [sides[1].key]: value.toString(),
      [sides[2].key]: value.toString(),
      [sides[3].key]: value.toString(),
    } as Partial<EditorElement['properties']>);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Label className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
            {kind}
          </Label>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
            {linked ? 'All sides linked' : 'Adjust each side'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleLinked}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            linked
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-500 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white'
          }`}
          title={linked ? `Unlock ${kind} sides` : `Lock ${kind} sides`}
          aria-label={linked ? `Unlock ${kind} sides` : `Lock ${kind} sides`}
        >
          {linked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </button>
      </div>

      {linked ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">All sides</span>
            <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {baseValue}px
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[baseValue]}
            onValueChange={([value]) => setAllSides(value)}
            className="w-full"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sides.map((side) => {
            const value = getSideValue(side.key);

            return (
              <div key={side.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {side.label}
                  </span>
                  <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
                    {value}px
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[value]}
                  onValueChange={([newValue]) =>
                    onChange({
                      [side.key]: newValue.toString(),
                    } as Partial<EditorElement['properties']>)
                  }
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
