import { useState } from 'react'
import Shops from './Shops.jsx'
import Menu from './Menu.jsx'

function Dashboard() {
    const [showShops, setShowShops] = useState(false)
    const [selectedShopId, setSelectedShopId] = useState(null)
    if (selectedShopId) {
        return <Menu />
    }

    if (showShops) {
        return <Shops onViewMenu={setSelectedShopId} />
    }
    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            {/* Header */}
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-lg font-semibold text-[#641f2b]">CampusHub</p>
                        <p className="text-xs text-[#766d63]">
                            Campus services, brought together.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="border border-[#cdbdaf] px-5 py-2 text-sm font-medium text-[#641f2b] transition hover:bg-[#f5efe7]"
                    >
                        Cart
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Welcome */}
                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                        Student Dashboard
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-[#342c29] sm:text-4xl">
                        Welcome back
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766d63]">
                        Access campus food, printing and ordering services from one place.
                    </p>
                </section>

                {/* Campus Services */}
                <section>
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-[#342c29]">
                            Campus Services
                        </h2>

                        <p className="mt-1 text-sm text-[#766d63]">
                            Browse available campus outlets and services.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Canteen */}
                        <button
                            type="button"
                            onClick={() => setShowShops(true)}
                            className="group border border-[#d8c9ba] bg-[#fbf8f3] p-6 text-left transition hover:-translate-y-1 hover:border-[#a86b75] hover:shadow-[0_12px_30px_rgba(68,45,38,0.08)]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-3 text-xl font-semibold text-[#342c29]">
                                Canteen
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#766d63]">
                                Browse available food items and place an order.
                            </p>

                            <span className="mt-5 inline-block text-sm font-medium text-[#641f2b]">
                                Browse
                            </span>
                        </button>

                        {/* Food Court */}
                        <button
                            type="button"
                            className="group border border-[#d8c9ba] bg-[#fbf8f3] p-6 text-left transition hover:-translate-y-1 hover:border-[#a86b75] hover:shadow-[0_12px_30px_rgba(68,45,38,0.08)]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-3 text-xl font-semibold text-[#342c29]">
                                Food Court
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#766d63]">
                                Explore food court outlets and their menus.
                            </p>

                            <span className="mt-5 inline-block text-sm font-medium text-[#641f2b]">
                                Browse
                            </span>
                        </button>

                        {/* Bakery */}
                        <button
                            type="button"
                            className="group border border-[#d8c9ba] bg-[#fbf8f3] p-6 text-left transition hover:-translate-y-1 hover:border-[#a86b75] hover:shadow-[0_12px_30px_rgba(68,45,38,0.08)]"
                        >
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#8a4a55]">
                                Food Service
                            </p>

                            <h3 className="mt-3 text-xl font-semibold text-[#342c29]">
                                Bakery
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#766d63]">
                                View bakery items and check their availability.
                            </p>

                            <span className="mt-5 inline-block text-sm font-medium text-[#641f2b]">
                                Browse
                            </span>
                        </button>
                    </div>
                </section>

                {/* Xerox */}
                <section className="mt-8">
                    <button
                        type="button"
                        className="w-full border border-[#d8c9ba] bg-[#641f2b] p-7 text-left text-[#f8f0e6] transition hover:bg-[#4f1721]"
                    >
                        <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#dfc9c0]">
                            Campus Service
                        </p>

                        <h2 className="mt-3 text-2xl font-semibold">
                            Xerox Services
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#eadbd3]">
                            Submit a printing or Xerox request through CampusHub.
                        </p>

                        <span className="mt-5 inline-block text-sm font-medium text-white">
                            Submit Request
                        </span>
                    </button>
                </section>

                {/* Recent Orders */}
                <section className="mt-10">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-[#342c29]">
                            Recent Orders
                        </h2>

                        <p className="mt-1 text-sm text-[#766d63]">
                            View your recent campus orders and their status.
                        </p>
                    </div>

                    <div className="border border-[#d8c9ba] bg-[#fbf8f3] px-6 py-10 text-center">
                        <p className="text-sm text-[#766d63]">
                            No recent orders to display.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Dashboard