// ==== BUILDING: плита, холодильник, туалет, двери, мир, магазины ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, GAME_DATA, ITEM_DEFS, PHRASES, ACH_MAP, Utils, storeSave } from './config.js';
import { TEX, aoMesh, LOGGER, SOUND } from './media.js';

export class StoveSystem{constructor(s,p,i,g){this.scene=s;this.physics=p;this.game=g;this.oiled=false;this.oilUses=0;this.item=null;this.onFire=false;this.fireNode=null;this.steam=[];this.steamMat=new THREE.SpriteMaterial({color:0xffffff,transparent:true,opacity:0.25,depthWrite:false});const S=CONFIG.STOVE_POS;
 this.mesh=new THREE.Mesh(new THREE.BoxGeometry(1.4,1,1),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x888888}));this.mesh.position.set(S.x,0.5,S.z);s.add(this.mesh);
 const b=new CANNON.Body({mass:0,material:p.defaultMaterial});b.addShape(new CANNON.Box(new CANNON.Vec3(0.7,0.5,0.5)));b.position.set(S.x,0.5,S.z);b.label='stove';p.addBody(b,this.mesh);
 for(const ox of[-0.35,0.35])for(const oz of[-0.25,0.25]){const bb=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.04,10),new THREE.MeshStandardMaterial({color:0x111111}));bb.position.set(S.x+ox,1.02,S.z+oz);s.add(bb);}
 this.panMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.3,0.12,14),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x555555}));this.panMesh.position.set(S.x,1.08,S.z);s.add(this.panMesh);
 this.oilMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.02,14),new THREE.MeshStandardMaterial({color:0xddbb33,transparent:true,opacity:0.7}));this.oilMesh.position.set(S.x,1.14,S.z);this.oilMesh.visible=false;s.add(this.oilMesh);
 this.itemMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.09,12),new THREE.MeshStandardMaterial({color:0xd8a0a0,emissive:0x000000}));this.itemMesh.position.set(S.x,1.18,S.z);this.itemMesh.visible=false;s.add(this.itemMesh);
 i.register(this.mesh,'Плита (E — жарить/мини-игра/снять)',()=>g.onStove());}
 burnLimit(){return GAME_DATA.upgrades.pan?18:14;}
 update(dt){this.oilMesh.visible=this.oiled&&!this.onFire;this.itemMesh.visible=!!this.item;
  if(this.item&&!this.item.burnt&&this.steam.length<10&&Math.random()<dt*6){const s=new THREE.Sprite(this.steamMat);s.scale.setScalar(Utils.rand(0.1,0.2));s.position.set(CONFIG.STOVE_POS.x+Utils.rand(-0.15,0.15),1.25,CONFIG.STOVE_POS.z+Utils.rand(-0.15,0.15));this.scene.add(s);this.steam.push({m:s,t:1.2});}
  for(let i=this.steam.length-1;i>=0;i--){const s=this.steam[i];s.t-=dt;s.m.position.y+=dt*0.7;s.m.material.opacity=Math.max(0,s.t*0.2);if(s.t<=0){this.scene.remove(s.m);this.steam.splice(i,1);}}
  if(!this.item)return;const it=this.item;if(!it.burnt)it.t+=dt;const def=ITEM_DEFS[it.defId];
  this.itemMesh.material.emissive.setHex(it.perfect?0x442200:0x000000);
  if(!it.burnt&&it.t>this.burnLimit()&&!this.onFire){this.onFire=true;this.fireNode=this.game.fireSystem.ignite(CONFIG.STOVE_POS.x,1.1,CONFIG.STOVE_POS.z,{isStove:true});this.game.toast('ПОЖАР НА ПЛИТЕ! Кидай СОУС!');}
  let col;if(it.burnt||this.onFire)col=0x111111;else if(it.perfect)col=0xd4a040;else if(it.t>=6)col=ITEM_DEFS[def.friedId]?ITEM_DEFS[def.friedId].color:0x8a5a2a;else col=def.color;this.itemMesh.material.color.setHex(col);}
 placeItem(d){this.item={defId:d,t:0,side:1,needsFlip:!!ITEM_DEFS[d].needsFlip,burnt:false,perfect:false};SOUND.play('splat');}
 flip(){this.item.side=2;this.item.t=0;this.item.perfect=false;SOUND.play('splat');}
 isReady(){if(!this.item)return false;if(this.item.burnt)return true;if(this.item.needsFlip)return this.item.side===2&&this.item.t>=6;return this.item.t>=6;}
 removeItem(){const it=this.item;this.item=null;const def=ITEM_DEFS[it.defId];const out=it.burnt?(it.needsFlip?'cutlet_burnt':'burnt_food'):(def.friedId||'ing_cutlet_fried');const e=this.game.spawnItem(out,{x:CONFIG.STOVE_POS.x,y:1.35,z:CONFIG.STOVE_POS.z});if(it.perfect)e.perfect=true;return e;}
 extinguish(){this.onFire=false;if(this.fireNode){this.game.fireSystem.extinguishNode(this.fireNode);this.fireNode=null;}if(this.item){this.item.burnt=true;this.item.t=0;this.game.toast('ПШШ! УГОЛЁК — сними (E).');}else this.game.toast('ПШШ! Потушено.');SOUND.play('spray');}
 reset(){this.oiled=false;this.oilUses=0;this.item=null;if(this.onFire&&this.fireNode)this.game.fireSystem.extinguishNode(this.fireNode);this.onFire=false;this.fireNode=null;}}

export class FridgeSystem{constructor(scene,physics,interact,game){this.scene=scene;this.physics=physics;this.game=game;this.buf='';this.unlocked=false;this.stocked=false;this.doorTarget=0;this.tweens=[];
 const F=CONFIG.FRIDGE_POS;
 this.bodyMesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshStandardMaterial({map:TEX.metal,color:0xaabbbb}));this.bodyMesh.position.set(F.x,1,F.z);scene.add(this.bodyMesh);
 const bb=new CANNON.Body({mass:0,material:physics.defaultMaterial});bb.addShape(new CANNON.Box(new CANNON.Vec3(0.5,1,0.5)));bb.position.set(F.x,1,F.z);bb.label='fridge';physics.addBody(bb,this.bodyMesh);
 this.doorPivot=new THREE.Group();this.doorPivot.position.set(F.x+0.5,1,F.z+0.5);scene.add(this.doorPivot);
 this.doorMesh=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.9,0.95),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x99aaaa}));this.doorMesh.position.set(0,0,-0.475);this.doorPivot.add(this.doorMesh);
 this.doorBody=new CANNON.Body({mass:0,material:physics.defaultMaterial});this.doorBody.addShape(new CANNON.Box(new CANNON.Vec3(0.04,0.95,0.475)));this.doorBody.position.set(F.x+0.54,1,F.z);this.doorBody.label='fridgeDoor';physics.addBody(this.doorBody,this.doorMesh);
 const panel=new THREE.Mesh(new THREE.BoxGeometry(0.03,1.1,0.35),new THREE.MeshStandardMaterial({color:0x222222}));panel.position.set(F.x+0.56,1.35,F.z+0.32);scene.add(panel);
 this.display=document.createElement('canvas');this.display.width=64;this.display.height=128;this.dispTex=new THREE.CanvasTexture(this.display);
 this.dispMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.5),new THREE.MeshBasicMaterial({map:this.dispTex}));this.dispMesh.position.set(F.x+0.585,1.62,F.z+0.32);this.dispMesh.rotation.y=Math.PI/2;scene.add(this.dispMesh);this.drawDisplay();
 let n=1;for(let row=0;row<4;row++)for(let col=0;col<3;col++){if(row===3&&col!==1)continue;const d=(row===3&&col===1)?0:n;n++;
  const bm=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.09,0.09),new THREE.MeshStandardMaterial({color:0x444444}));bm.position.set(F.x+0.585,1.32-row*0.12,F.z+0.2+col*0.12);scene.add(bm);
  interact.register(bm,'Кнопка '+d,()=>this.press(d,bm));}
 interact.register(this.bodyMesh,'Холодильник (код 4 цифры)',()=>{if(!this.unlocked)this.game.toast('Заперто. Введи код кнопками.');});}
 drawDisplay(){const c=this.display.getContext('2d');c.fillStyle='#001100';c.fillRect(0,0,64,128);c.fillStyle='#00ff66';c.font='bold 26px Courier New';
  const s=this.unlocked?'OPEN':('*'.repeat(this.buf.length)+'_'.repeat(Math.max(0,4-this.buf.length)));
  for(let i=0;i<s.length;i++)c.fillText(s[i],18,30+i*26);this.dispTex.needsUpdate=true;}
 press(d,mesh){this.tweens.push({m:mesh,t:0.15});this.buf+=d;this.drawDisplay();SOUND.play('beep');
  if(this.buf.length>=4){if(this.buf==='1337'){this.unlocked=true;this.doorTarget=-1.9;if(this.doorBody){this.physics.removeBody(this.doorBody);this.doorBody=null;}this.drawDisplay();
    this.game.toast('ЩЁЛК! 1337! Дверь распахнулась...');SOUND.play('creak');this.dropContents();}
   else{this.game.toast('НЕ ВЕРНО. Замок пищит.');SOUND.play('deny');this.buf='';this.drawDisplay();}}}
 dropContents(){if(this.stocked)return;this.stocked=true;const F=CONFIG.FRIDGE_POS;
  const c=this.game.spawnItem('ing_cheese',{x:F.x+0.3,y:1.1,z:F.z-0.2});c.body.velocity.set(1.6,0.6,Utils.rand(-0.4,0.4));
  const m=this.game.spawnItem('sauce_mayo',{x:F.x+0.3,y:1.1,z:F.z+0.2});m.body.velocity.set(1.6,0.6,Utils.rand(-0.4,0.4));
  if(!GAME_DATA.eggTaken)this.game.spawnGoldenEgg(new THREE.Vector3(F.x+0.3,1.35,F.z),new THREE.Vector3(2.2,1.6,0));
  this.game.toast('Из холодильника ВЫВАЛИЛОСЬ содержимое!');}
 update(dt){this.doorPivot.rotation.y+=(this.doorTarget-this.doorPivot.rotation.y)*Math.min(1,dt*5);
  for(let i=this.tweens.length-1;i>=0;i--){const t=this.tweens[i];t.t-=dt;t.m.position.x=CONFIG.FRIDGE_POS.x+0.585-(t.t>0?0.02:0);if(t.t<=0)this.tweens.splice(i,1);}}
 dispose(){}}

export class BathroomSystem{constructor(scene,physics,interact,game,door){this.scene=scene;this.physics=physics;this.game=game;this.door=door;this.fartT=0;
 this.occupant=null;this.occT=0;this.knock=0;this.dirt=0;this.needT=Utils.rand(30,60);this.pending=null;
 const T=CONFIG.TOILET_POS;this.toilet=new THREE.Group();
 const base=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,0.4,10),new THREE.MeshStandardMaterial({color:0xeeeeee}));base.position.y=0.2;this.toilet.add(base);
 this.bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.25,0.15,10),new THREE.MeshStandardMaterial({color:0xffffff}));this.bowl.position.y=0.45;this.toilet.add(this.bowl);
 const tank=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.2),new THREE.MeshStandardMaterial({color:0xeeeeee}));tank.position.set(0,0.7,-0.3);this.toilet.add(tank);
 this.stain=new THREE.Mesh(new THREE.CircleGeometry(0.35,10),new THREE.MeshBasicMaterial({color:0x665522,transparent:true,opacity:0.6}));this.stain.rotation.x=-Math.PI/2;this.stain.position.y=0.53;this.stain.visible=false;this.toilet.add(this.stain);
 this.toilet.position.set(T.x,0,T.z);scene.add(this.toilet);
 interact.register(this.bowl,'Туалет',()=>this.useToilet());}
 knockDoor(){if(!this.occupant)return;this.knock++;SOUND.play('knock');this.game.toast('ТУК-ТУК! ('+this.knock+')');this.occupant.setBubble(Utils.pick(PHRASES.toilet),3);if(this.knock>=3){this.game.unlockAch('persistent');this.release(true);}}
 useToilet(){if(this.occupant)return;const g=this.game;
  if(Utils.dist2(g.player.body.position.x,g.player.body.position.z,CONFIG.TOILET_POS.x,CONFIG.TOILET_POS.z)>4){g.toast('Подойди к туалету!');return;}
  GAME_DATA.bladder=0;g.el.bladderbar.style.width='0%';this.dirt++;if(this.dirt>=3)this.stain.visible=true;
  SOUND.play('fart');SOUND.play('flush',0.7);
  g.toast('Отлил в туалет. Громко. Грязь: '+this.dirt+'. Мой шваброй!');g.hands.trigger();}
 clean(){this.dirt=0;this.stain.visible=false;this.game.toast('Туалет отмыт!');SOUND.play('wipe');}
 update(dt){this.needT-=dt;
  if(this.occupant){this.occT-=dt;this.fartT-=dt;
   if(this.fartT<=0){this.fartT=Utils.rand(2,5);SOUND.play('fart');this.occupant.setBubble(Utils.pick(PHRASES.toilet),3);}
   if(this.occT<=0)this.release(false);return;}
  if(this.pending&&this.pending.arrived()){this.occupant=this.pending;this.pending=null;this.occT=Utils.rand(12,20);this.knock=0;this.fartT=1;this.door.lock();this.dirt++;if(this.dirt>=3)this.stain.visible=true;
   const ii=this.game.queueSystem.intruders.indexOf(this.occupant);if(ii>=0)this.game.queueSystem.intruders.splice(ii,1);this.occupant.intruder=false;return;}
  if(this.needT<=0){this.needT=Utils.rand(40,80);const qs=this.game.queueSystem;
   const cand=qs.clients.find(c=>c.state==='waiting'&&c!==qs.activeClient()&&!c.ratKing);
   if(cand){qs.clients.splice(qs.clients.indexOf(cand),1);qs.interact.unregister(cand.head);qs.reindex();qs.refreshActiveOrder();
    cand.toilet=true;cand.intruder=true;cand.fleeing=false;cand.state='walk';cand.setTargetRouted(CONFIG.TOILET_POS.x,CONFIG.TOILET_POS.z,'walk');
    qs.intruders.push(cand);this.pending=cand;}}}
 release(emb){const c=this.occupant;if(!c)return;this.occupant=null;this.door.unlock();SOUND.play('creak');SOUND.play('flush',0.3);
  if(emb){c.setMood('blush',5);c.setBubble('Ладно, выхожу! Че стучишь!',4);}
  c.toilet=false;c.intruder=true;c.fleeing=true;c.speed=3;this.game.queueSystem.sendOut(c);
  if(this.game.queueSystem.intruders.indexOf(c)<0)this.game.queueSystem.intruders.push(c);}
 dispose(){}}

export class HingeDoor{constructor(scene,physics,interact,hx,hz,width,height,color,name,action){
 this.w=width;this.h=height;this.locked=false;this.physics=physics;this.hx=hx;this.hz=hz;
 this.group=new THREE.Group();scene.add(this.group);
 this.mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,0.1),new THREE.MeshStandardMaterial({map:TEX.wood,color}));
 const knob=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6),new THREE.MeshStandardMaterial({color:0xcccc00}));knob.position.set(width/2-0.15,0,0.08);this.mesh.add(knob);
 this.group.add(this.mesh);
 this.anchor=new CANNON.Body({mass:0,material:physics.defaultMaterial});this.anchor.addShape(new CANNON.Box(new CANNON.Vec3(0.06,height/2,0.06)));this.anchor.position.set(hx,height/2,hz);physics.addBody(this.anchor,null);
 this.body=new CANNON.Body({mass:6,material:physics.defaultMaterial,linearDamping:0.25,angularDamping:0.7});
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(width/2,height/2,0.05)));this.body.position.set(hx+width/2,height/2,hz);physics.addBody(this.body,this.group);
 this.constraint=new CANNON.HingeConstraint(this.anchor,this.body,{pivotA:new CANNON.Vec3(0,0,0),pivotB:new CANNON.Vec3(-width/2,0,0),axisA:new CANNON.Vec3(0,1,0),axisB:new CANNON.Vec3(0,1,0)});
 physics.addConstraint(this.constraint);
 if(action)interact.register(this.mesh,name,action);}
 yaw(){const e=new THREE.Euler().setFromQuaternion(this.body.quaternion,'YXZ');return e.y;}
 lock(){this.locked=true;this.body.type=CANNON.Body.STATIC;this.body.angularVelocity.set(0,0,0);}
 unlock(){this.locked=false;this.body.type=CANNON.Body.DYNAMIC;this.body.wakeUp();}
 motor(w){if(this.locked){this.body.angularVelocity.set(0,0,0);return;}const y=this.yaw();
  if(w){this.body.angularVelocity.y=y<1.35?2.2:this.body.angularVelocity.y*0.5;}
  else{this.body.angularVelocity.y=y>0.05?-1.6:this.body.angularVelocity.y*0.5;}}
 push(){if(this.locked)return;this.body.wakeUp();this.body.angularVelocity.y+=(this.yaw()<0.7?2.6:-2.6);SOUND.play('creak');}
 reset(){this.locked=false;this.body.type=CANNON.Body.DYNAMIC;this.body.position.set(this.hx+this.w/2,this.h/2,this.hz);this.body.quaternion.set(0,0,0,1);this.body.angularVelocity.set(0,0,0);this.body.velocity.set(0,0,0);}
 dispose(){this.physics.removeConstraint(this.constraint);this.physics.removeBody(this.body);this.physics.removeBody(this.anchor);this.scene.remove(this.group);}}

export class WorldBuilder{constructor(s,p,i){this.scene=s;this.physics=p;this.interact=i;
 this.matFloor=new THREE.MeshStandardMaterial({map:TEX.floor});this.matWall=new THREE.MeshStandardMaterial({map:TEX.wall});
 this.matWood=new THREE.MeshStandardMaterial({map:TEX.wood});this.matMetal=new THREE.MeshStandardMaterial({map:TEX.metal,metalness:0.55,roughness:0.4});this.matPlaster=new THREE.MeshStandardMaterial({map:TEX.plaster});}
 addStaticBox(w,h,d,x,y,z,mat,l){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;this.scene.add(m);
  const b=new CANNON.Body({mass:0,material:this.physics.defaultMaterial});b.addShape(new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)));b.position.set(x,y,z);b.label=l||'static';this.physics.addBody(b,m);return m;}
 addAO(x,z,s){const m=aoMesh(s);m.position.set(x,0.02,z);this.scene.add(m);}
 createZone(x,z,w,d,c,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.18}));m.rotation.x=-Math.PI/2;m.position.set(x,y||0.012,z);this.scene.add(m);}
 addDoorVisual(x,y,z,w,h,ry){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.1),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.45}));m.position.set(x,y,z);m.rotation.y=ry||0;this.scene.add(m);return m;}
 build(){const C=CONFIG.COLORS,CZ=CONFIG.COUNTER_Z;
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(30,30),this.matFloor);fm.rotation.x=-Math.PI/2;fm.receiveShadow=true;this.scene.add(fm);
  const fb=new CANNON.Body({mass:0,material:this.physics.defaultMaterial});fb.addShape(new CANNON.Plane());fb.quaternion.setFromEuler(-Math.PI/2,0,0);fb.label='floor';this.physics.addBody(fb,fm);
  const ceil=new THREE.Mesh(new THREE.BoxGeometry(20,0.3,30),this.matPlaster);ceil.position.set(0,4.15,0);this.scene.add(ceil);
  const hole=new THREE.Mesh(new THREE.CircleGeometry(0.7,12),new THREE.MeshBasicMaterial({color:0x000000}));hole.rotation.x=Math.PI/2;hole.position.set(CONFIG.HOLE_POS.x,3.98,CONFIG.HOLE_POS.z);this.scene.add(hole);
  const bbM=new THREE.MeshStandardMaterial({color:0x3a3a3a});
  const bb=(w,d,x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.12,d),bbM);m.position.set(x,0.06,z);this.scene.add(m);};
  bb(20,0.06,0,-14.9);bb(11,0.06,-4.5,14.9);bb(6,0.06,7,14.9);bb(0.06,30,-9.9,0);bb(0.06,21,9.9,-4.5);bb(0.06,5,9.9,12.5);
  const pipeM=new THREE.MeshStandardMaterial({map:TEX.metal,color:0x8a8a8a,metalness:0.5,roughness:0.45});
  for(const pz of[-6,4]){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,19,8),pipeM);p.rotation.z=Math.PI/2;p.position.set(0,3.95,pz);this.scene.add(p);}
  const vent=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.1,0.8),pipeM);vent.position.set(CONFIG.COMPUTER_POS.x+1,3.9,CONFIG.COMPUTER_POS.z);this.scene.add(vent);
  for(let i=0;i<4;i++){const sl=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.02,0.1),new THREE.MeshStandardMaterial({color:0x333333}));sl.position.set(CONFIG.COMPUTER_POS.x+1,3.85,CONFIG.COMPUTER_POS.z-0.3+i*0.2);this.scene.add(sl);}
  const grimeM=new THREE.MeshBasicMaterial({map:TEX.ao,transparent:true,opacity:0.22,depthWrite:false});
  for(let i=0;i<8;i++){const g=new THREE.Mesh(new THREE.PlaneGeometry(Utils.rand(0.6,1.6),Utils.rand(0.4,1.2)),grimeM);
   const side=Utils.randInt(0,3);
   if(side===0){g.position.set(Utils.rand(-9,9),Utils.rand(0.5,2.5),-14.4);}
   else if(side===1){g.position.set(-9.4,Utils.rand(0.5,2.5),Utils.rand(-14,14));g.rotation.y=Math.PI/2;}
   else if(side===2){g.position.set(9.4,Utils.rand(0.5,2.5),Utils.rand(-14,14));g.rotation.y=-Math.PI/2;}
   else{g.position.set(Utils.rand(-9,9),Utils.rand(0.5,2.5),14.4);g.rotation.y=Math.PI;}
   this.scene.add(g);}
  const floorGrime=new THREE.MeshBasicMaterial({map:TEX.ao,transparent:true,opacity:0.16,depthWrite:false});
  for(let i=0;i<12;i++){const g=new THREE.Mesh(new THREE.PlaneGeometry(Utils.rand(1,3),Utils.rand(1,3)),floorGrime);g.rotation.x=-Math.PI/2;g.rotation.z=Utils.rand(0,3);g.position.set(Utils.rand(-9,9),0.015,Utils.rand(-14,14));this.scene.add(g);}
  this.neonMat=new THREE.MeshBasicMaterial({map:TEX.neon,transparent:true});
  const neon=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),this.neonMat);neon.position.set(CONFIG.ENTRY_DOOR.x+2.4,3.0,14.35);neon.rotation.y=Math.PI;this.scene.add(neon);
  const cg=new THREE.Group();cg.position.set(1.8,2.7,2.92);this.scene.add(cg);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.35,0.04,8,20),new THREE.MeshStandardMaterial({color:0x332211}));cg.add(rim);
  const face=new THREE.Mesh(new THREE.CircleGeometry(0.33,20),new THREE.MeshStandardMaterial({color:0xeeeedd}));cg.add(face);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tk=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.06,0.01),new THREE.MeshStandardMaterial({color:0x222222}));tk.position.set(Math.sin(a)*0.27,Math.cos(a)*0.27,0.01);tk.rotation.z=-a;cg.add(tk);}
  this.clockHourG=new THREE.Group();cg.add(this.clockHourG);this.clockHourG.position.z=0.02;
  const hh=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.18,0.012),new THREE.MeshStandardMaterial({color:0x111111}));hh.position.y=0.09;this.clockHourG.add(hh);
  this.clockMinG=new THREE.Group();cg.add(this.clockMinG);this.clockMinG.position.z=0.03;
  const mh=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.26,0.012),new THREE.MeshStandardMaterial({color:0x111111}));mh.position.y=0.13;this.clockMinG.add(mh);
  this.addStaticBox(20,4,1,0,2,-15,this.matWall,'wall_back');
  this.addStaticBox(11,4,1,-4.5,2,15,this.matWall,'wall_front_l');this.addStaticBox(6,4,1,7,2,15,this.matWall,'wall_front_r');
  this.addDoorVisual(CONFIG.ENTRY_DOOR.x,2,15,3,4,0);
  this.addStaticBox(1,4,30,-10,2,0,this.matWall,'wall_left');
  this.addStaticBox(1,4,21,10,2,-4.5,this.matWall,'wall_right_a');this.addStaticBox(1,4,5,10,2,12.5,this.matWall,'wall_right_b');
  this.addDoorVisual(10,2,CONFIG.EXIT_DOOR.z,4,4,Math.PI/2);
  this.createZone(0,-11.5,14,7,C.STORAGE);this.createZone(0,0,20,6.6,C.KITCHEN);this.createZone(0,9,20,11,C.HALL);this.createZone(8.2,12.2,2.4,4.4,0x99cc99,0.02);
  this.addStaticBox(8.8,3,1,-5.6,1.5,-7.6,this.matWood,'store_wall_l');this.addStaticBox(8.8,3,1,5.6,1.5,-7.6,this.matWood,'store_wall_r');
  this.counter=this.addStaticBox(15,1.1,0.9,-1.5,0.55,CZ,this.matMetal,'counter');this.addAO(-1.5,CZ,3);this.interact.register(this.counter,'Прилавок',()=>{});
  const cash=this.addStaticBox(0.5,0.3,0.4,-5.5,1.25,CZ,new THREE.MeshStandardMaterial({color:0x222222}),'cash_register');this.interact.register(cash,'Касса',()=>{});
  this.glassMesh=new THREE.Mesh(new THREE.BoxGeometry(8,0.9,0.06),new THREE.MeshStandardMaterial({color:0xaaddff,transparent:true,opacity:0.3,roughness:0.1}));this.glassMesh.position.set(CONFIG.GLASS_POS.x,CONFIG.GLASS_POS.y,CONFIG.GLASS_POS.z);this.scene.add(this.glassMesh);
  const frameM=this.matMetal;
  this.addStaticBox(8,0.08,0.12,CONFIG.GLASS_POS.x,CONFIG.GLASS_POS.y+0.48,CONFIG.GLASS_POS.z,frameM,'gf_t');
  this.addStaticBox(8,0.08,0.12,CONFIG.GLASS_POS.x,CONFIG.GLASS_POS.y-0.48,CONFIG.GLASS_POS.z,frameM,'gf_b');
  this.addStaticBox(0.12,1.0,0.12,CONFIG.GLASS_POS.x-4,CONFIG.GLASS_POS.y,CONFIG.GLASS_POS.z,frameM,'gf_l');
  this.addStaticBox(0.12,1.0,0.12,CONFIG.GLASS_POS.x+4,CONFIG.GLASS_POS.y,CONFIG.GLASS_POS.z,frameM,'gf_r');
  this.glassBody=new CANNON.Body({mass:0,material:this.physics.defaultMaterial});this.glassBody.addShape(new CANNON.Box(new CANNON.Vec3(4,0.45,0.03)));this.glassBody.position.set(CONFIG.GLASS_POS.x,CONFIG.GLASS_POS.y,CONFIG.GLASS_POS.z);this.glassBody.label='glass';this.physics.addBody(this.glassBody,this.glassMesh);this.glassIntact=true;
  const menu=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.9),new THREE.MeshBasicMaterial({map:TEX.menu}));menu.position.set(-1.5,2.6,2.85);this.scene.add(menu);
  const p1=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TEX.poster1}));p1.position.set(-9.44,1.8,0);p1.rotation.y=Math.PI/2;this.scene.add(p1);
  const p2=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TEX.poster2}));p2.position.set(-9.44,1.8,-3);p2.rotation.y=Math.PI/2;this.scene.add(p2);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshBasicMaterial({map:TEX.sign}));sign.position.set(CONFIG.ENTRY_DOOR.x,3.2,14.4);sign.rotation.y=Math.PI;this.scene.add(sign);
  for(const tz of[8,11]){this.addStaticBox(1.1,0.75,1.1,4.5,0.375,tz,this.matWood,'hall_table');this.addAO(4.5,tz,2);
   for(const sx of[-0.7,0.7])this.addStaticBox(0.4,0.5,0.4,4.5+sx,0.25,tz,this.matWood,'stool');
   for(let i=0;i<2;i++){const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.14,8),new THREE.MeshStandardMaterial({color:0xdddddd}));cup.position.set(4.5+(i?0.25:-0.25),0.82,tz+(i?0.2:-0.2));this.scene.add(cup);}}
  const trash=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.3,0.9,10),this.matMetal);trash.position.set(8.8,0.45,6.5);this.scene.add(trash);
  const trashLid=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.06,10),new THREE.MeshStandardMaterial({color:0x336633}));trashLid.position.set(8.8,0.93,6.5);this.scene.add(trashLid);
  this.addAO(8.8,6.5,1.4);
  this.addStaticBox(0.7,0.9,0.7,8.8,0.45,6.5,this.matMetal,'trash');
  const bucket=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.18,0.35,10),new THREE.MeshStandardMaterial({color:0x336699}));bucket.position.set(CONFIG.SINK_POS.x+0.8,0.18,CONFIG.SINK_POS.z+0.5);this.scene.add(bucket);
  for(let i=0;i<3;i++){const tray=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.03,0.35),new THREE.MeshStandardMaterial({color:0x884422}));tray.position.set(-6.5,1.13+i*0.04,CZ);this.scene.add(tray);}
  this.sinkMesh=this.addStaticBox(1.2,1,1,CONFIG.SINK_POS.x,0.5,CONFIG.SINK_POS.z,this.matMetal,'sink');this.addAO(CONFIG.SINK_POS.x,CONFIG.SINK_POS.z,1.8);
  const basin=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.1,0.7),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x778899}));basin.position.set(CONFIG.SINK_POS.x,1.02,CONFIG.SINK_POS.z);this.scene.add(basin);
  this.cutMesh=this.addStaticBox(2,1,1.2,CONFIG.CUT_POS.x,0.5,CONFIG.CUT_POS.z,this.matMetal,'cut_table');this.addAO(CONFIG.CUT_POS.x,CONFIG.CUT_POS.z,2.6);
  this.assemblyMesh=this.addStaticBox(2,1,1.2,CONFIG.ASSEMBLY_POS.x,0.5,CONFIG.ASSEMBLY_POS.z,this.matMetal,'assembly_table');this.addAO(CONFIG.ASSEMBLY_POS.x,CONFIG.ASSEMBLY_POS.z,2.6);
  this.addStaticBox(0.5,1.2,0.5,CONFIG.KNIFE_SLOT.x,0.6,CONFIG.KNIFE_SLOT.z,this.matWood,'knife_col');this.addAO(CONFIG.KNIFE_SLOT.x,CONFIG.KNIFE_SLOT.z,1.0);
  const block=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.16,0.22),new THREE.MeshStandardMaterial({map:TEX.wood,color:0x664422}));block.position.set(CONFIG.KNIFE_SLOT.x,1.26,CONFIG.KNIFE_SLOT.z);this.scene.add(block);
  this.knifeDecor=new THREE.Group();const bl2=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.34,0.016),new THREE.MeshStandardMaterial({map:TEX.metal,color:0xcccccc}));bl2.position.y=0.05;const hd2=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.2,0.03),new THREE.MeshStandardMaterial({color:0x332211}));hd2.position.y=0.3;this.knifeDecor.add(bl2,hd2);this.knifeDecor.position.set(CONFIG.KNIFE_SLOT.x,1.32,CONFIG.KNIFE_SLOT.z);this.knifeDecor.rotation.set(0.05,0,0.12);this.scene.add(this.knifeDecor);
  this.hookMesh=this.addStaticBox(0.18,0.18,0.18,CONFIG.HOOK_POS.x,CONFIG.HOOK_POS.y,CONFIG.HOOK_POS.z,new THREE.MeshStandardMaterial({color:0xff2222}),'hook');
  const br=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.3,0.1),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x777777}));br.position.set(CONFIG.HOOK_POS.x,CONFIG.HOOK_POS.y,CONFIG.HOOK_POS.z-0.06);this.scene.add(br);
  this.crowbarDecor=new THREE.Group();const bar=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.85),new THREE.MeshStandardMaterial({color:0xbb3322}));const t1=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.2,0.07),new THREE.MeshStandardMaterial({color:0xbb3322}));t1.position.set(0,-0.1,0.42);t1.rotation.x=0.5;const t2=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.16,0.07),new THREE.MeshStandardMaterial({color:0xbb3322}));t2.position.set(0,0.08,-0.42);t2.rotation.x=-0.4;this.crowbarDecor.add(bar,t1,t2);this.crowbarDecor.position.set(CONFIG.HOOK_POS.x,CONFIG.HOOK_POS.y,CONFIG.HOOK_POS.z+0.1);this.scene.add(this.crowbarDecor);
  this.addStaticBox(1.5,1,1.2,CONFIG.GRINDER_POS.x,0.5,CONFIG.GRINDER_POS.z,this.matMetal,'grinder_table');this.addAO(CONFIG.GRINDER_POS.x,CONFIG.GRINDER_POS.z,2);
  this.grinderMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.8,8),new THREE.MeshStandardMaterial({map:TEX.metal,color:0x999999}));this.grinderMesh.position.set(CONFIG.GRINDER_POS.x,1.4,CONFIG.GRINDER_POS.z);this.scene.add(this.grinderMesh);
  const mg=new CANNON.Body({mass:0,material:this.physics.defaultMaterial});mg.addShape(new CANNON.Cylinder(0.3,0.4,0.8,8));mg.position.set(CONFIG.GRINDER_POS.x,1.4,CONFIG.GRINDER_POS.z);mg.label='grinder';this.physics.addBody(mg,this.grinderMesh);
  const CP=CONFIG.COMPUTER_POS;this.addStaticBox(1.2,0.9,0.7,CP.x,0.45,CP.z,this.matWood,'comp_desk');this.addAO(CP.x,CP.z,1.8);
  this.compMesh=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.5,0.15),new THREE.MeshStandardMaterial({color:0x223322,emissive:0x003300}));
  this.compMesh.position.set(CP.x,1.2,CP.z-0.1);this.compMesh.rotation.y=Math.PI/2;this.scene.add(this.compMesh);
  const kb=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.05,0.2),new THREE.MeshStandardMaterial({color:0x223322}));kb.position.set(CP.x+0.35,0.93,CP.z);kb.rotation.y=Math.PI/2;this.scene.add(kb);
  this.addStaticBox(0.5,3,4.5,7.25,1.5,12.25,this.matWall,'bath_wall_x');
  this.addStaticBox(1.3,3,0.5,6.15,1.5,10,this.matWall,'bath_wall_z1');this.addStaticBox(1.2,3,0.5,9.1,1.5,10,this.matWall,'bath_wall_z2');
  this.addStaticBox(6,1,1,-4,0.5,-14,this.matWood,'shelf_1');this.addAO(-4,-14,6);
  this.addStaticBox(6,1,1,2,0.5,-14,this.matWood,'shelf_2');this.addAO(2,-14,6);
  this.addAO(CONFIG.FRIDGE_POS.x,CONFIG.FRIDGE_POS.z,1.6);
  this.addAO(CONFIG.STOVE_POS.x,CONFIG.STOVE_POS.z,2);
  this.addAO(CONFIG.TOILET_POS.x,CONFIG.TOILET_POS.z,1.2);
  this.scene.add(new THREE.AmbientLight(0x1a1a22,0.5));
  this.scene.add(new THREE.HemisphereLight(0x8899bb,0x443322,0.22));
  this.scene.fog=new THREE.Fog(0x050508,10,34);this.scene.background=new THREE.Color(0x050508);}}

export class EconomySystem{constructor(g){this.game=g;}addMoney(n){this.game.setMoney(GAME_DATA.money+n);this.game.portrait.rig.setMood('happy',3);}update(dt){}dispose(){}}

export class DaySystem{constructor(g){this.game=g;this.t=CONFIG.DAY_LENGTH;this.active=false;this.timeEl=document.getElementById('daytime');this.rent=0;this.render();}
 startDay(){this.t=CONFIG.DAY_LENGTH;this.active=true;this.render();GAME_DATA.status='Открыто';const s=document.getElementById('status');if(s)s.textContent='Открыто';}
 render(){const m=Math.floor(Math.max(0,this.t)/60),s=Math.floor(Math.max(0,this.t)%60);this.timeEl.textContent=m+':'+(s<10?'0':'')+s;}
 update(dt){if(!this.active||this.game.state!=='play')return;this.t-=dt;this.render();if(this.t<=0){this.active=false;this.endDay();}}
 endDay(){const g=this.game;
  try{const S=GAME_DATA.stats;
   if(S.died===0)g.unlockAch('peaceful');
   if(GAME_DATA.shame<1)g.unlockAch('conscience');
   this.rent=50+GAME_DATA.day*10;g.setMoney(GAME_DATA.money-this.rent);
  }catch(e){LOGGER.error('endDay calc: '+e.message);}
  g.state='dayend';g.input.lookActive=false;g.talk=null;
  try{if(g.minigame)g.endMinigame();}catch(e){}
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  try{const S=GAME_DATA.stats;
   g.el.hud.style.display='none';g.el.overlay.style.display='flex';
   g.el.overlayTitle.textContent='🌙 День '+GAME_DATA.day+' завершён!';
   g.el.overlayHint.innerHTML='Обслужил: '+S.served+' | Злых: '+S.angry+' | Трупов: '+S.died+'<br>Крыс раздавил: '+S.rats+' | Заработано: '+S.earned+'₽<br>АРЕНДА+СВЕТ: -'+this.rent+'₽ | Репа: '+GAME_DATA.reputation+'⭐<br>Итого денег: '+GAME_DATA.money+'₽<br>🏆 Новые ачивки: '+(g.achToday.length?g.achToday.map(i=>ACH_MAP[i].name).join(', '):'нет')+'<br>[ КЛИК — магазин, потом день '+(GAME_DATA.day+1)+' ]';
   g.el.overlayHint.style.color='#00ff00';
  }catch(e){LOGGER.error('endDay ui: '+e.message);}
  SOUND.play('cash');storeSave();}
 dispose(){}}

export class ShopSystem{constructor(g){this.game=g;this.el=document.getElementById('shop');this.items=[{id:'pan',name:'Антипригарная сковорода',desc:'сгорает позже',cost:150},{id:'oil',name:'Масло+',desc:'3 жарки',cost:120},{id:'shoes',name:'Кроссовки',desc:'не скользишь',cost:200},{id:'apron',name:'Фартук',desc:'грязь медленнее',cost:100},{id:'trap',name:'Крысоловки',desc:'живность реже',cost:180},{id:'vent',name:'Вытяжка',desc:'пожар медленнее',cost:220}];}
 open(){this.render();this.el.style.display='flex';}close(){this.el.style.display='none';}
 render(){let h='<h2>🛒 НОЧНОЙ МАГАЗИН</h2><div class="shop-money">Деньги: '+GAME_DATA.money+'₽</div>';
  for(const it of this.items){const o=GAME_DATA.upgrades[it.id];h+='<button data-id="'+it.id+'" '+(o?'disabled':'')+'>'+(o?'✔ '+it.name:it.name+' — '+it.cost+'₽. '+it.desc)+'</button>';}
  h+='<button id="shop-go">▶ День '+(GAME_DATA.day+1)+'</button>';this.el.innerHTML=h;
  this.el.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>this.buy(b.dataset.id));
  const go=document.getElementById('shop-go');if(go)go.onclick=()=>this.game.startNextDay();}
 buy(id){const it=this.items.find(x=>x.id===id);if(!it||GAME_DATA.upgrades[id])return;if(GAME_DATA.money<it.cost){this.game.toast('Денег нет!');SOUND.play('deny');return;}this.game.setMoney(GAME_DATA.money-it.cost);GAME_DATA.upgrades[id]=true;SOUND.play('cash');storeSave();this.render();}
 update(dt){}dispose(){}}

export class DeliverySystem{constructor(g){this.game=g;this.el=document.getElementById('compshop');this.items=[{id:'crate',name:'> ЯЩИК С ЛУТОМ (из дыры)',cost:20},{id:'cat',name:'> КОТ ТУКСЕДО',cost:300},{id:'cigs',name:'> ПАЧКА СИГАРЕТ',cost:50}];}
 open(){this.render();this.el.style.display='flex';this.game.state='computer';this.game.input.lookActive=false;try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}SOUND.play('beep');}
 close(){this.el.style.display='none';this.game.state='play';this.game.input.lookActive=true;this.game.input.lock(this.game.renderer.domElement);this.game.clock.getDelta();}
 render(){let h='<h2>ROBCO INDUSTRIES (TM) TERMLINK</h2><div class="shop-money">КРЫТКИ: '+GAME_DATA.money+'₽</div>';
  for(const it of this.items)h+='<button data-id="'+it.id+'">'+it.name+' — '+it.cost+'₽</button>';
  h+='<button id="comp-close">> ОТОЙТИ ОТ ТЕРМИНАЛА</button>';this.el.innerHTML=h;
  this.el.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>this.buy(b.dataset.id));
  document.getElementById('comp-close').onclick=()=>this.close();}
 buy(id){const it=this.items.find(x=>x.id===id);if(GAME_DATA.money<it.cost){this.game.toast('Денег нет!');SOUND.play('deny');return;}this.game.setMoney(GAME_DATA.money-it.cost);
  if(id==='crate')this.game.spawnDeliveryCrate();if(id==='cat')this.game.catSystem.spawn();
  if(id==='cigs')this.game.spawnItem('tool_cigs',{x:CONFIG.COMPUTER_POS.x+0.3,y:1.1,z:CONFIG.COMPUTER_POS.z});
  this.game.toast('Доставка оформлена!');SOUND.play('beep');storeSave();this.render();}}