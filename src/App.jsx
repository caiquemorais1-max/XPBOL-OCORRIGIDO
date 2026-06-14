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

      <div style={{position:"relative",zIndex:2,marginBottom:10}}>
        <img src="data:image/png;base64,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" style={{width:"min(420px,85vw)",height:"auto",display:"block",margin:"0 auto",filter:"invert(1) sepia(1) saturate(3) hue-rotate(5deg)"}}/>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"min(52px,12vw)",fontWeight:900,fontStyle:"italic",color:GOLD,letterSpacing:4,textAlign:"center",marginTop:4}}>2026</div>
      </div>
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
