import inertia from '@inertiajs/vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '')
    const usePolling = env.VITE_USE_POLLING === 'true'

    return {
        plugins: [
            laravel({
                publicDirectory: '.',
                input: ['packages/core/resources/js/admin.tsx'],
                refresh: [
                    'packages/core/resources/views/**',
                    'packages/core/routes/**',
                    'packages/core/src/**',
                ],
            }),
            react(),
            inertia(),
        ],
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            hmr: {
                host: 'localhost',
                clientPort: 5173,
            },
            watch: usePolling
                ? {
                    usePolling: true,
                    interval: 100,
                }
                : undefined,
        },
    }
})
