import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  ChevronDown,
  FileText,
  Folders,
  Image,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Puzzle,
  Settings,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface NavigationChild {
  name: string;
  href: string;
  icon: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  children?: NavigationChild[];
}

interface SidebarPageProps {
  [key: string]: unknown;
  adminNavigation?: NavigationItem[];
}

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  content: FileText,
  media: Image,
  settings: Settings,
  extensions: Puzzle,
  profile: User,
  overview: LayoutGrid,
  groups: Folders,
  menu: Menu,
};

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { url, props } = usePage<SidebarPageProps>();
  const navigation = props.adminNavigation ?? [];

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of navigation) {
      if (item.children && item.children.some((child) => url.startsWith(child.href))) {
        initial[item.href] = true;
      }
    }
    return initial;
  });

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => {
      const isOpen = prev[href] ?? false;
      if (isOpen) return { [href]: false };
      return { [href]: true };
    });
  };

  useEffect(() => {
    setOpenMenus((prev) => {
      for (const item of navigation) {
        if (item.children && item.children.some((child) => url.startsWith(child.href))) {
          return { [item.href]: true };
        }
      }
      return prev;
    });
  }, [url, navigation]);

  const isActive = (href: string, children?: NavigationChild[]) => {
    if (children && children.some((child) => url.startsWith(child.href))) {
      return true;
    }
    return url.split('?')[0] === href;
  };

  return (
    <aside className="w-[300px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">CMS Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 overflow-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = icons[item.icon] ?? FileText;
            const active = isActive(item.href, item.children);

            if (item.children && item.children.length > 0) {
              const isOpen = openMenus[item.href] ?? false;

              return (
                <li key={item.href}>
                  <div className={`group flex items-center rounded-xl overflow-hidden ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                    <Link
                      href={item.href}
                      onClick={() => setOpenMenus({ [item.href]: true })}
                      className={`flex items-center gap-3 px-4 py-3 flex-1 ${
                        active
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleMenu(item.href); }}
                      className={`px-3 py-3 pr-4 ${
                        active
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                      }`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-100 dark:border-gray-800 pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = icons[child.icon] ?? FileText;
                        const childActive = url.startsWith(child.href);

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                childActive
                                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4" />
                              <span className="text-sm">{child.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <button
          type="button"
          onClick={() => api.post(
            '/admin/logout',
            {},
            { inertia: true },
          )}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign out</span>
        </button>
        <div className="px-5 py-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50">
          <p className="text-sm text-gray-900 dark:text-white">Pro Plan</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upgrade for more features</p>
        </div>
      </div>
    </aside>
  );
}
