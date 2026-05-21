const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { setupDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'magnificos_secret_key_2026';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/upload', (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err) return res.status(500).json({ message: 'Error al subir: ' + err.message });
        if (!req.file) return res.status(400).json({ message: 'No hay archivo' });
        res.json({ url: `/uploads/${req.file.filename}` });
    });
});

let pool;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token no válido' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
};

// --- BLOGS ---

app.get('/api/blogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al leer la base de datos' });
    }
});

app.post('/api/blogs', authenticateToken, isAdmin, async (req, res) => {
    const { title, content, image } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Título y contenido obligatorios' });
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    try {
        const result = await pool.query(
            'INSERT INTO blogs (title, content, image, date, author_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [title, content, image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600', date, req.user.id]
        );
        res.status(201).json({ id: result.rows[0].id, message: '¡Blog guardado!' });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar en BD' });
    }
});

app.put('/api/blogs/:id', authenticateToken, isAdmin, async (req, res) => {
    const { title, content, image } = req.body;
    try {
        await pool.query('UPDATE blogs SET title=$1, content=$2, image=$3 WHERE id=$4', [title, content, image, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar' });
    }
});

app.delete('/api/blogs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM blogs WHERE id = $1', [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar' });
    }
});

// --- SETTINGS ---

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings');
        const config = {};
        result.rows.forEach(s => config[s.key] = s.value);
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al leer configuración' });
    }
});

app.post('/api/settings', authenticateToken, isAdmin, async (req, res) => {
    const settings = Array.isArray(req.body) ? req.body : [req.body];
    try {
        for (const item of settings) {
            if (item && item.key) {
                await pool.query(
                    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
                    [item.key, item.value]
                );
            }
        }
        res.json({ message: 'Configuración actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno: ' + error.message });
    }
});

// --- ANALYTICS ---

app.post('/api/track', async (req, res) => {
    try {
        const { path, country, device, source, bounce } = req.body;
        await pool.query(
            'INSERT INTO analytics (path, country, device, source, bounce) VALUES ($1, $2, $3, $4, $5)',
            [path || '/', country || 'España', device || 'Desktop', source || 'Directo', bounce || 0]
        );
        res.status(200).json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: true });
    }
});

app.get('/api/analytics', authenticateToken, isAdmin, async (req, res) => {
    try {
        const totalVisits = await pool.query('SELECT COUNT(*) as count FROM analytics');
        const total = parseInt(totalVisits.rows[0].count);

        const sources  = await pool.query('SELECT source, COUNT(*) as count FROM analytics GROUP BY source');
        const countries = await pool.query('SELECT country, COUNT(*) as count FROM analytics GROUP BY country ORDER BY count DESC LIMIT 4');
        const pages = await pool.query(`
            SELECT path, COUNT(*) as visits, COALESCE(SUM(bounce), 0) as bounces
            FROM analytics GROUP BY path ORDER BY visits DESC LIMIT 5
        `);
        const devices = await pool.query('SELECT device, COUNT(*) as count FROM analytics GROUP BY device');

        const last7DaysVisits = [120, 200, 150,
            Math.floor(Math.random()*100)+100,
            Math.floor(Math.random()*200)+200,
            Math.floor(Math.random()*300)+250,
            total
        ];

        res.json({ total, sources: sources.rows, countries: countries.rows, pages: pages.rows, devices: devices.rows, last7DaysVisits });
    } catch (err) {
        res.status(500).json({ error: true });
    }
});

// --- GALERÍA ---

app.get('/api/gallery', async (req, res) => {
    const { year } = req.query;
    try {
        let query, params = [];
        if (year === 'Historicos') {
            query = "SELECT * FROM gallery WHERE (year ~ '^\\d+$' AND year::integer BETWEEN 1971 AND 2000) OR year = 'Historicos' ORDER BY id DESC";
        } else if (year === '2000-2020') {
            query = "SELECT * FROM gallery WHERE (year ~ '^\\d+$' AND year::integer > 2000 AND year::integer <= 2020) OR year = '2000-2020' ORDER BY id DESC";
        } else if (year) {
            query = 'SELECT * FROM gallery WHERE year = $1 ORDER BY id DESC';
            params = [year];
        } else {
            query = 'SELECT * FROM gallery ORDER BY id DESC';
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al leer galería' });
    }
});

app.post('/api/gallery', authenticateToken, isAdmin, async (req, res) => {
    const { year, title, caption, image } = req.body;
    if (!year || !image) return res.status(400).json({ message: 'Año e imagen obligatorios' });
    try {
        const date = new Date().toLocaleDateString('es-ES');
        await pool.query(
            'INSERT INTO gallery (year, title, caption, image, date) VALUES ($1, $2, $3, $4, $5)',
            [year, title || '', caption || '', image, date]
        );
        res.status(201).json({ message: 'Imagen añadida a la galería' });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar imagen' });
    }
});

app.put('/api/gallery/:id', authenticateToken, isAdmin, async (req, res) => {
    const { year, title, caption, image } = req.body;
    try {
        await pool.query('UPDATE gallery SET year=$1, title=$2, caption=$3, image=$4 WHERE id=$5',
            [year, title, caption, image, req.params.id]);
        res.json({ message: 'Imagen actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar galería' });
    }
});

app.delete('/api/gallery/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
        res.json({ message: 'Imagen eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar' });
    }
});

// --- ACTIVIDADES ---

app.get('/api/activities', async (req, res) => {
    const { year } = req.query;
    try {
        let query, params = [];
        if (year === 'Historicos') {
            query = "SELECT * FROM activities WHERE (year ~ '^\\d+$' AND year::integer BETWEEN 1971 AND 2000) OR year = 'Historicos' ORDER BY id DESC";
        } else if (year === '2000-2020') {
            query = "SELECT * FROM activities WHERE (year ~ '^\\d+$' AND year::integer > 2000 AND year::integer <= 2020) OR year = '2000-2020' ORDER BY id DESC";
        } else if (year) {
            query = 'SELECT * FROM activities WHERE year = $1 ORDER BY id DESC';
            params = [year];
        } else {
            query = 'SELECT * FROM activities ORDER BY id DESC';
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al leer actividades' });
    }
});

app.post('/api/activities', authenticateToken, isAdmin, async (req, res) => {
    const { year, title, description, image, date, status } = req.body;
    if (!year || !title || !image) return res.status(400).json({ message: 'Año, título e imagen obligatorios' });
    try {
        const finalDate = date || new Date().toLocaleDateString('es-ES');
        await pool.query(
            'INSERT INTO activities (year, title, description, image, date, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [year, title, description || '', image, finalDate, status || 'upcoming']
        );
        res.status(201).json({ message: 'Actividad añadida' });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar actividad' });
    }
});

app.put('/api/activities/:id', authenticateToken, isAdmin, async (req, res) => {
    const { year, title, description, image, date, status } = req.body;
    try {
        await pool.query(
            'UPDATE activities SET year=$1, title=$2, description=$3, image=$4, date=$5, status=$6 WHERE id=$7',
            [year, title, description, image, date, status, req.params.id]
        );
        res.json({ message: 'Actividad actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar actividad' });
    }
});

app.delete('/api/activities/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM activities WHERE id = $1', [req.params.id]);
        res.json({ message: 'Actividad eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar' });
    }
});

// --- COLABORADORES ---

app.get('/api/collaborators', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collaborators');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener colaboradores' });
    }
});

app.post('/api/collaborators', authenticateToken, isAdmin, async (req, res) => {
    const { name, image, link } = req.body;
    try {
        await pool.query('INSERT INTO collaborators (name, image, link) VALUES ($1, $2, $3)', [name, image, link]);
        res.status(201).json({ message: 'Colaborador añadido' });
    } catch (error) {
        res.status(500).json({ message: 'Error al añadir colaborador' });
    }
});

app.put('/api/collaborators/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, image, link } = req.body;
    try {
        await pool.query('UPDATE collaborators SET name=$1, image=$2, link=$3 WHERE id=$4',
            [name, image, link, req.params.id]);
        res.json({ message: 'Colaborador actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar colaborador' });
    }
});

app.delete('/api/collaborators/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM collaborators WHERE id=$1', [req.params.id]);
        res.json({ message: 'Colaborador eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar colaborador' });
    }
});

// --- AUTH ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        res.json({ message: 'Inicio de sesión exitoso', token, user: { username: user.username, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, name, role FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener datos' });
    }
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('[Critical Error]', err);
    res.status(err.status || 500).json({ message: 'Error de servidor: ' + (err.message || 'Desconocido') });
});

// Inicializar DB y arrancar servidor
setupDatabase()
    .then(database => {
        pool = database;

        // Servir frontend compilado (producción)
        const DIST_DIR = path.resolve(__dirname, '../dist');
        if (fs.existsSync(DIST_DIR)) {
            app.use(express.static(DIST_DIR));
            app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
        }

        app.listen(PORT, () => {
            console.log('------------------------------------------------');
            console.log(`🚀 SERVIDOR CORRIENDO: http://localhost:${PORT}`);
            console.log('🐘 CONECTADO A NEON POSTGRESQL');
            console.log('------------------------------------------------');
        });
    })
    .catch(err => {
        console.error('❌ ERROR CRÍTICO AL INICIAR LA BASE DE DATOS:');
        console.error(err);
        process.exit(1);
    });
