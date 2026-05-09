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
    console.log("Connected to database.");

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Tables:");
    for (let row of res.rows) {
      console.log(`- ${row.table_name}`);
      const columnsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [row.table_name]);
      for (let col of columnsRes.rows) {
        console.log(`    ${col.column_name} (${col.data_type})`);
      }
    }
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await client.end();
  }
}

inspect();
