// ==== MEDIA: текстуры, звук, логгер ====
import * as THREE from 'three';

export function makeCanvas(sz,fn){const c=document.createElement('canvas');c.width=c.height=sz;fn(c.getContext('2d'),sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}

export const TEX={};
(function(){
 TEX.floor=makeCanvas(128,(x,s)=>{x.fillStyle='#9a9a9a';x.fillRect(0,0,s,s);x.fillStyle='#787878';x.fillRect(0,0,64,64);x.fillRect(64,64,64,64);for(let i=0;i<50;i++){x.fillStyle='rgba(0,0,0,'+(Math.random()*0.18)+')';x.fillRect(Math.random()*s,Math.random()*s,3,3);}});TEX.floor.repeat.set(15,15);
 TEX.wall=makeCanvas(128,(x,s)=>{x.fillStyle='#c9c9c1';x.fillRect(0,0,s,s);x.strokeStyle='#a9a9a1';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*32);x.lineTo(s,i*32);x.stroke();x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,s);x.stroke();}for(let i=0;i<30;i++){x.fillStyle='rgba(120,100,60,'+(Math.random()*0.12)+')';x.fillRect(Math.random()*s,Math.random()*s,6,4);}});TEX.wall.repeat.set(6,2);
 TEX.wood=makeCanvas(128,(x,s)=>{x.fillStyle='#8a5a2b';x.fillRect(0,0,s,s);for(let i=0;i<6;i++){x.fillStyle='rgba(60,35,12,0.5)';x.fillRect(0,i*22+Math.random()*4,s,3);}for(let i=0;i<30;i++){x.strokeStyle='rgba(90,55,25,0.4)';x.beginPath();x.moveTo(Math.random()*s,Math.random()*s);x.lineTo(Math.random()*s,Math.random()*s);x.stroke();}});
 TEX.metal=makeCanvas(128,(x,s)=>{x.fillStyle='#b8bcc0';x.fillRect(0,0,s,s);for(let i=0;i<200;i++){x.strokeStyle='rgba(255,255,255,'+(Math.random()*0.15)+')';x.beginPath();x.moveTo(0,Math.random()*s);x.lineTo(s,Math.random()*s);x.stroke();}for(let i=0;i<15;i++){x.fillStyle='rgba(80,80,80,0.2)';x.fillRect(Math.random()*s,Math.random()*s,8,2);}});
 TEX.plaster=makeCanvas(64,(x,s)=>{x.fillStyle='#d8d8d0';x.fillRect(0,0,s,s);for(let i=0;i<60;i++){x.fillStyle='rgba(0,0,0,'+(Math.random()*0.06)+')';x.fillRect(Math.random()*s,Math.random()*s,3,3);}});TEX.plaster.repeat.set(8,8);
 TEX.ao=makeCanvas(64,(x,s)=>{const g=x.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(0,0,0,0.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,s,s);});
 TEX.breadW=makeCanvas(64,(x,s)=>{x.fillStyle='#f5f0dc';x.fillRect(0,0,s,s);for(let i=0;i<40;i++){x.fillStyle='rgba(255,255,255,'+(0.3+Math.random()*0.4)+')';x.fillRect(Math.random()*s,Math.random()*s,2,2);}x.strokeStyle='rgba(200,180,140,0.7)';x.lineWidth=4;x.strokeRect(2,2,s-4,s-4);});
 TEX.breadB=makeCanvas(64,(x,s)=>{x.fillStyle='#4a2f1d';x.fillRect(0,0,s,s);for(let i=0;i<25;i++){x.fillStyle='rgba(30,18,10,0.7)';x.fillRect(Math.random()*s,Math.random()*s,3,2);}for(let i=0;i<12;i++){x.fillStyle='rgba(240,230,200,0.8)';x.fillRect(Math.random()*s,Math.random()*s,2,1);}});
 TEX.breadBaton=makeCanvas(64,(x,s)=>{x.fillStyle='#d9a44a';x.fillRect(0,0,s,s);for(let i=0;i<5;i++){x.strokeStyle='rgba(160,110,50,0.7)';x.lineWidth=3;x.beginPath();x.moveTo(0,i*14+6);x.lineTo(s,i*14+10);x.stroke();}});
 TEX.toast=makeCanvas(64,(x,s)=>{x.fillStyle='#c08a3a';x.fillRect(0,0,s,s);x.strokeStyle='rgba(90,55,20,0.8)';x.lineWidth=6;x.strokeRect(3,3,s-6,s-6);for(let i=0;i<30;i++){x.fillStyle='rgba(90,55,20,0.3)';x.fillRect(Math.random()*s,Math.random()*s,3,3);}});
 TEX.cheese=makeCanvas(64,(x,s)=>{x.fillStyle='#ffd24a';x.fillRect(0,0,s,s);for(let i=0;i<8;i++){x.fillStyle='rgba(220,170,40,0.9)';x.beginPath();x.arc(Math.random()*s,Math.random()*s,3+Math.random()*4,0,7);x.fill();}});
 TEX.cucumber=makeCanvas(64,(x,s)=>{x.fillStyle='#3fa03f';x.fillRect(0,0,s,s);for(let i=0;i<10;i++){x.strokeStyle='rgba(30,90,30,0.6)';x.lineWidth=2;x.beginPath();x.moveTo(i*7,0);x.lineTo(i*7+3,s);x.stroke();}});
 TEX.cutlet=makeCanvas(64,(x,s)=>{x.fillStyle='#8a5a2a';x.fillRect(0,0,s,s);for(let i=0;i<60;i++){x.fillStyle='rgba('+((120+Math.random()*60)|0)+','+((80+Math.random()*40)|0)+',40,0.5)';x.fillRect(Math.random()*s,Math.random()*s,2,2);}});
 TEX.cutletRaw=makeCanvas(64,(x,s)=>{x.fillStyle='#d8a0a0';x.fillRect(0,0,s,s);for(let i=0;i<40;i++){x.fillStyle='rgba(200,120,120,0.6)';x.fillRect(Math.random()*s,Math.random()*s,3,2);}});
 TEX.rotten=makeCanvas(64,(x,s)=>{x.fillStyle='#7a8a3a';x.fillRect(0,0,s,s);for(let i=0;i<12;i++){x.fillStyle='rgba(60,70,20,0.8)';x.beginPath();x.arc(Math.random()*s,Math.random()*s,2+Math.random()*5,0,7);x.fill();}for(let i=0;i<6;i++){x.fillStyle='rgba(210,210,190,0.5)';x.fillRect(Math.random()*s,Math.random()*s,2,2);}});
 TEX.tomato=makeCanvas(64,(x,s)=>{x.fillStyle='#d43a3a';x.fillRect(0,0,s,s);for(let i=0;i<20;i++){x.fillStyle='rgba(255,120,100,0.25)';x.beginPath();x.arc(Math.random()*s,Math.random()*s,4+Math.random()*6,0,7);x.fill();}});
 TEX.onion=makeCanvas(64,(x,s)=>{x.fillStyle='#d8c0e8';x.fillRect(0,0,s,s);for(let i=0;i<6;i++){x.strokeStyle='rgba(160,130,190,0.7)';x.lineWidth=2;x.beginPath();x.arc(s/2,s/2,6+i*5,0,7);x.stroke();}});
 TEX.egg=makeCanvas(64,(x,s)=>{x.fillStyle='#fff6e0';x.fillRect(0,0,s,s);for(let i=0;i<15;i++){x.fillStyle='rgba(200,170,120,0.5)';x.fillRect(Math.random()*s,Math.random()*s,2,2);}});
 const labTex=(band,txt)=>{const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.fillStyle='#f2f2e8';x.fillRect(0,0,64,64);x.fillStyle=band;x.fillRect(0,22,64,20);x.fillStyle='#111';x.font='bold 11px Courier New';x.fillText(txt,4,36);return new THREE.CanvasTexture(c);};
 TEX.lab_ketchup=labTex('#cc1111','КЕТЧУП');TEX.lab_mayo=labTex('#ddddcc','МАЙОНЕЗ');TEX.lab_mustard=labTex('#d8b400','ГОРЧИЦА');TEX.lab_oil=labTex('#bb9922','МАСЛО');TEX.lab_fake=labTex('#e8e0c0','ДОМ.МАЙОН');TEX.lab_pee=labTex('#e6d44a','???');TEX.lab_bleach=labTex('#2244cc','ОТБЕЛИВ.');
 TEX.menu=makeCanvas(256,(x,s)=>{x.fillStyle='#181818';x.fillRect(0,0,s,s);x.strokeStyle='#ffcc00';x.lineWidth=6;x.strokeRect(3,3,s-6,s-6);x.fillStyle='#ffcc00';x.font='bold 30px Courier New';x.fillText('МЕНЮ:',14,40);x.fillStyle='#fff';x.font='19px Courier New';x.fillText('Бутер классик ...50р',14,74);x.fillText('Бутер КОРОЛЕВСКИЙ',14,100);x.fillText('   (крыса+сыр) ...150р',14,122);x.fillText('Крыса фри .... ПО АКЦИИ',14,150);x.fillText('Суп дня: НЕ СПРАШИВАЙ',14,178);x.fillText('Кофе (из опилок) .10р',14,206);x.fillStyle='#f66';x.font='bold 17px Courier New';x.fillText('САНИТАРИЯ: НЕ НАША ТЕМА',14,238);});
 TEX.poster1=makeCanvas(128,(x,s)=>{x.fillStyle='#224488';x.fillRect(0,0,s,s);x.fillStyle='#fff';x.font='bold 22px Courier New';x.fillText('МОЙ',20,40);x.fillText('РУКИ!',20,70);});
 TEX.poster2=makeCanvas(128,(x,s)=>{x.fillStyle='#882222';x.fillRect(0,0,s,s);x.fillStyle='#fff';x.font='bold 20px Courier New';x.fillText('КРЫСА',20,40);x.fillText('НЕ ДРУГ!',10,68);});
 TEX.sign=makeCanvas(256,(x,s)=>{x.fillStyle='#442211';x.fillRect(0,0,s,s);x.strokeStyle='#ffcc00';x.lineWidth=8;x.strokeRect(6,6,s-12,s-12);x.fillStyle='#ffcc00';x.font='bold 32px Courier New';x.fillText('БУТЕРБРОДНАЯ',18,80);x.fillText('«У БОРИ»',58,128);x.font='22px Courier New';x.fillStyle='#fff';x.fillText('крысы бесплатно',40,190);});
 TEX.neon=makeCanvas(128,(x,s)=>{x.fillStyle='#001414';x.fillRect(0,0,s,s);x.strokeStyle='#00ffff';x.lineWidth=6;x.strokeRect(6,6,s-12,s-12);x.fillStyle='#00ffff';x.font='bold 30px Courier New';x.fillText('ОТКРЫТО',12,52);x.font='bold 40px Courier New';x.fillText('24/7',30,100);});
})();

export function aoMesh(size){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:TEX.ao,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;}

export function itemMapTex(id){return({bread_white:TEX.breadW,bread_black:TEX.breadB,half_white:TEX.breadW,half_black:TEX.breadB,bread_baton:TEX.breadBaton,half_baton:TEX.breadBaton,toast:TEX.toast,ing_cheese:TEX.cheese,ing_cucumber:TEX.cucumber,slice_cucumber:TEX.cucumber,ing_cutlet_raw:TEX.cutletRaw,cutlet_human_raw:TEX.cutletRaw,ing_cutlet_fried:TEX.cutlet,cutlet_human_fried:TEX.cutlet,ing_tomato:TEX.tomato,slice_tomato:TEX.tomato,ing_onion:TEX.onion,slice_onion:TEX.onion,ing_egg:TEX.egg,hazard_rotten:TEX.rotten})[id]||null;}

export function buildBottle(def){const g=new THREE.Group();const col=def.color;
 const bodyMat=new THREE.MeshStandardMaterial({color:col,roughness:0.4});
 if(def.id==='empty_bottle'){bodyMat.transparent=true;bodyMat.opacity=0.35;bodyMat.color.setHex(0xbfd8d8);}
 const body=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.26,10),bodyMat);g.add(body);
 const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.09,0.08,10),bodyMat);sh.position.y=0.17;g.add(sh);
 const nk=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.06,8),bodyMat);nk.position.y=0.24;g.add(nk);
 const capCol=def.id==='sauce_ketchup'?0xcc0000:def.id==='sauce_mayo'?0xeeeeee:def.id==='sauce_mustard'?0xb89000:def.id==='sauce_oil'?0x886600:def.id==='hazard_bleach'?0x2244cc:def.id==='empty_bottle'?0xdddddd:0xcccc88;
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.05,8),new THREE.MeshStandardMaterial({color:capCol}));cap.position.y=0.29;g.add(cap);
 const lab=TEX['lab_'+def.variant];
 if(lab&&def.id!=='empty_bottle'){const lm=new THREE.Mesh(new THREE.CylinderGeometry(0.093,0.093,0.13,10,1,true),new THREE.MeshStandardMaterial({map:lab,side:THREE.DoubleSide}));lm.position.y=-0.01;g.add(lm);}
 g.userData={isItem:true};return g;}

export class DebugLogger{constructor(){this.entries=[];this.listeners=[];this.t0=performance.now();this.throttle={};}
 log(c,m){const t=((performance.now()-this.t0)/1000).toFixed(2);const l='['+t+']['+c+'] '+m;this.entries.push(l);if(this.entries.length>20000)this.entries.splice(0,this.entries.length-20000);for(const f of this.listeners)f(l);console.log(l);}
 info(m){this.log('INFO',m);}warn(m){this.log('WARN',m);}error(m){this.log('ERR',m);console.error(m);}
 phys(m){this.log('PHYS',m);}input(m){this.log('INPUT',m);}
 throttled(k,c,m,cd){const n=performance.now();if(!this.throttle[k]||n-this.throttle[k]>(cd||0.5)*1000){this.throttle[k]=n;this.log(c,m);return true;}return false;}
 download(){const b=new Blob([this.entries.join('\n')],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='buterbrod_log.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}}
export const LOGGER=new DebugLogger();

export class SoundSystem{constructor(){this.ctx=null;this.enabled=false;this.muted=false;this.step=0;this.nextNote=0;}
 init(){if(this.ctx)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC){this.enabled=false;return;}
   this.ctx=new AC();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
   this.master=this.ctx.createGain();this.master.gain.value=0.5;this.master.connect(this.ctx.destination);
   this.sfx=this.ctx.createGain();this.sfx.gain.value=0.9;this.sfx.connect(this.master);
   this.mus=this.ctx.createGain();this.mus.gain.value=0.2;this.mus.connect(this.master);
   const len=this.ctx.sampleRate;this.noiseBuf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
   const d=this.noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
   this.enabled=true;this.nextNote=this.ctx.currentTime+0.1;
   setInterval(()=>{if(!this.ctx||this.muted)return;while(this.nextNote<this.ctx.currentTime+0.25){this.musicStep(this.step,this.nextNote);this.step=(this.step+1)%64;this.nextNote+=0.21;}},90);
  }catch(e){this.enabled=false;LOGGER.warn('звук не поднялся: '+e.message);}}
 setMuted(m){this.muted=m;if(this.master)this.master.gain.value=m?0:0.5;}
 musicStep(s,t){const root=110;const bass=[0,0,7,0,5,0,7,0];const lead=[12,15,19,15,17,15,12,10,12,15,19,22,19,15,12,7];
  if(s%2===0)this.tone(root*Math.pow(2,bass[(s/2)%8]/12),t,0.2,'triangle',0.5,this.mus);
  this.tone(root*2*Math.pow(2,lead[s%16]/12),t,0.17,'square',0.16,this.mus,6);}
 tone(f,t,dur,type,vol,dest,vib){if(!this.ctx)return;const o=this.ctx.createOscillator();o.type=type||'sine';o.frequency.value=f;
  const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.012);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(dest||this.sfx);
  if(vib){const l=this.ctx.createOscillator();l.frequency.value=vib;const lg=this.ctx.createGain();lg.gain.value=f*0.03;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur);}
  o.start(t);o.stop(t+dur+0.05);}
 noise(t,dur,vol,freq,dest,type){if(!this.ctx)return;const src=this.ctx.createBufferSource();src.buffer=this.noiseBuf;src.loop=true;
  const f=this.ctx.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=1;
  const g=this.ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(dest||this.sfx);src.start(t);src.stop(t+dur+0.05);}
 play(name,delay){if(!this.enabled||this.muted||!this.ctx)return;const t=this.ctx.currentTime+(delay||0);
  switch(name){
   case 'step':this.noise(t,0.06,0.12,500+Math.random()*400,this.sfx,'lowpass');break;
   case 'murmur':this.noise(t,0.6,0.05,400);this.noise(t+0.2,0.4,0.04,600);break;
   case 'swing':this.noise(t,0.12,0.25,1200);break;
   case 'cut':this.noise(t,0.06,0.5,3000,this.sfx,'highpass');this.tone(220,t,0.08,'square',0.3);break;
   case 'splat':this.tone(80,t,0.25,'sine',0.7);this.noise(t,0.2,0.5,400,this.sfx,'lowpass');break;
   case 'spray':this.noise(t,0.35,0.5,5000,this.sfx,'highpass');break;
   case 'fart':{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(42,t+0.65);
     const g=this.ctx.createGain();g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.95,t+0.05);g.gain.exponentialRampToValueAtTime(0.001,t+0.75);
     const l=this.ctx.createOscillator();l.type='sine';l.frequency.value=27;const lg=this.ctx.createGain();lg.gain.value=35;l.connect(lg);lg.connect(o.frequency);
     o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+0.85);l.start(t);l.stop(t+0.85);this.noise(t,0.5,0.3,180,this.sfx,'lowpass');break;}
   case 'vomit':{for(let i=0;i<5;i++){this.noise(t+i*0.12,0.1,0.4,300+Math.random()*300,this.sfx,'lowpass');this.tone(150-i*15,t+i*0.12,0.1,'sawtooth',0.2);}break;}
   case 'knock':this.tone(140,t,0.08,'sine',0.7);this.tone(120,t+0.18,0.08,'sine',0.7);this.tone(140,t+0.36,0.08,'sine',0.6);break;
   case 'creak':{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(300,t);o.frequency.linearRampToValueAtTime(170,t+0.5);
     const g=this.ctx.createGain();g.gain.setValueAtTime(0.09,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+0.6);break;}
   case 'cash':this.tone(880,t,0.1,'square',0.3);this.tone(1320,t+0.08,0.22,'square',0.3);break;
   case 'combo':this.tone(660,t,0.08,'square',0.3);this.tone(880,t+0.08,0.08,'square',0.3);this.tone(1320,t+0.16,0.25,'square',0.35);break;
   case 'deny':this.tone(200,t,0.15,'square',0.3);this.tone(150,t+0.15,0.22,'square',0.3);break;
   case 'boom':this.tone(55,t,0.9,'sine',1.0);this.noise(t,0.7,0.8,300,this.sfx,'lowpass');break;
   case 'squeak':this.tone(1800+Math.random()*600,t,0.08,'sine',0.25,this.sfx,20);break;
   case 'meow':{const o=this.ctx.createOscillator();o.type='triangle';o.frequency.setValueAtTime(500,t);o.frequency.linearRampToValueAtTime(720,t+0.15);o.frequency.linearRampToValueAtTime(400,t+0.4);
     const g=this.ctx.createGain();g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.3,t+0.05);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+0.5);break;}
   case 'buzz':this.noise(t,0.3,0.18,220);break;
   case 'beep':this.tone(1000,t,0.06,'square',0.25);break;
   case 'glass':for(let i=0;i<8;i++)this.tone(2000+Math.random()*3000,t+i*0.02,0.08,'triangle',0.2);this.noise(t,0.3,0.4,4000,this.sfx,'highpass');break;
   case 'boing':{const o=this.ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(600,t+0.15);o.frequency.exponentialRampToValueAtTime(100,t+0.4);
     const g=this.ctx.createGain();g.gain.setValueAtTime(0.4,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+0.5);break;}
   case 'bonk':this.tone(90,t,0.15,'sine',0.8);this.noise(t,0.1,0.4,500,this.sfx,'lowpass');break;
   case 'siren':{const o=this.ctx.createOscillator();o.type='square';const g=this.ctx.createGain();g.gain.value=0.12;o.connect(g);g.connect(this.sfx);
     o.frequency.setValueAtTime(600,t);for(let i=0;i<6;i++)o.frequency.linearRampToValueAtTime(i%2?600:900,t+0.3*i+0.3);o.start(t);o.stop(t+2);break;}
   case 'flush':this.noise(t,0.8,0.4,800);this.tone(200,t+0.2,0.5,'sine',0.2);break;
   case 'pickup':this.tone(600,t,0.06,'triangle',0.25);this.tone(900,t+0.05,0.08,'triangle',0.2);break;
   case 'drop':this.tone(300,t,0.08,'triangle',0.3);break;
   case 'eat':this.noise(t,0.15,0.4,700,this.sfx,'lowpass');this.tone(200,t,0.1,'sawtooth',0.2);break;
   case 'light':this.tone(1200,t,0.03,'square',0.15);break;
   case 'wipe':this.noise(t,0.2,0.3,900);break;
   case 'perfect':this.tone(700,t,0.08,'triangle',0.3);this.tone(1050,t+0.08,0.15,'triangle',0.3);break;}}}
export const SOUND=new SoundSystem();