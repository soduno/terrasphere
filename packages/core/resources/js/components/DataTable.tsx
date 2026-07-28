import { useState } from 'react';
import {
  MoreVertical,
  Search,
  Trash2,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Checkbox } from '@ui/checkbox';
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
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

export interface DataTableRowState {
  selected: boolean;
  deleting: boolean;
  toggle: () => void;
}

export interface DataTableProps<T> {
  items: T[];
  itemKey: (item: T) => string | number;
  columns?: DataTableColumn<T>[];
  renderRow?: (item: T, state: DataTableRowState) => React.ReactNode;
  renderListHeader?: React.ReactNode;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  searchFilter: (item: T, query: string) => boolean;
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  onRowClick?: (item: T) => void;
  onDelete: (items: T[]) => void;
  deleteConfirmTitle?: (items: T[]) => string;
  deleteConfirmDescription?: (items: T[]) => string;
  deletingIds?: Set<string | number>;
  isDeleting?: boolean;
  deleteError?: string | null;
  onClearDelete?: () => void;
  renderActions?: (item: T) => React.ReactNode;
  selectable?: (item: T) => boolean;
}

export function DataTable<T>({
  items,
  itemKey,
  columns,
  renderRow,
  renderListHeader,
  children,
  searchPlaceholder = 'Search...',
  searchFilter,
  title,
  description,
  headerAction,
  onRowClick,
  onDelete,
  deleteConfirmTitle,
  deleteConfirmDescription,
  deletingIds,
  isDeleting = false,
  deleteError,
  onClearDelete,
  renderActions,
  selectable,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(() => new Set());
  const [deleteTargets, setDeleteTargets] = useState<T[]>([]);

  const filteredItems = items.filter((item) => searchFilter(item, searchQuery));
  const selectableItems = selectable
    ? filteredItems.filter(selectable)
    : filteredItems;
  const selectableIds = selectableItems.map((item) => itemKey(item));
  const allFilteredSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = selectableIds.some((id) => selectedIds.has(id));

  const toggleSelection = (id: string | number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = (selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      selectableIds.forEach((id) => {
        if (selected) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const selectedItems = items.filter((item) => selectedIds.has(itemKey(item)));

  const handleConfirmDelete = () => {
    if (deleteTargets.length === 0 || isDeleting) return;
    setDeleteTargets([]);
    onDelete(deleteTargets);
  };

  const isDeletingId = (item: T) => deletingIds?.has(itemKey(item)) ?? false;
  const isSelected = (item: T) => selectedIds.has(itemKey(item));

  const list = renderRow ? (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {filteredItems.map((item) => {
        const key = itemKey(item);
        const deleting = isDeletingId(item);
        const sel = isSelected(item);

        return (
          <li
            key={key}
            className={`transition-[background-color,opacity] duration-200 ${
              deleting
                ? 'animate-pulse bg-red-100/80 opacity-40 dark:bg-red-950/60'
                : sel
                  ? 'bg-indigo-50/80 hover:bg-indigo-100/70 dark:bg-indigo-950/35 dark:hover:bg-indigo-950/50'
                  : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/30'
            }`}
          >
            {renderRow(item, {
              selected: sel,
              deleting,
              toggle: () => toggleSelection(key),
            })}
          </li>
        );
      })}
    </ul>
  ) : (
    <table className="w-full">
      <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <tr>
          <th className="w-14 px-6 py-4 text-left">
            <Checkbox
              aria-label="Select all visible items"
              checked={
                allFilteredSelected
                  ? true
                  : someFilteredSelected
                    ? 'indeterminate'
                    : false
              }
              disabled={selectableIds.length === 0 || isDeleting}
              onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
            />
          </th>
          {columns?.map((col) => (
            <th
              key={col.key}
              className={`px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className ?? ''}`}
            >
              {col.header}
            </th>
          ))}
          {renderActions && (
            <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredItems.map((item) => {
          const key = itemKey(item);
          const deleting = isDeletingId(item);

          return (
            <tr
              key={key}
              role={onRowClick ? 'link' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
              className={`${
                onRowClick ? 'cursor-pointer' : ''
              } transition-[background-color,opacity] duration-200 focus:outline-none ${
                deleting
                  ? 'animate-pulse bg-red-100/80 opacity-40 dark:bg-red-950/60'
                  : selectedIds.has(key)
                    ? 'bg-indigo-50/80 hover:bg-indigo-100/70 dark:bg-indigo-950/35 dark:hover:bg-indigo-950/50'
                    : 'hover:bg-indigo-50/40 focus:bg-indigo-50/40 dark:hover:bg-indigo-500/5 dark:focus:bg-indigo-500/5'
              }`}
            >
              <td
                className="w-14 px-6 py-5"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Checkbox
                  aria-label="Select item"
                  checked={selectedIds.has(key)}
                  disabled={isDeleting}
                  onCheckedChange={() => toggleSelection(key)}
                />
              </td>
              {columns?.map((col) => (
                <td key={col.key} className={`px-6 py-5 ${col.className ?? ''}`}>
                  {col.render(item)}
                </td>
              ))}
              {renderActions && (
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
                      {renderActions(item)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">{title}</h1>
          {description && (
            <p className="text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {headerAction && headerAction}
      </div>

      {children}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 dark:border dark:border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/30">
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear selection
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting || selectedItems.length === 0}
                  onClick={() => setDeleteTargets(selectedItems)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete selected
                </Button>
              </div>
            </div>
          )}
        </div>

        {renderListHeader && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            {renderListHeader}
          </div>
        )}

        <div className={renderRow ? '' : 'overflow-x-auto'}>
          {list}
        </div>
      </div>

      <AlertDialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargets([]);
            onClearDelete?.();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmTitle
                ? deleteConfirmTitle(deleteTargets)
                : `Delete ${deleteTargets.length} item${deleteTargets.length !== 1 ? 's' : ''}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmDescription
                ? deleteConfirmDescription(deleteTargets)
                : `This permanently deletes ${deleteTargets.length} item${deleteTargets.length !== 1 ? 's' : ''}. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
