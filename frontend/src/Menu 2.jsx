import { useState } from 'react'

const canteenMenu = [
    { id: 'canteen-1', name: 'Idli', price: 30, category: 'Food', isAvailable: true },
    { id: 'canteen-2', name: 'Vada', price: 30, category: 'Food', isAvailable: true },
    { id: 'canteen-3', name: 'Avalakki', price: 30, category: 'Food', isAvailable: true },
    { id: 'canteen-4', name: 'Buns', price: 35, category: 'Food', isAvailable: true },
    { id: 'canteen-5', name: 'Bajji', price: 35, category: 'Food', isAvailable: true },
    { id: 'canteen-6', name: 'Samosa', price: 20, category: 'Food', isAvailable: true },
    { id: 'canteen-7', name: 'Masala Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: 'canteen-8', name: 'Open Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: 'canteen-9', name: 'Set Dosa', price: 55, category: 'Food', isAvailable: true },
    { id: 'canteen-10', name: 'Pulav', price: 35, category: 'Food', isAvailable: true },
    { id: 'canteen-11', name: 'Puri Kurma', price: 35, category: 'Food', isAvailable: true },
    { id: 'canteen-12', name: 'Vada Pav', price: 30, category: 'Food', isAvailable: true },
    { id: 'canteen-13', name: 'Fried Rice', price: 55, category: 'Food', isAvailable: true },
    { id: 'canteen-14', name: 'Noodles', price: 55, category: 'Food', isAvailable: true },
    { id: 'canteen-15', name: 'Bonda', price: 30, category: 'Food', isAvailable: true },
    { id: 'canteen-16', name: 'Girmitt', price: 35, category: 'Food', isAvailable: true },
    { id: 'canteen-17', name: 'Watermelon', price: 50, category: 'Juice', isAvailable: true },
    { id: 'canteen-18', name: 'Pineapple', price: 50, category: 'Juice', isAvailable: true },
    { id: 'canteen-19', name: 'Musambi', price: 50, category: 'Juice', isAvailable: true },
    { id: 'canteen-20', name: 'Orange', price: 50, category: 'Juice', isAvailable: true },
    { id: 'canteen-21', name: 'Lemon', price: 20, category: 'Juice', isAvailable: true },
    { id: 'canteen-22', name: 'Lemon Soda', price: 20, category: 'Juice', isAvailable: true },
    { id: 'canteen-23', name: 'Buttermilk', price: 30, category: 'Juice', isAvailable: true },
    { id: 'canteen-24', name: 'Badam', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-25', name: 'Banana', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-26', name: 'Chikku', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-27', name: 'Rose', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-28', name: 'Strawberry', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-29', name: 'Cold Coffee', price: 50, category: 'Milk Shakes', isAvailable: true },
    { id: 'canteen-30', name: 'Tea', price: 10, category: 'Beverages', isAvailable: true },
    { id: 'canteen-31', name: 'K.T.', price: 15, category: 'Beverages', isAvailable: true },
    { id: 'canteen-32', name: 'Coffee', price: 20, category: 'Beverages', isAvailable: true },
]

const foodCourtMenu = [
    { id: 'foodcourt-1', name: 'Fried Papad', price: 30, category: 'Papad', isAvailable: true },
    { id: 'foodcourt-2', name: 'Roasted Papad', price: 35, category: 'Papad', isAvailable: true },
    { id: 'foodcourt-3', name: 'Fried Masala Papad', price: 45, category: 'Papad', isAvailable: true },
    { id: 'foodcourt-4', name: 'Roasted Masala Papad', price: 45, category: 'Papad', isAvailable: true },
    { id: 'foodcourt-5', name: 'Classic', price: 80, category: 'Fries', isAvailable: true },
    { id: 'foodcourt-6', name: 'Masala Fries', price: 95, category: 'Fries', isAvailable: true },
    { id: 'foodcourt-7', name: 'Peri Peri', price: 100, category: 'Fries', isAvailable: true },
    { id: 'foodcourt-8', name: 'Mayonaise', price: 10, category: 'Fries', isAvailable: true },
    { id: 'foodcourt-9', name: 'Tomato Soup', price: 80, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-10', name: 'Manchow Soup', price: 85, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-11', name: 'Mushroom Soup', price: 90, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-12', name: 'Lemon Corrinder Soup', price: 90, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-13', name: 'Hot & Sour Soup', price: 90, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-14', name: 'Sweet Corn Soup', price: 90, category: 'Soup', isAvailable: true },
    { id: 'foodcourt-15', name: 'Gobi Manchurian', price: 95, category: 'Gobi Starters', isAvailable: true },
    { id: 'foodcourt-16', name: 'Gobi Chilli', price: 110, category: 'Gobi Starters', isAvailable: true },
    { id: 'foodcourt-17', name: 'Gobi 65', price: 125, category: 'Gobi Starters', isAvailable: true },
    { id: 'foodcourt-18', name: 'Gobi Urvala', price: 135, category: 'Gobi Starters', isAvailable: true },
    { id: 'foodcourt-19', name: 'Mushroom Manchurian', price: 130, category: 'Mushroom Starters', isAvailable: true },
    { id: 'foodcourt-20', name: 'Mushroom Chilli', price: 140, category: 'Mushroom Starters', isAvailable: true },
    { id: 'foodcourt-21', name: 'Mushroom 65', price: 145, category: 'Mushroom Starters', isAvailable: true },
    { id: 'foodcourt-22', name: 'Mushroom Pepper Dry', price: 145, category: 'Mushroom Starters', isAvailable: true },
    { id: 'foodcourt-23', name: 'Mushroom Urvala', price: 150, category: 'Mushroom Starters', isAvailable: true },
    { id: 'foodcourt-24', name: 'Babycorn Manchurian', price: 125, category: 'Babycorn Starters', isAvailable: true },
    { id: 'foodcourt-25', name: 'Babycorn Chilli', price: 135, category: 'Babycorn Starters', isAvailable: true },
    { id: 'foodcourt-26', name: 'Babycorn 65', price: 140, category: 'Babycorn Starters', isAvailable: true },
    { id: 'foodcourt-27', name: 'Babycorn Pepper Dry', price: 145, category: 'Babycorn Starters', isAvailable: true },
    { id: 'foodcourt-28', name: 'Babycorn Urvala', price: 150, category: 'Babycorn Starters', isAvailable: true },
    { id: 'foodcourt-29', name: 'Paneer Manchurian', price: 145, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-30', name: 'Paneer Chilli', price: 150, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-31', name: 'Paneer 65', price: 160, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-32', name: 'Paneer Pepper Dry', price: 160, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-33', name: 'Paneer Urvala', price: 170, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-34', name: 'Paneer Savaji Dry', price: 170, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-35', name: 'Paneer Chilli Milli', price: 180, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-36', name: 'Paneer Spicy Finger', price: 180, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-37', name: 'Paneer Ghee Roast', price: 190, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-38', name: 'Paneer Buttler Garlic Roast', price: 190, category: 'Paneer Starters', isAvailable: true },
    { id: 'foodcourt-39', name: 'Veg Nuggets', price: 90, category: 'Fried Nuggets', isAvailable: true },
    { id: 'foodcourt-40', name: 'Veg Fingers', price: 90, category: 'Fried Nuggets', isAvailable: true },
    { id: 'foodcourt-41', name: 'Chilli Garlic Shots', price: 100, category: 'Fried Nuggets', isAvailable: true },
    { id: 'foodcourt-42', name: 'Cheese Corn Nuggets', price: 130, category: 'Fried Nuggets', isAvailable: true },
    { id: 'foodcourt-43', name: 'Veg Momos', price: 75, category: 'Momos', isAvailable: true },
    { id: 'foodcourt-44', name: 'Paneer Tikka Momos', price: 90, category: 'Momos', isAvailable: true },
    { id: 'foodcourt-45', name: 'Cheese Corn Momos', price: 100, category: 'Momos', isAvailable: true },
    { id: 'foodcourt-46', name: 'Veg Masala', price: 135, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-47', name: 'Veg Kadai', price: 145, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-48', name: 'Veg Makhanwala', price: 145, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-49', name: 'Veg Hyderabadi', price: 145, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-50', name: 'Veg Kolhapuri', price: 150, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-51', name: 'Veg Dry Masala', price: 170, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-52', name: 'Veg Tawa Masala', price: 170, category: 'Veg Dishes', isAvailable: true },
    { id: 'foodcourt-53', name: 'Mushroom Masala', price: 150, category: 'Mushroom Dishes', isAvailable: true },
    { id: 'foodcourt-54', name: 'Mushroom Kadai', price: 160, category: 'Mushroom Dishes', isAvailable: true },
    { id: 'foodcourt-55', name: 'Mushroom Makhanwala', price: 160, category: 'Mushroom Dishes', isAvailable: true },
    { id: 'foodcourt-56', name: 'Mushroom Hyderabadi', price: 160, category: 'Mushroom Dishes', isAvailable: true },
    { id: 'foodcourt-57', name: 'Mushroom Kolhapuri', price: 160, category: 'Mushroom Dishes', isAvailable: true },
    { id: 'foodcourt-58', name: 'Babycorn Masala', price: 140, category: 'Babycorn Dishes', isAvailable: true },
    { id: 'foodcourt-59', name: 'Babycorn Kadai', price: 150, category: 'Babycorn Dishes', isAvailable: true },
    { id: 'foodcourt-60', name: 'Babycorn Makhanwala', price: 150, category: 'Babycorn Dishes', isAvailable: true },
    { id: 'foodcourt-61', name: 'Babycorn Hyderabadi', price: 150, category: 'Babycorn Dishes', isAvailable: true },
    { id: 'foodcourt-62', name: 'Babycorn Kolhapuri', price: 150, category: 'Babycorn Dishes', isAvailable: true },
    { id: 'foodcourt-63', name: 'Paneer Masala', price: 150, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-64', name: 'Paneer Kadai', price: 160, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-65', name: 'Paneer Makhanwala', price: 160, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-66', name: 'Paneer Hyderabadi', price: 160, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-67', name: 'Paneer Kolhapuri', price: 160, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-68', name: 'Paneer Do Pyaja', price: 170, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-69', name: 'Paneer Butter Masala', price: 180, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-70', name: 'Paneer Kheema Masala', price: 180, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-71', name: 'Paneer Maharaja', price: 180, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-72', name: 'Paneer Burji', price: 180, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-73', name: 'Shahi Paneer', price: 200, category: 'Paneer Dishes', isAvailable: true },
    { id: 'foodcourt-74', name: 'Kaju Masala', price: 170, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-75', name: 'Kaju Kadai', price: 180, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-76', name: 'Kaju Makhanwala', price: 180, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-77', name: 'Kaju Hyderabadi', price: 180, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-78', name: 'Kaju Kolhapuri', price: 180, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-79', name: 'Kaju Paneer Masala', price: 200, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-80', name: 'Kaju Paneer Kadai', price: 210, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-81', name: 'Kaju Paneer Hyderabadi', price: 210, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-82', name: 'Kaju Paneer Kolhapuri', price: 210, category: 'Kaju Dishes', isAvailable: true },
    { id: 'foodcourt-83', name: 'Dal Fry', price: 110, category: 'Dal Dishes', isAvailable: true },
    { id: 'foodcourt-84', name: 'Dal Tadka', price: 120, category: 'Dal Dishes', isAvailable: true },
    { id: 'foodcourt-85', name: 'Butter Dal Fry', price: 120, category: 'Dal Dishes', isAvailable: true },
    { id: 'foodcourt-86', name: 'Butter Dal Tadka', price: 130, category: 'Dal Dishes', isAvailable: true },
    { id: 'foodcourt-87', name: 'Dal Kolhapuri', price: 130, category: 'Dal Dishes', isAvailable: true },
    { id: 'foodcourt-88', name: 'Kerala Parotha', price: 20, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-89', name: 'Wheat Parotha', price: 20, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-90', name: 'Butter Parotha', price: 25, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-91', name: 'Ghee Parotha', price: 30, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-92', name: 'Aloo Parotha', price: 90, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-93', name: 'Paneer Parotha', price: 120, category: 'Roti', isAvailable: true },
    { id: 'foodcourt-94', name: 'Veg Fried Rice', price: 90, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-95', name: 'Jeera Rice', price: 90, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-96', name: 'Masala Rice', price: 90, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-97', name: 'Onion Chilli Fried Rice', price: 90, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-98', name: 'Gobi Rice', price: 110, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-99', name: 'Dal Khichadi', price: 110, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-100', name: 'Palak Khichadi', price: 110, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-101', name: 'Curd Rice', price: 110, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-102', name: 'Ghee Rice', price: 120, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-103', name: 'Veg Szn Fried Rice', price: 120, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-104', name: 'Mushroom Fried Rice', price: 120, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-105', name: 'Paneer Fried Rice', price: 130, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-106', name: 'Tripple Szn Fried Rice', price: 135, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-107', name: 'Kaju Paneer Fried Rice', price: 140, category: 'Rice Items', isAvailable: true },
    { id: 'foodcourt-108', name: 'Veg Biriyani', price: 110, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-109', name: 'Mushroom Biriyani', price: 120, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-110', name: 'Green Peas Biriyani', price: 120, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-111', name: 'Paneer Biriyani', price: 135, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-112', name: 'Hyderabadi Biriyani', price: 140, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-113', name: 'Kaju Paneer Biriyani', price: 150, category: 'Biriyani Items', isAvailable: true },
    { id: 'foodcourt-114', name: 'Hakka Noodles', price: 90, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-115', name: 'Garlic Noodles', price: 90, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-116', name: 'Chilli Garlic Noodles', price: 100, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-117', name: 'Gobi Noodles', price: 100, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-118', name: 'Pepper Noodles', price: 100, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-119', name: 'Mushroom Noodles', price: 110, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-120', name: 'Schezwan Noodles', price: 110, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-121', name: 'Paneer Noodles', price: 120, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-122', name: 'Hongkong Noodles', price: 125, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-123', name: 'Tripple Szn Noodles', price: 130, category: 'Noodles', isAvailable: true },
    { id: 'foodcourt-124', name: 'Water 500 ml', price: 10, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-125', name: 'Water 1000 ml', price: 20, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-126', name: 'Soft Drinks', price: 17, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-127', name: 'Soft Drinks PET', price: 22, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-128', name: 'Buttermilk', price: 30, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-129', name: 'Lassi', price: 40, category: 'Beverages', isAvailable: true },
    { id: 'foodcourt-130', name: 'Watermelon', price: 45, category: 'Juice', isAvailable: true },
    { id: 'foodcourt-131', name: 'Pineapple', price: 45, category: 'Juice', isAvailable: true },
    { id: 'foodcourt-132', name: 'Mosambi', price: 50, category: 'Juice', isAvailable: true },
    { id: 'foodcourt-133', name: 'Orange', price: 50, category: 'Juice', isAvailable: true },
    { id: 'foodcourt-134', name: 'Apple', price: 60, category: 'Juice', isAvailable: true },
    { id: 'foodcourt-135', name: 'Mango', price: null, priceLabel: 'APS.', category: 'Juice', isAvailable: false },
    { id: 'foodcourt-136', name: 'Orange', price: 80, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-137', name: 'Apple', price: 80, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-138', name: 'Green Apple', price: 80, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-139', name: 'Mango', price: 95, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-140', name: 'Chocolate', price: 95, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-141', name: 'Cold Coffee', price: 95, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-142', name: 'White Chocolate Frappe', price: 100, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-143', name: 'Hazelnut', price: 100, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-144', name: 'Irish', price: 100, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-145', name: 'Vanilla', price: 100, category: 'Milkshakes', isAvailable: true },
    { id: 'foodcourt-146', name: 'Kiwi', price: 80, category: 'Smoothies', isAvailable: true },
    { id: 'foodcourt-147', name: 'Strawberry', price: 80, category: 'Smoothies', isAvailable: true },
    { id: 'foodcourt-148', name: 'Blueberry', price: 90, category: 'Smoothies', isAvailable: true },
    { id: 'foodcourt-149', name: 'Mango', price: 90, category: 'Smoothies', isAvailable: true },
]

const bakeryMenu = [
    { id: 'bakery-1', name: 'Samosa', price: 25, category: 'Bakery', isAvailable: true },
    { id: 'bakery-2', name: 'Lafda', price: 26, category: 'Bakery', isAvailable: true },
    { id: 'bakery-3', name: 'Cheese Lafda', price: 38, category: 'Bakery', isAvailable: true },
    { id: 'bakery-4', name: 'Burger', price: 30, category: 'Bakery', isAvailable: true },
    { id: 'bakery-5', name: 'Cheese Burger', price: 42, category: 'Bakery', isAvailable: true },
    { id: 'bakery-6', name: 'Hot Dog', price: 30, category: 'Bakery', isAvailable: true },
    { id: 'bakery-7', name: 'Cheese Hot Dog', price: 42, category: 'Bakery', isAvailable: true },
    { id: 'bakery-8', name: 'Veg Puff', price: 18, category: 'Bakery', isAvailable: true },
    { id: 'bakery-9', name: 'Cold Pastry', price: 40, category: 'Bakery', isAvailable: true },
    { id: 'bakery-10', name: 'Sandvege', price: 18, category: 'Bakery', isAvailable: true },
    { id: 'bakery-11', name: 'Cheese Sandvege', price: 30, category: 'Bakery', isAvailable: true },
    { id: 'bakery-12', name: 'Puff Lafda', price: 44, category: 'Bakery', isAvailable: true },
]

const shopData = {
    '1': {
        name: 'Campus Canteen',
        description: 'Browse the available food and beverages from the campus canteen.',
        menu: canteenMenu,
        categories: ['Food', 'Juice', 'Milk Shakes', 'Beverages'],
    },
    '2': {
        name: 'Akshay Food Court',
        description: 'Explore the food, snacks, beverages and other items available at Akshay Food Court.',
        menu: foodCourtMenu,
        categories: [
            'Papad', 'Fries', 'Soup', 'Gobi Starters', 'Mushroom Starters',
            'Babycorn Starters', 'Paneer Starters', 'Fried Nuggets', 'Momos',
            'Veg Dishes', 'Mushroom Dishes', 'Babycorn Dishes', 'Paneer Dishes',
            'Kaju Dishes', 'Dal Dishes', 'Roti', 'Rice Items', 'Biriyani Items',
            'Noodles', 'Beverages', 'Juice', 'Milkshakes', 'Smoothies',
        ],
    },
    '3': {
        name: 'Campus Bakery',
        description: 'Browse snacks, bakery items, burgers and refreshments from the campus bakery.',
        menu: bakeryMenu,
        categories: ['Bakery'],
    },
}

function Menu({ shopId, onBack }) {
    const [cart, setCart] = useState([])

    const currentShop = shopData[shopId] || shopData['1']
    const menuItems = currentShop.menu
    const categories = currentShop.categories

    const addToCart = (item) => {
        if (!item.isAvailable || item.price === null) return

        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (cartItem) => cartItem.id === item.id
            )

            if (existingItem) {
                return currentCart.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
            }

            return [...currentCart, { ...item, quantity: 1 }]
        })
    }

    const increaseQuantity = (itemId) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === itemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        )
    }

    const decreaseQuantity = (itemId) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        )
    }

    const removeFromCart = (itemId) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== itemId)
        )
    }

    const cartItemCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    )

    const cartTotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    )

    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <p className="text-lg font-semibold text-[#641f2b]">
                        CampusHub
                    </p>
                    <p className="text-xs text-[#766d63]">
                        {currentShop.name}
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-6 text-sm font-medium text-[#641f2b]"
                >
                    ← Back to Dashboard
                </button>

                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                        Menu
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-[#342c29] sm:text-4xl">
                        {currentShop.name}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766d63]">
                        {currentShop.description}
                    </p>
                </section>

                <div className="space-y-10">
                    {categories.map((category) => {
                        const categoryItems = menuItems.filter(
                            (item) => item.category === category
                        )

                        if (categoryItems.length === 0) return null

                        return (
                            <section key={category}>
                                <h2 className="mb-4 text-xl font-semibold text-[#641f2b]">
                                    {category}
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {categoryItems.map((item) => (
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
                                                        {item.price === null
                                                            ? 'Price unavailable'
                                                            : item.isAvailable
                                                                ? 'Available'
                                                                : 'Unavailable'}
                                                    </p>
                                                </div>

                                                <p className="text-base font-semibold text-[#641f2b]">
                                                    {item.price === null
                                                        ? item.priceLabel
                                                        : `₹${item.price}`}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    !item.isAvailable ||
                                                    item.price === null
                                                }
                                                onClick={() => addToCart(item)}
                                                className="mt-4 text-sm font-medium text-[#641f2b] disabled:cursor-not-allowed disabled:text-[#a8a099]"
                                            >
                                                {item.price === null
                                                    ? 'Price unavailable'
                                                    : 'Add to Cart'}
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>

                {cart.length > 0 && (
                    <section className="mt-12 border border-[#d8c9ba] bg-[#fbf8f3] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                                    Cart
                                </p>

                                <h2 className="mt-1 text-2xl font-semibold text-[#342c29]">
                                    Your Cart
                                </h2>
                            </div>

                            <p className="text-sm text-[#766d63]">
                                {cartItemCount} item(s)
                            </p>
                        </div>

                        <div className="mt-6 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-4 border-b border-[#e2d7ca] pb-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold text-[#342c29]">
                                            {item.name}
                                        </h3>

                                        <p className="text-sm text-[#766d63]">
                                            ₹{item.price} each
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border border-[#d8c9ba]">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQuantity(item.id)
                                                }
                                                className="px-3 py-2 text-lg text-[#641f2b] hover:bg-[#f5efe7]"
                                            >
                                                −
                                            </button>

                                            <span className="min-w-10 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQuantity(item.id)
                                                }
                                                className="px-3 py-2 text-lg text-[#641f2b] hover:bg-[#f5efe7]"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="min-w-16 text-right font-semibold text-[#641f2b]">
                                            ₹{item.price * item.quantity}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="text-sm font-medium text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-[#d8c9ba] pt-5">
                            <p className="font-semibold text-[#342c29]">
                                Total
                            </p>

                            <p className="text-xl font-semibold text-[#641f2b]">
                                ₹{cartTotal}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </main>
    )
}

export default Menu