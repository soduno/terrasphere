import { ArrowLeft, Eye, Save, Smartphone, Monitor } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface EditorToolbarProps {
  title: string;
  saveStatus: 'saved' | 'saving' | 'error';
}

export function EditorToolbar({
  title,
  saveStatus,
}: EditorToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
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
        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-sm text-gray-900 dark:text-white">{title}</p>
          <p className={`text-xs ${
            saveStatus === 'error'
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
                ? 'Unable to save'
                : 'All changes saved'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm">
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-900">
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700" />
        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
        <Button size="sm" className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20">
          <Save className="w-4 h-4" />
          Publish
        </Button>
      </div>
    </div>
  );
}
