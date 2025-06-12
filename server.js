import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

const API_BASE_URL = 'https://projet-json-server-5.onrender.com';
// (Remarque: ce fichier n'utilise pas explicitement l'URL, mais si tu utilises l'URL ailleurs dans ce fichier, remplace-la par la nouvelle.)

// CORS and JSON headers
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Handle preflight requests
server.options('*', (req, res) => {
    res.sendStatus(200);
});

// Parse JSON bodies
server.use(jsonServer.bodyParser);

// Désactive les routes d'écriture en production (Vercel)
function isReadOnly() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

// Custom route for sessions
server.post('/sessions', (req, res) => {
    if (isReadOnly()) {
        return res.status(403).json({ error: 'Read-only API on Vercel. No write allowed.' });
    }
    try {
        const session = {
            ...req.body,
            id: Math.random().toString(36).substr(2, 6),
            createdAt: new Date().toISOString()
        };
        
        const db = router.db; // Get the lowdb instance
        const sessions = db.get('sessions');
        
        sessions.push(session).write();
        
        res.json(session);
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: 'Error creating session' });
    }
});

// Custom route for getting a specific session
server.get('/sessions/:id', (req, res) => {
    try {
        const db = router.db;
        const session = db.get('sessions')
            .find({ id: req.params.id })
            .value();

        if (!session) {
            return res.status(404).json({ error: 'Session non trouvée' });
        }

        res.json(session);
    } catch (error) {
        console.error('Session lookup error:', error);
        res.status(500).json({ error: 'Error retrieving session' });
    }
});

server.use((req, res, next) => {
    if (isReadOnly() && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return res.status(403).json({ error: 'Read-only API on Vercel. No write allowed.' });
    }
    next();
});

server.use(middlewares);
server.use('/api', router);

// Start server if not in production
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`JSON Server is running on port ${PORT}`);
    });
}

export default server;