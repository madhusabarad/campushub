const menuItems = [
    { id: '1', name: 'Idli', price: 30, category: 'Food', isAvailable: true },
    { id: '2', name: 'Vada', price: 30, category: 'Food', isAvailable: true },
    { id: '3', name: 'Avalakki', price: 30, category: 'Food', isAvailable: true },
    { id: '4', name: 'Buns', price: 35, category: 'Food', isAvailable: true },
    { id: '5', name: 'Bajji', price: 35, category: 'Food', isAvailable: true },
    { id: '6', name: 'Samosa', price: 20, category: 'Food', isAvailable: true },
    { id: '7', name: 'Masala Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: '8', name: 'Open Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: '9', name: 'Set Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: '10', name: 'Pulav', price: 35, category: 'Food', isAvailable: true },
    { id: '11', name: 'Puri Kurma', price: 35, category: 'Food', isAvailable: true },
    { id: '12', name: 'Vada Pav', price: 30, category: 'Food', isAvailable: true },
    { id: '13', name: 'Fried Rice', price: 55, category: 'Food', isAvailable: true },
    { id: '14', name: 'Noodles', price: 55, category: 'Food', isAvailable: true },
    { id: '15', name: 'Bonda', price: 30, category: 'Food', isAvailable: true },
    { id: '16', name: 'Girmitt', price: 35, category: 'Food', isAvailable: true },

    { id: '17', name: 'Watermelon', price: 50, category: 'Juice', isAvailable: true },
    { id: '18', name: 'Pineapple', price: 50, category: 'Juice', isAvailable: true },
    { id: '19', name: 'Musambi', price: 50, category: 'Juice', isAvailable: true },
    { id: '20', name: 'Orange', price: 50, category: 'Juice', isAvailable: true },
    { id: '21', name: 'Lemon', price: 20, category: 'Juice', isAvailable: true },
    { id: '22', name: 'Lemon Soda', price: 20, category: 'Juice', isAvailable: true },
    { id: '23', name: 'Buttermilk', price: 30, category: 'Juice', isAvailable: true },

    { id: '24', name: 'Badam', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: '25', name: 'Banana', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: '26', name: 'Chikku', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: '27', name: 'Rose', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: '28', name: 'Strawberry', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: '29', name: 'Cold Coffee', price: 50, category: 'Milk Shakes', isAvailable: true },

    { id: '30', name: 'Tea', price: 10, category: 'Beverages', isAvailable: true },
    { id: '31', name: 'K.T.', price: 15, category: 'Beverages', isAvailable: true },
    { id: '32', name: 'Coffee', price: 20, category: 'Beverages', isAvailable: true },
]

function Menu() {
    const categories = ['Food', 'Juice', 'Milk Shakes', 'Beverages']

    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <p className="text-lg font-semibold text-[#641f2b]">CampusHub</p>
                    <p className="text-xs text-[#766d63]">Campus Canteen</p>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                        Menu
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-[#342c29] sm:text-4xl">
                        Campus Canteen
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766d63]">
                        Browse the available food and beverages from the campus canteen.
                    </p>
                </section>

                <div className="space-y-10">
                    {categories.map((category) => (
                        <section key={category}>
                            <h2 className="mb-4 text-xl font-semibold text-[#641f2b]">
                                {category}
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {menuItems
                                    .filter((item) => item.category === category)
                                    .map((item) => (
                                        <article
                                            key={item.id}
                                            className="border border-[#d8c9ba] bg-[#fbf8f3] p-5"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[#342c29]">
                                                        {item.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-[#766d63]">
                                                        {item.isAvailable ? 'Available' : 'Unavailable'}
                                                    </p>
                                                </div>

                                                <p className="text-base font-semibold text-[#641f2b]">
                                                    ₹{item.price}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={!item.isAvailable}
                                                className="mt-4 text-sm font-medium text-[#641f2b] disabled:cursor-not-allowed disabled:text-[#a8a099]"
                                            >
                                                Add to Cart
                                            </button>
                                        </article>
                                    ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </main>
    )
}

export default Menu