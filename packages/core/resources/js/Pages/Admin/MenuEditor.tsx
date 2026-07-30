import { useState, useCallback, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Link as LinkIcon,
  ListTree,
  PackageOpen,
  Plus,
  Save,
  Search,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Switch } from '@ui/switch';

interface PageOption {
  id: number;
  title: string;
}

interface MenuItemData {
  id: number;
  type: 'page' | 'custom';
  page_id: number | null;
  url: string | null;
  label: string;
  html_id?: string | null;
  css_classes?: string | null;
  target: string;
  order: number;
  page?: { id: number; title: string } | null;
  children?: MenuItemData[];
}

interface MenuEditorProps {
  menu: {
    id: number;
    name: string;
    slug: string;
    location: string | null;
    items: MenuItemData[];
  };
  pages: PageOption[];
}

function flattenItems(items: MenuItemData[]): MenuItemData[] {
  const result: MenuItemData[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      result.push(...flattenItems(item.children));
    }
  }
  return result;
}

interface EditingItem {
  id: number;
  label: string;
  url: string;
  html_id: string;
  css_classes: string;
  target: string;
}

export default function MenuEditor({ menu, pages }: MenuEditorProps) {
  const [items, setItems] = useState<MenuItemData[]>(menu.items);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    const collect = (list: MenuItemData[]) => {
      for (const item of list) {
        if (item.children && item.children.length > 0) {
          ids.add(item.id);
          collect(item.children);
        }
      }
    };
    collect(menu.items);
    return ids;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingItem>({ id: 0, label: '', url: '', html_id: '', css_classes: '', target: '_self' });
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [targetDragId, setTargetDragId] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<'sibling' | 'child'>('sibling');

  const cloneRef = useRef<HTMLElement | null>(null);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const originalItemsRef = useRef<MenuItemData[]>([]);

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addedPageIds = new Set(
    flattenItems(items)
      .filter((i) => i.type === 'page' && i.page_id !== null)
      .map((i) => i.page_id!)
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addPageItem = (page: PageOption) => {
    const newId = -Date.now();
    const newItem: MenuItemData = {
      id: newId,
      type: 'page',
      page_id: page.id,
      url: null,
      label: page.title,
      css_classes: null,
      target: '_self',
      order: items.length,
      page: { id: page.id, title: page.title },
    };
    setItems((prev) => [...prev, newItem]);
  };

  const addCustomItem = () => {
    if (!customLabel.trim() || !customUrl.trim()) return;
    const newItem: MenuItemData = {
      id: -Date.now(),
      type: 'custom',
      page_id: null,
      url: customUrl.trim(),
      label: customLabel.trim(),
      css_classes: null,
      target: '_self',
      order: items.length,
    };
    setItems((prev) => [...prev, newItem]);
    setCustomUrl('');
    setCustomLabel('');
  };

  const removeItem = (id: number) => {
    if (id < 0) {
      setItems((prev) => removeFromTree(prev, id));
      return;
    }
    api.delete(`/admin/items/${id}`).then(() => {
      setItems((prev) => removeFromTree(prev, id));
    }).catch(() => {
      setItems((prev) => removeFromTree(prev, id));
    });
  };


  const removeFromTree = (list: MenuItemData[], id: number): MenuItemData[] => {
    return list
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: item.children ? removeFromTree(item.children, id) : undefined,
      }));
  };

  const findItemInTree = (list: MenuItemData[], id: number): MenuItemData | null => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemInTree(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const moveItemSibling = (list: MenuItemData[], draggedId: number, targetId: number, position: 'above' | 'below'): MenuItemData[] => {
    const draggedItem = findItemInTree(list, draggedId);
    if (!draggedItem) return list;

    const without = removeFromTree(list, draggedId);

    const insert = (items: MenuItemData[]): MenuItemData[] => {
      const result: MenuItemData[] = [];
      for (const item of items) {
        if (item.id === targetId) {
          if (position === 'above') {
            result.push({ ...draggedItem, children: draggedItem.children ? [...draggedItem.children] : undefined });
            result.push(item);
          } else {
            result.push(item);
            result.push({ ...draggedItem, children: draggedItem.children ? [...draggedItem.children] : undefined });
          }
        } else if (item.children) {
          const hasTarget = findItemInTree(item.children, targetId);
          if (hasTarget) {
            result.push({ ...item, children: insert(item.children) });
          } else {
            result.push(item);
          }
        } else {
          result.push(item);
        }
      }
      return result;
    };

    return insert(without);
  };

  const isDescendant = (list: MenuItemData[], parentId: number, targetId: number): boolean => {
    const target = findItemInTree(list, targetId);
    if (!target || !target.children) return false;
    for (const child of target.children) {
      if (child.id === parentId) return true;
      if (child.children && isDescendant(list, parentId, child.id)) return true;
    }
    return false;
  };

  const moveItemAsChild = (list: MenuItemData[], draggedId: number, parentId: number): MenuItemData[] => {
    if (isDescendant(list, parentId, draggedId)) return list;

    const draggedItem = findItemInTree(list, draggedId);
    if (!draggedItem) return list;

    const without = removeFromTree(list, draggedId);

    const insert = (items: MenuItemData[]): MenuItemData[] => {
      return items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children ?? []), { ...draggedItem, children: draggedItem.children ? [...draggedItem.children] : undefined }],
          };
        }
        if (item.children) {
          return { ...item, children: insert(item.children) };
        }
        return item;
      });
    };

    return insert(without);
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const el = (e.currentTarget as HTMLElement).closest('[data-item-id]') as HTMLElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const clone = el.cloneNode(true) as HTMLElement;
    clone.removeAttribute('data-item-id');
    clone.removeAttribute('data-depth');
    clone.style.position = 'fixed';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    clone.style.transform = 'rotate(1deg)';
    clone.style.transition = 'transform 150ms ease';
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    document.body.appendChild(clone);

    cloneRef.current = clone;
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    originalItemsRef.current = items;

    setDraggingId(itemId);
  };

  useEffect(() => {
    if (draggingId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clone = cloneRef.current;
      if (!clone) return;

      clone.style.left = `${e.clientX - offsetRef.current.x}px`;
      clone.style.top = `${e.clientY - offsetRef.current.y}px`;
      clone.style.transform = 'rotate(2deg)';

      const itemEls = document.querySelectorAll<HTMLElement>('[data-item-id]');
      let closestId: number | null = null;
      let closestDist = Infinity;
      let closestY = 0;
      let closestHeight = 0;
      let closestLeft = 0;

      for (const itemEl of itemEls) {
        const id = parseInt(itemEl.dataset.itemId!, 10);
        if (id === draggingId) continue;

        const rect = itemEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(e.clientY - midY);

        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
          closestY = rect.top;
          closestHeight = rect.height;
          closestLeft = rect.left;
        }
      }

      if (closestId !== null) {
        const childThreshold = closestLeft + 60;

        if (e.clientX > childThreshold) {
          setTargetDragId(closestId);
          setDragMode('child');
          setItems((prev) => moveItemAsChild(prev, draggingId, closestId));
          setExpandedIds((prev) => {
            if (prev.has(closestId)) return prev;
            const next = new Set(prev);
            next.add(closestId);
            return next;
          });
        } else {
          const midY = closestY + closestHeight / 2;
          const position = e.clientY < midY ? 'above' : 'below';
          setTargetDragId(closestId);
          setDragMode('sibling');
          setItems((prev) => moveItemSibling(prev, draggingId, closestId, position));
        }
      }
    };

    const handleMouseUp = () => {
      const clone = cloneRef.current;
      if (clone) {
        clone.style.transition = 'opacity 150ms ease, transform 150ms ease';
        clone.style.opacity = '0';
        clone.style.transform = 'scale(0.95)';
        setTimeout(() => {
          if (clone.parentNode) {
            document.body.removeChild(clone);
          }
        }, 150);
        cloneRef.current = null;
      }

      setDraggingId(null);
      setTargetDragId(null);
      setDragMode('sibling');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setItems(originalItemsRef.current);
        setTargetDragId(null);
        setDragMode('sibling');
        handleMouseUp();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggingId]);

  const cssTags = editForm.css_classes.split(/\s+/).filter(Boolean);

  const addCssTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const existing = editForm.css_classes.split(/\s+/).filter(Boolean);
    if (existing.includes(trimmed)) return;
    setEditForm((f) => ({ ...f, css_classes: [...existing, trimmed].join(' ') }));
  };

  const removeCssTag = (tag: string) => {
    const existing = editForm.css_classes.split(/\s+/).filter(Boolean);
    setEditForm((f) => ({ ...f, css_classes: existing.filter((t) => t !== tag).join(' ') }));
  };

  const startEdit = (item: MenuItemData) => {
    setEditingId(item.id);
    setEditForm({
      id: item.id,
      label: item.label,
      url: item.url ?? '',
      html_id: item.html_id ?? '',
      css_classes: item.css_classes ?? '',
      target: item.target,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setItems((prev) => updateInTree(prev, editingId, {
      label: editForm.label,
      url: editForm.url || null,
      html_id: editForm.html_id || null,
      css_classes: editForm.css_classes || null,
      target: editForm.target,
    }));
    setEditingId(null);

    if (editingId > 0) {
      api.put(`/admin/items/${editingId}`, {
        label: editForm.label,
        url: editForm.url || null,
        html_id: editForm.html_id || null,
        css_classes: editForm.css_classes || null,
        target: editForm.target,
      });
    }
  };

  const updateInTree = (list: MenuItemData[], id: number, updates: Partial<MenuItemData>): MenuItemData[] => {
    return list.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      if (item.children) {
        return { ...item, children: updateInTree(item.children, id, updates) };
      }
      return item;
    });
  };

  const handleSave = useCallback(() => {
    setSaving(true);

    const serialize = (list: MenuItemData[]): Record<string, unknown>[] => {
      return list.map((item, index) => ({
        id: item.id,
        type: item.type,
        page_id: item.page_id ?? null,
        url: item.url ?? null,
        label: item.label,
        html_id: item.html_id ?? null,
        target: item.target,
        parent_id: null,
        order: index,
        children: item.children && item.children.length > 0 ? serialize(item.children) : [],
      }));
    };

    const serialized = serialize(items);

    router.visit(`/admin/menus/${menu.id}/sync`, {
      method: 'put',
      data: { items: serialized as never },
      preserveScroll: true,
      onFinish: () => setSaving(false),
    });
  }, [items, menu.id]);

  const renderItem = (item: MenuItemData, depth: number) => {
    const isExpanded = expandedIds.has(item.id);
    const isEditing = editingId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isDragging = draggingId === item.id;

    return (
      <div key={item.id}>
        <div
          data-item-id={item.id}
          data-depth={depth}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all relative ${
            isDragging
              ? 'invisible'
              : isEditing
                ? 'bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-200 dark:ring-indigo-800'
                : targetDragId === item.id && dragMode === 'child'
                  ? 'bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-400/50'
                  : 'ring-1 ring-gray-100 dark:ring-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:ring-gray-300 dark:hover:ring-gray-700'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div
            onMouseDown={(e) => handleMouseDown(e, item.id)}
            className="shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          {hasChildren ? (
            <button onClick={() => toggleExpand(item.id)} className="shrink-0">
              {isExpanded
                ? <ChevronDown className="w-4 h-4 text-gray-500" />
                : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {!isEditing ? (
            <>
              <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                {item.label}
              </span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full shrink-0 ${
                item.type === 'page'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
              }`}>
                {item.type === 'page' ? 'Page' : 'Custom'}
              </span>
              <button
                onClick={() => startEdit(item)}
                className="shrink-0 p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 p-1 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex-1 space-y-3 py-1">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Label</Label>
                  <Input
                    value={editForm.label}
                    onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                    className="h-9 text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                {item.type === 'custom' && (
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">URL</Label>
                    <Input
                      value={editForm.url}
                      onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                      className="h-9 text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">HTML ID</Label>
                <Input
                  value={editForm.html_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, html_id: e.target.value }))}
                  placeholder="Optional unique ID"
                  className="h-9 text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">CSS Classes</Label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 min-h-[36px] items-center">
                  {cssTags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      {tag}
                      <button
                        onClick={() => removeCssTag(tag)}
                        className="hover:text-indigo-900 dark:hover:text-indigo-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addCssTag(tagInput);
                        setTagInput('');
                      }
                      if (e.key === 'Backspace' && !tagInput && cssTags.length > 0) {
                        removeCssTag(cssTags[cssTags.length - 1]);
                      }
                    }}
                    placeholder={cssTags.length === 0 ? 'Type and press space to add' : 'Add more...'}
                    className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <Switch
                    id={`target-${item.id}`}
                    checked={editForm.target === '_blank'}
                    onCheckedChange={(checked) => setEditForm((f) => ({ ...f, target: checked ? '_blank' : '_self' }))}
                  />
                  <Label htmlFor={`target-${item.id}`} className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    Open in new tab
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-9 text-gray-500">Cancel</Button>
                  <Button size="sm" onClick={saveEdit} className="h-9">Save</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-3 mt-3">
            {item.children?.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gray-50/70 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 px-6 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit('/admin/menus')}
              className="h-10 w-10 shrink-0 rounded-xl p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-gray-950 dark:text-white">
                {menu.name}
              </h1>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                {menu.location || 'No location'} &middot; {flattenItems(items).length} items
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 gap-2 rounded-xl bg-indigo-600 px-5 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 dark:bg-indigo-600 dark:text-blue-300 dark:hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Menu'}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-6">
        <div className="w-96 shrink-0 space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                <Type className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pages</h2>
            </div>
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">Add published pages to your menu.</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Filter pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto -mx-1 px-1">
              {filteredPages.length === 0 && searchQuery ? (
                <p className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">No pages match your search</p>
              ) : (
            <div className="space-y-2">
                  {filteredPages.map((page) => {
                    const alreadyAdded = addedPageIds.has(page.id);

                    return (
                      <button
                        key={page.id}
                        onClick={() => { if (!alreadyAdded) addPageItem(page); }}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                          alreadyAdded
                            ? 'text-gray-400 dark:text-gray-500 cursor-default bg-gray-50/50 dark:bg-gray-800/30'
                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300'
                        }`}
                      >
                        <Type className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1">{page.title}</span>
                        {alreadyAdded
                          ? <Check className="w-3.5 h-3.5 shrink-0 text-green-500" />
                          : <Plus className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {!searchQuery && pages.length > 0 && (
              <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                {addedPageIds.size} of {pages.length} pages added
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <LinkIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Custom Link</h2>
            </div>
            <p className="mb-5 text-xs text-gray-400 dark:text-gray-500">Add an external URL to the menu.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="h-10 text-sm rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Label</Label>
                <Input
                  placeholder="Link name"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomItem(); }}
                  className="h-10 text-sm rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <Button
                onClick={addCustomItem}
                disabled={!customUrl.trim() || !customLabel.trim()}
                className="w-full gap-2 rounded-xl"
                variant="outline"
              >
                <LinkIcon className="w-4 h-4" />
                Add to Menu
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ListTree className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Menu Structure</h2>
          </div>
          <p className="mb-5 text-xs text-gray-400 dark:text-gray-500">Drop an item on another to nest it as a child.</p>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100 dark:bg-gray-800/50 dark:ring-gray-800">
                <PackageOpen className="size-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                Empty menu
              </p>
              <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                Add pages from the panel on the left or create custom links to start building your menu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => renderItem(item, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
