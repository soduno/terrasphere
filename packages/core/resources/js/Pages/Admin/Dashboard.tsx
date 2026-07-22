import { Head } from '@inertiajs/react'

interface DashboardProps {
    cms: {
        name: string
        version: string
    }
}

export default function Dashboard({ cms }: DashboardProps) {
    return (
        <>
            <Head title="Administration" />

            <div className="admin-shell">
                <aside className="admin-sidebar">
                    <a className="admin-brand" href="/admin" aria-label={`${cms.name} administration`}>
                        <span className="admin-brand-mark">T</span>
                        <span>{cms.name}</span>
                    </a>

                    <nav aria-label="Administration">
                        <a className="admin-nav-link is-active" href="/admin">
                            <span>Overview</span>
                        </a>
                    </nav>

                    <p className="admin-version">Core {cms.version}</p>
                </aside>

                <main className="admin-content">
                    <header className="admin-header">
                        <div>
                            <p className="admin-eyebrow">Administration </p>
                            <h1>Welcome to {cms.name}</h1>
                        </div>
                        <span className="admin-status"><i /> System ready</span>
                    </header>

                    <section className="admin-card">
                        <p className="admin-eyebrow">Getting</p>
                        <h2>Your CMS backend is ready.</h2>
                        <p>
                            This page is rendered by React and Inertia. The public homepage remains
                            independent and continues to use the original TerraSphere Core view.
                        </p>
                    </section>
                </main>
            </div>
        </>
    )
}
