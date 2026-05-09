const { Client } = require('pg');

const client = new Client({
  host: 'banking-db.cnkegcm24ikf.ap-south-2.rds.amazonaws.com',
  user: 'food_admin',
  password: 'foodadmin@123',
  database: 'food_ordering_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function inspect() {
  try {
    await client.connect();
    
    const catRes = await client.query(`SELECT * FROM menu_categories LIMIT 3`);
    console.log("Categories:", catRes.rows);
    
    const itemRes = await client.query(`SELECT * FROM menu_items LIMIT 3`);
    console.log("Items:", itemRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

inspect();
