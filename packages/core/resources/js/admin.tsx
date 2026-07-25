import { createInertiaApp } from '@inertiajs/react'
import { AdminLayout } from '@components/layouts/AdminLayout'
import type { ComponentType } from 'react'
import './admin.scss'

interface PageModule {
    default: ComponentType;
}

const corePages = import.meta.glob<PageModule>('./Pages/**/*.tsx')
const mediaPages = import.meta.glob<PageModule>('../../../media/resources/js/Pages/**/*.tsx')

createInertiaApp({
    resolve: (name) => {
        const resolver = name.startsWith('Media/')
            ? mediaPages[
                `../../../media/resources/js/Pages/${name.slice('Media/'.length)}.tsx`
            ]
            : corePages[`./Pages/${name}.tsx`]

        if (!resolver) {
            throw new Error(`Unknown Inertia page: ${name}`)
        }

        return resolver().then((module) => module.default)
    },
    strictMode: true,
    layout: (name) => name === 'Admin/Login' ? undefined : AdminLayout,
})
