import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "XP2026";
const GOLD = "#C8A84B";
const GOLD2 = "#E2C060";
const GOLD_DIM = "#7A6520";

const DEFAULT_GAMES = [
  { id: "game1", home: "Argentina", away: "Argélia", homeflag: "🇦🇷", awayflag: "🇩🇿", date: "2026-06-16T15:00:00", label: "JOGO 1", prize: "Apple Watch", prizeIcon: "⌚", venue: "Estádio Azteca", active: true },
  { id: "game2", home: "Uzbequistão", away: "Colômbia", homeflag: "🇺🇿", awayflag: "🇨🇴", date: "2026-06-18T19:00:00", label: "JOGO 2", prize: "AirPods", prizeIcon: "🎧", venue: "No Estádio (ao vivo!)", active: true },
  { id: "game3", home: "Brasil", away: "Haiti", homeflag: "🇧🇷", awayflag: "🇭🇹", date: "2026-06-21T17:00:00", label: "JOGO 3", prize: "A definir", prizeIcon: "🏆", venue: "Xcaret", active: true },
];

function calcPoints(bet, result) {
  if (!result || result.homeScore === "" || result.awayScore === "" || result.homeScore === undefined) return null;
  const bH = parseInt(bet.homeScore), bA = parseInt(bet.awayScore);
  const rH = parseInt(result.homeScore), rA = parseInt(result.awayScore);
  if (isNaN(bH) || isNaN(bA)) return null;
  let pts = 0;
  const bW = bH > bA ? "h" : bH < bA ? "a" : "d";
  const rW = rH > rA ? "h" : rH < rA ? "a" : "d";
  if (bH === rH && bA === rA) pts += 3;
  else if (bW === rW) pts += 1;
  if (bH + bA === rH + rA) pts += 1;
  return pts;
}

function isGameClosed(game) { return new Date() >= new Date(game.date); }
function formatDate(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function sGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function sSet(key, val) { try { await window.storage.set(key, JSON.stringify(val), true); } catch {} }

// ===================== SVG COMPONENTS =====================
function Shield({ w = 120, h = 140, glow = false }) {
  const pts = {
    TL: [20,0], TR: [80,0], SL: [0,18], SR: [100,18],
    ML: [0,65], MR: [100,65], BOT: [50,115],
    IT: [50,0], IL: [22,38], IR: [78,38], IC: [50,38],
    IML: [18,72], IMR: [82,72], IBC: [50,80],
  };
  const lines = [
    [pts.TL,pts.IT],[pts.IT,pts.TR],[pts.TL,pts.SL],[pts.TR,pts.SR],
    [pts.TL,pts.IL],[pts.TR,pts.IR],[pts.IT,pts.IC],
    [pts.SL,pts.IL],[pts.SR,pts.IR],[pts.IL,pts.IC],[pts.IC,pts.IR],
    [pts.IL,pts.IR],[pts.SL,pts.IC],[pts.SR,pts.IC],
    [pts.IL,pts.IML],[pts.IR,pts.IMR],[pts.IC,pts.IML],[pts.IC,pts.IMR],
    [pts.ML,pts.IML],[pts.MR,pts.IMR],[pts.IML,pts.IBC],[pts.IBC,pts.IMR],
    [pts.IML,pts.IMR],[pts.IML,pts.BOT],[pts.IMR,pts.BOT],[pts.IBC,pts.BOT],
    [pts.ML,pts.BOT],[pts.MR,pts.BOT],
  ];
  const nodes = [pts.TL,pts.TR,pts.IT,pts.SL,pts.SR,pts.IL,pts.IR,pts.IC,pts.ML,pts.MR,pts.IML,pts.IMR,pts.IBC,pts.BOT];
  const scaleX = w/100, scaleY = h/115;
  const sc = ([x,y]) => [x*scaleX, y*scaleY];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{display:"block"}}>
      {glow && <defs><filter id="sglow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>}
      <path d={`M ${sc(pts.TL).join(",")} L ${sc(pts.IT).join(",")} L ${sc(pts.TR).join(",")} L ${sc(pts.SR).join(",")} L ${sc(pts.MR).join(",")} L ${sc(pts.BOT).join(",")} L ${sc(pts.ML).join(",")} L ${sc(pts.SL).join(",")} Z`}
        stroke={GOLD} strokeWidth={w>80?"1.8":"1.2"} fill="none" filter={glow?"url(#sglow)":undefined} opacity="0.95"/>
      {lines.map(([a,b],i) => { const [ax,ay]=sc(a),[bx,by]=sc(b); return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={GOLD} strokeWidth={w>80?"0.9":"0.6"} opacity="0.7"/>; })}
      {nodes.map(([x,y],i) => { const [sx,sy]=sc([x,y]); return <circle key={i} cx={sx} cy={sy} r={w>80?"2.2":"1.4"} fill={GOLD} opacity="0.9"/>; })}
    </svg>
  );
}

function XPBox({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <rect width="88" height="88" rx="16" fill="white"/>
      <text x="44" y="60" textAnchor="middle" fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="44" fontWeight="900" fill="#0d0d0d" letterSpacing="-2">XP</text>
    </svg>
  );
}

function ConstellationBg({ width=400, height=300 }) {
  const rawPts = [[0.12,0.15],[0.28,0.08],[0.45,0.22],[0.62,0.05],[0.78,0.18],[0.92,0.12],[0.08,0.42],[0.35,0.38],[0.55,0.45],[0.72,0.35],[0.88,0.48],[0.18,0.68],[0.42,0.72],[0.65,0.62],[0.85,0.75],[0.25,0.88],[0.52,0.92],[0.75,0.85]];
  const pts = rawPts.map(([x,y])=>[x*width,y*height]);
  const links = [];
  for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
    const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1],d=Math.sqrt(dx*dx+dy*dy);
    if(d<width*0.28) links.push([i,j,d]);
  }
  return (
    <svg width={width} height={height} style={{position:"absolute",inset:0,pointerEvents:"none"}} viewBox={`0 0 ${width} ${height}`}>
      {links.map(([i,j,d],k)=><line key={k} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} stroke={GOLD} strokeWidth="0.5" opacity={Math.max(0.04,0.18-d/(width*1.8))}/>)}
      {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.8" fill={GOLD} opacity="0.35"/>)}
    </svg>
  );
}

// QR Code generator (pure JS, no library needed)
function QRDisplay({ url }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!url) return;
    function tryGenerate() {
      if (!window.QRCode) return;
      const div = document.createElement("div");
      document.body.appendChild(div);
      try {
        new window.QRCode(div, {
          text: url, width: 220, height: 220,
          colorDark: "#C8A84B", colorLight: "#0d0d0d",
          correctLevel: window.QRCode.CorrectLevel.M
        });
        setTimeout(() => {
          const canvas = div.querySelector("canvas");
          if (canvas) setSrc(canvas.toDataURL());
          document.body.removeChild(div);
        }, 300);
      } catch(e) { document.body.removeChild(div); }
    }
    if (window.QRCode) { tryGenerate(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = tryGenerate;
    s.onerror = () => setSrc("fallback");
    document.head.appendChild(s);
  }, [url]);

  if (!src) return (
    <div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:11,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>
      GERANDO QR...
    </div>
  );
  if (src === "fallback") return (
    <div style={{width:220,padding:16,textAlign:"center",color:GOLD,fontSize:11,letterSpacing:1,wordBreak:"break-all",fontFamily:"'Barlow',sans-serif"}}>{url}</div>
  );
  return <img src={src} width={220} height={220} style={{display:"block",imageRendering:"pixelated"}}/>;
}

// ===================== APP =====================

function QRScreen({ appUrl }) {
  const [copied, setCopied] = useState(false);
  function copyUrl() {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="qr-page">
      <div className="qr-title">Compartilhe o <span>Bolão</span></div>
      <div className="qr-sub">Escaneie o QR Code ou copie o link</div>
      <div className="qr-box">
        <QRDisplay url={appUrl}/>
      </div>
      <div className="qr-url">{appUrl}</div>
      <button className={"qr-copy" + (copied ? " copied" : "")} onClick={copyUrl}>
        {copied ? "✓ Link copiado!" : "Copiar link"}
      </button>
      <div className="qr-hint">Compartilhe no grupo da viagem para todos apostar!</div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [bets, setBets] = useState({});
  const [allBets, setAllBets] = useState({});
  const [results, setResults] = useState({});
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedGames, setSavedGames] = useState({});
  const [activeGame, setActiveGame] = useState("game1");
  const [rankTab, setRankTab] = useState("game1");
  const [appUrl, setAppUrl] = useState("");
  const [adminTab, setAdminTab] = useState("results"); // results | prizes | games

  useEffect(() => {
    setAppUrl(window.location.href.split("?")[0]);
    (async () => {
      const ab = await sGet("bolao:allBets"); if(ab) setAllBets(ab);
      const res = await sGet("bolao:results"); if(res) setResults(res);
      const gm = await sGet("bolao:games"); if(gm) setGames(gm);
    })();
  }, []);

  useEffect(() => {
    const iv = setInterval(async () => {
      const ab = await sGet("bolao:allBets"); if(ab) setAllBets(ab);
      const res = await sGet("bolao:results"); if(res) setResults(res);
      const gm = await sGet("bolao:games"); if(gm) setGames(gm);
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const activeGames = games.filter(g => g.active);

  useEffect(() => {
    if (activeGames.length > 0 && !activeGames.find(g => g.id === activeGame)) {
      setActiveGame(activeGames[0].id);
      setRankTab(activeGames[0].id);
    }
  }, [games]);

  function handleLogin() {
    const name = nameInput.trim(); if(!name) return;
    setUserName(name);
    setBets(allBets[name] || {});
    setScreen("bets");
  }

  async function handleSaveBet(gameId) {
    if(!bets[gameId]) return;
    setSaving(true);
    const updated = {...allBets, [userName]: {...(allBets[userName]||{}), [gameId]: bets[gameId]}};
    setAllBets(updated);
    await sSet("bolao:allBets", updated);
    setSavedGames(s => ({...s, [gameId]: true}));
    setSaving(false);
    setTimeout(() => setSavedGames(s => ({...s, [gameId]: false})), 2500);
  }

  function updateBet(gameId, field, val) {
    const v = val.replace(/\D/g,"").slice(0,2);
    setBets(b => ({...b, [gameId]: {...(b[gameId]||{}), [field]: v}}));
    setSavedGames(s => ({...s, [gameId]: false}));
  }

  function handleAdminLogin() {
    if(adminPass === ADMIN_PASSWORD) { setAdminUnlocked(true); setAdminError(""); }
    else setAdminError("Senha incorreta");
  }

  async function handleSaveResult(gameId) {
    await sSet("bolao:results", results);
    setSavedGames(s => ({...s, [`r_${gameId}`]: true}));
    setTimeout(() => setSavedGames(s => ({...s, [`r_${gameId}`]: false})), 2000);
  }

  function updateResult(gameId, field, val) {
    const v = val.replace(/\D/g,"").slice(0,2);
    setResults(r => ({...r, [gameId]: {...(r[gameId]||{}), [field]: v}}));
  }

  async function handleSaveGames(updatedGames) {
    setGames(updatedGames);
    await sSet("bolao:games", updatedGames);
  }

  function updateGamePrize(gameId, field, val) {
    setGames(g => g.map(game => game.id === gameId ? {...game, [field]: val} : game));
  }

  async function saveGamePrizes() {
    await sSet("bolao:games", games);
    setSavedGames(s => ({...s, prizes: true}));
    setTimeout(() => setSavedGames(s => ({...s, prizes: false})), 2000);
  }

  async function toggleGame(gameId) {
    const updated = games.map(g => g.id === gameId ? {...g, active: !g.active} : g);
    await handleSaveGames(updated);
  }

  function getRanking(gameId) {
    const res = results[gameId];
    return Object.entries(allBets)
      .map(([name, ub]) => { const bet = ub[gameId]; if(!bet) return null; return {name, pts: calcPoints(bet, res), bet}; })
      .filter(Boolean)
      .sort((a,b) => { if(a.pts===null&&b.pts===null) return 0; if(a.pts===null) return 1; if(b.pts===null) return -1; return b.pts-a.pts; });
  }

  const totalP = Object.keys(allBets).length;
  const cGame = activeGames.find(g => g.id === activeGame) || activeGames[0];
  const cRank = activeGames.find(g => g.id === rankTab) || activeGames[0];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#0d0d0d;color:#fff;font-family:'Barlow',sans-serif;min-height:100vh;}

    .header{background:#0a0a0a;border-bottom:1px solid #161616;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200;}
    .header-brand{display:flex;align-items:center;gap:8px;}
    .header-divider{width:1px;height:26px;background:#1a1a1a;margin:0 6px;}
    .header-wm{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.5px;line-height:1;}
    .header-wm em{color:${GOLD};font-style:normal;}
    .header-sub{font-size:9px;color:#2a2a2a;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;font-weight:300;}
    .nav{display:flex;gap:0;}
    .nav-btn{background:none;border:none;color:#2e2e2e;padding:6px 9px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:color .15s;position:relative;border-bottom:2px solid transparent;}
    .nav-btn.on{color:${GOLD};border-bottom-color:${GOLD};}
    .nav-btn:hover{color:#666;}

    .tabs{display:flex;background:#0a0a0a;border-bottom:1px solid #141414;overflow-x:auto;padding:0 12px;scrollbar-width:none;}
    .tabs::-webkit-scrollbar{display:none;}
    .tab{flex:0 0 auto;padding:13px 12px 11px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#2a2a2a;text-transform:uppercase;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;}
    .tab.on{color:${GOLD};border-bottom-color:${GOLD};}

    .page{padding:14px;max-width:480px;margin:0 auto;position:relative;z-index:1;}

    .game-card{background:linear-gradient(145deg,#0f0f0f 0%,#0a0a0a 100%);border:1px solid #1a1a1a;border-top:2px solid ${GOLD};padding:18px;margin-bottom:12px;position:relative;overflow:hidden;}
    .card-glow{position:absolute;top:-30px;right:-30px;width:200px;height:200px;background:radial-gradient(circle,rgba(200,168,75,.06) 0%,transparent 70%);pointer-events:none;}
    .game-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
    .game-lbl{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:800;letter-spacing:4px;color:${GOLD};}
    .game-venue{font-size:10px;color:#2a2a2a;letter-spacing:.5px;}
    .game-date{font-size:10px;color:#222;margin-top:2px;}
    .badge-closed{background:#140808;border:1px solid #2a1010;color:#883333;font-size:9px;font-weight:800;letter-spacing:2px;padding:4px 8px;}

    .matchup{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .team{text-align:center;flex:1;}
    .flag{font-size:38px;line-height:1;margin-bottom:7px;}
    .team-nm{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#aaa;letter-spacing:.5px;text-transform:uppercase;}
    .vs-block{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;}
    .vs-ln{width:1px;height:18px;background:#1a1a1a;}
    .vs-tx{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;color:#1e1e1e;letter-spacing:2px;}

    .score-prompt{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:300;letter-spacing:4px;color:#2a2a2a;text-transform:uppercase;text-align:center;margin-bottom:10px;}
    .score-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;}
    .score-in{width:70px;height:70px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:38px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;transition:border .15s,box-shadow .15s;-moz-appearance:textfield;border-radius:0;}
    .score-in::-webkit-outer-spin-button,.score-in::-webkit-inner-spin-button{-webkit-appearance:none;}
    .score-in:focus{border-color:${GOLD};box-shadow:0 0 0 2px rgba(200,168,75,.08);}
    .score-in:disabled{opacity:.25;cursor:not-allowed;}
    .score-sep{font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;color:#1a1a1a;}

    .prize-row{display:flex;align-items:center;gap:10px;border-top:1px solid #141414;padding-top:14px;margin-bottom:14px;}
    .prize-ico{width:34px;height:34px;background:#080808;border:1px solid #1e1e1e;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
    .prize-lbl{font-size:9px;color:#333;letter-spacing:2px;text-transform:uppercase;font-weight:700;}
    .prize-nm{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:${GOLD};line-height:1;margin-top:1px;}

    .action-btn{width:100%;background:${GOLD};color:#0d0d0d;border:none;padding:14px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:filter .15s;border-radius:0;}
    .action-btn:hover:not(:disabled){filter:brightness(1.1);}
    .action-btn:disabled{background:#111;color:#222;cursor:not-allowed;}
    .action-btn.saved{background:#0a180a;color:#3aaa3a;border:1px solid #143014;}
    .action-btn.ghost{background:#0a0a0a;color:#333;border:1px solid #141414;cursor:default;font-size:12px;letter-spacing:1px;}

    .pts-box{background:#080808;border:1px solid #141414;}
    .pts-hd{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#2a2a2a;text-transform:uppercase;padding:10px 14px 6px;border-bottom:1px solid #0f0f0f;}
    .pts-r{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #0f0f0f;}
    .pts-r:last-child{border-bottom:none;}
    .pts-d{font-size:12px;color:#333;}
    .pts-v{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:${GOLD};}

    .rank-hero{background:linear-gradient(180deg,#0f0c00 0%,#0a0a0a 100%);border-bottom:1px solid #141414;padding:14px;position:relative;overflow:hidden;}
    .rank-game-nm{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:#fff;letter-spacing:.5px;text-transform:uppercase;position:relative;z-index:1;}
    .rank-game-nm span{color:${GOLD};}
    .rank-meta{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-top:3px;position:relative;z-index:1;}
    .result-chip{display:inline-flex;align-items:center;gap:10px;background:#0d0b00;border:1px solid #2a2000;padding:6px 12px;margin-top:10px;position:relative;z-index:1;}
    .result-lbl{font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;font-family:'Barlow Condensed',sans-serif;}
    .result-sc{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:${GOLD};}
    .rank-pending{font-size:10px;color:#2a2a2a;letter-spacing:2px;margin-top:10px;position:relative;z-index:1;}

    .rank-row{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #0d0d0d;}
    .rank-row:last-child{border-bottom:none;}
    .rank-row.me{background:#0c0a00;border-left:2px solid ${GOLD};}
    .rank-pos{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#1e1e1e;width:26px;text-align:center;flex-shrink:0;}
    .rank-pos.p1{color:#FFD700;} .rank-pos.p2{color:#B0B0B0;} .rank-pos.p3{color:#A07040;}
    .rank-nm{font-size:13px;font-weight:600;color:#bbb;flex:1;}
    .rank-me-tag{font-size:9px;color:${GOLD};margin-left:5px;font-weight:700;letter-spacing:1px;}
    .rank-bet{font-size:10px;color:#222;margin-top:2px;letter-spacing:.5px;}
    .rank-pts{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:${GOLD};text-align:right;line-height:1;}
    .rank-pts-u{font-size:8px;color:#2a2a2a;letter-spacing:2px;text-transform:uppercase;text-align:right;}
    .rank-empty{padding:40px 14px;text-align:center;font-size:11px;color:#222;letter-spacing:3px;}

    /* QR */
    .qr-page{padding:24px 14px;max-width:400px;margin:0 auto;text-align:center;}
    .qr-title{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:1px;margin-bottom:4px;}
    .qr-title span{color:${GOLD};}
    .qr-sub{font-size:12px;color:#3a3a3a;letter-spacing:1px;margin-bottom:28px;}
    .qr-box{background:#0a0a0a;border:1px solid #1e1e1e;border-top:2px solid ${GOLD};padding:28px;display:inline-block;margin-bottom:20px;}
    .qr-url{font-size:11px;color:#444;letter-spacing:1px;word-break:break-all;padding:10px 14px;background:#080808;border:1px solid #141414;margin-bottom:16px;}
    .qr-copy{background:${GOLD};color:#0d0d0d;border:none;padding:12px 24px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;letter-spacing:2px;cursor:pointer;}
    .qr-copy.copied{background:#0a180a;color:#3aaa3a;}
    .qr-hint{font-size:11px;color:#2a2a2a;margin-top:16px;letter-spacing:1px;}

    /* ADMIN */
    .admin-pg{max-width:480px;margin:0 auto;padding:16px 14px;}
    .admin-ttl{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:${GOLD};letter-spacing:1px;margin-bottom:4px;}
    .admin-meta{font-size:11px;color:#2a2a2a;letter-spacing:1px;margin-bottom:16px;}
    .admin-meta strong{color:#444;}
    .admin-tabs{display:flex;gap:0;border-bottom:1px solid #1a1a1a;margin-bottom:16px;}
    .admin-tab{background:none;border:none;color:#2a2a2a;padding:10px 14px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;}
    .admin-tab.on{color:${GOLD};border-bottom-color:${GOLD};}
    .admin-block{background:#0d0d0d;border:1px solid #1a1a1a;border-top:2px solid ${GOLD_DIM};padding:14px;margin-bottom:12px;}
    .admin-gname{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:#ddd;letter-spacing:.5px;margin-bottom:4px;}
    .admin-gmeta{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-bottom:12px;}
    .admin-entry{display:flex;align-items:center;gap:8px;}
    .admin-tlbl{font-size:11px;color:#444;flex:1;}
    .admin-tlbl.r{text-align:right;}
    .admin-sin{width:50px;height:46px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:24px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;border-radius:0;-moz-appearance:textfield;}
    .admin-sin::-webkit-outer-spin-button,.admin-sin::-webkit-inner-spin-button{-webkit-appearance:none;}
    .admin-sin:focus{border-color:${GOLD};}
    .admin-dash{color:#1e1e1e;font-size:22px;font-weight:900;font-family:'Barlow Condensed',sans-serif;}
    .admin-sv{background:${GOLD};color:#0d0d0d;border:none;padding:9px 18px;margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;letter-spacing:2px;cursor:pointer;border-radius:0;}
    .admin-sv:hover{filter:brightness(1.1);}
    .admin-sv.saved{background:#0a180a;color:#3aaa3a;}

    /* Prize edit */
    .prize-edit-row{display:flex;gap:8px;align-items:center;margin-bottom:8px;}
    .prize-edit-ico{width:44px;height:44px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:22px;text-align:center;outline:none;font-family:'Barlow',sans-serif;}
    .prize-edit-txt{flex:1;background:#080808;border:1px solid #1e1e1e;color:#fff;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;outline:none;}
    .prize-edit-ico:focus,.prize-edit-txt:focus{border-color:${GOLD};}

    /* Toggle */
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#0d0d0d;border:1px solid #1a1a1a;margin-bottom:8px;}
    .toggle-info{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:#ccc;}
    .toggle-info small{display:block;font-size:10px;color:#333;font-family:'Barlow',sans-serif;font-weight:400;letter-spacing:1px;margin-top:2px;}
    .toggle-btn{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
    .toggle-btn.on{background:${GOLD};}
    .toggle-btn.off{background:#222;}
    .toggle-knob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;}
    .toggle-btn.on .toggle-knob{left:23px;}
    .toggle-btn.off .toggle-knob{left:3px;}

    .field-label{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#3a3a3a;text-transform:uppercase;margin-bottom:8px;}
    .text-input{width:100%;background:#0a0a0a;border:1px solid #222;color:#fff;padding:14px 16px;font-family:'Barlow',sans-serif;font-size:15px;outline:none;transition:border .2s;border-radius:0;}
    .text-input:focus{border-color:${GOLD};}
    .text-input::placeholder{color:#2a2a2a;}
    .gold-btn{width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;border:none;padding:15px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;transition:filter .15s;}
    .gold-btn:hover:not(:disabled){filter:brightness(1.08);}
    .gold-btn:disabled{background:#181818;color:#2a2a2a;cursor:not-allowed;}
    .err{color:#883333;font-size:12px;margin-top:8px;letter-spacing:1px;}
  `;

  // LOGIN
  if (screen === "login") return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 110% 80% at 70% 45%, #1c1400 0%, #0d0d0d 55%)",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{css}</style>
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}><ConstellationBg width={window.innerWidth||400} height={window.innerHeight||700}/></div>
      <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-52%)",pointerEvents:"none"}}><Shield w={160} h={185} glow/></div>
      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:6,color:"#444",textTransform:"uppercase",marginBottom:28,textAlign:"center"}}>Copa do Mundo · México</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:6}}>
          <XPBox size={56}/>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:.9,textTransform:"uppercase"}}>Insurance<br/>Experience</div>
          <Shield w={70} h={80} glow/>
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:900,fontStyle:"italic",color:GOLD,letterSpacing:4,marginBottom:8}}>2026</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:5,color:"#2e2e2e",textTransform:"uppercase",marginBottom:32}}>Bolão Oficial</div>
        <div style={{width:240,height:1,background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,opacity:.35,marginBottom:32}}/>
        <div style={{width:"100%",maxWidth:300}}>
          <div className="field-label">Seu nome</div>
          <input className="text-input" placeholder="Como aparecer no ranking" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
          <button className="gold-btn" onClick={handleLogin} disabled={!nameInput.trim()}>Entrar no bolão</button>
        </div>
        <div style={{marginTop:24,fontSize:10,color:"#222",textAlign:"center",letterSpacing:3,fontFamily:"'Barlow Condensed',sans-serif"}}>
          {totalP>0?<><span style={{color:GOLD_DIM,fontWeight:700}}>{totalP}</span> PARTICIPANTE{totalP>1?"S":""} JÁ APOSTARAM</>:"SEJA O PRIMEIRO A APOSTAR"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",position:"relative"}}>
      <style>{css}</style>
      <div className="header">
        <div className="header-brand">
          <XPBox size={28}/>
          <div className="header-divider"/>
          <Shield w={22} h={25}/>
          <div style={{marginLeft:6}}>
            <div className="header-wm">Insurance <em>Experience</em></div>
            <div className="header-sub">2026 · Copa do Mundo · México</div>
          </div>
        </div>
        <div className="nav">
          {[["bets","Apostas"],["ranking","Ranking"],["qr","QR Code"],["admin","Admin"]].map(([s,l])=>(
            <button key={s} className={`nav-btn${screen===s?" on":""}`} onClick={()=>setScreen(s)}>{l}</button>
          ))}
        </div>
      </div>

      {/* BETS */}
      {screen==="bets"&&(
        <>
          <div className="tabs">
            {activeGames.map(g=>(
              <button key={g.id} className={`tab${activeGame===g.id?" on":""}`} onClick={()=>setActiveGame(g.id)}>
                {g.homeflag} {g.home.split(" ")[0]} × {g.away.split(" ")[0]} {g.awayflag}
              </button>
            ))}
          </div>
          {cGame && (()=>{
            const game=cGame, closed=isGameClosed(game);
            const bet=bets[game.id]||{}, saved=savedGames[game.id];
            const hasBet=bet.homeScore!==undefined&&bet.awayScore!==undefined&&bet.homeScore!==""&&bet.awayScore!=="";
            return(
              <div className="page">
                <div className="game-card">
                  <div className="card-glow"/>
                  <div className="game-head">
                    <div><div className="game-lbl">{game.label}</div><div className="game-venue" style={{marginTop:3}}>{game.venue}</div></div>
                    {closed?<div className="badge-closed">🔒 ENCERRADO</div>:<div className="game-date">{formatDate(game.date)}</div>}
                  </div>
                  <div className="matchup">
                    <div className="team"><div className="flag">{game.homeflag}</div><div className="team-nm">{game.home}</div></div>
                    <div className="vs-block"><div className="vs-ln"/><div className="vs-tx">VS</div><div className="vs-ln"/></div>
                    <div className="team"><div className="flag">{game.awayflag}</div><div className="team-nm">{game.away}</div></div>
                  </div>
                  <div className="score-prompt">Seu palpite de placar</div>
                  <div className="score-row">
                    <input className="score-in" type="number" min="0" max="99" placeholder="—" value={bet.homeScore??""} onChange={e=>updateBet(game.id,"homeScore",e.target.value)} disabled={closed}/>
                    <div className="score-sep">×</div>
                    <input className="score-in" type="number" min="0" max="99" placeholder="—" value={bet.awayScore??""} onChange={e=>updateBet(game.id,"awayScore",e.target.value)} disabled={closed}/>
                  </div>
                  <div className="prize-row">
                    <div className="prize-ico">{game.prizeIcon}</div>
                    <div><div className="prize-lbl">Prêmio deste jogo</div><div className="prize-nm">{game.prize}</div></div>
                  </div>
                  {!closed
                    ?<button className={`action-btn${saved?" saved":""}`} onClick={()=>handleSaveBet(game.id)} disabled={!hasBet||saving}>
                      {saving?"Salvando...":saved?"✓ Aposta registrada!":hasBet?"Confirmar aposta":"Digite o placar para apostar"}
                    </button>
                    :<div className="action-btn ghost">{hasBet?`Sua aposta: ${bet.homeScore} × ${bet.awayScore}`:"Você não apostou neste jogo"}</div>
                  }
                </div>
                <div className="pts-box">
                  <div className="pts-hd">Sistema de Pontuação</div>
                  {[["Placar exato","3 pts"],["Vencedor / empate","1 pt"],["Total de gols correto","+1 pt"],["Máximo por jogo","5 pts"]].map(([d,v])=>(
                    <div key={d} className="pts-r"><span className="pts-d">{d}</span><span className="pts-v">{v}</span></div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* RANKING */}
      {screen==="ranking"&&(
        <>
          <div className="tabs">
            {activeGames.map(g=>(
              <button key={g.id} className={`tab${rankTab===g.id?" on":""}`} onClick={()=>setRankTab(g.id)}>
                {g.prizeIcon} {g.home.split(" ")[0]} × {g.away.split(" ")[0]}
              </button>
            ))}
          </div>
          {cRank&&(()=>{
            const game=cRank, ranking=getRanking(game.id);
            const hasResult=results[game.id]?.homeScore!==undefined&&results[game.id]?.homeScore!=="";
            return(
              <>
                <div className="rank-hero">
                  <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.6}}><ConstellationBg width={500} height={120}/></div>
                  <div className="rank-game-nm">{game.homeflag} {game.home} <span>×</span> {game.away} {game.awayflag}</div>
                  <div className="rank-meta">{game.venue} · {formatDate(game.date)} · Prêmio: {game.prizeIcon} {game.prize}</div>
                  {hasResult&&<div className="result-chip"><div className="result-lbl">Resultado</div><div className="result-sc">{results[game.id].homeScore} × {results[game.id].awayScore}</div></div>}
                  {!hasResult&&isGameClosed(game)&&<div className="rank-pending">AGUARDANDO RESULTADO...</div>}
                </div>
                <div style={{maxWidth:480,margin:"0 auto"}}>
                  {ranking.length===0
                    ?<div className="rank-empty">NENHUMA APOSTA REGISTRADA</div>
                    :ranking.map((e,i)=>(
                      <div key={e.name} className={`rank-row${e.name===userName?" me":""}`}>
                        <div className={`rank-pos${i===0?" p1":i===1?" p2":i===2?" p3":""}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                        <div style={{flex:1}}>
                          <div className="rank-nm">{e.name}{e.name===userName&&<span className="rank-me-tag">• você</span>}</div>
                          <div className="rank-bet">Apostou: {e.bet.homeScore} × {e.bet.awayScore}</div>
                        </div>
                        <div>
                          {hasResult&&e.pts!==null?<><div className="rank-pts">{e.pts}</div><div className="rank-pts-u">PTS</div></>:<div style={{color:"#1a1a1a",fontSize:20,fontFamily:"'Barlow Condensed',sans-serif"}}>—</div>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            );
          })()}
        </>
      )}
      {/* QR CODE */}
      {screen==="qr"&&<QRScreen appUrl={appUrl}/>}

      {/* ADMIN */}
      {screen==="admin"&&(
        <div className="admin-pg">
          {!adminUnlocked?(
            <>
              <div className="admin-ttl">🔐 Admin</div>
              <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",padding:18,maxWidth:300}}>
                <div className="field-label">Senha</div>
                <input className="text-input" type="password" placeholder="••••••" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
                {adminError&&<div className="err">{adminError}</div>}
                <button className="gold-btn" onClick={handleAdminLogin} style={{marginTop:10}}>Entrar</button>
              </div>
            </>
          ):(
            <>
              <div className="admin-ttl">Painel Admin</div>
              <div className="admin-meta"><strong>{totalP}</strong> participantes · <strong>{Object.values(allBets).reduce((a,b)=>a+Object.keys(b).length,0)}</strong> apostas</div>
              <div className="admin-tabs">
                {[["results","Resultados"],["prizes","Prêmios"],["games","Jogos"]].map(([t,l])=>(
                  <button key={t} className={`admin-tab${adminTab===t?" on":""}`} onClick={()=>setAdminTab(t)}>{l}</button>
                ))}
              </div>

              {/* RESULTADOS */}
              {adminTab==="results"&&activeGames.map(game=>{
                const res=results[game.id]||{};
                const count=Object.values(allBets).filter(b=>b[game.id]).length;
                return(
                  <div key={game.id} className="admin-block">
                    <div className="admin-gname">{game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                    <div className="admin-gmeta">{count} APOSTAS · {game.venue}</div>
                    <div className="admin-entry">
                      <div className="admin-tlbl">{game.home}</div>
                      <input className="admin-sin" type="number" min="0" placeholder="—" value={res.homeScore??""} onChange={e=>updateResult(game.id,"homeScore",e.target.value)}/>
                      <div className="admin-dash">×</div>
                      <input className="admin-sin" type="number" min="0" placeholder="—" value={res.awayScore??""} onChange={e=>updateResult(game.id,"awayScore",e.target.value)}/>
                      <div className="admin-tlbl r">{game.away}</div>
                    </div>
                    <button className={`admin-sv${savedGames[`r_${game.id}`]?" saved":""}`} onClick={()=>handleSaveResult(game.id)}>
                      {savedGames[`r_${game.id}`]?"✓ Publicado":"Publicar resultado"}
                    </button>
                  </div>
                );
              })}

              {/* PRÊMIOS */}
              {adminTab==="prizes"&&(
                <>
                  {games.map(game=>(
                    <div key={game.id} className="admin-block">
                      <div className="admin-gname">{game.label} — {game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                      <div className="admin-gmeta" style={{marginBottom:10}}>Edite o prêmio deste jogo</div>
                      <div className="prize-edit-row">
                        <input className="prize-edit-ico" value={game.prizeIcon} onChange={e=>updateGamePrize(game.id,"prizeIcon",e.target.value)} maxLength={2} title="Emoji do prêmio"/>
                        <input className="prize-edit-txt" value={game.prize} onChange={e=>updateGamePrize(game.id,"prize",e.target.value)} placeholder="Nome do prêmio"/>
                      </div>
                    </div>
                  ))}
                  <button className={`admin-sv${savedGames.prizes?" saved":""}`} style={{width:"100%",padding:14,fontSize:15}} onClick={saveGamePrizes}>
                    {savedGames.prizes?"✓ Prêmios salvos!":"Salvar todos os prêmios"}
                  </button>
                </>
              )}

              {/* JOGOS ATIVOS */}
              {adminTab==="games"&&(
                <>
                  <div style={{fontSize:11,color:"#333",letterSpacing:1,marginBottom:12}}>ATIVE OU DESATIVE JOGOS DO BOLÃO</div>
                  {games.map(game=>(
                    <div key={game.id} className="toggle-row">
                      <div className="toggle-info">
                        {game.homeflag} {game.home} × {game.away} {game.awayflag}
                        <small>{game.label} · {game.prizeIcon} {game.prize}</small>
                      </div>
                      <button className={`toggle-btn${game.active?" on":" off"}`} onClick={()=>toggleGame(game.id)}>
                        <div className="toggle-knob"/>
                      </button>
                    </div>
                  ))}
                  <div style={{fontSize:10,color:"#222",letterSpacing:1,marginTop:12,textAlign:"center"}}>
                    Jogos desativados não aparecem para os participantes
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
