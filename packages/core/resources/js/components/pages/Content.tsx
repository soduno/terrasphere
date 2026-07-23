import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Edit, Trash2, Copy, Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { NewPageModal } from './NewPageModal';

const pages = [
  {
    id: 1,
    title: 'Homepage Redesign',
    status: 'Published',
    author: 'John Doe',
    date: 'Nov 18, 2025',
    views: 1234,
    type: 'visual',
  },
  {
    id: 2,
    title: 'About Us',
    status: 'Draft',
    author: 'Jane Smith',
    date: 'Nov 19, 2025',
    views: 856,
    type: 'visual',
  },
  {
    id: 3,
    title: 'Product Launch',
    status: 'Published',
    author: 'John Doe',
    date: 'Nov 17, 2025',
    views: 2341,
    type: 'fields',
  },
  {
    id: 4,
    title: 'Services Overview',
    status: 'Published',
    author: 'Alice Johnson',
    date: 'Nov 16, 2025',
    views: 1456,
    type: 'visual',
  },
  {
    id: 5,
    title: 'Contact Page',
    status: 'Draft',
    author: 'Jane Smith',
    date: 'Nov 20, 2025',
    views: 234,
    type: 'fields',
  },
];

export function Content() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const navigate = useNavigate();

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (page: typeof pages[0]) => {
    if (page.type === 'visual') {
      navigate(`/editor/${page.id}`);
    } else {
      navigate(`/fields-editor/${page.id}`);
    }
  };

  const handleEditFields = (page: typeof pages[0]) => {
    navigate('/fields-builder', { state: { pageId: page.id } });
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
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
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
                <tr key={page.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-900 dark:text-white">{page.title}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1.5 text-xs rounded-full ${
                        page.type === 'visual'
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
                      }`}
                    >
                      {page.type === 'visual' ? 'Visual' : 'Custom Fields'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1.5 text-xs rounded-full ${
                        page.status === 'Published'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">{page.author}</td>
                  <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">{page.date}</td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">{page.views}</td>
                  <td className="px-6 py-5">
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
                        {page.type === 'fields' && (
                          <DropdownMenuItem onClick={() => handleEditFields(page)} className="dark:hover:bg-gray-700">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Edit Fields
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="dark:hover:bg-gray-700">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700">
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

      <NewPageModal open={showNewPageModal} onClose={() => setShowNewPageModal(false)} />
    </div>
  );
}