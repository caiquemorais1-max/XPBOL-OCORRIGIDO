import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";

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
const GOLD2 = "#E2C060";
const GOLD_DIM = "#7A6520";
const DARK = "#0d0d0d";

const DEFAULT_GAMES = [
  { id:"game1", home:"Argentina", away:"Argélia", homeflag:"🇦🇷", awayflag:"🇩🇿", homeabbr:"ARG", awayabbr:"ALG", date:"2026-06-16T15:00:00", label:"JOGO 1", prize:"Apple Watch", prizeIcon:"⌚", venue:"Estádio Azteca", active:true },
  { id:"game2", home:"Uzbequistão", away:"Colômbia", homeflag:"🇺🇿", awayflag:"🇨🇴", homeabbr:"UZB", awayabbr:"COL", date:"2026-06-18T19:00:00", label:"JOGO 2", prize:"AirPods", prizeIcon:"🎧", venue:"No Estádio (ao vivo!)", active:true },
  { id:"game3", home:"Brasil", away:"Haiti", homeflag:"🇧🇷", awayflag:"🇭🇹", homeabbr:"BRA", awayabbr:"HAI", date:"2026-06-21T17:00:00", label:"JOGO 3", prize:"A definir", prizeIcon:"🏆", venue:"Xcaret", active:true },
];

function calcPoints(bet, result) {
  if (!result || result.homeScore==="" || result.awayScore==="" || result.homeScore===undefined) return null;
  const bH=parseInt(bet.homeScore), bA=parseInt(bet.awayScore);
  const rH=parseInt(result.homeScore), rA=parseInt(result.awayScore);
  if (isNaN(bH)||isNaN(bA)) return null;
  let pts=0;
  const bW=bH>bA?"h":bH<bA?"a":"d", rW=rH>rA?"h":rH<rA?"a":"d";
  if (bH===rH&&bA===rA) pts+=3; else if (bW===rW) pts+=1;
  if (bH+bA===rH+rA) pts+=1;
  return pts;
}

function isGameClosed(g) { return new Date()>=new Date(g.date); }
function fmtDate(d) { return new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }

// ============ SVG ============
function Shield({ w=120, h=140, glow=false, opacity=1 }) {
  const p = { TL:[20,0],TR:[80,0],SL:[0,18],SR:[100,18],ML:[0,65],MR:[100,65],BOT:[50,115],IT:[50,0],IL:[22,38],IR:[78,38],IC:[50,38],IML:[18,72],IMR:[82,72],IBC:[50,80] };
  const lines = [[p.TL,p.IT],[p.IT,p.TR],[p.TL,p.SL],[p.TR,p.SR],[p.TL,p.IL],[p.TR,p.IR],[p.IT,p.IC],[p.SL,p.IL],[p.SR,p.IR],[p.IL,p.IC],[p.IC,p.IR],[p.IL,p.IR],[p.SL,p.IC],[p.SR,p.IC],[p.IL,p.IML],[p.IR,p.IMR],[p.IC,p.IML],[p.IC,p.IMR],[p.ML,p.IML],[p.MR,p.IMR],[p.IML,p.IBC],[p.IBC,p.IMR],[p.IML,p.IMR],[p.IML,p.BOT],[p.IMR,p.BOT],[p.IBC,p.BOT],[p.ML,p.BOT],[p.MR,p.BOT]];
  const nodes = [p.TL,p.TR,p.IT,p.SL,p.SR,p.IL,p.IR,p.IC,p.ML,p.MR,p.IML,p.IMR,p.IBC,p.BOT];
  const sx=w/100, sy=h/115, sc=([x,y])=>[x*sx,y*sy];
  const id = `sg${w}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{display:"block",opacity}}>
      {glow&&<defs><filter id={id}><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>}
      <path d={`M ${sc(p.TL)} L ${sc(p.IT)} L ${sc(p.TR)} L ${sc(p.SR)} L ${sc(p.MR)} L ${sc(p.BOT)} L ${sc(p.ML)} L ${sc(p.SL)} Z`} stroke={GOLD} strokeWidth={w>80?"2":"1.2"} fill="none" filter={glow?`url(#${id})`:undefined}/>
      {lines.map(([a,b],i)=>{const[ax,ay]=sc(a),[bx,by]=sc(b);return<line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={GOLD} strokeWidth={w>80?"1":"0.6"} opacity="0.65"/>;})}
      {nodes.map(([x,y],i)=>{const[sx2,sy2]=sc([x,y]);return<circle key={i} cx={sx2} cy={sy2} r={w>80?"2.5":"1.5"} fill={GOLD} opacity="0.9"/>;})
      }
    </svg>
  );
}

function XPBox({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <rect width="88" height="88" rx="16" fill="white"/>
      <text x="44" y="60" textAnchor="middle" fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="44" fontWeight="900" fill="#0d0d0d" letterSpacing="-2">XP</text>
    </svg>
  );
}

function Stars({ width=600, height=400 }) {
  const pts = [[0.08,0.12],[0.15,0.45],[0.22,0.78],[0.32,0.25],[0.38,0.62],[0.48,0.08],[0.52,0.88],[0.58,0.35],[0.65,0.72],[0.72,0.18],[0.78,0.55],[0.85,0.82],[0.92,0.30],[0.96,0.65],[0.28,0.92],[0.44,0.48],[0.60,0.14]];
  const scaled = pts.map(([x,y])=>[x*width,y*height]);
  const links = [];
  for(let i=0;i<scaled.length;i++) for(let j=i+1;j<scaled.length;j++){
    const dx=scaled[i][0]-scaled[j][0],dy=scaled[i][1]-scaled[j][1],d=Math.sqrt(dx*dx+dy*dy);
    if(d<width*0.25) links.push([i,j,d]);
  }
  return (
    <svg width={width} height={height} style={{position:"absolute",inset:0,pointerEvents:"none"}} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
      {links.map(([i,j,d],k)=><line key={k} x1={scaled[i][0]} y1={scaled[i][1]} x2={scaled[j][0]} y2={scaled[j][1]} stroke={GOLD} strokeWidth="0.5" opacity={Math.max(0.03,0.15-d/(width*2))}/>)}
      {scaled.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2" fill={GOLD} opacity="0.3"/>)}
    </svg>
  );
}

function QRScreen({ appUrl }) {
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);
  useEffect(()=>{
    if(!appUrl) return;
    function gen(){
      if(!window.QRCode) return;
      const div=document.createElement("div");
      document.body.appendChild(div);
      try{
        new window.QRCode(div,{text:appUrl,width:220,height:220,colorDark:"#C8A84B",colorLight:"#0d0d0d",correctLevel:window.QRCode.CorrectLevel.M});
        setTimeout(()=>{const c=div.querySelector("canvas");if(c)setQrSrc(c.toDataURL());document.body.removeChild(div);},300);
      }catch(e){document.body.removeChild(div);}
    }
    if(window.QRCode){gen();return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload=gen; document.head.appendChild(s);
  },[appUrl]);
  function copy(){navigator.clipboard.writeText(appUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}
  return(
    <div style={{padding:"32px 20px",maxWidth:420,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,color:"#fff",letterSpacing:1,marginBottom:4}}>
        Compartilhe o <span style={{color:GOLD}}>Bolão</span>
      </div>
      <div style={{fontSize:12,color:"#3a3a3a",letterSpacing:2,marginBottom:28,textTransform:"uppercase"}}>Escaneie ou copie o link</div>
      <div style={{background:"#080808",border:`1px solid #1e1e1e`,borderTop:`2px solid ${GOLD}`,padding:28,display:"inline-block",marginBottom:20}}>
        {qrSrc?<img src={qrSrc} width={220} height={220} style={{display:"block"}}/>
          :<div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:11,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>GERANDO...</div>}
      </div>
      <div style={{fontSize:11,color:"#333",letterSpacing:1,wordBreak:"break-all",padding:"10px 14px",background:"#080808",border:"1px solid #141414",marginBottom:16}}>{appUrl}</div>
      <button onClick={copy} style={{background:copied?"#0a180a":GOLD,color:copied?"#3aaa3a":"#0d0d0d",border:copied?"1px solid #143014":"none",padding:"13px 28px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>
        {copied?"✓ COPIADO!":"COPIAR LINK"}
      </button>
      <div style={{fontSize:11,color:"#222",marginTop:16,letterSpacing:1}}>Compartilhe no grupo da viagem!</div>
    </div>
  );
}

// ============ APP ============
export default function App() {
  const [screen, setScreen] = useState(()=>localStorage.getItem("xp_screen")||"login");
  const [userName, setUserName] = useState(()=>localStorage.getItem("xp_user")||"");
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(()=>{ setAppUrl(window.location.href.split("?")[0]); },[]);
  useEffect(()=>{ if(screen!=="login") localStorage.setItem("xp_screen",screen); },[screen]);
  useEffect(()=>{ if(userName) localStorage.setItem("xp_user",userName); },[userName]);
  useEffect(()=>{ if(userName&&screen==="login") setScreen("bets"); },[]);

  // Firebase real-time listeners
  useEffect(()=>{
    if(!userName) return;
    const unsub = onSnapshot(doc(db,"bets",userName),(snap)=>{
      if(snap.exists()) setMyBets(snap.data().bets||{});
    });
    return ()=>unsub();
  },[userName]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"bets"),(snap)=>{
      const data={};
      snap.forEach(d=>{ data[d.id]=d.data().bets||{}; });
      setAllBets(data);
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(doc(db,"config","results"),(snap)=>{
      if(snap.exists()) setResults(snap.data()||{});
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(doc(db,"config","games"),(snap)=>{
      if(snap.exists()) setGames(snap.data().list||DEFAULT_GAMES);
    });
    return ()=>unsub();
  },[]);

  const activeGames = games.filter(g=>g.active);
  const totalP = Object.keys(allBets).length;

  function handleLogin() {
    const name=nameInput.trim(); if(!name) return;
    setUserName(name); setScreen("bets");
  }

  async function handleSaveBet(gameId) {
    if(!myBets[gameId]) return;
    setSaving(true);
    try {
      await setDoc(doc(db,"bets",userName),{bets:myBets},{merge:true});
      setSavedMap(s=>({...s,[gameId]:true}));
      setTimeout(()=>setSavedMap(s=>({...s,[gameId]:false})),2500);
    } catch(e) { alert("Erro ao salvar."); }
    setSaving(false);
  }

  function updateBet(gameId,field,val) {
    const v=val.replace(/\D/g,"").slice(0,2);
    setMyBets(b=>({...b,[gameId]:{...(b[gameId]||{}),[field]:v}}));
    setSavedMap(s=>({...s,[gameId]:false}));
  }

  function handleAdminLogin() {
    if(adminPass===ADMIN_PASSWORD){setAdminUnlocked(true);setAdminError("");}
    else setAdminError("Senha incorreta");
  }

  async function handleSaveResult(gameId) {
    try {
      await setDoc(doc(db,"config","results"),{[gameId]:results[gameId]||{}},{merge:true});
      setSavedMap(s=>({...s,[`r_${gameId}`]:true}));
      setTimeout(()=>setSavedMap(s=>({...s,[`r_${gameId}`]:false})),2000);
    } catch(e) { alert("Erro ao salvar resultado."); }
  }

  async function handleDeleteBet(participantName) {
    try {
      await deleteDoc(doc(db,"bets",participantName));
      setDeleteConfirm(null);
    } catch(e) { alert("Erro ao excluir aposta."); }
  }

  async function handleSaveGames(updated) {
    setGames(updated);
    try { await setDoc(doc(db,"config","games"),{list:updated}); } catch(e) {}
  }

  function updateGameField(gameId,field,val) {
    setGames(g=>g.map(game=>game.id===gameId?{...game,[field]:val}:game));
  }

  async function saveGamePrizes() {
    try {
      await setDoc(doc(db,"config","games"),{list:games});
      setSavedMap(s=>({...s,prizes:true}));
      setTimeout(()=>setSavedMap(s=>({...s,prizes:false})),2000);
    } catch(e) {}
  }

  function getRanking(gameId) {
    const res=results[gameId];
    return Object.entries(allBets)
      .map(([name,bets])=>{const bet=bets[gameId];if(!bet)return null;return{name,pts:calcPoints(bet,res),bet};})
      .filter(Boolean)
      .sort((a,b)=>{if(a.pts===null&&b.pts===null)return 0;if(a.pts===null)return 1;if(b.pts===null)return -1;return b.pts-a.pts;});
  }

  const cGame = activeGames.find(g=>g.id===activeGame)||activeGames[0];
  const cRank = activeGames.find(g=>g.id===rankTab)||activeGames[0];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:${DARK};color:#fff;font-family:'Barlow',sans-serif;min-height:100vh;}
    input[type=number]{-moz-appearance:textfield;}
    input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}

    /* LOGIN */
    .login-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;position:relative;overflow:hidden;background:radial-gradient(ellipse 120% 80% at 65% 50%,#1c1400 0%,${DARK} 60%);}
    .login-eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:300;letter-spacing:6px;color:#444;text-transform:uppercase;margin-bottom:32px;text-align:center;}
    .login-brand{display:flex;align-items:center;gap:20px;margin-bottom:10px;position:relative;z-index:2;}
    .login-wm{font-family:'Barlow Condensed',sans-serif;font-size:64px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:.85;text-transform:uppercase;}
    .login-year{font-family:'Barlow Condensed',sans-serif;font-size:52px;font-weight:900;font-style:italic;color:${GOLD};letter-spacing:4px;text-align:center;margin-bottom:6px;position:relative;z-index:2;}
    .login-sub{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:300;letter-spacing:6px;color:#2a2a2a;text-transform:uppercase;text-align:center;margin-bottom:40px;position:relative;z-index:2;}
    .login-rule{width:280px;height:1px;background:linear-gradient(90deg,transparent,${GOLD},transparent);opacity:.4;margin-bottom:36px;position:relative;z-index:2;}
    .login-form{width:100%;max-width:320px;position:relative;z-index:2;}
    .login-lbl{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;color:#333;text-transform:uppercase;margin-bottom:8px;}
    .login-inp{width:100%;background:#0a0a0a;border:1px solid #1e1e1e;color:#fff;padding:15px 18px;font-family:'Barlow',sans-serif;font-size:16px;outline:none;transition:border .2s;border-radius:0;}
    .login-inp:focus{border-color:${GOLD};}
    .login-inp::placeholder{color:#222;}
    .login-btn{width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;border:none;padding:16px;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;transition:filter .15s;}
    .login-btn:hover:not(:disabled){filter:brightness(1.1);}
    .login-btn:disabled{background:#161616;color:#2a2a2a;cursor:not-allowed;}
    .login-count{margin-top:28px;font-size:10px;color:#222;text-align:center;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;position:relative;z-index:2;}

    /* HEADER */
    .hdr{background:#080808;border-bottom:1px solid #141414;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200;}
    .hbrand{display:flex;align-items:center;gap:8px;}
    .hdiv{width:1px;height:26px;background:#1a1a1a;margin:0 8px;}
    .hwm{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.5px;line-height:1;}
    .hwm em{color:${GOLD};font-style:normal;}
    .hsub{font-size:9px;color:#222;letter-spacing:2px;font-family:'Barlow Condensed',sans-serif;}
    .hnav{display:flex;}
    .hnb{background:none;border:none;color:#2a2a2a;padding:7px 10px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s;}
    .hnb.on{color:${GOLD};border-bottom-color:${GOLD};}
    .hnb:hover{color:#555;}

    /* TABS */
    .tabs{display:flex;background:#080808;border-bottom:1px solid #111;overflow-x:auto;padding:0 14px;scrollbar-width:none;}
    .tabs::-webkit-scrollbar{display:none;}
    .tab{flex:0 0 auto;padding:13px 14px 11px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#252525;text-transform:uppercase;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;}
    .tab.on{color:${GOLD};border-bottom-color:${GOLD};}

    /* PAGE */
    .page{padding:16px;max-width:500px;margin:0 auto;}

    /* GAME CARD */
    .gc{background:linear-gradient(145deg,#0f0f0f,#080808);border:1px solid #181818;border-top:2px solid ${GOLD};padding:20px;margin-bottom:14px;position:relative;overflow:hidden;}
    .gcglow{position:absolute;top:-40px;right:-40px;width:240px;height:240px;background:radial-gradient(circle,rgba(200,168,75,.05),transparent 70%);pointer-events:none;}
    .glbl{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:800;letter-spacing:4px;color:${GOLD};text-transform:uppercase;}
    .gven{font-size:10px;color:#2a2a2a;margin-top:2px;letter-spacing:.5px;}
    .bclosed{background:#140808;border:1px solid #2a1010;color:#7a3030;font-size:9px;font-weight:800;letter-spacing:2px;padding:4px 9px;text-transform:uppercase;}

    /* MATCHUP */
    .mu{display:flex;align-items:center;justify-content:space-between;margin:18px 0;}
    .team{text-align:center;flex:1;}
    .tflag{font-size:52px;line-height:1;margin-bottom:8px;display:block;}
    .tnm{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:#999;letter-spacing:1px;text-transform:uppercase;}
    .vsb{display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 12px;}
    .vsl{width:1px;height:20px;background:#181818;}
    .vst{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;color:#181818;letter-spacing:3px;}

    /* SCORE */
    .sp{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:300;letter-spacing:5px;color:#222;text-transform:uppercase;text-align:center;margin-bottom:10px;}
    .sr{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:18px;}
    .si{width:74px;height:74px;background:#060606;border:1px solid #1a1a1a;color:#fff;font-size:42px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;transition:border .15s,box-shadow .15s;border-radius:0;}
    .si:focus{border-color:${GOLD};box-shadow:0 0 0 3px rgba(200,168,75,.07);}
    .si:disabled{opacity:.2;cursor:not-allowed;}
    .ssep{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;color:#161616;}

    /* PRIZE */
    .prz{display:flex;align-items:center;gap:12px;border-top:1px solid #121212;padding-top:14px;margin-bottom:14px;}
    .przico{width:36px;height:36px;background:#060606;border:1px solid #1a1a1a;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
    .przlbl{font-size:9px;color:#2a2a2a;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;}
    .prznm{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:${GOLD};line-height:1;margin-top:2px;}

    /* BUTTONS */
    .actbtn{width:100%;background:${GOLD};color:#0d0d0d;border:none;padding:14px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:filter .15s;border-radius:0;}
    .actbtn:hover:not(:disabled){filter:brightness(1.1);}
    .actbtn:disabled{background:#0f0f0f;color:#1e1e1e;cursor:not-allowed;}
    .actbtn.saved{background:#081408;color:#2a8a2a;border:1px solid #102010;}
    .actbtn.ghost{background:#080808;color:#2a2a2a;border:1px solid #111;cursor:default;font-size:12px;letter-spacing:2px;}

    /* PTS */
    .ptsbox{background:#060606;border:1px solid #111;}
    .ptshd{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#222;text-transform:uppercase;padding:10px 14px 6px;border-bottom:1px solid #0e0e0e;}
    .ptsr{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #0e0e0e;}
    .ptsr:last-child{border-bottom:none;}
    .ptsd{font-size:12px;color:#2a2a2a;}
    .ptsv{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:${GOLD};}

    /* RANKING */
    .rkhero{background:linear-gradient(180deg,#100d00,#080808);border-bottom:1px solid #111;padding:16px;position:relative;overflow:hidden;}
    .rkgn{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:#fff;text-transform:uppercase;position:relative;z-index:1;}
    .rkgn span{color:${GOLD};}
    .rkmeta{font-size:10px;color:#222;letter-spacing:1px;margin-top:4px;position:relative;z-index:1;}
    .rkchip{display:inline-flex;align-items:center;gap:10px;background:#0a0800;border:1px solid #201800;padding:6px 12px;margin-top:10px;position:relative;z-index:1;}
    .rklbl{font-size:9px;color:#444;letter-spacing:2px;text-transform:uppercase;font-family:'Barlow Condensed',sans-serif;}
    .rksc{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:${GOLD};}
    .rkrow{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #0a0a0a;}
    .rkrow:last-child{border-bottom:none;}
    .rkrow.me{background:#0a0800;border-left:2px solid ${GOLD};}
    .rkpos{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#161616;width:28px;text-align:center;flex-shrink:0;}
    .rkpos.p1{color:#FFD700;}.rkpos.p2{color:#A0A0A0;}.rkpos.p3{color:#906030;}
    .rknm{font-size:14px;font-weight:600;color:#aaa;flex:1;}
    .rkmtag{font-size:9px;color:${GOLD};margin-left:6px;font-weight:700;letter-spacing:1px;}
    .rkbet{font-size:10px;color:#1e1e1e;margin-top:2px;}
    .rkpts{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:${GOLD};text-align:right;line-height:1;}
    .rkptu{font-size:8px;color:#222;letter-spacing:2px;text-transform:uppercase;text-align:right;}
    .rkempty{padding:48px 16px;text-align:center;font-size:11px;color:#1a1a1a;letter-spacing:3px;text-transform:uppercase;}

    /* ADMIN */
    .adpg{max-width:500px;margin:0 auto;padding:16px;}
    .adttl{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:${GOLD};letter-spacing:1px;margin-bottom:4px;}
    .admet{font-size:11px;color:#222;letter-spacing:1px;margin-bottom:16px;}
    .admet strong{color:#444;}
    .adtabs{display:flex;border-bottom:1px solid #161616;margin-bottom:16px;}
    .adtab{background:none;border:none;color:#222;padding:10px 12px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s;}
    .adtab.on{color:${GOLD};border-bottom-color:${GOLD};}
    .adbl{background:#0a0a0a;border:1px solid #161616;border-top:2px solid ${GOLD_DIM};padding:16px;margin-bottom:12px;}
    .adgn{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:#ccc;margin-bottom:4px;}
    .adgm{font-size:10px;color:#222;letter-spacing:1px;margin-bottom:12px;}
    .aden{display:flex;align-items:center;gap:8px;}
    .adtl{font-size:11px;color:#333;flex:1;}
    .adtl.r{text-align:right;}
    .adin{width:52px;height:48px;background:#060606;border:1px solid #1a1a1a;color:#fff;font-size:26px;font-weight:900;text-align:center;outline:none;font-family:'Barlow Condensed',sans-serif;border-radius:0;}
    .adin:focus{border-color:${GOLD};}
    .addash{color:#161616;font-size:24px;font-weight:900;font-family:'Barlow Condensed',sans-serif;}
    .adsv{background:${GOLD};color:#0d0d0d;border:none;padding:9px 20px;margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;letter-spacing:2px;cursor:pointer;border-radius:0;transition:filter .15s;}
    .adsv:hover{filter:brightness(1.1);}
    .adsv.saved{background:#081408;color:#2a8a2a;}
    .pei{width:44px;height:44px;background:#060606;border:1px solid #1a1a1a;color:#fff;font-size:22px;text-align:center;outline:none;font-family:'Barlow',sans-serif;}
    .pet{flex:1;background:#060606;border:1px solid #1a1a1a;color:#fff;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;outline:none;}
    .pei:focus,.pet:focus{border-color:${GOLD};}
    .trow{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#0a0a0a;border:1px solid #161616;margin-bottom:8px;}
    .tinf{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:#ccc;}
    .tinf small{display:block;font-size:10px;color:#222;font-family:'Barlow',sans-serif;font-weight:400;letter-spacing:1px;margin-top:2px;}
    .tbtn{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
    .tbtn.on{background:${GOLD};}.tbtn.off{background:#1a1a1a;}
    .tknob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;}
    .tbtn.on .tknob{left:23px;}.tbtn.off .tknob{left:3px;}

    /* BETS TABLE */
    .btable{width:100%;border-collapse:collapse;margin-top:8px;}
    .btable th{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#333;text-transform:uppercase;padding:6px 10px;border-bottom:1px solid #161616;text-align:left;}
    .btable td{font-size:12px;color:#666;padding:8px 10px;border-bottom:1px solid #0a0a0a;vertical-align:middle;}
    .btable td.sc{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:${GOLD};}
    .delbtn{background:none;border:1px solid #2a1010;color:#7a3030;font-size:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;padding:4px 8px;cursor:pointer;transition:all .15s;}
    .delbtn:hover{background:#1a0808;color:#cc4444;border-color:#441414;}

    /* DELETE CONFIRM MODAL */
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
    .modal{background:#0f0f0f;border:1px solid #222;border-top:2px solid #cc4444;padding:24px;max-width:340px;width:100%;text-align:center;}
    .modal-title{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#cc4444;margin-bottom:8px;letter-spacing:1px;}
    .modal-body{font-size:13px;color:#666;margin-bottom:20px;line-height:1.5;}
    .modal-name{color:#fff;font-weight:700;}
    .modal-btns{display:flex;gap:10px;}
    .modal-cancel{flex:1;background:none;border:1px solid #222;color:#444;padding:12px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer;}
    .modal-cancel:hover{border-color:#444;color:#666;}
    .modal-del{flex:1;background:#cc4444;color:#fff;border:none;padding:12px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;cursor:pointer;}
    .modal-del:hover{background:#aa2222;}

    /* FIELD */
    .fl{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;color:#2a2a2a;text-transform:uppercase;margin-bottom:8px;}
    .ti{width:100%;background:#0a0a0a;border:1px solid #1a1a1a;color:#fff;padding:14px 16px;font-family:'Barlow',sans-serif;font-size:15px;outline:none;transition:border .2s;border-radius:0;}
    .ti:focus{border-color:${GOLD};}
    .ti::placeholder{color:#1e1e1e;}
    .gb{width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;border:none;padding:15px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;}
    .gb:disabled{background:#141414;color:#222;cursor:not-allowed;}
    .err{color:#883333;font-size:12px;margin-top:8px;letter-spacing:1px;}
  `;

  // ===== LOGIN =====
  if (screen==="login") return (
    <div className="login-wrap">
      <style>{css}</style>
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}><Stars width={window.innerWidth||800} height={window.innerHeight||600}/></div>
      {/* Big shield right */}
      <div style={{position:"absolute",right:-20,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
        <Shield w={200} h={230} glow opacity={0.9}/>
      </div>
      {/* Ghost shield left */}
      <div style={{position:"absolute",left:-60,top:"30%",pointerEvents:"none"}}>
        <Shield w={140} h={160} opacity={0.08}/>
      </div>

      <div className="login-eyebrow">Copa do Mundo · México · 2026</div>

      <div className="login-brand">
        <XPBox size={64}/>
        <div className="login-wm">Insurance<br/>Experience</div>
        <Shield w={80} h={92} glow/>
      </div>

      <div className="login-year">2026</div>
      <div className="login-sub">Bolão Oficial</div>
      <div className="login-rule"/>

      <div className="login-form">
        <div className="login-lbl">Seu nome</div>
        <input className="login-inp" placeholder="Como aparecer no ranking" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
        <button className="login-btn" onClick={handleLogin} disabled={!nameInput.trim()}>Entrar no bolão</button>
      </div>

      <div className="login-count">
        {totalP>0?<><span style={{color:GOLD_DIM,fontWeight:700}}>{totalP}</span> PARTICIPANTE{totalP>1?"S":""} JÁ APOSTARAM</>:"SEJA O PRIMEIRO A APOSTAR"}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:DARK}}>
      <style>{css}</style>

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm&&(
        <div className="modal-bg">
          <div className="modal">
            <div className="modal-title">Excluir aposta?</div>
            <div className="modal-body">Tem certeza que quer excluir todas as apostas de <span className="modal-name">{deleteConfirm}</span>? Esta ação não pode ser desfeita.</div>
            <div className="modal-btns">
              <button className="modal-cancel" onClick={()=>setDeleteConfirm(null)}>Cancelar</button>
              <button className="modal-del" onClick={()=>handleDeleteBet(deleteConfirm)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="hdr">
        <div className="hbrand">
          <XPBox size={30}/>
          <div className="hdiv"/>
          <Shield w={22} h={26}/>
          <div style={{marginLeft:6}}>
            <div className="hwm">Insurance <em>Experience</em></div>
            <div className="hsub">2026 · {userName&&<span style={{color:GOLD_DIM}}>Olá, {userName.split(" ")[0]}!</span>}</div>
          </div>
        </div>
        <div className="hnav">
          {[["bets","Apostas"],["ranking","Ranking"],["qr","QR"],["admin","Admin"]].map(([s,l])=>(
            <button key={s} className={`hnb${screen===s?" on":""}`} onClick={()=>setScreen(s)}>{l}</button>
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
                  <div className="gcglow"/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div><div className="glbl">{game.label}</div><div className="gven">{game.venue}</div></div>
                    {closed?<div className="bclosed">🔒 Encerrado</div>:<div style={{fontSize:10,color:"#222",letterSpacing:.5}}>{fmtDate(game.date)}</div>}
                  </div>
                  <div className="mu">
                    <div className="team">
                      <span className="tflag">{game.homeflag}</span>
                      <div className="tnm">{game.home}</div>
                    </div>
                    <div className="vsb"><div className="vsl"/><div className="vst">VS</div><div className="vsl"/></div>
                    <div className="team">
                      <span className="tflag">{game.awayflag}</span>
                      <div className="tnm">{game.away}</div>
                    </div>
                  </div>
                  <div className="sp">Seu palpite de placar</div>
                  <div className="sr">
                    <input className="si" type="number" min="0" max="99" placeholder="—" value={bet.homeScore??""} onChange={e=>updateBet(game.id,"homeScore",e.target.value)} disabled={closed}/>
                    <div className="ssep">×</div>
                    <input className="si" type="number" min="0" max="99" placeholder="—" value={bet.awayScore??""} onChange={e=>updateBet(game.id,"awayScore",e.target.value)} disabled={closed}/>
                  </div>
                  <div className="prz">
                    <div className="przico">{game.prizeIcon}</div>
                    <div><div className="przlbl">Prêmio deste jogo</div><div className="prznm">{game.prize}</div></div>
                  </div>
                  {!closed
                    ?<button className={`actbtn${saved?" saved":""}`} onClick={()=>handleSaveBet(game.id)} disabled={!hasBet||saving}>
                      {saving?"Salvando...":saved?"✓ Aposta registrada!":hasBet?"Confirmar aposta":"Digite o placar para apostar"}
                    </button>
                    :<div className="actbtn ghost">{hasBet?`Sua aposta: ${bet.homeScore} × ${bet.awayScore}`:"Você não apostou neste jogo"}</div>
                  }
                </div>
                <div className="ptsbox">
                  <div className="ptshd">Sistema de Pontuação</div>
                  {[["Placar exato","3 pts"],["Vencedor / empate","1 pt"],["Total de gols correto","+1 pt"],["Máximo por jogo","5 pts"]].map(([d,v])=>(
                    <div key={d} className="ptsr"><span className="ptsd">{d}</span><span className="ptsv">{v}</span></div>
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
                <div className="rkhero">
                  <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.5}}><Stars width={600} height={130}/></div>
                  <div className="rkgn">{game.homeflag} {game.home} <span>×</span> {game.away} {game.awayflag}</div>
                  <div className="rkmeta">{game.venue} · {fmtDate(game.date)} · Prêmio: {game.prizeIcon} {game.prize}</div>
                  {hasResult&&<div className="rkchip"><div className="rklbl">Resultado</div><div className="rksc">{res.homeScore} × {res.awayScore}</div></div>}
                  {!hasResult&&isGameClosed(game)&&<div style={{fontSize:10,color:"#222",letterSpacing:2,marginTop:10,position:"relative",zIndex:1,textTransform:"uppercase"}}>Aguardando resultado...</div>}
                </div>
                <div style={{maxWidth:500,margin:"0 auto"}}>
                  {ranking.length===0
                    ?<div className="rkempty">Nenhuma aposta registrada</div>
                    :ranking.map((e,i)=>(
                      <div key={e.name} className={`rkrow${e.name===userName?" me":""}`}>
                        <div className={`rkpos${i===0?" p1":i===1?" p2":i===2?" p3":""}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                        <div style={{flex:1}}>
                          <div className="rknm">{e.name}{e.name===userName&&<span className="rkmtag">• você</span>}</div>
                          <div className="rkbet">Apostou: {e.bet.homeScore} × {e.bet.awayScore}</div>
                        </div>
                        <div>
                          {hasResult&&e.pts!==null?<><div className="rkpts">{e.pts}</div><div className="rkptu">pts</div></>:<div style={{color:"#141414",fontSize:22,fontFamily:"'Barlow Condensed',sans-serif"}}>—</div>}
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
              <div style={{background:"#080808",border:"1px solid #161616",padding:20,maxWidth:300}}>
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
                    <div className="adgm">{count} apostas · {game.venue}</div>
                    <div className="aden">
                      <div className="adtl">{game.home}</div>
                      <input className="adin" type="number" min="0" placeholder="—"
                        value={res.homeScore??""} onChange={e=>setResults(r=>({...r,[game.id]:{...(r[game.id]||{}),homeScore:e.target.value.replace(/\D/g,"").slice(0,2)}}))}/>
                      <div className="addash">×</div>
                      <input className="adin" type="number" min="0" placeholder="—"
                        value={res.awayScore??""} onChange={e=>setResults(r=>({...r,[game.id]:{...(r[game.id]||{}),awayScore:e.target.value.replace(/\D/g,"").slice(0,2)}}))}/>
                      <div className="adtl r">{game.away}</div>
                    </div>
                    <button className={`adsv${savedMap[`r_${game.id}`]?" saved":""}`} onClick={()=>handleSaveResult(game.id)}>
                      {savedMap[`r_${game.id}`]?"✓ Publicado":"Publicar resultado"}
                    </button>
                  </div>
                );
              })}

              {/* APOSTAS COM EXCLUSÃO */}
              {adminTab==="bets"&&(
                <>
                  {activeGames.map(game=>{
                    const count=Object.values(allBets).filter(b=>b[game.id]).length;
                    const ranking = Object.entries(allBets)
                      .filter(([,b])=>b[game.id])
                      .sort((a,b)=>{
                        const pa=calcPoints(a[1][game.id],results[game.id]);
                        const pb=calcPoints(b[1][game.id],results[game.id]);
                        if(pa===null&&pb===null) return 0;
                        if(pa===null) return 1; if(pb===null) return -1;
                        return pb-pa;
                      });
                    return(
                      <div key={game.id} className="adbl">
                        <div className="adgn">{game.homeflag} {game.home} × {game.away} {game.awayflag}</div>
                        <div className="adgm">{count} apostas · {game.prizeIcon} {game.prize}</div>
                        {count===0
                          ?<div style={{fontSize:11,color:"#222",letterSpacing:1}}>Nenhuma aposta ainda</div>
                          :<table className="btable">
                            <thead><tr><th>Participante</th><th>Palpite</th><th>Pts</th><th></th></tr></thead>
                            <tbody>
                              {ranking.map(([name,bets])=>{
                                const bet=bets[game.id];
                                const pts=calcPoints(bet,results[game.id]);
                                return(
                                  <tr key={name}>
                                    <td>{name}</td>
                                    <td className="sc">{bet.homeScore} × {bet.awayScore}</td>
                                    <td className="sc">{pts!==null?pts:"—"}</td>
                                    <td><button className="delbtn" onClick={()=>setDeleteConfirm(name)}>Excluir</button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        }
                      </div>
                    );
                  })}
                  <div style={{fontSize:10,color:"#222",letterSpacing:1,textAlign:"center",marginTop:8}}>
                    Excluir remove todas as apostas do participante em todos os jogos
                  </div>
                </>
              )}

              {/* PRÊMIOS */}
              {adminTab==="prizes"&&(
                <>
                  {games.map(game=>(
                    <div key={game.id} className="adbl">
                      <div className="adgn">{game.label} — {game.homeflag} {game.home} × {game.away}</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                        <input className="pei" value={game.prizeIcon} onChange={e=>updateGameField(game.id,"prizeIcon",e.target.value)} maxLength={2}/>
                        <input className="pet" value={game.prize} onChange={e=>updateGameField(game.id,"prize",e.target.value)} placeholder="Nome do prêmio"/>
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
                  <div style={{fontSize:10,color:"#222",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Ative ou desative jogos</div>
                  {games.map(game=>(
                    <div key={game.id} className="trow">
                      <div className="tinf">
                        {game.homeflag} {game.home} × {game.away} {game.awayflag}
                        <small>{game.label} · {game.prizeIcon} {game.prize}</small>
                      </div>
                      <button className={`tbtn${game.active?" on":" off"}`} onClick={()=>handleSaveGames(games.map(g=>g.id===game.id?{...g,active:!g.active}:g))}>
                        <div className="tknob"/>
                      </button>
                    </div>
                  ))}
                  <div style={{fontSize:10,color:"#1a1a1a",letterSpacing:1,marginTop:12,textAlign:"center"}}>Jogos desativados não aparecem para os participantes</div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
