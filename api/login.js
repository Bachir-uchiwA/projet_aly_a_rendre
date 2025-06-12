import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { phone, country } = req.body;
  try {
    const filePath = path.join(process.cwd(), 'db.json');
    const data = await fs.readFile(filePath, 'utf8');
    const db = JSON.parse(data);
    const user = db.users.find(u => u.phone === phone && u.country === country);
    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé' });
      return;
    }
    // Génère une fausse session (pas d'écriture en prod)
    const session = {
      id: Math.random().toString(36).substr(2, 6),
      userId: user.id,
      phone,
      country,
      createdAt: new Date().toISOString()
    };
    res.status(200).json(session);
  } catch (err) {
    console.error('Erreur API /api/login:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
}
// Remplace toute référence à l'ancien render par le nouveau si tu en ajoutes ici
