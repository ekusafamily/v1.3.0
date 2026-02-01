
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkUser() {
    try {
        console.log("Checking for user: df@gmail.com");

        // Check exact match
        const exact = await pool.query("SELECT * FROM registration WHERE email = 'df@gmail.com'");
        console.log("Exact match count:", exact.rows.length);
        if (exact.rows.length > 0) console.log("Exact match data:", exact.rows[0]);

        // Check case insensitive
        const insensitive = await pool.query("SELECT * FROM registration WHERE LOWER(email) = LOWER('df@gmail.com')");
        console.log("Case-insensitive count:", insensitive.rows.length);

        // Check trimmed
        const trimmed = await pool.query("SELECT * FROM registration WHERE TRIM(LOWER(email)) = TRIM(LOWER('df@gmail.com'))");
        console.log("Trimmed count:", trimmed.rows.length);

        // List all emails to see what's there
        const all = await pool.query("SELECT email FROM registration");
        console.log("All registered emails:", all.rows.map(r => r.email));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkUser();
