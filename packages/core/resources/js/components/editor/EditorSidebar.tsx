import type { EditorSidebarProps } from '../../types/editor';
import {
  createEditorElement,
  EDITOR_ELEMENT_GROUPS,
  isLayoutElement,
} from './editorElementCatalog';
import { EditorSidebarItem } from './EditorSidebarItem';

export function EditorSidebar({
  onAddElement,
  showGridModal,
  hasContainerElements,
}: EditorSidebarProps) {
  return (
    <aside className="w-[280px] overflow-y-auto border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-6 p-6">
        {EDITOR_ELEMENT_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.elements.map((element) => (
                <EditorSidebarItem
                  key={element.type}
                  element={element}
                  onCreate={createEditorElement}
                  onAddElement={onAddElement}
                  showGridModal={showGridModal}
                  shouldBlur={
                    !hasContainerElements && !isLayoutElement(element.type)
                  }
                  hasContainerElements={hasContainerElements}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 dark:border-gray-800 dark:from-indigo-950/20 dark:to-purple-950/20">
        <h3 className="mb-2 text-xs text-gray-900 dark:text-white">
          Quick Tips
        </h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>• Drag layout containers first</p>
          <p>• Add elements into containers</p>
          <p>• Double-click text to edit</p>
          <p>• Use properties panel to style</p>
        </div>
      </div>
    </aside>
  );
}
