const menuItems = [{id: 185, name: "Paneer Fried Rice"}];

const NON_FOOD_WORDS = new Set([
  'session', 'sessions', 'something', 'items', 'item', 'food', 'dishes', 'dish',
  'details', 'page', 'screen', 'checkout', 'payment', 'order', 'number',
  'phone', 'name', 'mode', 'cash', 'upi', 'online', 'card', 'table',
  'takeaway', 'dinein', 'dine-in', 'parcel', 'please', 'help', 'view', 'navigate',
  'yes', 'no', 'ok', 'okay', 'sure', 'go', 'to', 'for', 'my', 'is', 'the',
  'each', 'per', 'portion', 'portions', 'plate', 'plates', 'piece', 'pieces', 'nos', 'no',
  'download', 'bill', 'invoice', 'mail', 'buddy', 'track', 'status'
]);

const text = "4 paneer fried rice.";

const normalizeSpeechAndNumbers = (str) => {
  if (!str) return '';
  return str
    .replace(/\*{2,}/g, 'mushroom')
    .replace(/\b(naal|naalu|nangu|naangu|four)\b/gi, '4');
};

const cleanedTextForItems = normalizeSpeechAndNumbers(text).replace(/'s\b/gi, 's').replace(/'/g, '');

const itemRegex = /(\d+)\s+([a-zA-Z\s]+?)(?=\s*(?:and|,|my name|phone|number|mode|cash|upi|for|takeaway|dine-in|parcel|$))/gi;
let mMatch;
const itemsToAdd = [];
while ((mMatch = itemRegex.exec(cleanedTextForItems)) !== null) {
  const qty = parseInt(mMatch[1], 10);
  const rawName = mMatch[2].trim();
  if (rawName && !rawName.match(/^(my|name|phone|number|is|mode|cash|upi|order|please)$/i)) {
    if (!itemsToAdd.some(i => i.name.toLowerCase() === rawName.toLowerCase())) {
      itemsToAdd.push({ name: rawName, quantity: qty });
    }
  }
}

if (itemsToAdd.length === 0 && menuItems && menuItems.length > 0) {
  const cleanInput = cleanedTextForItems.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ');
  menuItems.forEach(item => {
    const cleanItemName = item.name.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ');
    if (cleanInput.includes(cleanItemName) && !itemsToAdd.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
      const itemMatchRegex = new RegExp(`(\\d+)\\s+${cleanItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const qMatch = cleanedTextForItems.match(itemMatchRegex);
      const extractedQty = qMatch ? parseInt(qMatch[1], 10) : 1;
      itemsToAdd.push({ name: item.name, quantity: extractedQty });
    }
  });
}

console.log("itemsToAdd:", itemsToAdd);

const clean = (str) => (str || '')
  .toLowerCase()
  .replace(/th/g, 't')
  .replace(/\s*\(\d+.*?\)/g, '') // remove portion markers like (2), (1 pc), (2 pcs)
  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const findBestMenuItemMatch = (queryName, itemsList) => {
  if (!queryName || !itemsList || itemsList.length === 0) return null;
  
  let qClean = clean(queryName);
  if (!qClean) return null;

  let directMatch = itemsList.find(i =>
    clean(i.name) === qClean || (i.tamilName && clean(i.tamilName) === qClean)
  );
  if (directMatch) return directMatch;
  return null;
}

itemsToAdd.forEach(item => {
  let itemName = item.name.toLowerCase().trim();
  let quantity = item.quantity || 1;
  itemName = itemName.replace(/\s+(each|per|portion|portions|plate|plates|piece|pieces|nos|no)$/i, '').trim();

  const foundItem = findBestMenuItemMatch(itemName, menuItems);
  if (foundItem) {
    console.log("FOUND ITEM:", foundItem);
  } else {
    console.log("FAILED ITEM:", itemName);
  }
});
