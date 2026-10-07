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
        name: 'Food Court',
        category: 'foodcourt',
        description: 'Explore food court outlets and their menus.',
        isOpen: true,
    },
    {
        id: '3',
        name: 'Campus Bakery',
        category: 'bakery',
        description: 'Bakery items and refreshments.',
        isOpen: false,
    },
]

function Shops({ onViewMenu }) {
    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <p className="text-lg font-semibold text-[#641f2b]">CampusHub</p>
                    <p className="text-xs text-[#766d63]">
                        Campus food outlets
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                        Shops
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-[#342c29] sm:text-4xl">
                        Campus Outlets
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766d63]">
                        Browse available campus food outlets and explore their menus.
                    </p>
                </section>

                <section>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {shops.map((shop) => (
                            <article
                                key={shop.id}
                                className="border border-[#d8c9ba] bg-[#fbf8f3] p-6 transition hover:-translate-y-1 hover:border-[#a86b75] hover:shadow-[0_12px_30px_rgba(68,45,38,0.08)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#8a4a55]">
                                        {shop.category}
                                    </p>

                                    <span
                                        className={`text-xs font-medium ${shop.isOpen
                                            ? 'text-[#3f6b45]'
                                            : 'text-[#8a8177]'
                                            }`}
                                    >
                                        {shop.isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                <h2 className="mt-3 text-xl font-semibold text-[#342c29]">
                                    {shop.name}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-[#766d63]">
                                    {shop.description}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => onViewMenu(shop.id)}
                                    className="mt-5 text-sm font-medium text-[#641f2b] transition hover:text-[#4f1721]"
                                >
                                    View Menu
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