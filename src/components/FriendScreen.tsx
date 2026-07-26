import React, { useState, useRef, useEffect } from 'react';
import { ActiveMatchConfig, UserProfile } from '../types';

interface FriendScreenProps {
  user?: UserProfile;
  onStartMatch: (config: ActiveMatchConfig) => void;
  onBack: () => void;
}

export const FriendScreen: React.FC<FriendScreenProps> = ({ user, onStartMatch, onBack }) => {
  const [viewMode, setViewMode] = useState<'initial' | 'host_lobby' | 'guest_lobby'>('initial');
  const [roomCodeChars, setRoomCodeChars] = useState<string[]>(['', '', '', '', '', '']);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [timeControl, setTimeControl] = useState<'5m' | '10m' | '3m'>('5m');
  const [isRated, setIsRated] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Lobby state
  const [guestJoined, setGuestJoined] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>(user?.username || 'Grandmaster Host');
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'ready' | 'started'>('waiting');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pollTimerRef = useRef<any>(null);

  // Check URL query parameters for ?room=CODE or ?code=CODE
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('code');
      if (roomParam) {
        const cleanCode = roomParam.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        setJoinCodeInput(cleanCode);
        const chars = cleanCode.split('');
        const newChars = ['', '', '', '', '', ''];
        for (let i = 0; i < chars.length; i++) newChars[i] = chars[i];
        setRoomCodeChars(newChars);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleCharInput = (index: number, val: string) => {
    // Check if multi-character paste or fast typing occurred
    if (val.length > 1) {
      const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const chars = clean.slice(0, 6).split('');
      const newChars = ['', '', '', '', '', ''];
      for (let i = 0; i < chars.length; i++) newChars[i] = chars[i];
      setRoomCodeChars(newChars);
      setJoinCodeInput(clean.slice(0, 6));
      const focusIndex = Math.min(chars.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const uppercase = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newChars = [...roomCodeChars];
    newChars[index] = uppercase;
    setRoomCodeChars(newChars);
    setJoinCodeInput(newChars.join(''));

    if (uppercase && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted) {
      const clean = pasted.slice(0, 6);
      const chars = clean.split('');
      const newChars = ['', '', '', '', '', ''];
      for (let i = 0; i < chars.length; i++) newChars[i] = chars[i];
      setRoomCodeChars(newChars);
      setJoinCodeInput(clean);
      const focusIndex = Math.min(chars.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSingleInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setJoinCodeInput(clean);
    const chars = clean.split('');
    const newChars = ['', '', '', '', '', ''];
    for (let i = 0; i < chars.length; i++) newChars[i] = chars[i];
    setRoomCodeChars(newChars);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !roomCodeChars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Poll room status when in lobby
  useEffect(() => {
    if ((viewMode === 'host_lobby' || viewMode === 'guest_lobby') && activeCode) {
      const checkRoomStatus = async () => {
        try {
          const res = await fetch(`/api/rooms/${activeCode}`);
          const data = await res.json();
          if (data.success && data.room) {
            setGuestJoined(data.room.guestJoined);
            if (data.room.guestName) setGuestName(data.room.guestName);
            if (data.room.hostName) setHostName(data.room.hostName);
            setRoomStatus(data.room.status);

            // If guest lobby detects host started the match
            if (viewMode === 'guest_lobby' && data.room.status === 'started') {
              clearInterval(pollTimerRef.current);
              showToast('Host started the game! Entering match...');
              setTimeout(() => {
                onStartMatch({
                  mode: 'friend',
                  playerColor: 'b',
                  timeControlMinutes: data.room.timeControl.includes('10m') ? 10 : data.room.timeControl.includes('3m') ? 3 : 5,
                  incrementSeconds: 0,
                  roomCode: activeCode,
                  opponentName: data.room.hostName || 'Room Host',
                  opponentElo: 2200,
                  rated: data.room.rated,
                });
              }, 600);
            }
          }
        } catch {
          // Ignore network glitch
        }
      };

      checkRoomStatus();
      pollTimerRef.current = setInterval(checkRoomStatus, 1200);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [viewMode, activeCode, onStartMatch]);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeControl: `${timeControl === '5m' ? 'Blitz (5m)' : timeControl === '10m' ? 'Rapid (10m)' : 'Bullet (3m)'}`,
          rated: isRated,
          boardTheme: 'Walnut Board',
          hostName: user?.username || 'Grandmaster Host',
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setActiveCode(data.room.code);
        setHostName(data.room.hostName || user?.username || 'Grandmaster Host');
        setViewMode('host_lobby');
        showToast(`Sanctum Created! Share Code: ${data.room.code}`);
      }
    } catch {
      // Fallback
      const code = 'SANCT' + Math.floor(Math.random() * 9 + 1);
      setActiveCode(code);
      setViewMode('host_lobby');
      showToast(`Sanctum Created! Code: ${code}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    // Extract code from joinCodeInput or roomCodeChars
    const codeFromBoxes = roomCodeChars.join('').trim().toUpperCase();
    const codeFromInput = joinCodeInput.trim().toUpperCase();
    const targetCode = codeFromInput || codeFromBoxes;

    if (!targetCode || targetCode.length < 3) {
      showToast('Please enter a valid room code (e.g. SANCT8).');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
          guestName: user?.username || 'Challenger Rival',
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setActiveCode(data.room.code);
        setHostName(data.room.hostName || 'Room Host');
        setGuestName(user?.username || 'Challenger Rival');
        setGuestJoined(true);
        setViewMode('guest_lobby');
        showToast(`Joined Lobby ${data.room.code}! Waiting for host to start...`);
      } else {
        showToast(data.error || 'Room not found. Please verify code.');
      }
    } catch {
      // Fallback simulated join
      setActiveCode(targetCode);
      setGuestJoined(true);
      setViewMode('guest_lobby');
      showToast(`Joined Lobby ${targetCode}!`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSimulateGuestJoin = () => {
    setGuestJoined(true);
    setGuestName('Rival Challenger (Simulated)');
    setRoomStatus('ready');
    showToast('Rival joined the sanctum!');
  };

  const handleHostStartMatch = async () => {
    if (!activeCode) return;
    try {
      await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeCode }),
      });
    } catch {
      // Proceed even if server request fails
    }

    showToast('Match Starting!');
    setTimeout(() => {
      onStartMatch({
        mode: 'friend',
        playerColor: 'w',
        timeControlMinutes: timeControl === '5m' ? 5 : timeControl === '10m' ? 10 : 3,
        incrementSeconds: 0,
        roomCode: activeCode,
        opponentName: guestName || 'Rival Challenger',
        opponentElo: 2150,
        rated: isRated,
      });
    }, 500);
  };

  const handleCopyCode = () => {
    if (!activeCode) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeCode);
      showToast(`Code ${activeCode} copied!`);
    } else {
      showToast(`Join Code: ${activeCode}`);
    }
  };

  const handleShareInvite = () => {
    const code = activeCode || roomCodeChars.join('').toUpperCase() || 'SANCT8';
    const link = `${window.location.origin}/?room=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      showToast('Invite link copied to clipboard!');
    } else {
      showToast(`Invite code: ${code}`);
    }
  };

  return (
    <div className="pt-20 pb-28 px-6 max-w-2xl mx-auto text-[#e3e3de] chess-pattern min-h-screen relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#121411] px-6 py-3 rounded-xl font-body text-xs font-bold shadow-2xl transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => {
            if (viewMode !== 'initial') {
              setViewMode('initial');
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-xs font-body text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>{viewMode === 'initial' ? 'Back to Home' : 'Back to Room Setup'}</span>
        </button>
      </div>

      {/* 1. INITIAL CREATION / JOIN SCREEN */}
      {viewMode === 'initial' && (
        <>
          <section className="text-center space-y-2 mb-8">
            <h2 className="font-headline text-2xl md:text-3xl text-[#FAF9F6] font-bold">
              Play with Friend
            </h2>
            <p className="font-body text-sm text-[#c4c7c7]/80 max-w-md mx-auto leading-relaxed">
              Create a private room to receive a Join Code, or enter an opponent's code to join their room.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6">
            {/* Create Private Room Card */}
            <div className="glass-panel p-6 md:p-8 rounded-xl relative overflow-hidden group shadow-lg border border-white/10">
              <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <span
                  className="material-symbols-outlined text-[160px] text-[#FAF9F6]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  castle
                </span>
              </div>

              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-[#D4AF37]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    add_moderator
                  </span>
                  <h3 className="font-headline text-xl font-bold text-[#FAF9F6]">
                    Create Private Room
                  </h3>
                </div>

                <p className="font-body text-xs md:text-sm text-[#c4c7c7]">
                  Configure your match settings and generate a unique join code for your opponent.
                </p>

                {/* Config chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setTimeControl('5m')}
                    className={`px-4 py-2 rounded-lg font-body text-xs font-bold border transition-all cursor-pointer ${
                      timeControl === '5m'
                        ? 'bg-[#D4AF37] text-[#121411] border-[#D4AF37]'
                        : 'bg-[#333532] text-[#e3e3de] border-white/5 hover:border-white/20'
                    }`}
                  >
                    Blitz (5m)
                  </button>
                  <button
                    onClick={() => setTimeControl('10m')}
                    className={`px-4 py-2 rounded-lg font-body text-xs font-bold border transition-all cursor-pointer ${
                      timeControl === '10m'
                        ? 'bg-[#D4AF37] text-[#121411] border-[#D4AF37]'
                        : 'bg-[#333532] text-[#e3e3de] border-white/5 hover:border-white/20'
                    }`}
                  >
                    Rapid (10m)
                  </button>
                  <button
                    onClick={() => setIsRated(!isRated)}
                    className={`px-4 py-2 rounded-lg font-body text-xs font-bold border transition-all cursor-pointer ${
                      isRated
                        ? 'bg-[#FAF9F6] text-[#121411] border-[#FAF9F6]'
                        : 'bg-[#333532] text-[#c4c7c7] border-white/5'
                    }`}
                  >
                    {isRated ? 'Rated Match' : 'Casual'}
                  </button>
                  <span className="bg-[#333532] px-4 py-2 rounded-lg font-body text-xs text-[#c4c7c7] border border-white/5">
                    Walnut Board
                  </span>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full bg-[#FAF9F6] text-[#121411] py-4 rounded-lg font-body text-xs font-bold tracking-widest uppercase hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-70"
                >
                  <span>{isCreating ? 'CREATING ROOM...' : 'CREATE ROOM & GET CODE'}</span>
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </button>
              </div>
            </div>

            {/* Join with Code Card */}
            <div className="glass-panel p-6 md:p-8 rounded-xl border border-[#D4AF37]/20 shadow-lg">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#D4AF37]">key</span>
                  <h3 className="font-headline text-xl font-bold text-[#FAF9F6]">Join Room with Code</h3>
                </div>

                <p className="font-body text-xs md:text-sm text-[#c4c7c7]">
                  Enter or paste the room code provided by the host (e.g. <span className="text-[#D4AF37] font-mono font-bold">SANCT8</span>) to join their match.
                </p>

                {/* Direct text input field */}
                <div>
                  <input
                    type="text"
                    maxLength={10}
                    value={joinCodeInput}
                    onChange={(e) => handleSingleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoinRoom();
                    }}
                    placeholder="ENTER CODE (e.g. SANCT8)"
                    className="w-full bg-[#121411]/80 border border-[#D4AF37]/40 rounded-xl px-4 py-3 font-headline text-lg font-bold text-center text-[#FAF9F6] tracking-widest uppercase focus:outline-none focus:border-[#D4AF37] placeholder:text-[#c4c7c7]/30 shadow-inner"
                  />
                </div>

                {/* Individual digit character boxes for optical feedback */}
                <div className="flex justify-between gap-2 py-1" onPaste={handlePaste}>
                  {roomCodeChars.map((char, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-12 md:w-12 md:h-14 border-b-2 border-[#D4AF37]/40 flex items-center justify-center focus-within:border-[#D4AF37] transition-colors"
                    >
                      <input
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        maxLength={6}
                        value={char}
                        onChange={(e) => handleCharInput(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        placeholder="-"
                        className="bg-transparent border-none text-center font-headline text-xl md:text-2xl font-bold text-[#FAF9F6] focus:ring-0 focus:outline-none w-full uppercase"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="w-full border border-[#D4AF37] text-[#D4AF37] py-4 rounded-lg font-body text-xs font-bold tracking-widest uppercase hover:bg-[#D4AF37]/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isJoining ? 'JOINING LOBBY...' : 'ENTER ROOM & JOIN'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. HOST WAITING LOBBY */}
      {viewMode === 'host_lobby' && (
        <div className="space-y-6">
          <section className="text-center space-y-2">
            <span className="inline-block px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full text-xs font-bold tracking-widest uppercase mb-1">
              HOST LOBBY
            </span>
            <h2 className="font-headline text-2xl md:text-3xl text-[#FAF9F6] font-bold">
              Room Created & Ready
            </h2>
            <p className="font-body text-xs md:text-sm text-[#c4c7c7]/80 max-w-md mx-auto">
              Share this code with your friend. Once they enter the code on their device, you can click <strong className="text-[#FAF9F6]">START MATCH</strong>!
            </p>
          </section>

          {/* Prominent Join Code Display */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl text-center space-y-4 border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden">
            <div className="text-xs uppercase font-body font-bold text-[#c4c7c7] tracking-widest">
              ROOM JOIN CODE
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className="font-headline text-4xl md:text-5xl font-black text-[#D4AF37] tracking-widest bg-[#121411] px-6 py-3 rounded-xl border border-[#D4AF37]/30 shadow-inner">
                {activeCode}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopyCode}
                className="px-5 py-2.5 bg-[#FAF9F6]/10 hover:bg-[#FAF9F6]/20 text-[#FAF9F6] border border-white/20 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>Copy Code</span>
              </button>
              <button
                onClick={handleShareInvite}
                className="px-5 py-2.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                <span>Share Link</span>
              </button>
            </div>
          </div>

          {/* Players Roster Status */}
          <div className="glass-panel p-6 rounded-xl space-y-4 border border-white/10">
            <h4 className="font-headline text-sm font-bold text-[#FAF9F6] uppercase tracking-wider border-b border-white/10 pb-3">
              Room Players
            </h4>

            <div className="space-y-3">
              {/* Host */}
              <div className="flex items-center justify-between p-3 bg-[#121411]/60 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F6] text-[#121411] font-bold flex items-center justify-center text-xs">
                    ♔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FAF9F6]">{hostName} (You)</div>
                    <div className="text-[10px] text-[#c4c7c7]">White Pieces • Host</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Ready</span>
                </span>
              </div>

              {/* Guest Opponent */}
              <div className="flex items-center justify-between p-3 bg-[#121411]/60 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#333532] text-[#c4c7c7] font-bold flex items-center justify-center text-xs">
                    ♚
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FAF9F6]">
                      {guestJoined ? guestName || 'Rival Challenger' : 'Waiting for Opponent...'}
                    </div>
                    <div className="text-[10px] text-[#c4c7c7]">
                      {guestJoined ? 'Black Pieces • Connected' : `Enter code ${activeCode} to join`}
                    </div>
                  </div>
                </div>

                {guestJoined ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Joined</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#D4AF37] font-bold flex items-center gap-1 animate-pulse">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    <span>Waiting...</span>
                  </span>
                )}
              </div>
            </div>

            {!guestJoined && (
              <div className="pt-2 text-center">
                <button
                  onClick={handleSimulateGuestJoin}
                  className="text-[11px] text-[#c4c7c7]/70 hover:text-[#D4AF37] underline transition-colors cursor-pointer"
                >
                  (Testing locally? Click here to simulate friend joining)
                </button>
              </div>
            )}
          </div>

          {/* Start Match Action */}
          <div className="pt-2 space-y-3">
            {!guestJoined && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Please wait for the next player to join code:</span>
                  <span className="bg-[#121411] px-2 py-0.5 rounded font-mono font-black text-[#FAF9F6]">{activeCode}</span>
                </p>
                <p className="text-[11px] text-[#c4c7c7]">
                  The host can start the game as soon as player 2 enters this code.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                if (!guestJoined) {
                  showToast(`Please wait for the next player to enter code ${activeCode} to join!`);
                  return;
                }
                handleHostStartMatch();
              }}
              disabled={!guestJoined}
              className={`w-full py-5 rounded-xl font-body text-xs font-black tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${
                guestJoined
                  ? 'bg-[#D4AF37] text-[#121411] hover:bg-[#e0be47] animate-pulse ring-4 ring-[#D4AF37]/30 scale-[1.01] cursor-pointer'
                  : 'bg-[#333532] text-[#c4c7c7] border border-white/10 opacity-60 cursor-not-allowed'
              }`}
            >
              {guestJoined ? (
                <>
                  <span className="text-sm font-bold">START MATCH NOW</span>
                  <span className="material-symbols-outlined">play_arrow</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold">PLEASE WAIT FOR NEXT PLAYER TO JOIN</span>
                  <span className="material-symbols-outlined text-sm">lock</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. GUEST WAITING LOBBY */}
      {viewMode === 'guest_lobby' && (
        <div className="space-y-6">
          <section className="text-center space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold tracking-widest uppercase mb-1">
              JOINED LOBBY
            </span>
            <h2 className="font-headline text-2xl md:text-3xl text-[#FAF9F6] font-bold">
              Connected to Room
            </h2>
            <p className="font-body text-xs md:text-sm text-[#c4c7c7]/80 max-w-md mx-auto">
              You are in room <strong className="text-[#D4AF37] font-bold">{activeCode}</strong>. Please wait for the host to click <strong className="text-[#FAF9F6]">START MATCH</strong>.
            </p>
          </section>

          {/* Connected Room Card */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl text-center space-y-5 border border-emerald-500/30 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-3xl animate-pulse">hourglass_top</span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-headline font-bold text-[#FAF9F6]">
                Waiting for Host to Start...
              </div>
              <div className="text-xs text-[#c4c7c7]">
                The match will automatically launch as soon as the host starts.
              </div>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#121411]/80 rounded-lg border border-white/10 text-xs font-bold text-[#D4AF37]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Status: Connected & Ready</span>
              </div>
            </div>
          </div>

          {/* Roster Card */}
          <div className="glass-panel p-6 rounded-xl space-y-4 border border-white/10">
            <h4 className="font-headline text-sm font-bold text-[#FAF9F6] uppercase tracking-wider border-b border-white/10 pb-3">
              Lobby Participants
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#121411]/60 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F6] text-[#121411] font-bold flex items-center justify-center text-xs">
                    ♔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FAF9F6]">{hostName}</div>
                    <div className="text-[10px] text-[#c4c7c7]">White Pieces • Host</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Host Ready</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#121411]/60 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#121411] font-bold flex items-center justify-center text-xs">
                    ♚
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FAF9F6]">You</div>
                    <div className="text-[10px] text-[#c4c7c7]">Black Pieces • Guest</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Joined</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
