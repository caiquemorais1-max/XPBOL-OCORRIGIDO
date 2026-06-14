import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCj22pVl39ZXq4yhPjX63xn3cDbYEUVOBc",
  authDomain: "bolao-xp2026.firebaseapp.com",
  projectId: "bolao-xp2026",
  storageBucket: "bolao-xp2026.firebasestorage.app",
  messagingSenderId: "852688248331",
  appId: "1:852688248331:web:30dcaf7fdcd019610db10e"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ADMIN_PASSWORD = "XP2026";
const GOLD = "#C8A84B";
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

// ===================== SVG COMPONENTS =====================
function Shield({ w = 120, h = 140, glow = false }) {
  const pts = {
    TL:[20,0],TR:[80,0],SL:[0,18],SR:[100,18],ML:[0,65],MR:[100,65],BOT:[50,115],
    IT:[50,0],IL:[22,38],IR:[78,38],IC:[50,38],IML:[18,72],IMR:[82,72],IBC:[50,80],
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

function QRScreen({ appUrl }) {
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);

  useEffect(() => {
    if (!appUrl) return;
    function tryGen() {
      if (!window.QRCode) return;
      const div = document.createElement("div");
      document.body.appendChild(div);
      try {
        new window.QRCode(div, { text: appUrl, width: 220, height: 220, colorDark: "#C8A84B", colorLight: "#0d0d0d", correctLevel: window.QRCode.CorrectLevel.M });
        setTimeout(() => {
          const canvas = div.querySelector("canvas");
          if (canvas) setQrSrc(canvas.toDataURL());
          document.body.removeChild(div);
        }, 300);
      } catch(e) { document.body.removeChild(div); }
    }
    if (window.QRCode) { tryGen(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = tryGen;
    document.head.appendChild(s);
  }, [appUrl]);

  function copyUrl() {
    navigator.clipboard.writeText(appUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div style={{padding:"24px 14px",maxWidth:400,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:"#fff",letterSpacing:1,marginBottom:4}}>
        Compartilhe o <span style={{color:GOLD}}>Bolão</span>
      </div>
      <div style={{fontSize:12,color:"#3a3a3a",letterSpacing:1,marginBottom:28}}>Escaneie o QR Code ou copie o link</div>
      <div style={{background:"#0a0a0a",border:`1px solid #1e1e1e`,borderTop:`2px solid ${GOLD}`,padding:28,display:"inline-block",marginBottom:20}}>
        {qrSrc
          ? <img src={qrSrc} width={220} height={220} style={{display:"block",imageRendering:"pixelated"}}/>
          : <div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:11,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>GERANDO QR...</div>
        }
      </div>
      <div style={{fontSize:11,color:"#444",letterSpacing:1,wordBreak:"break-all",padding:"10px 14px",background:"#080808",border:"1px solid #141414",marginBottom:16}}>{appUrl}</div>
      <button onClick={copyUrl} style={{background:copied?"#0a180a":GOLD,color:copied?"#3aaa3a":"#0d0d0d",border:copied?"1px solid #143014":"none",padding:"12px 24px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>
        {copied?"✓ Link copiado!":"Copiar link"}
      </button>
      <div style={{fontSize:11,color:"#2a2a2a",marginTop:16,letterSpacing:1}}>Compartilhe no grupo da viagem para todos apostar!</div>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  const [screen, setScreen] = useState(() => localStorage.getItem("bolao_screen") || "login");
  const [userName, setUserName] = useState(() => localStorage.getItem("bolao_user") || "");
  const [nameInput, setNameInput] = useState("");
  const [myBets, setMyBets] = useState({});
  const [allBets, setAllBets] = useState({});
  const [results, setResults] = useState({});
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMap, setSavedMap] = useState({});
  const [activeGame, setActiveGame] = useState("game1");
  const [rankTab, setRankTab] = useState("game1");
  const [adminTab, setAdminTab] = useState("results");
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Set app URL
  useEffect(() => { setAppUrl(window.location.href.split("?")[0]); }, []);

  // Save screen & user to localStorage
  useEffect(() => { if(screen !== "login") localStorage.setItem("bolao_screen", screen); }, [screen]);
  useEffect(() => { if(userName) localStorage.setItem("bolao_user", userName); }, [userName]);

  // If user is already logged in, skip login
  useEffect(() => {
    if (userName && screen === "login") setScreen("bets");
  }, []);

  // Load user's own bets from Firestore
  useEffect(() => {
    if (!userName) { setLoading(false); return; }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "bets", userName));
        if (snap.exists()) setMyBets(snap.data().bets || {});
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, [userName]);

  // Real-time listener for ALL bets
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bets"), (snap) => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data().bets || {}; });
      setAllBets(data);
    });
    return () => unsub();
  }, []);

  // Real-time listener for results
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "results"), (snap) => {
      if (snap.exists()) setResults(snap.data() || {});
    });
    return () => unsub();
  }, []);

  // Real-time listener for games config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "games"), (snap) => {
      if (snap.exists()) setGames(snap.data().list || DEFAULT_GAMES);
    });
    return () => unsub();
  }, []);

  const activeGames = games.filter(g => g.active);

  function handleLogin() {
    const name = nameInput.trim(); if (!name) return;
    setUserName(name);
    setScreen("bets");
  }

  async function handleSaveBet(gameId) {
    if (!myBets[gameId]) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "bets", userName), { bets: myBets }, { merge: true });
      setSavedMap(s => ({...s, [gameId]: true}));
      setTimeout(() => setSavedMap(s => ({...s, [gameId]: false})), 2500);
    } catch(e) { alert("Erro ao salvar. Verifique sua conexão."); }
    setSaving(false);
  }

  function updateBet(gameId, field, val) {
    const v = val.replace(/\D/g,"").slice(0,2);
    setMyBets(b => ({...b, [gameId]: {...(b[gameId]||{}), [field]: v}}));
    setSavedMap(s => ({...s, [gameId]: false}));
  }

  function handleAdminLogin() {
    if (adminPass === ADMIN_PASSWORD) { setAdminUnlocked(true); setAdminError(""); }
    else setAdminError("Senha incorreta");
  }

  async function handleSaveResult(gameId, res) {
    try {
      await setDoc(doc(db, "config", "results"), { [gameId]: res }, { merge: true });
      setSavedMap(s => ({...s, [`r_${gameId}`]: true}));
      setTimeout(() => setSavedMap(s => ({...s, [`r_${gameId}`]: false})), 2000);
    } catch(e) { alert("Erro ao salvar resultado."); }
  }

  async function handleSaveGames(updatedGames) {
    setGames(updatedGames);
    try { await setDoc(doc(db, "config", "games"), { list: updatedGames }); } catch(e) {}
  }

  function updateGamePrize(gameId, field, val) {
    setGames(g => g.map(game => game.id === gameId ? {...game, [field]: val} : game));
  }

  async function saveGamePrizes() {
    try {
      await setDoc(doc(db, "config", "games"), { list: games });
      setSavedMap(s => ({...s, prizes: true}));
      setTimeout(() => setSavedMap(s => ({...s, prizes: false})), 2000);
    } catch(e) {}
  }

  async function toggleGame(gameId) {
    const updated = games.map(g => g.id === gameId ? {...g, active: !g.active} : g);
    await handleSaveGames(updated);
  }

  function getRanking(gameId) {
    const res = results[gameId];
    return Object.entries(allBets)
      .map(([name, bets]) => { const bet = bets[gameId]; if(!bet) return null; return {name, pts: calcPoints(bet, res), bet}; })
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
    .hdiv{width:1px;height:26px;background:#1a1a1a;margin:0 6px;}
    .hwm{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.5px;line-height:1;}
    .hwm em{color:${GOLD};font-style:normal;}
    .hsub{font-size:9px;color:#2a2a2a;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;}
    .nav{display:flex;}
    .nb{background:none;border:none;color:#2e2e2e;padding:6px 9px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s;}
    .nb.on{color:${GOLD};border-bottom-color:${GOLD};}
    .nb:hover{color:#666;}
    .tabs{display:flex;background:#0a0a0a;border-bottom:1px solid #141414;overflow-x:auto;padding:0 12px;scrollbar-width:none;}
    .tabs::-webkit-scrollbar{display:none;}
    .tab{flex:0 0 auto;padding:13px 12px 11px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#2a2a2a;text-transform:uppercase;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;}
    .tab.on{color:${GOLD};border-bottom-color:${GOLD};}
    .page{padding:14px;max-width:480px;margin:0 auto;}
    .gc{background:linear-gradient(145deg,#0f0f0f,#0a0a0a);border:1px solid #1a1a1a;border-top:2px solid ${GOLD};padding:18px;margin-bottom:12px;position:relative;overflow:hidden;}
    .gcg{position:absolute;top:-30px;right:-30px;width:200px;height:200px;background:radial-gradient(circle,rgba(200,168,75,.06),transparent 70%);pointer-events:none;}
    .glbl{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:800;letter-spacing:4px;color:${GOLD};}
    .gven{font-size:10px;color:#2a2a2a;margin-top:3px;}
    .gdate{font-size:10px;color:#222;margin-top:2px;}
    .bclosed{background:#140808;border:1px solid #2a1010;color:#883333;font-size:9px;font-weight:800;letter-spacing:2px;padding:4px 8px;}
    .mu{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .team{text-align:center;flex:1;}
    .flag{font-size:38px;line-height:1;margin-bottom:7px;}
    .tnm{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#aaa;letter-spacing:.5px;text-transform:uppercase;}
    .vsb{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;}
    .vsl{width:1px;height:18px;background:#1a1a1a;}
    .vst{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;color:#1e1e1e;letter-spacing:2px;}
    .sp{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:300;letter-spacing:4px;color:#2a2a2a;text-transform:uppercase;text-align:center;margin-bottom:10px;}
    .sr{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;}
    .si{width:70px;height:70px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:38px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;transition:border .15s;-moz-appearance:textfield;border-radius:0;}
    .si::-webkit-outer-spin-button,.si::-webkit-inner-spin-button{-webkit-appearance:none;}
    .si:focus{border-color:${GOLD};box-shadow:0 0 0 2px rgba(200,168,75,.08);}
    .si:disabled{opacity:.25;cursor:not-allowed;}
    .ssep{font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;color:#1a1a1a;}
    .pr{display:flex;align-items:center;gap:10px;border-top:1px solid #141414;padding-top:14px;margin-bottom:14px;}
    .pi{width:34px;height:34px;background:#080808;border:1px solid #1e1e1e;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
    .pl{font-size:9px;color:#333;letter-spacing:2px;text-transform:uppercase;font-weight:700;}
    .pn{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:${GOLD};line-height:1;margin-top:1px;}
    .ab{width:100%;background:${GOLD};color:#0d0d0d;border:none;padding:14px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:filter .15s;border-radius:0;}
    .ab:hover:not(:disabled){filter:brightness(1.1);}
    .ab:disabled{background:#111;color:#222;cursor:not-allowed;}
    .ab.saved{background:#0a180a;color:#3aaa3a;border:1px solid #143014;}
    .ab.ghost{background:#0a0a0a;color:#333;border:1px solid #141414;cursor:default;font-size:12px;letter-spacing:1px;}
    .pb{background:#080808;border:1px solid #141414;}
    .phd{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#2a2a2a;text-transform:uppercase;padding:10px 14px 6px;border-bottom:1px solid #0f0f0f;}
    .pr2{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #0f0f0f;}
    .pr2:last-child{border-bottom:none;}
    .pd{font-size:12px;color:#333;}
    .pv{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:${GOLD};}
    .rh{background:linear-gradient(180deg,#0f0c00,#0a0a0a);border-bottom:1px solid #141414;padding:14px;position:relative;overflow:hidden;}
    .rgn{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:#fff;letter-spacing:.5px;text-transform:uppercase;position:relative;z-index:1;}
    .rgn span{color:${GOLD};}
    .rm{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-top:3px;position:relative;z-index:1;}
    .rc{display:inline-flex;align-items:center;gap:10px;background:#0d0b00;border:1px solid #2a2000;padding:6px 12px;margin-top:10px;position:relative;z-index:1;}
    .rl{font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;font-family:'Barlow Condensed',sans-serif;}
    .rs{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:${GOLD};}
    .rrow{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #0d0d0d;}
    .rrow:last-child{border-bottom:none;}
    .rrow.me{background:#0c0a00;border-left:2px solid ${GOLD};}
    .rpos{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#1e1e1e;width:26px;text-align:center;flex-shrink:0;}
    .rpos.p1{color:#FFD700;}.rpos.p2{color:#B0B0B0;}.rpos.p3{color:#A07040;}
    .rnm{font-size:13px;font-weight:600;color:#bbb;flex:1;}
    .rmt{font-size:9px;color:${GOLD};margin-left:5px;font-weight:700;letter-spacing:1px;}
    .rbet{font-size:10px;color:#222;margin-top:2px;}
    .rpts{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:${GOLD};text-align:right;line-height:1;}
    .rptu{font-size:8px;color:#2a2a2a;letter-spacing:2px;text-transform:uppercase;text-align:right;}
    .rempty{padding:40px 14px;text-align:center;font-size:11px;color:#222;letter-spacing:3px;}
    .adpg{max-width:480px;margin:0 auto;padding:16px 14px;}
    .adttl{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:${GOLD};letter-spacing:1px;margin-bottom:4px;}
    .admet{font-size:11px;color:#2a2a2a;letter-spacing:1px;margin-bottom:16px;}
    .admet strong{color:#444;}
    .adtabs{display:flex;gap:0;border-bottom:1px solid #1a1a1a;margin-bottom:16px;}
    .adtab{background:none;border:none;color:#2a2a2a;padding:10px 14px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;}
    .adtab.on{color:${GOLD};border-bottom-color:${GOLD};}
    .adbl{background:#0d0d0d;border:1px solid #1a1a1a;border-top:2px solid ${GOLD_DIM};padding:14px;margin-bottom:12px;}
    .adgn{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:#ddd;margin-bottom:4px;}
    .adgm{font-size:10px;color:#2a2a2a;letter-spacing:1px;margin-bottom:12px;}
    .aden{display:flex;align-items:center;gap:8px;}
    .adtl{font-size:11px;color:#444;flex:1;}
    .adtl.r{text-align:right;}
    .adin{width:50px;height:46px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:24px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;border-radius:0;-moz-appearance:textfield;}
    .adin::-webkit-outer-spin-button,.adin::-webkit-inner-spin-button{-webkit-appearance:none;}
    .adin:focus{border-color:${GOLD};}
    .addash{color:#1e1e1e;font-size:22px;font-weight:900;font-family:'Barlow Condensed',sans-serif;}
    .adsv{background:${GOLD};color:#0d0d0d;border:none;padding:9px 18px;margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;letter-spacing:2px;cursor:pointer;border-radius:0;}
    .adsv:hover{filter:brightness(1.1);}
    .adsv.saved{background:#0a180a;color:#3aaa3a;}
    .per{display:flex;gap:8px;align-items:center;margin-bottom:8px;}
    .pei{width:44px;height:44px;background:#080808;border:1px solid #1e1e1e;color:#fff;font-size:22px;text-align:center;outline:none;font-family:'Barlow',sans-serif;}
    .pet{flex:1;background:#080808;border:1px solid #1e1e1e;color:#fff;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;outline:none;}
    .pei:focus,.pet:focus{border-color:${GOLD};}
    .trow{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#0d0d0d;border:1px solid #1a1a1a;margin-bottom:8px;}
    .tinf{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:#ccc;}
    .tinf small{display:block;font-size:10px;color:#333;font-family:'Barlow',sans-serif;font-weight:400;letter-spacing:1px;margin-top:2px;}
    .tbtn{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
    .tbtn.on{background:${GOLD};}.tbtn.off{background:#222;}
    .tknob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;}
    .tbtn.on .tknob{left:23px;}.tbtn.off .tknob{left:3px;}
    .fl{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#3a3a3a;text-transform:uppercase;margin-bottom:8px;}
    .ti{width:100%;background:#0a0a0a;border:1px solid #222;color:#fff;padding:14px 16px;font-family:'Barlow',sans-serif;font-size:15px;outline:none;transition:border .2s;border-radius:0;}
    .ti:focus{border-color:${GOLD};}
    .ti::placeholder{color:#2a2a2a;}
    .gb{width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;border:none;padding:15px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;}
    .gb:hover:not(:disabled){filter:brightness(1.08);}
    .gb:disabled{background:#181818;color:#2a2a2a;cursor:not-allowed;}
    .err{color:#883333;font-size:12px;margin-top:8px;letter-spacing:1px;}
    /* Admin bets table */
    .bets-table{width:100%;border-collapse:collapse;margin-top:10px;}
    .bets-table th{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:#555;text-transform:uppercase;padding:6px 10px;border-bottom:1px solid #1a1a1a;text-align:left;}
    .bets-table td{font-size:12px;color:#888;padding:7px 10px;border-bottom:1px solid #0f0f0f;}
    .bets-table tr:last-child td{border-bottom:none;}
    .bets-table td.score{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:${GOLD};}
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
          <XPBox size={56}/><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:.9,textTransform:"uppercase"}}>Insurance<br/>Experience</div><Shield w={70} h={80} glow/>
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:900,fontStyle:"italic",color:GOLD,letterSpacing:4,marginBottom:8}}>2026</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:5,color:"#2e2e2e",textTransform:"uppercase",marginBottom:32}}>Bolão Oficial</div>
        <div style={{width:240,height:1,background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,opacity:.35,marginBottom:32}}/>
        <div style={{width:"100%",maxWidth:300}}>
          <div className="fl">Seu nome</div>
          <input className="ti" placeholder="Como aparecer no ranking" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
          <button className="gb" onClick={handleLogin} disabled={!nameInput.trim()}>Entrar no bolão</button>
        </div>
        <div style={{marginTop:24,fontSize:10,color:"#222",textAlign:"center",letterSpacing:3,fontFamily:"'Barlow Condensed',sans-serif"}}>
          {totalP>0?<><span style={{color:GOLD_DIM,fontWeight:700}}>{totalP}</span> PARTICIPANTE{totalP>1?"S":""} JÁ APOSTARAM</>:"SEJA O PRIMEIRO A APOSTAR"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d"}}>
      <style>{css}</style>
      <div className="header">
        <div className="header-brand">
          <XPBox size={28}/><div className="hdiv"/><Shield w={22} h={25}/>
          <div style={{marginLeft:6}}>
            <div className="hwm">Insurance <em>Experience</em></div>
            <div className="hsub">2026 · Copa do Mundo · {userName && <span style={{color:GOLD_DIM}}>Olá, {userName.split(" ")[0]}!</span>}</div>
          </div>
        </div>
        <div className="nav">
          {[["bets","Apostas"],["ranking","Ranking"],["qr","QR"],["admin","Admin"]].map(([s,l])=>(
            <button key={s} className={`nb${screen===s?" on":""}`} onClick={()=>setScreen(s)}>{l}</button>
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
          {cGame&&(()=>{
            const game=cGame, closed=isGameClosed(game);
            const bet=myBets[game.id]||{}, saved=savedMap[game.id];
            const hasBet=bet.homeScore!==undefined&&bet.awayScore!==undefined&&bet.homeScore!==""&&bet.awayScore!=="";
            return(
              <div className="page">
                <div className="gc">
                  <div className="gcg"/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div><div className="glbl">{game.label}</div><div className="gven">{game.venue}</div></div>
                    {closed?<div className="bclosed">🔒 ENCERRADO</div>:<div className="gdate">{formatDate(game.date)}</div>}
                  </div>
                  <div className="mu">
                    <div className="team"><div className="flag">{game.homeflag}</div><div className="tnm">{game.home}</div></div>
                    <div className="vsb"><div className="vsl"/><div className="vst">VS</div><div className="vsl"/></div>
                    <div className="team"><div className="flag">{game.awayflag}</div><div className="tnm">{game.away}</div></div>
                  </div>
                  <div className="sp">Seu palpite de placar</div>
                  <div className="sr">
                    <input className="si" type="number" min="0" max="99" placeholder="—" value={bet.homeScore??""} onChange={e=>updateBet(game.id,"homeScore",e.target.value)} disabled={closed}/>
                    <div className="ssep">×</div>
                    <input className="si" type="number" min="0" max="99" placeholder="—" value={bet.awayScore??""} onChange={e=>updateBet(game.id,"awayScore",e.target.value)} disabled={closed}/>
                  </div>
                  <div className="pr">
                    <div className="pi">{game.prizeIcon}</div>
                    <div><div className="pl">Prêmio deste jogo</div><div className="pn">{game.prize}</div></div>
                  </div>
                  {!closed
                    ?<button className={`ab${saved?" saved":""}`} onClick={()=>handleSaveBet(game.id)} disabled={!hasBet||saving}>
                      {saving?"Salvando...":saved?"✓ Aposta registrada!":hasBet?"Confirmar aposta":"Digite o placar para apostar"}
                    </button>
                    :<div className="ab ghost">{hasBet?`Sua aposta: ${bet.homeScore} × ${bet.awayScore}`:"Você não apostou neste jogo"}</div>
                  }
                </div>
                <div className="pb">
                  <div className="phd">Sistema de Pontuação</div>
                  {[["Placar exato","3 pts"],["Vencedor / empate","1 pt"],["Total de gols correto","+1 pt"],["Máximo por jogo","5 pts"]].map(([d,v])=>(
                    <div key={d} className="pr2"><span className="pd">{d}</span><span className="pv">{v}</span></div>
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
            const res=results[game.id]||{};
            const hasResult=res.homeScore!==undefined&&res.homeScore!=="";
            return(
              <>
                <div className="rh">
                  <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.6}}><ConstellationBg width={500} height={120}/></div>
                  <div className="rgn">{game.homeflag} {game.home} <span>×</span> {game.away} {game.awayflag}</div>
                  <div className="rm">{game.venue} · {formatDate(game.date)} · Prêmio: {game.prizeIcon} {game.prize}</div>
                  {hasResult&&<div className="rc"><div className="rl">Resultado</div><div className="rs">{res.homeScore} × {res.awayScore}</div></div>}
                  {!hasResult&&isGameClosed(game)&&<div style={{fontSize:10,color:"#2a2a2a",letterSpacing:2,marginTop:10,position:"relative",zIndex:1}}>AGUARDANDO RESULTADO...</div>}
                </div>
                <div style={{maxWidth:480,margin:"0 auto"}}>
                  {ranking.length===0
                    ?<div className="rempty">NENHUMA APOSTA REGISTRADA</div>
                    :ranking.map((e,i)=>(
                      <div key={e.name} className={`rrow${e.name===userName?" me":""}`}>
                        <div className={`rpos${i===0?" p1":i===1?" p2":i===2?" p3":""}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                        <div style={{flex:1}}>
                          <div className="rnm">{e.name}{e.name===userName&&<span className="rmt">• você</span>}</div>
                          <div className="rbet">Apostou: {e.bet.homeScore} × {e.bet.awayScore}</div>
                        </div>
                        <div>
                          {hasResult&&e.pts!==null?<><div className="rpts">{e.pts}</div><div className="rptu">PTS</div></>:<div style={{color:"#1a1a1a",fontSize:20,fontFamily:"'Barlow Condensed',sans-serif"}}>—</div>}
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

      {/* QR */}
      {screen==="qr"&&<QRScreen appUrl={appUrl}/>}

      {/* ADMIN */}
      {screen==="admin"&&(
        <div className="adpg">
          {!adminUnlocked?(
            <>
              <div className="adttl">🔐 Admin</div>
              <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",padding:18,maxWidth:300}}>
                <div className="fl">Senha</div>
                <input className="ti" type="password" placeholder="••••••" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
                {adminError&&<div className="err">{adminError}</div>}
                <button className="gb" onClick={handleAdminLogin} style={{marginTop:10}}>Entrar</button>
              </div>
            </>
          ):(
            <>
              <div className="adttl">Painel Admin</div>
              <div className="admet"><strong>{totalP}</strong> participantes · <strong>{Object.values(allBets).reduce((a,b)=>a+Object.keys(b).length,0)}</strong> apostas</div>
              <div className="adtabs">
                {[["results","Resultados"],["bets","Apostas"],["prizes","Prêmios"],["games","Jogos"]].map(([t,l])=>(
                  <button key={t} className={`adtab${adminTab===t?" on":""}`} onClick={()=>setAdminTab(t)}>{l}</button>
                ))}
              </div>

              {/* RESULTADOS */}
              {adminTab==="results"&&activeGames.map(game=>{
                const res=results[game.id]||{};
                const count=Object.values(allBets).filter(b=>b[game.id]).length;
                return(
                  <div key={game.id} className="adbl">
                    <div className="adgn">{game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                    <div className="adgm">{count} APOSTAS · {game.venue}</div>
                    <div className="aden">
                      <div className="adtl">{game.home}</div>
                      <input className="adin" type="number" min="0" placeholder="—"
                        value={res.homeScore??""} onChange={e=>setResults(r=>({...r,[game.id]:{...(r[game.id]||{}),"homeScore":e.target.value.replace(/\D/g,"").slice(0,2)}}))}/>
                      <div className="addash">×</div>
                      <input className="adin" type="number" min="0" placeholder="—"
                        value={res.awayScore??""} onChange={e=>setResults(r=>({...r,[game.id]:{...(r[game.id]||{}),"awayScore":e.target.value.replace(/\D/g,"").slice(0,2)}}))}/>
                      <div className="adtl r">{game.away}</div>
                    </div>
                    <button className={`adsv${savedMap[`r_${game.id}`]?" saved":""}`}
                      onClick={()=>handleSaveResult(game.id, results[game.id]||{})}>
                      {savedMap[`r_${game.id}`]?"✓ Publicado":"Publicar resultado"}
                    </button>
                  </div>
                );
              })}

              {/* TODAS AS APOSTAS */}
              {adminTab==="bets"&&activeGames.map(game=>{
                const count=Object.values(allBets).filter(b=>b[game.id]).length;
                return(
                  <div key={game.id} className="adbl">
                    <div className="adgn">{game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                    <div className="adgm">{count} APOSTAS · {game.prizeIcon} {game.prize}</div>
                    {count===0
                      ?<div style={{fontSize:11,color:"#333",letterSpacing:1}}>Nenhuma aposta ainda</div>
                      :<table className="bets-table">
                        <thead><tr><th>Participante</th><th>Palpite</th><th>Pts</th></tr></thead>
                        <tbody>
                          {Object.entries(allBets)
                            .filter(([,b])=>b[game.id])
                            .sort((a,b)=>{
                              const pa=calcPoints(a[1][game.id],results[game.id]);
                              const pb=calcPoints(b[1][game.id],results[game.id]);
                              if(pa===null&&pb===null) return 0;
                              if(pa===null) return 1; if(pb===null) return -1;
                              return pb-pa;
                            })
                            .map(([name,bets])=>{
                              const bet=bets[game.id];
                              const pts=calcPoints(bet,results[game.id]);
                              return(
                                <tr key={name}>
                                  <td>{name}</td>
                                  <td className="score">{bet.homeScore} × {bet.awayScore}</td>
                                  <td className="score">{pts!==null?pts:"—"}</td>
                                </tr>
                              );
                            })
                          }
                        </tbody>
                      </table>
                    }
                  </div>
                );
              })}

              {/* PRÊMIOS */}
              {adminTab==="prizes"&&(
                <>
                  {games.map(game=>(
                    <div key={game.id} className="adbl">
                      <div className="adgn">{game.label} — {game.homeflag} {game.home} × {game.away}</div>
                      <div className="per">
                        <input className="pei" value={game.prizeIcon} onChange={e=>updateGamePrize(game.id,"prizeIcon",e.target.value)} maxLength={2}/>
                        <input className="pet" value={game.prize} onChange={e=>updateGamePrize(game.id,"prize",e.target.value)} placeholder="Nome do prêmio"/>
                      </div>
                    </div>
                  ))}
                  <button className={`adsv${savedMap.prizes?" saved":""}`} style={{width:"100%",padding:14,fontSize:15}} onClick={saveGamePrizes}>
                    {savedMap.prizes?"✓ Prêmios salvos!":"Salvar todos os prêmios"}
                  </button>
                </>
              )}

              {/* JOGOS */}
              {adminTab==="games"&&(
                <>
                  <div style={{fontSize:11,color:"#333",letterSpacing:1,marginBottom:12}}>ATIVE OU DESATIVE JOGOS DO BOLÃO</div>
                  {games.map(game=>(
                    <div key={game.id} className="trow">
                      <div className="tinf">
                        {game.homeflag} {game.home} × {game.away} {game.awayflag}
                        <small>{game.label} · {game.prizeIcon} {game.prize}</small>
                      </div>
                      <button className={`tbtn${game.active?" on":" off"}`} onClick={()=>toggleGame(game.id)}>
                        <div className="tknob"/>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
