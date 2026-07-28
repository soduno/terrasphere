import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Settings2,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@ui/button';
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
import { DropdownMenuItem } from '@ui/dropdown-menu';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { NewPageModal } from './NewPageModal';

interface PageSummary {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  type: 'wysiwyg' | 'custom_fields';
  updatedAt: string | null;
}

interface FieldSetSummary {
  id: number;
  name: string;
  fieldCount: number;
}

interface ContentProps {
  pages: PageSummary[];
  fieldSets: FieldSetSummary[];
  filter: string;
}

export default function Content({ pages, fieldSets, filter }: ContentProps) {
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(() => new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<PageSummary | null>(null);

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

  const handleDelete = (targets: PageSummary[]) => {
    const targetIds = targets.map((p) => p.id);

    setDeleteError(null);
    setDeletingIds(new Set(targetIds));
    setIsDeleting(true);

    window.setTimeout(() => {
      const options = {
        preserveScroll: true,
        onError: (errors: Record<string, string>) => {
          const message = Object.values(errors)[0];
          setDeleteError(typeof message === 'string' ? message : 'The pages could not be deleted.');
        },
        onFinish: () => {
          setDeletingIds(new Set());
          setIsDeleting(false);
        },
      };

      if (targetIds.length === 1) {
        api.delete(`/admin/pages/${targetIds[0]}`, {
          inertia: true,
          ...options,
        });
        return;
      }

      router.visit('/admin/pages', {
        method: 'delete',
        data: { ids: targetIds },
        ...options,
      });
    }, 450);
  };

  const confirmSingleDelete = () => {
    if (!singleDeleteTarget) return;
    handleDelete([singleDeleteTarget]);
    setSingleDeleteTarget(null);
  };

  const columns: DataTableColumn<PageSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (page) => (
        <p className="text-sm text-gray-900 dark:text-white">{page.title}</p>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (page) => (
        <span
          className={`px-3 py-1.5 text-xs rounded-full ${
            page.type === 'wysiwyg'
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
              : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
          }`}
        >
          {page.type === 'wysiwyg' ? 'WYSIWYG' : 'Custom Fields'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (page) => (
        <span
          className={`px-3 py-1.5 text-xs rounded-full ${
            page.status === 'published'
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: () => <span className="text-sm text-gray-700 dark:text-gray-300">&mdash;</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (page) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      render: () => <span className="text-sm text-gray-700 dark:text-gray-300">&mdash;</span>,
    },
  ];

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'wysiwyg', label: 'Visual' },
    { key: 'custom_fields', label: 'Custom Fields' },
  ] as const;

  return (
    <>
      <DataTable
        items={pages}
        itemKey={(page) => page.id}
        columns={columns}
        searchPlaceholder="Search pages..."
        searchFilter={(page, query) =>
          page.title.toLowerCase().includes(query.toLowerCase())
        }
        title="Content"
        description="Manage all your pages and content."
        headerAction={
          <Button
            onClick={() => setShowNewPageModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Page
          </Button>
        }
        onRowClick={handleEdit}
        onDelete={handleDelete}
        deletingIds={deletingIds}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClearDelete={() => setDeleteError(null)}
        deleteConfirmTitle={(targets) =>
          targets.length === 1
            ? `Delete "\u201c${targets[0]?.title}\u201d"?`
            : `Delete ${targets.length} pages?`
        }
        deleteConfirmDescription={(targets) =>
          targets.length === 1
            ? 'This permanently deletes the page and its content.'
            : 'This permanently deletes the selected pages and all of their content.'
        }
        renderActions={(page) => (
          <>
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
                setSingleDeleteTarget(page);
              }}
              className="dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      >
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl dark:bg-gray-800 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => router.visit(`/admin/content?filter=${tab.key}`, { preserveState: true, preserveScroll: true })}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </DataTable>

      <AlertDialog
        open={singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSingleDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{singleDeleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the page and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSingleDelete();
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

      <NewPageModal open={showNewPageModal} onClose={() => setShowNewPageModal(false)} fieldSets={fieldSets} />
    </>
  );
}
