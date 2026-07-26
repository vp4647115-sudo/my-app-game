import express from 'express';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory rooms cache
  interface MoveItem {
    from: string;
    to: string;
    promotion?: string;
    san?: string;
  }

  interface RoomState {
    code: string;
    createdAt: number;
    timeControl: string;
    rated: boolean;
    boardTheme: string;
    hostName: string;
    guestJoined: boolean;
    guestName: string | null;
    status: 'waiting' | 'ready' | 'started';
    fen: string;
    moves: MoveItem[];
    lastMove: { from: string; to: string } | null;
    currentTurn: 'w' | 'b';
  }

  const activeRooms: Record<string, RoomState> = {
    'SANCT8': {
      code: 'SANCT8',
      createdAt: Date.now(),
      timeControl: 'Blitz (5m)',
      rated: true,
      boardTheme: 'Walnut Board',
      hostName: 'Grandmaster_V',
      guestJoined: false,
      guestName: null,
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      lastMove: null,
      currentTurn: 'w',
    },
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.get('/api/auth/status', (req, res) => {
    res.json({
      activeSession: true,
      googleAuthVerified: true,
      user: {
        username: 'Grandmaster_V',
        elo: 2842,
        title: 'GM',
      },
    });
  });

  app.post('/api/rooms/create', (req, res) => {
    const { timeControl = 'Blitz (5m)', rated = true, boardTheme = 'Walnut Board', hostName = 'Room Host' } = req.body || {};
    // Generate 6-char random alphanumeric room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const room: RoomState = {
      code,
      createdAt: Date.now(),
      timeControl,
      rated,
      boardTheme,
      hostName,
      guestJoined: false,
      guestName: null,
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      lastMove: null,
      currentTurn: 'w',
    };
    activeRooms[code] = room;

    res.json({ success: true, room });
  });

  app.post('/api/rooms/join', (req, res) => {
    const { code, guestName = 'Rival Challenger' } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: 'Room code required' });
    }
    const cleanCode = code.toUpperCase();
    const room = activeRooms[cleanCode];
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room code not found or expired.' });
    }

    room.guestJoined = true;
    room.guestName = guestName;
    room.status = 'ready';

    res.json({ success: true, room });
  });

  app.post('/api/rooms/start', (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: 'Room code required' });
    }
    const cleanCode = code.toUpperCase();
    const room = activeRooms[cleanCode];
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    room.status = 'started';
    res.json({ success: true, room });
  });

  app.post('/api/rooms/move', (req, res) => {
    const { code, from, to, promotion = 'q', fen, san } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: 'Room code required' });
    }
    const cleanCode = code.toUpperCase();
    const room = activeRooms[cleanCode];
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (fen) room.fen = fen;
    if (from && to) room.lastMove = { from, to };
    if (from && to) room.moves.push({ from, to, promotion, san });
    room.currentTurn = room.currentTurn === 'w' ? 'b' : 'w';

    res.json({ success: true, room });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = activeRooms[code];
    if (room) {
      res.json({ success: true, room });
    } else {
      res.status(404).json({ success: false, error: 'Room not found or expired' });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VPN Chess Master Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
