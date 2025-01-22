import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || 'super_secure_random_string_here';

interface AuthRequest extends Request {
    userId?: string;
}

// Middleware to verify token
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded: { id: string } | undefined) => {
        if (err || !decoded) return res.status(401).json({ message: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// **AUTH ROUTES**
app.post('/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: { username, password: hashedPassword },
        });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Username is already taken' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token });
});

// **PLAYLIST ROUTES**
app.get('/playlists', authenticate, async (req: AuthRequest, res) => {
    const playlists = await prisma.playlist.findMany({
        where: { ownerId: req.userId! },
    });
    res.json(playlists);
});

app.post('/playlists', authenticate, async (req: AuthRequest, res) => {
    const { name, description, trackIds = [] } = req.body;

    try {
        const playlist = await prisma.playlist.create({
            data: {
                name,
                description,
                ownerId: req.userId!,
                tracks: trackIds.length > 0 ? { connect: trackIds.map(id => ({ id })) } : undefined,
            },
        });
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ error: 'Error creating playlist' });
    }
});

app.get('/playlists/:id', authenticate, async (req: AuthRequest, res) => {
    const playlist = await prisma.playlist.findUnique({
        where: { id: req.params.id },
        include: { tracks: true },
    });

    if (!playlist || playlist.ownerId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(playlist);
});

// **TRACK ROUTES**
app.get('/tracks', async (req, res) => {
    const tracks = await prisma.track.findMany();
    res.json(tracks);
});

app.get('/tracks/:id', async (req: AuthRequest, res) => {
    const track = await prisma.track.findUnique({
        where: { id: req.params.id },
    });

    if (!track) return res.status(404).json({ error: 'Track not found' });

    if (req.userId) {
        const playlists = await prisma.playlist.findMany({
            where: { ownerId: req.userId, tracks: { some: { id: track.id } } },
        });
        return res.json({ ...track, playlists });
    }

    res.json(track);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
