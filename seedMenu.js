require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Shop = require('./models/Shop');
const MenuItem = require('./models/MenuItem');

const catalog = {
  'Campus Canteen': {
    Food: [
      ['Idli (2 pieces)', 30], ['Vada', 30], ['Avalakki', 30],
      ['Buns', 35], ['Bajji (4 pieces)', 35], ['Samosa', 20],
      ['Masala Dosa', 55], ['Open Dosa', 55], ['Set Dosa', 55],
      ['Pulav', 35], ['Puri Kurma', 35], ['Fried Rice', 55],
      ['Noodles', 55], ['Girmit', 35], ['Vada Pav', 30], ['Bonda', 30],
    ],
    Juice: [
      ['Musambi Juice', 50], ['Orange Juice', 50],
      ['Lemon Juice', 20], ['Lemon Soda', 20],
    ],
    'Milk Shakes': [
      ['Badam Milkshake', 50], ['Banana Milkshake', 50],
      ['Chikoo Milkshake', 50], ['Rose Milkshake', 50],
      ['Strawberry Milkshake', 50],
    ],
    Beverages: [
      ['Butter Milk', 20], ['Coffee', 20], ['K Tea', 15],
      ['Tea', 10], ['Cold Coffee', 50],
    ],
  },

  'Campus Bakery': {
    Snacks: [
      ['Samosa', 25], ['Hot Dog', 30], ['Vada Pav', 30],
      ['Bonda', 30], ['Lafda', 26], ['Cheese Lafda', 38],
      ['Burger', 30], ['Cheese Burger', 42],
      ['Cheese Hot Dog', 42], ['Veg Puff', 18],
      ['Cold Pastry', 40], ['Puff Lafda', 44],
    ],
  },

  'Akshay Food Court': {
    Papad: [
      ['Fried Papad', 30], ['Roasted Papad', 35],
      ['Fried Masala Papad', 45], ['Roasted Masala Papad', 45],
    ],
    Fries: [
      ['Classic Fries', 80], ['Masala Fries', 95], ['Peri Peri', 100],
    ],
    Soup: [
      ['Tomato Soup', 80], ['Manchow Soup', 85],
      ['Mushroom Soup', 90], ['Lemon Coriander Soup', 90],
      ['Hot & Sour Soup', 90], ['Sweet Corn Soup', 90],
    ],
    'Gobi Starters': [
      ['Gobi Manchurian', 95], ['Gobi Chilli', 110],
      ['Gobi 65', 125], ['Gobi Urvala', 125],
    ],
    'Mushroom Starters': [
      ['Mushroom Manchurian', 130], ['Mushroom Chilli', 140],
      ['Mushroom 65', 145], ['Mushroom Pepper Dry', 145],
      ['Mushroom Urvala', 150],
    ],
    'Babycorn Starters': [
      ['Babycorn Manchurian', 125], ['Babycorn Chilli', 135],
      ['Babycorn 65', 140], ['Babycorn Pepper Dry', 145],
      ['Babycorn Urvala', 150],
    ],
    'Paneer Starters': [
      ['Paneer Manchurian', 145], ['Paneer Chilli', 150],
      ['Paneer 65', 160], ['Paneer Pepper Dry', 160],
      ['Paneer Urvala', 170], ['Paneer Savai Dry', 170],
      ['Paneer Chilli Millu', 180], ['Paneer Spicy Finger', 180],
      ['Paneer Ghee Roast', 190], ['Paneer Butter Garlic Roast', 190],
    ],
    'Fried Nuggets': [
      ['Veg Nuggets', 90], ['Veg Fingers', 90],
      ['Chilli Garlic Shots', 100], ['Cheese Corn Nuggets', 130],
    ],
    Momos: [
      ['Veg Momos', 75], ['Paneer Tikka Momos', 90],
      ['Cheese Corn Momos', 100],
    ],
    'Veg Dishes': [
      ['Veg Masala', 135], ['Veg Kadai', 145],
      ['Veg Makhanwala', 145], ['Veg Hyderabadi', 145],
      ['Veg Kolhapuri', 150], ['Veg Dry Masala', 170],
      ['Veg Tawa Masala', 170],
    ],
    'Mushroom Dishes': [
      ['Mushroom Masala', 150], ['Mushroom Kadai', 160],
      ['Mushroom Makhanwala', 160], ['Mushroom Hyderabadi', 160],
      ['Mushroom Kolhapuri', 160],
    ],
    'Babycorn Dishes': [
      ['Babycorn Masala', 140], ['Babycorn Kadai', 150],
      ['Babycorn Makhanwala', 150], ['Babycorn Hyderabadi', 150],
      ['Babycorn Kolhapuri', 150],
    ],
    'Paneer Dishes': [
      ['Paneer Masala', 150], ['Paneer Kadai', 160],
      ['Paneer Makhanwala', 160], ['Paneer Hyderabadi', 160],
      ['Paneer Kolhapuri', 160], ['Paneer Do Pyaza', 170],
      ['Paneer Butter Masala', 180], ['Paneer Kheema Masala', 180],
      ['Paneer Maharaja', 180], ['Paneer Burji', 180],
      ['Shahi Paneer', 200],
    ],
    'Kaju Dishes': [
      ['Kaju Masala', 170], ['Kaju Kadai', 180],
      ['Kaju Makhanwala', 180], ['Kaju Hyderabadi', 180],
      ['Kaju Kolhapuri', 180], ['Kaju Paneer Masala', 200],
      ['Kaju Paneer Kadai', 210], ['Kaju Paneer Hyderabadi', 210],
      ['Kaju Paneer Kolhapuri', 210],
    ],
    'Dal Dishes': [
      ['Dal Fry', 110], ['Dal Tadka', 120],
      ['Butter Dal Fry', 120], ['Butter Dal Tadka', 130],
      ['Dal Kolhapuri', 130],
    ],
    Roti: [
      ['Kerala Parotha', 20], ['Wheat Parotha', 20],
      ['Butter Parotha', 25], ['Ghee Parotha', 30],
      ['Aloo Parotha', 90], ['Paneer Parotha', 120],
    ],
    'Rice Items': [
      ['Veg Fried Rice', 90], ['Jeera Rice', 90],
      ['Masala Rice', 90], ['Onion Chilli Fried Rice', 90],
      ['Gobi Rice', 110], ['Dal Khichadi', 110],
      ['Palak Khichadi', 110], ['Curd Rice', 110],
      ['Ghee Rice', 110], ['Veg SZN Fried Rice', 110],
      ['Mushroom Fried Rice', 110], ['Paneer Fried Rice', 130],
      ['Tripple SZN Fried Rice', 135],
      ['Kaju Paneer Fried Rice', 140],
    ],
    Biriyani: [
      ['Veg Biryani', 110], ['Mushroom Biryani', 120],
      ['Green Peas Biryani', 120], ['Paneer Biryani', 135],
      ['Hyderabadi Biryani', 140], ['Kaju Paneer Biryani', 150],
    ],
    Noodles: [
      ['Hakka Noodles', 90], ['Garlic Noodles', 90],
      ['Chilli Garlic Noodles', 100], ['Gobi Noodles', 100],
      ['Pepper Noodles', 100], ['Mushroom Noodles', 110],
      ['Schezwan Noodles', 110], ['Paneer Noodles', 126],
      ['Hongkong Noodles', 125], ['Tripple SZN Noodles', 130],
    ],
    Beverages: [
      ['Water 500 ML', 10], ['Water 1000 ML', 20],
      ['Soft Drinks', 17], ['Soft Drinks PET', 22],
      ['Buttermilk', 30], ['Lassi', 40],
    ],
    Juice: [
      ['Watermelon Juice', 45], ['Pineapple Juice', 45],
      ['Mosambi Juice', 50], ['Orange Juice', 50],
      ['Apple Juice', 60],
    ],
    Milkshakes: [
      ['Orange Milkshake', 80], ['Apple Milkshake', 80],
      ['Green Apple Milkshake', 80], ['Mango Milkshake', 95],
      ['Chocolate Milkshake', 95], ['Cold Coffee', 95],
      ['White Chocolate Frappe', 100],
      ['Hazelnut Milkshake', 100], ['Irish Milkshake', 100],
      ['Vanilla Milkshake', 100],
    ],
    Smoothies: [
      ['Kiwi Smoothie', 80], ['Strawberry Smoothie', 80],
      ['Blueberry Smoothie', 90], ['Mango Smoothie', 90],
    ],
  },
};

const EXPECTED_COUNTS = {
  'Campus Canteen': 30,
  'Campus Bakery': 12,
  'Akshay Food Court': 147,
};

async function seedMenu() {
  try {
    await connectDB();

    let inserted = 0;
    let updated = 0;
    let removed = 0;

    for (const [shopName, categories] of Object.entries(catalog)) {
      const shop = await Shop.findOne({ name: shopName });

      if (!shop) {
        throw new Error(`Shop not found: ${shopName}`);
      }

      const entries = Object.entries(categories).flatMap(
        ([category, items]) =>
          items.map(([name, price]) => ({ name, price, category }))
      );

      const expected = EXPECTED_COUNTS[shopName];

      if (entries.length !== expected) {
        throw new Error(
          `${shopName}: catalogue has ${entries.length} items; expected ${expected}`
        );
      }

      const allowedNames = entries.map(item => item.name);

      // Remove obsolete items only from this shop.
      const deletion = await MenuItem.deleteMany({
        shopId: shop._id,
        name: { $nin: allowedNames },
      });

      removed += deletion.deletedCount || 0;

      // Insert or update every item in the supplied catalogue.
      for (const item of entries) {
        const result = await MenuItem.updateOne(
          { shopId: shop._id, name: item.name },
          {
            $set: {
              price: item.price,
              category: item.category,
            },
            $setOnInsert: {
              shopId: shop._id,
              name: item.name,
              isAvailable: true,
              imageUrl: '',
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) inserted++;
        else if (result.modifiedCount > 0) updated++;
      }

      const actualCount = await MenuItem.countDocuments({
        shopId: shop._id,
      });

      if (actualCount !== expected) {
        throw new Error(
          `${shopName}: database has ${actualCount} items; expected ${expected}`
        );
      }

      console.log(`✓ ${shopName}: ${actualCount}/${expected} items verified`);
    }

    console.log('\nMENU SYNCHRONIZATION COMPLETED');
    console.log('New items inserted:', inserted);
    console.log('Existing items updated:', updated);
    console.log('Obsolete items removed:', removed);
    console.log('Total expected items: 185');

  } catch (error) {
    console.error('Menu synchronization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedMenu();