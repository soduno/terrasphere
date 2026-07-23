import { createInertiaApp } from '@inertiajs/react'
import { AdminLayout } from '@components/layouts/AdminLayout'
import './admin.scss'

createInertiaApp({
    pages: './Pages',
    strictMode: true,
    layout: () => AdminLayout,
})
