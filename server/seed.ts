import prisma from './db.js';

async function main() {
  console.log('Clearing old data...');
  await prisma.song.deleteMany(); // Resets the table so we don't get duplicates

  console.log('Seeding Goonj database with initial tracks...');

  const songs = [
    {
      title: "Tumar Kotha",
      artist: "Zubeen Garg",
      language: "Assamese",
      genre: "Pop",
      era: "2000s",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      cover_image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
      duration_seconds: 372,
    },
    {
      title: "Tum Hi Ho",
      artist: "Arijit Singh",
      language: "Hindi",
      genre: "Bollywood",
      era: "2010s",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      cover_image_url: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f92a?w=500&q=80",
      duration_seconds: 262,
    },
    {
      title: "Shape of You",
      artist: "Ed Sheeran",
      language: "English",
      genre: "Pop",
      era: "2010s",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      cover_image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
      duration_seconds: 233,
    }
  ];

  for (const song of songs) {
    await prisma.song.create({ data: song });
    console.log(`Added: ${song.title} by ${song.artist}`);
  }

  console.log('Seeding completely finished.');
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });