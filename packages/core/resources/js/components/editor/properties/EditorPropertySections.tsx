import { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Images,
  Minus,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type {
  EditorElementProperties,
  EditorPropertySectionsProps,
} from '../../../types/editor';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import {
  PropertyColor,
  PropertyRange,
  SpacingControl,
} from './PropertyControls';
import { PropertySection } from './PropertySection';

type Choice<Value extends string> = {
  value: Value;
  label: string;
  icon?: LucideIcon;
};

type ChoiceControlProps<Value extends string> = {
  value: Value;
  choices: readonly Choice<Value>[];
  onChange: (value: Value) => void;
};

function ChoiceControl<Value extends string>({
  value,
  choices,
  onChange,
}: ChoiceControlProps<Value>) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {choices.map(({ value: choiceValue, label, icon: Icon }) => {
        const isActive = value === choiceValue;

        return (
          <button
            key={choiceValue}
            type="button"
            onClick={() => onChange(choiceValue)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs capitalize transition-colors ${
              isActive
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            aria-pressed={isActive}
          >
            {Icon && <Icon className="size-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

const horizontalChoices = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
] as const;

const verticalChoices = [
  { value: 'top', label: 'Top', icon: ChevronUp },
  { value: 'center', label: 'Middle', icon: Minus },
  { value: 'bottom', label: 'Bottom', icon: ChevronDown },
] as const;

const floatChoices = [
  { value: 'none', label: 'None' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
] as const;

export function EditorPropertySections({
  element,
  selectedGridColumnIndex,
  selectedGridColumnProperties,
  onSelectedGridColumnPropertiesChange,
  onPropertyChange,
  onPropertiesChange,
  onChooseImage,
  onUploadImage,
  isUploadingImage,
  imageUploadError,
  sortableSectionProps,
}: EditorPropertySectionsProps) {
  const { properties } = element;
  const isText =
    element.type === 'heading'
    || element.type === 'text'
    || element.type === 'wysiwyg';
  const isLayout = element.type === 'flex' || element.type === 'grid';
  const horizontalAlignment =
    properties.contentAlign
    ?? (isText ? properties.textAlign : undefined)
    ?? (element.type === 'image' ? properties.imageAlign : undefined)
    ?? (element.type === 'calendar' ? 'center' : 'left');

  if (
    element.type === 'grid'
    && selectedGridColumnIndex !== undefined
    && selectedGridColumnProperties
    && onSelectedGridColumnPropertiesChange
  ) {
    return (
      <div className="flex flex-col gap-3">
        <div className="order-[-1]">
          <Label className="mb-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            Selected
          </Label>
          <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/10 dark:ring-indigo-500/20">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              Grid column {selectedGridColumnIndex + 1}
            </p>
            <p className="mt-0.5 text-[11px] text-indigo-600/80 dark:text-indigo-300/70">
              Settings apply only to this column
            </p>
          </div>
        </div>

        <PropertySection
          title="Spacing"
          defaultOpen
          {...sortableSectionProps('spacing')}
        >
          <div className="space-y-4">
            <SpacingControl
              kind="padding"
              properties={selectedGridColumnProperties}
              defaultValue={12}
              onChange={onSelectedGridColumnPropertiesChange}
            />
            <SpacingControl
              kind="margin"
              properties={selectedGridColumnProperties}
              defaultValue={0}
              onChange={onSelectedGridColumnPropertiesChange}
            />
          </div>
        </PropertySection>

        <PropertySection
          title="Alignment"
          defaultOpen
          {...sortableSectionProps('vertical-alignment')}
        >
          <div className="space-y-3">
            <ChoiceControl
              value={selectedGridColumnProperties.verticalAlign ?? 'top'}
              choices={verticalChoices}
              onChange={(verticalAlign) =>
                onSelectedGridColumnPropertiesChange({ verticalAlign })
              }
            />
            <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
              Position the content vertically inside this grid column.
            </p>
          </div>
        </PropertySection>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="order-[-1]">
        <Label className="mb-2 text-xs uppercase text-gray-500 dark:text-gray-400">
          Element
        </Label>
        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-sm capitalize text-gray-900 dark:text-white">
            {element.type.replace('-', ' ')}
          </p>
        </div>
      </div>

      <PropertySection
        title="Spacing"
        defaultOpen
        {...sortableSectionProps('spacing')}
      >
        <div className="space-y-4">
          <SpacingControl
            kind="padding"
            properties={properties}
            defaultValue={0}
            onChange={onPropertiesChange}
          />
          <SpacingControl
            kind="margin"
            properties={properties}
            defaultValue={0}
            onChange={onPropertiesChange}
          />
        </div>
      </PropertySection>

      {!isLayout && (
        <>
          <PropertySection
            title="Horizontal alignment"
            {...sortableSectionProps('horizontal-alignment')}
          >
            <div className="space-y-3">
              <ChoiceControl
                value={horizontalAlignment}
                choices={horizontalChoices}
                onChange={(value) =>
                  onPropertyChange('contentAlign', value)
                }
              />
              <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                Position this element within its container without wrapping
                nearby content.
              </p>
            </div>
          </PropertySection>
          <PropertySection
            title="Vertical alignment"
            {...sortableSectionProps('vertical-alignment')}
          >
            <div className="space-y-3">
              <ChoiceControl
                value={properties.verticalAlign || 'top'}
                choices={verticalChoices}
                onChange={(value) =>
                  onPropertyChange('verticalAlign', value)
                }
              />
              <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                Position this element vertically within the available height.
              </p>
            </div>
          </PropertySection>
        </>
      )}

      {isLayout && (
        <PropertySection
          title="Layout"
          {...sortableSectionProps('layout')}
        >
          <PropertyRange
            id="columnGap"
            label={element.type === 'flex' ? 'Gap' : 'Column Gap'}
            value={Number.parseInt(properties.columnGap || '20', 10)}
            min={0}
            max={60}
            step={5}
            onChange={(value) =>
              onPropertyChange('columnGap', value.toString())
            }
          />
        </PropertySection>
      )}

      {isText && (
        <PropertySection
          title="Typography"
          {...sortableSectionProps('typography')}
        >
          <div className="space-y-4">
            <PropertyRange
              id="fontSize"
              label="Font Size"
              value={Number.parseInt(properties.fontSize || '16', 10)}
              min={12}
              max={72}
              step={2}
              onChange={(value) =>
                onPropertyChange('fontSize', value.toString())
              }
            />
            <PropertyColor
              id="color"
              label="Text Color"
              value={properties.color || '#000000'}
              onChange={(value) => onPropertyChange('color', value)}
            />
          </div>
        </PropertySection>
      )}

      <PropertySection
        title="Appearance"
        {...sortableSectionProps('appearance')}
      >
        <div className="space-y-4">
          <PropertyColor
            id="backgroundColor"
            label="Background"
            value={properties.backgroundColor || 'transparent'}
            pickerValue={
              properties.backgroundColor === 'transparent'
                ? '#ffffff'
                : properties.backgroundColor || '#ffffff'
            }
            placeholder="transparent"
            onChange={(value) =>
              onPropertyChange('backgroundColor', value)
            }
          />
          <PropertyRange
            id="borderRadius"
            label="Border Radius"
            value={Number.parseInt(properties.borderRadius || '0', 10)}
            min={0}
            max={50}
            step={2}
            onChange={(value) =>
              onPropertyChange('borderRadius', value.toString())
            }
          />
        </div>
      </PropertySection>

      {element.type === 'image' && (
        <ImageSection
          properties={properties}
          onChooseImage={onChooseImage}
          onUploadImage={onUploadImage}
          isUploadingImage={isUploadingImage}
          imageUploadError={imageUploadError}
          onPropertyChange={onPropertyChange}
          sectionProps={sortableSectionProps('image')}
        />
      )}

      <PropertySection title="Float" {...sortableSectionProps('float')}>
        <div className="space-y-2">
          <ChoiceControl
            value={properties.float || 'none'}
            choices={floatChoices}
            onChange={(value) => onPropertyChange('float', value)}
          />
          <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            Float content left or right and let following content wrap around
            it.
          </p>
        </div>
      </PropertySection>
    </div>
  );
}

type ImageSectionProps = {
  properties: EditorElementProperties;
  onChooseImage: () => void;
  onUploadImage?: (files: File[]) => Promise<void>;
  isUploadingImage?: boolean;
  imageUploadError?: string | null;
  onPropertyChange: EditorPropertySectionsProps['onPropertyChange'];
  sectionProps: ReturnType<
    EditorPropertySectionsProps['sortableSectionProps']
  >;
};

function ImageSection({
  properties,
  onChooseImage,
  onUploadImage,
  isUploadingImage = false,
  imageUploadError,
  onPropertyChange,
  sectionProps,
}: ImageSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const height = !properties.imageHeight || properties.imageHeight === 'auto'
    ? 0
    : Number.parseInt(properties.imageHeight, 10);
  const uploadFiles = async (files: FileList | File[]) => {
    if (!onUploadImage || isUploadingImage) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length === 0) return;

    await onUploadImage([imageFiles[0]]);
  };

  return (
    <PropertySection title="Image" defaultOpen {...sectionProps}>
      <div className="space-y-3">
        <div
          className={`overflow-hidden rounded-xl border bg-gray-50 transition-colors dark:bg-gray-800 ${
            isDraggingImage
              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/40'
              : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragEnter={(event) => {
            if (!onUploadImage) return;
            event.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragOver={(event) => {
            if (!onUploadImage) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setIsDraggingImage(false);
          }}
          onDrop={(event) => {
            if (!onUploadImage) return;
            event.preventDefault();
            event.stopPropagation();
            setIsDraggingImage(false);
            void uploadFiles(event.dataTransfer.files);
          }}
        >
          {properties.imageUrl ? (
            <img
              src={properties.imageUrl}
              alt=""
              className="aspect-video w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center text-gray-400">
              {isUploadingImage ? (
                <LoaderCircle className="size-6 animate-spin" />
              ) : (
                <Upload className="size-6" />
              )}
              <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {isUploadingImage ? 'Uploading image…' : 'Drop image here'}
              </span>
              <span className="mt-1 text-xs">No image selected</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={onChooseImage}
            className="w-full gap-2 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            <Images className="size-4" />
            {properties.imageUrl ? 'Replace from Media' : 'Choose from Media'}
          </Button>
          {onUploadImage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    void uploadFiles(event.target.files);
                  }
                  event.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2 rounded-lg"
              >
                {isUploadingImage ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload from computer
              </Button>
            </>
          )}
        </div>
        {imageUploadError && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {imageUploadError}
          </p>
        )}
        <Separator className="bg-gray-100 dark:bg-gray-800" />
        <div className="space-y-4">
          <Label className="text-xs uppercase text-gray-500 dark:text-gray-400">
            Proportions
          </Label>
          <PropertyRange
            id="imageWidth"
            label="Width"
            value={Number.parseInt(properties.imageWidth || '60', 10)}
            displayValue={`${Number.parseInt(properties.imageWidth || '60', 10)}%`}
            min={10}
            max={100}
            step={5}
            onChange={(value) =>
              onPropertyChange('imageWidth', `${value}%`)
            }
          />
          <PropertyRange
            id="imageHeight"
            label="Height"
            value={height}
            displayValue={height === 0 ? 'Auto' : `${height}px`}
            min={0}
            max={800}
            step={10}
            onChange={(value) =>
              onPropertyChange(
                'imageHeight',
                value === 0 ? 'auto' : `${value}px`,
              )
            }
          />
          <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            Use Auto height to preserve the image&apos;s natural aspect ratio.
          </p>
        </div>
      </div>
    </PropertySection>
  );
}
