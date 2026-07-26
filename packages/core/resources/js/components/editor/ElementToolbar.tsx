import { Copy, Move, Settings, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { ElementToolbarProps } from '../../types/editor';

export function ElementToolbar({
  dragHandleRef,
  dragTitle = 'Move element',
  onSelect,
  onDuplicate,
  onDelete,
}: ElementToolbarProps) {
  const action = (callback: () => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      callback();
    };

  return (
    <div className="animate-in fade-in absolute -top-6 left-1/2 z-20 flex h-6 -translate-x-1/2 items-center rounded-t-sm bg-indigo-600 px-1 text-white duration-150">
      <span
        ref={dragHandleRef}
        className="flex h-full cursor-move items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
        title={dragTitle}
      >
        <Move className="size-3.5" />
      </span>
      <Divider />
      <button
        onClick={action(onSelect)}
        className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
        title="Settings"
      >
        <Settings className="size-3.5" />
      </button>
      <Divider />
      <button
        onClick={action(onDuplicate)}
        className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
        title="Duplicate"
      >
        <Copy className="size-3.5" />
      </button>
      <Divider />
      <button
        onClick={action(onDelete)}
        className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-red-500/35 hover:text-white"
        title="Delete"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function Divider() {
  return <div className="h-3.5 w-px bg-white/25" />;
}
