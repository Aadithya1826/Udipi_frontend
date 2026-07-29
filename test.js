const fs = require('fs');
async function run() {
  const res = await fetch('http://localhost:5000/api/v1/public/menu/items');
  const data = await res.json();
  const paneerItems = data.filter(d => d.name.toLowerCase().includes('paneer'));
  console.log(paneerItems);
}
run();
