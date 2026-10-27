// ==== ITEMS: интеракции, предметы, бутерброды, ящики, лужи ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, GAME_DATA, PUDDLE_COLORS, Utils, defMass } from './config.js';
import { TEX, aoMesh, itemMapTex, buildBottle, SOUND } from './media.js';

export class InteractSystem{constructor(cam){this.camera=cam;this.raycaster=new THREE.Raycaster();this.interactables=[];this.highlightables=[];this.hovered=null;this.hoverHL=null;this.hintEl=document.getElementById('interact-hint');}
 register(m,n,a){m.userData={isInteractable:true,name:n,action:a};this.interactables.push(m);}
 unregister(m){this.interactables=this.interactables.filter(x=>x!==m);if(this.hovered===m)this.hovered=null;}
 addHighlight(m){this.highlightables.push(m);}removeHighlight(m){this.highlightables=this.highlightables.filter(x=>x!==m);if(this.hoverHL===m)this.hoverHL=null;}
 setEmissive(o,h){if(o&&o.material&&o.material.emissive)o.material.emissive.setHex(h);}
 raycastItemEntity(items,range){this.raycaster.setFromCamera(new THREE.Vector2(0,0),this.camera);const hits=this.raycaster.intersectObjects(this.highlightables,true);
  for(const h of hits){if(h.distance>(range||CONFIG.INTERACT_DISTANCE))break;let o=h.object;while(o.parent&&!(o.userData&&o.userData.isItem))o=o.parent;
   if(o.userData&&o.userData.isItem&&o.visible!==false){const e=items.find(i=>i.mesh===o||i.group===o);if(e)return e;}}return null;}
 floorPointInFront(d){const f=_fwdLocal;this.camera.getWorldDirection(f);f.y=0;if(f.lengthSq()<0.001)f.set(0,0,-1);f.normalize();const p=this.camera.position;return new THREE.Vector3(p.x+f.x*d,0,p.z+f.z*d);}
 update(){this.raycaster.setFromCamera(new THREE.Vector2(0,0),this.camera);
  if(this.hovered){this.setEmissive(this.hovered,0);this.hovered=null;this.hintEl.style.display='none';}
  if(this.hoverHL){this.setEmissive(this.hoverHL,0);this.hoverHL=null;}
  const hi=this.raycaster.intersectObjects(this.interactables,true);let obj=null;
  if(hi.length&&hi[0].distance<CONFIG.INTERACT_DISTANCE){let o=hi[0].object;while(o.parent&&!(o.userData&&o.userData.isInteractable))o=o.parent;if(o.userData&&o.userData.isInteractable)obj=o;}
  if(obj){this.hovered=obj;this.setEmissive(obj,0x333333);this.hintEl.textContent='[E] '+obj.userData.name;this.hintEl.style.display='block';}
  const hh=this.raycaster.intersectObjects(this.highlightables,true);
  if(hh.length&&hh[0].distance<CONFIG.INTERACT_DISTANCE){let o=hh[0].object;while(o.parent&&!(o.userData&&o.userData.isItem))o=o.parent;if(o.userData&&o.userData.isItem&&o.visible!==false&&o!==obj){this.hoverHL=o;this.setEmissive(o,0x1a1a1a);}}}
 interact(){if(this.hovered&&this.hovered.userData&&this.hovered.userData.action){this.hovered.userData.action();}}}
const _fwdLocal=new THREE.Vector3();

export class HoldSystem{constructor(cam){this.camera=cam;this.heldEntity=null;this.heldItemEl=document.getElementById('held-item');}
 pickUp(e){if(this.heldEntity)return;this.heldEntity=e;e.body.type=CANNON.Body.KINEMATIC;e.body.velocity.set(0,0,0);e.body.angularVelocity.set(0,0,0);GAME_DATA.heldItem=e.name;this.heldItemEl.textContent='В руках: '+e.name;SOUND.play('pickup');}
 releaseHeld(){this.heldEntity=null;GAME_DATA.heldItem=null;this.heldItemEl.textContent='';}
 update(){if(this.heldEntity){const off=new THREE.Vector3(0.45,-0.35,-1.4).applyQuaternion(this.camera.quaternion);const tp=this.camera.position.clone().add(off);const b=this.heldEntity.body;b.position.set(tp.x,tp.y,tp.z);b.quaternion.copy(this.camera.quaternion);
  if(this.heldEntity.group&&!b.skipMeshSync){this.holdEntitySync();}}}
 holdEntitySync(){const g=this.heldEntity.group,b=this.heldEntity.body;g.position.copy(b.position);g.quaternion.copy(b.quaternion);}}

export class ItemEntity{constructor(scene,physics,def,pos,mystery){this.scene=scene;this.physics=physics;this.def=def;this.meta={kind:def.kind,variant:def.variant,defId:def.id};this.placed=null;this.mystery=!!mystery;this.carriedBy=null;this.blinkMats=null;this.noBreak=0;
 let geo,shape;
 if(def.id==='hazard_dynamite'){const g=new THREE.Group();const red=new THREE.MeshStandardMaterial({color:0xcc2222});red.emissive=new THREE.Color(0x330000);this.blinkMats=[red];
  for(const ox of[0.08,-0.08])for(const oz of[0.08,-0.08]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,8),red);c.position.set(ox,0,oz);g.add(c);}
  const sm=new THREE.MeshStandardMaterial({color:0x886633});const s1=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.06,10),sm);s1.position.y=0.08;g.add(s1);const s2=s1.clone();s2.position.y=-0.12;g.add(s2);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.16,0.3,0.16));}
 else if(def.id==='tool_mop'){const g=new THREE.Group();const w=new THREE.MeshStandardMaterial({map:TEX.wood});
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.3,6),w);stick.position.y=0.4;g.add(stick);
  const cross=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.5,6),w);cross.rotation.z=Math.PI/2;cross.position.y=-0.25;g.add(cross);
  const sp=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.1,0.12),new THREE.MeshStandardMaterial({color:0x336699}));sp.position.y=-0.32;g.add(sp);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.05,0.65,0.05));}
 else if(def.id==='tool_cigs'){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.22,0.06),new THREE.MeshStandardMaterial({color:0xeeeeee}));g.add(p);
  const st=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.06,0.07),new THREE.MeshStandardMaterial({color:0xcc2222}));st.position.y=0.05;g.add(st);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.06,0.11,0.03));}
 else if(def.id==='dead_rat'){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x6a5a4a});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),mat);body.scale.set(1,0.35,1.6);g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),mat);head.scale.set(1,0.5,1.2);head.position.set(0,0.02,0.4);g.add(head);
  const xm=new THREE.MeshStandardMaterial({color:0x111111});
  for(const sx of[-1,1]){const xg=new THREE.Group();for(const r of[Math.PI/4,-Math.PI/4]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,0.02),xm);b.rotation.z=r;xg.add(b);}xg.position.set(sx*0.07,0.09,0.5);g.add(xg);}
  const tg=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,0.09),new THREE.MeshStandardMaterial({color:0xdd6688}));tg.position.set(0,0.02,0.56);g.add(tg);
  for(const sx of[-1,1])for(const sz of[0.2,-0.2]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(0.04,0.12,4,4),mat);leg.position.set(sx*0.2,0.06,sz);leg.rotation.z=sx*1.2;g.add(leg);}
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.01,0.5,5),mat);tail.rotation.x=1.7;tail.position.set(0,0.02,-0.5);g.add(tail);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.25,0.08,0.35));}
 else if(def.id==='dead_roach'){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x2a1a0a});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),mat);body.scale.set(1.2,0.3,1.8);g.add(body);
  for(let i=0;i<6;i++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,4),mat);leg.position.set((i%2?1:-1)*0.1,0.07,(i>>1)*0.08-0.08);leg.rotation.z=(i%2?1:-1)*2.2;g.add(leg);}
  const a1=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.2,4),mat);a1.rotation.x=1.2;a1.position.set(0.03,0.05,0.2);g.add(a1);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.12,0.04,0.12));}
 else if(def.id==='ing_tomato'||def.id==='ing_onion'){const g=new THREE.Group();const mp=itemMapTex(def.id);
  const m=new THREE.Mesh(new THREE.SphereGeometry(def.p[0],12,12),new THREE.MeshStandardMaterial({color:def.color,map:mp}));g.add(m);
  if(def.id==='ing_tomato'){const stm=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.09,5),new THREE.MeshStandardMaterial({color:0x2a7a2a}));stm.position.y=def.p[0]*0.95;g.add(stm);}
  else{const sp=new THREE.Mesh(new THREE.ConeGeometry(0.025,0.1,5),new THREE.MeshStandardMaterial({color:0x8a6a3a}));sp.position.y=def.p[0]*0.95;g.add(sp);}
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Sphere(def.p[0]);}
 else if(def.kind==='sauce'||def.id==='empty_bottle'||def.id==='hazard_bleach'){const g=buildBottle(def);this.mesh=g;scene.add(g);shape=new CANNON.Cylinder(def.p[0],def.p[0],def.p[1],8);}
 else if(def.id==='tool_knife'){const g=new THREE.Group();
  const blade=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.012,0.42),new THREE.MeshStandardMaterial({map:TEX.metal,color:0xcccccc,metalness:0.6,roughness:0.3}));blade.position.z=-0.1;g.add(blade);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.03,0.2),new THREE.MeshStandardMaterial({color:0x332211}));handle.position.z=0.2;g.add(handle);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.04,0.03,0.3));}
 else if(def.id==='tool_crowbar'){const g=new THREE.Group();const red=new THREE.MeshStandardMaterial({color:0xbb3322,roughness:0.5});
  const bar=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.055,0.85),red);g.add(bar);
  const hook=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.18,0.055),red);hook.position.set(0,-0.07,0.42);hook.rotation.x=0.5;g.add(hook);
  const tip=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.035,0.12),red);tip.position.set(0,0.02,-0.44);tip.rotation.x=-0.3;g.add(tip);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Box(new CANNON.Vec3(0.05,0.05,0.5));}
 else if(def.id==='tool_spray'){const g=new THREE.Group();
  const bodyM=new THREE.MeshStandardMaterial({color:0x22dd55,roughness:0.4});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.3,10),bodyM);g.add(body);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.07,0.07,10),new THREE.MeshStandardMaterial({color:0x888888}));top.position.y=0.18;g.add(top);
  const noz=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.06),new THREE.MeshStandardMaterial({color:0x222222}));noz.position.set(0,0.2,0.06);g.add(noz);
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(0.093,0.093,0.14,10,1,true),new THREE.MeshStandardMaterial({color:0xeeffee}));lab.position.y=-0.02;g.add(lab);
  g.userData={isItem:true};this.mesh=g;scene.add(g);shape=new CANNON.Cylinder(def.p[0],def.p[0],def.p[1],8);}
 else if(def.id==='hazard_shard'){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.09,0.02,3),new THREE.MeshStandardMaterial({color:0xcceeff,transparent:true,opacity:0.75}));m.userData={isItem:true};this.mesh=m;scene.add(m);shape=new CANNON.Cylinder(0.1,0.1,0.02,3);}
 else{if(def.shape==='box'){geo=new THREE.BoxGeometry(def.p[0],def.p[1],def.p[2]);shape=new CANNON.Box(new CANNON.Vec3(def.p[0]/2,def.p[1]/2,def.p[2]/2));}
  else if(def.shape==='cyl'){geo=new THREE.CylinderGeometry(def.p[0],def.p[0],def.p[1],8);shape=new CANNON.Cylinder(def.p[0],def.p[0],def.p[1],8);}
  else{geo=new THREE.SphereGeometry(def.p[0],10,10);shape=new CANNON.Sphere(def.p[0]);}
  const mopts={color:def.color};const mp=itemMapTex(def.id);if(mp)mopts.map=mp;
  this.mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial(mopts));this.mesh.castShadow=false;this.mesh.userData={isItem:true};scene.add(this.mesh);
  if(def.id==='ing_egg')this.mesh.scale.set(1,1.25,1);}
 this.mass=defMass(def);this.body=new CANNON.Body({mass:this.mass,material:physics.defaultMaterial});this.body.addShape(shape);this.body.allowSleep=true;
 this.body.position.set(pos.x,pos.y,pos.z);this.body.label=def.name;physics.addBody(this.body,this.mesh);this.name=mystery?'???':def.name;}
 setBlink(o){if(this.blinkMats)for(const m of this.blinkMats)m.emissive.setHex(o?0xff2200:0x330000);}
 dispose(){this.scene.remove(this.mesh);this.physics.removeBody(this.body);}}

export class SandwichEntity{constructor(scene,physics,lm,layers,pos,h){this.scene=scene;this.physics=physics;this.layers=layers;this.meta={kind:'sandwich',layers:layers||[],contaminated:false};
 this.group=new THREE.Group();for(const m of(lm||[]))this.group.add(m);this.group.position.set(pos.x,pos.y,pos.z);this.group.userData={isItem:true};scene.add(this.group);
 this.ao=aoMesh(1.0);this.ao.position.y=0.02;scene.add(this.ao);
 this.body=new CANNON.Body({mass:1.5+0.25*(layers?layers.length:0),material:physics.defaultMaterial});this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.35,h/2+0.05,0.35)));this.body.allowSleep=true;
 this.body.position.set(pos.x,pos.y+h/2+0.1,pos.z);this.body.label='sandwich';physics.addBody(this.body,null);this.name='Бутерброд';this.height=h;}
 contaminate(t){if(this.meta.contaminated)return;this.meta.contaminated=true;const col=t==='rat'?0x8a7a66:0x4a2a12,sc=t==='rat'?1:0.5;
  const p=new THREE.Mesh(new THREE.SphereGeometry(0.1*sc,6,6),new THREE.MeshStandardMaterial({color:col}));p.scale.set(0.8,0.5,1.3);p.position.set(Utils.rand(-0.15,0.15),this.height+0.06,Utils.rand(-0.15,0.15));this.group.add(p);this.name='Бутерброд (ПОДОЗРИТЕЛЬНЫЙ)';}
 sync(){this.group.position.copy(this.body.position);this.group.quaternion.copy(this.body.quaternion);this.ao.position.x=this.body.position.x;this.ao.position.z=this.body.position.z;}
 dispose(){this.scene.remove(this.group);this.scene.remove(this.ao);this.physics.removeBody(this.body);}}

export class CrateEntity{constructor(scene,physics,x,z){this.scene=scene;this.physics=physics;this.open=false;
 this.group=new THREE.Group();this.group.position.set(x,0.45,z);this.group.userData={isItem:true};
 this.ao=aoMesh(1.7);this.ao.position.set(x,0.02,z);scene.add(this.ao);
 this.mat=new THREE.MeshStandardMaterial({map:TEX.wood});
 const wall=(w,d,ox,oz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.9,d),this.mat);m.position.set(ox,0,oz);this.group.add(m);};
 wall(0.9,0.08,0,0.41);wall(0.9,0.08,0,-0.41);wall(0.08,0.9,0.41,0);wall(0.08,0.9,-0.41,0);
 const b=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.9),this.mat);b.position.y=-0.41;this.group.add(b);
 this.lid=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.1,0.95),new THREE.MeshStandardMaterial({map:TEX.wood,color:0x8a6a4a}));this.lid.position.y=0.5;this.group.add(this.lid);
 scene.add(this.group);
 this.body=new CANNON.Body({mass:30,material:physics.defaultMaterial,linearDamping:0.3});this.body.allowSleep=true;
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.45,0.45,0.04)),new CANNON.Vec3(0,0,0.41));
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.45,0.45,0.04)),new CANNON.Vec3(0,0,-0.41));
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.04,0.45,0.45)),new CANNON.Vec3(0.41,0,0));
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.04,0.45,0.45)),new CANNON.Vec3(-0.41,0,0));
 this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.45,0.04,0.45)),new CANNON.Vec3(0,-0.41,0));
 this.body.position.set(x,0.45,z);this.body.label='crate';physics.addBody(this.body,this.group);this.name='Ящик';}
 openLid(scene,physics){const wp=new THREE.Vector3();this.lid.getWorldPosition(wp);const wq=new THREE.Quaternion();this.lid.getWorldQuaternion(wq);this.group.remove(this.lid);
  const lid=new LidEntity(scene,physics,wp,wq);lid.body.velocity.set(Utils.rand(-2,2),Utils.rand(4,7),Utils.rand(-2,2));lid.body.angularVelocity.set(Utils.rand(-6,6),Utils.rand(-6,6),Utils.rand(-6,6));this.open=true;SOUND.play('creak');return lid;}
 sync(){if(this.body){this.group.position.copy(this.body.position);this.group.quaternion.copy(this.body.quaternion);this.ao.position.x=this.body.position.x;this.ao.position.z=this.body.position.z;}}
 dispose(){this.scene.remove(this.group);this.scene.remove(this.ao);if(this.body)this.physics.removeBody(this.body);}}

export class LidEntity{constructor(scene,physics,pos,q){this.scene=scene;this.physics=physics;this.mesh=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.1,0.95),new THREE.MeshStandardMaterial({map:TEX.wood,color:0x8a6a4a}));this.mesh.userData={isItem:true};scene.add(this.mesh);
 this.body=new CANNON.Body({mass:1.5,material:physics.defaultMaterial});this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.47,0.05,0.47)));this.body.allowSleep=true;this.body.position.set(pos.x,pos.y,pos.z);this.body.quaternion.copy(q);physics.addBody(this.body,this.mesh);}
 dispose(){this.scene.remove(this.mesh);this.physics.removeBody(this.body);}}

export class PuddleSystem{constructor(s){this.scene=s;this.puddles=[];}
 add(t,x,z,r){const m=new THREE.Mesh(new THREE.CircleGeometry(r,12),new THREE.MeshBasicMaterial({color:PUDDLE_COLORS[t]||0x888888,transparent:true,opacity:0.55}));m.rotation.x=-Math.PI/2;m.position.set(x,0.035,z);this.scene.add(m);this.puddles.push({type:t,x,z,r,mesh:m,life:90});}
 at(x,z){for(const p of this.puddles)if(Utils.dist2(p.x,p.z,x,z)<p.r*p.r)return p;return null;}
 nearest(x,z,r){let b=null,bd=r*r;for(const p of this.puddles){const d=Utils.dist2(p.x,p.z,x,z);if(d<bd){bd=d;b=p;}}return b;}
 removePuddle(p){this.scene.remove(p.mesh);this.puddles=this.puddles.filter(x=>x!==p);}
 update(dt){for(let i=this.puddles.length-1;i>=0;i--){const p=this.puddles[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);this.puddles.splice(i,1);}}}
 dispose(){for(const p of this.puddles)this.scene.remove(p.mesh);this.puddles=[];}}