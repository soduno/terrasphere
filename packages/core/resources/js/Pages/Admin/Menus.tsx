import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';

export default function Menus() {
  return (
    <div className="px-10 pt-10 pb-6">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Menus</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage navigation menus for your site.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Navigation Menus</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Create and organize menus for your site's navigation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Menu management will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
