import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Health-check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'success', message: 'Goonj API is online' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

// 2. Fetch Songs (GET)
app.get('/api/songs', async (req: Request, res: Response) => {
  try {
    const { language, genre } = req.query;
    const filter: any = {};
    if (language) filter.language = String(language);
    if (genre) filter.genre = String(genre);

    const songs = await prisma.song.findMany({
      where: filter,
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: songs });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch songs' });
  }
});

// 3. Add Song (POST)
app.post('/api/songs', async (req: Request, res: Response) => {
  try {
    // FIX: Extracted lyrics from req.body
    const { title, artist, language, audio_url, cover_image_url, lyrics } = req.body;
    
    if (!title || !artist || !audio_url) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSong = await prisma.song.create({
      data: {
        title,
        artist,
        language: language || 'Unknown',
        audio_url,
        cover_image_url: cover_image_url || 'https://via.placeholder.com/500',
        genre: 'Pop', 
        era: '2020s', 
        duration_seconds: 0,
        lyrics: lyrics || null // FIX: Passed lyrics to Prisma
      }
    });
    res.status(201).json({ status: 'success', data: newSong });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
});

// 4. Delete Song (DELETE)
app.delete('/api/songs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.song.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});