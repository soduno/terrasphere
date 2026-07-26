import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  AlignLeft,
  ArrowLeft,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Columns2,
  Columns3,
  Image,
  Images,
  LayoutPanelTop,
  Plus,
  Repeat2,
  Save,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';

type FieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'image-gallery'
  | 'radio'
  | 'checkbox'
  | 'repeater';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  repeaterFields?: Omit<CustomField, 'repeaterFields'>[];
  columnSpan?: '1' | '2';
}

interface FieldRow {
  id: string;
  columns: '1' | '2';
  fields: CustomField[];
}

interface FieldsBuilderProps {
  page: {
    id: number;
    title: string;
    slug: string;
    rows: FieldRow[];
  };
  errors?: {
    slug?: string;
  };
}

const fieldTypes = [
  {
    type: 'text' as const,
    label: 'Short text',
    description: 'Names, titles and short answers',
    icon: Type,
  },
  {
    type: 'textarea' as const,
    label: 'Long text',
    description: 'Descriptions and longer content',
    icon: AlignLeft,
  },
  {
    type: 'image' as const,
    label: 'Image',
    description: 'A single image or media asset',
    icon: Image,
  },
  {
    type: 'image-gallery' as const,
    label: 'Gallery',
    description: 'A collection of images',
    icon: Images,
  },
  {
    type: 'radio' as const,
    label: 'Single choice',
    description: 'Choose one option from a list',
    icon: CircleDot,
  },
  {
    type: 'checkbox' as const,
    label: 'Multiple choice',
    description: 'Choose several options',
    icon: CheckSquare,
  },
  {
    type: 'repeater' as const,
    label: 'Repeater',
    description: 'A repeatable group of fields',
    icon: Repeat2,
  },
];

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

export default function FieldsBuilder({ page, errors = {} }: FieldsBuilderProps) {
  const [pageName, setPageName] = useState(page.title);
  const [modelSlug, setModelSlug] = useState(page.slug);
  const [rows, setRows] = useState<FieldRow[]>(page.rows);
  const [fieldPickerRowId, setFieldPickerRowId] = useState<string | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const addRow = (columns: '1' | '2') => {
    const newRow: FieldRow = {
      id: `row-${Date.now()}`,
      columns,
      fields: [],
    };

    setRows((currentRows) => [...currentRows, newRow]);
    setFieldPickerRowId(newRow.id);
  };

  const addFieldToRow = (rowId: string, type: FieldType) => {
    const fieldType = fieldTypes.find((item) => item.type === type);
    const timestamp = Date.now();
    const newField: CustomField = {
      id: `field-${timestamp}`,
      name: `field_${timestamp}`,
      label: fieldType?.label || 'New field',
      type,
      required: false,
      columnSpan: '1',
      options: type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
      repeaterFields: type === 'repeater' ? [] : undefined,
    };

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, fields: [...row.fields, newField] } : row
      )
    );
    setFieldPickerRowId(null);
    setExpandedFieldId(newField.id);
  };

  const updateField = (rowId: string, fieldId: string, updates: Partial<CustomField>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
            }
          : row
      )
    );
  };

  const deleteField = (rowId: string, fieldId: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? { ...row, fields: row.fields.filter((field) => field.id !== fieldId) }
          : row
      )
    );
    setExpandedFieldId((currentFieldId) =>
      currentFieldId === fieldId ? null : currentFieldId
    );
  };

  const deleteRow = (rowId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    setFieldPickerRowId((currentRowId) => currentRowId === rowId ? null : currentRowId);
  };

  const updateRowColumns = (rowId: string, columns: '1' | '2') => {
    setRows((currentRows) =>
      currentRows.map((row) => row.id === rowId ? { ...row, columns } : row)
    );
  };

  const addOptionToField = (rowId: string, fieldId: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId
                  ? { ...field, options: [...(field.options || []), ''] }
                  : field
              ),
            }
          : row
      )
    );
  };

  const updateOption = (
    rowId: string,
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId
                  ? {
                      ...field,
                      options: field.options?.map((option, index) =>
                        index === optionIndex ? value : option
                      ),
                    }
                  : field
              ),
            }
          : row
      )
    );
  };

  const removeOption = (rowId: string, fieldId: string, optionIndex: number) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId
                  ? {
                      ...field,
                      options: field.options?.filter((_, index) => index !== optionIndex),
                    }
                  : field
              ),
            }
          : row
      )
    );
  };

  const handleSave = () => {
    api.put(
      `/admin/pages/${page.id}/field-schema`,
      {
        title: pageName,
        slug: modelSlug,
        rows: rows as any,
      },
      { inertia: true },
    );
  };

  const totalFields = rows.reduce((total, row) => total + row.fields.length, 0);

  return (
    <div className="min-h-full bg-gray-50/70 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 px-6 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit('/admin/content')}
              className="h-10 w-10 shrink-0 rounded-xl p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Back to content"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-gray-950 dark:text-white">
                  Field structure
                </h1>
                <span className="hidden rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 sm:inline-flex">
                  {pageName || 'Untitled model'}
                </span>
              </div>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                Build the form editors will use to create this content.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!pageName || !modelSlug || totalFields === 0}
            className="h-10 gap-2 rounded-xl bg-indigo-600 px-5 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 dark:bg-indigo-600 dark:text-blue-300 dark:hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            Save & continue
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-7 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Model details</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name this content structure</p>
              </div>
            </div>

            <Label htmlFor="pageName" className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Model name
            </Label>
            <Input
              id="pageName"
              placeholder="Article, Product, Team member…"
              value={pageName}
              onChange={(event) => setPageName(event.target.value)}
              className="h-10 rounded-xl border-gray-200 bg-gray-50/70 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <Label htmlFor="modelSlug" className="mb-2 mt-4 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Model slug
            </Label>
            <Input
              id="modelSlug"
              placeholder="blog-post"
              value={modelSlug}
              onChange={(event) => setModelSlug(normalizeSlug(event.target.value))}
              onBlur={() => setModelSlug((slug) => slug.replace(/^-+|-+$/g, ''))}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? 'modelSlugError' : 'modelSlugHelp'}
              className="h-10 rounded-xl border-gray-200 bg-gray-50/70 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.slug ? (
              <p id="modelSlugError" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.slug}
              </p>
            ) : (
              <p id="modelSlugHelp" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Unique identifier using lowercase letters, numbers, and hyphens.
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                <p className="text-xl font-semibold text-gray-950 dark:text-white">{totalFields}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fields</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                <p className="text-xl font-semibold text-gray-950 dark:text-white">{rows.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sections</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Add a section</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Sections control how fields are arranged in the editing form.
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => addRow('1')}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <Columns2 className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Full width</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">One field per row</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => addRow('2')}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <Columns3 className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Two columns</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Compact side-by-side fields</span>
                </span>
              </button>
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          {rows.length === 0 ? (
            <EmptyBuilder onAddRow={addRow} />
          ) : (
            <div className="space-y-5">
              {rows.map((row, rowIndex) => (
                <section
                  key={row.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {rowIndex + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
                          Section {rowIndex + 1}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {row.fields.length} {row.fields.length === 1 ? 'field' : 'fields'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:inline">
                          Section layout
                        </span>
                        <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                          <button
                            type="button"
                            onClick={() => updateRowColumns(row.id, '1')}
                            aria-label="Use one column in this section"
                            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                              row.columns === '1'
                                ? 'bg-white text-gray-950 shadow-sm dark:bg-gray-700 dark:text-white'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                            }`}
                          >
                            <Columns2 className="h-3.5 w-3.5" />
                            1 column
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRowColumns(row.id, '2')}
                            aria-label="Use two columns in this section"
                            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                              row.columns === '2'
                                ? 'bg-white text-gray-950 shadow-sm dark:bg-gray-700 dark:text-white'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                            }`}
                          >
                            <Columns3 className="h-3.5 w-3.5" />
                            2 columns
                          </button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRow(row.id)}
                        className="h-9 w-9 rounded-xl p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        aria-label={`Delete section ${rowIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 p-4 dark:bg-gray-950/30">
                    <div className={`grid items-start gap-3 ${
                      row.columns === '2' ? 'md:grid-cols-2' : 'grid-cols-1'
                    }`}>
                      {row.fields.map((field, fieldIndex) => (
                        <FieldConfigurator
                          key={field.id}
                          field={field}
                          fieldIndex={fieldIndex}
                          rowId={row.id}
                          expanded={expandedFieldId === field.id}
                          onToggle={() =>
                            setExpandedFieldId((currentFieldId) =>
                              currentFieldId === field.id ? null : field.id
                            )
                          }
                          onUpdate={updateField}
                          onDelete={deleteField}
                          onAddOption={addOptionToField}
                          onUpdateOption={updateOption}
                          onRemoveOption={removeOption}
                        />
                      ))}

                      {fieldPickerRowId !== row.id && (
                        <button
                          type="button"
                          onClick={() => setFieldPickerRowId(row.id)}
                          className="flex min-h-[66px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-300 bg-white/70 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-900/60 dark:text-indigo-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                            <Plus className="h-4 w-4" />
                          </span>
                          Add field
                        </button>
                      )}
                    </div>

                    {fieldPickerRowId === row.id && (
                      <FieldTypePicker
                        onSelect={(type) => addFieldToRow(row.id, type)}
                        onClose={() => setFieldPickerRowId(null)}
                      />
                    )}
                  </div>
                </section>
              ))}

              <button
                type="button"
                onClick={() => addRow('1')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-transparent py-4 text-sm font-medium text-gray-500 transition hover:border-indigo-400 hover:bg-white hover:text-indigo-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-gray-900 dark:hover:text-indigo-300"
              >
                <Plus className="h-4 w-4" />
                New section
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyBuilder({ onAddRow }: { onAddRow: (columns: '1' | '2') => void }) {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <LayoutPanelTop className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
        Create your first section
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
        Start with a full-width section for long content, or two columns for compact metadata.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => onAddRow('1')}
          className="gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-blue-300"
        >
          <Columns2 className="h-4 w-4" />
          Full width
        </Button>
        <Button
          onClick={() => onAddRow('2')}
          variant="outline"
          className="gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800"
        >
          <Columns3 className="h-4 w-4" />
          Two columns
        </Button>
      </div>
    </div>
  );
}

function FieldTypePicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: FieldType) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-500/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-950 dark:text-white">Choose a field type</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">You can change it later.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 rounded-lg px-2.5 text-xs text-gray-500"
        >
          Cancel
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {fieldTypes.map((fieldType) => {
          const Icon = fieldType.icon;

          return (
            <button
              key={fieldType.type}
              type="button"
              onClick={() => onSelect(fieldType.type)}
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {fieldType.label}
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-gray-500 dark:text-gray-400">
                  {fieldType.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FieldConfiguratorProps {
  field: CustomField;
  fieldIndex: number;
  rowId: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (rowId: string, fieldId: string, updates: Partial<CustomField>) => void;
  onDelete: (rowId: string, fieldId: string) => void;
  onAddOption: (rowId: string, fieldId: string) => void;
  onUpdateOption: (rowId: string, fieldId: string, optionIndex: number, value: string) => void;
  onRemoveOption: (rowId: string, fieldId: string, optionIndex: number) => void;
}

function FieldConfigurator({
  field,
  fieldIndex,
  rowId,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FieldConfiguratorProps) {
  const fieldType = fieldTypes.find((item) => item.type === field.type) || fieldTypes[0];
  const Icon = fieldType.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-300">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-gray-950 dark:text-white">
                {field.label || 'Untitled field'}
              </span>
              {field.required && (
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Required
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              Field {fieldIndex + 1} · {fieldType.label} · API: {field.name}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${
          expanded ? 'rotate-180' : ''
        }`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Label
              </Label>
              <Input
                value={field.label}
                onChange={(event) => onUpdate(rowId, field.id, { label: event.target.value })}
                placeholder="Field label"
                className="h-10 rounded-xl border-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <Label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                API key
              </Label>
              <Input
                value={field.name}
                onChange={(event) =>
                  onUpdate(rowId, field.id, {
                    name: event.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
                  })
                }
                placeholder="field_name"
                className="h-10 rounded-xl border-gray-200 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Field type
            </Label>
            <Select
              value={field.type}
              onValueChange={(value: FieldType) => onUpdate(rowId, field.id, { type: value })}
            >
              <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                {fieldTypes.map((type) => (
                  <SelectItem key={type.type} value={type.type}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(field.type === 'radio' || field.type === 'checkbox') && (
            <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Options</Label>
                <button
                  type="button"
                  onClick={() => onAddOption(rowId, field.id)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs text-gray-400">{index + 1}</span>
                    <Input
                      value={option}
                      onChange={(event) =>
                        onUpdateOption(rowId, field.id, index, event.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="h-9 rounded-lg border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOption(rowId, field.id, index)}
                      className="h-8 w-8 shrink-0 rounded-lg p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              role="switch"
              aria-checked={field.required}
              onClick={() => onUpdate(rowId, field.id, { required: !field.required })}
              className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300"
            >
              <span className={`relative h-5 w-9 rounded-full transition ${
                field.required ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  field.required ? 'left-[18px]' : 'left-0.5'
                }`} />
              </span>
              Required field
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rowId, field.id)}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
