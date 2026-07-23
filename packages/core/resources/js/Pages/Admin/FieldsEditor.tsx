import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Save, Settings, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Textarea } from '@ui/textarea';
import { Switch } from '@ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';

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

interface PageConfig {
  name: string;
  rows: FieldRow[];
  type: string;
}

interface FieldsEditorProps {
  id: string;
}

export default function FieldsEditor({ id }: FieldsEditorProps) {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`page-${id}`);
      if (saved) {
        const config = JSON.parse(saved);
        setPageConfig(config);

        const savedValues = localStorage.getItem(`page-${id}-values`);
        if (savedValues) {
          setFieldValues(JSON.parse(savedValues));
        }
      }
    }
  }, [id]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleArrayFieldChange = (fieldName: string, index: number, value: string) => {
    const currentValues = fieldValues[fieldName] || [];
    const newValues = [...currentValues];
    newValues[index] = value;
    setFieldValues((prev) => ({ ...prev, [fieldName]: newValues }));
  };

  const addArrayItem = (fieldName: string, value: string = '') => {
    const currentValues = fieldValues[fieldName] || [];
    setFieldValues((prev) => ({ ...prev, [fieldName]: [...currentValues, value] }));
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    const currentValues = fieldValues[fieldName] || [];
    const newValues = currentValues.filter((_: any, i: number) => i !== index);
    setFieldValues((prev) => ({ ...prev, [fieldName]: newValues }));
  };

  const addRepeaterItem = (fieldName: string) => {
    const currentValues = fieldValues[fieldName] || [];
    setFieldValues((prev) => ({ ...prev, [fieldName]: [...currentValues, {}] }));
  };

  const updateRepeaterItem = (
    fieldName: string,
    index: number,
    subFieldName: string,
    value: any
  ) => {
    const currentValues = fieldValues[fieldName] || [];
    const newValues = [...currentValues];
    newValues[index] = { ...newValues[index], [subFieldName]: value };
    setFieldValues((prev) => ({ ...prev, [fieldName]: newValues }));
  };

  const removeRepeaterItem = (fieldName: string, index: number) => {
    const currentValues = fieldValues[fieldName] || [];
    const newValues = currentValues.filter((_: any, i: number) => i !== index);
    setFieldValues((prev) => ({ ...prev, [fieldName]: newValues }));
  };

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    const currentValues = fieldValues[fieldName] || [];
    if (checked) {
      setFieldValues((prev) => ({ ...prev, [fieldName]: [...currentValues, option] }));
    } else {
      setFieldValues((prev) => ({
        ...prev,
        [fieldName]: currentValues.filter((v: string) => v !== option),
      }));
    }
  };

  const handleSave = () => {
    if (id) {
      localStorage.setItem(`page-${id}-values`, JSON.stringify(fieldValues));
      router.visit('/admin/content');
    }
  };

  const handleEditFields = () => {
    router.visit(`/admin/fields-builder?page=${id}`);
  };

  if (!pageConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const renderField = (field: CustomField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.name}
            value={fieldValues[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={fieldValues[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-none"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={5}
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id={field.name}
                value={fieldValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
                placeholder="Enter image URL or upload"
              />
              <Button
                variant="outline"
                className="gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
            {fieldValues[field.name] && (
              <div className="relative">
                <ImageWithFallback
                  src={fieldValues[field.name]}
                  alt={field.label}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldChange(field.name, '')}
                  className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'image-gallery':
        const galleryImages = fieldValues[field.name] || [];
        return (
          <div className="space-y-3">
            {galleryImages.map((imageUrl: string, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => handleArrayFieldChange(field.name, index, e.target.value)}
                    className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
                    placeholder={`Image ${index + 1} URL`}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => removeArrayItem(field.name, index)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {imageUrl && (
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`${field.label} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                )}
              </div>
            ))}
            <Button
              onClick={() => addArrayItem(field.name)}
              variant="outline"
              className="w-full gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
              Add Image
            </Button>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-3">
                <input
                  type="radio"
                  id={`${field.name}-${option}`}
                  name={field.name}
                  value={option}
                  checked={fieldValues[field.name] === option}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600"
                />
                <Label
                  htmlFor={`${field.name}-${option}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        const checkedValues = fieldValues[field.name] || [];
        return (
          <div className="space-y-3">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${field.name}-${option}`}
                  checked={checkedValues.includes(option)}
                  onChange={(e) => handleCheckboxChange(field.name, option, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600"
                />
                <Label
                  htmlFor={`${field.name}-${option}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'repeater':
        const repeaterItems = fieldValues[field.name] || [];
        return (
          <div className="space-y-4">
            {repeaterItems.map((item: any, index: number) => (
              <Card
                key={index}
                className="border-2 border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm dark:text-white">
                      Item {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRepeaterItem(field.name, index)}
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {field.repeaterFields?.map((subField) => (
                    <div key={subField.id} className="space-y-2">
                      <Label className="text-xs text-gray-700 dark:text-gray-300">
                        {subField.label}
                      </Label>
                      {subField.type === 'text' && (
                        <Input
                          value={item[subField.name] || ''}
                          onChange={(e) =>
                            updateRepeaterItem(field.name, index, subField.name, e.target.value)
                          }
                          className="h-10 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl"
                        />
                      )}
                      {subField.type === 'textarea' && (
                        <Textarea
                          value={item[subField.name] || ''}
                          onChange={(e) =>
                            updateRepeaterItem(field.name, index, subField.name, e.target.value)
                          }
                          className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl resize-none"
                          rows={3}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={() => addRepeaterItem(field.name)}
              variant="outline"
              className="w-full gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit('/admin/content')}
              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-gray-900 dark:text-white mb-1">{pageConfig.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fill in the custom fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditFields}
              className="gap-2 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Settings className="w-4 h-4" />
              Edit Fields
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {pageConfig.rows.map((row) => (
            <Card
              key={row.id}
              className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900"
            >
              <CardContent className="p-6">
                <div
                  className={`grid gap-6 ${
                    row.columns === '2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {row.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label
                        htmlFor={field.name}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
