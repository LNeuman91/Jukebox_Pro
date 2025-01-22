import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tracks = await prisma.track.createMany({
    data: [
      { title: "Song 1", artist: "Artist 1" },
      { title: "Song 2", artist: "Artist 2" },
      { title: "Song 3", artist: "Artist 3" },
      { title: "Song 4", artist: "Artist 4" },
      { title: "Song 5", artist: "Artist 5" },
      { title: "Song 6", artist: "Artist 6" },
      { title: "Song 7", artist: "Artist 7" },
      { title: "Song 8", artist: "Artist 8" },
      { title: "Song 9", artist: "Artist 9" },
      { title: "Song 10", artist: "Artist 10" },
      { title: "Song 11", artist: "Artist 11" },
      { title: "Song 12", artist: "Artist 12" },
      { title: "Song 13", artist: "Artist 13" },
      { title: "Song 14", artist: "Artist 14" },
      { title: "Song 15", artist: "Artist 15" },
      { title: "Song 16", artist: "Artist 16" },
      { title: "Song 17", artist: "Artist 17" },
      { title: "Song 18", artist: "Artist 18" },
      { title: "Song 19", artist: "Artist 19" },
      { title: "Song 20", artist: "Artist 20" },
    ],
  });

  console.log('Database seeded!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
