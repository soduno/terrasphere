import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Move,
  Settings,
  Trash2,
} from 'lucide-react';
import type { EmbeddedImageControlsProps } from '../../types/editor';

const alignmentChoices = [
  { value: 'left', label: 'Left', Icon: AlignLeft },
  { value: 'center', label: 'Center', Icon: AlignCenter },
  { value: 'right', label: 'Right', Icon: AlignRight },
] as const;

export function EmbeddedImageControls({
  image,
  showSettings,
  dragHandleRef,
  onToggleSettings,
  onDuplicate,
  onDelete,
  onWidthChange,
  onAlignmentChange,
  onFloatChange,
}: EmbeddedImageControlsProps) {
  return (
    <>
      <div
        className="pointer-events-auto absolute z-[90] flex h-6 -translate-x-1/2 -translate-y-full items-center rounded-sm bg-indigo-600 px-1 text-white"
        style={{
          left: image.left + image.width / 2,
          top: image.top,
        }}
      >
        <span
          ref={dragHandleRef}
          className="flex h-full cursor-move items-center px-1.5 text-white/85 hover:bg-white/15 hover:text-white"
          title="Move image"
        >
          <Move className="size-3.5" />
        </span>
        <ToolbarDivider />
        <ToolbarButton
          title="Image settings"
          onClick={onToggleSettings}
          icon={<Settings className="size-3.5" />}
        />
        <ToolbarDivider />
        <ToolbarButton
          title="Duplicate image"
          onClick={onDuplicate}
          icon={<Copy className="size-3.5" />}
        />
        <ToolbarDivider />
        <ToolbarButton
          title="Delete image"
          onClick={onDelete}
          destructive
          icon={<Trash2 className="size-3.5" />}
        />
      </div>

      {showSettings && createPortal(
        <div
          className="pointer-events-auto fixed z-[9999] w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-gray-700 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          style={{
            left: image.viewportLeft + image.width / 2,
            top: image.viewportTop + 6,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium">Image settings</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {image.widthPercent}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={image.widthPercent}
            onChange={(event) =>
              onWidthChange(Number.parseInt(event.target.value, 10))
            }
            className="h-1.5 w-full cursor-pointer accent-indigo-600"
            aria-label="Embedded image width"
          />
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-900/60">
            {alignmentChoices.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                title={`${label} align`}
                onClick={() => onAlignmentChange(value)}
                className={`flex h-7 items-center justify-center rounded text-xs transition-colors ${
                  image.alignment === value
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
          <div className="mt-3">
            <span className="mb-1.5 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Float
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-900/60">
              {(['none', 'left', 'right'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onFloatChange(value)}
                  className={`h-7 rounded text-[11px] capitalize transition-colors ${
                    image.float === value
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

type ToolbarButtonProps = {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

function ToolbarButton({
  title,
  icon,
  onClick,
  destructive = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-full items-center px-1.5 text-white/85 hover:text-white ${
        destructive ? 'hover:bg-red-500/35' : 'hover:bg-white/15'
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="h-3.5 w-px bg-white/25" />;
}
