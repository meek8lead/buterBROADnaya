// ==== ENGINE: ввод, физика, игрок, руки, лицо ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, Utils } from './config.js';
import { LOGGER } from './media.js';

export const _v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_fwd=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);

export class InputManager{constructor(){this.keys={};this.mouse={dx:0,dy:0};this.lookActive=false;this.onInteract=null;this.onDrop=null;this.onShove=null;this.onPee=null;this.onRight=null;this.onLeft=null;
 addEventListener('keydown',e=>{this.keys[e.code]=true;});addEventListener('keyup',e=>{this.keys[e.code]=false;});
 addEventListener('blur',()=>{for(const k in this.keys)this.keys[k]=false;});
 addEventListener('mousemove',e=>{if(this.lookActive){this.mouse.dx=e.movementX;this.mouse.dy=e.movementY;}});
 addEventListener('mousedown',e=>{if(e.button===2&&this.onRight)this.onRight();if(e.button===0&&this.onLeft)this.onLeft();});
 addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('keydown',e=>{if(e.code==='KeyE'&&this.onInteract)this.onInteract();if(e.code==='KeyQ'&&this.onDrop)this.onDrop();if(e.code==='ShiftLeft'&&!e.repeat&&this.onShove)this.onShove();if(e.code==='KeyR'&&!e.repeat&&this.onPee)this.onPee();});}
 lock(el){try{if(el&&el.requestPointerLock)el.requestPointerLock();}catch(e){LOGGER.warn('lock fail: '+e.message);}}}

export class PhysicsWorld{constructor(){this.world=new CANNON.World();this.world.gravity.set(0,CONFIG.GRAVITY,0);this.world.allowSleep=true;this.world.solver.iterations=8;
 this.defaultMaterial=new CANNON.Material('default');this.playerMaterial=new CANNON.Material('player');
 this.world.addContactMaterial(new CANNON.ContactMaterial(this.defaultMaterial,this.defaultMaterial,{friction:0.4,restitution:0.1}));
 this.world.addContactMaterial(new CANNON.ContactMaterial(this.defaultMaterial,this.playerMaterial,{friction:0,restitution:0}));
 this.pairs=[];this.statTimer=0;this.stepTimes=[];}
 addBody(b,m){this.world.addBody(b);this.pairs.push({body:b,mesh:m||null});}
 removeBody(b){this.world.removeBody(b);this.pairs=this.pairs.filter(p=>p.body!==b);}
 addConstraint(c){this.world.addConstraint(c);}removeConstraint(c){this.world.removeConstraint(c);}
 update(dt){const t0=performance.now();this.world.step(CONFIG.STEP,dt,3);const ms=performance.now()-t0;this.stepTimes.push(ms);this.statTimer+=dt;
  if(this.statTimer>=2){let s=0;for(const x of this.stepTimes)s+=x;LOGGER.phys('step '+(s/this.stepTimes.length).toFixed(2)+'ms bodies='+this.world.bodies.length);this.stepTimes.length=0;this.statTimer=0;}
  for(const p of this.pairs){if(p.mesh&&!p.body.skipMeshSync){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);}}}}

export class PlayerController{constructor(ph,cam){this.physics=ph;this.camera=cam;this.body=new CANNON.Body({mass:70,material:ph.playerMaterial});
 this.body.addShape(new CANNON.Cylinder(CONFIG.PLAYER_RADIUS,CONFIG.PLAYER_RADIUS,CONFIG.PLAYER_HEIGHT,12));this.body.position.set(0,1,0);this.body.linearDamping=0.1;this.body.fixedRotation=true;this.body.updateMassProperties();
 this.body.allowSleep=false;this.body.sleepSpeedLimit=0;
 this.body.label='player';ph.addBody(this.body,null);
 this.yaw=0;this.pitch=0;this.smoothY=null;this.walkPhase=0;this.down=false;this.getupT=0;this.pitchOffset=0;this.prevSpace=false;}
 fallDown(){this.down=true;this.getupT=0;}
 reset(){this.body.position.set(0,1,0);this.body.velocity.set(0,0,0);this.down=false;this.getupT=0;this.pitchOffset=0;this.smoothY=null;}
 update(dt,inp){const s=0.002;this.yaw-=inp.mouse.dx*s;this.pitch-=inp.mouse.dy*s;this.pitch=Utils.clamp(this.pitch,-1.47,1.47);inp.mouse.dx=0;inp.mouse.dy=0;
  const sp=!!inp.keys['Space'];
  if(this.body.sleepState===CANNON.Body.SLEEPING)this.body.wakeUp();
  if(this.down){if(sp&&!this.prevSpace){this.down=false;this.getupT=CONFIG.GETUP_TIME;}this.prevSpace=sp;return;}
  if(this.getupT>0){this.getupT-=dt;if(this.getupT<=0)this.getupT=0;this.prevSpace=sp;return;}
  this.prevSpace=sp;const v=_v1.set(0,0,0);if(inp.keys['KeyW'])v.z-=1;if(inp.keys['KeyS'])v.z+=1;if(inp.keys['KeyA'])v.x-=1;if(inp.keys['KeyD'])v.x+=1;
  if(v.lengthSq()>0){v.normalize();v.applyAxisAngle(_up,this.yaw);const a=CONFIG.PLAYER_ACCEL*dt;this.body.velocity.x+=(v.x*CONFIG.PLAYER_SPEED-this.body.velocity.x)*a;this.body.velocity.z+=(v.z*CONFIG.PLAYER_SPEED-this.body.velocity.z)*a;this.body.wakeUp();this.walkPhase+=dt*8;}
  else{const b=CONFIG.PLAYER_ACCEL*dt;this.body.velocity.x-=this.body.velocity.x*b;this.body.velocity.z-=this.body.velocity.z*b;}
  if(sp&&Math.abs(this.body.velocity.y)<0.1){this.body.velocity.y=CONFIG.PLAYER_JUMP;this.body.wakeUp();}}
 syncCamera(dt){const tY=this.body.position.y+CONFIG.EYE_HEIGHT;if(this.smoothY===null)this.smoothY=tY;this.smoothY+=(tY-this.smoothY)*(1-Math.exp(-18*dt));
  this.pitchOffset+=((this.down?-1.25:0)-this.pitchOffset)*(1-Math.exp(-8*dt));
  this.camera.position.set(this.body.position.x,this.smoothY,this.body.position.z);this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch+this.pitchOffset,this.yaw,0,'YXZ'));}}

export class HandsView{constructor(cam){this.group=new THREE.Group();const skin=new THREE.MeshStandardMaterial({color:0xffccaa});const sl=new THREE.MeshStandardMaterial({color:0x2266aa});this.arms=[];
 for(const s of[-1,1]){const a=new THREE.Group();const f=new THREE.Mesh(new THREE.CapsuleGeometry(0.075,0.55,4,8),sl);f.position.set(0,-0.28,0.1);f.rotation.x=-0.55;const h=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.12,0.2),skin);h.position.set(0,0.02,-0.12);h.rotation.x=0.35;a.add(f,h);a.position.set(s*0.42,-0.62,-0.62);a.rotation.set(0.5,s*-0.25,s*0.15);this.arms.push(a);this.group.add(a);}
 cam.add(this.group);this.punch=0;this.jerk=false;this.jerkT=0;this.heldSlot=null;this.heldBaseZ=-0.16;this.heldBaseRX=1.25;this.heldBaseRZ=0.35;this.attackType=null;this.attackT=-1;this.attackDur=0;}
 trigger(){this.punch=1;}setJerk(o){this.jerk=o;}
 attachHeld(m){if(this.heldSlot===m)return;this.detachHeld();this.heldSlot=m;this.arms[1].add(m);m.position.set(0,0.02,this.heldBaseZ);m.rotation.set(this.heldBaseRX,0,this.heldBaseRZ);}
 detachHeld(){if(this.heldSlot){this.arms[1].remove(this.heldSlot);this.heldSlot=null;}}
 attack(t){this.attackType=t;this.attackT=0;this.attackDur=t==='tool_crowbar'?0.5:(t==='tool_knife'?0.28:(t==='tool_spray'?0.2:0.4));}
 update(dt,wp,mv){this.punch=Math.max(0,this.punch-dt*6);let jz=0,jr=0;if(this.jerk){this.jerkT+=dt;const j=Math.sin(this.jerkT*20);jz=j*0.1;jr=j*0.22;}else this.jerkT=0;
  const bob=mv?Math.sin(wp)*0.025:Math.sin(wp*0.3)*0.008;const pz=-0.62-this.punch*0.22+jz;
  this.arms[0].position.set(-0.42,-0.62+bob,pz);this.arms[1].position.set(0.42,-0.62-bob,pz-this.punch*0.12-jz*0.5);this.arms[0].rotation.x=0.5+this.punch*0.3+jr;
  let ax=0,az=0,hx=0,hz=0,hpz=0;
  if(this.attackType){this.attackT+=dt;const p=this.attackT/this.attackDur;
   if(p>=1){this.attackType=null;this.attackT=-1;}
   else if(this.attackType==='tool_crowbar'){if(p<0.35){const u=p/0.35;ax=-1.2*u;hx=-1*u;hpz=-0.1*u;az=0.35*u;}else{const u=(p-0.35)/0.65;ax=-1.2+2.5*u;hx=-1+2.3*u;hpz=-0.1+0.55*u;az=0.35-1*u;}}
   else if(this.attackType==='tool_knife'){if(p<0.3){const u=p/0.3;az=-0.6*u;hz=-0.8*u;hpz=-0.06*u;ax=-0.2*u;}else{const u=(p-0.3)/0.7;az=-0.6+1.6*u;hz=-0.8+2*u;hpz=-0.06+0.42*u;ax=-0.2+0.5*u;}}
   else if(this.attackType==='tool_spray'){ax=0.25*Math.sin(p*Math.PI);hpz=0.1*Math.sin(p*Math.PI);}
   else{az=-0.7+1.4*p;hpz=0.25*Math.sin(p*Math.PI);ax=0.2;}}
  this.arms[1].rotation.x=0.5+this.punch*0.45-jr+ax;this.arms[1].rotation.z=0.15+az;
  if(this.heldSlot){this.heldSlot.rotation.x=this.heldBaseRX+hx;this.heldSlot.rotation.z=this.heldBaseRZ+hz;this.heldSlot.position.z=this.heldBaseZ+hpz;}}}

export class FaceRig{constructor(o={}){this.group=new THREE.Group();this.mood='neutral';this.moodTimer=0;this.time=Utils.rand(0,10);this.pupilTarget=new THREE.Vector2();this.pupilTimer=0;this.twitchT=Utils.rand(2,5);this.talk=false;this.mouthBaseY=1;this.bruises=[];this.soot=[];this.splashes=[];this.stuck=[];
 this.baseSkin=o.skin||Utils.pick([0xffccaa,0xf0b088,0xe8a066]);this.skinMat=new THREE.MeshStandardMaterial({color:this.baseSkin});
 this.headMesh=new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16),this.skinMat);this.headMesh.scale.set(1,1.1,0.95);this.group.add(this.headMesh);
 this.baseEyeL=Utils.rand(0.16,0.26);this.baseEyeR=Utils.rand(0.16,0.26);const em=new THREE.MeshStandardMaterial({color:0xffffff});
 this.eyeL=new THREE.Mesh(new THREE.SphereGeometry(1,12,12),em);this.eyeL.scale.setScalar(this.baseEyeL);this.eyeL.position.set(-0.21,0.14,0.4);
 this.eyeR=new THREE.Mesh(new THREE.SphereGeometry(1,12,12),em);this.eyeR.scale.setScalar(this.baseEyeR);this.eyeR.position.set(0.21,0.14,0.4);
 const pg=new THREE.SphereGeometry(0.45,10,10),pm=new THREE.MeshStandardMaterial({color:0});
 this.pupilL=new THREE.Mesh(pg,pm);this.pupilL.position.set(0,0,0.8);this.pupilR=new THREE.Mesh(pg,pm);this.pupilR.position.set(0,0,0.8);
 this.eyeL.add(this.pupilL);this.eyeR.add(this.pupilR);this.group.add(this.eyeL,this.eyeR);
 const mkX=()=>{const g=new THREE.Group();for(const r of[Math.PI/4,-Math.PI/4]){const m=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.07,0.07),new THREE.MeshStandardMaterial({color:0}));m.rotation.z=r;g.add(m);}g.visible=false;return g;};
 this.xEyeL=mkX();this.xEyeL.position.set(-0.21,0.14,0.52);this.xEyeR=mkX();this.xEyeR.position.set(0.21,0.14,0.52);this.group.add(this.xEyeL,this.xEyeR);
 this.browL=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.06,0.06),new THREE.MeshStandardMaterial({color:0x553311}));this.browL.position.set(-0.21,0.4,0.42);this.browR=this.browL.clone();this.browR.position.x=0.21;this.group.add(this.browL,this.browR);
 this.nose=new THREE.Mesh(new THREE.SphereGeometry(Utils.rand(0.09,0.16),8,8),this.skinMat);this.nose.position.set(Utils.rand(-0.06,0.06),-0.02,0.5);this.group.add(this.nose);
 this.mouth=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.12,0.1),new THREE.MeshStandardMaterial({color:0x802222}));this.mouth.position.set(0,-0.26,0.5);this.group.add(this.mouth);
 this.teeth=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.08,0.08),new THREE.MeshStandardMaterial({color:0xffffee}));this.teeth.position.set(0,-0.2,0.53);this.teeth.visible=false;this.group.add(this.teeth);
 this.tongue=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.07,0.18),new THREE.MeshStandardMaterial({color:0xdd6688}));this.tongue.position.set(0,-0.33,0.52);this.tongue.visible=false;this.group.add(this.tongue);
 this.tearL=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6),new THREE.MeshStandardMaterial({color:0x66ccff}));this.tearL.position.set(-0.21,-0.05,0.45);this.tearR=this.tearL.clone();this.tearR.position.x=0.21;this.tearL.visible=false;this.tearR.visible=false;this.group.add(this.tearL,this.tearR);
 this.cheekL=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,8),new THREE.MeshStandardMaterial({color:0xff6666,transparent:true,opacity:0.6}));this.cheekL.position.set(-0.32,-0.12,0.36);this.cheekR=this.cheekL.clone();this.cheekR.position.x=0.32;this.cheekL.visible=false;this.cheekR.visible=false;this.group.add(this.cheekL,this.cheekR);
 if(Math.random()<0.35){this.stache=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.07,0.07),new THREE.MeshStandardMaterial({color:0x332211}));this.stache.position.set(0,-0.14,0.48);this.group.add(this.stache);}
 this.applyMood();}
 setMood(m,d){this.mood=m;this.moodTimer=d||3;this.applyMood();}
 lookLocal(nx){this.pupilTarget.set(Utils.clamp(nx,-1,1)*0.5,0);this.pupilTimer=Utils.rand(1,2.5);}
 addDecal(a,c,y0,y1){if(a.length>=7)return;const m=new THREE.Mesh(new THREE.SphereGeometry(Utils.rand(0.04,0.14),5,5),new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:0.85}));m.position.set(Utils.rand(-0.35,0.35),Utils.rand(y0,y1),Utils.rand(0.4,0.5));this.group.add(m);a.push(m);}
 addBruise(){this.addDecal(this.bruises,Utils.pick([0x553388,0x6644aa]),-0.35,0.4);}addSoot(){this.addDecal(this.soot,0x111111,-0.3,0.35);}addSplash(c){this.addDecal(this.splashes,c,-0.3,0.3);}addStuck(c){this.addDecal(this.stuck,c,-0.35,0.4);}
 wash(){for(const m of this.splashes.concat(this.stuck))this.group.remove(m);this.splashes=[];this.stuck=[];}
 applyMood(){const m=this.mood;this.skinMat.color.setHex(m==='sick'?0xaaddaa:(m==='blush'?0xff9999:this.baseSkin));
  this.teeth.visible=(m==='happy'||m==='scared'||m==='laugh');this.tongue.visible=(m==='sick'||m==='laugh'||m==='dead');
  this.tearL.visible=this.tearR.visible=(m==='sad'||m==='cry'||m==='laugh');this.cheekL.visible=this.cheekR.visible=(m==='blush'||m==='laugh');
  this.pupilL.visible=this.pupilR.visible=(m!=='dead');this.xEyeL.visible=this.xEyeR.visible=(m==='dead');
  if(m==='happy'){this.mouth.scale.set(1.8,1.6,1);this.mouth.rotation.z=0.14;}else if(m==='laugh'){this.mouth.scale.set(2,3.2,1);this.mouth.rotation.z=-0.08;}
  else if(m==='angry'){this.mouth.scale.set(1.5,1,1);this.mouth.rotation.z=-0.12;}else if(m==='scared'){this.mouth.scale.set(0.9,4.2,1);this.mouth.rotation.z=0;}
  else if(m==='sad'||m==='cry'){this.mouth.scale.set(1.2,1.2,1);this.mouth.rotation.z=0.45;}else if(m==='dead'){this.mouth.scale.set(0.9,3,1);this.mouth.rotation.z=0.2;}
  else{this.mouth.scale.set(1.1,1.1,1);this.mouth.rotation.z=0;}this.mouthBaseY=this.mouth.scale.y;
  const by=m==='angry'?0.34:(m==='sad'||m==='cry'?0.44:(m==='scared'||m==='laugh'?0.5:0.4));this.browL.position.y=by;this.browR.position.y=by;
  if(m==='angry'){this.browL.rotation.z=-0.6;this.browR.rotation.z=0.6;}else if(m==='sad'||m==='cry'){this.browL.rotation.z=0.6;this.browR.rotation.z=-0.6;}
  else if(m==='dead'){this.browL.rotation.z=0.3;this.browR.rotation.z=-0.3;}else if(m==='scared'||m==='laugh'){this.browL.rotation.z=0;this.browR.rotation.z=0;}
  else{this.browL.rotation.z=0.1;this.browR.rotation.z=-0.1;}
  const es=(m==='scared')?1.7:((m==='happy'||m==='laugh')?0.5:1);this.eyeL.scale.setScalar(this.baseEyeL*es);this.eyeR.scale.setScalar(this.baseEyeR*es);}
 update(dt){this.time+=dt;this.moodTimer-=dt;if(this.moodTimer<=0&&this.mood!=='neutral'&&this.mood!=='dead'){this.mood='neutral';this.applyMood();}
  this.twitchT-=dt;if(this.twitchT<=0){this.twitchT=Utils.rand(2,6);this.browL.position.y+=Utils.rand(-0.03,0.03);if(Math.random()<0.25)this.pupilTarget.set(Utils.rand(-0.3,0.3),Utils.rand(-0.3,0.3));}
  this.pupilTimer-=dt;if(this.pupilTimer<=0){this.pupilTimer=Utils.rand(0.6,2);this.pupilTarget.set(Utils.rand(-0.6,0.6),Utils.rand(-0.5,0.5));}
  const k=Math.min(1,dt*7);this.pupilL.position.x+=(this.pupilTarget.x*0.35-this.pupilL.position.x)*k;this.pupilL.position.y+=(this.pupilTarget.y*0.35-this.pupilL.position.y)*k;
  this.pupilR.position.x+=(this.pupilTarget.x*0.35+Math.sin(this.time*13)*0.08-this.pupilR.position.x)*k;this.pupilR.position.y+=(this.pupilTarget.y*0.35-this.pupilR.position.y)*k;
  if(this.talk){this.mouth.scale.y=this.mouthBaseY*(1+Math.sin(this.time*16)*0.8);this.teeth.visible=true;}
  if(this.tearL.visible){this.tearL.position.y=-0.05-((this.time*0.7)%0.35);this.tearR.position.y=-0.05-((this.time*0.7+0.17)%0.35);}
  this.headMesh.rotation.z=Math.sin(this.time*1.7)*0.07+(this.mood==='laugh'?Math.sin(this.time*18)*0.05:0);}}

export class PlayerPortrait{constructor(r){this.renderer=r;this.frameEl=document.getElementById('faceframe');this.rect=null;
 this.scene=new THREE.Scene();this.rig=new FaceRig({skin:0xffccaa});this.scene.add(this.rig.group);
 this.backdropMat=new THREE.MeshBasicMaterial({color:0x1a1a1a});
 const bd=new THREE.Mesh(new THREE.PlaneGeometry(8,8),this.backdropMat);bd.position.z=-2;this.scene.add(bd);
 this.scene.add(new THREE.AmbientLight(0xffffff,0.7));const dl=new THREE.DirectionalLight(0xffffff,0.9);dl.position.set(1,1,2);this.scene.add(dl);
 this.camera=new THREE.PerspectiveCamera(35,1,0.1,10);this.camera.position.set(0,0,2.3);this.camera.lookAt(0,0,0);
 const rg=new THREE.Group();const rm=new THREE.MeshStandardMaterial({color:0x8a7a66});
 const rb=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,8),rm);rb.scale.set(0.8,0.7,1.2);rg.add(rb);
 const rh=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,8),rm);rh.position.set(0,0.04,0.18);rg.add(rh);
 const ew=new THREE.MeshStandardMaterial({color:0xffffff});
 for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6),ew);e.position.set(sx*0.06,0.08,0.26);const p=new THREE.Mesh(new THREE.SphereGeometry(0.025,6,6),new THREE.MeshStandardMaterial({color:0}));p.position.set(0,0,0.6);e.add(p);rg.add(e);}
 rg.position.set(0.2,0.6,0.05);rg.rotation.y=-0.6;rg.visible=false;this.scene.add(rg);this.ratMesh=rg;this.ratOn=false;
 this.cig=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.3,6),new THREE.MeshStandardMaterial({color:0xeeeeee}));this.cig.rotation.z=Math.PI/2.3;this.cig.position.set(0.28,-0.26,0.5);this.cig.visible=false;this.rig.group.add(this.cig);
 this.smoke=[];this.smoking=false;this.smokeT=0;}
 setHeadRat(o){if(o===this.ratOn)return;this.ratOn=o;this.ratMesh.visible=o;}
 setSmoking(o){this.smoking=o;this.cig.visible=o;}
 refreshRect(){const el=this.frameEl;if(!el)return;const r=el.getBoundingClientRect();this.rect={x:Math.max(0,Math.floor(r.left+3)),bottom:Math.floor(r.bottom),w:Math.max(8,Math.floor(r.width-6))};}
 update(dt){this.rig.update(dt);
  const mc={scared:0x2a0808,angry:0x2a1008,happy:0x102a10,sick:0x102a18,blush:0x2a1018,dead:0x080808};
  this.backdropMat.color.setHex(mc[this.rig.mood]||0x1a1a1a);
  if(this.ratOn){this.ratMesh.rotation.z=Math.sin(this.rig.time*9)*0.12;this.ratMesh.position.y=0.6+Math.sin(this.rig.time*13)*0.015;}
  if(this.smoking){this.smokeT-=dt;if(this.smokeT<=0){this.smokeT=0.12;const s=new THREE.Mesh(new THREE.SphereGeometry(0.05,5,5),new THREE.MeshBasicMaterial({color:0xcccccc,transparent:true,opacity:0.4}));s.position.set(0.4,-0.2,0.55);this.scene.add(s);this.smoke.push({m:s,t:1});}
   for(let i=this.smoke.length-1;i>=0;i--){const s=this.smoke[i];s.t-=dt;s.m.position.y+=dt*0.6;s.m.position.x+=dt*0.15;s.m.material.opacity=Math.max(0,s.t*0.4);if(s.t<=0){this.scene.remove(s.m);this.smoke.splice(i,1);}}}
  else if(this.smoke.length){for(const s of this.smoke)this.scene.remove(s.m);this.smoke=[];}}
 render(){if(!this.rect||this.rect.w<9)return;const y=Math.max(0,Math.floor(innerHeight-this.rect.bottom+3));const r=this.renderer;
  r.autoClear=false;r.clearDepth();r.setScissorTest(true);r.setViewport(this.rect.x,y,this.rect.w,this.rect.w);r.setScissor(this.rect.x,y,this.rect.w,this.rect.w);
  r.render(this.scene,this.camera);r.setScissorTest(false);r.setViewport(0,0,innerWidth,innerHeight);r.autoClear=true;}}