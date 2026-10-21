function Dashboard({ onOpenMenu, onOpenCart, onLogout }) {
    return (
        <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">

            {/* Header */}
            <header className="border-b border-[#eadfd2] bg-[#fffaf4]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

                    <div>
                        <h1 className="text-2xl font-bold text-[#7b1e1e]">
                            CampusHub
                        </h1>

                        <p className="text-sm text-gray-500">
                            Your campus, connected
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onOpenCart}
                            className="rounded-xl border border-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-[#7b1e1e] transition hover:bg-[#7b1e1e] hover:text-white"
                        >
                            Cart
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-xl bg-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#641818]"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-10">

                {/* Welcome */}
                <section className="mb-10">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b5e3c]">
                        Student Dashboard
                    </p>

                    <h2 className="text-4xl font-bold text-[#3f2720]">
                        Welcome to CampusHub
                    </h2>

                    <p className="mt-3 max-w-2xl text-gray-600">
                        Access campus services, explore food outlets and manage
                        your campus activities from one place.
                    </p>
                </section>

                {/* Campus Services */}
                <section className="mb-12">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold">
                            Campus Services
                        </h3>

                        <p className="mt-1 text-gray-500">
                            Explore the services available on campus.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">

                        {/* Campus Canteen */}
                        <button
                            type="button"
                            onClick={() => onOpenMenu('1')}
                            className="group rounded-2xl border border-[#eadfd2] bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7e7d5] text-2xl">
                                🍽️
                            </div>

                            <h4 className="text-xl font-bold text-[#3f2720]">
                                Campus Canteen
                            </h4>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Browse food and beverages available at the
                                campus canteen.
                            </p>

                            <span className="mt-5 inline-block text-sm font-semibold text-[#7b1e1e] group-hover:underline">
                                View Menu →
                            </span>
                        </button>

                        {/* Akshay Food Court */}
                        <button
                            type="button"
                            onClick={() => onOpenMenu('2')}
                            className="group rounded-2xl border border-[#eadfd2] bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7e7d5] text-2xl">
                                🍛
                            </div>

                            <h4 className="text-xl font-bold text-[#3f2720]">
                                Akshay Food Court
                            </h4>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Explore meals, snacks and drinks from the food
                                court.
                            </p>

                            <span className="mt-5 inline-block text-sm font-semibold text-[#7b1e1e] group-hover:underline">
                                View Menu →
                            </span>
                        </button>

                        {/* Campus Bakery */}
                        <button
                            type="button"
                            onClick={() => onOpenMenu('3')}
                            className="group rounded-2xl border border-[#eadfd2] bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7e7d5] text-2xl">
                                🥐
                            </div>

                            <h4 className="text-xl font-bold text-[#3f2720]">
                                Campus Bakery
                            </h4>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Find bakery items, snacks and refreshments
                                around campus.
                            </p>

                            <span className="mt-5 inline-block text-sm font-semibold text-[#7b1e1e] group-hover:underline">
                                View Menu →
                            </span>
                        </button>

                    </div>
                </section>

                {/* Xerox */}
                <section className="mb-12">
                    <div className="rounded-2xl border border-[#eadfd2] bg-white p-7 shadow-sm">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
                                    Campus Service
                                </p>

                                <h3 className="mt-2 text-2xl font-bold">
                                    Xerox & Printing
                                </h3>

                                <p className="mt-2 max-w-2xl text-gray-500">
                                    Access printing and Xerox services available
                                    around your campus.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white transition hover:bg-[#641818]"
                            >
                                Explore Service
                            </button>

                        </div>
                    </div>
                </section>

                {/* Recent Orders */}
                <section>
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold">
                            Recent Orders
                        </h3>

                        <p className="mt-1 text-gray-500">
                            Your recent campus orders will appear here.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-[#d9cabb] bg-[#fffaf4] px-6 py-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e3d5] text-2xl">
                            🛍️
                        </div>

                        <h4 className="text-lg font-semibold">
                            No recent orders
                        </h4>

                        <p className="mt-2 text-sm text-gray-500">
                            Your completed orders will appear here.
                        </p>
                    </div>
                </section>

            </div>
        </main>
    )
}

export default Dashboard