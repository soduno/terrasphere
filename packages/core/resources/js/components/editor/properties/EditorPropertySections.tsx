import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Images,
  Minus,
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
  onPropertyChange,
  onPropertiesChange,
  onChooseImage,
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
  onPropertyChange: EditorPropertySectionsProps['onPropertyChange'];
  sectionProps: ReturnType<
    EditorPropertySectionsProps['sortableSectionProps']
  >;
};

function ImageSection({
  properties,
  onChooseImage,
  onPropertyChange,
  sectionProps,
}: ImageSectionProps) {
  const height = !properties.imageHeight || properties.imageHeight === 'auto'
    ? 0
    : Number.parseInt(properties.imageHeight, 10);

  return (
    <PropertySection title="Image" defaultOpen {...sectionProps}>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          {properties.imageUrl ? (
            <img
              src={properties.imageUrl}
              alt=""
              className="aspect-video w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center text-gray-400">
              <Images className="size-6" />
              <span className="mt-2 text-xs">No image selected</span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onChooseImage}
          className="w-full gap-2 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
        >
          <Images className="size-4" />
          {properties.imageUrl ? 'Replace from Media' : 'Choose from Media'}
        </Button>
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
