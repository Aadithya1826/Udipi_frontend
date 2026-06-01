const API_BASE = 'http://127.0.0.1:8000';

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api/v1/public/menu/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchItems() {
  const res = await fetch(`${API_BASE}/api/v1/public/menu/items`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function placeOrder(orderData) {
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to place order');
  }
  return res.json();
}

/**
 * Converts raw DB rows into the shape used by the frontend:
 * { categories: [{id, name, image}], itemsMap: { catId: [items] }, allItems: [items] }
 */
export function formatMenuData(dbCategories, dbItems) {
  const categories = [
    { id: 'all', name: 'All Menu', image: '/all menu.png' },
    ...dbCategories.map(c => ({
      id: String(c.id),
      name: c.name,
      image: '/cat_dosa.png',
    })),
  ];

  const itemsMap = {};
  const allItems = [];

  dbItems.forEach(item => {
    const catId = String(item.category_id);
    const formatted = {
      id: Number(item.id),
      name: item.name,
      tamilName: item.name,
      price: Number(item.price),
      image: item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API_BASE}${item.image_url}`) : null,
      description: item.description || '',
      tamilDesc: item.description || '',
      available: item.is_available,
      emoji: '🍽️',
      tags: [dbCategories.find(c => String(c.id) === catId)?.name || 'Food'],
    };
    if (!itemsMap[catId]) itemsMap[catId] = [];
    itemsMap[catId].push(formatted);
    allItems.push(formatted);
  });

  itemsMap.all = allItems;

  return { categories, itemsMap, allItems };
}
