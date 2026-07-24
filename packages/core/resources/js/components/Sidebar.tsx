import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, FileText, Settings, Puzzle, User, Layers, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Extensions', href: '/admin/extensions', icon: Puzzle },
  { name: 'Profile', href: '/admin/profile', icon: User },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { url } = usePage();

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
      
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    url.split('?')[0] === item.href
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            </li>
          ))}
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
        <Link
          href="/admin/logout"
          method="post"
          as="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign out</span>
        </Link>
        <div className="px-5 py-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50">
          <p className="text-sm text-gray-900 dark:text-white">Pro Plan</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upgrade for more features</p>
        </div>
      </div>
    </aside>
  );
}
