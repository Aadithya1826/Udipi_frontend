import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import AIAssistantOverlay from '../components/AIAssistantOverlay'
import '../styles/pages.css'
import '../styles/dinein.css'

const menuCategories = [
  { id: 'all', name: 'All Menu', image: '/all menu.png' },
  { id: 'south_indian', name: 'South Indian', image: '/cat_breakfast.png' },
  { id: 'dosai_special', name: 'Dosai Special', image: '/cat_dosa.png' },
  { id: 'dosa_varieties', name: 'Dosa Varieties', image: '/cat_dosa.png' },
  { id: 'dosa_light', name: 'Dosa Light', image: '/cat_dosa.png' },
  { id: 'evening_snacks', name: 'Evening Snacks', image: '/mysore_bonda.jpg' },
  { id: 'rice_chinese', name: 'Chinese Rice', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200' },
  { id: 'noodles', name: 'Noodles', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200' },
  { id: 'soups', name: 'Healthy Soups', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200' },
  { id: 'lunch', name: 'Lunch Menu', image: '/cat_lunch.png' },
  { id: 'beverages', name: 'Hot Beverages', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200' },
  { id: 'tandoori_breads', name: 'Tandoori Breads', image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=200' },
  { id: 'tandoori_side_dishes', name: 'Tandoori Sides', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200' },
  { id: 'starters', name: 'Starters', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
  { id: 'curries', name: 'North Indian Curries', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
  { id: 'salads', name: 'Fresh Salads', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
  { id: 'raitha', name: 'Raitha Items', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
]

const menuItems = {
  south_indian: [
    { id: 1001, name: "Idly (2)", tamilName: "இட்லி (2)", price: 40, emoji: "🍚", description: "Soft steamed rice cakes.", tamilDesc: "மென்மையான ஆவியில் வேகவைத்த அரிசி இட்லி.", available: true },
    { id: 1002, name: "Sambar Idly (2)", tamilName: "சாம்பார் இட்லி (2)", price: 60, image: "/sambar_idly_premium.jpg", description: "Idlies soaked in sambar.", tamilDesc: "சாம்பாரில் ஊறிய இட்லி.", available: true },
    { id: 1003, name: "Spl. Mini Sambar Idly", tamilName: "சிறப்பு மினி சாம்பார் இட்லி", price: 65, image: "/mini_sambar_idly.jpg", description: "Mini idlies in sambar.", tamilDesc: "சாம்பாரில் ஊறிய சிறிய வகை இட்லிகள்.", available: true },
    { id: 1004, name: "Vadai", tamilName: "வடை", price: 30, image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", description: "Crispy fried fritters.", tamilDesc: "மொறுமொறுப்பான உளுந்து வடை.", available: true },
    { id: 1005, name: "Pongal", tamilName: "பொங்கல்", price: 70, image: "/pongal.png", description: "Creamy rice and lentil dish.", tamilDesc: "நெய் மணம் கமழும் வெண் பொங்கல்.", available: true },
    { id: 1006, name: "Sambar Vadai (1)", tamilName: "சாம்பார் வடை (1)", price: 40, emoji: "🥟", description: "Vada soaked in sambar.", tamilDesc: "சாம்பாரில் ஊறிய மெது வடை.", available: true },
    { id: 1007, name: "Curd Vadai (1)", tamilName: "தயிர் வடை (1)", price: 40, emoji: "🥣", description: "Vada in seasoned yogurt.", tamilDesc: "தயிரில் ஊறிய சுவையான வடை.", available: true },
    { id: 1008, name: "Spl. Vada", tamilName: "சிறப்பு வடை", price: 35, emoji: "🥟", description: "Special crispy vada.", tamilDesc: "சிறப்பு மொறுமொறு வடை.", available: true },
    { id: 1009, name: "Poori Masala", tamilName: "பூரி மசாலா", price: 80, image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400", description: "Poori with potato masala.", tamilDesc: "பூரி மற்றும் உருளைக்கிழங்கு மசாலா.", available: true },
    { id: 1010, name: "Special Soda Dosai", tamilName: "சிறப்பு சோடா தோசை", price: 70, emoji: "🫓", description: "Fluffy soda dosa.", tamilDesc: "மென்மையான சோடா தோசை.", available: true },
    { id: 1011, name: "Special Masala Dosai", tamilName: "சிறப்பு மசாலா தோசை", price: 80, emoji: "🥘", description: "Golden stuffed dosa.", tamilDesc: "மசாலா நிரப்பப்பட்ட பொன்னிற தோசை.", available: true },
    { id: 1012, name: "Rava Dosai", tamilName: "ரவா தோசை", price: 85, emoji: "🥘", description: "Crispy semolina dosa.", tamilDesc: "மொறுமொறுப்பான ரவா தோசை.", available: true },
    { id: 1013, name: "Idiyappam with Kurma", tamilName: "இடியாப்பம் மற்றும் குருமா", price: 70, emoji: "🥘", description: "String hoppers with kurma.", tamilDesc: "மென்மையான இடியாப்பம் மற்றும் குருமா.", available: true },
    { id: 1014, name: "Podi Idly", tamilName: "பொடி இட்லி", price: 65, emoji: "🥘", description: "Idly tossed in spicy powder.", tamilDesc: "மிளகாய் பொடி தூவிய சுவையான இட்லி.", available: true },
    { id: 1015, name: "Idly Vadacurry", tamilName: "இட்லி வடைகறி", price: 60, emoji: "🥘", description: "Idly served with vadacurry.", tamilDesc: "இட்லி மற்றும் சுவையான வடைகறி.", available: true },
    { id: 1016, name: "Dosa Vadacurry", tamilName: "தோசை வடைகறி", price: 80, emoji: "🥘", description: "Dosa served with vadacurry.", tamilDesc: "தோசை மற்றும் சுவையான வடைகறி.", available: true },
    { id: 1017, name: "Poori Vadacurry", tamilName: "பூரி வடைகறி", price: 90, emoji: "🥘", description: "Poori served with vadacurry.", tamilDesc: "பூரி மற்றும் சுவையான வடைகறி.", available: true },
    { id: 1018, name: "Idiyappam Vadacurry", tamilName: "இடியாப்பம் வடைகறி", price: 75, emoji: "🥘", description: "Idiyappam served with vadacurry.", tamilDesc: "இடியாப்பம் மற்றும் சுவையான வடைகறி.", available: true },
    { id: 1019, name: "Kuli Paniyaram", tamilName: "குழிப்பணியாரம்", price: 60, emoji: "🥘", description: "Shallow-fried rice dumplings.", tamilDesc: "சுவையான குழிப்பணியாரம்.", available: true },
    { id: 1020, name: "Appam (1)", tamilName: "ஆப்பம் (1)", price: 40, emoji: "🥘", description: "Soft rice pancake.", tamilDesc: "மென்மையான ஆப்பம்.", available: true }
  ],
  dosai_special: [
    { id: 2001, name: "Gobi Mushroom Dosai", tamilName: "கோபி காளான் தோசை", price: 135, emoji: "🥘", description: "Dosa with gobi and mushroom.", tamilDesc: "கோபி மற்றும் காளான் நிரப்பப்பட்ட தோசை.", available: true },
    { id: 2002, name: "Paneer Dosai", tamilName: "பன்னீர் தோசை", price: 135, emoji: "🥘", description: "Dosa with paneer filling.", tamilDesc: "பன்னீர் நிரப்பப்பட்ட சுவையான தோசை.", available: true },
    { id: 2003, name: "Gobi Masala Dosai", tamilName: "கோபி மசாலா தோசை", price: 135, emoji: "🥘", description: "Dosa with spiced gobi.", tamilDesc: "மசாலா கோபி நிரப்பப்பட்ட தோசை.", available: true },
    { id: 2004, name: "Dimond Dosai", tamilName: "டைமண்ட் தோசை", price: 135, emoji: "🥘", description: "Diamond cut special dosa.", tamilDesc: "டைமண்ட் வடிவில் வெட்டப்பட்ட சிறப்பு தோசை.", available: true },
    { id: 2005, name: "Mushroom Masala Dosai", tamilName: "காளான் மசாலா தோசை", price: 135, emoji: "🥘", description: "Dosa with spiced mushroom.", tamilDesc: "காளான் மசாலா நிரப்பப்பட்ட தோசை.", available: true },
    { id: 2006, name: "Paneer Mushroom Masala Dosai", tamilName: "பன்னீர் காளான் மசாலா தோசை", price: 135, emoji: "🥘", description: "Dosa with paneer and mushroom.", tamilDesc: "பன்னீர் மற்றும் காளான் மசாலா தோசை.", available: true },
    { id: 2007, name: "Chilly Paneer Dosai", tamilName: "சில்லி பன்னீர் தோசை", price: 135, emoji: "🥘", description: "Spicy chilly paneer dosa.", tamilDesc: "காரமான சில்லி பன்னீர் தோசை.", available: true }
  ],
  dosa_varieties: [
    { id: 3001, name: "Onion Dosai", tamilName: "வெங்காய தோசை", price: 100, emoji: "🥘", description: "Dosa topped with onions.", tamilDesc: "வெங்காயம் தூவிய தோசை.", available: true },
    { id: 3002, name: "Onion Rava Dosai", tamilName: "வெங்காய ரவா தோசை", price: 100, emoji: "🥘", description: "Crispy semolina onion dosa.", tamilDesc: "வெங்காயம் சேர்த்த மொறுமொறு ரவா தோசை.", available: true },
    { id: 3003, name: "Onion Masala Dosai", tamilName: "வெங்காய மசாலா தோசை", price: 115, emoji: "🥘", description: "Onion dosa with potato filling.", tamilDesc: "வெங்காயம் மற்றும் உருளைக்கிழங்கு மசாலா தோசை.", available: true },
    { id: 3004, name: "Ghee Dosai", tamilName: "நெய் தோசை", price: 120, image: "/dosa_cone.png", description: "Dosa roasted in ghee.", tamilDesc: "நெய்யில் சுடப்பட்ட மணமான தோசை.", available: true },
    { id: 3005, name: "Ghee Roast Masala Dosai", tamilName: "நெய் ரோஸ்ட் மசாலா தோசை", price: 130, image: "/dosa_cone.png", description: "Ghee dosa with masala.", tamilDesc: "நெய் ரோஸ்ட் மற்றும் உருளைக்கிழங்கு மசாலா.", available: true },
    { id: 3006, name: "Paper Roast", tamilName: "பேப்பர் ரோஸ்ட்", price: 130, image: "/dosa_cone.png", description: "Extra thin crispy dosa.", tamilDesc: "மெல்லிய மற்றும் மொறுமொறுப்பான பேப்பர் ரோஸ்ட்.", available: true },
    { id: 3007, name: "Plain Uthappam", tamilName: "சாதாரண ஊத்தப்பம்", price: 80, image: "/uthappam.png", description: "Thick fluffy pancake.", tamilDesc: "மென்மையான கெட்டியான ஊத்தப்பம்.", available: true },
    { id: 3008, name: "Onion Uthappam", tamilName: "வெங்காய ஊத்தப்பம்", price: 100, image: "/uthappam.png", description: "Uthappam with onions.", tamilDesc: "வெங்காயம் தூவிய ஊத்தப்பம்.", available: true },
    { id: 3009, name: "Tomato Uthappam", tamilName: "தக்காளி ஊத்தப்பம்", price: 110, emoji: "🥘", description: "Uthappam with tomatoes.", tamilDesc: "தக்காளி தூவிய ஊத்தப்பம்.", available: true },
    { id: 3010, name: "Peas Uthappam", tamilName: "பட்டாணி ஊத்தப்பம்", price: 110, emoji: "🥘", description: "Uthappam with green peas.", tamilDesc: "பட்டாணி தூவிய ஊத்தப்பம்.", available: true },
    { id: 3011, name: "Coconut Uthappam", tamilName: "தேங்காய் ஊத்தப்பம்", price: 110, emoji: "🥘", description: "Uthappam with coconut.", tamilDesc: "தேங்காய் துருவல் தூவிய ஊத்தப்பம்.", available: true },
    { id: 3012, name: "Parota Veg Kuruma", tamilName: "பரோட்டா சைவ குருமா", price: 80, emoji: "🥘", description: "Parota with veg kuruma.", tamilDesc: "பரோட்டா மற்றும் காய்கறி குருமா.", available: true },
    { id: 3013, name: "Chappathi Kuruma", tamilName: "சப்பாத்தி குருமா", price: 70, emoji: "🥘", description: "Chappathi with kuruma.", tamilDesc: "சப்பாத்தி மற்றும் காய்கறி குருமா.", available: true },
    { id: 3014, name: "Mini Tiffen", tamilName: "மினி டிபன்", price: 110, emoji: "🥘", description: "Small portion breakfast variety.", tamilDesc: "சிறிய அளவிலான காலை உணவு வகைகள்.", available: true },
    { id: 3015, name: "Kara Dosai", tamilName: "கார தோசை", price: 125, emoji: "🥘", description: "Spicy red chutney dosa.", tamilDesc: "காரமான சட்னி தடவிய தோசை.", available: true },
    { id: 3016, name: "Veg Dosai", tamilName: "சைவ தோசை", price: 135, emoji: "🥘", description: "Dosa with mixed vegetables.", tamilDesc: "காய்கறிகள் சேர்த்த சத்தான தோசை.", available: true },
    { id: 3017, name: "Podi Dosai", tamilName: "பொடி தோசை", price: 80, emoji: "🥘", description: "Dosa with spiced powder.", tamilDesc: "இட்லி பொடி தூவிய தோசை.", available: true }
  ],
  dosa_light: [
    { id: 4001, name: "Raagi Dosa", tamilName: "ராகி தோசை", price: 45, emoji: "🥘", description: "Healthy finger millet dosa.", tamilDesc: "சத்தான ராகி (கேழ்வரகு) தோசை.", available: true },
    { id: 4002, name: "Cholam Dosa", tamilName: "சோள தோசை", price: 45, emoji: "🥘", description: "Healthy sorghum dosa.", tamilDesc: "சத்தான சோளத் தோசை.", available: true },
    { id: 4003, name: "Kambu Dosa", tamilName: "கம்பு தோசை", price: 45, emoji: "🥘", description: "Healthy pearl millet dosa.", tamilDesc: "சத்தான கம்பு தோசை.", available: true },
    { id: 4004, name: "Wheat Dosa", tamilName: "கோதுமை தோசை", price: 45, emoji: "🥘", description: "Healthy wheat dosa.", tamilDesc: "சத்தான கோதுமை தோசை.", available: true },
    { id: 4005, name: "Set Dosa with Vadacurry", tamilName: "செட் தோசை மற்றும் வடைகறி", price: 75, emoji: "🥘", description: "Soft set dosa with vadacurry.", tamilDesc: "மென்மையான செட் தோசை மற்றும் வடைகறி.", available: true },
    { id: 4006, name: "Neer Dosa with Jaggery & Coconut", tamilName: "நீர் தோசை", price: 75, emoji: "🥘", description: "Thin rice dosa with sweet dip.", tamilDesc: "நீர் தோசை, வெல்லம் மற்றும் தேங்காய் பால்.", available: true },
    { id: 4007, name: "Mysore Masala Dosa", tamilName: "மைசூர் மசாலா தோசை", price: 75, image: "/mysore_masala_dosa.jpg", description: "Spicy mysore style dosa.", tamilDesc: "மைசூர் பாணி காரமான மசாலா தோசை.", available: true }
  ],
  evening_snacks: [
    { id: 5001, name: "Bajji (4)", tamilName: "பஜ்ஜி (4)", price: 40, image: "/mysore_bonda.jpg", description: "Crispy fried fritters.", tamilDesc: "மொறுமொறுப்பான காய்கறி பஜ்ஜிகள்.", available: true },
    { id: 5002, name: "Bonda (2)", tamilName: "போண்டா (2)", price: 35, image: "/mysore_bonda.jpg", description: "Golden fried dumplings.", tamilDesc: "பொன்னிறமாக பொரிக்கப்பட்ட போண்டா.", available: true },
    { id: 5003, name: "Chola Poori", tamilName: "சோலா பூரி", price: 80, image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400", description: "Fluffy poori with channa.", tamilDesc: "பெரிய பூரி மற்றும் சென்னா மசாலா.", available: true },
    { id: 5004, name: "Chilly Parota", tamilName: "சில்லி பரோட்டா", price: 175, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400", description: "Spicy shredded parota.", tamilDesc: "காரமான பிய்த்துப் போட்ட பரோட்டா.", available: true },
    { id: 5005, name: "Kaima Idly (2)", tamilName: "கைமா இட்லி (2)", price: 165, emoji: "🥘", description: "Fried idly with spices.", tamilDesc: "மசாலா சேர்த்து வறுக்கப்பட்ட இட்லி துண்டுகள்.", available: true }
  ],
  rice_chinese: [
    { id: 6001, name: "Schezwan Fried Rice", tamilName: "செஸ்வான் ஃபுரைடு ரைஸ்", price: 175, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400", description: "Spicy fried rice.", tamilDesc: "காரமான செஸ்வான் பாணி வறுத்த சாதம்.", available: true },
    { id: 6002, name: "Schezwan Mushroom Rice", tamilName: "செஸ்வான் காளான் சாதம்", price: 180, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", description: "Mushroom fried rice.", tamilDesc: "காளான் சேர்த்த செஸ்வான் வறுத்த சாதம்.", available: true },
    { id: 6003, name: "Schezwan Paneer Rice", tamilName: "செஸ்வான் பன்னீர் சாதம்", price: 180, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400", description: "Paneer fried rice.", tamilDesc: "பன்னீர் சேர்த்த செஸ்வான் வறுத்த சாதம்.", available: true },
    { id: 6004, name: "Schezwan Gobi Rice", tamilName: "செஸ்வான் கோபி சாதம்", price: 180, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400", description: "Gobi fried rice.", tamilDesc: "கோபி சேர்த்த செஸ்வான் வறுத்த சாதம்.", available: true }
  ],
  noodles: [
    { id: 7001, name: "Schezwan Noodles", tamilName: "செஸ்வான் நூடுல்ஸ்", price: 165, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400", description: "Spiced noodles.", tamilDesc: "காரமான செஸ்வான் பாணி நூடுல்ஸ்.", available: true },
    { id: 7002, name: "Schezwan Mushroom Noodles", tamilName: "செஸ்வான் காளான் நூடுல்ஸ்", price: 180, emoji: "🍜", description: "Noodles with mushrooms.", tamilDesc: "காளான் சேர்த்த செஸ்வான் நூடுல்ஸ்.", available: true },
    { id: 7003, name: "Schezwan Gobi Noodles", tamilName: "செஸ்வான் கோபி நூடுல்ஸ்", price: 180, emoji: "🍜", description: "Noodles with spiced gobi.", tamilDesc: "கோபி சேர்த்த செஸ்வான் நூடுல்ஸ்.", available: true }
  ],
  soups: [
    { id: 8001, name: "Tomato Soup", tamilName: "தக்காளி சூப்", price: 65, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400", description: "Creamy tomato soup.", tamilDesc: "சுவையான தக்காளி சூப்.", available: true },
    { id: 8002, name: "Onion Soup", tamilName: "வெங்காய சூப்", price: 65, image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400", description: "French onion style soup.", tamilDesc: "வெங்காய சாறு கலந்த சூப்.", available: true },
    { id: 8003, name: "Veg Soup", tamilName: "காய்கறி சூப்", price: 65, image: "https://images.unsplash.com/photo-1588588538734-f7fa2b00b3cc?w=400", description: "Mixed vegetable soup.", tamilDesc: "பல்வேறு காய்கறிகள் கலந்த சூப்.", available: true },
    { id: 8004, name: "Green Peas Soup", tamilName: "பட்டாணி சூப்", price: 65, emoji: "🥣", description: "Fresh green peas soup.", tamilDesc: "பச்சை பட்டாணி சூப்.", available: true },
    { id: 8005, name: "Sweet Corn Soup", tamilName: "ஸ்வீட் கார்ன் சூப்", price: 65, image: "https://images.unsplash.com/photo-1604908550911-4c9a70a8f9a8?w=400", description: "Corn soup.", tamilDesc: "இனிப்பு சோளம் கலந்த சூப்.", available: true },
    { id: 8006, name: "Sweet Corn Veg Soup", tamilName: "காய்கறி சோள சூப்", price: 65, emoji: "🥣", description: "Corn soup with vegetables.", tamilDesc: "காய்கறி மற்றும் சோளம் கலந்த சூப்.", available: true },
    { id: 8007, name: "Mushroom Soup", tamilName: "காளான் சூப்", price: 65, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400", description: "Creamy mushroom soup.", tamilDesc: "சுவையான காளான் சூப்.", available: true }
  ],
  lunch: [
    { id: 9001, name: "Unlimited Meals", tamilName: "அன்லிமிடெட் மீல்ஸ்", price: 125, image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400", description: "Full thali meal.", tamilDesc: "முழுமையான தென்னிந்திய மதிய உணவு.", available: true },
    { id: 9002, name: "Parcel Meals", tamilName: "பார்சல் மீல்ஸ்", price: 130, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", description: "Takeaway thali.", tamilDesc: "பார்சல் மதிய உணவு.", available: true },
    { id: 9003, name: "Curd Rice", tamilName: "தயிர் சாதம்", price: 60, image: "https://images.unsplash.com/photo-1645177628172-a9f3e4a9ca93?w=400", description: "Rice with yogurt.", tamilDesc: "சுவையான தயிர் சாதம்.", available: true },
    { id: 9004, name: "Sambar Rice", tamilName: "சாம்பார் சாதம்", price: 60, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400", description: "Rice with sambar.", tamilDesc: "மணமான சாம்பார் சாதம்.", available: true },
    { id: 9005, name: "Quick Lunch", tamilName: "குயிக் லஞ்ச்", price: 120, emoji: "🍚", description: "Fast thali meal.", tamilDesc: "விரைவான மதிய உணவு.", available: true },
    { id: 9006, name: "Variety Rice", tamilName: "கலவை சாதம்", price: 60, emoji: "🍚", description: "Daily special rice.", tamilDesc: "தினசரி வகை சாதம்.", available: true },
    { id: 9007, name: "Brinji Kuruma", tamilName: "பிரிஞ்சி குருமா", price: 60, emoji: "🍚", description: "Rice with Brinji kuruma.", tamilDesc: "பிரிஞ்சி சாதம் மற்றும் குருமா.", available: true },
    { id: 9008, name: "Lemon Rice", tamilName: "எலுமிச்சை சாதம்", price: 60, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400", description: "Tangy lemon rice.", tamilDesc: "புளிப்பான எலுமிச்சை சாதம்.", available: true },
    { id: 9009, name: "Puli Rice", tamilName: "புளி சாதம்", price: 60, emoji: "🍚", description: "Tamarind rice.", tamilDesc: "சுவையான புளி சாதம்.", available: true }
  ],
  beverages: [
    { id: 10001, name: "Coffee", tamilName: "காபி", price: 35, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400", description: "Filter coffee.", tamilDesc: "ஃபில்டர் காபி.", available: true },
    { id: 10002, name: "Milk", tamilName: "பால்", price: 35, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", description: "Fresh milk.", tamilDesc: "தூய பசும்பால்.", available: true },
    { id: 10003, name: "Boost / Horlicks", tamilName: "பூஸ்ட் / ஹார்லிக்ஸ்", price: 40, image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400", description: "Malt beverage.", tamilDesc: "சத்தான பானம்.", available: true },
    { id: 10004, name: "Tea", tamilName: "தேநீர் (டீ)", price: 35, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400", description: "Spiced tea.", tamilDesc: "மணமான டீ.", available: true }
  ],
  tandoori_breads: [
    { id: 11001, name: "Nan", tamilName: "நான்", price: 30, emoji: "🫓", description: "Plain tandoori nan.", tamilDesc: "சாதாரண தந்தூரி நான்.", available: true },
    { id: 11002, name: "Veg Nan", tamilName: "சைவ நான்", price: 40, emoji: "🫓", description: "Vegetable nan.", tamilDesc: "காய்கறி சேர்த்த நான்.", available: true },
    { id: 11003, name: "Stuffed Nan", tamilName: "ஸ்டஃப்டு நான்", price: 160, emoji: "🫓", description: "Stuffed tandoori nan.", tamilDesc: "மசாலா நிரப்பப்பட்ட நான்.", available: true },
    { id: 11004, name: "Butter Nan", tamilName: "வெண்ணெய் நான்", price: 165, emoji: "🫓", description: "Nan with butter.", tamilDesc: "வெண்ணெய் தடவிய நான்.", available: true },
    { id: 11005, name: "Paneer Nan", tamilName: "பன்னீர் நான்", price: 170, emoji: "🫓", description: "Nan with paneer.", tamilDesc: "பன்னீர் சேர்த்த நான்.", available: true },
    { id: 11006, name: "Kashmiri Nan", tamilName: "காஷ்மீரி நான்", price: 170, emoji: "🫓", description: "Sweet tandoori nan.", tamilDesc: "இனிப்பு தந்தூரி நான்.", available: true },
    { id: 11007, name: "Jeera Nan", tamilName: "சீரக நான்", price: 170, emoji: "🫓", description: "Nan with cumin.", tamilDesc: "சீரகம் சேர்த்த நான்.", available: true },
    { id: 11008, name: "Roti", tamilName: "ரொட்டி", price: 160, emoji: "🫓", description: "Plain tandoori roti.", tamilDesc: "தந்தூரி ரொட்டி.", available: true },
    { id: 11009, name: "Butter Roti", tamilName: "வெண்ணெய் ரொட்டி", price: 160, emoji: "🫓", description: "Roti with butter.", tamilDesc: "வெண்ணெய் தடவிய ரொட்டி.", available: true },
    { id: 11010, name: "Kulcha", tamilName: "குல்ச்சா", price: 160, emoji: "🫓", description: "Leavened flatbread.", tamilDesc: "சுவையான குல்ச்சா.", available: true },
    { id: 11011, name: "Masala Kulcha", tamilName: "மசாலா குல்ச்சா", price: 160, emoji: "🫓", description: "Spiced flatbread.", tamilDesc: "மசாலா குல்ச்சா.", available: true },
    { id: 11012, name: "Stuffed Paratha", tamilName: "ஸ்டஃப்டு பரோட்டா", price: 160, emoji: "🫓", description: "Stuffed layered bread.", tamilDesc: "மசாலா நிரப்பப்பட்ட பரோட்டா.", available: true }
  ],
  tandoori_side_dishes: [
    { id: 12001, name: "Green Peas Masala", tamilName: "பட்டாணி மசாலா", price: 160, emoji: "🥘", description: "Spiced green peas gravy.", tamilDesc: "பட்டாணி மசாலா கிரேவி.", available: true },
    { id: 12002, name: "Kaju Masala", tamilName: "முந்திரி மசாலா", price: 200, emoji: "🥘", description: "Rich cashew nut gravy.", tamilDesc: "முந்திரி சேர்த்த பணக்கார கிரேவி.", available: true },
    { id: 12003, name: "Mushroom Masala", tamilName: "காளான் மசாலா", price: 180, emoji: "🥘", description: "Spiced mushroom gravy.", tamilDesc: "காளான் மசாலா கிரேவி.", available: true },
    { id: 12004, name: "Mushroom Fry", tamilName: "காளான் வறுவல்", price: 180, emoji: "🥘", description: "Sauteed mushroom pieces.", tamilDesc: "சுவையான காளான் வறுவல்.", available: true },
    { id: 12005, name: "Mushroom Manchurian", tamilName: "காளான் மஞ்சூரியன்", price: 180, emoji: "🥘", description: "Indo-Chinese mushroom.", tamilDesc: "சைனீஸ் பாணி காளான்.", available: true },
    { id: 12006, name: "Mushroom Pepper Salt", tamilName: "காளான் மிளகு வறுவல்", price: 180, emoji: "🥘", description: "Mushroom with pepper salt.", tamilDesc: "மிளகு மற்றும் உப்பு சேர்த்த காளான்.", available: true },
    { id: 12007, name: "Mixed Veg Kuruma", tamilName: "காய்கறி குருமா", price: 170, emoji: "🥘", description: "Mixed vegetable kuruma.", tamilDesc: "காய்கறிகள் கலந்த குருமா.", available: true },
    { id: 12008, name: "Navarathna Kuruma", tamilName: "நவரத்தின குருமா", price: 185, emoji: "🥘", description: "Rich nine-gem vegetable gravy.", tamilDesc: "நவரத்தின குருமா.", available: true }
  ],
  starters: [
    { id: 13001, name: "Papad", tamilName: "அப்பளம்", price: 30, emoji: "🥘", description: "Crispy lentil cracker.", tamilDesc: "மொறுமொறுப்பான அப்பளம்.", available: true },
    { id: 13002, name: "Masala Fry Papad", tamilName: "மசாலா அப்பளம்", price: 40, emoji: "🥘", description: "Papad with spiced topping.", tamilDesc: "மசாலா தூவிய அப்பளம்.", available: true },
    { id: 13003, name: "Gobi-65", tamilName: "கோபி-65", price: 160, emoji: "🥘", description: "Crispy fried cauliflower.", tamilDesc: "வறுத்த கோபி துண்டுகள்.", available: true },
    { id: 13004, name: "Finger Chips", tamilName: "ஃபிங்கர் சிப்ஸ்", price: 165, emoji: "🥘", description: "Crispy potato fries.", tamilDesc: "உருளைக்கிழங்கு ஃபிங்கர் சிப்ஸ்.", available: true },
    { id: 13005, name: "Paneer-65", tamilName: "பன்னீர்-65", price: 170, emoji: "🥘", description: "Crispy fried paneer.", tamilDesc: "வறுத்த பன்னீர் துண்டுகள்.", available: true },
    { id: 13006, name: "Mushroom-65", tamilName: "காளான்-65", price: 170, emoji: "🥘", description: "Crispy fried mushroom.", tamilDesc: "வறுத்த காளான் துண்டுகள்.", available: true }
  ],
  curries: [
    { id: 14001, name: "Paneer Butter Masala", tamilName: "பன்னீர் பட்டர் மசாலா", price: 185, emoji: "🥘", description: "Rich tomato paneer gravy.", tamilDesc: "வெண்ணெய் மற்றும் பன்னீர் கிரேவி.", available: true },
    { id: 14002, name: "Paneer Koftha", tamilName: "பன்னீர் கோப்தா", price: 185, emoji: "🥘", description: "Paneer dumpling gravy.", tamilDesc: "பன்னீர் உருண்டை கிரேவி.", available: true },
    { id: 14003, name: "Paneer Manchurian", tamilName: "பன்னீர் மஞ்சூரியன்", price: 185, emoji: "🥘", description: "Indo-Chinese paneer.", tamilDesc: "சைனீஸ் பாணி பன்னீர்.", available: true },
    { id: 14004, name: "Paneer Masala", tamilName: "பன்னீர் மசாலா", price: 175, emoji: "🥘", description: "Classic paneer gravy.", tamilDesc: "சுவையான பன்னீர் மசாலா.", available: true },
    { id: 14005, name: "Malai Koftha", tamilName: "மலாய் கோப்தா", price: 160, emoji: "🥘", description: "Creamy dumpling gravy.", tamilDesc: "மலாய் கோப்தா கிரேவி.", available: true },
    { id: 14006, name: "Veg Koftha", tamilName: "சைவ கோப்தா", price: 160, emoji: "🥘", description: "Veg dumpling gravy.", tamilDesc: "காய்கறி உருண்டை கிரேவி.", available: true },
    { id: 14007, name: "Veg Curry", tamilName: "சைவ கறி", price: 160, emoji: "🥘", description: "Mixed vegetable curry.", tamilDesc: "காய்கறி கறி.", available: true },
    { id: 14008, name: "Veg Manchurian", tamilName: "வெஜ் மஞ்சூரியன்", price: 160, emoji: "🥘", description: "Indo-Chinese mixed veg.", tamilDesc: "சைனீஸ் பாணி காய்கறிகள்.", available: true }
  ],
  salads: [
    { id: 15001, image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400', name: 'Tomato Salad', tamilName: "தக்காளி சாலட்", price: 65, description: 'Sliced tomatoes.', tamilDesc: "தக்காளி துண்டுகள்.", available: true },
    { id: 15002, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', name: 'Veg. Salad', tamilName: "சைவ சாலட்", price: 65, description: 'Mixed fresh veggies.', tamilDesc: "காய்கறி சாலட்.", available: true },
    { id: 15003, emoji: '🥗', name: 'Cucumber Salad', tamilName: "வெள்ளரி சாலட்", price: 65, description: 'Fresh cucumbers.', tamilDesc: "வெள்ளரிக்காய் சாலட்.", available: true },
    { id: 15004, image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400', name: 'Fruit Salad', tamilName: "பழ சாலட்", price: 115, description: 'Mixed fresh fruits.', tamilDesc: "பழங்கள் கலந்த சாலட்.", available: true },
    { id: 15005, image: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400', name: 'Onion Salad', tamilName: "வெங்காய சாலட்", price: 65, description: 'Sliced onions.', tamilDesc: "வெங்காய துண்டுகள்.", available: true }
  ],
  raitha: [
    { id: 16001, emoji: '🥣', name: 'Onion Raitha', tamilName: "வெங்காய ரைத்தா", price: 65, description: 'Yogurt with onions.', tamilDesc: "வெங்காயம் சேர்த்த தயிர்.", available: true },
    { id: 16002, emoji: '🥣', name: 'Veg. Raitha', tamilName: "சைவ ரைத்தா", price: 65, description: 'Yogurt with mixed veg.', tamilDesc: "காய்கறிகள் சேர்த்த தயிர்.", available: true },
    { id: 16003, emoji: '🥣', name: 'Tomato Raitha', tamilName: "தக்காளி ரைத்தா", price: 65, description: 'Yogurt with tomatoes.', tamilDesc: "தக்காளி சேர்த்த தயிர்.", available: true },
    { id: 16004, emoji: '🥣', name: 'Extra Curd', tamilName: "கூடுதல் தயிர்", price: 35, description: 'Plain yogurt bowl.', tamilDesc: "தயிர் ஒரு கிண்ணம்.", available: true }
  ],
}
menuItems.all = Object.values(menuItems)
  .flat()
  .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)


function MenuCard({ item, qty, onAdd, onInc, onDec }) {
  const { t, language } = useLanguage()
  return (
    <div className="fg-card">
      <div className="fg-card-image-wrap">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="fg-card-img"
          />
        ) : (
          <div className="di-card-emoji-wrap">
            <span className="di-card-emoji">{item.emoji || '🍽️'}</span>
          </div>
        )}
      </div>

      <div className="fg-card-content">
        <h3 className="fg-card-title">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</h3>
        <p className="fg-card-desc">{language === 'Tamil' && item.tamilDesc ? item.tamilDesc : item.description}</p>
      </div>

      <div className="fg-card-footer">
        <span className="fg-card-price">Rs. {item.price}</span>
        <div className={`fg-card-status ${item.available ? 'avail' : 'unavail'}`}>
          <span className="fg-card-dot" />
          {item.available ? t('available') : t('notAvailable')}
        </div>
      </div>

      <div className="fg-card-controls">
        <div className="fg-qty-container">
          <button onClick={() => onDec(item.id)} className="fg-qty-btn minus" disabled={qty === 0}>
            <span>−</span>
          </button>
          <div className="fg-qty-display"><span>{qty}</span></div>
          <button onClick={() => item.available ? (qty === 0 ? onAdd(item) : onInc(item.id)) : null} className="fg-qty-btn plus" disabled={!item.available}>
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DineIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useLanguage()
  const {
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    changeQty,
    updateNote,
    totalItems,
    subtotal: totalAmount
  } = useCart()

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [topHeight] = useState(100)
  const [cardScale] = useState(1.0)

  const getQty = id => cart.find(c => c.id === id)?.quantity ?? 0

  const baseItems = menuItems[activeCategory] ?? menuItems.all
  const displayItems = searchQuery.trim()
    ? baseItems.filter(i => {
      const name = language === 'Tamil' && i.tamilName ? i.tamilName : i.name;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    : baseItems

  return (
    <div className="app-container">
      <div className="background-image" />
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} />

      <main className="di-main">
        <div className="di-seg-top">
          <div className="di-topbar">
            <div className="di-search-wrap">
              <input className="di-search-input" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <i className="fa-solid fa-magnifying-glass di-search-icon" />
            </div>
            <button className="di-filter-btn"><i className="fa-solid fa-filter" /></button>
            <button className="di-new-order-btn" onClick={() => { setCart([]); setSearchQuery(''); setIsCartOpen(false); }}>{t('newOrder')}</button>
          </div>

          <div className="di-tabs-wrap">
            {menuCategories.map(cat => (
              <button key={cat.id} className={`di-tab ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                <img src={cat.image} alt={t(cat.id)} className="di-tab-img" onError={e => { e.target.src = '/all menu.png' }} />
                <span>{t(cat.id)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="di-seg-bottom">
          <div className="di-section-header">
            <h2 className="di-section-title">
              {t(activeCategory)}
              <span className="di-section-count">{displayItems.length} {t('items')}</span>
            </h2>
          </div>
          <div className="di-grid di-grid-5" style={{ '--card-scale': cardScale }}>
            {displayItems.length === 0
              ? <div className="di-empty">No items found.</div>
              : displayItems.map(item => (
                <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addToCart} onInc={id => changeQty(id, 1)} onDec={id => changeQty(id, -1)} />
              ))
            }
          </div>
        </div>

        {totalItems > 0 && !isCartOpen && (
          <button className="di-view-cart-btn" onClick={() => { setIsCartOpen(true) }}>
            <i className="fa-solid fa-cart-shopping" />
            <span>{t('viewCart')}</span>
            <span className="di-cart-badge">{totalItems}</span>
          </button>
        )}
      </main>

      {/* Cart sidebar (Floating) - Moved outside di-main for z-index layering */}
      <div className={`di-sidebar di-cart-mode ${isCartOpen ? 'active' : ''}`}>
        <div className="di-cart-header">
          <div className="di-cart-header-left">
            <span className="di-cart-title">{t('cart') || 'Cart'}</span>
            <span className="di-cart-table-pill">{t('tableNo')} 06 <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
          </div>
          <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>
        <div className="di-cart-order-id"># Order ID : 2002</div>

        <div className="di-order-type-tabs">
          <button className="di-ot-tab active"><i className="fa-solid fa-utensils" /> {t('dineIn')}</button>
          <button className="di-ot-tab"><i className="fa-solid fa-bag-shopping" /> {t('takeAway')}</button>
        </div>

        <div className="di-cart-items">
          {cart.length === 0
            ? <p className="di-cart-empty">Cart is empty. Add items from the menu.</p>
            : cart.map(item => (
              <div key={item.id} className="di-cart-item-container">
                <button className="di-cart-remove-circle" onClick={() => setCart(p => p.filter(c => c.id !== item.id))}>✕</button>
                <div className="di-cart-item-body">
                  <div className="di-cart-item-thumb">
                    {item.image ? <img src={item.image} alt={item.name} /> : <span className="di-cart-thumb-emoji">{item.emoji || '🍽️'}</span>}
                  </div>
                  <div className="di-cart-item-details">
                    <p className="di-cart-item-name">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</p>
                    <p className="di-cart-serves">{t('serves')} : 1</p>
                    <p className="di-cart-item-price">Rs. {item.price}</p>
                  </div>
                  <div className="di-cart-item-right">
                    <p className="di-cart-total-label">Total</p>
                    <p className="di-cart-total-amount">{(item.price * item.quantity).toFixed(2)}</p>
                    <p className="di-cart-gst">+ GST</p>
                    <div className="di-cart-stepper">
                      <button className="di-cart-qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                      <span className="di-cart-qty-num">{item.quantity}</span>
                      <button className="di-cart-qty-btn plus" onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
                <div className="di-cart-note-wrap">
                  <input className="di-cart-note-input" placeholder="Please, Just a little bit spicy only...." value={item.note || ''} onChange={e => updateNote(item.id, e.target.value)} />
                </div>
              </div>
            ))
          }
        </div>

        <div className="di-cart-footer">
          <button className="di-add-more-btn" onClick={() => setIsCartOpen(false)}>
            <i className="fa-solid fa-plus" /> {t('addMore')}
          </button>
          <button className="di-place-order-btn" disabled={cart.length === 0} onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>
            {t('confirmOrder')}
          </button>
        </div>

      </div>

      <AIAssistantOverlay
        cart={cart}
        setCart={setCart}
        navigate={navigate}
        isCartOpen={isCartOpen}
        menuItems={Object.entries(menuItems).flatMap(([catId, items]) => items.map(item => ({ ...item, category: catId })))}
        menuCategories={menuCategories}
      />
    </div>
  )
}
