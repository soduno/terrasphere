import { Search, Download, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Badge } from '@ui/badge';
import { useState } from 'react';

const extensions = [
  {
    id: 1,
    name: 'SEO Optimizer',
    description: 'Advanced SEO tools and analytics for your content',
    category: 'Marketing',
    installed: true,
    downloads: '12.4K',
  },
  {
    id: 2,
    name: 'Form Builder',
    description: 'Create beautiful forms with drag and drop',
    category: 'Productivity',
    installed: true,
    downloads: '8.2K',
  },
  {
    id: 3,
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics and insights',
    category: 'Analytics',
    installed: false,
    downloads: '15.1K',
  },
  {
    id: 4,
    name: 'Email Marketing',
    description: 'Send newsletters and email campaigns',
    category: 'Marketing',
    installed: false,
    downloads: '6.7K',
  },
  {
    id: 5,
    name: 'Image Gallery',
    description: 'Beautiful image galleries and lightboxes',
    category: 'Media',
    installed: false,
    downloads: '9.3K',
  },
  {
    id: 6,
    name: 'Social Share',
    description: 'Add social sharing buttons to your content',
    category: 'Social',
    installed: true,
    downloads: '11.5K',
  },
];

export default function Extensions() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExtensions = extensions.filter((ext) =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Extensions</h1>
        <p className="text-gray-500 dark:text-gray-400">Extend your CMS with powerful plugins and integrations.</p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExtensions.map((extension) => (
          <Card key={extension.id} className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900 hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-indigo-500/30" />
                <Badge variant="secondary" className="rounded-full px-3 dark:bg-gray-800 dark:text-gray-300">{extension.category}</Badge>
              </div>
              <CardTitle className="text-lg dark:text-white">{extension.name}</CardTitle>
              <CardDescription className="dark:text-gray-400">{extension.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{extension.downloads} downloads</span>
                {extension.installed ? (
                  <Button variant="outline" size="sm" disabled className="gap-2 rounded-xl dark:border-gray-700">
                    <Check className="w-4 h-4" />
                    Installed
                  </Button>
                ) : (
                  <Button size="sm" className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                    <Download className="w-4 h-4" />
                    Install
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
