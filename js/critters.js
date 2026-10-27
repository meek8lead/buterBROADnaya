// ==== CRITTERS: лампы, пыль, мухи, крысы, гнёзда, кот, огонь ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, GAME_DATA, ITEM_DEFS, Utils } from './config.js';
import { TEX, LOGGER, SOUND } from './media.js';
import { _v1, _v2, _fwd } from './engine.js';

export class LampSystem{constructor(scene){this.scene=scene;this.lamps=[];this.pool=[];this.assignT=0;
 for(const p of CONFIG.LAMP_POS){const mat=new THREE.MeshStandardMaterial({color:0xdddddd,emissive:0xffffcc,emissiveIntensity:1});
  const fix=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.35),mat);fix.position.set(p[0],p[1],p[2]);scene.add(fix);
  const coneMat=new THREE.MeshBasicMaterial({color:0xfff0cc,transparent:true,opacity:0.05,side:THREE.DoubleSide,depthWrite:false});
  const cone=new THREE.Mesh(new THREE.ConeGeometry(1.5,3.2,10,1,true),coneMat);cone.position.set(p[0],p[1]-1.9,p[2]);scene.add(cone);
  this.lamps.push({fix,mat,cone,coneMat,pos:new THREE.Vector3(p[0],p[1]-0.2,p[2]),base:2.6,mode:'on',t:Utils.rand(5,18),light:null});}
 for(let i=0;i<4;i++){const l=new THREE.PointLight(0xfff2dd,2.6,17,1.15);scene.add(l);this.pool.push(l);}}
 assign(pp){const sorted=this.lamps.slice().sort((a,b)=>a.pos.distanceToSquared(pp)-b.pos.distanceToSquared(pp));
  for(const l of this.lamps)l.light=null;
  for(let i=0;i<this.pool.length&&i<sorted.length;i++){sorted[i].light=this.pool[i];this.pool[i].position.copy(sorted[i].pos);}}
 update(dt,pp){this.assignT-=dt;if(this.assignT<=0){this.assignT=0.4;this.assign(pp);}
  for(const L of this.lamps){L.t-=dt;
   if(L.mode==='on'){L.mat.emissiveIntensity=1;if(L.light)L.light.intensity=L.base;L.cone.visible=true;L.coneMat.opacity=0.05;
    if(L.t<=0){if(Math.random()<0.55){L.mode='flicker';L.t=Utils.rand(0.4,1.4);}else{L.mode='off';L.t=Utils.rand(2,4);SOUND.play('light');}}}
   else if(L.mode==='flicker'){const on=Math.random()<0.55;L.mat.emissiveIntensity=on?1:0.08;if(L.light)L.light.intensity=on?L.base:0.15;L.cone.visible=on;L.coneMat.opacity=on?0.04:0;
    if(L.t<=0){L.mode='on';L.t=Utils.rand(6,20);}}
   else{L.mat.emissiveIntensity=0.04;if(L.light)L.light.intensity=0;L.cone.visible=false;
    if(L.t<=0){L.mode='on';L.t=Utils.rand(6,20);SOUND.play('light');}}}}
 dispose(){for(const L of this.lamps){this.scene.remove(L.fix);this.scene.remove(L.cone);}for(const l of this.pool)this.scene.remove(l);this.lamps=[];}}

export class DustSystem{constructor(scene){this.scene=scene;this.motes=[];this.mat=new THREE.SpriteMaterial({color:0xffffee,transparent:true,opacity:0.12,depthWrite:false});
 for(let i=0;i<16;i++){const s=new THREE.Sprite(this.mat);s.scale.setScalar(Utils.rand(0.03,0.07));s.position.set(Utils.rand(-9,9),Utils.rand(0.5,3.5),Utils.rand(-14,14));scene.add(s);this.motes.push({s,vy:Utils.rand(0.02,0.06),ph:Utils.rand(0,6)});}}
 update(dt,t){for(const m of this.motes){m.s.position.y+=m.vy*dt;m.s.position.x+=Math.sin(t*0.5+m.ph)*0.002;if(m.s.position.y>3.6)m.s.position.y=0.4;}}
 dispose(){for(const m of this.motes)this.scene.remove(m.s);}}

export class FlySystem{constructor(scene,game){this.scene=scene;this.game=game;this.flies=[];this.retargetT=0;this.buzzT=3;for(let i=0;i<5;i++)this.add();}
 add(){const m=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6),new THREE.MeshStandardMaterial({color:0x222211}));m.add(b);
  const w=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.005,0.05),new THREE.MeshStandardMaterial({color:0x999988,transparent:true,opacity:0.6}));w.position.y=0.035;m.add(w);
  m.position.set(Utils.rand(-8,8),Utils.rand(1.2,2.4),Utils.rand(-13,13));this.scene.add(m);
  this.flies.push({mesh:m,wing:w,x:m.position.x,y:m.position.y,z:m.position.z,tx:0,ty:1.8,tz:0});}
 retarget(){const g=this.game;const pts=[];
  for(const p of g.puddleSystem.puddles)pts.push({x:p.x,y:1.1,z:p.z});
  pts.push({x:g.nestSystem.pos.x,y:0.8,z:g.nestSystem.pos.z});
  for(const d of g.ragdollFactory.dolls)pts.push({x:d.body.position.x,y:1,z:d.body.position.z});
  pts.push({x:CONFIG.TOILET_POS.x,y:1.5,z:CONFIG.TOILET_POS.z});
  if(!pts.length)pts.push({x:Utils.rand(-6,6),y:1.8,z:Utils.rand(-6,6)});
  for(const f of this.flies){const p=Utils.pick(pts);f.tx=p.x+Utils.rand(-0.7,0.7);f.ty=p.y+Utils.rand(0.2,1.0);f.tz=p.z+Utils.rand(-0.7,0.7);}}
 update(dt){this.retargetT-=dt;if(this.retargetT<=0){this.retargetT=Utils.rand(3,6);this.retarget();}
  this.buzzT-=dt;if(this.buzzT<=0){this.buzzT=Utils.rand(2,5);const pp=this.game.player.body.position;
   for(const f of this.flies){if(Utils.dist2(f.x,f.z,pp.x,pp.z)<4){SOUND.play('buzz');break;}}}
  for(const f of this.flies){const dx=f.tx-f.x,dy=f.ty-f.y,dz=f.tz-f.z;const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;const sp=2.4;
   f.x+=dx/d*sp*dt+Utils.rand(-0.03,0.03);f.y+=dy/d*sp*dt+Utils.rand(-0.03,0.03);f.z+=dz/d*sp*dt+Utils.rand(-0.03,0.03);
   f.mesh.position.set(f.x,f.y,f.z);f.wing.rotation.y+=dt*70;f.mesh.rotation.y=Math.atan2(dx,dz);}}
 kill(f){this.scene.remove(f.mesh);this.flies=this.flies.filter(x=>x!==f);}
 dispose(){for(const f of this.flies.slice())this.kill(f);}}

export class RatSystem{constructor(s,p,g){this.scene=s;this.physics=p;this.game=g;this.rats=[];this.ambientT=Utils.rand(35,60);this.headRat=null;this.maxRats=4;}
 buildMesh(isRat,size){const g=new THREE.Group();const col=isRat?0x8a7a66:0x4a2a12;const mat=new THREE.MeshStandardMaterial({color:col});
  const body=new THREE.Mesh(new THREE.SphereGeometry(size*0.5,10,10),mat);body.scale.set(isRat?0.8:1.1,isRat?0.75:0.4,isRat?1.4:1.6);g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(size*0.34,10,10),mat);head.position.set(0,size*0.14,size*0.85);g.add(head);
  const sn=new THREE.Mesh(new THREE.ConeGeometry(size*0.15,size*0.35,8),mat);sn.rotation.x=Math.PI/2;sn.position.set(0,size*0.08,size*1.2);g.add(sn);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(size*0.07,6,6),new THREE.MeshStandardMaterial({color:0xff6688}));nose.position.set(0,size*0.08,size*1.38);g.add(nose);
  if(isRat){for(const sx of[1,-1]){const e=new THREE.Mesh(new THREE.SphereGeometry(size*0.2,8,8),mat);e.scale.set(1,1,0.4);e.position.set(sx*size*0.22,size*0.4,size*0.7);g.add(e);}
   const t=new THREE.Mesh(new THREE.CylinderGeometry(size*0.05,size*0.02,size*1.3,6),mat);t.rotation.x=1.9;t.position.set(0,size*0.1,-size*1.1);g.add(t);
   for(const sx of[1,-1])for(const sz of[0.5,-0.5]){const l=new THREE.Mesh(new THREE.CapsuleGeometry(size*0.07,size*0.2,4,5),mat);l.position.set(sx*size*0.3,-size*0.25,sz*size*0.6);g.add(l);}}
  else{for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(size*0.03,size*0.03,size*0.5,4),mat);l.rotation.z=Math.PI/2.4;l.position.set((i%2?1:-1)*size*0.5,-size*0.05,(i>>1)*size*0.6-size*0.5);g.add(l);}}
  const ew=new THREE.MeshStandardMaterial({color:0xffffff}),eS=size*0.22,pS=eS*0.55;const pupils=[];
  for(const sx of[1,-1]){const e=new THREE.Mesh(new THREE.SphereGeometry(eS,8,8),ew);e.position.set(sx*size*0.16,size*0.28,size*1.0);const p=new THREE.Mesh(new THREE.SphereGeometry(pS,6,6),new THREE.MeshStandardMaterial({color:0}));p.position.set(0,0,eS*0.6);e.add(p);g.add(e);pupils.push(p);}
  return{group:g,p1:pupils[0],p2:pupils[1],eS};}
 spawn(type,x,z){const isRat=type==='rat',size=isRat?0.34:0.16;const b=this.buildMesh(isRat,size);this.scene.add(b.group);
  const bc=new CANNON.Body({mass:isRat?0.8:0.3,material:this.physics.defaultMaterial,fixedRotation:true,linearDamping:0.25,angularDamping:0.9});bc.allowSleep=true;
  bc.addShape(new CANNON.Box(new CANNON.Vec3(size*0.4,size*0.3,size*0.7)));bc.position.set(Utils.clamp(x,-8.8,8.8),0.25,Utils.clamp(z,-14.2,14.2));bc.label='rat';this.physics.addBody(bc,null);
  this.rats.push({type,mesh:b.group,p1:b.p1,p2:b.p2,eS:b.eS,jT:0,jx:0,body:bc,bodyInWorld:true,x:bc.position.x,z:bc.position.z,tx:bc.position.x,tz:bc.position.z,timer:0,cd:0,onHead:false,struggle:0,state:'wander',hideT:0,foodTarget:null,fedCd:0,grow:0,wall:null,wallT:Utils.rand(3,8),carry:null,carryMesh:null});
  this.game.emitFaceEvent('scared',x,z,6);if(isRat)SOUND.play('squeak');}
 spawnAmbient(){if(this.rats.length>=this.maxRats)return;const e=Utils.randInt(0,3);let x,z;
  if(e===0){x=Utils.rand(-8,8);z=-13.5;}else if(e===1){x=Utils.rand(-8,8);z=13.5;}else if(e===2){x=-8.8;z=Utils.rand(-13,13);}else{x=8.8;z=Utils.rand(-13,13);}
  this.spawn(Math.random()<0.22?'rat':'cockroach',x,z);}
 nearestHide(x,z){let b=CONFIG.HIDESPOTS[0],bd=1e9;for(const h of CONFIG.HIDESPOTS){const d=Utils.dist2(h.x,h.z,x,z);if(d<bd){bd=d;b=h;}}return b;}
 removeRat(r){ if(r.carry){ this.game.spawnItem(r.carry,{x:r.x,y:0.3,z:r.z}); r.carry=null; }
  if(r.carryMesh)r.mesh.remove(r.carryMesh);
  this.scene.remove(r.mesh);if(r.bodyInWorld)this.physics.removeBody(r.body);this.rats=this.rats.filter(x=>x!==r);if(this.headRat===r)this.headRat=null;}
 splat(r){const px=r.body.position.x,pz=r.body.position.z;const carry=r.carry;this.removeRat(r);
  const it=this.game.spawnItem(r.type==='rat'?'dead_rat':'dead_roach',{x:px,y:0.15,z:pz});it.body.velocity.set(Utils.rand(-1,1),2,Utils.rand(-1,1));
  this.game.toast('РАЗМАЗАНО!'+(carry?' Добыча выпала!':''));GAME_DATA.stats.rats++;this.game.lifeBump('rats');SOUND.play('splat');}
 killRoach(r){const px=r.x,pz=r.z;this.removeRat(r);this.game.spawnItem('dead_roach',{x:px,y:0.1,z:pz});GAME_DATA.stats.rats++;this.game.lifeBump('rats');SOUND.play('splat');}
 scare(r){r.timer=3;r.wall=null;r.tx=Utils.rand(-8,8);r.tz=Utils.rand(-13,13);SOUND.play('squeak');}
 attachHead(r){this.headRat=r;r.onHead=true;r.struggle=0;r.wall=null;r.state='wander';if(r.bodyInWorld){this.physics.removeBody(r.body);r.bodyInWorld=false;}
  this.game.unlockAch('head_rat');
  this.game.toast('КРЫСА НА ГОЛОВЕ!! Долби ЛКМ!');this.game.portrait.rig.setMood('scared',999);this.game.portrait.setHeadRat(true);this.game.addMeter('shame',10,'крыса на голове');SOUND.play('squeak');}
 detachHead(t){const r=this.headRat;if(!r)return;this.headRat=null;r.onHead=false;r.struggle=0;const m=r.mesh.position;
  r.body.position.set(m.x,m.y,m.z);r.body.velocity.set(Utils.rand(-2,2),-1,Utils.rand(-2,2));if(!r.bodyInWorld){this.physics.addBody(r.body,null);r.bodyInWorld=true;}r.body.type=CANNON.Body.DYNAMIC;
  this.scare(r);this.game.portrait.rig.setMood('happy',2);this.game.portrait.setHeadRat(false);this.game.toast(t?'СБРОСИЛ КРЫСУ!':'Крыса слезла.');}
 findFood(r){ if(GAME_DATA.patron)return null;
  let best=null,bs=-1e9;for(const it of this.game.items){if(!it.mesh.visible||it.placed||it.carriedBy||this.game.holdSystem.heldEntity===it)continue;const id=it.def.id;let sc=-1;
  if(id==='ing_cheese')sc=100;else if(['ing_sausage','ing_cucumber','ing_tomato','ing_egg','ing_onion','ing_cutlet_raw','slice_sausage','slice_cucumber','slice_tomato','slice_onion'].indexOf(id)>=0)sc=10;if(sc<0)continue;const d=Utils.dist2(it.body.position.x,it.body.position.z,r.x,r.z);const s=sc*1000-d;if(s>bs){bs=s;best=it;}}return best;}
 stealFood(r,item){ const defId=item.def.id;
  this.game.unplaceEntity(item);this.game.interactSystem.unregister(item.mesh);this.game.removeHighlightSafe(item);
  this.game.items=this.game.items.filter(i=>i!==item);item.dispose();
  r.carry=defId;r.state='carry';r.foodTarget=null;r.fedCd=Utils.rand(20,35);
  const cm=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),new THREE.MeshStandardMaterial({color:ITEM_DEFS[defId]?ITEM_DEFS[defId].color:0xffd24a}));
  cm.position.set(0,0.05,0.3);r.mesh.add(cm);r.carryMesh=cm;
  const np=this.game.nestSystem.pos;r.tx=np.x;r.tz=np.z;
  this.game.toast('КРЫСА СТЫРИЛА '+(ITEM_DEFS[defId]?ITEM_DEFS[defId].name:defId)+' И ТАЩИТ В ГНЕЗДО! Перехвати!');SOUND.play('squeak');}
 eatFood(r,item){const id=item.def.id;this.game.unplaceEntity(item);this.game.interactSystem.unregister(item.mesh);this.game.removeHighlightSafe(item);this.game.items=this.game.items.filter(i=>i!==item);item.dispose();
  r.fedCd=Utils.rand(15,30);r.state='wander';r.foodTarget=null;r.grow=(r.grow||0)+1;r.mesh.scale.setScalar(1+r.grow*0.22);r.body.mass+=0.3;
  this.game.toast((r.type==='rat'?'КРЫСА':'ТАРАКАН')+' сожрал(а) '+(ITEM_DEFS[id]?ITEM_DEFS[id].name:id)+' и ПОЖИРНEЛ(а)!');SOUND.play('eat');}
 wallPos(w,u,v){if(w.ax==='zy')return new THREE.Vector3(w.p,v,u);return new THREE.Vector3(u,v,w.p);}
 update(dt){this.ambientT-=dt;if(this.ambientT<=0){this.ambientT=Utils.rand(35,60)*(GAME_DATA.upgrades.trap?1.5:1);this.spawnAmbient();}
  const pp=this.game.player.body.position;const np=this.game.nestSystem.pos;
  if(!this.headRat){for(const r of this.rats){if(r.onHead)continue;if(Utils.dist2(r.x,r.z,pp.x,pp.z)<1.5&&Math.random()<dt*0.3){this.attachHead(r);break;}}}
  for(const r of this.rats){
   if(r.onHead){const cam=this.game.camera;const f=_fwd;cam.getWorldDirection(f);f.y=0;if(f.lengthSq()<0.001)f.set(0,0,-1);f.normalize();
    const rt=_v1.crossVectors(f,_upLocal);const wig=Math.sin(performance.now()*0.025)*(0.12+r.struggle*0.1);const cp=cam.position;
    r.mesh.position.set(cp.x+f.x*0.42+rt.x*wig,cp.y+0.34+Math.abs(wig)*0.06,cp.z+f.z*0.42+rt.z*wig);r.mesh.rotation.y=Math.atan2(-f.x,-f.z);r.mesh.rotation.z=wig*0.6;continue;}
   r.timer-=dt;r.cd-=dt;r.jT-=dt;r.fedCd-=dt;
   if(r.jT<=0){r.jT=Utils.rand(0.3,1.2);r.jx=Utils.rand(-0.5,0.5);}
   const lim=r.eS*0.4,t1=Utils.clamp(r.jx*r.eS*0.8,-lim,lim);
   r.p1.position.x+=(t1-r.p1.position.x)*Math.min(1,dt*10);r.p2.position.x+=(-t1-r.p2.position.x)*Math.min(1,dt*10);
   r.p1.position.x=Utils.clamp(r.p1.position.x,-lim,lim);r.p2.position.x=Utils.clamp(r.p2.position.x,-lim,lim);
   if(r.type==='cockroach'){r.wallT-=dt;
    if(!r.wall&&r.wallT<=0&&Math.random()<0.6){r.wall=Utils.pick(CONFIG.WALLS);r.wallT=Utils.rand(4,9);r.body.type=CANNON.Body.KINEMATIC;r.tx=Utils.rand(-12,12);r.tz=Utils.rand(0.4,3.0);}
    else if(r.wall&&r.wallT<=0){r.wall=null;r.wallT=Utils.rand(4,9);r.body.type=CANNON.Body.DYNAMIC;r.timer=0;}}
   if(r.wall){const w=r.wall;const dx=r.tx-r.x,dz=r.tz-r.z;const d=Math.sqrt(dx*dx+dz*dz);
    if(d>0.1){const sp=2.6;r.x+=dx/d*sp*dt;r.z+=dz/d*sp*dt;}
    r.x=Utils.clamp(r.x,w.ax==='zy'?-13.8:-8.8,w.ax==='zy'?13.8:8.8);r.z=Utils.clamp(r.z,0.3,3.2);
    const pos=this.wallPos(w,r.x,r.z);r.body.position.copy(pos);r.mesh.position.copy(pos);
    r.mesh.up.set(w.n[0],w.n[1],w.n[2]);
    const dir=_v2.set(dx,0,dz);if(w.ax==='zy')dir.set(0,dz,dx);else dir.set(dx,dz,0);
    if(dir.lengthSq()>0.001)r.mesh.lookAt(pos.x+dir.x,pos.y+dir.y,pos.z+dir.z);
    continue;}
   if(r.body.type!==CANNON.Body.DYNAMIC)r.body.type=CANNON.Body.DYNAMIC;
   r.x=r.body.position.x;r.z=r.body.position.z;const dp=Math.sqrt(Utils.dist2(r.x,r.z,pp.x,pp.z));
   if(r.state==='carry'){ r.tx=np.x;r.tz=np.z;
    if(Utils.dist2(r.x,r.z,np.x,np.z)<0.9){ const id=r.carry;r.carry=null;if(r.carryMesh){r.mesh.remove(r.carryMesh);r.carryMesh=null;}
     this.game.toast('Крыса УТАЩИЛА '+(ITEM_DEFS[id]?ITEM_DEFS[id].name:id)+' в гнездо! Концы в воду.');r.state='wander';r.fedCd=Utils.rand(20,35);} }
   else if(r.type==='rat'){
    if(dp<4.5){if(r.state!=='flee'&&r.state!=='hide'){r.state='flee';r.foodTarget=null;const h=this.nearestHide(r.x,r.z);r.tx=h.x;r.tz=h.z;}}
    else if(r.state==='flee'){r.state='hide';r.hideT=Utils.rand(1,3);}
    else if(r.state==='hide'){r.hideT-=dt;r.body.velocity.x*=0.6;r.body.velocity.z*=0.6;r.mesh.position.copy(r.body.position);if(r.hideT<=0&&dp>4.5)r.state='wander';continue;}
    else if(r.state==='wander'||r.state==='steal'){
     if(r.fedCd<=0&&Math.random()<dt*0.25){const f=this.findFood(r);if(f){r.state='steal';r.foodTarget=f;}}
     if(r.state==='steal'){const f=r.foodTarget;if(!f||this.game.items.indexOf(f)<0||!f.mesh.visible){r.state='wander';r.foodTarget=null;}
      else{r.tx=f.body.position.x;r.tz=f.body.position.z;if(Utils.dist2(r.x,r.z,r.tx,r.tz)<0.5){ if(f.def.id==='ing_cheese')this.stealFood(r,f); else this.eatFood(r,f); r.tx=Utils.rand(-8,8);r.tz=Utils.rand(-13,13);}}}
     else if(r.timer<=0){r.timer=Utils.rand(1.5,4);r.tx=Utils.rand(-8,8);r.tz=Utils.rand(-13,12);}}}
   else{if(r.timer<=0){r.timer=Utils.rand(1,3);r.tx=Utils.rand(-8,8);r.tz=Utils.rand(-13,12);}}
   const dx=r.tx-r.x,dz=r.tz-r.z,d=Math.sqrt(dx*dx+dz*dz);const base=r.type==='rat'?2.2:3.4;const sp=(r.state==='flee')?base*2.4:(r.state==='carry'?base*1.3:base);
   if(d>0.1){r.body.velocity.x=(dx/d)*sp;r.body.velocity.z=(dz/d)*sp;r.body.wakeUp();r.mesh.rotation.y=Math.atan2(dx,dz);r.mesh.up.set(0,1,0);}else{r.body.velocity.x*=0.8;r.body.velocity.z*=0.8;}
   r.mesh.position.copy(r.body.position);
   if(r.cd<=0){ if(!GAME_DATA.patron){
     for(const s of this.game.sandwiches){if(this.game.holdSystem.heldEntity===s)continue;if(Utils.dist2(s.body.position.x,s.body.position.z,r.x,r.z)<0.9){r.cd=10;s.contaminate(r.type);this.scare(r);break;}}
     const ab=CONFIG.ASSEMBLY_POS;if(this.game.sandwichBuilder.stack.length>0&&Utils.dist2(ab.x,ab.z,r.x,r.z)<1.2){r.cd=10;this.game.sandwichBuilder.contaminate(r.type);this.scare(r);}}
    for(const c of this.game.queueSystem.clients){if(Utils.dist2(c.group.position.x,c.group.position.z,r.x,r.z)<1.44){r.cd=8;this.game.queueSystem.panicClient(c);break;}}}}}
 dispose(){for(const r of this.rats.slice())this.removeRat(r);this.rats=[];this.headRat=null;}}
const _upLocal=new THREE.Vector3(0,1,0);

export class NestSystem{constructor(scene,game){this.scene=scene;this.game=game;
 this.pos=new THREE.Vector3(0,0.25,0);this.hp=3;this.alive=false;this.t=Utils.rand(25,45);this.respawnT=0;this.group=null;
 this.build();this.relocate(true);}
 build(){this.group=new THREE.Group();const m=new THREE.MeshStandardMaterial({map:TEX.wood,color:0x8a7a5a});
  for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(Utils.rand(0.25,0.45),8,8),m);s.position.set(Utils.rand(-0.4,0.4),Utils.rand(0,0.2),Utils.rand(-0.4,0.4));this.group.add(s);}
  this.group.position.copy(this.pos);this.scene.add(this.group);}
 relocate(first){const opts=CONFIG.NEST_SPOTS.filter(s=>first||Utils.dist2(s.x,s.z,this.pos.x,this.pos.z)>9);
  const s=Utils.pick(opts.length?opts:CONFIG.NEST_SPOTS);
  this.pos.set(s.x,0.25,s.z);if(this.group)this.group.position.copy(this.pos);
  this.hp=3;this.alive=true;this.t=Utils.rand(25,45);if(this.group)this.group.visible=true;
  LOGGER.info('Гнездо крыс обосновалось в ('+s.x+','+s.z+')');}
 reset(){this.relocate(false);}
 hit(){if(!this.alive)return false;this.hp--;this.group.rotation.z=Utils.rand(-0.3,0.3);SOUND.play('bonk');
  if(this.hp<=0){this.alive=false;this.group.visible=false;this.respawnT=Utils.rand(60,120);
   for(let i=0;i<2;i++)this.game.spawnItem('dead_rat',{x:this.pos.x+Utils.rand(-0.5,0.5),y:0.3,z:this.pos.z+Utils.rand(-0.5,0.5)});
   this.game.toast('ГНЕЗДО РАЗОРЁНО! +2 репы. Крысы ищут новое место...');this.game.addRep(2,'гнездо');}
  else this.game.toast('Гнездо трещит! Ещё удар ('+this.hp+').');return true;}
 update(dt){if(this.game.state!=='play')return;
  if(!this.alive){this.respawnT-=dt;if(this.respawnT<=0){this.relocate(false);this.game.toast('Крысы СВИЛИ новое гнездо где-то! Ищи кучу веток!');SOUND.play('squeak');}return;}
  this.t-=dt;if(this.t<=0){this.t=Utils.rand(30,50)*(GAME_DATA.upgrades.trap?1.6:1);if(this.game.ratSystem.rats.length<4)this.game.ratSystem.spawn('rat',this.pos.x,this.pos.z);}}
 dispose(){if(this.group)this.scene.remove(this.group);}}

export class CatSystem{constructor(s,g){this.scene=s;this.game=g;this.cat=null;this.mischiefT=Utils.rand(8,16);}
 spawn(){if(this.cat)return;const g=new THREE.Group();const bl=new THREE.MeshStandardMaterial({color:0x111111});const wh=new THREE.MeshStandardMaterial({color:0xeeeeee});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,10),bl);body.scale.set(0.8,0.7,1.4);g.add(body);
  const ch=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,8),wh);ch.position.set(0,-0.08,0.25);g.add(ch);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(0.2,10,10),bl);hd.position.set(0,0.12,0.42);g.add(hd);
  const mz=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,8),wh);mz.position.set(0,0.06,0.56);g.add(mz);
  for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.14,4),bl);e.position.set(sx*0.12,0.3,0.4);g.add(e);}
  const eg=new THREE.MeshStandardMaterial({color:0x66ff66});for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6),eg);e.position.set(sx*0.08,0.16,0.58);g.add(e);}
  const tl=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.6,6),bl);tl.rotation.x=1.2;tl.position.set(0,0.15,-0.5);g.add(tl);
  g.position.set(CONFIG.ENTRY_DOOR.x,0,14);this.scene.add(g);
  this.cat={mesh:g,x:CONFIG.ENTRY_DOOR.x,z:14,tx:0,tz:0,timer:0,carry:false,carryMesh:null,hunger:30,warned:false,state:'ok'};
  this.game.toast('КОТ ТУКСЕДО доставлен! Корми его крысами (E с трупом), иначе УЙДЁТ.');this.game.emitFaceEvent('happy',CONFIG.ENTRY_DOOR.x,14,10);SOUND.play('meow');}
 feed(){const c=this.cat;if(!c)return;c.hunger=Math.max(0,c.hunger-45);c.warned=false;this.game.lifeBump('fed');SOUND.play('meow');
  this.game.toast('Кот сожрал крысу и доволен! Мурчит как трактор.');}
 update(dt){const c=this.cat;if(!c)return;c.timer-=dt;this.mischiefT-=dt;c.hunger+=dt*0.5;
  if(c.hunger>70&&!c.warned){c.warned=true;this.game.toast('Кот ГОЛОДЕН и смотрит осуждающе! Скорми ему крысу (E с трупом).');}
  if(c.hunger>95&&c.state!=='leave'){c.state='leave';this.game.toast('Кот ОБИДЕЛСЯ и уходит в другую столовую...');}
  if(c.state==='leave'){const ex=CONFIG.EXIT_DOOR;const dx=ex.x-c.x,dz=ex.z-c.z;const d=Math.sqrt(dx*dx+dz*dz);
   if(d<1){this.scene.remove(c.mesh);this.cat=null;return;}
   c.x+=dx/d*3*dt;c.z+=dz/d*3*dt;c.mesh.rotation.y=Math.atan2(dx,dz);c.mesh.position.set(c.x,0.25,c.z);return;}
  const rats=this.game.ratSystem.rats;let target=null,bd=1e9;
  for(const r of rats){if(r.onHead||r.wall)continue;const d=Utils.dist2(r.x,r.z,c.x,c.z);if(d<bd){bd=d;target=r;}}
  const hungry=c.hunger<40;const catchR=hungry?0.5:0.35;const sp=hungry?3.8:3.0;
  if(c.carry){c.tx=this.game.player.body.position.x;c.tz=this.game.player.body.position.z+1;
   if(Utils.dist2(c.x,c.z,c.tx,c.tz)<1.2){this.game.spawnItem('dead_rat',{x:c.x,y:0.2,z:c.z});this.game.toast('Кот принёс дохлую крысу. Подарок.');c.mesh.remove(c.carryMesh);c.carryMesh=null;c.carry=false;c.timer=Utils.rand(3,6);SOUND.play('meow');}}
  else if(target&&bd<25){c.tx=target.x;c.tz=target.z;if(bd<catchR*catchR){this.game.ratSystem.removeRat(target);const rm=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),new THREE.MeshStandardMaterial({color:0x8a7a66}));rm.scale.set(0.7,0.5,1.2);rm.position.set(0,0.05,0.6);c.mesh.add(rm);c.carryMesh=rm;c.carry=true;c.hunger=Math.max(0,c.hunger-15);this.game.toast('КОТ ПОЙМАЛ КРЫСУ!');SOUND.play('meow');}}
  else{if(c.timer<=0){c.timer=Utils.rand(2,5);c.tx=Utils.rand(-8,8);c.tz=Utils.rand(-6,12);}}
  if(this.mischiefT<=0){this.mischiefT=Utils.rand(12,25);const items=this.game.items.filter(i=>i.mesh.visible&&!i.placed&&!i.carriedBy&&this.game.holdSystem.heldEntity!==i);
   if(items.length){const it=Utils.pick(items);it.body.wakeUp();it.body.type=CANNON.Body.DYNAMIC;it.body.velocity.set(Utils.rand(-3,3),2,Utils.rand(-3,3));this.game.toast('Кот уронил '+it.name+'! Шкода.');}}
  const dx=c.tx-c.x,dz=c.tz-c.z,d=Math.sqrt(dx*dx+dz*dz);
  if(d>0.1){c.x+=dx/d*sp*dt;c.z+=dz/d*sp*dt;c.mesh.rotation.y=Math.atan2(dx,dz);}
  c.mesh.position.set(c.x,0.25+Math.abs(Math.sin(performance.now()*0.008))*0.05,c.z);
  for(const r of rats){if(r.wall)continue;if(Utils.dist2(r.x,r.z,c.x,c.z)<4){r.state='flee';r.wall=null;const h=this.nearestHide(r.x,r.z);r.tx=h.x;r.tz=h.z;}}}
 nearestHide(x,z){return this.game.ratSystem.nearestHide(x,z);}
 dispose(){if(this.cat){this.scene.remove(this.cat.mesh);this.cat=null;}}}

export class FireSystem{constructor(s,g){this.scene=s;this.game=g;this.fires=[];this.smoke=[];this.smokeMat=new THREE.MeshBasicMaterial({color:0x555555,transparent:true,opacity:0.35});this.sootCdP=0;}
 ignite(x,y,z,o={}){const big=!!o.big;const f=new THREE.Group();
  const c1=new THREE.Mesh(new THREE.ConeGeometry(big?0.5:0.3,big?1:0.7,8),new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:0.85}));c1.position.y=(big?1:0.7)/2;f.add(c1);
  const c2=new THREE.Mesh(new THREE.ConeGeometry(big?0.3:0.18,big?0.6:0.4,6),new THREE.MeshBasicMaterial({color:0xffcc33,transparent:true,opacity:0.8}));c2.position.y=(big?0.6:0.4)/2+0.1;f.add(c2);
  f.position.set(x,y,z);this.scene.add(f);const l=new THREE.PointLight(0xff5500,big?2.5:1.5,big?10:7);l.position.set(0,0.8,0);f.add(l);
  const n={group:f,cone:c1,light:l,x,y,z,big,t:0,spreadT:Utils.rand(5,9),isStove:!!o.isStove,smokeT:0};this.fires.push(n);this.game.emitFaceEvent('scared',x,z,8);
  if(this.fires.length>=4)this.game.unlockAch('pyro');return n;}
 extinguishNode(n){this.scene.remove(n.group);this.fires=this.fires.filter(f=>f!==n);if(n.isStove&&this.game.stoveSystem)this.game.stoveSystem.onFire=false;}
 nearestNode(x,z,r){let b=null,bd=r*r;for(const f of this.fires){const d=Utils.dist2(f.x,f.z,x,z);if(d<bd){bd=d;b=f;}}return b;}
 extinguishAt(x,z,r){const n=this.nearestNode(x,z,r);if(n){this.extinguishNode(n);return true;}return false;}
 fuelAt(x,z,r){const n=this.nearestNode(x,z,r);if(n){n.big=true;n.cone.scale.setScalar(1.6);n.light.intensity=3;this.spreadFrom(n,true);this.game.toast('ТОПЛИВО В ОГНЕ! ОГРОМНЫЙ ПОЖАР!');}}
 spreadFrom(n,b){const cap=GAME_DATA.upgrades.vent?4:7;if(this.fires.length>=cap)return;for(let i=0,c=b?2:1;i<c;i++){const a=Utils.rand(0,Math.PI*2),r=Utils.rand(1.2,2.4);const nx=n.x+Math.cos(a)*r,nz=n.z+Math.sin(a)*r;if(Math.abs(nx)<9.3&&Math.abs(nz)<14.3)this.ignite(nx,0.05,nz,{big:n.big});}}
 update(dt){this.sootCdP-=dt;const vs=GAME_DATA.upgrades.vent?2:1;
  for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.t+=dt;f.cone.scale.setScalar((f.big?1.6:1)+Math.sin(f.t*20)*0.15);f.cone.rotation.y+=dt*6;f.light.intensity=(f.big?2.5:1.5)+Math.sin(f.t*25)*0.6;f.smokeT-=dt;
   if(f.smokeT<=0&&this.smoke.length<80){f.smokeT=(f.big?0.06:0.15)*vs;const s=new THREE.Mesh(new THREE.SphereGeometry(Utils.rand(0.2,0.4),6,6),this.smokeMat);s.position.set(f.x+Utils.rand(-0.2,0.2),f.y+0.8,f.z+Utils.rand(-0.2,0.2));this.scene.add(s);this.smoke.push({mesh:s,vy:Utils.rand(0.8,1.4),life:Utils.rand(1.5,3)});}
   f.spreadT-=dt;if(f.spreadT<=0){f.spreadT=Utils.rand(6,11)*(GAME_DATA.upgrades.vent?1.7:1);this.spreadFrom(f,false);}}
  for(let i=this.smoke.length-1;i>=0;i--){const s=this.smoke[i];s.mesh.position.y+=s.vy*dt;s.mesh.scale.multiplyScalar(1+dt*0.6);s.life-=dt;s.mesh.material.opacity=Math.max(0,0.35*(s.life/3));if(s.life<=0){this.scene.remove(s.mesh);this.smoke.splice(i,1);}}
  if(this.sootCdP<=0){const pp=this.game.player.body.position;for(const f of this.fires){if(Utils.dist2(f.x,f.z,pp.x,pp.z)<6.25){this.game.portrait.rig.addSoot();this.game.addMeter('dirt',8,'копоть');this.sootCdP=2.5;break;}}}
  for(const n of this.game.npcList()){if(n.sootCd>0){n.sootCd-=dt;continue;}const np=n.group.position;for(const f of this.fires){if(Utils.dist2(f.x,f.z,np.x,np.z)<6.25){n.addSoot();n.sootCd=3;break;}}}}
 disposeAll(){this.fires.slice().forEach(f=>this.extinguishNode(f));this.smoke.slice().forEach(s=>this.scene.remove(s.mesh));this.smoke=[];}}