import { useState } from 'react';
import { api } from '@adapter/api';
import { ArrowLeft, Layout, FileEdit, Layers } from 'lucide-react';
import { Button } from '@ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog';

interface FieldSetSummary {
  id: number;
  name: string;
  fieldCount: number;
}

interface NewPageModalProps {
  open: boolean;
  onClose: () => void;
  fieldSets: FieldSetSummary[];
}

export function NewPageModal({ open, onClose, fieldSets }: NewPageModalProps) {
  const [step, setStep] = useState<'type' | 'fieldSet'>('type');

  const handleSelectType = (contentType: 'wysiwyg' | 'custom_fields') => {
    if (contentType === 'wysiwyg') {
      api.post('/admin/pages', { content_type: contentType }, {
        inertia: true,
        onSuccess: () => {
          resetAndClose();
        },
      });
      return;
    }

    if (fieldSets.length === 0) {
      api.post('/admin/pages', { content_type: contentType }, {
        inertia: true,
        onSuccess: () => {
          resetAndClose();
        },
      });
      return;
    }

    setStep('fieldSet');
  };

  const handleSelectFieldSet = (fieldSetId: number | null) => {
    api.post('/admin/pages', {
      content_type: 'custom_fields',
      field_set_id: fieldSetId,
    }, {
      inertia: true,
      onSuccess: () => {
        resetAndClose();
      },
    });
  };

  const resetAndClose = () => {
    setStep('type');
    onClose();
  };

  const handleClose = () => {
    setStep('type');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl dark:bg-gray-900 dark:border-gray-800">
        {step === 'type' ? (
          <>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create New Page</DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Choose how you want to build your page
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <button
                onClick={() => handleSelectType('wysiwyg')}
                className="group relative p-8 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30">
                    <Layout className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg text-gray-900 dark:text-white mb-2">Visual Editor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Build pages with drag-and-drop elements. Perfect for landing pages and custom layouts.
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">&rarr;</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectType('custom_fields')}
                className="group relative p-8 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <FileEdit className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg text-gray-900 dark:text-white mb-2">Custom Fields</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Define structured content with custom fields. Ideal for blogs, products, and data-driven pages.
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">&rarr;</span>
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('type')}
                  className="h-9 w-9 rounded-xl p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="dark:text-white">Start from a field set?</DialogTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose an existing field set to copy its field structure, or start fresh.
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => handleSelectFieldSet(null)}
                className="w-full p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-400 transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Start from scratch</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Create a new model with no predefined fields.</p>
                  </div>
                </div>
              </button>

              {fieldSets.map((fieldSet) => (
                <button
                  key={fieldSet.id}
                  onClick={() => handleSelectFieldSet(fieldSet.id)}
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-400 transition-all hover:bg-purple-50/30 dark:hover:bg-purple-950/20 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
                      <FileEdit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{fieldSet.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fieldSet.fieldCount} {fieldSet.fieldCount === 1 ? 'field' : 'fields'} predefined
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Select &rarr;</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
