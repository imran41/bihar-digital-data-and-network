// api/enroll.js — Vercel Serverless Function
// Handles POST /api/enroll — saves enrollment data to Neon PostgreSQL

import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, phone, course, message } = req.body;

  // Basic validation
  if (!name || !phone || !course) {
    return res.status(400).json({ error: "Name, phone, and course are required." });
  }

  try {
    // Connect to Neon using the DATABASE_URL env variable (set in Vercel dashboard)
    const sql = neon(process.env.DATABASE_URL);

    // Create table if it doesn't exist (safe to run every time)
    await sql`
      CREATE TABLE IF NOT EXISTS enrollments (
        id        SERIAL PRIMARY KEY,
        name      TEXT NOT NULL,
        phone     TEXT NOT NULL,
        course    TEXT NOT NULL,
        message   TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Insert the new enrollment
    const result = await sql`
      INSERT INTO enrollments (name, phone, course, message)
      VALUES (${name}, ${phone}, ${course}, ${message || null})
      RETURNING id, created_at
    `;

    return res.status(200).json({
      success: true,
      message: `Enrollment received! ID: ${result[0].id}`,
      enrolled_at: result[0].created_at,
    });

  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ error: "Database error. Please try again." });
  }
}
