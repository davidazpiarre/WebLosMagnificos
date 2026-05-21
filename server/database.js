const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // Crear tablas si no existen
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT DEFAULT 'user'
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY, title TEXT, content TEXT, image TEXT, date TEXT,
        author_id INTEGER REFERENCES users(id)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY, year TEXT, title TEXT, caption TEXT, image TEXT, date TEXT
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY, path TEXT, country TEXT, device TEXT, source TEXT,
        bounce INTEGER DEFAULT 0, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY, title TEXT, description TEXT, date TEXT,
        image TEXT, year TEXT, status TEXT DEFAULT 'upcoming'
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY, name TEXT, image TEXT, link TEXT
    )`);

    // Settings por defecto
    await pool.query(`
        INSERT INTO settings (key, value) VALUES
            ('podcast1_link', 'https://youtube.com/@podcast1'),
            ('podcast2_link', 'https://spotify.com/podcast2'),
            ('podcast1_logo', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop'),
            ('podcast2_logo', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop'),
            ('event_name', 'Fiestas del Pilar 2026'),
            ('event_date', '2026-10-12')
        ON CONFLICT (key) DO NOTHING
    `);

    // Usuario admin por defecto
    const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
            'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
            ['admin', hashedPassword, 'Administrador', 'admin']
        );
        console.log('Usuario admin creado: admin / admin123');
    }

    // Blogs iniciales
    const blogCount = await pool.query('SELECT COUNT(*) as count FROM blogs');
    if (parseInt(blogCount.rows[0].count) === 0) {
        await pool.query(
            'INSERT INTO blogs (title, content, image, date) VALUES ($1, $2, $3, $4)',
            ['Crónica de la última asamblea', 'Resumen de los puntos clave tratados en nuestra reunión trimestral.',
             'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600', '20 Abr, 2024']
        );
        await pool.query(
            'INSERT INTO blogs (title, content, image, date) VALUES ($1, $2, $3, $4)',
            ['Preparativos para el aniversario', 'Estamos organizando algo muy especial para celebrar nuestros 30 años.',
             'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=600', '12 Abr, 2024']
        );
    }

    return pool;
}

module.exports = { setupDatabase };
