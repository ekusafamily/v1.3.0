import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const alterTableQuery = `
  ALTER TABLE communities 
  ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;
`;

async function migrate() {
    try {
        await pool.query(alterTableQuery);
        console.log("Column 'whatsapp_link' added to 'communities' table.");
    } catch (error) {
        console.error("Error altering table:", error);
    } finally {
        pool.end();
    }
}

migrate();
