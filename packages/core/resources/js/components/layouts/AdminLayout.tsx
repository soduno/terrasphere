import type { PropsWithChildren } from 'react'

import { Sidebar } from '@components/Sidebar'
import { ThemeProvider } from '@components/ThemeProvider'

export function AdminLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider>
            <div className="flex h-screen bg-gray-50/50 dark:bg-gray-950">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </ThemeProvider>
    )
}
