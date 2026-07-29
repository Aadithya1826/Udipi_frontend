async function run() {
  const res = await fetch('http://127.0.0.1:8001/api/v1/public/menu/items');
  const data = await res.json();
  const item185 = data.find(d => d.id === 185 || d.item_code === '185');
  console.log("ITEM 185:", item185);
}
run();
