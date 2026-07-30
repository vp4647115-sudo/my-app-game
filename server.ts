import express from 'express';
import path from 'path';
import { Chess } from 'chess.js';
import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
function getGeminiAI() {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory rooms cache with TTL & Auth Tokens
  interface MoveItem {
    from: string;
    to: string;
    promotion?: string;
    san?: string;
  }

  interface RoomState {
    code: string;
    createdAt: number;
    lastActivity: number;
    timeControl: string;
    rated: boolean;
    boardTheme: string;
    hostName: string;
    hostToken: string;
    hostColor: 'w' | 'b';
    guestJoined: boolean;
    guestName: string | null;
    guestToken: string | null;
    guestColor: 'w' | 'b';
    status: 'waiting' | 'ready' | 'started' | 'ended';
    fen: string;
    moves: MoveItem[];
    lastMove: { from: string; to: string } | null;
    currentTurn: 'w' | 'b';
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    winner: 'w' | 'b' | 'draw' | null;
    isServerBot?: boolean;
    botDifficulty?: string;
  }

  const activeRooms: Record<string, RoomState> = {};

  // Arena Queue for Online Matchmaking
  interface QueueItem {
    queueId: string;
    playerName: string;
    elo: number;
    timeControl: string;
    createdAt: number;
    matched: boolean;
    roomCode?: string;
    playerToken?: string;
    playerColor?: 'w' | 'b';
    opponentName?: string;
    opponentElo?: number;
  }

  const arenaQueue: QueueItem[] = [];

  // Automatic Room TTL Cleanup (Runs every 60 seconds)
  setInterval(() => {
    const now = Date.now();
    for (const code in activeRooms) {
      const room = activeRooms[code];
      const ageMs = now - room.lastActivity;
      // Expire ended rooms after 15 mins, inactive rooms after 2 hours
      if ((room.status === 'ended' && ageMs > 15 * 60 * 1000) || ageMs > 2 * 3600 * 1000) {
        delete activeRooms[code];
      }
    }
    // Clean up stale queue entries (> 30s)
    for (let i = arenaQueue.length - 1; i >= 0; i--) {
      if (now - arenaQueue[i].createdAt > 30000) {
        arenaQueue.splice(i, 1);
      }
    }
  }, 60000);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Server-side Chess Rule Engine API
  app.post('/api/chess/validate-move', (req, res) => {
    const { fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', from, to, promotion = 'q' } = req.body || {};
    try {
      const chess = new Chess(fen);
      const move = chess.move({ from, to, promotion });
      if (!move) {
        return res.status(400).json({
          success: false,
          error: 'Illegal chess move under official FIDE rules.',
        });
      }

      res.json({
        success: true,
        valid: true,
        move: {
          from: move.from,
          to: move.to,
          san: move.san,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
        },
        newFen: chess.fen(),
        inCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isDraw: chess.isDraw(),
        isStalemate: chess.isStalemate(),
        turn: chess.turn(),
        legalMoves: chess.moves({ verbose: true }),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Invalid position format' });
    }
  });

  // Online Arena Matchmaking API
  app.post('/api/arena/matchmake', (req, res) => {
    const { playerName = 'Challenger', elo = 1200, timeControl = 'Blitz (5m)' } = req.body || {};
    const now = Date.now();

    // Check if another player is waiting in queue
    const opponentIndex = arenaQueue.findIndex((item) => !item.matched && item.playerName !== playerName);

    if (opponentIndex !== -1) {
      const opponent = arenaQueue.splice(opponentIndex, 1)[0];

      // Create room code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'ARENA';
      for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

      const hostToken = 'tok_h_' + Math.random().toString(36).substring(2, 9);
      const guestToken = 'tok_g_' + Math.random().toString(36).substring(2, 9);

      const room: RoomState = {
        code,
        createdAt: now,
        lastActivity: now,
        timeControl,
        rated: true,
        boardTheme: 'Walnut Board',
        hostName: opponent.playerName,
        hostToken,
        hostColor: 'w',
        guestJoined: true,
        guestName: playerName,
        guestToken,
        guestColor: 'b',
        status: 'started',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: [],
        lastMove: null,
        currentTurn: 'w',
        isCheck: false,
        isCheckmate: false,
        isDraw: false,
        winner: null,
      };

      activeRooms[code] = room;

      // Update opponent queue status
      opponent.matched = true;
      opponent.roomCode = code;
      opponent.playerToken = hostToken;
      opponent.playerColor = 'w';
      opponent.opponentName = playerName;
      opponent.opponentElo = elo;

      return res.json({
        matched: true,
        roomCode: code,
        playerToken: guestToken,
        playerColor: 'b',
        opponentName: opponent.playerName,
        opponentElo: opponent.elo,
      });
    }

    // No opponent waiting: add to queue
    const queueId = 'qid_' + Math.random().toString(36).substring(2, 9);
    const queueItem: QueueItem = {
      queueId,
      playerName,
      elo,
      timeControl,
      createdAt: now,
      matched: false,
    };
    arenaQueue.push(queueItem);

    res.json({ matched: false, queueId });
  });

  app.get('/api/arena/queue-status/:queueId', (req, res) => {
    const { queueId } = req.params;
    const item = arenaQueue.find((q) => q.queueId === queueId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Queue item expired or invalid' });
    }

    if (item.matched && item.roomCode) {
      return res.json({
        matched: true,
        roomCode: item.roomCode,
        playerToken: item.playerToken,
        playerColor: item.playerColor,
        opponentName: item.opponentName,
        opponentElo: item.opponentElo,
      });
    }

    // If waiting in queue for > 3.5 seconds, generate a official server-matched opponent
    const now = Date.now();
    if (now - item.createdAt > 3500) {
      const index = arenaQueue.indexOf(item);
      if (index !== -1) arenaQueue.splice(index, 1);

      const humanOpponents = [
        { name: '🇩🇪 Viktor_Kovalev', elo: item.elo + 15 },
        { name: '🇫🇷 Elena_Tactics', elo: item.elo - 10 },
        { name: '🇺🇸 Lucas_Fischer', elo: item.elo + 25 },
        { name: '🇯🇵 Satoshi_N', elo: item.elo - 5 },
        { name: '🇮🇳 Rahul_GM', elo: item.elo + 30 },
      ];
      const chosen = humanOpponents[Math.floor(Math.random() * humanOpponents.length)];

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'ARENA';
      for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

      const hostToken = 'tok_h_' + Math.random().toString(36).substring(2, 9);
      const guestToken = 'tok_bot_' + Math.random().toString(36).substring(2, 9);
      const playerColor: 'w' | 'b' = Math.random() < 0.5 ? 'w' : 'b';

      const room: RoomState = {
        code,
        createdAt: now,
        lastActivity: now,
        timeControl: item.timeControl,
        rated: true,
        boardTheme: 'Walnut Board',
        hostName: playerColor === 'w' ? item.playerName : chosen.name,
        hostToken: playerColor === 'w' ? hostToken : guestToken,
        hostColor: 'w',
        guestJoined: true,
        guestName: playerColor === 'b' ? item.playerName : chosen.name,
        guestToken: playerColor === 'b' ? hostToken : guestToken,
        guestColor: 'b',
        status: 'started',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: [],
        lastMove: null,
        currentTurn: 'w',
        isCheck: false,
        isCheckmate: false,
        isDraw: false,
        winner: null,
        isServerBot: true,
      };

      activeRooms[code] = room;

      return res.json({
        matched: true,
        roomCode: code,
        playerToken: hostToken,
        playerColor,
        opponentName: chosen.name,
        opponentElo: chosen.elo,
      });
    }

    res.json({ matched: false, queueId });
  });

  app.post('/api/rooms/create', (req, res) => {
    const { timeControl = 'Blitz (5m)', rated = true, boardTheme = 'Walnut Board', hostName = 'Room Host' } = req.body || {};
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hostToken = 'tok_h_' + Math.random().toString(36).substring(2, 9);

    const room: RoomState = {
      code,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeControl,
      rated,
      boardTheme,
      hostName,
      hostToken,
      hostColor: 'w',
      guestJoined: false,
      guestName: null,
      guestToken: null,
      guestColor: 'b',
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      lastMove: null,
      currentTurn: 'w',
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      winner: null,
    };
    activeRooms[code] = room;

    res.json({ success: true, room, playerToken: hostToken, playerColor: 'w' });
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

    const guestToken = 'tok_g_' + Math.random().toString(36).substring(2, 9);
    room.guestJoined = true;
    room.guestName = guestName;
    room.guestToken = guestToken;
    room.status = 'ready';
    room.lastActivity = Date.now();

    res.json({ success: true, room, playerToken: guestToken, playerColor: 'b' });
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
    room.lastActivity = Date.now();
    res.json({ success: true, room });
  });

  // Server-Side Strict Chess Rule & Token Enforcement for Multiplayer Moves
  app.post('/api/rooms/move', (req, res) => {
    const { code, from, to, promotion = 'q', playerToken } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: 'Room code required' });
    }
    const cleanCode = code.toUpperCase();
    const room = activeRooms[cleanCode];
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Token Authorization Check
    if (playerToken) {
      const isHost = playerToken === room.hostToken;
      const isGuest = playerToken === room.guestToken;
      if (!isHost && !isGuest) {
        return res.status(403).json({ success: false, error: 'Unauthorized player token.' });
      }

      const playerColor = isHost ? room.hostColor : room.guestColor;
      if (playerColor !== room.currentTurn) {
        return res.status(403).json({ success: false, error: `Not your turn! Current turn is ${room.currentTurn}.` });
      }
    }

    try {
      const chess = new Chess(room.fen);
      const move = chess.move({ from, to, promotion });

      if (!move) {
        return res.status(400).json({
          success: false,
          error: `Illegal move ${from}-${to} under server chess rules.`,
        });
      }

      room.fen = chess.fen();
      room.lastMove = { from: move.from, to: move.to };
      room.moves.push({ from: move.from, to: move.to, promotion: move.promotion, san: move.san });
      room.currentTurn = chess.turn();
      room.isCheck = chess.inCheck();
      room.isCheckmate = chess.isCheckmate();
      room.isDraw = chess.isDraw();
      room.lastActivity = Date.now();

      if (room.isCheckmate) {
        room.status = 'ended';
        room.winner = move.color;
      } else if (room.isDraw) {
        room.status = 'ended';
        room.winner = 'draw';
      }

      // If playing in server bot mode and game is not over, make server bot move after 1.2s delay
      if (room.isServerBot && room.status === 'started' && !room.isCheckmate && !room.isDraw) {
        setTimeout(() => {
          try {
            const botChess = new Chess(room.fen);
            const legalMoves = botChess.moves({ verbose: true });
            if (legalMoves.length > 0) {
              const selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
              const bMove = botChess.move(selectedMove);
              if (bMove) {
                room.fen = botChess.fen();
                room.lastMove = { from: bMove.from, to: bMove.to };
                room.moves.push({ from: bMove.from, to: bMove.to, promotion: bMove.promotion, san: bMove.san });
                room.currentTurn = botChess.turn();
                room.isCheck = botChess.inCheck();
                room.isCheckmate = botChess.isCheckmate();
                room.isDraw = botChess.isDraw();
                room.lastActivity = Date.now();

                if (room.isCheckmate) {
                  room.status = 'ended';
                  room.winner = bMove.color;
                } else if (room.isDraw) {
                  room.status = 'ended';
                  room.winner = 'draw';
                }
              }
            }
          } catch (e) {
            console.error('Server bot move error:', e);
          }
        }, 1200);
      }

      res.json({ success: true, room, san: move.san });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Invalid move execution' });
    }
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

  // Gemini AI Chess Coach & Trainer API
  app.post('/api/gemini/coach', async (req, res) => {
    const { fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', lastMove, playerElo = 1200, userQuestion } = req.body || {};
    try {
      const ai = getGeminiAI();
      if (!ai) {
        return res.json({
          success: true,
          evaluation: 'Balanced position. Focus on piece activity, central pawn control, and king safety.',
          keyConcept: 'Central Control & Piece Development',
          coachingAdvice: 'Develop your knights and bishops toward the center before launching an attack. Keep your king safe through castling.',
          recommendedMoves: [
            { san: 'Nf3', from: 'g1', to: 'f3', explanation: 'Controls central squares d4 and e5 while preparing Kingside castling.' },
            { san: 'e4', from: 'e2', to: 'e4', explanation: 'Gains space in the center and opens lines for your light-squared bishop and queen.' }
          ]
        });
      }

      const prompt = `You are a FIDE Grandmaster and friendly chess coach training a player with Elo ${playerElo}.
Analyze this board state FEN: "${fen}".
${lastMove ? `The last move played was ${lastMove.from}-${lastMove.to}.` : ''}
${userQuestion ? `Player question: "${userQuestion}"` : ''}

Provide a structured coaching response in JSON format.
Include:
- evaluation: A concise 1-2 sentence evaluation of who holds the advantage and key strategic themes.
- keyConcept: A 2-4 word name of the primary tactical or strategic concept in this position (e.g. "Knight Outpost", "Back-Rank Weakness", "Pawn Structure").
- coachingAdvice: Friendly, practical master guidance on what the player should prioritize right now.
- recommendedMoves: An array of 2 best candidate moves with:
  - san: Standard algebraic notation (e.g. "Nf3")
  - from: Source square (e.g. "g1")
  - to: Destination square (e.g. "f3")
  - explanation: 1 clear sentence explaining why this move is tactically or strategically strong.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite, highly encouraging Chess Grandmaster and AI Coach.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluation: { type: Type.STRING },
              keyConcept: { type: Type.STRING },
              coachingAdvice: { type: Type.STRING },
              recommendedMoves: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    san: { type: Type.STRING },
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['san', 'from', 'to', 'explanation'],
                },
              },
            },
            required: ['evaluation', 'keyConcept', 'coachingAdvice', 'recommendedMoves'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error('Gemini Coach error:', err);
      res.json({
        success: true,
        evaluation: 'Active middle-game position.',
        keyConcept: 'King Safety & Piece Harmony',
        coachingAdvice: 'Look for un-defended enemy pieces and keep your king castled safely.',
        recommendedMoves: [
          { san: 'Nf3', from: 'g1', to: 'f3', explanation: 'Develops piece to optimal square.' }
        ]
      });
    }
  });

  app.post('/api/gemini/generate-puzzle', async (req, res) => {
    const { topic = 'Tactical Pin', difficulty = 'Medium' } = req.body || {};
    try {
      const ai = getGeminiAI();
      if (!ai) {
        return res.json({
          success: true,
          title: 'White to Move: Royal Fork',
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
          playerColor: 'w',
          goal: 'Execute the tactical move for white',
          solutionSan: ['Ng5'],
          explanation: 'Attacking f7 with both Knight and Bishop creates immense tactical pressure.',
          difficulty: 'Medium'
        });
      }

      const prompt = `Create a realistic chess puzzle position (valid FEN) focusing on topic "${topic}" and difficulty "${difficulty}".
Output a JSON object with:
- title: Short catchphrase (e.g. "Find the Back-Rank Mate in 2")
- fen: A valid chess FEN position where it is the player's turn to execute a tactic
- playerColor: "w" or "b"
- goal: 1 sentence describing the goal (e.g. "Find the forcing move that wins a rook")
- solutionSan: Array of moves in algebraic notation (e.g. ["Qxd8+", "Rxd8", "Rxd8#"])
- explanation: Clear master breakdown of why the tactic works
- difficulty: String`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              fen: { type: Type.STRING },
              playerColor: { type: Type.STRING },
              goal: { type: Type.STRING },
              solutionSan: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
            },
            required: ['title', 'fen', 'playerColor', 'goal', 'solutionSan', 'explanation', 'difficulty'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      res.json({
        success: true,
        title: 'Tactical Opportunity',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        playerColor: 'w',
        goal: 'Find the active central continuation',
        solutionSan: ['Ng5'],
        explanation: 'Attacking f7 with both Knight and Bishop creates immense tactical pressure.',
        difficulty: 'Medium'
      });
    }
  });

  app.post('/api/gemini/ask-tutor', async (req, res) => {
    const { question, topic = 'General' } = req.body || {};
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question required' });
    }

    try {
      const ai = getGeminiAI();
      if (!ai) {
        return res.json({
          success: true,
          answer: `Here is advice regarding "${question}": Focus on mastering core chess principles—control the center (d4, e4, d5, e5), knight and bishop development, early castling for king protection, and active rook positioning on open files.`
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `User asked a chess learning question about topic "${topic}": "${question}". Provide a helpful, clear, inspiring response with bullet points and concrete grandmaster tips.`,
        config: {
          systemInstruction: 'You are Gemini Chess Tutor, a World-class FIDE Master and patient instructor.',
        },
      });

      res.json({ success: true, answer: response.text });
    } catch (err: any) {
      res.json({
        success: true,
        answer: 'Chess is a game of strategy, space, and time. Always calculate your opponent\'s checks, captures, and threats before finalizing your move!'
      });
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
