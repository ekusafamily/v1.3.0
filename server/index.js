
import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// List of Kenya Counties
const KENYA_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera", "Marsabit",
    "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
    "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi",
    "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
    "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi City"
];

app.use(cors());
app.use(express.json());

const logs = [];
const MAX_LOGS = 100;

function logToMemory(type, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    logs.unshift(`[${timestamp}] [${type}] ${message}`);
    if (logs.length > MAX_LOGS) logs.pop();

    // Original console output
    process.stdout.write(`[${type}] ${message}\n`);
}

// Override console methods
console.log = (...args) => logToMemory('INFO', ...args);
console.error = (...args) => logToMemory('ERROR', ...args);

// Logger middleware
app.use((req, res, next) => {
    if (req.url !== '/logs') { // Don't log requests to the log viewer itself
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

// Logs Viewer Endpoint
app.get("/logs", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Server Logs</title>
            <meta http-equiv="refresh" content="2">
            <style>
                body { background: #0d1117; color: #c9d1d9; font-family: monospace; padding: 20px; }
                .log { padding: 4px 0; border-bottom: 1px solid #30363d; white-space: pre-wrap; }
                .INFO { color: #58a6ff; }
                .ERROR { color: #f85149; }
                h1 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Server Logs (Auto-refresh: 2s)</h1>
            <div id="logs">
                ${logs.map(log => {
        const type = log.includes('[ERROR]') ? 'ERROR' : 'INFO';
        return `<div class="log ${type}">${log}</div>`;
    }).join('')}
            </div>
        </body>
        </html>
    `);
});

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Multer (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

async function initDB() {
    try {
        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS communities (
                id SERIAL PRIMARY KEY,
                county TEXT UNIQUE NOT NULL,
                members_count TEXT NOT NULL,
                leader_name TEXT NOT NULL,
                whatsapp_link TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Ensure column exists (for existing tables)
        await pool.query(`
            ALTER TABLE communities 
            ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;
        `);

        // Create blogs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                excerpt TEXT,
                content TEXT,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create programs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS programs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                date TEXT,
                location TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create past_events table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS past_events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                date TEXT,
                image_url TEXT,
                images TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add images column if it doesn't exist (migration)
        await pool.query(`
            ALTER TABLE past_events 
            ADD COLUMN IF NOT EXISTS images TEXT[];
        `);

        // Create program_interests table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS program_interests (
                id SERIAL PRIMARY KEY,
                program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
                user_email TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(program_id, user_email)
            );
        `);

        console.log("Database schema initialized.");
    } catch (err) {
        console.error("Schema init failed:", err);
    }
}

initDB();

// GET endpoint
app.get("/api/registrations", async (req, res) => {
    try {
        console.log("Fetching registrations...");
        const result = await pool.query("SELECT * FROM registration ORDER BY created_at DESC");
        console.log(`Found ${result.rows.length} rows`);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Validation schema
const registrationSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    idNumber: z.string().min(5),
    county: z.string().min(2),
    password: z.string().min(6),
});

// POST endpoint - Register
app.post("/api/register", async (req, res) => {
    try {
        const data = registrationSchema.parse(req.body);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const result = await pool.query(
            `INSERT INTO registration (first_name, last_name, email, phone, id_number, county, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, county`,
            [data.firstName, data.lastName, data.email, data.phone, data.idNumber, data.county, hashedPassword]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation error:", JSON.stringify(error.errors, null, 2));
            res.status(400).json({ error: error.errors });
        } else if (error.code === "23505") { // Unique violation
            console.error("Unique violation:", error.detail);
            res.status(409).json({ error: "User already registered (Email, Phone, or ID)" });
        } else {
            console.error("Registration failed:", error.message);
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

// POST endpoint - Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        // Find user
        const result = await pool.query("SELECT * FROM registration WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            console.log("User not found");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        console.log("User found:", user.id);

        if (!user.password) {
            console.log("User has no password set");
            return res.status(401).json({ error: "Account not set up for login. Please contact admin." });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log("Password mismatch");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        console.log("Login successful");
        // Return user info (excluding password)
        res.json({
            success: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                county: user.county,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Super Admin Verification Endpoint
app.post("/api/admin/verify-super-password", async (req, res) => {
    try {
        const { password } = req.body;

        // Fetch passwords for super admin IDs (1, 16, 21)
        const result = await pool.query(
            "SELECT password FROM registration WHERE id IN (1, 16, 21)"
        );

        let isValid = false;

        // Check against each found admin password
        for (const row of result.rows) {
            if (row.password) {
                const match = await bcrypt.compare(password, row.password);
                if (match) {
                    isValid = true;
                    break;
                }
            }
        }

        if (isValid) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: "Incorrect admin password" });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// GET - County Statistics
app.get("/api/admin/county-stats", async (req, res) => {
    try {
        // Get counts from DB
        const result = await pool.query("SELECT county, COUNT(*) as count FROM registration GROUP BY county");

        const dbCounts = {};
        result.rows.forEach(row => {
            if (row.county) {
                dbCounts[row.county] = parseInt(row.count, 10);
            }
        });

        // Merge with full county list to ensure all 47 check out
        const stats = KENYA_COUNTIES.map(county => ({
            county,
            count: dbCounts[county] || 0
        }));

        // Sort by count descending
        stats.sort((a, b) => b.count - a.count);

        res.json(stats);
    } catch (error) {
        console.error("Error fetching county stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Communities API

// GET - List all communities
app.get("/api/communities", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM communities ORDER BY county ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching communities:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Create community
app.post("/api/communities", async (req, res) => {
    try {
        const { county, members_count, leader_name, whatsapp_link } = req.body;
        const result = await pool.query(
            "INSERT INTO communities (county, members_count, leader_name, whatsapp_link) VALUES ($1, $2, $3, $4) RETURNING *",
            [county, members_count, leader_name, whatsapp_link]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating community:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT - Update community
app.put("/api/communities/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { county, members_count, leader_name, whatsapp_link } = req.body;
        const result = await pool.query(
            "UPDATE communities SET county = $1, members_count = $2, leader_name = $3, whatsapp_link = $4 WHERE id = $5 RETURNING *",
            [county, members_count, leader_name, whatsapp_link, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Community not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating community:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE - Delete community
app.delete("/api/communities/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM communities WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Community not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting community:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Gemini Integration
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to generate excerpt
async function generateExcerpt(content) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. Falling back to simple truncation.");
        return content.substring(0, 150) + "...";
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Summarize the following blog post content into a concise, engaging excerpt of about 2-3 sentences max. Focus on the key announcement or news:\n\n${content}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini generation failed:", error);
        return content.substring(0, 150) + "..."; // Fallback
    }
}

// Generate Excerpt Endpoint
app.post("/api/generate-excerpt", async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Content is required" });

        const excerpt = await generateExcerpt(content);
        res.json({ excerpt });
    } catch (error) {
        console.error("Excerpt generation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Blogs API

// GET - List all blogs
app.get("/api/blogs", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Create blog
app.post("/api/blogs", async (req, res) => {
    try {
        const { title, excerpt, content, category } = req.body;
        const result = await pool.query(
            "INSERT INTO blogs (title, excerpt, content, category) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, excerpt, content, category]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT - Update blog
app.put("/api/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content, category } = req.body;
        const result = await pool.query(
            "UPDATE blogs SET title = $1, excerpt = $2, content = $3, category = $4 WHERE id = $5 RETURNING *",
            [title, excerpt, content, category, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE - Delete blog
app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM blogs WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Programs API

// GET - List all programs
app.get("/api/programs", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM programs ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching programs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Create program
app.post("/api/programs", async (req, res) => {
    try {
        const { title, description, date, location } = req.body;
        const result = await pool.query(
            "INSERT INTO programs (title, description, date, location) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, date, location]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating program:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT - Update program
app.put("/api/programs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, location } = req.body;
        const result = await pool.query(
            "UPDATE programs SET title = $1, description = $2, date = $3, location = $4 WHERE id = $5 RETURNING *",
            [title, description, date, location, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Program not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating program:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE - Delete program
app.delete("/api/programs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM programs WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Program not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting program:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Program Interest APIs

// POST - Register interest
app.post("/api/programs/:id/interest", async (req, res) => {
    try {
        const { id } = req.params;
        const { user_email } = req.body;

        if (!user_email) return res.status(400).json({ error: "User email required" });

        await pool.query(
            "INSERT INTO program_interests (program_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, user_email]
        );
        res.json({ success: true, message: "Interest registered" });
    } catch (error) {
        console.error("Error registering interest:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET - Get interested members for a program (Admin only)
app.get("/api/programs/:id/interested", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT pi.user_email, r.first_name, r.last_name, r.phone as phone_number 
            FROM program_interests pi
            LEFT JOIN registration r ON LOWER(pi.user_email) = LOWER(r.email)
            WHERE pi.program_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching interested members:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET - Get user's registered programs
app.get("/api/my-interests", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json([]);

        const result = await pool.query(
            "SELECT program_id FROM program_interests WHERE LOWER(user_email) = LOWER($1)",
            [email]
        );
        res.json(result.rows.map(row => row.program_id));
    } catch (error) {
        console.error("Error fetching my interests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Past Events API

// GET - List all past events (Public)
app.get("/api/past-events", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM past_events ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching past events:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Upload Past Event (Super Admin Password Protected)
app.post("/api/admin/past-events", upload.array("images", 10), async (req, res) => {
    try {
        const { title, description, date, password } = req.body;
        const files = req.files;

        console.log(`[DEBUG] Upload Attempt. Body Password: '${password}', Env Password: '${process.env.SUPER_ADMIN_PASSWORD}'`);
        console.log(`[DEBUG] Files received: ${files ? files.length : 0}`);

        // Check Super Admin Password
        if (password !== process.env.SUPER_ADMIN_PASSWORD) {
            console.warn("[DEBUG] Password mismatch!");
            return res.status(403).json({ error: "Unauthorized: Invalid Super Admin Password" });
        }

        if (!files || files.length === 0) {
            console.warn("[DEBUG] No files provided.");
            return res.status(400).json({ error: "At least one image is required" });
        }

        const imageUrls = [];

        for (const file of files) {
            // Upload to Supabase Storage
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('past-events')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error("Supabase upload error:", uploadError);
                continue; // Skip failed uploads
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('past-events')
                .getPublicUrl(fileName);

            imageUrls.push(publicUrl);
        }

        if (imageUrls.length === 0) {
            return res.status(500).json({ error: "Failed to upload any images" });
        }

        // Save to Database (Store primary image in `image_url` for backward compatibility, all in `images`)
        const result = await pool.query(
            "INSERT INTO past_events (title, description, date, image_url, images) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, date, imageUrls[0], imageUrls]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error creating past event:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// User Search API (Admin Only)
app.post("/api/admin/search-users", async (req, res) => {
    try {
        const { query } = req.body; // Can be phone or ID (partially hidden in UI but full here)

        if (!query) return res.status(400).json({ error: "Search query required" });

        const result = await pool.query(
            "SELECT id, first_name, last_name, email, phone, county, role, created_at FROM registration WHERE phone = $1 OR id_number = $1",
            [query]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes go here... (This is where the existing API routes are)

// Anything that doesn't match the above, send back index.html
app.get(/^(?!\/api).+/, (req, res, next) => {
    // Skip API routes so they 404 correctly if not found
    if (req.url.startsWith('/api')) {
        return next();
    }

    // Serve admin.html if the path starts with /admin
    if (req.url.startsWith('/admin') || req.url.includes('admin.html')) {
        res.sendFile(path.join(__dirname, '../dist/admin.html'));
        return;
    }

    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
