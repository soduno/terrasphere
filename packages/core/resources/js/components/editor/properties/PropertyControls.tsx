import { Lock, Unlock } from 'lucide-react';
import type {
  PropertyColorProps,
  PropertyRangeProps,
  SpacingControlProps,
} from '../../../types/editor';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Slider } from '../../ui/slider';

export function PropertyRange({
  id,
  label,
  value,
  displayValue = `${value}px`,
  min,
  max,
  step,
  onChange,
}: PropertyRangeProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label htmlFor={id} className="text-xs text-gray-700 dark:text-gray-300">
          {label}
        </Label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {displayValue}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => onChange(nextValue)}
      />
    </div>
  );
}

export function PropertyColor({
  id,
  label,
  value,
  pickerValue = value,
  placeholder,
  onChange,
}: PropertyColorProps) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-2 block text-xs text-gray-700 dark:text-gray-300"
      >
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-16 cursor-pointer rounded-lg border-gray-200 p-1 dark:border-gray-700"
        />
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 flex-1 rounded-lg border-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
}

export function SpacingControl({
  kind,
  properties,
  defaultValue,
  onChange,
}: SpacingControlProps) {
  const isPadding = kind === 'padding';
  const linked = isPadding
    ? properties.paddingLinked !== false
    : properties.marginLinked !== false;
  const baseKey = isPadding ? 'padding' : 'margin';
  const linkedKey = isPadding ? 'paddingLinked' : 'marginLinked';
  const baseValue = Number.parseInt(
    properties[baseKey] || defaultValue.toString(),
    10,
  );
  const sides = [
    { label: 'Top', key: isPadding ? 'paddingTop' : 'marginTop' },
    { label: 'Right', key: isPadding ? 'paddingRight' : 'marginRight' },
    { label: 'Bottom', key: isPadding ? 'paddingBottom' : 'marginBottom' },
    { label: 'Left', key: isPadding ? 'paddingLeft' : 'marginLeft' },
  ] as const;

  const setAllSides = (value: number) => {
    const stringValue = value.toString();
    onChange({
      [baseKey]: stringValue,
      [sides[0].key]: stringValue,
      [sides[1].key]: stringValue,
      [sides[2].key]: stringValue,
      [sides[3].key]: stringValue,
    });
  };

  const toggleLinked = () => {
    if (linked) {
      onChange({
        [linkedKey]: false,
        [sides[0].key]: (properties[sides[0].key] as string | undefined) ?? baseValue.toString(),
        [sides[1].key]: (properties[sides[1].key] as string | undefined) ?? baseValue.toString(),
        [sides[2].key]: (properties[sides[2].key] as string | undefined) ?? baseValue.toString(),
        [sides[3].key]: (properties[sides[3].key] as string | undefined) ?? baseValue.toString(),
      });
      return;
    }

    onChange({ [linkedKey]: true, [baseKey]: baseValue.toString() });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-xs capitalize text-gray-700 dark:text-gray-300">
          {kind}
        </Label>
        <button
          type="button"
          onClick={toggleLinked}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
            linked
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {linked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          {linked ? 'Linked' : 'Unlinked'}
        </button>
      </div>

      {linked ? (
        <PropertyRange
          id={`${kind}-all`}
          label="All sides"
          value={baseValue}
          min={0}
          max={100}
          step={4}
          onChange={setAllSides}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sides.map(({ label, key }) => (
            <PropertyRange
              key={key}
              id={`${kind}-${label.toLowerCase()}`}
              label={label}
              value={Number.parseInt(
                (properties[key] as string | undefined) ?? baseValue.toString(),
                10,
              )}
              min={0}
              max={100}
              step={4}
              onChange={(value) => onChange({ [key]: value.toString() })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
