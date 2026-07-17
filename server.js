/* ============================================================
   별사탕 테트리스 - 통합 서버 v2 (게임 배포 + 온라인 대전 + 주간 랭킹)
   ─────────────────────────────────────────────
   실행: npm install → npm start   (또는 start-server.bat 더블클릭)
   접속:
     · 같은 컴퓨터 브라우저:      http://localhost:8765
     · 같은 와이파이 폰/태블릿:   http://내컴퓨터IP:8765  (게임이 바로 열림!)
     · 게임 로비의 서버 주소는 자동으로 채워짐 (직접 열었으면 ws://IP:8765 입력)
   ─────────────────────────────────────────────
   기능: ① index.html 등 게임 파일 서빙(폰 크로스플레이!)  ② 1:1 방/중계
        ③ 주간 랭킹(leaderboard.json 에 저장)              ④ RP·연승 전달
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const PORT = process.env.PORT || 8765;

/* ---------- ① 정적 파일 서버 (게임 배포) ---------- */
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript",".json":"application/json",".png":"image/png",".ico":"image/png"};
const httpServer=http.createServer((req,res)=>{
  let f=req.url.split("?")[0]; if(f==="/")f="/index.html";
  const p=path.join(__dirname, path.normalize(f).replace(/^(\.\.[\/\\])+/,""));
  fs.readFile(p,(err,data)=>{
    if(err){ res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200,{"Content-Type":MIME[path.extname(p)]||"application/octet-stream"});
    res.end(data);
  });
});

/* ---------- ③ 주간 랭킹 (파일에 저장) ---------- */
const BOARD_FILE=path.join(__dirname,"leaderboard.json");
let boards={}; try{ boards=JSON.parse(fs.readFileSync(BOARD_FILE,"utf8")); }catch(e){}
function weekKey(){ const d=new Date(); const on=new Date(d.getFullYear(),0,1);
  return d.getFullYear()+"-W"+Math.ceil(((d-on)/864e5+on.getDay()+1)/7); }
function saveBoards(){ try{ fs.writeFileSync(BOARD_FILE,JSON.stringify(boards)); }catch(e){} }
function recordWin(name,rp){ const wk=weekKey(); boards[wk]=boards[wk]||{};
  const e=boards[wk][name]||{wins:0,rp:0}; e.wins++; e.rp=rp||e.rp; boards[wk][name]=e; saveBoards(); }
function topBoard(){ const wk=weekKey(), b=boards[wk]||{};
  return Object.entries(b).map(([name,v])=>({name,wins:v.wins,rp:v.rp||0}))
    .sort((a,b)=>b.wins-a.wins).slice(0,10); }

/* ---------- ② 대전 방 & 중계 ---------- */
const wss = new WebSocket.Server({ server: httpServer });
let nextRoomId=1;
const rooms=new Map(); // id → {id,name,mode,players:[ws],hostInfo}
function send(ws,obj){ try{ if(ws.readyState===1)ws.send(JSON.stringify(obj)); }catch(e){} }
function roomList(){ return [...rooms.values()].filter(r=>!r.started && r.players.length<r.cap)
  .map(r=>({id:r.id,name:r.name,mode:r.mode,style:r.style,vs:r.vs||"vs1",cnt:r.players.length,cap:r.cap||2,host:r.hostInfo.name,wins:r.hostInfo.wins||0,losses:r.hostInfo.losses||0,rp:r.hostInfo.rp||0})); }
function broadcastRooms(){ const list=roomList();
  wss.clients.forEach(c=>{ if(c.meta&&!c.meta.room)send(c,{t:"rooms",list}); }); }
function peerOf(ws){ const r=ws.meta&&ws.meta.room; if(!r)return null; return r.players.find(p=>p!==ws)||null; }
function sendRoomState(r){ // 🚪 대기실: 멤버 목록을 방 전원에게
  const members=r.players.map((p,i)=>({id:i,name:p.meta.name,rp:p.meta.rp,wins:p.meta.wins,losses:p.meta.losses||0}));
  r.players.forEach(p=>send(p,{t:"roomState",id:r.id,name:r.name,vs:r.vs,cap:r.cap,
    host:r.players[0].meta.name, you:r.players.indexOf(p), members}));
}
function info(ws){ return {name:ws.meta.name,wins:ws.meta.wins,losses:ws.meta.losses||0,rp:ws.meta.rp,streak:ws.meta.streak}; }
/* 🟢 접속자 목록: 대기/게임 중 상태 + 전적 포함 */
function userList(){ const out=[];
  wss.clients.forEach(c=>{ if(c.meta&&c.meta.name!=="?")
    out.push({name:c.meta.name,wins:c.meta.wins,losses:c.meta.losses||0,rp:c.meta.rp,
      state:(c.meta.room&&c.meta.room.started)?"playing":"lobby"}); });
  return out; }
function broadcastUsers(){ const list=userList();
  wss.clients.forEach(c=>{ if(c.meta)send(c,{t:"users",list}); }); }
function findByName(name){ let f=null; wss.clients.forEach(c=>{ if(c.meta&&c.meta.name===name)f=c; }); return f; }
function leaveRoom(ws,notify){
  const r=ws.meta&&ws.meta.room; if(!r)return;
  const wasHost = r.players[0]===ws;
  const pid = ws.meta.pid!=null ? ws.meta.pid : r.players.indexOf(ws);
  r.players=r.players.filter(p=>p!==ws); ws.meta.room=null; ws.meta.pid=null;
  if(r.started){ // 게임 중 이탈 → 남은 전원에게 알림 (해당 플레이어 사망 처리)
    if(notify)r.players.forEach(p=>send(p,{t:"pLeft",id:pid}));
    if(r.players.length<=1){ if(r.players[0]){ send(r.players[0],{t:"oppLeft"}); r.players[0].meta.room=null; r.players[0].meta.pid=null; }
      rooms.delete(r.id); }
  } else { // 대기실 이탈
    if(wasHost || !r.players.length){ // 방장이 나가면 방 해산
      r.players.forEach(p=>{ send(p,{t:"roomClosed"}); p.meta.room=null; });
      rooms.delete(r.id);
    } else sendRoomState(r);
  }
  broadcastRooms();
}
wss.on("connection", ws=>{
  ws.meta={name:"?",wins:0,losses:0,rp:0,streak:0,room:null,chFrom:null};
  ws.on("message", data=>{
    let m; try{ m=JSON.parse(data); }catch(e){ return; }
    switch(m.t){
      case "hello": ws.meta.name=String(m.name||"?").slice(0,12);
        ws.meta.wins=+m.wins||0; ws.meta.losses=+m.losses||0; ws.meta.rp=+m.rp||0; ws.meta.streak=+m.streak||0;
        send(ws,{t:"rooms",list:roomList()}); broadcastUsers(); break;
      case "list": send(ws,{t:"rooms",list:roomList()}); break;
      case "board": send(ws,{t:"board",list:topBoard()}); break;      // 🏆 주간 랭킹
      case "win": recordWin(ws.meta.name, ws.meta.rp); break;          // 승리 보고
      case "create": {
        if(ws.meta.room)leaveRoom(ws,true);
        const vs=["vs1","team22","vsN"].includes(m.vs)?m.vs:"vs1";
        const r={id:nextRoomId++, name:String(m.name||"room").slice(0,14),
          mode:["classic","fight","fightItem"].includes(m.mode)?m.mode:"fight",
          style:m.style==="buster"?"buster":"tetris",
          vs, cap: vs==="vs1"?2 : vs==="team22"?4 : 6, // 정원
          started:false,
          players:[ws], hostInfo:info(ws)};
        rooms.set(r.id,r); ws.meta.room=r;
        send(ws,{t:"created",id:r.id}); sendRoomState(r); broadcastRooms(); break; }
      case "join": {
        const r=rooms.get(m.id);
        if(!r||r.started||r.players.length>=r.cap){ send(ws,{t:"err",msg:"room unavailable"}); send(ws,{t:"rooms",list:roomList()}); break; }
        if(ws.meta.room)leaveRoom(ws,true);
        r.players.push(ws); ws.meta.room=r;
        sendRoomState(r); // 대기실: 누가 들어왔는지 전원에게 표시
        broadcastRooms(); broadcastUsers(); break; }
      case "startGame": { // ▶ 방장만 시작 가능 (2명 이상)
        const r=ws.meta.room;
        if(!r||r.started||r.players[0]!==ws||r.players.length<2)break;
        r.started=true;
        r.players.forEach((p,i)=>{ p.meta.pid=i; });
        const roster=r.players.map((p,i)=>({id:i,name:p.meta.name,rp:p.meta.rp,wins:p.meta.wins,losses:p.meta.losses||0,
          team: r.vs==="team22" ? (i<2?0:1) : null})); // 2:2 = 입장 순서대로 [0,1]팀 vs [2,3]팀
        r.players.forEach((p,i)=>{
          const msg={t:"start",mode:r.mode,style:r.style,vs:r.vs,you:i,players:roster};
          if(r.players.length===2) msg.opp=info(r.players[1-i]); // 1:1 하위호환
          send(p,msg);
        });
        broadcastRooms(); broadcastUsers(); break; }
      case "relay": { const r=ws.meta.room; if(!r)break;
        m.from = ws.meta.pid!=null ? ws.meta.pid : r.players.indexOf(ws); // 보낸 사람 id
        if(m.to!=null){ const t=r.players.find(p=>(p.meta.pid!=null?p.meta.pid:r.players.indexOf(p))===m.to);
          if(t&&t!==ws)send(t,m); }               // 🎯 지정 대상(최소 스택 공격 등)
        else r.players.forEach(p=>{ if(p!==ws)send(p,m); }); // 전체 방송
        break; }
      case "leave": leaveRoom(ws,true); broadcastUsers(); break;
      /* ⚔️ 대전 신청: 대기 중인 상대에게 전달 */
      case "challenge": { const t=findByName(String(m.to||""));
        if(!t||t===ws){ break; }
        if(t.meta.room&&t.meta.room.started){ send(ws,{t:"chDeclined",name:t.meta.name}); break; }
        t.meta.chFrom={ws,mode:["classic","fight","fightItem"].includes(m.mode)?m.mode:"fight",
          style:m.style==="buster"?"buster":"tetris"};
        send(t,{t:"challenge",from:Object.assign(info(ws),{mode:t.meta.chFrom.mode})}); break; }
      case "chAnswer": { const ch=ws.meta.chFrom; ws.meta.chFrom=null;
        if(!ch||!ch.ws||ch.ws.readyState!==1){ break; }
        if(!m.ok){ send(ch.ws,{t:"chDeclined",name:ws.meta.name}); break; }
        /* ✅ 수락 → 즉시 방 생성 + 양쪽 시작 (일반 방 입장과 동일 흐름) */
        if(ws.meta.room)leaveRoom(ws,true); if(ch.ws.meta.room)leaveRoom(ch.ws,true);
        const r={id:nextRoomId++, name:"⚔️"+ch.ws.meta.name, mode:ch.mode, style:ch.style, vs:"vs1", cap:2, started:true,
          players:[ch.ws,ws], hostInfo:info(ch.ws)};
        rooms.set(r.id,r); ch.ws.meta.room=r; ws.meta.room=r;
        ch.ws.meta.pid=0; ws.meta.pid=1;
        const roster=[Object.assign({id:0,team:null},info(ch.ws)),Object.assign({id:1,team:null},info(ws))];
        send(ch.ws,{t:"start",mode:r.mode,style:r.style,vs:"vs1",you:0,players:roster,opp:info(ws)});
        send(ws,{t:"start",mode:r.mode,style:r.style,vs:"vs1",you:1,players:roster,opp:info(ch.ws)});
        broadcastRooms(); broadcastUsers(); break; }
    }
  });
  ws.on("close",()=>{ leaveRoom(ws,true); broadcastUsers(); });
});
httpServer.listen(PORT,()=>{
  console.log("⭐ Sugar Blocks 서버 시작!");
  console.log("   게임 열기: http://localhost:"+PORT);
  try{ const os=require("os"), nets=os.networkInterfaces();
    for(const k in nets)for(const n of nets[k])
      if(n.family==="IPv4"&&!n.internal)console.log("   폰에서:    http://"+n.address+":"+PORT);
  }catch(e){}
});
