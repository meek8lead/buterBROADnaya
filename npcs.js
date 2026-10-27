// ==== NPCS: клиенты, регдоллы, очередь, заказы, сборка ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, GAME_DATA, ITEM_DEFS, PHRASES, NAMES, WILD_SAUCES, RAW_CUTLETS, CUTLET_WILD, PUDDLE_COLORS, Utils, computeRoute, defHeight } from './config.js';
import { aoMesh, itemMapTex, SOUND } from './media.js';
import { FaceRig } from './engine.js';

export class NPCEntity{constructor(scene,x,z,colorHex,phase){this.scene=scene;this.color=colorHex;this.prop=Utils.rand(0.9,1.2);const P=this.prop;this.fat=Utils.rand(0.9,1.35);
 this.group=new THREE.Group();this.group.position.set(x,0,z);this.routePts=[];this.stuckT=0;this.lastX=x;this.lastZ=z;this.patience=100;this.warned=false;
 this.speakerName=Utils.pick(NAMES)+' '+Utils.randInt(10,99);
 const pants=new THREE.MeshStandardMaterial({color:Utils.pick([0x333366,0x444444,0x553322])});const shirt=new THREE.MeshStandardMaterial({color:colorHex});const skin=new THREE.MeshStandardMaterial({color:0xffccaa});
 const mkLeg=s=>{const g=new THREE.Group();g.position.set(s*0.16*P,0.78*P,0);const l=new THREE.Mesh(new THREE.CapsuleGeometry(0.1*P,0.5*P,4,6),pants);l.position.y=-0.3*P;const sh=new THREE.Mesh(new THREE.SphereGeometry(0.12*P,8,8),pants);sh.position.set(0,-0.62*P,0.05);g.add(l,sh);this.group.add(g);return g;};
 this.legL=mkLeg(-1);this.legR=mkLeg(1);
 this.torso=new THREE.Mesh(new THREE.SphereGeometry(0.5,14,14),shirt);this.torso.scale.set(0.76*this.fat,0.9,0.6);this.torso.position.y=1.15*P;this.group.add(this.torso);
 const mkArm=s=>{const g=new THREE.Group();g.position.set(s*0.42*P,1.45*P,0);const a=new THREE.Mesh(new THREE.CapsuleGeometry(0.08*P,0.5*P,4,6),shirt);a.position.y=-0.3*P;const h=new THREE.Mesh(new THREE.SphereGeometry(0.1*P,8,8),skin);h.position.y=-0.62*P;g.add(a,h);this.group.add(g);return g;};
 this.armL=mkArm(-1);this.armR=mkArm(1);
 this.rig=new FaceRig();this.rig.group.position.y=1.78*P;this.rig.group.scale.setScalar(P);this.group.add(this.rig.group);this.head=this.rig.headMesh;
 const acc=Math.random();
 if(acc<0.3){const capM=new THREE.MeshStandardMaterial({color:Utils.pick([0x223366,0x662222,0x226633])});const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.12,8),capM);cap.position.y=0.52;this.rig.group.add(cap);const brim=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.03,0.2),capM);brim.position.set(0,0.47,0.3);this.rig.group.add(brim);}
 else if(acc<0.5){const gl=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.06,0.05),new THREE.MeshStandardMaterial({color:0x111111}));gl.position.set(0,0.14,0.46);this.rig.group.add(gl);}
 if(Math.random()<0.35){const ap=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.7,0.06),new THREE.MeshStandardMaterial({color:0xeeeeee}));ap.position.set(0,1.1*P,0.33);this.group.add(ap);}
 this.patBg=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.1),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0.75}));
 this.patBg.position.set(0,2.55*P,0);this.patBg.visible=false;this.group.add(this.patBg);
 this.patFg=new THREE.Mesh(new THREE.PlaneGeometry(0.66,0.06),new THREE.MeshBasicMaterial({color:0x33ff33}));
 this.patFg.position.set(0,0,0.01);this.patFg.visible=false;this.patBg.add(this.patFg);
 this.ao=aoMesh(1.4);this.ao.position.set(x,0.02,z);scene.add(this.ao);
 this.decals=[];scene.add(this.group);
 this.time=phase||0;this.state='walk';this.target=new THREE.Vector3(x,0,z);this.order=null;this.bubble=null;this.bubbleT=0;this.speed=2.2;this.walkPhase=0;this.talkT=Utils.rand(6,16);
 this.fallTimer=0;this.sick=false;this.game=null;this.lookT=Utils.rand(1,4);this.knockV=new THREE.Vector3();this.bumps=0;this.bumpMesh=null;this.carryCrowbar=false;this.swingCd=0;this.smashT=0;this.smashTarget=null;this.fleeing=false;this.sootCd=0;this.saboteur=false;this.planted=false;this.policeman=false;this.fined=false;this.sprayed=0;this.ratKing=false;this.toilet=false;this.inspector=false;}
 setMood(m,d){this.rig.setMood(m,d);}
 addCrown(){const c=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.05,6,12),new THREE.MeshStandardMaterial({color:0xffcc00}));c.rotation.x=Math.PI/2;c.position.y=0.55;this.rig.group.add(c);
  for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.12,4),new THREE.MeshStandardMaterial({color:0xffcc00}));const a=i*Math.PI/2;s.position.set(Math.cos(a)*0.16,0.62,Math.sin(a)*0.16);this.rig.group.add(s);}}
 addHat(){const h=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.2,8),new THREE.MeshStandardMaterial({color:0xffffff}));h.position.y=0.55;this.rig.group.add(h);}
 addDecal(a,c,y0,y1){if(a.length>=8)return;const m=new THREE.Mesh(new THREE.SphereGeometry(Utils.rand(0.05,0.16),6,6),new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:0.85}));m.position.set(Utils.rand(-0.45,0.45),Utils.rand(y0,y1),Utils.rand(-0.35,0.4));this.group.add(m);a.push(m);}
 addBump(){this.bumps++;if(!this.bumpMesh){this.bumpMesh=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8),new THREE.MeshStandardMaterial({color:0xcc4444}));this.bumpMesh.position.set(0.1,0.55,0.1);this.rig.group.add(this.bumpMesh);}this.bumpMesh.scale.setScalar(1+this.bumps*0.35);}
 addBruise(){this.addDecal(this.decals,Utils.pick([0x553388,0x6644aa]),0.4,1.9);}addSoot(){this.addDecal(this.decals,0x111111,0.6,2);this.rig.addSoot();}addSplash(c){this.addDecal(this.decals,c,0.4,1.9);this.rig.addSplash(c);}
 setTarget(x,z,s){this.routePts=[];this.target.set(x,0,z);if(s)this.state=s;}
 setTargetRouted(x,z,s){const pts=computeRoute(this.group.position.x,this.group.position.z,x,z);pts.push({x,z});
  this.target.set(pts[0].x,0,pts[0].z);this.routePts=pts.slice(1);if(s)this.state=s;}
 setBubble(t,ttl){this.clearBubble();this.bubbleT=ttl||7;
  if(this.game&&this.game.chatAdd){const p=this.game.player.body.position;
   if(Utils.dist2(this.group.position.x,this.group.position.z,p.x,p.z)<196)this.game.chatAdd(this.speakerName,t,this.color);}
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const cx=cv.getContext('2d');cx.fillStyle='rgba(255,255,255,0.92)';cx.fillRect(8,8,496,240);cx.fillStyle='#111';cx.font='bold 30px Courier New';
  const w=(t||'').split(' ');let line='';const lines=[];for(const x of w){const tt=line?line+' '+x:x;if(cx.measureText(tt).width>460){lines.push(line);line=x;}else line=tt;}lines.push(line);
  for(let i=0;i<Math.min(lines.length,6);i++)cx.fillText(lines[i],24,55+i*36);
  const tex=new THREE.CanvasTexture(cv);
  this.bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:true,depthWrite:false,transparent:true}));
  this.bubble.scale.set(3.2,1.6,1);this.bubble.position.set(0,2.9*this.prop,0);this.group.add(this.bubble);}
 clearBubble(){if(this.bubble){this.group.remove(this.bubble);if(this.bubble.material.map)this.bubble.material.map.dispose();this.bubble.material.dispose();this.bubble=null;}this.bubbleT=0;}
 lookAtPlayer(){if(!this.game)return;const p=this.game.player.body.position,pos=this.group.position;const dx=p.x-pos.x,dz=p.z-pos.z,yaw=this.group.rotation.y;const lx=dx*Math.cos(yaw)-dz*Math.sin(yaw),lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(lz>0.5)this.rig.lookLocal(lx/lz);}
 update(dt){this.time+=dt;this.sootCd-=dt;if(this.bubble){this.bubbleT-=dt;if(this.bubbleT<=0)this.clearBubble();}
  this.rig.talk=!!this.bubble;this.rig.update(dt);
  if(this.game&&this.patBg){const show=(this.state==='waiting'&&this.patience<99);this.patBg.visible=show;this.patFg.visible=show;
   if(show){this.patBg.quaternion.copy(this.game.camera.quaternion);const s=Math.max(0.05,this.patience/100);this.patFg.scale.x=s;this.patFg.position.x=-0.33+0.33*s;this.patFg.material.color.setHSL(0.33*s,1,0.5);}}
  if(this.state==='waiting'&&!this.bubble){this.talkT-=dt;if(this.talkT<=0){this.talkT=Utils.rand(10,22);this.setBubble(Utils.pick(PHRASES.wait),4);}}
  this.lookT-=dt;if(this.lookT<=0){this.lookT=Utils.rand(2,6);if(Math.random()<0.6)this.lookAtPlayer();}
  if(this.knockV.lengthSq()>0.0001){this.group.position.x+=this.knockV.x*dt;this.group.position.z+=this.knockV.z*dt;this.knockV.multiplyScalar(Math.max(0,1-4*dt));}
  const pos=this.group.position;
  this.ao.position.set(pos.x,0.02,pos.z);
  if(this.fallTimer>0){this.fallTimer-=dt;this.group.rotation.x=Math.PI/2;pos.y=0.4;this.legL.rotation.x=0.3;this.legR.rotation.x=-0.3;if(this.fallTimer<=0){this.group.rotation.x=0;pos.y=0;}return;}
  let dx=this.target.x-pos.x,dz=this.target.z-pos.z,dist=Math.sqrt(dx*dx+dz*dz);
  if(dist<0.25&&this.routePts&&this.routePts.length){const w=this.routePts.shift();this.target.set(w.x,0,w.z);dx=this.target.x-pos.x;dz=this.target.z-pos.z;dist=Math.sqrt(dx*dx+dz*dz);}
  const moving=(this.state==='walk'||this.state==='leave'||this.state==='panic'||this.state==='sickwalk')&&dist>0.1;
  if(moving){pos.x+=(dx/dist)*this.speed*dt;pos.z+=(dz/dist)*this.speed*dt;this.group.rotation.y=Math.atan2(dx,dz);this.walkPhase+=dt*(6+this.speed*2);const sw=Math.sin(this.walkPhase);this.legL.rotation.x=sw*0.7;this.legR.rotation.x=-sw*0.7;this.armL.rotation.x=-sw*0.5;this.armR.rotation.x=sw*0.5;pos.y=Math.abs(sw)*0.06;
   const moved=Math.sqrt(Utils.dist2(pos.x,pos.z,this.lastX,this.lastZ));
   if(moved<0.012){this.stuckT+=dt;if(this.stuckT>0.7){this.stuckT=0;const px=-dz/dist,pz=dx/dist;const s=Math.random()<0.5?1:-1;this.knockV.x+=px*s*3.2;this.knockV.z+=pz*s*3.2;}}
   else this.stuckT=0;
   this.lastX=pos.x;this.lastZ=pos.z;}
  else{this.group.rotation.y+=(Math.PI-this.group.rotation.y)*Math.min(1,5*dt);pos.y=Math.sin(this.time*3)*0.05;this.legL.rotation.x*=0.9;this.legR.rotation.x*=0.9;this.armL.rotation.x=Math.sin(this.time*2)*0.12;this.armR.rotation.x=-Math.sin(this.time*2+1)*0.12;this.stuckT=0;}}
 arrived(){return Utils.dist2(this.group.position.x,this.group.position.z,this.target.x,this.target.z)<0.0225&&!(this.routePts&&this.routePts.length);}
 dispose(){this.clearBubble();this.scene.remove(this.group);this.scene.remove(this.ao);}}

export class RagdollEntity{constructor(scene,physics,x,z,color){this.scene=scene;this.physics=physics;this.constraints=[];this.bodies=[];
 this.group=new THREE.Group();scene.add(this.group);
 this.ao=aoMesh(2.0);this.ao.position.set(x,0.02,z);scene.add(this.ao);
 const shirt=new THREE.MeshStandardMaterial({color});const pants=new THREE.MeshStandardMaterial({color:0x333366});const skin=new THREE.MeshStandardMaterial({color:0xffccaa});
 this.torsoG=new THREE.Group();this.group.add(this.torsoG);
 const torso=new THREE.Mesh(new THREE.SphereGeometry(0.42,12,12),shirt);torso.scale.set(0.9,1.1,0.7);this.torsoG.add(torso);
 this.headG=new THREE.Group();this.group.add(this.headG);
 this.rig=new FaceRig({skin:0xffccaa});this.rig.setMood('dead',99999999);this.rig.group.scale.setScalar(0.95);this.headG.add(this.rig.group);
 const mkLimb=(mat,len,rad)=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.CapsuleGeometry(rad,len,4,6),mat);m.position.y=-len/2;g.add(m);const end=new THREE.Mesh(new THREE.SphereGeometry(rad*1.2,6,6),mat);end.position.y=-len;g.add(end);this.group.add(g);return g;};
 this.armLG=mkLimb(shirt,0.5,0.08);this.armRG=mkLimb(shirt,0.5,0.08);
 this.legLG=mkLimb(pants,0.55,0.1);this.legRG=mkLimb(pants,0.55,0.1);
 const mkBody=(mass,shape,px,py,pz,label)=>{const b=new CANNON.Body({mass,material:physics.defaultMaterial,linearDamping:0.35,angularDamping:0.4});b.addShape(shape);b.position.set(px,py,pz);b.allowSleep=true;b.label=label;physics.addBody(b,null);this.bodies.push(b);return b;};
 this.torsoBody=mkBody(40,new CANNON.Box(new CANNON.Vec3(0.42,0.5,0.3)),x,0.6,z,'ragdoll');
 this.headBody=mkBody(8,new CANNON.Sphere(0.3),x+0.7,0.5,z,'ragdoll_head');
 this.armLBody=mkBody(5,new CANNON.Sphere(0.12),x-0.45,0.7,z+0.1,'ragdoll_limb');
 this.armRBody=mkBody(5,new CANNON.Sphere(0.12),x+0.45,0.7,z-0.1,'ragdoll_limb');
 this.legLBody=mkBody(8,new CANNON.Sphere(0.14),x-0.18,0.15,z-0.35,'ragdoll_limb');
 this.legRBody=mkBody(8,new CANNON.Sphere(0.14),x+0.18,0.15,z-0.35,'ragdoll_limb');
 this.legLBody.quaternion.setFromEuler(new THREE.Euler(Math.PI/2,0,0));
 this.legRBody.quaternion.setFromEuler(new THREE.Euler(Math.PI/2,0,0));
 this.syncPairs=[[this.torsoBody,this.torsoG],[this.headBody,this.headG],[this.armLBody,this.armLG],[this.armRBody,this.armRG],[this.legLBody,this.legLG],[this.legRBody,this.legRG]];
 const con=(a,pa,b,pb)=>{const c=new CANNON.PointToPointConstraint(a,new CANNON.Vec3(pa[0],pa[1],pa[2]),b,new CANNON.Vec3(pb[0],pb[1],pb[2]));physics.addConstraint(c);this.constraints.push(c);};
 con(this.torsoBody,[0.45,0.35,0],this.headBody,[-0.25,0,0]);
 con(this.torsoBody,[-0.45,0.35,0],this.armLBody,[0,0.25,0]);
 con(this.torsoBody,[0.45,0.35,0],this.armRBody,[0,0.25,0]);
 con(this.torsoBody,[-0.18,-0.5,0],this.legLBody,[0,0.3,0]);
 con(this.torsoBody,[0.18,-0.5,0],this.legRBody,[0,0.3,0]);
 this.body=this.torsoBody;this.name='Регдолл клиента';}
 sync(){for(const[b,g]of this.syncPairs){g.position.copy(b.position);g.quaternion.copy(b.quaternion);}this.ao.position.x=this.torsoBody.position.x;this.ao.position.z=this.torsoBody.position.z;}
 dispose(){this.scene.remove(this.group);this.scene.remove(this.ao);for(const c of this.constraints)this.physics.removeConstraint(c);for(const b of this.bodies)this.physics.removeBody(b);}}

export class RagdollFactory{constructor(s,p,g){this.scene=s;this.physics=p;this.game=g;this.dolls=[];}
 spawn(x,z,c){const d=new RagdollEntity(this.scene,this.physics,x,z,c);this.dolls.push(d);if(this.game)this.game.emitFaceEvent('scared',x,z,8);SOUND.play('bonk');return d;}
 near(x,z,r){for(const d of this.dolls)if(Utils.dist2(d.body.position.x,d.body.position.z,x,z)<r*r)return d;return null;}
 remove(d){this.dolls=this.dolls.filter(x=>x!==d);d.dispose();}
 update(dt){for(const d of this.dolls){d.sync();d.rig.update(dt);}}
 dispose(){for(const d of this.dolls)d.dispose();this.dolls=[];}}

export class QueueSystem{constructor(s,i,o,r){this.scene=s;this.interact=i;this.order=o;this.ragdoll=r;this.game=null;this.clients=[];this.leaving=[];this.sick=[];this.intruders=[];
 this.slots=[{x:-1.5,z:5.2},{x:-1.5,z:7.2},{x:-1.5,z:9.2},{x:-1.5,z:11.2}];this.spawnTimer=6;this.colors=[0x3366cc,0xcc6633,0x66cc33,0xcc33aa,0x33cccc];this.exitTarget={x:CONFIG.EXIT_DOOR.x+0.8,z:CONFIG.EXIT_DOOR.z};}
 toast(t){if(this.game)this.game.toast(t);}
 allNpcs(){return this.clients.concat(this.leaving,this.sick,this.intruders);}
 hasRatKing(){return this.allNpcs().some(n=>n.ratKing);}
 sendOut(n){n.setTargetRouted(this.exitTarget.x,this.exitTarget.z,'leave');}
 spawnRatKing(){const x=Utils.rand(CONFIG.ENTRY_DOOR.x-1,CONFIG.ENTRY_DOOR.x+1);const n=new NPCEntity(this.scene,x,16.5,0x663399,Utils.rand(0,5));n.game=this.game;n.ratKing=true;n.speed=1.6;n.group.scale.setScalar(1.2);n.addCrown();
  const s=this.slots[Math.min(this.clients.length,this.slots.length-1)];n.setTarget(s.x,s.z,'walk');this.interact.register(n.head,'Обслужить КОРОЛЯ',()=>this.game.tryServe(n));this.clients.push(n);
  this.game.toast('👑 КРЫСИНЫЙ КОРОЛЬ пожаловал!');for(const c of this.clients)if(c!==n&&Math.random()<0.6){c.setMood('scared',5);c.setBubble(Utils.pick(PHRASES.seeKing),4);}}
 spawnClient(){const x=Utils.rand(CONFIG.ENTRY_DOOR.x-1,CONFIG.ENTRY_DOOR.x+1);
  if(!this.hasRatKing()&&Math.random()<0.06){this.spawnRatKing();return;}
  const n=new NPCEntity(this.scene,x,16.5,Utils.pick(this.colors),Utils.rand(0,5));n.game=this.game;
  if(Math.random()<0.08){n.intruder=true;const k=Utils.pick(CONFIG.KITCHEN_SPOTS);n.setTargetRouted(k.x,k.z,'walk');n.waitT=Utils.rand(3,6);this.intruders.push(n);return;}
  const s=this.slots[Math.min(this.clients.length,this.slots.length-1)];n.setTarget(s.x,s.z,'walk');
  this.interact.register(n.head,'Обслужить клиента',()=>this.game.tryServe(n));this.clients.push(n);}
 activeClient(){return(this.clients.length&&this.clients[0].state==='waiting')?this.clients[0]:null;}
 reindex(){this.clients.forEach((c,i)=>{const s=this.slots[Math.min(i,this.slots.length-1)];c.setTarget(s.x,s.z,'walk');});}
 refreshActiveOrder(){const n=this.activeClient();this.order.setActive(n&&n.order?n.order:null);}
 releaseCurrent(h){const c=this.clients.shift();if(!c)return;c.clearBubble();c.order=null;this.sendOut(c);c.happy=h;this.leaving.push(c);this.reindex();this.refreshActiveOrder();}
 angryLeave(c,reason){const i=this.clients.indexOf(c);if(i<0)return;this.clients.splice(i,1);this.interact.unregister(c.head);c.clearBubble();c.order=null;
  c.setMood('angry',5);c.setBubble(Utils.pick(PHRASES.angry),5);this.sendOut(c);c.speed=3.5;this.leaving.push(c);this.reindex();this.refreshActiveOrder();
  GAME_DATA.stats.angry++;this.game.addRep(-2,reason);this.game.toast('Клиент не дождался и ушёл злым! ('+reason+')');SOUND.play('deny');}
 panicClient(n){const i=this.clients.indexOf(n);if(i<0)return;this.clients.splice(i,1);this.interact.unregister(n.head);n.clearBubble();n.order=null;n.setMood('scared',5);this.sendOut(n);n.speed=4;this.leaving.push(n);this.reindex();this.refreshActiveOrder();}
 makeSick(n){const i=this.clients.indexOf(n);if(i<0)return;this.clients.splice(i,1);this.interact.unregister(n.head);n.clearBubble();n.order=null;n.sick=true;n.sickT=Utils.rand(8,13);n.vomitCd=1;n.setMood('sick',99);n.setTarget(Utils.rand(-4,4),Utils.rand(6,12),'sickwalk');this.sick.push(n);this.reindex();this.refreshActiveOrder();this.game.addRep(-3,'отравлен');this.game.unlockAch('iron_stomach');SOUND.play('vomit');}
 ragdollClient(n,r){const i=this.clients.indexOf(n);if(i<0)return;this.clients.splice(i,1);this.interact.unregister(n.head);const p=n.group.position,c=n.color;n.dispose();this.ragdoll.spawn(p.x,p.z,c);this.reindex();this.refreshActiveOrder();this.game.addMeter('shame',15,'рэгдолл');this.game.addRep(-8,'смерть');GAME_DATA.stats.died++;}
 ragdollIntruder(n,r){const i=this.intruders.indexOf(n);if(i>=0)this.intruders.splice(i,1);const p=n.group.position,c=n.color;n.dispose();this.ragdoll.spawn(p.x,p.z,c);this.game.addMeter('shame',20,'труп');this.game.addRep(-8,'смерть');GAME_DATA.stats.died++;}
 ragdollAny(n,r){if(this.clients.indexOf(n)>=0)return this.ragdollClient(n,r);if(this.intruders.indexOf(n)>=0)return this.ragdollIntruder(n,r);
  for(const l of[this.sick,this.leaving]){const i=l.indexOf(n);if(i>=0){l.splice(i,1);const p=n.group.position,c=n.color;n.dispose();this.ragdoll.spawn(p.x,p.z,c);GAME_DATA.stats.died++;this.game.addRep(-8,'смерть');return;}}}
 update(dt){this.spawnTimer-=dt;if(this.spawnTimer<=0&&this.clients.length<4){this.spawnClient();this.spawnTimer=Utils.rand(16,28);}
  const g=this.game;
  const drain=1.1+(g.fireSystem.fires.length?1.5:0)+(GAME_DATA.dirt>50?0.8:0)+(g.ratSystem.rats.length>2?0.5:0);
  const toAngry=[];
  for(let i=0;i<this.clients.length;i++){const c=this.clients[i];c.update(dt);
   if(c.state==='waiting'){c.patience-=dt*drain;
    if(c.patience<35&&!c.warned){c.warned=true;c.setMood('angry',3);c.setBubble('Ну ты и тормоз, повар...',4);}
    if(c.patience<=0)toAngry.push(c);}
   if(c.state==='walk'&&c.arrived()){c.state='waiting';
    if(i===0&&!c.order){c.order=c.ratKing?this.order.generateRatKing():this.order.generate();this.order.setActive(c.order);c.setBubble((c.ratKing?Utils.pick(PHRASES.ratKingGreet):Utils.pick(PHRASES.greet))+' Короче: '+this.order.chant(c.order)+'.',9);}}}
  for(const c of toAngry)this.angryLeave(c,'терпение кончилось');
  for(let i=this.leaving.length-1;i>=0;i--){const c=this.leaving[i];c.update(dt);if(c.arrived()){this.interact.unregister(c.head);c.dispose();this.leaving.splice(i,1);}}
  for(let i=this.sick.length-1;i>=0;i--){const c=this.sick[i];c.update(dt);c.sickT-=dt;c.vomitCd-=dt;if(c.arrived()&&c.state==='sickwalk')c.setTarget(Utils.rand(-4,4),Utils.rand(6,12),'sickwalk');
   if(c.vomitCd<=0){c.vomitCd=Utils.rand(1.2,2.5);this.game.puddleSystem.add('vomit',c.group.position.x,c.group.position.z,0.7);SOUND.play('vomit');}
   if(c.sickT<=0){if(Math.random()<0.5){const p=c.group.position,co=c.color;c.dispose();this.ragdoll.spawn(p.x,p.z,co);this.game.addMeter('shame',25,'смерть');this.game.addRep(-8,'смерть');GAME_DATA.stats.died++;}else{this.sendOut(c);c.state='panic';this.leaving.push(c);}this.sick.splice(i,1);}}
  for(let i=this.intruders.length-1;i>=0;i--){const c=this.intruders[i];c.update(dt);const p=c.group.position;let dead=false;
   if(!c.policeman&&!c.toilet&&!c.inspector){for(const it of this.game.items){if(it.def&&it.def.kind==='hazard'&&it.def.id!=='hazard_dynamite'&&Utils.dist2(it.body.position.x,it.body.position.z,p.x,p.z)<0.49){this.ragdollIntruder(c,'опасное');dead=true;break;}}}
   if(dead){this.intruders.splice(i,1);continue;}
   this.updateIntruder(c,dt);
   if((c.fleeing||c.state==='leave')&&c.arrived()){this.interact.unregister(c.head);c.dispose();this.intruders.splice(i,1);}}}
 updateIntruder(c,dt){const g=this.game,p=c.group.position;c.swingCd-=dt;
  if(c.toilet||c.fleeing)return;
  if(c.inspector){ if(c.done)return;
   c.smashT-=dt;const pp=g.player.body.position;
   if(c.smashT<=0){c.smashT=0.7;c.setTargetRouted(pp.x,pp.z,'walk');}
   if(Utils.dist2(pp.x,pp.z,p.x,p.z)<5){c.done=true;g.runInspection(c);}
   return;}
  if(c.saboteur){if(!c.planted&&c.state==='walk'&&c.arrived()){c.planted=true;g.plantDynamite(p.x,p.z);c.setBubble('хе-хе... сюрприз...',5);c.fleeing=true;c.speed=5;this.sendOut(c);}return;}
  if(c.policeman){ if(c.fined)return;
   if(g.talk&&g.talk.npc===c)return;
   c.smashT-=dt;const pp=g.player.body.position;
   if(c.smashT<=0){c.smashT=0.6;c.setTargetRouted(pp.x,pp.z,'walk');}
   if(Utils.dist2(pp.x,pp.z,p.x,p.z)<4.5){g.startPoliceTalk(c);}
   return;}
  if(!c.carryCrowbar){const cb=g.crowbar;if(cb&&!cb.carriedBy&&g.holdSystem.heldEntity!==cb&&Utils.dist2(cb.body.position.x,cb.body.position.z,p.x,p.z)<1.2){g.giveCrowbarToNpc(c);this.toast('НАРУШИТЕЛЬ СТЫРИЛ ЛОМ!');}}
  if(c.carryCrowbar){const cb=g.crowbar;cb.body.position.set(p.x+Math.sin(c.group.rotation.y)*0.6,p.y+1.3,p.z+Math.cos(c.group.rotation.y)*0.6);
   const pp=g.player.body.position,dp=Utils.dist2(pp.x,pp.z,p.x,p.z);
   if(dp<36){c.setTargetRouted(pp.x,pp.z,'walk');c.speed=3;
    if(dp<2.6&&c.swingCd<=0){c.swingCd=99;g.player.fallDown();g.flashVignette(0.95);g.toast('ВЫРУБИЛИ ЛОМОМ! Space!');g.portrait.rig.addBruise();g.addMeter('shame',10,'вырублен');g.dropCrowbarFromNpc(c,true);c.setMood('scared',5);c.fleeing=true;this.sendOut(c);return;}}
   else{c.smashT-=dt;
    if(c.smashT<=0||!c.smashTarget||g.items.indexOf(c.smashTarget)<0){c.smashT=Utils.rand(2,5);
     const cand=g.items.filter(i=>i.mesh.visible&&i.body.position.y<1.35);c.smashTarget=cand.length?Utils.pick(cand):null;}
    if(c.smashTarget){const t=c.smashTarget.body.position;c.setTargetRouted(t.x,t.z,'walk');
     if(Utils.dist2(t.x,t.z,p.x,p.z)<2&&c.swingCd<=0){c.swingCd=1.2;if(t.placed){g.unplaceEntity(c.smashTarget);g.interactSystem.register(c.smashTarget.mesh,c.smashTarget.name,g.makeItemAction(c.smashTarget));}t.type=CANNON.Body.DYNAMIC;t.wakeUp();t.velocity.set(Utils.rand(-5,5),Utils.rand(3,7),Utils.rand(-5,5));this.toast('Нарушитель КРУШИТ!');SOUND.play('bonk');}}}
   return;}
  const pud=g.puddleSystem.at(p.x,p.z);if(pud&&c.fallTimer<=0&&c.state!=='leave'){c.fallTimer=3;c.setMood('blush',6);c.addSplash(PUDDLE_COLORS[pud.type]);this.toast('Нарушитель подскользнулся!');SOUND.play('boing');return;}
  if(c.state==='walk'&&c.arrived()){c.waitT-=dt;if(c.waitT<=0){const k=Utils.pick(CONFIG.KITCHEN_SPOTS);c.setTargetRouted(k.x,k.z,'walk');}}
  if(c.waitT<-6)this.sendOut(c);}
 dispose(){for(const c of this.allNpcs()){this.interact.unregister(c.head);c.dispose();}this.clients=[];this.leaving=[];this.sick=[];this.intruders=[];}}

export class OrderSystem{constructor(){this.orderListEl=document.getElementById('order-list');this.activeOrder=null;}
 generate(){const L=[];const bv=Utils.pick(['white','black','baton']);L.push({kind:'bread',variant:bv,defId:'half_'+bv,top:false});
  const pool=['sausage','cheese','cucumber','tomato','cutlet','egg','onion'];const map={sausage:'slice_sausage',onion:'slice_onion',cutlet:'ing_cutlet_fried',cucumber:'slice_cucumber',tomato:'slice_tomato'};
  for(let i=0,n=Utils.randInt(1,3);i<n;i++){const v=pool.splice(Math.floor(Math.random()*pool.length),1)[0];L.push({kind:'ingredient',variant:v,defId:map[v]||('ing_'+v)});}
  const sc=Utils.pick(['ketchup','mayo','mustard']);L.push({kind:'sauce',variant:sc,defId:'sauce_'+sc});
  if(Math.random()<0.7)L.push({kind:'bread',variant:bv,defId:'half_'+bv,top:true});return{layers:L,price:50+L.length*30};}
 generateRatKing(){const L=[];const bv=Utils.pick(['white','black','baton']);L.push({kind:'bread',variant:bv,defId:'half_'+bv,top:false});
  const opts=['dead_rat','fried_rat','ing_cheese'];for(let i=0,n=Utils.randInt(2,4);i<n;i++){const d=Utils.pick(opts);L.push({kind:'ingredient',variant:ITEM_DEFS[d].variant,defId:d});}
  L.push({kind:'bread',variant:bv,defId:'half_'+bv,top:true});return{layers:L,price:150+L.length*20,ratKing:true};}
 lineText(l){if(!l)return'';if(l.kind==='pest')return l.variant==='rat'?'🐀 ШЕВЕЛИТСЯ':'🪳 ШЕВЕЛИТСЯ';const d=ITEM_DEFS[l.defId];if(!d)return'?';
  if(l.kind==='bread')return l.top?'🍞 '+d.name+' (ВЕРХ)':'🍞 '+d.name;if(l.kind==='sauce')return'🥫 '+d.name;return'🥓 '+d.name;}
 chant(o){return((o&&o.layers)||[]).map(l=>{if(l.kind==='pest')return'???';const d=ITEM_DEFS[l.defId];if(!d)return'?';if(l.kind==='bread'&&l.top)return'половинка сверху';return d.name.toLowerCase();}).join(', ');}
 setActive(o){this.activeOrder=o||null;this.orderListEl.innerHTML='';if(!o){this.orderListEl.innerHTML='<div style="color:#ff9999;">Нет</div>';return;}
  for(const l of(o.layers||[])){const d=document.createElement('div');d.textContent=this.lineText(l);d.style.color=l.kind==='pest'?'#ff5555':'#99ff99';this.orderListEl.appendChild(d);}}
 update(dt){}dispose(){}}

export class SandwichBuilder{constructor(s,p,i,h,g){this.scene=s;this.physics=p;this.interact=i;this.hold=h;this.game=g;this.stack=[];this.meshes=[];this.readyEntity=null;this.height=0;
 this.group=new THREE.Group();this.group.position.set(CONFIG.ASSEMBLY_POS.x,CONFIG.ASSEMBLY_POS.y,CONFIG.ASSEMBLY_POS.z);s.add(this.group);
 i.register(g.worldBuilder.assemblyMesh,'Стол сборки (Q — закрыть)',()=>g.onAssemblyTable());}
 layerHeight(l){if(l.kind==='bread')return 0.1;if(l.kind==='sauce')return 0.06;if(l.kind==='pest')return 0.1;return defHeight(ITEM_DEFS[l.defId]);}
 makeLayerMesh(l){if(l.kind==='pest'){const col=l.variant==='rat'?0x8a7a66:0x4a2a12;const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8),new THREE.MeshStandardMaterial({color:col}));b.scale.set(0.8,0.5,1.3);g.add(b);return g;}
  const d=ITEM_DEFS[l.defId];let geo;if(l.kind==='bread')geo=new THREE.BoxGeometry(d.p[0],0.1,d.p[2]);else if(l.kind==='sauce')geo=new THREE.CylinderGeometry(0.24,0.24,0.06,10);else if(d.shape==='box')geo=new THREE.BoxGeometry(d.p[0],d.p[1],d.p[2]);else if(d.shape==='cyl')geo=new THREE.CylinderGeometry(d.p[0],d.p[0],d.p[1],8);else geo=new THREE.SphereGeometry(d.p[0],10,10);
  const mo={color:d.color};const mp=itemMapTex(d.id);if(mp)mo.map=mp;
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial(mo));m.rotation.y=Utils.rand(-0.14,0.14);return m;}
 contaminate(t){if(!this.stack.length||this.stack.some(l=>l.kind==='pest'))return;const layer={kind:'pest',variant:t,defId:t==='rat'?'pest_rat':'pest_roach'};this.stack.push(layer);const m=this.makeLayerMesh(layer),h=this.layerHeight(layer);m.position.y=this.height+h/2;this.height+=h;this.group.add(m);this.meshes.push(m);this.game.toast('ЧТО-ТО ЗАЛЕЗЛО В БУТЕР! Проверь слои!');}
 tryAdd(e){const meta=e.meta;if(!meta){this.game.toast('Это не еда!');return false;}
  if(meta.kind==='bread'){if(!meta.defId.startsWith('half_')){this.game.toast('Целый хлеб! Режь ножом!');return false;}}
  else if(meta.kind==='ingredient'){if(['ing_sausage','ing_onion','ing_cucumber','ing_tomato'].indexOf(meta.defId)>=0){this.game.toast('ЦЕЛОЕ?! Режь ножом!');return false;}if(RAW_CUTLETS.indexOf(meta.defId)>=0){this.game.toast('СЫРУЮ котлету?! НА ПЛИТУ!');return false;}}
  else if(meta.kind!=='sauce'&&meta.kind!=='hazard'){this.game.toast('Это в бутер не идёт!');return false;}
  const top=meta.kind==='bread'&&this.stack.length>0;if(!this.stack.length&&meta.kind!=='bread'){this.game.toast('Начни с хлеба!');return false;}
  const id=e.def.id,wl=e.def.liquid;this.hold.releaseHeld();this.interact.unregister(e.mesh);this.game.removeHighlightSafe(e);e.dispose();
  if(wl){const b=this.game.spawnItem('empty_bottle',{x:CONFIG.ASSEMBLY_POS.x-0.65,y:CONFIG.ASSEMBLY_POS.y+0.3,z:CONFIG.ASSEMBLY_POS.z});this.game.snapToStack(b,this.game.assemblyStack);}
  const layer={kind:meta.kind,variant:meta.variant,defId:meta.defId,top,perfect:!!e.perfect};this.stack.push(layer);const m=this.makeLayerMesh(layer),h=this.layerHeight(layer);m.position.y=this.height+h/2;this.height+=h;this.group.add(m);this.meshes.push(m);
  if(top)this.finish();return true;}
 finish(){if(!this.stack.length)return null;const L=this.stack.slice(),M=this.meshes.slice(),H=this.height;this.stack=[];this.meshes=[];this.height=0;
  const e=new SandwichEntity(this.scene,this.physics,M,L,{x:CONFIG.ASSEMBLY_POS.x,y:CONFIG.ASSEMBLY_POS.y,z:CONFIG.ASSEMBLY_POS.z},H);
  e.perfect=L.some(l=>l.perfect);
  this.readyEntity=e;this.game.registerSandwich(e);this.interact.register(e.group,e.name,()=>{if(!this.hold.heldEntity){this.hold.pickUp(e);this.interact.unregister(e.group);this.readyEntity=null;}});
  this.game.toast('Бутерброд собран!'+(e.perfect?' (с ИДЕАЛЬНОЙ котлетой!)':''));return e;}
 reset(){this.stack=[];for(const m of this.meshes)this.group.remove(m);this.meshes=[];this.height=0;this.readyEntity=null;}
 update(dt){this.group.position.y=CONFIG.ASSEMBLY_POS.y+Math.sin(performance.now()*0.002)*0.01;}dispose(){}}