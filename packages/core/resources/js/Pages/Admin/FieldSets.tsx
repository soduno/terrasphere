import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Textarea } from '@ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@ui/dialog';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { DropdownMenuItem } from '@ui/dropdown-menu';

interface FieldSetSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fieldCount: number;
  updatedAt: string | null;
}

interface FieldSetsProps {
  fieldSets: FieldSetSummary[];
}

export default function FieldSets({ fieldSets }: FieldSetsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    setSaving(true);
    api.post('/admin/field-sets', {
      name: newName.trim(),
      description: newDescription.trim() || null,
    }, {
      inertia: true,
      onFinish: () => {
        setSaving(false);
        setShowCreateModal(false);
        setNewName('');
        setNewDescription('');
      },
    });
  };

  const handleDelete = (targets: FieldSetSummary[]) => {
    if (targets.length === 1) {
      api.delete(`/admin/field-sets/${targets[0].id}`, { inertia: true });
      return;
    }
    router.visit('/admin/field-sets', {
      method: 'delete',
      data: { ids: targets.map((t) => t.id) },
    });
  };

  const columns: DataTableColumn<FieldSetSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (fieldSet) => (
        <p className="text-sm font-medium text-gray-900 dark:text-white">{fieldSet.name}</p>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (fieldSet) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{fieldSet.slug}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (fieldSet) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {fieldSet.description || '\u2014'}
        </span>
      ),
    },
    {
      key: 'fields',
      header: 'Fields',
      render: (fieldSet) => (
        <span className="px-3 py-1.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
          {fieldSet.fieldCount} {fieldSet.fieldCount === 1 ? 'field' : 'fields'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Updated',
      render: (fieldSet) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {fieldSet.updatedAt ? new Date(fieldSet.updatedAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        items={fieldSets}
        itemKey={(fs) => fs.id}
        columns={columns}
        searchPlaceholder="Search field sets..."
        searchFilter={(fieldSet, query) =>
          fieldSet.name.toLowerCase().includes(query.toLowerCase())
        }
        title="Field Sets"
        description="Create field sets to assign shared field templates to pages."
        headerAction={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Field Set
          </Button>
        }
        onDelete={handleDelete}
        onRowClick={(fieldSet) => router.visit(`/admin/field-sets/${fieldSet.id}/fields`)}
        renderActions={(fieldSet) => (
          <DropdownMenuItem
            onClick={() => router.visit(`/admin/field-sets/${fieldSet.id}/fields`)}
            className="dark:hover:bg-gray-700"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Edit Fields
          </DropdownMenuItem>
        )}
        deleteConfirmTitle={(targets) =>
          targets.length === 1
            ? `Delete "\u201c${targets[0]?.name}\u201d"?`
            : `Delete ${targets.length} field sets?`
        }
        deleteConfirmDescription={(targets) =>
          targets.length === 1
            ? 'This permanently deletes the field set. Pages using this field set will keep their current fields.'
            : `This permanently deletes ${targets.length} field sets. Pages using these field sets will keep their current fields.`
        }
      />

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create Field Set</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Field sets let you define reusable field templates for pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fieldSetName" className="text-sm text-gray-700 dark:text-gray-300">Name</Label>
              <Input
                id="fieldSetName"
                placeholder="Blog Posts"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldSetDescription" className="text-sm text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="fieldSetDescription"
                placeholder="Optional description for this field set..."
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewDescription('');
                }}
                disabled={saving}
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                {saving ? 'Creating...' : 'Create Field Set'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
