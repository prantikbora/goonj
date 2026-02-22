import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/auth.js'; // MUST IMPORT THE MIDDLEWARE

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// ==========================================
// 1. PUBLIC ROUTES (No Token Required)
// ==========================================

// Health-check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'success', message: 'Goonj API is online' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

// Fetch Songs
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

// Add Song 
app.post('/api/songs', async (req: Request, res: Response) => {
  try {
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
        lyrics: lyrics || null
      }
    });
    res.status(201).json({ status: 'success', data: newSong });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
});

// Delete Song
app.delete('/api/songs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.song.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
});

// ==========================================
// 2. AUTHENTICATION ROUTES (Login / Register)
// ==========================================

// Register User
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { username, email, password_hash }
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      status: 'success', 
      token, 
      user: { id: newUser.id, username: newUser.username, email: newUser.email } 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login User
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ 
      status: 'success', 
      token, 
      user: { id: user.id, username: user.username, email: user.email } 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ==========================================
// 3. SECURE ROUTES (Requires Token)
// ==========================================

// Create a new playlist
app.post('/api/playlists', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, is_public } = req.body;
    const userId = (req as any).user.userId;

    if (!title) return res.status(400).json({ message: "Playlist title is required" });

    const newPlaylist = await prisma.playlist.create({
      data: {
        title,
        is_public: is_public || false,
        user_id: userId
      }
    });

    res.status(201).json({ status: 'success', data: newPlaylist });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create playlist' });
  }
});

// Get user's playlists
app.get('/api/playlists', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const playlists = await prisma.playlist.findMany({
      where: { user_id: userId },
      include: {
        songs: { include: { song: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', data: playlists });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch playlists' });
  }
});


// Add a song to a playlist (SECURED)
app.post('/api/playlists/add-song', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.body;
    const userId = (req as any).user.userId;

    if (!playlistId || !songId) {
      return res.status(400).json({ message: "Playlist ID and Song ID are required." });
    }

    // Security Check: Ensure the playlist actually belongs to the user making the request
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, user_id: userId }
    });

    if (!playlist) {
      return res.status(403).json({ message: "Unauthorized or Playlist not found." });
    }

    // Check for duplicates (prevents adding the same song twice)
    const existingEntry = await prisma.playlistSong.findFirst({
      where: { playlist_id: playlistId, song_id: songId }
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Song is already in this playlist." });
    }

    // Add the song to the playlist
    const addedSong = await prisma.playlistSong.create({
      data: {
        playlist_id: playlistId,
        song_id: songId
      }
    });

    res.status(201).json({ status: 'success', message: 'Song added to playlist', data: addedSong });
  } catch (err) {
    console.error("Add to Playlist Error:", err);
    res.status(500).json({ message: 'Failed to add song to playlist' });
  }
});
// ==========================================
// 4. START SERVER (Always at the bottom)
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});