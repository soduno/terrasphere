import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { EditorSidebar } from '@components/editor/EditorSidebar';
import { EditorCanvas } from '@components/editor/EditorCanvas';
import { EditorToolbar } from '@components/editor/EditorToolbar';
import { TerraGravityProvider } from '@components/editor/terra-gravity/TerraGravity';
import { GridColumnSelectionProvider } from '@components/editor/GridColumnSelection';
import {
  EditorProperties,
  normalizePropertySectionOrder,
} from '@components/editor/EditorProperties';
import type { EditorElement } from '../../types/editor';
import { useEditorAutosave } from '../../composables/editor/useEditorAutosave';
import { useEditorElements } from '../../composables/editor/useEditorElements';
import { useEditorImageUpload } from '../../composables/editor/useEditorImageUpload';
import { useEditorPropertyOrder } from '../../composables/editor/useEditorPropertyOrder';
import type { Language } from '@localization/types';
import { DuplicateWysiwygDialog } from '@localization/components/DuplicateWysiwygDialog';

interface EditorProps {
  page: {
    id: number;
    title: string;
    status: string;
    elements: EditorElement[];
    lockVersion: number;
    updatedAt: string | null;
  };
  propertySectionOrder: string[];
  languages: Language[];
  locale: string;
  hasTranslation: boolean;
  translationSources: Language[];
}

export default function Editor({
  page,
  propertySectionOrder,
  languages,
  locale,
  hasTranslation,
  translationSources,
}: EditorProps) {
  const [showGridModal, setShowGridModal] = useState(false);
  const targetLanguage = languages.find((language) => language.locale === locale);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(() =>
    !hasTranslation
      && targetLanguage !== undefined
      && !targetLanguage.isDefault
      && translationSources.length > 0,
  );
  const propertyOrder = useEditorPropertyOrder(
    normalizePropertySectionOrder(propertySectionOrder)
  );
  const editor = useEditorElements(page.elements);
  const saveStatus = useEditorAutosave({
    pageId: page.id,
    elements: editor.elements,
    initialElements: page.elements,
    initialLockVersion: page.lockVersion,
    locale,
  });
  const {
    isUploading: isUploadingImages,
    error: imageUploadError,
    upload: uploadImages,
  } = useEditorImageUpload();

  useEffect(() => {
    const preventFileNavigation = (event: DragEvent) => {
      if (
        Array.from(event.dataTransfer?.types ?? [])
          .some((type) => type.toLowerCase() === 'files')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('dragover', preventFileNavigation, true);
    window.addEventListener('drop', preventFileNavigation, true);

    return () => {
      window.removeEventListener('dragover', preventFileNavigation, true);
      window.removeEventListener('drop', preventFileNavigation, true);
    };
  }, []);

  const uploadDroppedImages = async (
    files: File[],
    targetElementId: string | null,
    position?: 'before' | 'after',
  ) => {
    const urls = await uploadImages(files);
    if (!urls) return;

    editor.insertImages(urls, targetElementId, position);
  };

  const addGridElement = (columnCount: number) => {
    const gridElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'grid',
      properties: { 
        padding: '0',
        margin: '0',
        backgroundColor: 'transparent',
        textAlign: 'left',
        fontSize: '16',
        color: '#000000',
        borderRadius: '0',
        columnGap: '20',
        columnCount,
        columnProperties: Array.from({ length: columnCount }, () => ({
          gap: '8',
          padding: '12',
          paddingLinked: true,
          margin: '0',
          marginLinked: true,
          verticalAlign: 'top' as const,
        })),
      },
      children: [],
    };
    editor.addElement(gridElement);
    setShowGridModal(false);
  };

  return (
    <TerraGravityProvider>
      <GridColumnSelectionProvider>
        <div
        className="h-screen flex flex-col bg-gray-50/50 dark:bg-gray-950"
        onDragOverCapture={(event) => {
          if (
            Array.from(event.dataTransfer.types)
              .some((type) => type.toLowerCase() === 'files')
          ) {
            event.preventDefault();
          }
        }}
        onDropCapture={(event) => {
          if (event.dataTransfer.files.length > 0) {
            event.preventDefault();
          }
        }}
      >
        <EditorToolbar
          pageId={page.id}
          title={page.title}
          status={page.status}
          saveStatus={saveStatus}
          languages={languages}
          locale={locale}
        />
        <div className="flex-1 flex overflow-hidden">
          <EditorSidebar
            onAddElement={editor.addElement}
            showGridModal={() => setShowGridModal(true)}
            hasContainerElements={editor.hasContainerElements}
          />
          <EditorCanvas
            elements={editor.elements}
            selectedElement={editor.selectedElementId}
            setSelectedElement={editor.setSelectedElementId}
            updateElement={editor.updateElement}
            deleteElement={editor.deleteElement}
            duplicateElement={editor.duplicateElement}
            moveElement={editor.moveElement}
            moveElementToColumn={editor.moveElementToColumn}
            addElement={editor.addElement}
            hasContainerElements={editor.hasContainerElements}
            onDropImageFiles={uploadDroppedImages}
            isUploadingImages={isUploadingImages}
            imageUploadError={imageUploadError}
          />
          <EditorProperties
            element={editor.selectedElement}
            updateElement={editor.updateElement}
            onUploadImages={uploadImages}
            isUploadingImages={isUploadingImages}
            imageUploadError={imageUploadError}
            sectionOrder={propertyOrder.order}
            onSectionOrderChange={propertyOrder.updateOrder}
          />
        </div>
        </div>

        {/* Grid Column Count Modal */}
        {showGridModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Grid Container</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              How many columns would you like?
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => addGridElement(count)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="text-3xl text-gray-900 dark:text-white mb-1">{count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">columns</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGridModal(false)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
          </div>
        )}
        {targetLanguage && (
          <DuplicateWysiwygDialog
            pageId={page.id}
            targetLanguage={targetLanguage}
            sources={translationSources}
            open={showDuplicateDialog}
            onOpenChange={setShowDuplicateDialog}
            onDuplicated={() => router.visit(
              `/admin/editor/${page.id}?locale=${encodeURIComponent(locale)}`,
              { preserveState: false, replace: true },
            )}
          />
        )}
      </GridColumnSelectionProvider>
    </TerraGravityProvider>
  );
}
