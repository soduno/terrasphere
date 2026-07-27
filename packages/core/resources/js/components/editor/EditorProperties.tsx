import { useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import { MediaPickerDialog } from '@media/components/MediaPickerDialog';
import { createEditorPropertyUpdates } from '../../composables/editor/editorPropertyUpdates';
import {
  normalizePropertySectionOrder,
  usePropertySectionOrder,
} from '../../composables/editor/usePropertySectionOrder';
import {
  PROPERTY_SECTION_IDS,
  type EditorGridColumnProperties,
  type EditorPropertiesProps,
  type PropertySectionId,
} from '../../types/editor';
import { EditorPropertySections } from './properties/EditorPropertySections';
import { useGridColumnSelection } from './GridColumnSelection';

export { PROPERTY_SECTION_IDS, normalizePropertySectionOrder };
export type { PropertySectionId };

function PropertiesHeader() {
  return (
    <div className="mb-6">
      <h3 className="text-sm text-gray-900 dark:text-white">Properties</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Customize your element
      </p>
    </div>
  );
}

function EmptyProperties() {
  return (
    <aside className="w-[320px] shrink-0 border-l border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <PropertiesHeader />
        <div className="mt-16 flex flex-col items-center px-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
            <MousePointer2 className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200">
            Select an element
          </p>
          <p className="mt-1.5 max-w-[220px] text-xs leading-5 text-gray-500 dark:text-gray-400">
            Click an element on the canvas to adjust its layout, spacing, and
            appearance.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function EditorProperties({
  element,
  updateElement,
  onUploadImages,
  isUploadingImages = false,
  imageUploadError = null,
  sectionOrder = [...PROPERTY_SECTION_IDS],
  onSectionOrderChange = () => undefined,
}: EditorPropertiesProps) {
  const gridColumnSelection = useGridColumnSelection();
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const sectionSorting = usePropertySectionOrder(
    sectionOrder,
    onSectionOrderChange,
  );

  if (!element) return <EmptyProperties />;

  const propertyUpdates = createEditorPropertyUpdates(element, updateElement);
  const selectedGridColumnIndex =
    gridColumnSelection.selection?.containerId === element.id
      ? gridColumnSelection.selection.columnIndex
      : undefined;
  const selectedGridColumnProperties =
    selectedGridColumnIndex === undefined
      ? undefined
      : {
          padding: '12',
          paddingLinked: true,
          margin: '0',
          marginLinked: true,
          verticalAlign:
            element.properties.columnVerticalAlignments?.[
              selectedGridColumnIndex
            ] ?? 'top',
          ...element.properties.columnProperties?.[selectedGridColumnIndex],
        };
  const updateSelectedGridColumnProperties = (
    updates: Partial<EditorGridColumnProperties>,
  ) => {
    if (selectedGridColumnIndex === undefined) return;

    const columnProperties = [
      ...(element.properties.columnProperties ?? []),
    ];
    columnProperties[selectedGridColumnIndex] = {
      ...selectedGridColumnProperties,
      ...updates,
    };
    propertyUpdates.updateProperty('columnProperties', columnProperties);
  };
  const handleImageUpload = onUploadImages
    ? async (files: File[]) => {
        const urls = await onUploadImages(files);
        const imageUrl = urls?.[0];

        if (imageUrl) {
          propertyUpdates.updateProperty('imageUrl', imageUrl);
        }
      }
    : undefined;

  return (
    <>
      <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <PropertiesHeader />
          <EditorPropertySections
            element={element}
            selectedGridColumnIndex={selectedGridColumnIndex}
            selectedGridColumnProperties={selectedGridColumnProperties}
            onSelectedGridColumnPropertiesChange={
              updateSelectedGridColumnProperties
            }
            onPropertyChange={propertyUpdates.updateProperty}
            onPropertiesChange={propertyUpdates.updateProperties}
            onChooseImage={() => setShowMediaPicker(true)}
            onUploadImage={handleImageUpload}
            isUploadingImage={isUploadingImages}
            imageUploadError={imageUploadError}
            sortableSectionProps={sectionSorting.sortableSectionProps}
          />
        </div>
      </aside>
      <MediaPickerDialog
        open={showMediaPicker}
        selectedUrl={element.properties.imageUrl}
        onOpenChange={setShowMediaPicker}
        onSelect={(url) =>
          propertyUpdates.updateProperty('imageUrl', url)
        }
      />
    </>
  );
}
