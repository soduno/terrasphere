import { useState, type DragEvent } from 'react';
import { router } from '@inertiajs/react';
import {
  ArrowLeft,
  AlignLeft,
  CircleDot,
  Image as ImageIcon,
  Images,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  Rows3,
  Save,
  Settings,
  Trash2,
  Type,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Textarea } from '@ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';
import { MediaPickerDialog } from '@media/components/MediaPickerDialog';

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

const fieldIcons: Record<CustomField['type'], LucideIcon> = {
  text: Type,
  textarea: AlignLeft,
  image: ImageIcon,
  'image-gallery': Images,
  radio: CircleDot,
  checkbox: ListChecks,
  repeater: Rows3,
};

interface FieldRow {
  id: string;
  columns: '1' | '2';
  fields: CustomField[];
}

interface FieldsEditorProps {
  page: {
    id: number;
    title: string;
    rows: FieldRow[];
    values: Record<string, any>;
  };
}

interface MediaPickerTarget {
  fieldName: string;
  index?: number;
}

export default function FieldsEditor({ page }: FieldsEditorProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(page.values);
  const [pageTitle, setPageTitle] = useState(page.title);
  const [savedPageTitle, setSavedPageTitle] = useState(page.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaPickerTarget | null>(null);
  const [draggedMediaField, setDraggedMediaField] = useState<string | null>(null);
  const [uploadingMediaField, setUploadingMediaField] = useState<string | null>(null);
  const [mediaUploadErrors, setMediaUploadErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleArrayFieldChange = (fieldName: string, index: number, value: string) => {
    const currentValues = fieldValues[fieldName] || [];
    const newValues = [...currentValues];
    newValues[index] = value;
    setFieldValues((prev) => ({ ...prev, [fieldName]: newValues }));
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
    router.put(`/admin/pages/${page.id}/field-values`, {
      values: fieldValues,
    });
  };

  const handleEditFields = () => {
    router.visit(`/admin/fields-builder/${page.id}`);
  };

  const savePageTitle = () => {
    if (isSavingTitle) return;

    const title = pageTitle.trim();

    if (!title) {
      setTitleError('The page name cannot be empty.');
      return;
    }

    setIsEditingTitle(false);
    setTitleError(null);

    if (title === savedPageTitle) {
      setPageTitle(title);
      return;
    }

    setIsSavingTitle(true);
    router.patch(
      `/admin/pages/${page.id}/title`,
      { title },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setPageTitle(title);
          setSavedPageTitle(title);
        },
        onError: (errors) => {
          const message = Object.values(errors)[0];

          setTitleError(typeof message === 'string' ? message : 'The page name could not be saved.');
          setIsEditingTitle(true);
        },
        onFinish: () => setIsSavingTitle(false),
      },
    );
  };

  const handleMediaSelect = (url: string) => {
    if (!mediaPickerTarget) return;

    if (mediaPickerTarget.index === undefined) {
      handleFieldChange(mediaPickerTarget.fieldName, url);
    } else {
      handleArrayFieldChange(mediaPickerTarget.fieldName, mediaPickerTarget.index, url);
    }
  };

  const selectedMediaUrl = mediaPickerTarget
    ? mediaPickerTarget.index === undefined
      ? fieldValues[mediaPickerTarget.fieldName]
      : (fieldValues[mediaPickerTarget.fieldName] || [])[mediaPickerTarget.index]
    : undefined;

  const uploadImagesForField = async (
    fieldName: string,
    incomingFiles: FileList,
    multiple: boolean,
  ) => {
    const files = Array.from(incomingFiles)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, multiple ? 20 : 1);

    if (files.length === 0 || uploadingMediaField) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));
    const csrfToken = document
      .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.getAttribute('content') ?? '';

    setUploadingMediaField(fieldName);
    setMediaUploadErrors((current) => ({ ...current, [fieldName]: '' }));

    try {
      const response = await fetch('/admin/media', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'same-origin',
        body: formData,
      });
      const payload = await response.json() as {
        images?: Array<{ url: string }>;
        errors?: Record<string, string[]>;
        message?: string;
      };

      if (!response.ok || !payload.images) {
        const validationError = payload.errors
          ? Object.values(payload.errors).flat()[0]
          : undefined;
        throw new Error(validationError ?? payload.message ?? 'The images could not be uploaded.');
      }

      const uploadedUrls = payload.images.map((image) => image.url);
      setFieldValues((current) => ({
        ...current,
        [fieldName]: multiple
          ? [...(current[fieldName] || []), ...uploadedUrls]
          : uploadedUrls[0],
      }));
    } catch (reason) {
      setMediaUploadErrors((current) => ({
        ...current,
        [fieldName]: reason instanceof Error
          ? reason.message
          : 'The images could not be uploaded.',
      }));
    } finally {
      setUploadingMediaField(null);
    }
  };

  const handleImageDrop = (
    event: DragEvent<HTMLDivElement>,
    fieldName: string,
    multiple: boolean,
  ) => {
    event.preventDefault();
    setDraggedMediaField(null);
    void uploadImagesForField(fieldName, event.dataTransfer.files, multiple);
  };

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
        const imageUrl = fieldValues[field.name] || '';
        const isImageDragging = draggedMediaField === field.name;
        const isImageUploading = uploadingMediaField === field.name;
        return (
          <div
            className={`relative rounded-2xl transition-shadow ${
              isImageDragging ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-indigo-400 dark:ring-offset-gray-900' : ''
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDraggedMediaField(field.name);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDraggedMediaField(null);
              }
            }}
            onDrop={(event) => handleImageDrop(event, field.name, false)}
          >
            {imageUrl ? (
              <div className="flex flex-wrap gap-3">
                {isImageDragging && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/95 dark:border-indigo-400 dark:bg-gray-900/95">
                    <div className="text-center text-indigo-700 dark:text-indigo-300">
                      <UploadCloud className="mx-auto size-6" />
                      <p className="mt-2 text-sm font-medium">Drop image to replace it</p>
                    </div>
                  </div>
                )}

                <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-300/80 bg-white/70 p-1 shadow-sm sm:w-52 dark:border-gray-600/80 dark:bg-gray-800">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={field.label}
                    className="size-full rounded-lg bg-gray-100 object-contain dark:bg-gray-950"
                  />
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setMediaPickerTarget({ fieldName: field.name })}
                      className="size-8 rounded-lg border-white/60 bg-white/90 shadow-sm backdrop-blur hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:hover:bg-gray-900"
                      title="Replace from Media"
                      aria-label={`Replace ${field.label} from Media`}
                    >
                      <Images className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleFieldChange(field.name, '')}
                      className="size-8 rounded-lg border-white/60 bg-white/90 text-gray-500 shadow-sm backdrop-blur hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-400"
                      title="Remove image"
                      aria-label={`Remove ${field.label}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col items-center rounded-2xl border border-dashed px-6 py-8 text-center transition-colors ${
                isImageDragging
                  ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10'
                  : 'border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/40'
              }`}>
                <div className="flex size-11 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:text-indigo-300 dark:ring-gray-700">
                  {isImageUploading
                    ? <LoaderCircle className="size-5 animate-spin" />
                    : isImageDragging
                      ? <UploadCloud className="size-5" />
                      : <ImageIcon className="size-5" />}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                  {isImageUploading
                    ? 'Uploading image…'
                    : isImageDragging
                      ? 'Drop image to add it'
                      : 'No image selected'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Drop an image here or choose an existing image from Media.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setMediaPickerTarget({ fieldName: field.name })}
                  className="mt-4 gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700"
                >
                  <Images className="size-4" />
                  Choose from Media
                </Button>
              </div>
            )}
            {mediaUploadErrors[field.name] && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {mediaUploadErrors[field.name]}
              </p>
            )}
          </div>
        );

      case 'image-gallery':
        const galleryImages = fieldValues[field.name] || [];
        const isGalleryDragging = draggedMediaField === field.name;
        const isGalleryUploading = uploadingMediaField === field.name;
        return (
          <div
            className={`relative space-y-3 rounded-2xl transition-shadow ${
              isGalleryDragging ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-indigo-400 dark:ring-offset-gray-900' : ''
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDraggedMediaField(field.name);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDraggedMediaField(null);
              }
            }}
            onDrop={(event) => handleImageDrop(event, field.name, true)}
          >
            {galleryImages.length === 0 ? (
              <div className={`flex flex-col items-center rounded-2xl border border-dashed px-6 py-8 text-center transition-colors ${
                isGalleryDragging
                  ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10'
                  : 'border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/40'
              }`}>
                <div className="flex size-11 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:text-indigo-300 dark:ring-gray-700">
                  {isGalleryUploading
                    ? <LoaderCircle className="size-5 animate-spin" />
                    : isGalleryDragging
                      ? <UploadCloud className="size-5" />
                      : <Images className="size-5" />}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                  {isGalleryUploading
                    ? 'Uploading images…'
                    : isGalleryDragging
                      ? 'Drop images to add them'
                      : 'No images in this gallery'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Drop images here or choose an existing image from Media.
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setMediaPickerTarget({ fieldName: field.name, index: 0 })}
                    className="gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700"
                  >
                    <Images className="size-4" />
                    Choose from Media
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {isGalleryDragging && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/95 dark:border-indigo-400 dark:bg-gray-900/95">
                    <div className="text-center text-indigo-700 dark:text-indigo-300">
                      <UploadCloud className="mx-auto size-6" />
                      <p className="mt-2 text-sm font-medium">Drop images to add them</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {galleryImages.map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-300/80 bg-white/70 p-1 shadow-sm sm:w-52 dark:border-gray-600/80 dark:bg-gray-800"
                    >
                      {imageUrl ? (
                        <ImageWithFallback
                          src={imageUrl}
                          alt={`${field.label} ${index + 1}`}
                          className="size-full rounded-lg bg-gray-100 object-contain dark:bg-gray-950"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-950">
                          <ImageIcon className="size-6 text-gray-400" />
                        </div>
                      )}

                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setMediaPickerTarget({ fieldName: field.name, index })}
                          className="size-8 rounded-lg border-white/60 bg-white/90 shadow-sm backdrop-blur hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:hover:bg-gray-900"
                          title="Replace from Media"
                          aria-label={`Replace image ${index + 1} from Media`}
                        >
                          <Images className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => removeArrayItem(field.name, index)}
                          className="size-8 rounded-lg border-white/60 bg-white/90 text-gray-500 shadow-sm backdrop-blur hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-400"
                          title="Remove image"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget({
                      fieldName: field.name,
                      index: galleryImages.length,
                    })}
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-500 transition-all hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-52 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-900">
                      <Images className="size-4" />
                    </span>
                    Add from Media
                  </button>
                </div>
              </>
            )}
            {mediaUploadErrors[field.name] && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {mediaUploadErrors[field.name]}
              </p>
            )}
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
            <div className="min-w-0">
              {isEditingTitle ? (
                <Input
                  value={pageTitle}
                  onChange={(event) => {
                    setPageTitle(event.target.value);
                    setTitleError(null);
                  }}
                  onBlur={savePageTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setPageTitle(savedPageTitle);
                      setTitleError(null);
                      setIsEditingTitle(false);
                    }
                  }}
                  onFocus={(event) => event.currentTarget.select()}
                  autoFocus
                  maxLength={255}
                  aria-label="Page name"
                  className="mb-1 h-9 w-full min-w-56 max-w-md rounded-lg border-indigo-400 bg-white px-2 text-xl font-semibold text-gray-900 ring-2 ring-indigo-500/15 dark:bg-gray-900 dark:text-white"
                />
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => {
                    if (!isSavingTitle) {
                      setTitleError(null);
                      setIsEditingTitle(true);
                    }
                  }}
                  disabled={isSavingTitle}
                  title="Double-click to rename"
                  className="group -ml-2 mb-1 flex max-w-md items-center gap-2 rounded-lg px-2 py-1 text-left text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-wait dark:text-white dark:hover:bg-gray-800"
                >
                  <span className="truncate text-xl font-semibold">{pageTitle}</span>
                  {isSavingTitle
                    ? <LoaderCircle className="size-4 shrink-0 animate-spin text-gray-400" />
                    : <Pencil className="size-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />}
                </button>
              )}
              {titleError && (
                <p className="mb-1 text-xs text-red-600 dark:text-red-400">{titleError}</p>
              )}
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
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {page.rows.map((row) => (
            <Card
              key={row.id}
              className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900"
            >
              <CardContent className="p-6">
                <div
                  className={`grid items-stretch gap-4 ${
                    row.columns === '2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {row.fields.map((field) => {
                    const FieldIcon = fieldIcons[field.type];

                    return (
                      <div
                        key={field.id}
                        className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-50/50 dark:border-gray-700/70 dark:bg-gray-800/30"
                      >
                        <div className="flex min-h-14 items-center gap-3 border-b border-gray-200/70 bg-white/60 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-900/35">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <FieldIcon className="size-4" />
                          </span>
                          <Label
                            htmlFor={field.name}
                            className="text-sm font-medium text-gray-800 dark:text-gray-100"
                          >
                            {field.label}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </Label>
                        </div>
                        <div className="flex-1 p-4">
                          {renderField(field)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MediaPickerDialog
        open={mediaPickerTarget !== null}
        selectedUrl={typeof selectedMediaUrl === 'string' ? selectedMediaUrl : undefined}
        onOpenChange={(open) => {
          if (!open) setMediaPickerTarget(null);
        }}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
