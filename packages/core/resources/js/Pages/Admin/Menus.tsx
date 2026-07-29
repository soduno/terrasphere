import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import { Plus } from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@ui/dialog';
import { DataTable, type DataTableColumn } from '@components/DataTable';

interface MenuSummary {
  id: number;
  name: string;
  slug: string;
  location: string | null;
  itemCount: number;
  updatedAt: string | null;
}

interface MenusProps {
  menus: MenuSummary[];
}

export default function Menus({ menus }: MenusProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    setSaving(true);
    api.post('/admin/menus', {
      name: newName.trim(),
      location: newLocation.trim() || null,
    }, {
      inertia: true,
      onFinish: () => {
        setSaving(false);
        setShowCreateModal(false);
        setNewName('');
        setNewLocation('');
      },
    });
  };

  const handleDelete = (targets: MenuSummary[]) => {
    if (targets.length === 1) {
      api.delete(`/admin/menus/${targets[0].id}`, { inertia: true });
      return;
    }
    router.visit('/admin/menus', {
      method: 'delete',
      data: { ids: targets.map((t) => t.id) },
    });
  };

  const columns: DataTableColumn<MenuSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (menu) => (
        <p className="text-sm font-medium text-gray-900 dark:text-white">{menu.name}</p>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (menu) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {menu.location || '\u2014'}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (menu) => (
        <span className="px-3 py-1.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
          {menu.itemCount} {menu.itemCount === 1 ? 'item' : 'items'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Updated',
      render: (menu) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {menu.updatedAt ? new Date(menu.updatedAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        items={menus}
        itemKey={(m) => m.id}
        columns={columns}
        searchPlaceholder="Search menus..."
        searchFilter={(menu, query) =>
          menu.name.toLowerCase().includes(query.toLowerCase())
        }
        title="Menus"
        description="Create and manage navigation menus."
        headerAction={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Menu
          </Button>
        }
        onRowClick={(menu) => router.visit(`/admin/menus/${menu.id}/edit`)}
        onDelete={handleDelete}
        deleteConfirmTitle={(targets) =>
          targets.length === 1
            ? `Delete "\u201c${targets[0]?.name}\u201d"?`
            : `Delete ${targets.length} menus?`
        }
        deleteConfirmDescription={(targets) =>
          targets.length === 1
            ? 'This permanently deletes the menu and all its items.'
            : `This permanently deletes ${targets.length} menus and all their items.`
        }
      />

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create Menu</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Create a new navigation menu for your site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="menuName" className="text-sm text-gray-700 dark:text-gray-300">Name</Label>
              <Input
                id="menuName"
                placeholder="Main Navigation"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuLocation" className="text-sm text-gray-700 dark:text-gray-300">
                Location <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="menuLocation"
                placeholder="e.g. header, footer, sidebar"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewLocation('');
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
                {saving ? 'Creating...' : 'Create Menu'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
