import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowLeft, Save, Columns2, Columns3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'image-gallery' | 'radio' | 'checkbox' | 'repeater';
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

export function FieldsBuilder() {
  const navigate = useNavigate();
  const [pageName, setPageName] = useState('');
  const [rows, setRows] = useState<FieldRow[]>([]);

  const addRow = (columns: '1' | '2') => {
    const newRow: FieldRow = {
      id: `row-${Date.now()}`,
      columns,
      fields: [],
    };
    setRows([...rows, newRow]);
  };

  const addFieldToRow = (rowId: string) => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      columnSpan: '1',
    };
    setRows(
      rows.map((row) =>
        row.id === rowId ? { ...row, fields: [...row.fields, newField] } : row
      )
    );
  };

  const updateField = (rowId: string, fieldId: string, updates: Partial<CustomField>) => {
    setRows(
      rows.map((row) =>
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
    setRows(
      rows.map((row) =>
        row.id === rowId
          ? { ...row, fields: row.fields.filter((field) => field.id !== fieldId) }
          : row
      )
    );
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter((row) => row.id !== rowId));
  };

  const updateRowColumns = (rowId: string, columns: '1' | '2') => {
    setRows(rows.map((row) => (row.id === rowId ? { ...row, columns } : row)));
  };

  const addOptionToField = (rowId: string, fieldId: string) => {
    setRows(
      rows.map((row) =>
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
    setRows(
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId
                  ? {
                      ...field,
                      options: field.options?.map((opt, idx) =>
                        idx === optionIndex ? value : opt
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
    setRows(
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              fields: row.fields.map((field) =>
                field.id === fieldId
                  ? {
                      ...field,
                      options: field.options?.filter((_, idx) => idx !== optionIndex),
                    }
                  : field
              ),
            }
          : row
      )
    );
  };

  const handleSave = () => {
    const pageId = Date.now();
    localStorage.setItem(
      `page-${pageId}`,
      JSON.stringify({ name: pageName, rows, type: 'custom-fields' })
    );
    navigate(`/fields-editor/${pageId}`);
  };

  const totalFields = rows.reduce((acc, row) => acc + row.fields.length, 0);

  return (
    <div className="p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/content')}
              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-gray-900 dark:text-white mb-1">Build Custom Fields</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define the fields and layout for your page
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!pageName || totalFields === 0}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            Save & Continue
          </Button>
        </div>

        {/* Page Name */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900 mb-6">
          <CardHeader>
            <CardTitle className="dark:text-white">Page Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="pageName" className="text-sm text-gray-700 dark:text-gray-300">
                Page Name
              </Label>
              <Input
                id="pageName"
                placeholder="e.g., Blog Post, Product, Team Member"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Builder */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Field Layout</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Add rows and organize your fields
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => addRow('1')}
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Columns2 className="w-4 h-4" />
                  1 Column
                </Button>
                <Button
                  onClick={() => addRow('2')}
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Columns3 className="w-4 h-4" />
                  2 Columns
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No rows added yet</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => addRow('1')}
                    variant="outline"
                    className="gap-2 rounded-xl dark:border-gray-700"
                  >
                    <Columns2 className="w-4 h-4" />
                    Add 1 Column Row
                  </Button>
                  <Button
                    onClick={() => addRow('2')}
                    variant="outline"
                    className="gap-2 rounded-xl dark:border-gray-700"
                  >
                    <Columns3 className="w-4 h-4" />
                    Add 2 Column Row
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Row {rowIndex + 1}
                        </span>
                        <Select
                          value={row.columns}
                          onValueChange={(value: '1' | '2') => updateRowColumns(row.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-9 dark:bg-gray-800 dark:border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="1">1 Column</SelectItem>
                            <SelectItem value="2">2 Columns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => addFieldToRow(row.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Field
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRow(row.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {row.fields.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          No fields in this row
                        </p>
                        <Button
                          onClick={() => addFieldToRow(row.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 rounded-lg dark:border-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Field
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`grid gap-4 ${
                          row.columns === '2' ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {row.fields.map((field) => (
                          <FieldConfigurator
                            key={field.id}
                            field={field}
                            rowId={row.id}
                            onUpdate={updateField}
                            onDelete={deleteField}
                            onAddOption={addOptionToField}
                            onUpdateOption={updateOption}
                            onRemoveOption={removeOption}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface FieldConfiguratorProps {
  field: CustomField;
  rowId: string;
  onUpdate: (rowId: string, fieldId: string, updates: Partial<CustomField>) => void;
  onDelete: (rowId: string, fieldId: string) => void;
  onAddOption: (rowId: string, fieldId: string) => void;
  onUpdateOption: (rowId: string, fieldId: string, optionIndex: number, value: string) => void;
  onRemoveOption: (rowId: string, fieldId: string, optionIndex: number) => void;
}

function FieldConfigurator({
  field,
  rowId,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FieldConfiguratorProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Label className="text-xs text-gray-600 dark:text-gray-400">Field Configuration</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rowId, field.id)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate(rowId, field.id, { label: e.target.value })}
            placeholder="Field Label"
            className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">Field Name</Label>
          <Input
            value={field.name}
            onChange={(e) =>
              onUpdate(rowId, field.id, {
                name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
              })
            }
            placeholder="field_name"
            className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">Type</Label>
          <Select
            value={field.type}
            onValueChange={(value: any) => onUpdate(rowId, field.id, { type: value })}
          >
            <SelectTrigger className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="image">Image Upload</SelectItem>
              <SelectItem value="image-gallery">Multiple Images</SelectItem>
              <SelectItem value="radio">Radio Buttons</SelectItem>
              <SelectItem value="checkbox">Checkboxes</SelectItem>
              <SelectItem value="repeater">Repeater</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(field.type === 'radio' || field.type === 'checkbox') && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">Options</Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => onUpdateOption(rowId, field.id, index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="h-8 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOption(rowId, field.id, index)}
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => onAddOption(rowId, field.id)}
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs rounded-lg dark:border-gray-700"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => onUpdate(rowId, field.id, { required: e.target.checked })}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <Label
            htmlFor={`required-${field.id}`}
            className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            Required field
          </Label>
        </div>
      </div>
    </div>
  );
}
