import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "XP2026";
const GOLD = "#C8A84B";
const GOLD2 = "#E2C060";
const GOLD_DIM = "#7A6520";

const GAMES = [
  { id: "game1", home: "Argentina", away: "Argélia", homeflag: "🇦🇷", awayflag: "🇩🇿", date: "2026-06-16T15:00:00", label: "JOGO 1", prize: "Apple Watch", prizeIcon: "⌚", venue: "Estádio Azteca" },
  { id: "game2", home: "Uzbequistão", away: "Colômbia", homeflag: "🇺🇿", awayflag: "🇨🇴", date: "2026-06-18T19:00:00", label: "JOGO 2", prize: "AirPods", prizeIcon: "🎧", venue: "No Estádio (ao vivo!)" },
  { id: "game3", home: "Brasil", away: "Haiti", homeflag: "🇧🇷", awayflag: "🇭🇹", date: "2026-06-21T17:00:00", label: "JOGO 3", prize: "A definir", prizeIcon: "🏆", venue: "Xcaret" },
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
  return new Date(d).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}

async function sGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function sSet(key, val) { try { await window.storage.set(key, JSON.stringify(val), true); } catch {} }

// ===================== SVG COMPONENTS =====================

// Escudo fiel ao key visual: forma precisa com triangulação interna
function Shield({ w = 120, h = 140, glow = false }) {
  // Pontos do escudo (normalizado 0-100 x 0-115)
  // Topo: linha reta com dois "ombros" chanfrados, depois vai afunilando até ponta
  const outer = "M 20,0 L 80,0 L 100,18 L 100,65 L 50,115 L 0,65 L 0,18 Z";

  // Pontos internos para triangulação
  const pts = {
    TL: [20, 0], TR: [80, 0],
    SL: [0, 18], SR: [100, 18],
    ML: [0, 65], MR: [100, 65],
    BOT: [50, 115],
    // internos
    IT: [50, 0],
    IL: [22, 38], IR: [78, 38],
    IC: [50, 38],
    IML: [18, 72], IMR: [82, 72],
    IBC: [50, 80],
  };

  const lines = [
    // topo horizontal
    [pts.TL, pts.IT], [pts.IT, pts.TR],
    // ombros
    [pts.TL, pts.SL], [pts.TR, pts.SR],
    // diagonais do topo para internos
    [pts.TL, pts.IL], [pts.TR, pts.IR],
    [pts.IT, pts.IC],
    [pts.SL, pts.IL], [pts.SR, pts.IR],
    // linha horizontal central superior
    [pts.IL, pts.IC], [pts.IC, pts.IR],
    // diagonais cruzadas
    [pts.IL, pts.IR],
    [pts.SL, pts.IC], [pts.SR, pts.IC],
    // de IL/IR para baixo
    [pts.IL, pts.IML], [pts.IR, pts.IMR],
    [pts.IC, pts.IML], [pts.IC, pts.IMR],
    // laterais inferiores
    [pts.ML, pts.IML], [pts.MR, pts.IMR],
    // linha horizontal inferior
    [pts.IML, pts.IBC], [pts.IBC, pts.IMR],
    [pts.IML, pts.IMR],
    // para ponta
    [pts.IML, pts.BOT], [pts.IMR, pts.BOT],
    [pts.IBC, pts.BOT],
    [pts.ML, pts.BOT], [pts.MR, pts.BOT],
  ];

  const nodes = [pts.TL, pts.TR, pts.IT, pts.SL, pts.SR, pts.IL, pts.IR, pts.IC, pts.ML, pts.MR, pts.IML, pts.IMR, pts.IBC, pts.BOT];

  const scaleX = w / 100;
  const scaleY = h / 115;
  const sc = ([x, y]) => [x * scaleX, y * scaleY];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      {glow && <defs>
        <filter id="sglow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>}
      {/* Outer shape */}
      <path
        d={`M ${sc(pts.TL).join(",")} L ${sc(pts.IT).join(",")} L ${sc(pts.TR).join(",")} L ${sc(pts.SR).join(",")} L ${sc(pts.MR).join(",")} L ${sc(pts.BOT).join(",")} L ${sc(pts.ML).join(",")} L ${sc(pts.SL).join(",")} Z`}
        stroke={GOLD} strokeWidth={w > 80 ? "1.8" : "1.2"} fill="none"
        filter={glow ? "url(#sglow)" : undefined}
        opacity="0.95"
      />
      {/* Inner triangulation lines */}
      {lines.map(([a, b], i) => {
        const [ax, ay] = sc(a);
        const [bx, by] = sc(b);
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={GOLD} strokeWidth={w > 80 ? "0.9" : "0.6"} opacity="0.7"/>;
      })}
      {/* Node dots */}
      {nodes.map(([x, y], i) => {
        const [sx, sy] = sc([x, y]);
        return <circle key={i} cx={sx} cy={sy} r={w > 80 ? "2.2" : "1.4"} fill={GOLD} opacity="0.9"/>;
      })}
    </svg>
  );
}

// Logo XP branco
function XPBox({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <rect width="88" height="88" rx="16" fill="white"/>
      <text x="44" y="60" textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
        fontSize="44" fontWeight="900" fill="#0d0d0d" letterSpacing="-2">XP</text>
    </svg>
  );
}

// Rede de pontos do fundo (constellation)
function ConstellationBg({ width = 400, height = 300, seed = 1 }) {
  // pontos fixos para ser determinístico
  const rawPts = [
    [0.12,0.15],[0.28,0.08],[0.45,0.22],[0.62,0.05],[0.78,0.18],[0.92,0.12],
    [0.08,0.42],[0.35,0.38],[0.55,0.45],[0.72,0.35],[0.88,0.48],
    [0.18,0.68],[0.42,0.72],[0.65,0.62],[0.85,0.75],
    [0.25,0.88],[0.52,0.92],[0.75,0.85],
  ];
  const pts = rawPts.map(([x,y]) => [x*width, y*height]);
  // connect nearby points
  const links = [];
  for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
    const dx=pts[i][0]-pts[j][0], dy=pts[i][1]-pts[j][1];
    const d=Math.sqrt(dx*dx+dy*dy);
    if (d < width*0.28) links.push([i,j,d]);
  }
  return (
    <svg width={width} height={height} style={{position:"absolute",inset:0,pointerEvents:"none"}} viewBox={`0 0 ${width} ${height}`}>
      {links.map(([i,j,d],k)=>(
        <line key={k} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]}
          stroke={GOLD} strokeWidth="0.5" opacity={Math.max(0.04, 0.18 - d/(width*1.8))}/>
      ))}
      {pts.map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.8" fill={GOLD} opacity="0.35"/>
      ))}
    </svg>
  );
}

// Elemento mecânico/decorativo direita (simplificado mas fiel ao estilo)
function MechDecor({ size = 300 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" fill="none" style={{display:"block"}}>
      {/* Arco externo */}
      <path d="M 150,10 A 140,140 0 0,1 290,150" stroke={GOLD} strokeWidth="1" opacity="0.15"/>
      <path d="M 150,10 A 140,140 0 0,1 290,150" stroke={GOLD} strokeWidth="0.5" opacity="0.08" strokeDasharray="4 8"/>
      {/* Forma principal estilo engrenagem/estrutura */}
      <path d="M 80,40 L 180,40 L 230,80 L 250,160 L 200,240 L 120,260 L 60,200 L 50,100 Z"
        stroke={GOLD} strokeWidth="1" opacity="0.12" fill="none"/>
      {/* Linhas internas estruturais */}
      <line x1="80" y1="40" x2="250" y2="160" stroke={GOLD} strokeWidth="0.7" opacity="0.1"/>
      <line x1="180" y1="40" x2="60" y2="200" stroke={GOLD} strokeWidth="0.7" opacity="0.1"/>
      <line x1="230" y1="80" x2="120" y2="260" stroke={GOLD} strokeWidth="0.7" opacity="0.1"/>
      {/* Retângulos estruturais */}
      <rect x="100" y="60" width="120" height="30" rx="2" stroke={GOLD} strokeWidth="0.8" opacity="0.15" fill="none"/>
      <rect x="160" y="110" width="80" height="25" rx="2" stroke={GOLD} strokeWidth="0.8" opacity="0.12" fill="none"/>
      <rect x="80" y="160" width="90" height="25" rx="2" stroke={GOLD} strokeWidth="0.8" opacity="0.12" fill="none"/>
      {/* Detalhes finos */}
      <line x1="100" y1="75" x2="220" y2="75" stroke={GOLD} strokeWidth="0.5" opacity="0.18"/>
      <line x1="160" y1="122" x2="240" y2="122" stroke={GOLD} strokeWidth="0.5" opacity="0.15"/>
      {/* Ponto central dourado */}
      <circle cx="165" cy="175" r="3" fill={GOLD} opacity="0.4"/>
      <circle cx="165" cy="175" r="8" stroke={GOLD} strokeWidth="0.8" opacity="0.2" fill="none"/>
    </svg>
  );
}

// ===================== STORAGE =====================
async function storageGet(key) {
  try { const r = await window.storage.get(key,true); return r?JSON.parse(r.value):null; } catch{return null;}
}
async function storageSet(key,val) { try{await window.storage.set(key,JSON.stringify(val),true);}catch{} }

// ===================== APP =====================
export default function App() {
  const [screen, setScreen] = useState("login");
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [bets, setBets] = useState({});
  const [allBets, setAllBets] = useState({});
  const [results, setResults] = useState({});
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedGames, setSavedGames] = useState({});
  const [activeGame, setActiveGame] = useState(GAMES[0].id);
  const [rankTab, setRankTab] = useState(GAMES[0].id);

  useEffect(()=>{
    (async()=>{
      const ab=await storageGet("bolao:allBets"); if(ab)setAllBets(ab);
      const res=await storageGet("bolao:results"); if(res)setResults(res);
    })();
  },[]);

  useEffect(()=>{
    const iv=setInterval(async()=>{
      const ab=await storageGet("bolao:allBets"); if(ab)setAllBets(ab);
      const res=await storageGet("bolao:results"); if(res)setResults(res);
    },30000);
    return ()=>clearInterval(iv);
  },[]);

  function handleLogin(){
    const name=nameInput.trim(); if(!name)return;
    setUserName(name);
    setBets(allBets[name]||{});
    setScreen("bets");
  }

  async function handleSaveBet(gameId){
    if(!bets[gameId])return;
    setSaving(true);
    const updated={...allBets,[userName]:{...(allBets[userName]||{}),[gameId]:bets[gameId]}};
    setAllBets(updated);
    await storageSet("bolao:allBets",updated);
    setSavedGames(s=>({...s,[gameId]:true}));
    setSaving(false);
    setTimeout(()=>setSavedGames(s=>({...s,[gameId]:false})),2500);
  }

  function updateBet(gameId,field,val){
    const v=val.replace(/\D/g,"").slice(0,2);
    setBets(b=>({...b,[gameId]:{...(b[gameId]||{}),[field]:v}}));
    setSavedGames(s=>({...s,[gameId]:false}));
  }

  function handleAdminLogin(){
    if(adminPass===ADMIN_PASSWORD){setAdminUnlocked(true);setAdminError("");}
    else setAdminError("Senha incorreta");
  }

  async function handleSaveResult(gameId){
    await storageSet("bolao:results",results);
    setSavedGames(s=>({...s,[`r_${gameId}`]:true}));
    setTimeout(()=>setSavedGames(s=>({...s,[`r_${gameId}`]:false})),2000);
  }

  function updateResult(gameId,field,val){
    const v=val.replace(/\D/g,"").slice(0,2);
    setResults(r=>({...r,[gameId]:{...(r[gameId]||{}),[field]:v}}));
  }

  function getRanking(gameId){
    const res=results[gameId];
    return Object.entries(allBets)
      .map(([name,ub])=>{const bet=ub[gameId];if(!bet)return null;return{name,pts:calcPoints(bet,res),bet};})
      .filter(Boolean)
      .sort((a,b)=>{
        if(a.pts===null&&b.pts===null)return 0;
        if(a.pts===null)return 1; if(b.pts===null)return -1;
        return b.pts-a.pts;
      });
  }

  const totalP=Object.keys(allBets).length;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@300;400;500;600;700&display=swap');

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#0d0d0d;color:#fff;font-family:'Barlow',sans-serif;min-height:100vh;}

    /* ======= LOGIN ======= */
    .login-wrap{
      min-height:100vh;
      background:radial-gradient(ellipse 100% 80% at 65% 45%, #1c1400 0%, #0d0d0d 55%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:32px 20px;position:relative;overflow:hidden;
    }
    .login-decor-right{
      position:absolute;right:-40px;top:50%;transform:translateY(-50%);
      pointer-events:none;opacity:1;
    }
    .login-decor-shield{
      position:absolute;right:60px;top:50%;transform:translateY(-55%);
      pointer-events:none;
    }
    .login-eyebrow{
      font-family:'Barlow Condensed',sans-serif;
      font-size:12px;font-weight:300;letter-spacing:5px;color:#555;
      text-transform:uppercase;margin-bottom:28px;text-align:center;
    }
    .login-brand-row{
      display:flex;align-items:center;gap:18px;margin-bottom:8px;
      position:relative;z-index:2;
    }
    .login-wordmark{
      font-family:'Barlow Condensed',sans-serif;
      font-size:56px;font-weight:900;color:#fff;letter-spacing:-1px;
      line-height:.88;text-transform:uppercase;
    }
    .login-year{
      font-family:'Barlow Condensed',sans-serif;
      font-size:42px;font-weight:900;font-style:italic;
      color:${GOLD};letter-spacing:3px;text-align:center;
      margin-bottom:8px;position:relative;z-index:2;
    }
    .login-sub{
      font-family:'Barlow Condensed',sans-serif;
      font-size:12px;font-weight:300;letter-spacing:5px;
      color:#3a3a3a;text-align:center;margin-bottom:36px;
      text-transform:uppercase;position:relative;z-index:2;
    }
    .login-rule{
      width:260px;height:1px;margin-bottom:32px;position:relative;z-index:2;
      background:linear-gradient(90deg,transparent,${GOLD},transparent);opacity:0.4;
    }
    .login-card{
      width:100%;max-width:320px;position:relative;z-index:2;
    }
    .field-label{
      font-family:'Barlow Condensed',sans-serif;
      font-size:10px;font-weight:700;letter-spacing:3px;
      color:#3a3a3a;text-transform:uppercase;margin-bottom:8px;
    }
    .text-input{
      width:100%;background:#0a0a0a;border:1px solid #222;
      color:#fff;padding:14px 16px;
      font-family:'Barlow',sans-serif;font-size:15px;
      outline:none;transition:border .2s,box-shadow .2s;
      border-radius:0;letter-spacing:.3px;
    }
    .text-input:focus{border-color:${GOLD};box-shadow:0 0 0 2px rgba(200,168,75,.1);}
    .text-input::placeholder{color:#2a2a2a;}
    .gold-btn{
      width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;
      border:none;padding:15px;
      font-family:'Barlow Condensed',sans-serif;
      font-size:17px;font-weight:900;letter-spacing:3px;text-transform:uppercase;
      cursor:pointer;border-radius:0;transition:filter .15s;
    }
    .gold-btn:hover:not(:disabled){filter:brightness(1.08);}
    .gold-btn:disabled{background:#181818;color:#2a2a2a;cursor:not-allowed;}
    .login-count{margin-top:24px;font-size:11px;color:#2a2a2a;text-align:center;letter-spacing:2px;position:relative;z-index:2;}
    .login-count strong{color:${GOLD_DIM};}

    /* ======= HEADER ======= */
    .header{
      background:#0a0a0a;border-bottom:1px solid #161616;
      padding:8px 14px;
      display:flex;align-items:center;justify-content:space-between;
      position:sticky;top:0;z-index:200;
    }
    .header-brand{display:flex;align-items:center;gap:8px;}
    .header-divider{width:1px;height:26px;background:#1a1a1a;margin:0 6px;}
    .header-wm{
      font-family:'Barlow Condensed',sans-serif;
      font-size:15px;font-weight:900;color:#fff;
      text-transform:uppercase;letter-spacing:.5px;line-height:1;
    }
    .header-wm em{color:${GOLD};font-style:normal;}
    .header-sub{font-size:9px;color:#2a2a2a;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;font-weight:300;}
    .nav{display:flex;gap:0;}
    .nav-btn{
      background:none;border:none;color:#2e2e2e;
      padding:7px 11px;
      font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:1.5px;
      text-transform:uppercase;cursor:pointer;transition:color .15s;
      position:relative;border-bottom:2px solid transparent;
    }
    .nav-btn.on{color:${GOLD};border-bottom-color:${GOLD};}
    .nav-btn:hover{color:#666;}

    /* ======= TABS ======= */
    .tabs{
      display:flex;background:#0a0a0a;border-bottom:1px solid #141414;
      overflow-x:auto;padding:0 12px;scrollbar-width:none;
    }
    .tabs::-webkit-scrollbar{display:none;}
    .tab{
      flex:0 0 auto;padding:13px 12px 11px;
      font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;
      color:#2a2a2a;text-transform:uppercase;cursor:pointer;
      background:none;border:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;
    }
    .tab.on{color:${GOLD};border-bottom-color:${GOLD};}
    .tab:hover{color:#555;}

    /* ======= PAGE ======= */
    .page{padding:14px;max-width:480px;margin:0 auto;position:relative;z-index:1;}

    /* ======= GAME CARD ======= */
    .game-card{
      background:linear-gradient(145deg,#0f0f0f 0%,#0a0a0a 100%);
      border:1px solid #1a1a1a;border-top:2px solid ${GOLD};
      padding:18px;margin-bottom:12px;position:relative;overflow:hidden;
    }
    .game-card-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
    .card-glow{
      position:absolute;top:-30px;right:-30px;width:200px;height:200px;
      background:radial-gradient(circle,rgba(200,168,75,.06) 0%,transparent 70%);
    }
    .game-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
    .game-lbl{
      font-family:'Barlow Condensed',sans-serif;
      font-size:10px;font-weight:800;letter-spacing:4px;color:${GOLD};
    }
    .game-venue-wrap{text-align:right;}
    .game-venue{font-size:10px;color:#2a2a2a;letter-spacing:.5px;}
    .game-date{font-size:10px;color:#222;margin-top:2px;}
    .badge-closed{
      background:#140808;border:1px solid #2a1010;color:#883333;
      font-size:9px;font-weight:800;letter-spacing:2px;padding:4px 8px;
    }

    .matchup{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .team{text-align:center;flex:1;}
    .flag{font-size:38px;line-height:1;margin-bottom:7px;}
    .team-nm{
      font-family:'Barlow Condensed',sans-serif;
      font-size:14px;font-weight:700;color:#aaa;
      letter-spacing:.5px;text-transform:uppercase;
    }
    .vs-block{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;}
    .vs-ln{width:1px;height:18px;background:#1a1a1a;}
    .vs-tx{
      font-family:'Barlow Condensed',sans-serif;
      font-size:11px;font-weight:700;color:#1e1e1e;letter-spacing:2px;
    }

    .score-prompt{
      font-family:'Barlow Condensed',sans-serif;
      font-size:10px;font-weight:300;letter-spacing:4px;color:#2a2a2a;
      text-transform:uppercase;text-align:center;margin-bottom:10px;
    }
    .score-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;}
    .score-in{
      width:70px;height:70px;background:#080808;border:1px solid #1e1e1e;
      color:#fff;font-size:38px;font-weight:900;text-align:center;
      outline:none;font-family:'Barlow Condensed',sans-serif;
      transition:border .15s,box-shadow .15s;
      -moz-appearance:textfield;border-radius:0;
    }
    .score-in::-webkit-outer-spin-button,.score-in::-webkit-inner-spin-button{-webkit-appearance:none;}
    .score-in:focus{border-color:${GOLD};box-shadow:0 0 0 2px rgba(200,168,75,.08);}
    .score-in:disabled{opacity:.25;cursor:not-allowed;}
    .score-sep{
      font-family:'Barlow Condensed',sans-serif;
      font-size:32px;font-weight:900;color:#1a1a1a;
    }

    .prize-row{
      display:flex;align-items:center;gap:10px;
      border-top:1px solid #141414;padding-top:14px;margin-bottom:14px;
    }
    .prize-ico{
      width:34px;height:34px;background:#080808;border:1px solid #1e1e1e;
      display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;
    }
    .prize-lbl{font-size:9px;color:#333;letter-spacing:2px;text-transform:uppercase;font-weight:700;}
    .prize-nm{
      font-family:'Barlow Condensed',sans-serif;
      font-size:20px;font-weight:800;color:${GOLD};line-height:1;margin-top:1px;
    }

    .action-btn{
      width:100%;background:${GOLD};color:#0d0d0d;
      border:none;padding:14px;
      font-family:'Barlow Condensed',sans-serif;
      font-size:16px;font-weight:900;letter-spacing:3px;text-transform:uppercase;
      cursor:pointer;transition:filter .15s;border-radius:0;
    }
    .action-btn:hover:not(:disabled){filter:brightness(1.1);}
    .action-btn:disabled{background:#111;color:#222;cursor:not-allowed;}
    .action-btn.saved{background:#0a180a;color:#3aaa3a;border:1px solid #143014;letter-spacing:2px;}
    .action-btn.ghost{background:#0a0a0a;color:#333;border:1px solid #141414;cursor:default;font-size:12px;letter-spacing:1px;}

    /* pts */
    .pts-box{background:#080808;border:1px solid #141414;}
    .pts-hd{
      font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;
      letter-spacing:3px;color:#2a2a2a;text-transform:uppercase;
      padding:10px 14px 6px;border-bottom:1px solid #0f0f0f;
    }
    .pts-r{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #0f0f0f;}
    .pts-r:last-child{border-bottom:none;}
    .pts-d{font-size:12px;color:#333;}
    .pts-v{
      font-family:'Barlow Condensed',sans-serif;
      font-size:17px;font-weight:800;color:${GOLD};
    }

    /* ======= RANKING ======= */
    .rank-hero{
      background:linear-gradient(180deg,#0f0c00 0%,#0a0a0a 100%);
      border-bottom:1px solid #141414;padding:14px 14px 12px;
      position:relative;overflow:hidden;
    }
    .rank-hero-const{position:absolute;inset:0;pointer-events:none;opacity:0.6;}
    .rank-game-nm{
      font-family:'Barlow Condensed',sans-serif;
      font-size:24px;font-weight:900;color:#fff;
      letter-spacing:.5px;text-transform:uppercase;position:relative;z-index:1;
    }
    .rank-game-nm span{color:${GOLD};}
    .rank-meta{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-top:3px;position:relative;z-index:1;}
    .result-chip{
      display:inline-flex;align-items:center;gap:10px;
      background:#0d0b00;border:1px solid #2a2000;
      padding:6px 12px;margin-top:10px;position:relative;z-index:1;
    }
    .result-lbl{font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;font-family:'Barlow Condensed',sans-serif;}
    .result-sc{
      font-family:'Barlow Condensed',sans-serif;
      font-size:26px;font-weight:900;color:${GOLD};
    }
    .rank-pending{font-size:10px;color:#2a2a2a;letter-spacing:2px;margin-top:10px;position:relative;z-index:1;}

    .rank-list{}
    .rank-row{
      display:flex;align-items:center;gap:10px;
      padding:11px 14px;border-bottom:1px solid #0d0d0d;
    }
    .rank-row:last-child{border-bottom:none;}
    .rank-row.me{background:#0c0a00;border-left:2px solid ${GOLD};}
    .rank-pos{
      font-family:'Barlow Condensed',sans-serif;
      font-size:20px;font-weight:900;color:#1e1e1e;width:26px;text-align:center;flex-shrink:0;
    }
    .rank-pos.p1{color:#FFD700;} .rank-pos.p2{color:#B0B0B0;} .rank-pos.p3{color:#A07040;}
    .rank-nm{font-size:13px;font-weight:600;color:#bbb;flex:1;}
    .rank-me-tag{font-size:9px;color:${GOLD};margin-left:5px;font-weight:700;letter-spacing:1px;}
    .rank-bet{font-size:10px;color:#222;margin-top:2px;letter-spacing:.5px;}
    .rank-pts{
      font-family:'Barlow Condensed',sans-serif;
      font-size:28px;font-weight:900;color:${GOLD};text-align:right;line-height:1;
    }
    .rank-pts-u{font-size:8px;color:#2a2a2a;letter-spacing:2px;text-transform:uppercase;text-align:right;}
    .rank-empty{padding:40px 14px;text-align:center;font-size:11px;color:#222;letter-spacing:3px;}

    /* ======= ADMIN ======= */
    .admin-pg{max-width:480px;margin:0 auto;padding:16px 14px;}
    .admin-ttl{
      font-family:'Barlow Condensed',sans-serif;
      font-size:26px;font-weight:900;color:${GOLD};
      letter-spacing:1px;margin-bottom:4px;
    }
    .admin-meta{font-size:11px;color:#2a2a2a;letter-spacing:1px;margin-bottom:18px;}
    .admin-meta strong{color:#444;}
    .admin-block{
      background:#0d0d0d;border:1px solid #1a1a1a;
      border-top:2px solid ${GOLD_DIM};
      padding:14px;margin-bottom:12px;
    }
    .admin-gname{
      font-family:'Barlow Condensed',sans-serif;
      font-size:17px;font-weight:800;color:#ddd;
      letter-spacing:.5px;margin-bottom:4px;
    }
    .admin-gmeta{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-bottom:12px;}
    .admin-entry{display:flex;align-items:center;gap:8px;}
    .admin-tlbl{font-size:11px;color:#444;flex:1;}
    .admin-tlbl.r{text-align:right;}
    .admin-sin{
      width:50px;height:46px;background:#080808;border:1px solid #1e1e1e;
      color:#fff;font-size:24px;font-weight:900;text-align:center;
      outline:none;font-family:'Barlow Condensed',sans-serif;border-radius:0;
      -moz-appearance:textfield;
    }
    .admin-sin::-webkit-outer-spin-button,.admin-sin::-webkit-inner-spin-button{-webkit-appearance:none;}
    .admin-sin:focus{border-color:${GOLD};}
    .admin-dash{color:#1e1e1e;font-size:22px;font-weight:900;font-family:'Barlow Condensed',sans-serif;}
    .admin-sv{
      background:${GOLD};color:#0d0d0d;border:none;
      padding:9px 18px;margin-top:12px;
      font-family:'Barlow Condensed',sans-serif;
      font-size:14px;font-weight:900;letter-spacing:2px;cursor:pointer;border-radius:0;
    }
    .admin-sv:hover{filter:brightness(1.1);}
    .admin-sv.saved{background:#0a180a;color:#3aaa3a;}
    .err{color:#883333;font-size:12px;margin-top:8px;letter-spacing:1px;}
  `;

  // LOGIN
  if (screen === "login") return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 110% 80% at 70% 45%, #1c1400 0%, #0d0d0d 55%)",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{css}</style>
      {/* Constellation bg */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <ConstellationBg width={window.innerWidth||400} height={window.innerHeight||700} />
      </div>
      {/* Mech decor right */}
      <div style={{position:"absolute",right:-60,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",opacity:0.8}}>
        <MechDecor size={320} />
      </div>
      {/* Shield decor right */}
      <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-52%)",pointerEvents:"none"}}>
        <Shield w={160} h={185} glow />
      </div>

      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:6,color:"#444",textTransform:"uppercase",marginBottom:28,textAlign:"center"}}>
          Copa do Mundo · México
        </div>

        {/* Brand row */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:6}}>
          <XPBox size={56} />
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:.9,textTransform:"uppercase"}}>
            Insurance<br/>Experience
          </div>
          <Shield w={70} h={80} glow />
        </div>

        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:900,fontStyle:"italic",color:GOLD,letterSpacing:4,marginBottom:8}}>
          2026
        </div>

        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:5,color:"#2e2e2e",textTransform:"uppercase",marginBottom:32}}>
          Bolão Oficial
        </div>

        <div style={{width:240,height:1,background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,opacity:.35,marginBottom:32}} />

        <div style={{width:"100%",maxWidth:300}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:4,color:"#333",textTransform:"uppercase",marginBottom:8}}>
            Seu nome
          </div>
          <input className="text-input" placeholder="Como aparecer no ranking"
            value={nameInput} onChange={e=>setNameInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus />
          <button className="gold-btn" onClick={handleLogin} disabled={!nameInput.trim()}>
            Entrar no bolão
          </button>
        </div>

        <div style={{marginTop:24,fontSize:10,color:"#222",textAlign:"center",letterSpacing:3,fontFamily:"'Barlow Condensed',sans-serif"}}>
          {totalP>0 ? <><span style={{color:GOLD_DIM,fontWeight:700}}>{totalP}</span> PARTICIPANTE{totalP>1?"S":""} JÁ APOSTARAM</> : "SEJA O PRIMEIRO A APOSTAR"}
        </div>
      </div>
    </div>
  );

  // MAIN
  const cGame = GAMES.find(g=>g.id===activeGame);
  const cRank = GAMES.find(g=>g.id===rankTab);

  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",position:"relative"}}>
      <style>{css}</style>

      {/* Header */}
      <div className="header">
        <div className="header-brand">
          <XPBox size={28} />
          <div className="header-divider"/>
          <Shield w={22} h={25} />
          <div style={{marginLeft:6}}>
            <div className="header-wm">Insurance <em>Experience</em></div>
            <div className="header-sub">2026 · Copa do Mundo · México</div>
          </div>
        </div>
        <div className="nav">
          {[["bets","Apostas"],["ranking","Ranking"],["admin","Admin"]].map(([s,l])=>(
            <button key={s} className={`nav-btn${screen===s?" on":""}`} onClick={()=>setScreen(s)}>{l}</button>
          ))}
        </div>
      </div>

      {/* BETS */}
      {screen==="bets"&&(
        <>
          <div className="tabs">
            {GAMES.map(g=>(
              <button key={g.id} className={`tab${activeGame===g.id?" on":""}`} onClick={()=>setActiveGame(g.id)}>
                {g.homeflag} {g.home.split(" ")[0]} × {g.away.split(" ")[0]} {g.awayflag}
              </button>
            ))}
          </div>
          <div className="page">
            {(()=>{
              const game=cGame, closed=isGameClosed(game);
              const bet=bets[game.id]||{}, saved=savedGames[game.id];
              const hasBet=bet.homeScore!==undefined&&bet.awayScore!==undefined&&bet.homeScore!==""&&bet.awayScore!=="";
              return(
                <>
                  <div className="game-card">
                    <div className="game-card-bg"><div className="card-glow"/></div>
                    <div className="game-head">
                      <div>
                        <div className="game-lbl">{game.label}</div>
                        <div className="game-venue" style={{marginTop:3}}>{game.venue}</div>
                      </div>
                      {closed
                        ?<div className="badge-closed">🔒 ENCERRADO</div>
                        :<div className="game-venue-wrap"><div className="game-date">{formatDate(game.date)}</div></div>
                      }
                    </div>
                    <div className="matchup">
                      <div className="team"><div className="flag">{game.homeflag}</div><div className="team-nm">{game.home}</div></div>
                      <div className="vs-block"><div className="vs-ln"/><div className="vs-tx">VS</div><div className="vs-ln"/></div>
                      <div className="team"><div className="flag">{game.awayflag}</div><div className="team-nm">{game.away}</div></div>
                    </div>
                    <div className="score-prompt">Seu palpite de placar</div>
                    <div className="score-row">
                      <input className="score-in" type="number" min="0" max="99" placeholder="—"
                        value={bet.homeScore??""} onChange={e=>updateBet(game.id,"homeScore",e.target.value)} disabled={closed}/>
                      <div className="score-sep">×</div>
                      <input className="score-in" type="number" min="0" max="99" placeholder="—"
                        value={bet.awayScore??""} onChange={e=>updateBet(game.id,"awayScore",e.target.value)} disabled={closed}/>
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
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* RANKING */}
      {screen==="ranking"&&(
        <>
          <div className="tabs">
            {GAMES.map(g=>(
              <button key={g.id} className={`tab${rankTab===g.id?" on":""}`} onClick={()=>setRankTab(g.id)}>
                {g.prizeIcon} {g.home.split(" ")[0]} × {g.away.split(" ")[0]}
              </button>
            ))}
          </div>
          {(()=>{
            const game=cRank, ranking=getRanking(game.id);
            const hasResult=results[game.id]?.homeScore!==undefined&&results[game.id]?.homeScore!=="";
            return(
              <>
                <div className="rank-hero" style={{position:"relative"}}>
                  <div className="rank-hero-const">
                    <ConstellationBg width={500} height={120}/>
                  </div>
                  <div className="rank-game-nm">{game.homeflag} {game.home} <span>×</span> {game.away} {game.awayflag}</div>
                  <div className="rank-meta">{game.venue} · {formatDate(game.date)} · Prêmio: {game.prize}</div>
                  {hasResult&&(
                    <div className="result-chip">
                      <div className="result-lbl">Resultado</div>
                      <div className="result-sc">{results[game.id].homeScore} × {results[game.id].awayScore}</div>
                    </div>
                  )}
                  {!hasResult&&isGameClosed(game)&&<div className="rank-pending">AGUARDANDO RESULTADO...</div>}
                </div>
                <div style={{maxWidth:480,margin:"0 auto"}}>
                  {ranking.length===0
                    ?<div className="rank-empty">NENHUMA APOSTA REGISTRADA</div>
                    :<div className="rank-list">
                      {ranking.map((e,i)=>(
                        <div key={e.name} className={`rank-row${e.name===userName?" me":""}`}>
                          <div className={`rank-pos${i===0?" p1":i===1?" p2":i===2?" p3":""}`}>
                            {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                          </div>
                          <div style={{flex:1}}>
                            <div className="rank-nm">{e.name}{e.name===userName&&<span className="rank-me-tag">• você</span>}</div>
                            <div className="rank-bet">Apostou: {e.bet.homeScore} × {e.bet.awayScore}</div>
                          </div>
                          <div>
                            {hasResult&&e.pts!==null
                              ?<><div className="rank-pts">{e.pts}</div><div className="rank-pts-u">PTS</div></>
                              :<div style={{color:"#1a1a1a",fontSize:20,fontFamily:"'Barlow Condensed',sans-serif"}}>—</div>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ADMIN */}
      {screen==="admin"&&(
        <div className="admin-pg">
          {!adminUnlocked?(
            <>
              <div className="admin-ttl">🔐 Admin</div>
              <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",padding:18,maxWidth:300}}>
                <div className="field-label">Senha</div>
                <input className="text-input" type="password" placeholder="••••••"
                  value={adminPass} onChange={e=>setAdminPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
                {adminError&&<div className="err">{adminError}</div>}
                <button className="gold-btn" onClick={handleAdminLogin} style={{marginTop:10}}>Entrar</button>
              </div>
            </>
          ):(
            <>
              <div className="admin-ttl">Painel de Resultados</div>
              <div className="admin-meta">
                <strong>{totalP}</strong> participantes · <strong>{Object.values(allBets).reduce((a,b)=>a+Object.keys(b).length,0)}</strong> apostas
              </div>
              {GAMES.map(game=>{
                const res=results[game.id]||{};
                const count=Object.values(allBets).filter(b=>b[game.id]).length;
                return(
                  <div key={game.id} className="admin-block">
                    <div className="admin-gname">{game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                    <div className="admin-gmeta">{count} APOSTAS · {game.venue}</div>
                    <div className="admin-entry">
                      <div className="admin-tlbl">{game.home}</div>
                      <input className="admin-sin" type="number" min="0" placeholder="—"
                        value={res.homeScore??""} onChange={e=>updateResult(game.id,"homeScore",e.target.value)}/>
                      <div className="admin-dash">×</div>
                      <input className="admin-sin" type="number" min="0" placeholder="—"
                        value={res.awayScore??""} onChange={e=>updateResult(game.id,"awayScore",e.target.value)}/>
                      <div className="admin-tlbl r">{game.away}</div>
                    </div>
                    <button className={`admin-sv${savedGames[`r_${game.id}`]?" saved":""}`} onClick={()=>handleSaveResult(game.id)}>
                      {savedGames[`r_${game.id}`]?"✓ Publicado":"Publicar resultado"}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
