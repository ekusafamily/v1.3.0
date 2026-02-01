import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    county TEXT UNIQUE NOT NULL,
    members_count TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function migrate() {
    try {
        await pool.query(createTableQuery);
        console.log("Table 'communities' created or already exists.");

        // Seed with initial data if empty
        const countResult = await pool.query("SELECT COUNT(*) FROM communities");
        if (parseInt(countResult.rows[0].count) === 0) {
            console.log("Seeding initial data...");
            const initialData = [
                { county: "Nairobi", members: "500+", leader: "John Kamau" },
                { county: "Mombasa", members: "200+", leader: "Fatuma Hassan" },
                { county: "Kisumu", members: "200+", leader: "Ochieng' Otieno" },
                { county: "Nakuru", members: "200+", leader: "Grace Wanjiku" },
                { county: "Eldoret", members: "100+", leader: "Kiprop Kibet" },
                { county: "Meru", members: "150+", leader: "Peter Muthomi" },
                { county: "Embu", members: "500+", leader: "---name----" },
            ];

            for (const comm of initialData) {
                await pool.query(
                    "INSERT INTO communities (county, members_count, leader_name) VALUES ($1, $2, $3)",
                    [comm.county, comm.members, comm.leader]
                );
            }
            console.log("Seeded initial communities data.");
        }

    } catch (error) {
        console.error("Error creating table:", error);
    } finally {
        pool.end();
    }
}

migrate();
