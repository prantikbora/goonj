import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health-check route
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'success', 
      message: 'Goonj API is running on strict TypeScript' 
    });
  } catch (err) {
    console.error("Database Ping Failed:", err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 2. Fetch Songs API (with optional filtering)
app.get('/api/songs', async (req: Request, res: Response) => {
  try {
    const { language, genre, era } = req.query;
    
    // Construct the Prisma query filter dynamically
    const filter: any = {};
    if (language) filter.language = String(language);
    if (genre) filter.genre = String(genre);
    if (era) filter.era = String(era);

    const songs = await prisma.song.findMany({
      where: filter,
      orderBy: { created_at: 'desc' } // Newest songs first
    });

    res.status(200).json({ 
      status: 'success', 
      results: songs.length,
      data: songs 
    });
  } catch (err) {
    console.error("Error fetching songs:", err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch songs' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});