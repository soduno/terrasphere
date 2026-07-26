import { useSidebarElementDrag } from '../../composables/editor/useSidebarElementDrag';
import type { EditorSidebarItemProps } from '../../types/editor';

const accentClasses = {
  indigo: {
    border: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    background: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30',
    icon: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    text: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-400',
  },
  purple: {
    border: 'hover:border-purple-400 dark:hover:border-purple-500',
    background: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/30',
    icon: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    text: 'group-hover:text-purple-700 dark:group-hover:text-purple-400',
  },
  pink: {
    border: 'hover:border-pink-400 dark:hover:border-pink-500',
    background: 'hover:bg-pink-50/50 dark:hover:bg-pink-950/30',
    icon: 'group-hover:text-pink-600 dark:group-hover:text-pink-400',
    text: 'group-hover:text-pink-700 dark:group-hover:text-pink-400',
  },
} as const;

export function EditorSidebarItem({
  element,
  onCreate,
  onAddElement,
  showGridModal,
  shouldBlur,
  hasContainerElements,
}: EditorSidebarItemProps) {
  const dragState = useSidebarElementDrag({
    element,
    onCreate,
    canDrag:
      element.type === 'flex'
      || element.type === 'grid'
      || hasContainerElements,
  });
  const accent = accentClasses[element.accent];

  const handleClick = () => {
    if (!dragState.isLayout) return;
    if (element.type === 'grid') {
      showGridModal();
      return;
    }
    onAddElement(onCreate(element.type));
  };

  return (
    <button
      ref={(node) => {
        dragState.drag(node);
      }}
      onClick={handleClick}
      disabled={shouldBlur}
      className={`group flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-4 transition-all hover:scale-105 active:scale-95 dark:border-gray-700 ${accent.border} ${accent.background} ${
        dragState.isDragging ? 'scale-95 opacity-50' : 'opacity-100'
      } ${
        shouldBlur
          ? 'cursor-not-allowed opacity-40 blur-sm hover:scale-100'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <element.icon
        className={`mb-2 size-6 text-gray-500 transition-colors dark:text-gray-400 ${accent.icon}`}
      />
      <span
        className={`text-center text-xs text-gray-700 dark:text-gray-300 ${accent.text}`}
      >
        {element.label}
      </span>
    </button>
  );
}
