import { useNavigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';

const shops = [
    {
        id: '1',
        name: 'Campus Canteen',
        category: 'canteen',
        description: 'Fresh meals and snacks for students.',
        isOpen: true,
    },
    {
        id: '2',
        name: 'Akshay Food Court',
        category: 'foodcourt',
        description: 'Explore food court outlets and their menus.',
        isOpen: false,
    },
    {
        id: '3',
        name: 'Campus Bakery',
        category: 'bakery',
        description: 'Bakery items and refreshments.',
        isOpen: true,
    },
]

function Shops() {
    const navigate = useNavigate();
    return (
        <main className="min-h-screen bg-background text-text">
            <header className="border-b border-border bg-surface">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-lg font-semibold text-primary">CampusHub</p>
                        <p className="text-xs text-muted-text">
                            Campus food outlets
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-secondary">
                        Shops
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-text sm:text-4xl">
                        Campus Outlets
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-text">
                        Browse available campus food outlets and explore their menus.
                    </p>
                </section>

                <section>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {shops.map((shop) => (
                            <article
                                key={shop.id}
                                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-secondary">
                                        {shop.category}
                                    </p>

                                    <span
                                        className={`text-xs font-semibold ${shop.isOpen
                                            ? 'text-emerald-700 dark:text-emerald-300'
                                            : 'text-muted-text'
                                            }`}
                                    >
                                        {shop.isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                <h2 className="mt-3 text-xl font-semibold text-text">
                                    {shop.name}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-muted-text">
                                    {shop.description}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/shops/${shop.id}/menu`)}
                                    className="mt-5 text-sm font-semibold text-primary transition hover:text-primary-hover hover:underline cursor-pointer"
                                >
                                    View Menu →
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Shops
