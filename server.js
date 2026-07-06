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
function roomList(){ return [...rooms.values()].filter(r=>r.players.length===1)
  .map(r=>({id:r.id,name:r.name,mode:r.mode,style:r.style,host:r.hostInfo.name,wins:r.hostInfo.wins||0,rp:r.hostInfo.rp||0})); }
function broadcastRooms(){ const list=roomList();
  wss.clients.forEach(c=>{ if(c.meta&&!c.meta.room)send(c,{t:"rooms",list}); }); }
function peerOf(ws){ const r=ws.meta&&ws.meta.room; if(!r)return null; return r.players.find(p=>p!==ws)||null; }
function info(ws){ return {name:ws.meta.name,wins:ws.meta.wins,rp:ws.meta.rp,streak:ws.meta.streak}; }
function leaveRoom(ws,notify){
  const r=ws.meta&&ws.meta.room; if(!r)return;
  const peer=peerOf(ws);
  r.players=r.players.filter(p=>p!==ws); ws.meta.room=null;
  if(peer&&notify){ send(peer,{t:"oppLeft"}); peer.meta.room=null; }
  rooms.delete(r.id); broadcastRooms();
}
wss.on("connection", ws=>{
  ws.meta={name:"?",wins:0,rp:0,streak:0,room:null};
  ws.on("message", data=>{
    let m; try{ m=JSON.parse(data); }catch(e){ return; }
    switch(m.t){
      case "hello": ws.meta.name=String(m.name||"?").slice(0,12);
        ws.meta.wins=+m.wins||0; ws.meta.rp=+m.rp||0; ws.meta.streak=+m.streak||0;
        send(ws,{t:"rooms",list:roomList()}); break;
      case "list": send(ws,{t:"rooms",list:roomList()}); break;
      case "board": send(ws,{t:"board",list:topBoard()}); break;      // 🏆 주간 랭킹
      case "win": recordWin(ws.meta.name, ws.meta.rp); break;          // 승리 보고
      case "create": {
        if(ws.meta.room)leaveRoom(ws,true);
        const r={id:nextRoomId++, name:String(m.name||"room").slice(0,14),
          mode:["classic","fight","fightItem"].includes(m.mode)?m.mode:"fight",
          style:m.style==="buster"?"buster":"tetris",
          players:[ws], hostInfo:info(ws)};
        rooms.set(r.id,r); ws.meta.room=r;
        send(ws,{t:"created",id:r.id}); broadcastRooms(); break; }
      case "join": {
        const r=rooms.get(m.id);
        if(!r||r.players.length!==1){ send(ws,{t:"err",msg:"room unavailable"}); send(ws,{t:"rooms",list:roomList()}); break; }
        if(ws.meta.room)leaveRoom(ws,true);
        r.players.push(ws); ws.meta.room=r;
        const [a,b]=r.players;
        send(a,{t:"start",mode:r.mode,style:r.style,opp:info(b)});
        send(b,{t:"start",mode:r.mode,style:r.style,opp:info(a)});
        broadcastRooms(); break; }
      case "relay": { const p=peerOf(ws); if(p)send(p,m); break; }
      case "leave": leaveRoom(ws,true); break;
    }
  });
  ws.on("close",()=>leaveRoom(ws,true));
});
httpServer.listen(PORT,()=>{
  console.log("⭐ Sugar Blocks 서버 시작!");
  console.log("   게임 열기: http://localhost:"+PORT);
  try{ const os=require("os"), nets=os.networkInterfaces();
    for(const k in nets)for(const n of nets[k])
      if(n.family==="IPv4"&&!n.internal)console.log("   폰에서:    http://"+n.address+":"+PORT);
  }catch(e){}
});
