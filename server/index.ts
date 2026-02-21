import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});