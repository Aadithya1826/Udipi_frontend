import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/pages.css'



function Agent() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! Welcome to Data Udipi. I'm your AI assistant. You can speak or tap to place your order. Would you like to start ordering?" }
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMutedState] = useState(false)
  const isMutedRef = useRef(false)

  const setIsMuted = (val) => {
    setIsMutedState(val)
    isMutedRef.current = val
    if (val && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }
  const menuCategories = [
    { id: 'all', name: 'All Menu', image: '/all menu.png' },
    { id: 'breakfast', name: 'Breakfast', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1820b89024cc5339a94c47a80adb10aba6f8042d?width=56' },
    { id: 'lunch', name: 'Lunch', image: 'https://api.builder.io/api/v1/image/assets/TEMP/9a0ee0aa828487dab39d472d95da26cf07415c74?width=60' },
    { id: 'dinner', name: 'Dinner', image: 'https://api.builder.io/api/v1/image/assets/TEMP/9a0ee0aa828487dab39d472d95da26cf07415c74?width=60' },
    { id: 'dosa', name: 'Dosa Items', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2d500d13886ec067b22dd67f6a166c11b0f9b45d?width=60' },
    { id: 'idli', name: 'Idli Vada', image: 'https://api.builder.io/api/v1/image/assets/TEMP/27367cc54b8e147348fc3e7f4204f887f2ac8e8e?width=60' },
    { id: 'rice', name: 'Rice Varieties', image: 'https://api.builder.io/api/v1/image/assets/TEMP/0edd96fa4b3ffa901423fd4881c6d955491e6e1a?width=60' },
    { id: 'soups', name: 'Soups', image: 'https://api.builder.io/api/v1/image/assets/TEMP/c510db97793b377653fc5f0c65b8c4d15a824066?width=64' },
    { id: 'snacks', name: 'Evening Snacks', image: 'https://api.builder.io/api/v1/image/assets/TEMP/27367cc54b8e147348fc3e7f4204f887f2ac8e8e?width=60' },
    { id: 'beverages', name: 'Hot Beverages', image: 'https://api.builder.io/api/v1/image/assets/TEMP/58ad416ecf88446de0263b4c58f739ac0367dc85?width=76' },
    { id: 'south_indian', name: 'South Indian', image: 'https://api.builder.io/api/v1/image/assets/TEMP/27367cc54b8e147348fc3e7f4204f887f2ac8e8e?width=60' },
    { id: 'north_indian', name: 'North Indian', image: 'https://api.builder.io/api/v1/image/assets/TEMP/d336e816ad2b8c1c7a1574a5ca70d48b8417727e?width=60' },
    { id: 'salads', name: 'Salads', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1b9e3dd130bd6e3974d4d882c7802b41dd02efb8?width=62' },
    { id: 'raitha', name: 'Raitha', image: 'https://api.builder.io/api/v1/image/assets/TEMP/8c5519d27ce15b60f634a01e7c39f017a0e0288d?width=62' },
    { id: 'noodles', name: 'Noodles', image: 'https://api.builder.io/api/v1/image/assets/TEMP/d163b3245d78624c4197ea728805f00568fa30d7?width=68' }
  ];

  const menuItems = {
    breakfast: [
      { id: 101, name: 'Idly (2)', price: 40, description: 'Soft steamed rice cakes served with sambar & chutney.', tags: ['Breakfast', 'Steamed'], available: true },
      { id: 102, name: 'Sambar Idly (2)', price: 60, description: 'Idlies soaked in aromatic lentil sambar.', tags: ['Breakfast', 'Sambar'], available: true },
      { id: 103, name: 'Spl. Mini Sambar Idly', price: 65, description: 'Mini idlies dunked in rich, flavorful sambar.', tags: ['Breakfast', 'Special'], available: true },
      { id: 104, name: 'Vadai', price: 30, description: 'Crispy deep-fried urad dal fritters.', tags: ['Breakfast', 'Crispy'], available: true },
      { id: 105, name: 'Pongal', price: 70, description: 'Creamy rice & lentil dish tempered with ghee, pepper & cumin.', tags: ['Breakfast', 'Comfort'], available: true },
      { id: 106, name: 'Sambar Vadai (1)', price: 40, description: 'Crispy vada soaked in tangy sambar.', tags: ['Breakfast', 'Sambar'], available: true },
      { id: 107, name: 'Curd Vadai (1)', price: 40, description: 'Soft vada soaked in seasoned yogurt.', tags: ['Breakfast', 'Curd'], available: true },
      { id: 108, name: 'Spl. Vada', price: 35, description: 'Special crispy vada with a unique spice blend.', tags: ['Breakfast', 'Special'], available: true },
      { id: 109, name: 'Poori Masala', price: 80, description: 'Fluffy deep-fried bread with spiced potato masala.', tags: ['Breakfast', 'Poori'], available: true },
      { id: 110, name: 'Special Soda Dosai', price: 70, description: 'Extra crispy dosa made with soda for a light, airy texture.', tags: ['Breakfast', 'Crispy'], available: true },
      { id: 111, name: 'Special Masala Dosai', price: 80, description: 'Golden dosa filled with spiced potato masala.', tags: ['Breakfast', 'Masala'], available: true },
      { id: 112, name: 'Rava Dosai', price: 85, description: 'Crispy semolina dosa with onions & spices.', tags: ['Breakfast', 'Rava'], available: true },
      { id: 113, name: 'Idiyappam with Kurma', price: 70, description: 'Delicate string hoppers served with vegetable kurma.', tags: ['Dinner', 'Kurma'], available: true },
      { id: 114, name: 'Podi Idly', price: 65, description: 'Idlies tossed in aromatic spice powder and sesame oil.', tags: ['Breakfast', 'Spicy'], available: true },
      { id: 115, name: 'Idly Vadacurry', price: 60, description: 'Soft idlies with rich & hearty vadacurry.', tags: ['Breakfast', 'Curry'], available: true },
      { id: 116, name: 'Dosa Vadacurry', price: 80, description: 'Crispy dosa served with aromatic vadacurry.', tags: ['Breakfast', 'Curry'], available: true },
      { id: 117, name: 'Poori Vadacurry', price: 90, description: 'Fluffy pooris paired with spiced vadacurry.', tags: ['Breakfast', 'Curry'], available: true },
      { id: 118, name: 'Idiyappam Vadacurry', price: 75, description: 'String hoppers served with flavorful vadacurry.', tags: ['Dinner', 'Curry'], available: true },
      { id: 119, name: 'Kuli Paniyaram', price: 60, description: 'Golden pan-fried rice & lentil dumplings.', tags: ['Snack', 'Pan-fried'], available: true },
      { id: 120, name: 'Appam (1)', price: 40, description: 'Soft, lacy fermented rice pancake with crispy edges.', tags: ['Dinner', 'Fermented'], available: true },
    ],
    bd_specials: [
      { id: 201, name: 'Gobi Mushroom Dosai', price: 135, description: 'Dosa loaded with cauliflower & mushroom filling.', tags: ['Special', 'Gobi'], available: true },
      { id: 202, name: 'Paneer Dosai', price: 135, description: 'Dosa stuffed with seasoned paneer crumbles.', tags: ['Special', 'Paneer'], available: true },
      { id: 203, name: 'Gobi Masala Dosai', price: 135, description: 'Crispy dosa with a spiced cauliflower masala.', tags: ['Special', 'Gobi'], available: true },
      { id: 204, name: 'Dimond Dosai', price: 135, description: 'Premium crispy dosa with a special diamond cut presentation.', tags: ['Special', 'Premium'], available: true },
      { id: 205, name: 'Mushroom Masala Dosai', price: 135, description: 'Dosa filled with rich mushroom masala.', tags: ['Special', 'Mushroom'], available: true },
      { id: 206, name: 'Paneer Mushroom Masala Dosai', price: 135, description: 'Dosa with a combined paneer & mushroom masala filling.', tags: ['Special', 'Paneer'], available: true },
      { id: 207, name: 'Chilly Paneer Dosai', price: 135, description: 'Spicy chilly paneer stuffed inside a crispy dosa.', tags: ['Special', 'Spicy'], available: true },
    ],
    snacks: [
      { id: 301, name: 'Bajji (4)', price: 40, description: 'Crispy batter-fried vegetable fritters.', tags: ['Snack', 'Fried'], available: true },
      { id: 302, name: 'Bonda (2)', price: 35, description: 'Golden fried potato-stuffed dumplings.', tags: ['Snack', 'Potato'], available: true },
      { id: 303, name: 'Chola Poori', price: 80, description: 'Fluffy poori with spiced chickpea curry.', tags: ['Snack', 'Chola'], available: true },
      { id: 304, name: 'Chilly Parota', price: 175, description: 'Shredded parota tossed in a spicy chilly sauce.', tags: ['Snack', 'Spicy'], available: true },
      { id: 305, name: 'Kaima Idly (2)', price: 165, description: 'Crumbled idly stir-fried with spices & herbs.', tags: ['Snack', 'Spicy'], available: true },
    ],
    dosa: [
      { id: 401, name: 'Onion Dosai', price: 45, description: 'Classic dosa topped with crispy onions.', tags: ['Dosa', 'Onion'], available: true },
      { id: 402, name: 'Onion Rava Dosai', price: 45, description: 'Rava dosa with generous onion topping.', tags: ['Dosa', 'Rava'], available: true },
      { id: 403, name: 'Onion Masala Dosai', price: 45, description: 'Onion dosa stuffed with spiced potato masala.', tags: ['Dosa', 'Masala'], available: true },
      { id: 404, name: 'Ghee Dosai', price: 45, description: 'Dosa roasted in pure ghee for rich flavor.', tags: ['Dosa', 'Ghee'], available: true },
      { id: 405, name: 'Ghee Roast Masala Dosai', price: 75, description: 'Ghee-roasted dosa with potato masala filling.', tags: ['Dosa', 'Ghee Roast'], available: true },
      { id: 406, name: 'Paper Roast', price: 75, description: 'Extra thin, extra crispy paper-thin dosa.', tags: ['Dosa', 'Crispy'], available: true },
      { id: 407, name: 'Plain Uthappam', price: 75, description: 'Thick, fluffy South Indian pancake.', tags: ['Uthappam', 'Plain'], available: true },
      { id: 408, name: 'Onion Uthappam', price: 75, description: 'Uthappam topped with fresh onions.', tags: ['Uthappam', 'Onion'], available: true },
      { id: 409, name: 'Tomato Uthappam', price: 75, description: 'Uthappam topped with juicy tomatoes.', tags: ['Uthappam', 'Tomato'], available: true },
      { id: 410, name: 'Peas Uthappam', price: 75, description: 'Uthappam loaded with green peas.', tags: ['Uthappam', 'Peas'], available: true },
      { id: 411, name: 'Coconut Uthappam', price: 75, description: 'Uthappam with freshly grated coconut.', tags: ['Uthappam', 'Coconut'], available: true },
      { id: 412, name: 'Parota Veg. Kuruma', price: 75, description: 'Flaky layered parota with vegetable kurma.', tags: ['Parota', 'Kurma'], available: true },
      { id: 413, name: 'Chappathi Kuruma', price: 75, description: 'Soft wheat chappathi with aromatic kurma.', tags: ['Chappathi', 'Kurma'], available: true },
      { id: 414, name: 'Mini Tiffen', price: 75, description: 'A mini assortment of tiffin items.', tags: ['Combo', 'Mini'], available: true },
      { id: 415, name: 'Kara Dosai', price: 75, description: 'Spicy dosa with a fiery masala topping.', tags: ['Dosa', 'Spicy'], available: true },
      { id: 416, name: 'Veg. Dosai', price: 75, description: 'Dosa loaded with fresh mixed vegetables.', tags: ['Dosa', 'Veg'], available: true },
      { id: 417, name: 'Podi Dosai', price: 75, description: 'Dosa coated with aromatic spice powder.', tags: ['Dosa', 'Podi'], available: true },
      { id: 418, name: 'Raagi Dosa (1 pc)', price: 75, description: 'Healthy ragi millet dosa, rich in nutrients.', tags: ['Millet', 'Healthy'], available: true },
      { id: 419, name: 'Cholam Dosa (1 pc)', price: 75, description: 'Nutritious jowar millet dosa.', tags: ['Millet', 'Healthy'], available: true },
      { id: 420, name: 'Kambu Dosa (1 pc)', price: 75, description: 'Wholesome pearl millet dosa.', tags: ['Millet', 'Healthy'], available: true },
      { id: 421, name: 'Wheat Dosa (1 pc)', price: 75, description: 'Whole wheat dosa for a healthy option.', tags: ['Wheat', 'Healthy'], available: true },
      { id: 422, name: 'Set Dosa (2 pcs) with Vadacurry', price: 75, description: 'Soft, spongy set dosa pair with vadacurry.', tags: ['Dosa', 'Set'], available: true },
      { id: 423, name: 'Neer Dosa with Jaggery & Coconut', price: 75, description: 'Delicate rice crepe with jaggery & coconut.', tags: ['Dosa', 'Sweet'], available: true },
      { id: 424, name: 'Mysore Masala Dosa', price: 75, description: 'Dosa with spicy red chutney & potato masala.', tags: ['Dosa', 'Mysore'], available: true },
    ],
    rice: [
      { id: 501, name: 'Schezwan Fried Rice', price: 175, description: 'Spicy Indo-Chinese fried rice with schezwan sauce.', tags: ['Chinese', 'Spicy'], available: true },
      { id: 502, name: 'Schezwan Mushroom Rice', price: 180, description: 'Schezwan fried rice tossed with mushrooms.', tags: ['Chinese', 'Mushroom'], available: true },
      { id: 503, name: 'Schezwan Paneer Rice', price: 180, description: 'Schezwan rice with paneer cubes.', tags: ['Chinese', 'Paneer'], available: true },
      { id: 504, name: 'Schezwan Gobi Rice', price: 180, description: 'Schezwan fried rice with crispy cauliflower.', tags: ['Chinese', 'Gobi'], available: true },
      { id: 505, name: 'Schezwan Noodles', price: 165, description: 'Stir-fried noodles in fiery schezwan sauce.', tags: ['Noodles', 'Spicy'], available: true },
      { id: 506, name: 'Schezwan Mushroom Noodles', price: 180, description: 'Schezwan noodles with sautéed mushrooms.', tags: ['Noodles', 'Mushroom'], available: true },
      { id: 507, name: 'Schezwan Gobi Noodles', price: 180, description: 'Schezwan noodles with crispy gobi florets.', tags: ['Noodles', 'Gobi'], available: true },
    ],
    beverages: [
      { id: 601, name: 'Coffee', price: 35, description: 'Authentic South Indian filter coffee.', tags: ['Hot', 'Classic'], available: true },
      { id: 602, name: 'Milk', price: 35, description: 'Fresh hot milk.', tags: ['Hot', 'Classic'], available: true },
      { id: 603, name: 'Boost / Horlicks', price: 40, description: 'Hot malt beverage — Boost or Horlicks.', tags: ['Hot', 'Malt'], available: true },
      { id: 604, name: 'Tea', price: 35, description: 'Traditional Indian chai brewed with spices.', tags: ['Hot', 'Classic'], available: true },
    ],
    soups: [
      { id: 701, name: 'Tomato Soup', price: 65, description: 'Classic tangy tomato soup.', tags: ['Soup', 'Tomato'], available: true },
      { id: 702, name: 'Onion Soup', price: 65, description: 'Savory caramelized onion soup.', tags: ['Soup', 'Onion'], available: true },
      { id: 703, name: 'Veg. Soup', price: 65, description: 'Hearty mixed vegetable soup.', tags: ['Soup', 'Veg'], available: true },
      { id: 704, name: 'Green Peas Soup', price: 65, description: 'Creamy green peas soup.', tags: ['Soup', 'Peas'], available: true },
      { id: 705, name: 'Sweet Corn Soup', price: 65, description: 'Sweet & savory corn soup.', tags: ['Soup', 'Corn'], available: true },
      { id: 706, name: 'Sweet Corn Veg. Soup', price: 65, description: 'Sweet corn soup with mixed vegetables.', tags: ['Soup', 'Corn'], available: true },
      { id: 707, name: 'Mushroom Soup', price: 65, description: 'Rich & earthy mushroom soup.', tags: ['Soup', 'Mushroom'], available: true },
    ],
    lunch: [
      { id: 801, name: 'Unlimited Meals', price: 125, description: 'Full South Indian unlimited thali.', tags: ['Meals', 'Unlimited'], available: true },
      { id: 802, name: 'Parcel Meals', price: 130, description: 'Complete meal packed for takeaway.', tags: ['Meals', 'Parcel'], available: true },
      { id: 803, name: 'Curd Rice', price: 60, description: 'Cool, creamy curd rice with tempering.', tags: ['Rice', 'Curd'], available: true },
      { id: 804, name: 'Sambar Rice', price: 60, description: 'Rice mixed with aromatic lentil sambar.', tags: ['Rice', 'Sambar'], available: true },
      { id: 805, name: 'Quick Lunch', price: 120, description: 'A quick and satisfying lunch combo.', tags: ['Meals', 'Quick'], available: true },
      { id: 806, name: 'Variety Rice', price: 60, description: 'Chef\'s special flavored rice of the day.', tags: ['Rice', 'Variety'], available: true },
      { id: 807, name: 'Brinji Kuruma', price: 60, description: 'Fragrant brinji rice with aromatic kurma.', tags: ['Rice', 'Brinji'], available: true },
      { id: 808, name: 'Lemon Rice', price: 60, description: 'Tangy lemon-flavored rice with peanuts.', tags: ['Rice', 'Tangy'], available: true },
      { id: 809, name: 'Puli Rice', price: 60, description: 'Tangy tamarind-flavored rice.', tags: ['Rice', 'Tangy'], available: true },
    ],
    // ===== North Indian Menu =====
    salads: [
      { id: 901, name: 'Tomato Salad', price: 65, description: 'Fresh ripe tomato salad with seasoning.', tags: ['Salad', 'Fresh'], available: true },
      { id: 902, name: 'Veg. Salad', price: 65, description: 'Mixed fresh vegetable salad.', tags: ['Salad', 'Veg'], available: true },
      { id: 903, name: 'Cucumber Salad', price: 65, description: 'Cool cucumber salad with light dressing.', tags: ['Salad', 'Cool'], available: true },
      { id: 904, name: 'Fruit Salad', price: 115, description: 'Seasonal fresh fruit medley.', tags: ['Salad', 'Fruit'], available: true },
      { id: 905, name: 'Onion Salad', price: 65, description: 'Sliced onion salad with lemon & spices.', tags: ['Salad', 'Onion'], available: true },
    ],
    tandoori_breads: [
      { id: 1001, name: 'Nan', price: 30, description: 'Soft leavened bread from the tandoor.', tags: ['Bread', 'Tandoor'], available: true },
      { id: 1002, name: 'Veg. Nan', price: 40, description: 'Nan stuffed with mixed vegetables.', tags: ['Bread', 'Veg'], available: true },
      { id: 1003, name: 'Stuffed Nan', price: 160, description: 'Nan with rich stuffing.', tags: ['Bread', 'Stuffed'], available: true },
      { id: 1004, name: 'Butter Nan', price: 165, description: 'Soft nan brushed with melted butter.', tags: ['Bread', 'Butter'], available: true },
      { id: 1005, name: 'Paneer Nan', price: 170, description: 'Nan stuffed with spiced paneer.', tags: ['Bread', 'Paneer'], available: true },
      { id: 1006, name: 'Kashmiri Nan', price: 170, description: 'Sweet nan with dry fruits & nuts.', tags: ['Bread', 'Sweet'], available: true },
      { id: 1007, name: 'Jeera Nan', price: 160, description: 'Nan flavored with roasted cumin seeds.', tags: ['Bread', 'Jeera'], available: true },
      { id: 1008, name: 'Roti', price: 200, description: 'Whole wheat flatbread.', tags: ['Bread', 'Wheat'], available: true },
      { id: 1009, name: 'Butter Roti', price: 180, description: 'Roti brushed with butter.', tags: ['Bread', 'Butter'], available: true },
      { id: 1010, name: 'Kulcha', price: 180, description: 'Soft leavened bread baked in tandoor.', tags: ['Bread', 'Tandoor'], available: true },
      { id: 1011, name: 'Masala Kulcha', price: 180, description: 'Kulcha with spiced filling.', tags: ['Bread', 'Masala'], available: true },
      { id: 1012, name: 'Stuffed Paratha', price: 180, description: 'Paratha with rich stuffing.', tags: ['Bread', 'Stuffed'], available: true },
      { id: 1013, name: 'Aloo Paratha', price: 170, description: 'Paratha stuffed with spiced potato.', tags: ['Bread', 'Aloo'], available: true },
      { id: 1014, name: 'Plain Paratha', price: 185, description: 'Layered plain paratha.', tags: ['Bread', 'Plain'], available: true },
      { id: 1015, name: 'Pudina Paratha', price: 170, description: 'Mint flavored paratha.', tags: ['Bread', 'Mint'], available: true },
      { id: 1016, name: 'Peas Paratha', price: 185, description: 'Paratha stuffed with spiced peas.', tags: ['Bread', 'Peas'], available: true },
      { id: 1017, name: 'Pulkha', price: 185, description: 'Light, puffed whole wheat bread.', tags: ['Bread', 'Light'], available: true },
    ],
    tandoori_sides: [
      { id: 1101, name: 'Green Peas Masala', price: 160, description: 'Green peas in aromatic masala gravy.', tags: ['Curry', 'Peas'], available: true },
      { id: 1102, name: 'Kaju Masala', price: 160, description: 'Cashew nuts in rich creamy gravy.', tags: ['Curry', 'Premium'], available: true },
      { id: 1103, name: 'Mushroom Masala', price: 160, description: 'Mushrooms in spiced masala gravy.', tags: ['Curry', 'Mushroom'], available: true },
      { id: 1104, name: 'Mushroom Fry', price: 160, description: 'Crispy fried mushrooms with spices.', tags: ['Fry', 'Mushroom'], available: true },
      { id: 1105, name: 'Mushroom Manchurian', price: 160, description: 'Indo-Chinese style mushroom manchurian.', tags: ['Chinese', 'Mushroom'], available: true },
      { id: 1106, name: 'Mushroom Pepper Salt', price: 160, description: 'Mushrooms tossed in pepper & salt.', tags: ['Fry', 'Pepper'], available: true },
      { id: 1107, name: 'Mixed Veg Kuruma', price: 160, description: 'Mixed vegetables in creamy kurma.', tags: ['Curry', 'Veg'], available: true },
      { id: 1108, name: 'Navarathna Kuruma', price: 160, description: 'Rich nine-gem vegetable kurma.', tags: ['Curry', 'Premium'], available: true },
    ],
    starters: [
      { id: 1201, name: 'Papad', price: 185, description: 'Crispy roasted papad.', tags: ['Starter', 'Crispy'], available: true },
      { id: 1202, name: 'Masala Fry Papad', price: 185, description: 'Papad topped with spiced onion masala.', tags: ['Starter', 'Masala'], available: true },
      { id: 1203, name: 'Gobi-65', price: 185, description: 'Crispy spiced cauliflower fritters.', tags: ['Starter', 'Gobi'], available: true },
      { id: 1204, name: 'Finger Chips', price: 170, description: 'Golden crispy french fries.', tags: ['Starter', 'Fries'], available: true },
      { id: 1205, name: 'Paneer-65', price: 180, description: 'Spicy crispy paneer fritters.', tags: ['Starter', 'Paneer'], available: true },
      { id: 1206, name: 'Mushroom-65', price: 185, description: 'Crispy spiced mushroom fritters.', tags: ['Starter', 'Mushroom'], available: true },
    ],
    paneer: [
      { id: 1301, name: 'Paneer Mutter', price: 185, description: 'Paneer & green peas in tomato gravy.', tags: ['Paneer', 'Gravy'], available: true },
      { id: 1302, name: 'Paneer Butter Masala', price: 185, description: 'Paneer in rich butter tomato cream sauce.', tags: ['Paneer', 'Butter'], available: true },
      { id: 1303, name: 'Paneer Koftha', price: 185, description: 'Stuffed paneer balls in creamy gravy.', tags: ['Paneer', 'Koftha'], available: true },
      { id: 1304, name: 'Paneer Manchurian', price: 175, description: 'Indo-Chinese style paneer manchurian.', tags: ['Paneer', 'Chinese'], available: true },
      { id: 1305, name: 'Paneer Masala', price: 160, description: 'Paneer cubes in aromatic masala gravy.', tags: ['Paneer', 'Masala'], available: true },
      { id: 1306, name: 'Paneer Fry', price: 160, description: 'Pan-fried paneer with spices.', tags: ['Paneer', 'Fry'], available: true },
      { id: 1307, name: 'Paneer Mushroom Masala', price: 160, description: 'Paneer & mushroom in rich gravy.', tags: ['Paneer', 'Mushroom'], available: true },
      { id: 1308, name: 'Paneer Tikka Masala', price: 160, description: 'Tandoori paneer in tikka masala sauce.', tags: ['Paneer', 'Tikka'], available: true },
      { id: 1309, name: 'Paneer Capsicum Masala', price: 160, description: 'Paneer with capsicum in spiced gravy.', tags: ['Paneer', 'Capsicum'], available: true },
    ],
    veg_curries: [
      { id: 1401, name: 'Malai Koftha', price: 160, description: 'Creamy cheese & vegetable dumplings in rich sauce.', tags: ['Curry', 'Premium'], available: true },
      { id: 1402, name: 'Veg. Koftha', price: 160, description: 'Mixed veg dumplings in spiced gravy.', tags: ['Curry', 'Koftha'], available: true },
      { id: 1403, name: 'Veg. Curry', price: 160, description: 'Mixed vegetable curry.', tags: ['Curry', 'Veg'], available: true },
      { id: 1404, name: 'Veg. Chilly Fry', price: 160, description: 'Stir-fried vegetables in chilly sauce.', tags: ['Fry', 'Spicy'], available: true },
      { id: 1405, name: 'Veg. Manchurian', price: 160, description: 'Indo-Chinese vegetable manchurian.', tags: ['Chinese', 'Veg'], available: true },
      { id: 1406, name: 'Stuffed Tomato', price: 160, description: 'Tomato stuffed with spiced filling.', tags: ['Stuffed', 'Tomato'], available: true },
      { id: 1407, name: 'Stuffed Capsicum', price: 160, description: 'Capsicum stuffed with spiced filling.', tags: ['Stuffed', 'Capsicum'], available: true },
      { id: 1408, name: 'Tomato Onion Fry', price: 160, description: 'Tomato & onion stir fry.', tags: ['Fry', 'Quick'], available: true },
    ],
    noodles: [
      { id: 1501, name: 'Veg. Noodles', price: 150, description: 'Stir-fried vegetable noodles.', tags: ['Noodles', 'Veg'], available: true },
      { id: 1502, name: 'Veg. Fried Noodles', price: 170, description: 'Crispy fried vegetable noodles.', tags: ['Noodles', 'Fried'], available: true },
      { id: 1503, name: 'Mushroom Noodles', price: 175, description: 'Noodles with sautéed mushrooms.', tags: ['Noodles', 'Mushroom'], available: true },
      { id: 1504, name: 'Singapore Noodles', price: 190, description: 'Singapore-style spiced noodles.', tags: ['Noodles', 'Singapore'], available: true },
      { id: 1505, name: 'Veg. American Chopse', price: 190, description: 'American chop suey with crispy noodles.', tags: ['Noodles', 'Chinese'], available: true },
      { id: 1506, name: 'Veg. Chinese Chopse', price: 190, description: 'Chinese chop suey with crispy noodles.', tags: ['Noodles', 'Chinese'], available: true },
    ],
    north_indian: [
      { id: 1601, name: 'Veg. Biryani / Onion Raitha', price: 100, description: 'Aromatic vegetable biryani with raitha.', tags: ['Rice', 'Biryani'], available: true },
      { id: 1602, name: 'Veg. Fried Rice', price: 150, description: 'Stir-fried vegetable rice.', tags: ['Rice', 'Fried'], available: true },
      { id: 1603, name: 'Peas Fried Rice', price: 160, description: 'Fried rice with green peas.', tags: ['Rice', 'Peas'], available: true },
      { id: 1604, name: 'Gobi Fried Rice', price: 160, description: 'Fried rice with cauliflower.', tags: ['Rice', 'Gobi'], available: true },
      { id: 1605, name: 'Paneer Fried Rice', price: 165, description: 'Fried rice with paneer cubes.', tags: ['Rice', 'Paneer'], available: true },
      { id: 1606, name: 'Mushroom Fried Rice', price: 165, description: 'Fried rice with mushrooms.', tags: ['Rice', 'Mushroom'], available: true },
      { id: 1607, name: 'Garlic Fried Rice', price: 165, description: 'Garlic flavored fried rice.', tags: ['Rice', 'Garlic'], available: true },
      { id: 1608, name: 'Veg. Pulav / Onion Raitha', price: 110, description: 'Vegetable pulav with raitha.', tags: ['Pulav', 'Veg'], available: true },
      { id: 1609, name: 'Gobi Pulav', price: 160, description: 'Pulav with cauliflower.', tags: ['Pulav', 'Gobi'], available: true },
      { id: 1610, name: 'Paneer Pulav', price: 165, description: 'Pulav with paneer cubes.', tags: ['Pulav', 'Paneer'], available: true },
      { id: 1611, name: 'Jeera Pulav', price: 165, description: 'Cumin flavored pulav.', tags: ['Pulav', 'Jeera'], available: true },
      { id: 1612, name: 'Ghee Pulav', price: 165, description: 'Ghee flavored aromatic pulav.', tags: ['Pulav', 'Ghee'], available: true },
      { id: 1613, name: 'Peas Pulav', price: 165, description: 'Pulav with green peas.', tags: ['Pulav', 'Peas'], available: true },
      { id: 1614, name: 'Kashmiri Pulav', price: 190, description: 'Rich pulav with dry fruits & saffron.', tags: ['Pulav', 'Premium'], available: true },
      { id: 1615, name: 'Cashewnut Pulav', price: 190, description: 'Pulav loaded with cashew nuts.', tags: ['Pulav', 'Premium'], available: true },
      { id: 1616, name: 'Kaju Paneer Pulav', price: 190, description: 'Pulav with cashews & paneer.', tags: ['Pulav', 'Premium'], available: true },
    ],
    raitha: [
      { id: 1701, name: 'Onion Raitha', price: 65, description: 'Cool yogurt with onions.', tags: ['Raitha', 'Onion'], available: true },
      { id: 1702, name: 'Veg. Raitha', price: 65, description: 'Cool yogurt with mixed vegetables.', tags: ['Raitha', 'Veg'], available: true },
      { id: 1703, name: 'Tomato Raitha', price: 65, description: 'Cool yogurt with tomatoes.', tags: ['Raitha', 'Tomato'], available: true },
      { id: 1704, name: 'Extra Curd', price: 35, description: 'Extra serving of fresh curd.', tags: ['Side', 'Curd'], available: true },
    ],
    aloo_gobi: [
      { id: 1801, name: 'Aloo Fry', price: 165, description: 'Crispy fried potatoes with spices.', tags: ['Aloo', 'Fry'], available: true },
      { id: 1802, name: 'Aloo Gobi', price: 165, description: 'Potato & cauliflower dry curry.', tags: ['Aloo', 'Gobi'], available: true },
      { id: 1803, name: 'Aloo Mutter', price: 165, description: 'Potato & peas in gravy.', tags: ['Aloo', 'Gravy'], available: true },
      { id: 1804, name: 'Aloo Paneer', price: 170, description: 'Potato & paneer curry.', tags: ['Aloo', 'Paneer'], available: true },
      { id: 1805, name: 'Aloo Tikka Masala', price: 170, description: 'Spiced potato tikka in masala.', tags: ['Aloo', 'Tikka'], available: true },
      { id: 1806, name: 'Aloo Capsicum', price: 170, description: 'Potato & capsicum stir fry.', tags: ['Aloo', 'Capsicum'], available: true },
      { id: 1807, name: 'Bindi Fry', price: 170, description: 'Crispy fried okra.', tags: ['Bindi', 'Fry'], available: true },
      { id: 1808, name: 'Bindi Masala', price: 170, description: 'Okra in spiced masala.', tags: ['Bindi', 'Masala'], available: true },
      { id: 1809, name: 'Baby Corn Mushroom Masala', price: 175, description: 'Baby corn & mushroom in masala.', tags: ['Baby Corn', 'Mushroom'], available: true },
      { id: 1810, name: 'Channa Masala', price: 160, description: 'Chickpeas in spiced gravy.', tags: ['Channa', 'Masala'], available: true },
      { id: 1811, name: 'Channa Paneer', price: 175, description: 'Chickpeas with paneer in gravy.', tags: ['Channa', 'Paneer'], available: true },
      { id: 1812, name: 'Gobi Paneer', price: 180, description: 'Cauliflower & paneer curry.', tags: ['Gobi', 'Paneer'], available: true },
      { id: 1813, name: 'Gobi Mushroom Fry', price: 180, description: 'Cauliflower & mushroom fry.', tags: ['Gobi', 'Mushroom'], available: true },
      { id: 1814, name: 'Gobi Masala', price: 165, description: 'Cauliflower in spiced masala.', tags: ['Gobi', 'Masala'], available: true },
      { id: 1815, name: 'Gobi Paneer Masala', price: 180, description: 'Cauliflower & paneer masala.', tags: ['Gobi', 'Paneer'], available: true },
      { id: 1816, name: 'Gobi Mutter', price: 175, description: 'Cauliflower & peas curry.', tags: ['Gobi', 'Mutter'], available: true },
      { id: 1817, name: 'Gobi Tikka Masala', price: 175, description: 'Cauliflower tikka in masala.', tags: ['Gobi', 'Tikka'], available: true },
      { id: 1818, name: 'Gobi Chilly Fry', price: 160, description: 'Cauliflower in spicy chilly sauce.', tags: ['Gobi', 'Spicy'], available: true },
      { id: 1819, name: 'Gobi Mushroom Masala', price: 180, description: 'Cauliflower & mushroom masala.', tags: ['Gobi', 'Mushroom'], available: true },
      { id: 1820, name: 'Gobi Manchurian', price: 160, description: 'Indo-Chinese cauliflower manchurian.', tags: ['Gobi', 'Chinese'], available: true },
    ],
  }

  // Bind references to reused item lists
  // Bind references to reused item lists
  menuItems.dinner = menuItems.breakfast;
  menuItems.idli = menuItems.breakfast;
  menuItems.south_indian = menuItems.lunch;

  const [showMenu, setShowMenu] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' for categories, 'list' for items

  // Cart State Management
  const [cart, setCart] = useState([])

  // Checkout & Mobile Flow State
  const [isAwaitingMobile, setIsAwaitingMobile] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')

  const messagesEndRef = useRef(null)

  // Autoscroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // Short delay to let user see their text before sending
      setTimeout(() => {
        handleSendMessage(transcript);
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  const speakText = (text) => {
    if (isMutedRef.current || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: tweak voice, rate, pitch
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  const handleSendMessage = async (textToSubmit = inputText) => {
    if (!textToSubmit.trim()) return;

    const lowerText = textToSubmit.toLowerCase();

    // Task 2: Check for menu items in the text
    const allItems = Object.values(menuItems).flat();
    const foundItem = allItems.find(item => {
      const itemName = item.name.toLowerCase().replace(/\(.*\)/, '').trim(); // Remove portions like (2) or (1 pc)
      return lowerText.includes(itemName);
    });

    if (foundItem) {
      handleAddToCart(foundItem);
      setInputText('');
      return;
    }

    if (isAwaitingMobile) {
      if (lowerText === 'done' || lowerText.includes('done')) {
        if (mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber)) {
          setIsAwaitingMobile(false);
          setMessages([{ role: 'model', type: 'qr_prompt' }]);
          speakText("Scan the QR Code using your mobile. SCAN HERE TO PAY!");
        } else {
          setMessages([...messages, { role: 'user', content: textToSubmit }, { role: 'model', content: "Invalid mobile number" }]);
          speakText("Invalid mobile number");
        }
        setInputText('');
        return;
      }

      // Extract numbers spoken if they aren't "done"
      const extractedNums = textToSubmit.replace(/\D/g, '');
      if (extractedNums.length > 0) {
        setMobileNumber(prev => (prev + extractedNums).slice(0, 10));
        setInputText('');
        return;
      }
    }

    const isCheckoutPending = messages.length > 0 && messages[messages.length - 1].type === 'checkout';

    if (lowerText === 'yes' && isCheckoutPending) {
      setIsAwaitingMobile(true);
      setMobileNumber('');
      setMessages([{ role: 'model', type: 'mobile_prompt' }]);
      speakText("Enter your mobile number please... Say done after entering mobile number.");
      setInputText('');
      return;
    }

    if ((lowerText === 'yes' || lowerText === 'checkout confirmed') && cart.length > 0) {
      handleCheckout();
      setInputText('');
      return;
    }

    const userMessage = { role: 'user', content: textToSubmit }
    const updatedMessages = [...messages, userMessage]

    // Direct check for "show menu" to bypass API connection issues
    if (textToSubmit.toLowerCase().includes('show menu')) {
      setShowMenu(true)
      setViewMode('grid')
      const localResponse = "Certainly! Here are our menu categories. You can click on any category to explore the items."
      setMessages([...updatedMessages, { role: 'model', content: localResponse }])
      speakText(localResponse)
      setInputText('')
      return; // Skip API call and loading state
    }

    // Regular API flow
    setMessages(updatedMessages)
    setInputText('')
    setIsLoading(true)

    try {
      // Calling our internal backend proxy instead of Google directly
      const apiUrl = '/api/chat'

      const apiMessages = updatedMessages
        .filter(msg => msg.content && typeof msg.content === 'string')
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

      // Gemini requires the conversation to end with a 'user' message
      if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role === 'model') {
        apiMessages.push({
          role: 'user',
          parts: [{ text: textToSubmit }]
        });
      }

      const payload = {
        systemInstruction: {
          parts: [{ text: "You are a friendly and polite AI assistant for Data Udipi, a well-known authentic Indian vegetarian restaurant. Your role is to help customers explore the menu and place their orders smoothly. Always respond in a warm, courteous, and concise manner (1–2 sentences). You may suggest popular items such as Dosas, Idlis, Vadas, Meals, and Filter Coffee when relevant. If a customer asks to view the menu or available options, kindly inform them that you are showing the menu and include the token [SHOW_MENU] in your response." }]
        },
        contents: apiMessages
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Chat API error:", data)
        throw new Error(data.error?.message || `API Error: ${response.status}`)
      }

      if (data.candidates && data.candidates.length > 0) {
        let botResponse = data.candidates[0].content.parts[0].text

        // Check for menu trigger
        if (botResponse.includes('[SHOW_MENU]')) {
          setShowMenu(true)
          setViewMode('grid')
          botResponse = botResponse.replace('[SHOW_MENU]', '').trim()
        }

        // Direct check for "review order" via Gemini payload interpretation
        if (botResponse.toLowerCase().includes('review order') || botResponse.toLowerCase().includes('shall we proceed for checkout')) {
          setShowMenu(false)
          setMessages(prev => [...prev, { role: 'model', type: 'review' }])
          speakText("Shall we proceed for checkout? Say just yes.")
          return;
        }

        setMessages(prev => [...prev, { role: 'model', content: botResponse }])
        speakText(botResponse)
      } else {
        console.error("Gemini API - no candidates in response:", data)
        throw new Error('Invalid response from AI')
      }
    } catch (error) {
      console.error("Detailed failure from Gemini:", error)
      const customerFriendlyError = "I'm sorry, I'm having a bit of trouble connecting to the system. Please try asking again in a moment.";
      setMessages(prev => [...prev, { role: 'model', content: customerFriendlyError }])
      speakText(customerFriendlyError);
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id)

    if (category.id !== 'all' && menuItems[category.id]) {
      setViewMode('list')
    } else {
      setViewMode('grid')
    }

    setMessages(prev => [
      ...prev,
      { role: 'model', content: `Showing ${category.name} menu` }
    ])
  }

  // Cart Functions
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })

    // Instant local AI feedback without roundtrip
    setMessages(prev => [
      ...prev,
      { role: 'model', content: `Added ${item.name} to your order! Say 'review order' to see your summary, or keep adding more.` }
    ])
    speakText(`Added ${item.name} to your order!`)
  }

  const updateCartQty = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleCheckout = () => {
    const subtotal = totalAmount;
    const service = subtotal * 0.05;
    const gst = subtotal * 0.05;
    const finalTotal = subtotal + service + gst;

    setShowMenu(false);
    setMessages([
      {
        role: 'model',
        type: 'checkout',
        cartData: [...cart],
        subtotal,
        service,
        gst,
        finalTotal
      }
    ]);

    setCart([]); // Clear cart after freezing data to message
    speakText("Shall we proceed to Payment? Say just yes.");
  }

  const handleMobileDigit = (digit) => {
    if (mobileNumber.length >= 10) return;
    setMobileNumber(prev => prev + digit);
  }

  const handleMobileDelete = () => {
    setMobileNumber(prev => prev.slice(0, -1));
  }

  // Listeners moved to handleSendMessage hooks directly where API bypass is needed.

  return (
    <div className="app-container">
      <div className="background-image"></div>

      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} />

      <main className="agent-page-content">
        <div className="agent-chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'model' ? 'bot-message' : 'user-message'}`}>
                {msg.role === 'model' ? (
                  <>
                    <div className="message-icon bot-icon"><img src="/agentwaiter logo.png" alt="bot" /></div>

                    {msg.type === 'review' ? (
                      <div className="review-card" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <h3 className="title">Review Order</h3>

                        <div className="review-card-items-list">
                          {cart.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '15px 0' }}>Your cart is empty.</p>
                          ) : (
                            cart.map(item => (
                              <div key={item.id} className="item-card">
                                <div className="item-top">
                                  <div>
                                    <div className="item-name">
                                      {item.name}
                                      {item.available && <span className="badge">● Available</span>}
                                    </div>
                                    <div className="item-desc">
                                      {item.description}
                                    </div>
                                  </div>
                                  <div className="price">Rs. {item.price * item.quantity}</div>
                                </div>
                                <div className="qty-row">
                                  <button className="qty-btn minus" onClick={() => updateCartQty(item.id, -1)}>−</button>
                                  <span className="qty">{item.quantity}</span>
                                  <button className="qty-btn plus" onClick={() => updateCartQty(item.id, 1)}>+</button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <button className="add-more" onClick={() => {
                          setShowMenu(true)
                          setMessages(prev => [...prev, { role: 'model', content: "Certainly! Feel free to add more items from the menu." }])
                        }}>+ ADD More</button>

                        {cart.length > 0 && (
                          <button className="checkout-btn" onClick={() => {
                            handleCheckout();
                          }}>Confirm Order Checkout (Rs. {totalAmount})</button>
                        )}

                        <p className="footer-text">
                          Shall we proceed for check out? Say just yes.
                        </p>
                      </div>
                    ) : msg.type === 'checkout' ? (
                      <div className="checkout-card" id="checkoutCard" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <h3 className="title">Check out</h3>

                        <div id="itemsContainer">
                          {msg.cartData.map((item, i) => (
                            <div key={i} className="co-item">
                              <div className="co-item-top">
                                <div>
                                  <div className="co-item-name">{item.name}</div>
                                  <div className="co-item-desc">{item.description}</div>
                                  <div className="co-qty">Qty : {item.quantity}</div>
                                </div>
                                <div className="co-price">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="co-bill">
                          <div className="co-row"><span>Sub total</span><span id="subtotal">Rs. {msg.subtotal.toFixed(2)}</span></div>
                          <div className="co-row"><span>Service Charge (5%)</span><span id="service">Rs. {msg.service.toFixed(2)}</span></div>
                          <div className="co-row"><span>GST (5%)</span><span id="gst">Rs. {msg.gst.toFixed(2)}</span></div>
                          <div className="co-row"><span>Service Charge (0)</span><span>Rs. 0.00</span></div>

                          <div className="co-divider"></div>

                          <div className="co-row co-total">
                            <span>Total :</span>
                            <span id="total">Rs. {msg.finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="co-footer">
                          Shall we proceed to Payment? Say just yes.
                        </p>
                      </div>
                    ) : msg.type === 'mobile_prompt' ? (
                      <div className="mobile-card" style={{ margin: '0 10px', maxWidth: '400px', width: '100%' }}>
                        <p className="title">Enter your mobile number please.</p>

                        <div className="display">
                          {mobileNumber.split("").join(" ")}
                          {mobileNumber.length === 0 ? " " : ""}
                          {Array.from({ length: 10 - mobileNumber.length }).map((_, i) => "_ ").join("").trim()}
                        </div>

                        <div className="keypad">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handleMobileDigit(num)}>{num}</button>
                          ))}
                          <button onClick={() => handleMobileDigit(0)} className="zero">0</button>
                          <button onClick={handleMobileDelete} className="delete">⌫</button>
                        </div>

                        <p className="footer" style={{ fontSize: '13px', color: '#666', marginTop: '15px' }}>Say done after entering mobile number.</p>
                      </div>
                    ) : msg.type === 'qr_prompt' ? (
                      <div className="qr-card" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <p className="title">Scan the QR Code using your mobile.</p>

                        <div className="qr-container">
                          <div className="corner tl"></div>
                          <div className="corner tr"></div>
                          <div className="corner bl"></div>
                          <div className="corner br"></div>

                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=DummyPayment123" alt="QR Code" />
                        </div>

                        <p className="scan-text" style={{ marginTop: '15px', color: '#ff3b00', fontWeight: 600 }}>SCAN HERE TO PAY!</p>
                      </div>
                    ) : (
                      <div className="message-bubble">{msg.content}</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="message-bubble">{msg.content}</div>
                    <div className="message-icon user-icon"><i className="fa-solid fa-user"></i></div>
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message listening-message">
                <div className="message-icon bot-icon"><img src="/agentwaiter logo.png" alt="bot" /></div>
                <div className="message-content">
                  <div className="message-bubble">...</div>
                  <div className="listening-indicator">
                    <span className="dot gray"></span><span className="dot gray"></span><span className="dot gray"></span> Thinking...
                  </div>
                </div>
              </div>
            )}
            {showMenu && (
              <div className="message bot-message">
                <div className="menu-categories-container">
                  {viewMode === 'grid' ? (
                    <div className="menu-container">
                      {menuCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className={`menu-card ${activeCategory === cat.id ? 'active' : ''}`}
                          onClick={() => handleCategoryClick(cat)}
                        >
                          <div className="menu-img">
                            <img src={cat.image} alt={cat.name} />
                          </div>
                          <div className="menu-name">{cat.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="horizontal-categories">
                        {menuCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                          >
                            <img src={cat.image} alt={cat.name} className="cat-pill-img" />
                            <span>{cat.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="menu-list-header">
                        <h3 className="menu-list-title">
                          {menuCategories.find(c => c.id === activeCategory)?.name}
                        </h3>
                        <button className="back-to-categories-btn" onClick={() => setViewMode('grid')}>
                          Back to Categories
                        </button>
                      </div>
                      <div className="menu-items-display">
                        {(menuItems[activeCategory] || []).map((item) => (
                          <div key={item.id} className="menu-item-card">
                            <div className="menu-item-header">
                              <span className="menu-item-name">{item.name}</span>
                              {item.available && (
                                <span className="available-badge">
                                  <span className="available-dot"></span>
                                  <span className="available-text">Available</span>
                                </span>
                              )}
                            </div>

                            <p className="menu-item-desc">
                              {item.description}
                            </p>

                            <div className="menu-item-footer">
                              <div className="menu-item-tags">
                                {item.tags.map((tag, i) => (
                                  <span key={i} className="menu-tag">{tag}</span>
                                ))}
                              </div>

                              <div className="menu-item-price-row">
                                <span className="menu-item-price">Rs. {item.price}</span>
                                {cart.find(c => c.id === item.id) ? (
                                  <div className="in-menu-qty-control">
                                    <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>−</button>
                                    <span className="qty">{cart.find(c => c.id === item.id).quantity}</span>
                                    <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                                  </div>
                                ) : (
                                  <button className="add-btn" onClick={() => handleAddToCart(item)}>
                                    +
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <div className="chat-input-box" style={{ padding: '0 10px' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? "Listening..." : "Type or speak your order..."}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '10px',
                  fontSize: '1.05rem'
                }}
              />
              <button
                className="mic-btn"
                onClick={toggleListen}
                style={{ background: isListening ? '#ec1c24' : '#ff4e00', marginLeft: '10px' }}
              >
                <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
              <button
                className="mic-btn"
                onClick={() => handleSendMessage()}
                style={{ marginLeft: '10px', background: '#1a7a3b' }}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            <button
              className="mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              style={{ color: isMuted ? '#ec1c24' : '#666' }}
            >
              <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
            </button>
          </div>

          {/* Bottom Fixed Summary Bar - Only show when cart has items */}
          {cart.length > 0 && (
            <div className={`order-summary-bar ${!showMenu ? 'visible' : ''}`} onClick={() => {
              setShowMenu(false)
              setMessages(prev => [...prev, { role: 'user', content: 'Review my order' }, { role: 'model', type: 'review' }])
              speakText("Shall we proceed for checkout? Say just yes.")
            }}>
              <div className="left">
                <div className="icon">🧾</div>
                <span>{totalItems} Item{totalItems !== 1 ? 's' : ''} – Tap to Review</span>
              </div>
              <div className="right">Rs.{totalAmount}</div>
            </div>
          )}

        </div>
      </main>



    </div>
  )
}

export default Agent
