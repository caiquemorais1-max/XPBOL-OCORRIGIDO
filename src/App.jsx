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

const ADMIN_PASSWORD = "XP2026"; // v2026-final
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
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAA5AQAAAACpfc5vAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAAAqo0jMgAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+oGDg4RJQbXyooAAAPBelRYdFJhdyBwcm9maWxlIHR5cGUgOGJpbQAASImdV1myLCkI/XcVvQRHlOU4RvRH7/+3wSG1Mmt48YiMe+tQYgJykBIh/fuf+IdEgZbCBKst2iJ9kdI6CcpbCHIIGM1/5R+IeKMLb3TfRB8bNZObKfu7C7sQFRIG9A6nUYRqM+mq0ZW9bSloI6Raxsrq4umfVMEmP4xULtXGvUar2HQ4cImoE+MVGhkZjPSKvcg6LEZt7HJR6DdmG2+la+XYKCQTKfXXojtmo6mTtzVTxLXrS/Lm2y+Z3l1iNAD404Y9CjYX2VoLlF93fJkNP+/xuW559FWOkKxT9DwxQjQSaCMbW8YwjKIvBRvVoEPg4+425cBN13xgtilKFdP6RgkifVmyUs3vN91xN5q6JRvP0G7fD+9A54pb9fPUutgfufqSuxB1iFTZNwUlz+QqE2FXrJlGiKpEyp2vVmXKZxwVLj1WehiLV0UPaS6Ckuh5Yto0eT4QBA0z4WhEToUICKowyy7vXPGOiXfHn9PwrY70b+qgNa66G2mZBHCQcp7aR3yebEuittROxcAYvOLuSBzMYdYQSvpE2a9FRRN22NWEalDcFfNtDy79ECbtjFPy6Wt84thlY/ZuFfDSFS/IDE7FK+60mLpeIeGJqYlSdbBHiCmZYZQaeL5Ogi5aMknZt47pUexdstyng1IR7cxdtYBMWnRgIe+QMAJG/8Tfc/epjo4KX4fwwCFnjqR6g76KaZR0U+RqTRbK0YdqijURLVICzTdLzbLEPNNQqjKRN/KmcWh59mPOnY9P3E9p6phtUJ84oehX0KXo3o276tKtkD7hLvZXz36Tu1lDF1UGPm7a3F/1yqVOP7t1s7W+wQdpV/9duXlgKEUTD2tNefXwnLBf4K0IH2TcJb9Ie8cjD99ifpej45R872hvcDVUB4SjTv2SZtIW6gmdFipVbg8rpAAqgH7iMw2rc5YsbgpD7b1y683RrhqqujL7AV1Oanu3evjAYiu6/NGY95qG4R1tFJkHebu7cNU5BvKE3qHiDKl6iImLEpWNnUJUNHzTgCBuRx71VElc1doTy4ZRgwT9zhq9affut3iQdhfhGF3uWDYMjm8sGQq6SaVmoWouCUXToRNcYDK0dJnKiiYapHmJP8yEV6XT++FhYXGfHuRfNP690UcuUcfx0b7yryLI3Kdf12JaER2kbRZR9/lZSZjjcUPv+0ztjXJHguccfmAxB/Mj4bPP3DG9aAytZ++iWyQ1LhEQQ7mStxa94uv3SkpnPuH87SL+B4tf9PPOh2hQAAAAjUlEQVQoz+XQMQ6DMAwF0F+Q6q1dGarmIhXcjAAL18pR2LpmzIBwbZww0COQJU9K8v0VON5XhDekghW283ZNjBwAReABeAsWXwMPQWwJuAvS6wlU0M9yxIoNHcl9yYAnSRAMfEY5Oi7vzycNbHJg/OQRS5+HBr5ZjVH79Fb1WzofmP9AAm9Y0RkSnCH+AJXQfE2KoB0hAAAAFXRFWHR0aWZmOmFscGhhAGFzc29jaWF0ZWRof6P+AAAAD3RFWHR0aWZmOmVuZGlhbgBsc2JVtxdDAAAAGHRFWHR0aWZmOnBob3RvbWV0cmljAHBhbGV0dGU5ebdrAAAAFnRFWHR0aWZmOnJvd3MtcGVyLXN0cmlwADY1fl1AjQAAAABJRU5ErkJggg==" width={size} height={size} style={{display:"block",borderRadius:Math.round(size*0.18),objectFit:"contain"}}/>
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {name, gameId}

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

  async function handleDeleteBet(participantName, gameId) {
    try {
      const currentBets = allBets[participantName] || {};
      const updatedBets = {...currentBets};
      delete updatedBets[gameId];
      if (Object.keys(updatedBets).length === 0) {
        await deleteDoc(doc(db,"bets",participantName));
      } else {
        await setDoc(doc(db,"bets",participantName), {bets: updatedBets});
      }
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
    .login-sub{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:600;letter-spacing:4px;color:#888;text-transform:uppercase;text-align:center;margin-bottom:40px;position:relative;z-index:2;}
    .login-rule{width:280px;height:1px;background:linear-gradient(90deg,transparent,${GOLD},transparent);opacity:.4;margin-bottom:36px;position:relative;z-index:2;}
    .login-form{width:100%;max-width:320px;position:relative;z-index:2;}
    .login-lbl{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:8px;}
    .login-inp{width:100%;background:#0a0a0a;border:1px solid #333;color:#fff;padding:15px 18px;font-family:'Barlow',sans-serif;font-size:16px;outline:none;transition:border .2s;border-radius:0;}
    .login-inp:focus{border-color:${GOLD};}
    .login-inp::placeholder{color:#222;}
    .login-btn{width:100%;margin-top:10px;background:${GOLD};color:#0d0d0d;border:none;padding:16px;font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;transition:filter .15s;}
    .login-btn:hover:not(:disabled){filter:brightness(1.1);}
    .login-btn:disabled{background:#161616;color:#2a2a2a;cursor:not-allowed;}
    .login-count{margin-top:28px;font-size:12px;color:#555;text-align:center;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;position:relative;z-index:2;}

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
      <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}><Stars width={window.innerWidth||800} height={window.innerHeight||600}/></div>

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:6,color:"#666",textTransform:"uppercase",marginBottom:24,textAlign:"center",position:"relative",zIndex:2}}>Copa do Mundo · México</div>

      <div style={{position:"relative",zIndex:2,marginBottom:20,textAlign:"center"}}>
        <img src="data:image/png;base64,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" style={{width:"min(460px,88vw)",height:"auto",display:"block",margin:"0 auto"}}/>
      </div>
      <div className="login-sub">Bolão Oficial</div>


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
            <div className="modal-body">Tem certeza que quer excluir a aposta de <span className="modal-name">{deleteConfirm?.name}</span> neste jogo? Esta ação não pode ser desfeita.</div>
            <div className="modal-btns">
              <button className="modal-cancel" onClick={()=>setDeleteConfirm(null)}>Cancelar</button>
              <button className="modal-del" onClick={()=>handleDeleteBet(deleteConfirm?.name, deleteConfirm?.gameId)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="hdr">
        <div className="hbrand">
          <XPBox size={30}/>
          <div className="hdiv"/>
          <Shield w={22} h={26} glow={false}/>
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
                                    <td><button className="delbtn" onClick={()=>setDeleteConfirm({name, gameId:game.id})}>Excluir</button></td>
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
                    Excluir remove apenas a aposta deste jogo. Se o participante não tiver outras apostas, é removido completamente.
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
