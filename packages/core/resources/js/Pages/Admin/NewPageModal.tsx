import { router } from '@inertiajs/react';
import { Layout, FileEdit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog';

interface NewPageModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewPageModal({ open, onClose }: NewPageModalProps) {
  const handleSelectType = (contentType: 'wysiwyg' | 'custom_fields') => {
    router.post('/admin/pages', { content_type: contentType }, {
      onSuccess: onClose,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Create New Page</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Choose how you want to build your page
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Visual Editor Option */}
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
                <span className="text-white text-xs">→</span>
              </div>
            </div>
          </button>

          {/* Custom Fields Option */}
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
                <span className="text-white text-xs">→</span>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
