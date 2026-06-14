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

      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:300,letterSpacing:6,color:"#444",textTransform:"uppercase",marginBottom:24,textAlign:"center",position:"relative",zIndex:2}}>Copa do Mundo · México</div>

      <div style={{position:"relative",zIndex:2,marginBottom:20,textAlign:"center"}}>
        <img src="data:image/png;base64,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LaiefWDvCGdAnuGZwHZf8BIBGYSO4lFSqUKB6bhQXoEGd5kCtxQh1TNaTHq0+NfCciOZu1IKL5kpRTwMGIW/3VkmQYT/5QZSRLz55puPPfbYNm3a6MRaeg8upTzllFNeeOGFL774orHZtjQXPvvss59++ul55503duzYbt26xSaa0fY3v1yGTjXpyyPP8zp06DBr1qwRI0bMnTt3j9IL/QIaO5Ok/kB+++2311577eOPP16yZAnsyLNajxTWvx07dmwsP+lz1m+//XbDhg2xLXz00Uc333yz/160FtixY8dDDz30o48+0lbNJgzt6quv/v7770OhUA3zwJVXXvnyy9NLSkrj95rxfXlqkIpfmLAJunjt9uNc4XqnVf/+QJOl4zj6L7vncJoAlAfcMJzCEvXRt97FJweoquzYIXmTX+AllRK5LkvL9JXNRIMegscgCZUB5CmulIwYggMTj7215qfloeduade9c4mMMKZUQFT27hYBIqAoEALuVq0LlXCYZOBWA0aBmY5rMzsVTIWihEOJqlJG2ANACINlJnvKUFgNALA9MfffqhEmvEb/m6H1sG3btl1zzTU1xITW4R566KEWLVro6LfG7uIty9q0adOtt97at2/fQw899I477pg9e3ZZWZlOKKMZV5NibVOY67pJSUkvvfRSdnb2nhZEqPWGWMRmw4m1N6akpOjMYZZl1T97OmKhffv2Q4YMqe3BP2vWLF3uWEedm6a5bNmypUuXxkbp1eDRpq2EpUuX3nXXXbHGVd0Ty7IeeOBBrbPGSYHa9al2TF6bNm2g8aFEdVaHiKcRbcEmIr3k6gml1xfk5OTEb7ZtijxVXAplECCwtz4qc9wkKd3OHb3j+ueSBGlIJKJmddcEndCaV7ki4jIOymDKUtISjICZpYVMuAEky1MGIXg84rjlgGkQyIKkNLCyd+efTMZzwcyDpBCEciDJMrOSRRbnTDAvAG6WIeHpO3NevLFbbgq3oy43pTQcBQhk/v1ffUIj/G+G1tKCweBbb7112mmnHX/88b7XjA7S6tGjx0033RQOh7Oyshq7i9cZJrW/w7x58+bNmwcAubm5++677+DBg4cMGdKzZ8+0tDT4axCbL79s227Xrt1ZZ531wAMP1FAK6+zJzhS1JqgR8djQarC+1jz01GllolevXr169brssstGjRo1Z86c+vVa/SJG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brnlFiK69dZb4zz6ZYWp53nNzc277777TTfdlEqlYq6v1dsFY0w+nx8yZMitt976Ob2FAzQHH3vssThqdAV9iU8Pra2tA7R1YsryAw44YIcddljWFIM+gUXxEfjMM8984IEHWltbVzn97tMuseJbw34KLLY/Wltbf/rTn4ZhaIwWWQmVYizLnnvuuUWLFq0gRCJeSJ7nzZkzZ9XswmWzdOIu9A0cHTt27BVXXHHaaacdfvjhTz755Crw13xWDd3V1fXEE0/AyqJGlVLz5s3rm5TymToepxKdffbZl1xySV8ncDykF1544fPPPz+QlRDbkc3NzbBM1CgADBkyZOBKOtadKwjgXOnZKB6WmTNnvvnmmytmqXXOJRKJl19+OV5FK1QbjGAVJB0TaBEINltvZDoNLqc72+DDOQVARAEgRRKhS0YqVKwJ7PUPLPjh99fL2GJ9Y+dP9mk8/eqPiDSyW2qVlYaFUIREIYhlIeODdi+83bLbTzuO2HfYbw8bM3xIIco2VycKZ5/UuNuu659/5aIHn+twoDyf2ZYYWD6DdYgCAp5zynjRfc813/1k7Q92rYu6Fh91wMhHHq19ekoHaSJGXK6WFQGAru5sEEYJBcyRyABNEQQAAetUKM7zAA74bg1ATiVr3/2w4tUpc0gpssi4ireEX4wijD2i77333m677RZrwWWVWbwBlFK33XZbSQv23d4333xzFEV33nnncov0xhuyu7v7oIMOis+qq0sAxU9j5nw+P2HChLvuumu99daDNZYfXTrmFwqFo48+uqmpaYC210DyAUp1Gc8999xlx2e555LBgweffvrpJ5xwwir3dyAmS4ln0vf9lpaW/ffff/r06b7vWxsORCAqpc4666znnntu4Kb2KpxjPm0ESu7l+M8wDIcPH37//fdvscUWM2fO/Ey1Gz+rfoqTIg488MDV6GNYgS688sorDzzwwC233LKkC+OR3GOP3SdO3Gggz4+HqL29fblrb7PNNiuFxa2UICImqTnuuOPGjx/fr3CmMeZf//rXww8/vOI4r7gXTz311PHHHz9QAar1inMcZekfCMggALLFBklgUb7/0Vy7sKWIGlHAIStWCIFVFqJ0Qqm3ZvQ+/kzxB7tV2ELHQXvWXHGn39LtNCoWAFAATgAQEAEEIdARACL7ylnlrNKJCO0198z95zMtvz5q7BHfG2sS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" style={{width:"min(460px,88vw)",height:"auto",display:"block",margin:"0 auto"}}/>
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
