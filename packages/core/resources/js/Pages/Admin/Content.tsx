import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Settings2,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import { NewPageModal } from './NewPageModal';

interface PageSummary {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  type: 'wysiwyg' | 'custom_fields';
  updatedAt: string | null;
}

interface ContentProps {
  pages: PageSummary[];
}

export default function Content({ pages }: ContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageSummary | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (page: PageSummary) => {
    if (page.type === 'wysiwyg') {
      router.visit(`/admin/editor/${page.id}`);
    } else {
      router.visit(`/admin/fields-editor/${page.id}`);
    }
  };

  const handleEditFields = (page: PageSummary) => {
    router.visit(`/admin/fields-builder/${page.id}`);
  };

  const handleDelete = () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    const page = deleteTarget;

    setDeleteError(null);
    setDeleteTarget(null);
    setDeletingPageId(page.id);
    setIsDeleting(true);

    window.setTimeout(() => {
      api.delete(`/admin/pages/${page.id}`, {
        inertia: true,
        preserveScroll: true,
        onError: (errors) => {
          const message = Object.values(errors)[0];

          setDeleteError(typeof message === 'string' ? message : 'The page could not be deleted.');
          setDeleteTarget(page);
        },
        onFinish: () => {
          setDeletingPageId(null);
          setIsDeleting(false);
        },
      });
    }, 450);
  };

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Content</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all your pages and content.</p>
        </div>
        <Button
          onClick={() => setShowNewPageModal(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 dark:border dark:border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPages.map((page) => (
                <tr
                  key={page.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => handleEdit(page)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleEdit(page);
                    }
                  }}
                  className={`cursor-pointer transition-[background-color,opacity] duration-200 focus:outline-none ${
                    deletingPageId === page.id
                      ? 'animate-pulse bg-red-100/80 opacity-40 dark:bg-red-950/60'
                      : 'hover:bg-indigo-50/40 focus:bg-indigo-50/40 dark:hover:bg-indigo-500/5 dark:focus:bg-indigo-500/5'
                  }`}
                >
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-900 dark:text-white">{page.title}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1.5 text-xs rounded-full ${
                        page.type === 'wysiwyg'
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
                      }`}
                    >
                      {page.type === 'wysiwyg' ? 'WYSIWYG' : 'Custom Fields'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1.5 text-xs rounded-full ${
                        page.status === 'published'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                    {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">—</td>
                  <td
                    className="px-6 py-5"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dark:hover:bg-gray-800">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                        <DropdownMenuItem onClick={() => handleEdit(page)} className="dark:hover:bg-gray-700">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {page.type === 'custom_fields' && (
                          <DropdownMenuItem onClick={() => handleEditFields(page)} className="dark:hover:bg-gray-700">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Edit Fields
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="dark:hover:bg-gray-700">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(page);
                          }}
                          className="dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the page and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewPageModal open={showNewPageModal} onClose={() => setShowNewPageModal(false)} />
    </div>
  );
}
