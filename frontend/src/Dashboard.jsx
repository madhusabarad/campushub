function Dashboard({ onOpenMenu, onLogout }) {
    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-lg font-semibold text-[#641f2b]">
                            CampusHub
                        </p>

                        <p className="text-xs text-[#766d63]">
                            Campus services, brought together.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="border border-[#cdbdaf] px-5 py-2 text-sm font-medium text-[#641f2b] transition hover:bg-[#f5efe7]"
                        >
                            Cart
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="border border-[#cdbdaf] px-5 py-2 text-sm font-medium text-[#641f2b] transition hover:bg-[#f5efe7]"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-12">
                <section>
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#8a4a55]">
                        Student Dashboard
                    </p>

                    <h1 className="font-serif text-4xl font-semibold text-[#342c29] sm:text-5xl">
                        Welcome back
                    </h1>

                    <p className="mt-4 text-base text-[#766d63]">
                        Access campus food, printing and ordering services from one place.
                    </p>
                </section>

                <section className="mt-14">
                    <h2 className="text-2xl font-semibold text-[#342c29]">
                        Campus Services
                    </h2>

                    <p className="mt-2 text-base text-[#766d63]">
                        Browse available campus outlets and services.
                    </p>

                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => onOpenMenu('1')}
                            className="border border-[#d8c9ba] bg-[#fbf8f3] p-7 text-left transition hover:-translate-y-1 hover:border-[#641f2b]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-5 text-2xl font-semibold text-[#342c29]">
                                Canteen
                            </h3>

                            <p className="mt-4 text-base leading-7 text-[#766d63]">
                                Browse available food items and place an order.
                            </p>

                            <p className="mt-7 text-base font-medium text-[#641f2b]">
                                Browse
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => onOpenMenu('2')}
                            className="border border-[#d8c9ba] bg-[#fbf8f3] p-7 text-left transition hover:-translate-y-1 hover:border-[#641f2b]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-5 text-2xl font-semibold text-[#342c29]">
                                Food Court
                            </h3>

                            <p className="mt-4 text-base leading-7 text-[#766d63]">
                                Explore food court outlets and their menus.
                            </p>

                            <p className="mt-7 text-base font-medium text-[#641f2b]">
                                Browse
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => onOpenMenu('3')}
                            className="border border-[#d8c9ba] bg-[#fbf8f3] p-7 text-left transition hover:-translate-y-1 hover:border-[#641f2b]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-5 text-2xl font-semibold text-[#342c29]">
                                Bakery
                            </h3>

                            <p className="mt-4 text-base leading-7 text-[#766d63]">
                                View bakery items and check their availability.
                            </p>

                            <p className="mt-7 text-base font-medium text-[#641f2b]">
                                Browse
                            </p>
                        </button>
                    </div>
                </section>

                <section className="mt-10 bg-[#641f2b] px-8 py-9 text-[#f8f0e6]">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e1c7bd]">
                        Campus Service
                    </p>

                    <h2 className="mt-5 text-2xl font-semibold">
                        Xerox Services
                    </h2>

                    <p className="mt-4 text-base leading-7 text-[#eadbd3]">
                        Submit a printing or Xerox request through CampusHub.
                    </p>

                    <button
                        type="button"
                        className="mt-7 text-base font-semibold text-white"
                    >
                        Submit Request
                    </button>
                </section>

                <section className="mt-14">
                    <h2 className="text-2xl font-semibold text-[#342c29]">
                        Recent Orders
                    </h2>

                    <p className="mt-2 text-base text-[#766d63]">
                        View your recent campus orders and their status.
                    </p>

                    <div className="mt-6 flex min-h-28 items-center justify-center border border-[#d8c9ba] bg-[#fbf8f3] px-6">
                        <p className="text-base text-[#766d63]">
                            No recent orders to display.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Dashboard