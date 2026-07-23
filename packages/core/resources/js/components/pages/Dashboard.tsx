import { TrendingUp, FileText, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const stats = [
  { name: 'Total Pages', value: '24', change: '+12%', icon: FileText, color: 'blue' },
  { name: 'Total Views', value: '12.4K', change: '+23%', icon: Eye, color: 'green' },
  { name: 'Active Users', value: '342', change: '+5%', icon: Users, color: 'purple' },
  { name: 'Engagement', value: '68%', change: '+8%', icon: TrendingUp, color: 'orange' },
];

const chartData = [
  { name: 'Jan', views: 4000 },
  { name: 'Feb', views: 3000 },
  { name: 'Mar', views: 5000 },
  { name: 'Apr', views: 4500 },
  { name: 'May', views: 6000 },
  { name: 'Jun', views: 5500 },
  { name: 'Jul', views: 7000 },
];

const recentPages = [
  { title: 'Homepage Redesign', status: 'Published', date: '2 hours ago', views: 1234 },
  { title: 'About Us', status: 'Draft', date: '1 day ago', views: 856 },
  { title: 'Product Launch', status: 'Published', date: '3 days ago', views: 2341 },
  { title: 'Blog Post #12', status: 'Scheduled', date: '5 days ago', views: 445 },
];

export function Dashboard() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening with your content.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-0 shadow-sm dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-950 shadow-sm`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">{stat.change}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.name}</p>
              <p className="text-gray-900 dark:text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPages.map((page, index) => (
                <div key={index} className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-900 dark:text-white">{page.title}</p>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        page.status === 'Published'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : page.status === 'Draft'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                      }`}
                    >
                      {page.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{page.date}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{page.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
