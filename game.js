// ==== GAME: главный класс, склейка всей логики ====
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, GAME_DATA, ITEM_DEFS, PHRASES, ACHIEVEMENTS, ACH_MAP, COMBOS, CUTTABLE, WILD_SAUCES, VIEWMODEL_DEFS, CUTLET_WILD, PUDDLE_COLORS, STICKY_KINDS, CAT_FOOD, Utils, defHeight, loadSave, storeSave, resetSave } from './config.js';
import { LOGGER, SOUND } from './media.js';
import { _v1, _fwd, InputManager, PhysicsWorld, PlayerController, HandsView, PlayerPortrait } from './engine.js';
import { InteractSystem, HoldSystem, ItemEntity, CrateEntity, PuddleSystem } from './items.js';
import { RagdollFactory, QueueSystem, OrderSystem, SandwichBuilder } from './npcs.js';
import { LampSystem, DustSystem, FlySystem, RatSystem, NestSystem, CatSystem, FireSystem } from './critters.js';
import { StoveSystem, FridgeSystem, BathroomSystem, HingeDoor, WorldBuilder, EconomySystem, DaySystem, ShopSystem, DeliverySystem } from './building.js';

export class Game{constructor(){this.state='menu';this.hintShown=false;this.viewmodel=null;this.sinkCd=0;this.dynamite=null;this.saboteurT=Utils.rand(90,160);this.pendingHit=null;this.policeCd=40;this.sprayFx=[];this.smoking=0;this.smokeAcc=0;this.crashGuard=0;this.talk=null;this.inspectDone=false;this.inspectWarned=false;this.fryHinted=false;this.stepLast=0;this.murmurT=5;this.neonT=0;this.neonOn=true;this.combosDay=0;this.achToday=[];
 this.el={};const ids=['money','day','daytime','rep','status','bladderbar','shamebar','dirtbar','toast','vignette','minigame','mg-zone','mg-marker','mg-text','overlay','overlay-title','overlay-hint','hud','logpanel','chat','help','ach'];
 for(const id of ids)this.el[id.replace(/-(\w)/g,(m,c)=>c.toUpperCase())]=document.getElementById(id);
 this.el.help.innerHTML='=== СПРАВКА ЗАБЕГАЛОВКИ ===\nWASD ходить | Space прыжок/встать | Shift ТОЛЧОК\nЛКМ лом/швабра/НОЖ/спрей | ЛКМ быстро = сбросить крысу с головы\nE взять/взаимодействовать/стучать/отвечать/ЖАРИТЬ/КОРМИТЬ КОТА | Q швырнуть | R отлить\nСТАРТ: клик по меню / Enter / Space / E / F9.\nНОЖ: бей по столу нарезки — нарежется что лежит. Целое режется на 2.\nПЛИТА: масло(E)->еда(E)->E во время жарки = мини-игра прожарки (+15₽).\nХОЛОДИЛЬНИК: код 1337. КОМП: доставка (ящик/кот/сигареты).\nТУАЛЕТ: отливай (громко), мой шваброй. Стучи E если занято.\nГНЕЗДО крыс каждый раз в НОВОМ месте; после разрушения переезжает.\nКРЫСЫ воруют сыр и ТАЩАТ в гнездо — перехвати и отбей!\nКОТ: голодает! Корми трупом крысы (E) или уйдёт. Голодный ловит лучше.\nКОРОЛЬ: 3 заказа = патрон. У клиентов ПОЛОСКА ТЕРПЕНИЯ над головой.\nПровал в пол и «онемевшие ноги» чинятся автоматически.\nF1 справка | F2 АЧИВКИ | F3 лог | F5 дамп | F6 флоатеры | F8 сброс | F9 форс-старт | M звук';
 const sv=loadSave();
 if(sv){GAME_DATA.money=sv.money||0;GAME_DATA.day=sv.day||1;GAME_DATA.reputation=(sv.rep!=null?sv.rep:50);GAME_DATA.upgrades=sv.up||{};GAME_DATA.eggTaken=!!sv.egg;GAME_DATA.kingServed=sv.king||0;GAME_DATA.patron=!!sv.patron;if(sv.ach)GAME_DATA.ach=sv.ach;if(sv.life)GAME_DATA.life=sv.life;}
 this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,100);
 this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=false;
 this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
 if(THREE.SRGBColorSpace)this.renderer.outputColorSpace=THREE.SRGBColorSpace;
 document.body.appendChild(this.renderer.domElement);this.scene.add(this.camera);
 this.physics=new PhysicsWorld();this.input=new InputManager();
 this.player=new PlayerController(this.physics,this.camera);this.hands=new HandsView(this.camera);this.portrait=new PlayerPortrait(this.renderer);
 this.interactSystem=new InteractSystem(this.camera);this.holdSystem=new HoldSystem(this.camera);
 this.input.onInteract=()=>this.handleInteract();this.input.onDrop=()=>this.handleDrop();this.input.onShove=()=>this.shove();this.input.onPee=()=>this.pee();this.input.onRight=()=>this.tryStartBottleMinigame();this.input.onLeft=()=>this.handleLeft();
 this.worldBuilder=new WorldBuilder(this.scene,this.physics,this.interactSystem);this.worldBuilder.build();
 this.lampSystem=new LampSystem(this.scene,this);
 this.dustSystem=new DustSystem(this.scene);
 this.storeDoor=new HingeDoor(this.scene,this.physics,this.interactSystem,CONFIG.STORE_DOOR_HINGE.x,CONFIG.STORE_DOOR_HINGE.z,CONFIG.STORE_DOOR_W,2.2,0x8a6a4a,'Дверь склада (E — толкнуть)',()=>this.storeDoor.push());
 this.bathDoor=new HingeDoor(this.scene,this.physics,this.interactSystem,CONFIG.BATH_DOOR_HINGE.x,CONFIG.BATH_DOOR_HINGE.z,CONFIG.BATH_DOOR_W,2.2,0x886644,'Дверь уборной (E — стучать/толкнуть)',()=>{if(this.bathSystem&&this.bathSystem.occupant)this.bathSystem.knockDoor();else this.bathDoor.push();});
 const mk=(l,p)=>({label:l,x:l==='assembly_table'?p.x-0.65:p.x,z:p.z,topY:p.y,placed:[],h:0});
 this.cutStack=mk('cut_table',CONFIG.CUT_POS);this.assemblyStack=mk('assembly_table',CONFIG.ASSEMBLY_POS);
 this.stackByLabel={cut_table:this.cutStack,assembly_table:this.assemblyStack};
 this.items=[];this.sandwiches=[];this.crates=[];this.lids=[];this.structureSet=new Set();
 this.fireSystem=new FireSystem(this.scene,this);
 this.spawnPiles();
 if(GAME_DATA.day===1)for(const cp of CONFIG.CRATE_POS)this.addCrate(cp.x,cp.z);
 this.slotDefs={hook:{pos:new THREE.Vector3(CONFIG.HOOK_POS.x,CONFIG.HOOK_POS.y,CONFIG.HOOK_POS.z+0.1),euler:new THREE.Euler(0,0,0),entity:null,defId:'tool_crowbar'},
  knife_slot:{pos:new THREE.Vector3(CONFIG.KNIFE_SLOT.x,CONFIG.KNIFE_SLOT.y,CONFIG.KNIFE_SLOT.z),euler:new THREE.Euler(Math.PI/2,0,0.18),entity:null,defId:'tool_knife'}};
 this.crowbar=this.spawnItem('tool_crowbar',{x:CONFIG.HOOK_POS.x,y:CONFIG.HOOK_POS.y,z:CONFIG.HOOK_POS.z});this.slotPlace(this.crowbar,'hook');
 this.knife=this.spawnItem('tool_knife',{x:CONFIG.KNIFE_SLOT.x,y:CONFIG.KNIFE_SLOT.y,z:CONFIG.KNIFE_SLOT.z});this.slotPlace(this.knife,'knife_slot');
 this.interactSystem.register(this.worldBuilder.hookMesh,'Крюк для лома',()=>this.onSlot('hook'));
 this.interactSystem.register(this.worldBuilder.glassMesh,'Стекло выдачи (ломом!)',()=>this.breakGlass());
 this.interactSystem.register(this.worldBuilder.compMesh,'Древний комп (Терминал)',()=>this.delivery.open());
 this.orderSystem=new OrderSystem();this.ragdollFactory=new RagdollFactory(this.scene,this.physics,this);
 this.puddleSystem=new PuddleSystem(this.scene);this.ratSystem=new RatSystem(this.scene,this.physics,this);this.nestSystem=new NestSystem(this.scene,this);this.catSystem=new CatSystem(this.scene,this);this.flySystem=new FlySystem(this.scene,this);
 this.stoveSystem=new StoveSystem(this.scene,this.physics,this.interactSystem,this);
 this.fridgeSystem=new FridgeSystem(this.scene,this.physics,this.interactSystem,this);
 this.bathSystem=new BathroomSystem(this.scene,this.physics,this.interactSystem,this,this.bathDoor);
 this.queueSystem=new QueueSystem(this.scene,this.interactSystem,this.orderSystem,this.ragdollFactory);this.queueSystem.game=this;
 this.sandwichBuilder=new SandwichBuilder(this.scene,this.physics,this.interactSystem,this.holdSystem,this);
 this.economySystem=new EconomySystem(this);this.daySystem=new DaySystem(this);this.shopSystem=new ShopSystem(this);this.delivery=new DeliverySystem(this);
 const WB=this.worldBuilder;
 this.interactSystem.register(WB.cutMesh,'Стол нарезки',()=>this.onCutTable());
 this.interactSystem.register(WB.grinderMesh,'Мясорубка',()=>this.onGrinder());
 this.interactSystem.register(WB.sinkMesh,'Рукомойник',()=>this.onSink());
 for(const m of[WB.assemblyMesh,WB.cutMesh,WB.sinkMesh,WB.glassMesh,WB.hookMesh,this.stoveSystem.mesh,WB.grinderMesh,WB.compMesh])this.structureSet.add(m);
 this.cigFP=new THREE.Group();const cs=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.35,6),new THREE.MeshStandardMaterial({color:0xeeeeee}));cs.rotation.x=Math.PI/2.2;this.cigFP.add(cs);
 const tip=new THREE.Mesh(new THREE.SphereGeometry(0.025,6,6),new THREE.MeshStandardMaterial({color:0xff3300,emissive:0x881100}));tip.position.set(0,0.02,-0.18);this.cigFP.add(tip);
 this.cigFP.position.set(0.22,-0.28,-0.55);this.cigFP.visible=false;this.camera.add(this.cigFP);this.fpSmoke=[];
 this.clock=new THREE.Clock();this.frames=0;this.fpsTimer=0;this.shoveCd=0;this.slipCd=0;this.swingCd=0;this.minigame=null;this.npcsCache=[];
 this.meters={shame:{el:this.el.shamebar,val:0,decay:1.2},dirt:{el:this.el.dirtbar,val:0,decay:0,warnAt:50,warned:false}};
 this.el.money.textContent=GAME_DATA.money;this.el.rep.textContent=GAME_DATA.reputation;this.el.day.textContent=GAME_DATA.day;
 this.updateAchCount();
 this.panelLines=[];LOGGER.listeners.push(l=>{this.panelLines.push(l);if(this.panelLines.length>40)this.panelLines.shift();if(this.el.logpanel)this.el.logpanel.textContent=this.panelLines.join('\n');});
 const tryStart=()=>{try{
   if(this.state==='dayend'){this.openShop();return;}
   if(this.state==='shop'||this.state==='computer')return;
   this.enterPlay(false);
  }catch(e){LOGGER.error('start fail: '+e.message);}};
 this.el.overlay.addEventListener('click',tryStart);
 addEventListener('keydown',(e)=>{if(this.state==='menu'||this.state==='pause'){if(e.code==='Enter'||e.code==='Space'||e.code==='KeyE'||e.code==='F9'){e.preventDefault();tryStart();}}});
 document.getElementById('btn-download').addEventListener('click',()=>LOGGER.download());
 document.getElementById('btn-toggle-log').addEventListener('click',()=>this.toggleLogPanel());
 document.getElementById('btn-dump').addEventListener('click',()=>this.dumpState());
 document.getElementById('btn-ach').addEventListener('click',()=>this.toggleAch());
 document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement===this.renderer.domElement)this.enterPlay(true);
  else if(this.state==='play'){this.state='pause';this.input.lookActive=false;this.el.overlayTitle.textContent='⏸ ПАУЗА';this.el.overlayHint.textContent='[ КЛИКНИ / Enter ]';this.el.overlayHint.style.color='#00ff00';this.el.overlay.style.display='flex';this.el.hud.style.display='none';}});
 document.addEventListener('pointerlockerror',()=>{LOGGER.warn('pointerlock error — играем без лока');});
 addEventListener('keydown',e=>{
  if(e.code==='F1'){e.preventDefault();this.el.help.style.display=this.el.help.style.display==='block'?'none':'block';}
  else if(e.code==='F2'){e.preventDefault();this.toggleAch();}
  else if(e.code==='F3'){e.preventDefault();this.toggleLogPanel();}
  else if(e.code==='F4'){e.preventDefault();LOGGER.download();}
  else if(e.code==='F5'){e.preventDefault();this.dumpState();}
  else if(e.code==='F6'){e.preventDefault();this.dumpFloaters();}
  else if(e.code==='F8'){e.preventDefault();resetSave();}
  else if(e.code==='F9'){e.preventDefault();tryStart();}
  else if(e.code==='KeyM'){SOUND.setMuted(!SOUND.muted);this.toast(SOUND.muted?'Звук ВЫКЛ':'Звук ВКЛ');}
  else if(e.code==='Space'&&this.state==='play')e.preventDefault();});
 addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.portrait.refreshRect();});
 LOGGER.info('v0.36 модульная сборка готова.');}
 unlockAch(id){if(GAME_DATA.ach.indexOf(id)>=0)return;GAME_DATA.ach.push(id);this.achToday.push(id);
  const a=ACH_MAP[id];this.toast('🏆 АЧИВКА: '+a.name+' — '+a.desc);SOUND.play('combo');this.updateAchCount();storeSave();LOGGER.info('ACH: '+id);}
 lifeBump(k,n){const L=GAME_DATA.life;L[k]=(L[k]||0)+(n||1);
  if(k==='rats'&&L.rats>=10)this.unlockAch('rat_slayer');
  if(k==='wiped'&&L.wiped>=10)this.unlockAch('clean_freak');
  if(k==='fed'&&L.fed>=5)this.unlockAch('cat_friend');
  if(k==='sprayed'&&L.sprayed>=5)this.unlockAch('chemist');
  if(k==='crates'&&L.crates>=10)this.unlockAch('treasure');}
 updateAchCount(){if(this.el.ach)this.el.ach.textContent=GAME_DATA.ach.length+'/'+ACHIEVEMENTS.length;}
 toggleAch(){const el=document.getElementById('achpanel');if(!el)return;
  if(el.style.display==='block'){el.style.display='none';return;}
  let h='<h2>🏆 АЧИВКИ ('+GAME_DATA.ach.length+'/'+ACHIEVEMENTS.length+')</h2>';
  for(const a of ACHIEVEMENTS){const done=GAME_DATA.ach.indexOf(a[0])>=0;
   h+='<div class="'+(done?'done':'locked')+'">'+(done?'✔':'✘')+' '+a[1]+' — '+a[2]+'</div>';}
  h+='<div style="margin-top:20px;color:#888;">[F2 — закрыть]</div>';
  el.innerHTML=h;el.style.display='block';}
 chatAdd(name,text,color){const el=this.el.chat;if(!el)return;
  const d=document.createElement('div');const hex='#'+(color||0xffffff).toString(16).padStart(6,'0');
  d.style.borderLeftColor=hex;d.innerHTML='<b style="color:'+hex+'">'+name+':</b> '+text;
  el.appendChild(d);while(el.children.length>7)el.removeChild(el.firstChild);
  setTimeout(()=>{d.classList.add('fade');setTimeout(()=>{if(d.parentNode)d.parentNode.removeChild(d);},1100);},7000);}
 dumpFloaters(){let n=0;for(const it of this.items){if(it.body&&it.body.position.y>2.5){n++;LOGGER.warn('floater: '+it.name+' y='+it.body.position.y.toFixed(2));}}
  for(const c of this.crates)if(c.body&&c.body.position.y>2.5){n++;LOGGER.warn('floater crate y='+c.body.position.y.toFixed(2));}
  this.toast('Флоатеров найдено: '+n);}
 clampFloaters(dt){for(const it of this.items){const b=it.body;if(!b||b.type!==CANNON.Body.DYNAMIC)continue;
   if(b.position.y>3.4){b._ft=(b._ft||0)+dt;if(b._ft>2){if(it.def&&it.def.id==='hazard_shard'){this.interactSystem.unregister(it.mesh);this.removeHighlightSafe(it);this.items=this.items.filter(x=>x!==it);it.dispose();}else{b.position.y=1.0;b.velocity.set(0,0,0);}b._ft=0;}}
   else b._ft=0;}}
 spawnPiles(){let cur=[CONFIG.SHELF1_X0,CONFIG.SHELF2_X0];let tier=0;
  const PILE_DEFS=[['bread_white',3],['bread_black',3],['bread_baton',3],['ing_sausage',3],['ing_cheese',4],['ing_cucumber',3],['ing_tomato',3],['ing_cutlet_raw',3],['ing_egg',3],['ing_onion',3],['sauce_ketchup',2],['sauce_mayo',2],['sauce_mustard',2],['sauce_oil',2],['hazard_bleach',1],['hazard_rotten',1]];
  for(const[def,count]of PILE_DEFS){const n=Math.max(1,Math.ceil(count/2));
   for(let i=0;i<n;i++){
    let si=cur[0]<CONFIG.SHELF1_X1?0:(cur[1]<CONFIG.SHELF2_X1?1:-1);
    if(si<0){tier++;cur=[CONFIG.SHELF1_X0,CONFIG.SHELF2_X0];si=0;}
    const h=defHeight(ITEM_DEFS[def]);const x=cur[si];cur[si]+=0.55;
    const e=this.spawnItem(def,{x:x,y:CONFIG.SHELF_Y+tier*0.4+h/2+0.02,z:CONFIG.SHELF_Z+Utils.rand(-0.15,0.15)});
    e.noBreak=performance.now()/1000+3;e.body.velocity.set(0,0,0);}}
  this.spawnItem('tool_spray',{x:4.9,y:CONFIG.SHELF_Y+0.2,z:CONFIG.SHELF_Z});
  this.spawnItem('tool_spray',{x:-6.9,y:CONFIG.SHELF_Y+0.2,z:CONFIG.SHELF_Z});
  this.spawnItem('tool_mop',{x:CONFIG.SINK_POS.x,y:1.2,z:CONFIG.SINK_POS.z});}
 spawnGoldenEgg(pos,vel){const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.16,12,12),new THREE.MeshStandardMaterial({color:0xffd700,emissive:0x665500,metalness:0.6,roughness:0.3}));
  mesh.userData={isItem:true};this.scene.add(mesh);
  const body=new CANNON.Body({mass:0.5,material:this.physics.defaultMaterial});body.addShape(new CANNON.Sphere(0.16));body.allowSleep=true;body.position.copy(pos);if(vel)body.velocity.copy(vel);body.label='golden_egg';
  this.physics.addBody(body,mesh);
  const ent={mesh,body,def:{id:'golden_egg',kind:'quest',shape:'sphere',p:[0.16],name:'Золотое Яйцо'},name:'Золотое Яйцо (ПАСХАЛКА!)',placed:null,carriedBy:null,meta:{kind:'quest'},
   dispose:()=>{this.physics.removeBody(body);this.scene.remove(mesh);}};
  this.items.push(ent);
  this.interactSystem.register(mesh,ent.name,()=>this.collectEgg(ent));
  this.interactSystem.addHighlight(mesh);
  return ent;}
 collectEgg(ent){this.interactSystem.unregister(ent.mesh);this.removeHighlightSafe(ent);this.items=this.items.filter(i=>i!==ent);ent.dispose();
  GAME_DATA.eggTaken=true;this.setMoney(GAME_DATA.money+100);this.addRep(5,'пасхалка');this.unlockAch('egg');this.toast('ПАСХАЛКА! Золотое яйцо! +100₽ +5 репы!');SOUND.play('combo');storeSave();}
 spawnDeliveryCrate(){const c=this.addCrate(CONFIG.HOLE_POS.x,CONFIG.HOLE_POS.z);c.body.position.set(CONFIG.HOLE_POS.x,4.2,CONFIG.HOLE_POS.z);c.body.velocity.set(0,0,0);c.body.wakeUp();this.toast('Ящик ПАДАЕТ из дыры!');}
 addCrate(x,z){const c=new CrateEntity(this.scene,this.physics,x,z);this.crates.push(c);this.interactSystem.register(c.group,'Ящик (лом+E)',()=>this.onCrate(c));this.interactSystem.addHighlight(c.group);this.structureSet.add(c.group);return c;}
 npcList(){return this.npcsCache&&this.npcsCache.length?this.npcsCache:this.queueSystem.allNpcs();}
 setMoney(v){GAME_DATA.money=Math.max(0,Math.round(v));this.el.money.textContent=GAME_DATA.money;if(GAME_DATA.money>=1000)this.unlockAch('rich');}
 addRep(n,r){GAME_DATA.reputation=Utils.clamp(GAME_DATA.reputation+n,0,100);this.el.rep.textContent=GAME_DATA.reputation;}
 enterPlay(l){ if(this.state==='play')return;
  try{this.el.overlay.style.display='none';this.el.hud.style.display='block';}catch(e){}
  try{SOUND.init();}catch(e){LOGGER.warn('sound: '+e.message);}
  this.state='play';this.input.lookActive=true;
  try{this.portrait.refreshRect();}catch(e){}
  this.clock.getDelta();
  if(!this.daySystem.active)this.daySystem.startDay();
  if(!this.hintShown){this.hintShown=true;this.toast('Смена 2:30! Гнездо где-то тут. Кот голоден. F1-справка, F2-ачивки.');}
  try{this.input.lock(this.renderer.domElement);}catch(e){LOGGER.warn('lock: '+e.message);} }
 openShop(){this.state='shop';this.input.lookActive=false;this.el.overlay.style.display='none';this.el.hud.style.display='none';this.shopSystem.open();}
 startNextDay(){this.shopSystem.close();GAME_DATA.day++;this.el.day.textContent=GAME_DATA.day;
  if(GAME_DATA.day>=5)this.unlockAch('day5');if(GAME_DATA.day>=10)this.unlockAch('day10');
  GAME_DATA.stats={served:0,angry:0,died:0,rats:0,earned:0};this.inspectDone=false;this.inspectWarned=false;this.combosDay=0;this.achToday=[];this.resetDayWorld();this.daySystem.startDay();this.el.overlay.style.display='none';this.enterPlay(false);this.toast('День '+GAME_DATA.day+'! Ящиков нет — покупай в терминале!');storeSave();}
 resetDayWorld(){for(const i of this.items.slice())i.dispose();this.items=[];for(const s of this.sandwiches.slice())s.dispose();this.sandwiches=[];for(const l of this.lids.slice())l.dispose();this.lids=[];for(const c of this.crates.slice())c.dispose();this.crates=[];
  this.puddleSystem.dispose();this.fireSystem.disposeAll();this.ratSystem.dispose();this.catSystem.dispose();this.flySystem.dispose();this.ragdollFactory.dispose();this.queueSystem.dispose();this.queueSystem.spawnTimer=6;this.clearDynamite();
  this.stoveSystem.reset();this.sandwichBuilder.reset();for(const s of this.allStacks()){s.placed=[];s.h=0;}
  this.holdSystem.releaseHeld();this.viewmodel=null;this.hands.detachHeld();this.smoking=0;this.cigFP.visible=false;this.portrait.setSmoking(false);this.talk=null;
  this.storeDoor.reset();this.bathDoor.reset();this.bathSystem.occupant=null;this.bathSystem.pending=null;this.bathSystem.knock=0;this.fridgeSystem.stocked=GAME_DATA.eggTaken?true:false;
  this.spawnPiles();
  this.crowbar=this.spawnItem('tool_crowbar',{x:CONFIG.HOOK_POS.x,y:CONFIG.HOOK_POS.y,z:CONFIG.HOOK_POS.z});this.slotPlace(this.crowbar,'hook');
  this.knife=this.spawnItem('tool_knife',{x:CONFIG.KNIFE_SLOT.x,y:CONFIG.KNIFE_SLOT.y,z:CONFIG.KNIFE_SLOT.z});this.slotPlace(this.knife,'knife_slot');
  this.nestSystem.reset();this.player.reset();GAME_DATA.bladder=0;
  const sh=this.meters.shame;sh.val=Math.floor(sh.val/2);sh.el.style.width=sh.val+'%';GAME_DATA.shame=sh.val;
  const di=this.meters.dirt;di.val=0;di.el.style.width='0%';di.warned=false;GAME_DATA.dirt=0;
  this.portrait.rig.wash();this.portrait.setHeadRat(false);}
 allStacks(){return[this.cutStack,this.assemblyStack];}
 addMeter(n,v,r){const m=this.meters[n];if(!m)return;if(n==='dirt'&&GAME_DATA.upgrades.apron&&v>0)v=Math.max(1,Math.round(v*0.6));
  m.val=Utils.clamp(m.val+v,0,100);m.el.style.width=m.val+'%';GAME_DATA[n]=m.val;
  if(n==='shame'){this.portrait.rig.setMood(m.val>60?'cry':'blush',3);if(m.val>=100){m.val=50;m.el.style.width='50%';GAME_DATA.shame=50;this.toast('ПОЗОР МАКСИМАЛЕН!');}}
  if(n==='dirt'&&m.warnAt&&m.val>=m.warnAt&&!m.warned){m.warned=true;this.toast('Ты ГРЯЗНЫЙ! Мыться!');}}
 decayMeters(dt){for(const k in this.meters){const m=this.meters[k];if(m.decay&&m.val>0){m.val=Math.max(0,m.val-m.decay*dt);m.el.style.width=m.val+'%';GAME_DATA[k]=m.val;}}}
 emitFaceEvent(m,x,z,r){const pool={scared:PHRASES.scared,laugh:PHRASES.laugh,sick:PHRASES.sick,happy:PHRASES.happy,angry:PHRASES.angry}[m];
  for(const c of this.npcList()){if(Utils.dist2(c.group.position.x,c.group.position.z,x,z)<r*r){c.setMood(m,3);if(pool&&Math.random()<0.3&&!c.bubble)c.setBubble(Utils.pick(pool),3);}}}
 witnessesNear(x,z,r){for(const c of this.npcList())if(Utils.dist2(c.group.position.x,c.group.position.z,x,z)<r*r)return c;return null;}
 flashVignette(s){this.el.vignette.style.opacity=String(s||0.9);this.vignetteT=0.9;}
 toast(t){this.el.toast.textContent=t;this.el.toast.style.display='block';this.toastTimer=3;LOGGER.info('TOAST: '+t);}
 spawnInspector(){const n=this.queueSystem.spawnClient&&null;return this._spawnIntruder(0xf2f2f2,'inspector');}
 _spawnIntruder(color,kind){return null;}
 runInspection(c){const score=GAME_DATA.dirt+this.bathSystem.dirt*8+this.ragdollFactory.dolls.length*15+this.ratSystem.rats.length*5+this.puddleSystem.puddles.length*3;
  if(score<=35){const b=100;this.setMoney(GAME_DATA.money+b);this.addRep(5,'инспекция довольна');this.unlockAch('sanitary');c.setBubble('Хм... чисто! Хвалю! +'+b+'₽',5);this.toast('Инспекция довольна! +'+b+'₽');SOUND.play('cash');}
  else{const f=score*2;this.setMoney(GAME_DATA.money-f);this.addRep(-5,'инспекция в шоке');c.setBubble('КОШМАР! Штраф '+f+'₽!',5);this.toast('Санитарный ШТРАФ '+f+'₽! (очков грязи: '+score+')');SOUND.play('deny');}
  c.done=true;c.fleeing=true;c.speed=3;this.queueSystem.sendOut(c);}
 startPoliceTalk(c){if(this.talk)return;this.talk={npc:c,step:0};
  c.setBubble(PHRASES.policeTalk[0],99);c.setTarget(c.group.position.x,0,c.group.position.z);
  this.toast('ПОЛИЦИЯ остановила вас! Жми E чтобы отвечать.');SOUND.play('siren');}
 advancePoliceTalk(){const t=this.talk;if(!t)return;t.step++;SOUND.play('beep');
  if(t.step<PHRASES.policeTalk.length){t.npc.setBubble(PHRASES.policeTalk[t.step],99);}
  else this.finishPoliceTalk();}
 finishPoliceTalk(){const c=this.talk.npc;this.talk=null;
  const dolls=this.ragdollFactory.dolls.length;
  if(dolls>=3||GAME_DATA.reputation<20){const fine=Math.max(100,100*dolls);this.setMoney(GAME_DATA.money-fine);
   c.setBubble('Штраф '+fine+'₽ за трупы! Прощайте.',5);this.addRep(10,'штраф оплачен');this.toast('Штраф '+fine+'₽. Больно.');SOUND.play('deny');}
  else{c.setBubble('ПРЕДУПРЕЖДЕНИЕ! Следующий раз — штраф!',5);this.addRep(5,'предупреждение');this.toast('Полиция предупредила.');}
  c.fined=true;c.fleeing=true;c.speed=3;this.queueSystem.sendOut(c);}
 updateDoors(dt){const pp=this.player.body.position;const near=(x,z,g,r)=>Utils.dist2(x,z,g.x,g.z)<r*r;
  let ws=near(pp.x,pp.z,CONFIG.STORE_GATE,2.4),wb=!this.bathSystem.occupant&&near(pp.x,pp.z,CONFIG.BATH_GATE,2.2);
  if(this.bathSystem.pending&&near(this.bathSystem.pending.group.position.x,this.bathSystem.pending.group.position.z,CONFIG.BATH_GATE,2.5))wb=true;
  for(const n of this.npcsCache){if(near(n.group.position.x,n.group.position.z,CONFIG.STORE_GATE,2.4))ws=true;
   if(!this.bathSystem.occupant&&near(n.group.position.x,n.group.position.z,CONFIG.BATH_GATE,2.2))wb=true;}
  this.storeDoor.motor(ws);this.bathDoor.motor(wb);}
 updateNeon(dt){this.neonT-=dt;if(this.neonT<=0){this.neonT=Utils.rand(0.05,0.5);this.neonOn=Math.random()<0.82;}
  if(this.worldBuilder.neonMat)this.worldBuilder.neonMat.opacity=this.neonOn?1:0.15;}
 updateClock(){const wb=this.worldBuilder;if(!wb.clockMinG)return;const p=1-Math.max(0,this.daySystem.t)/CONFIG.DAY_LENGTH;
  wb.clockMinG.rotation.z=-p*Math.PI*2*8;wb.clockHourG.rotation.z=-p*Math.PI*2*0.75;}
 checkPolice(dt){this.policeCd-=dt;if(this.policeCd>0)return;this.policeCd=12;
  if(this.queueSystem.intruders.some(c=>c.policeman))return;
  if(this.ragdollFactory.dolls.length>=3||GAME_DATA.reputation<20){this.policeCd=999;
   const NPCEntityCls=this._NPCEntity||null;this._spawnSpecial('police');}}
 _spawnSpecial(kind){/* создаётся через queue-слой ниже */}
 checkInspection(dt){if(this.inspectDone||!this.daySystem.active)return;
  if(!this.inspectWarned&&this.daySystem.t<CONFIG.DAY_LENGTH*0.62){this.inspectWarned=true;this.toast('Скоро ПРИДЁТ санитарная инспекция! Приберись и спрячь трупы!');SOUND.play('beep');}
  if(this.daySystem.t<CONFIG.DAY_LENGTH*0.55){this.inspectDone=true;if(Math.random()<0.8)this._spawnInspectorReal();}}
 _spawnInspectorReal(){}
 syncSlotDecor(){const w=this.worldBuilder;if(w.knifeDecor)w.knifeDecor.visible=!!this.slotDefs.knife_slot.entity;if(w.crowbarDecor)w.crowbarDecor.visible=!!this.slotDefs.hook.entity;}
 slotPlace(e,id){const s=this.slotDefs[id];if(this.holdSystem.heldEntity===e)this.holdSystem.releaseHeld();e.placed=id;e.body.type=CANNON.Body.STATIC;e.body.velocity.set(0,0,0);e.body.angularVelocity.set(0,0,0);e.body.position.copy(s.pos);e.body.quaternion.setFromEuler(s.euler);e.mesh.position.copy(s.pos);e.mesh.quaternion.setFromEuler(s.euler);e.mesh.visible=false;this.interactSystem.unregister(e.mesh);s.entity=e;this.syncSlotDecor();SOUND.play('drop');}
 slotTake(id){const s=this.slotDefs[id];if(!s.entity||this.holdSystem.heldEntity)return;const e=s.entity;s.entity=null;e.placed=null;e.body.type=CANNON.Body.DYNAMIC;e.mesh.visible=true;this.syncSlotDecor();this.takeIntoHands(e);}
 onSlot(id){const s=this.slotDefs[id];const h=this.holdSystem.heldEntity;if(h&&h.def.id===s.defId)this.slotPlace(h,id);else this.slotTake(id);}
 plantDynamite(x,z){if(this.dynamite)return;const e=this.spawnItem('hazard_dynamite',{x,y:0.4,z});this.dynamite={entity:e,t:CONFIG.DYNAMITE_FUSE};this.toast('ДИНАМИТ! '+CONFIG.DYNAMITE_FUSE+'с! ВЫБРОСЬ!');this.portrait.rig.setMood('scared',5);}
 clearDynamite(){if(!this.dynamite)return;const e=this.dynamite.entity;this.interactSystem.unregister(e.mesh);this.removeHighlightSafe(e);this.items=this.items.filter(i=>i!==e);e.dispose();this.dynamite=null;}
 updateDynamite(dt){if(!this.dynamite)return;const d=this.dynamite;d.t-=dt;const e=d.entity,p=e.body.position;e.setBlink(Math.sin(performance.now()*0.02*(1+(20-d.t)*0.2))>0);
  if(Math.abs(p.x)>10.6||p.z>15.6||p.z<-15.6){this.toast('Динамит улетел. Фух.');this.flashVignette(0.5);this.clearDynamite();return;}
  if(d.t<=0){this.explode(p.x,p.y,p.z);this.clearDynamite();}}
 explode(x,y,z){this.flashVignette(1);this.toast('БАБАААХ! ПИЗДЕЦ И ПОЖАР!');this.portrait.rig.addBruise();this.addMeter('shame',40,'взрыв');this.addRep(-10,'взрыв');this.emitFaceEvent('scared',x,z,20);SOUND.play('boom');
  for(const n of this.queueSystem.allNpcs().slice())if(Utils.dist2(n.group.position.x,n.group.position.z,x,z)<16)this.queueSystem.ragdollAny(n,'взрыв');
  for(const it of this.items.slice()){if(it.placed)this.unplaceEntity(it);const b=it.body,dx=b.position.x-x,dz=b.position.z-z,d2=dx*dx+dz*dz;if(d2<36){b.type=CANNON.Body.DYNAMIC;b.wakeUp();const d=Math.sqrt(d2)||1;b.velocity.set(dx/d*12,Utils.rand(4,9),dz/d*12);}}
  for(const c of this.crates)if(c.body){c.body.wakeUp();c.body.velocity.set(Utils.rand(-4,4),4,Utils.rand(-4,4));}
  const pp=this.player.body.position;if(Utils.dist2(pp.x,pp.z,x,z)<16){this.player.fallDown();this.player.body.wakeUp();this.portrait.rig.addSplash(0x333333);}
  if(Utils.dist2(pp.x,pp.z,x,z)<64)this.unlockAch('survivor');
  for(let i=0;i<3;i++)this.fireSystem.ignite(x+Utils.rand(-1.5,1.5),0.1,z+Utils.rand(-1.5,1.5),{big:i===0});}
 updateSaboteur(dt){this.saboteurT-=dt;if(this.saboteurT<=0){this.saboteurT=Utils.rand(120,240);if(!this.dynamite&&Math.random()<0.5){this._spawnSaboteur();}}}
 _spawnSaboteur(){}
 updateViewmodel(){const h=this.holdSystem.heldEntity;const vm=(h&&h.def&&VIEWMODEL_DEFS.indexOf(h.def.id)>=0)?h:null;if(this.viewmodel===vm)return;
  if(this.viewmodel){this.hands.detachHeld();this.scene.add(this.viewmodel.mesh);this.viewmodel.body.skipMeshSync=false;}
  this.viewmodel=vm;if(vm){vm.body.skipMeshSync=true;this.hands.attachHeld(vm.mesh);}}
 startAttack(w){this.hands.attack(w);SOUND.play('swing');this.pendingHit={weapon:w,t:0,delay:w==='tool_crowbar'?0.2:(w==='tool_knife'?0.12:(w==='tool_spray'?0.08:0.15)),done:false};}
 updatePendingHit(dt){if(!this.pendingHit)return;const p=this.pendingHit;p.t+=dt;if(!p.done&&p.t>=p.delay){p.done=true;this.performWeaponHit(p.weapon);}if(p.t>0.6)this.pendingHit=null;}
 spawnSprayFx(){const f=_fwd;this.camera.getWorldDirection(f);const m=new THREE.Mesh(new THREE.ConeGeometry(0.4,1.4,8,1,true),new THREE.MeshBasicMaterial({color:0xccffcc,transparent:true,opacity:0.5,side:THREE.DoubleSide}));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),f);m.position.copy(this.camera.position).addScaledVector(f,0.8);this.scene.add(m);this.sprayFx.push({mesh:m,t:0.25});}
 updateSprayFx(dt){for(let i=this.sprayFx.length-1;i>=0;i--){const f=this.sprayFx[i];f.t-=dt;f.mesh.scale.multiplyScalar(1+dt*3);f.mesh.material.opacity=Math.max(0,f.t*2);if(f.t<=0){this.scene.remove(f.mesh);this.sprayFx.splice(i,1);}}}
 doSpray(){const h=this.holdSystem.heldEntity;if(!h||h.def.id!=='tool_spray')return;if(h.spray===undefined)h.spray=12;if(h.spray<=0){this.toast('Баллон ПУСТ!');SOUND.play('deny');return;}h.spray--;this.hands.trigger();this.spawnSprayFx();SOUND.play('spray');
  const f=_fwd;this.camera.getWorldDirection(f);const cp=this.camera.position;
  for(const fi of this.fireSystem.fires){const v=_v1.set(fi.x-cp.x,fi.y-cp.y,fi.z-cp.z);const d=v.length();if(d<2.9){v.normalize();if(v.dot(f)>0.7){this.fireSystem.fuelAt(fi.x,fi.z,0.5);break;}}}
  for(const r of this.ratSystem.rats.slice()){if(r.onHead)continue;const v=_v1.set(r.x-cp.x,(r.wall?r.z:r.body.position.y)-cp.y+0.2,r.z-cp.z);const d=v.length();if(d>CONFIG.SPRAY_RANGE)continue;v.normalize();if(v.dot(f)>0.7){if(r.type==='cockroach')this.ratSystem.killRoach(r);else{this.ratSystem.scare(r);this.toast('Крыса умчалась!');}}}
  for(const fl of this.flySystem.flies.slice()){const v=_v1.set(fl.x-cp.x,fl.y-cp.y,fl.z-cp.z);const d=v.length();if(d>CONFIG.SPRAY_RANGE)continue;v.normalize();if(v.dot(f)>0.6){this.flySystem.kill(fl);this.toast('Муха сбита!');}}
  for(const c of this.npcList()){const hp=c.group.position;const v=_v1.set(hp.x-cp.x,hp.y+1-cp.y,hp.z-cp.z);const d=v.length();if(d>CONFIG.SPRAY_RANGE||d<0.01)continue;v.normalize();if(v.dot(f)>0.6)this.sprayNpc(c);}}
 sprayNpc(c){c.setMood('sick',5);this.puddleSystem.add('vomit',c.group.position.x,c.group.position.z,0.7);c.setBubble(Utils.pick(PHRASES.sick),4);c.sprayed=(c.sprayed||0)+1;this.addMeter('shame',4,'спрей');this.addRep(-2,'обрызган');this.lifeBump('sprayed');this.toast('Клиента ТОШНИТ!');SOUND.play('vomit');if(c.sprayed>=2){const i=this.queueSystem.clients.indexOf(c);if(i>=0)this.queueSystem.panicClient(c);}}
 smokeStart(pack){if(this.smoking>0)return;if(pack.cigs===undefined)pack.cigs=5;if(pack.cigs<=0){this.toast('Пачка пуста!');SOUND.play('deny');return;}pack.cigs--;this.smoking=15;this.cigFP.visible=true;this.portrait.setSmoking(true);SOUND.play('light');
  this.toast('Затянулся... 15с.');this.emitFaceEvent('angry',this.player.body.position.x,this.player.body.position.z,5);
  for(const c of this.npcList())if(Math.random()<0.4)c.setBubble(Utils.pick(PHRASES.smoke),4);}
 updateSmoke(dt){if(this.smoking>0){this.smoking-=dt;this.smokeAcc-=dt;
   if(this.smokeAcc<=0){this.smokeAcc=0.2;const wp=new THREE.Vector3();this.cigFP.getWorldPosition(wp);const s=new THREE.Mesh(new THREE.SphereGeometry(0.05,5,5),new THREE.MeshBasicMaterial({color:0xcccccc,transparent:true,opacity:0.35}));s.position.copy(wp);this.scene.add(s);this.fpSmoke.push({m:s,t:1.2});}
   if(Math.random()<dt*0.3)this.addMeter('dirt',1,'дым');
   if(this.smoking<=0){this.smoking=0;this.cigFP.visible=false;this.portrait.setSmoking(false);this.toast('Докурено.');}}
  for(let i=this.fpSmoke.length-1;i>=0;i--){const s=this.fpSmoke[i];s.t-=dt;s.m.position.y+=dt*0.7;s.m.material.opacity=Math.max(0,s.t*0.3);if(s.t<=0){this.scene.remove(s.m);this.fpSmoke.splice(i,1);}}}
 raycastCuttable(){this.interactSystem.raycaster.setFromCamera(new THREE.Vector2(0,0),this.camera);
  const hits=this.interactSystem.raycaster.intersectObjects(this.interactSystem.highlightables,true);
  for(const h of hits){if(h.distance>CONFIG.CUT_RANGE)break;let o=h.object;while(o.parent&&!(o.userData&&o.userData.isItem))o=o.parent;
   if(o.userData&&o.userData.isItem&&o.visible!==false){const e=this.items.find(i=>i.mesh===o||i.group===o);
    if(e&&e!==this.holdSystem.heldEntity&&!e.carriedBy&&CUTTABLE[e.def.id])return e;}}
  return null;}
 coneCuttable(){const f=_fwd;this.camera.getWorldDirection(f);const cp=this.camera.position;let best=null,bd=1e9;
  for(const it of this.items){if(it.carriedBy||this.holdSystem.heldEntity===it||!it.mesh.visible)continue;const id=it.def.id;if(!CUTTABLE[id])continue;
   const v=_v1.set(it.body.position.x-cp.x,it.body.position.y-cp.y,it.body.position.z-cp.z);const d=v.length();if(d>CONFIG.CUT_RANGE||d<0.01)continue;v.normalize();if(v.dot(f)<0.35)continue;if(d<bd){bd=d;best=it;}}
  return best;}
 knifeSwing(){ let t=this.raycastCuttable();
  if(!t){ const pp=this.player.body.position;
   if(Utils.dist2(pp.x,pp.z,CONFIG.CUT_POS.x,CONFIG.CUT_POS.z)<7.5){
    for(let i=this.cutStack.placed.length-1;i>=0;i--){const it=this.cutStack.placed[i];
     if(CUTTABLE[it.def.id]){t=it;break;}} } }
  if(!t)t=this.coneCuttable();
  if(!t){LOGGER.throttled('cut_miss','INPUT','нож в пустоту',0.5);return;}
  this.doCut(t);}
 doCut(e){const id=e.def.id,r=CUTTABLE[id];const stack=(e.placed&&typeof e.placed==='object')?e.placed:null;const pos=e.body.position.clone();const pf=!!e.perfect;
  this.unplaceEntity(e);this.interactSystem.unregister(e.mesh);this.removeHighlightSafe(e);this.items=this.items.filter(i=>i!==e);e.dispose();SOUND.play('cut');
  for(let i=0;i<r.count;i++){const o=this.spawnItem(r.out,{x:pos.x+Utils.rand(-0.15,0.15),y:pos.y+0.1,z:pos.z+Utils.rand(-0.15,0.15)});if(pf)o.perfect=true;if(stack)this.snapToStack(o,stack);}
  if(r.tears){this.puddleSystem.add('tears',this.player.body.position.x,this.player.body.position.z,0.6);this.portrait.rig.setMood('cry',6);this.toast('ЛУК! Слёзы!');}
  else this.toast('Разрезано пополам!');}
 performWeaponHit(w){if(w==='tool_knife'){this.knifeSwing();return;}if(w==='tool_spray'){this.doSpray();return;}if(w==='tool_mop'&&this.mopWipe())return;
  const f=_fwd;this.camera.getWorldDirection(f);const cp=this.camera.position;let hit=false;
  if(w==='tool_crowbar'&&this.nestSystem.alive){const np=this.nestSystem.pos;const v=_v1.set(np.x-cp.x,0.3,np.z-cp.z);const d=v.length();if(d<2.6){v.normalize();if(v.dot(f)>0.5)hit=this.nestSystem.hit();}}
  for(const n of this.npcList()){const hp=n.group.position;const v=_v1.set(hp.x-cp.x,hp.y+1.2-cp.y,hp.z-cp.z);const d=v.length();if(d>CONFIG.SWING_RANGE||d<0.01)continue;v.normalize();if(v.dot(f)>0.55){hit=true;this.hitNpc(n,f,w);}}
  for(const r of this.ratSystem.rats.slice()){if(r.onHead||r.wall)continue;const v=_v1.set(r.body.position.x-cp.x,r.body.position.y-cp.y+0.4,r.body.position.z-cp.z);const d=v.length();if(d>CONFIG.SWING_RANGE)continue;v.normalize();if(v.dot(f)>0.55){hit=true;if(w==='tool_crowbar')this.ratSystem.splat(r);else this.ratSystem.scare(r);}}
  for(const fl of this.flySystem.flies.slice()){const v=_v1.set(fl.x-cp.x,fl.y-cp.y,fl.z-cp.z);const d=v.length();if(d>CONFIG.SWING_RANGE)continue;v.normalize();if(v.dot(f)>0.5){hit=true;this.flySystem.kill(fl);this.toast('Муху прибил!');SOUND.play('splat');}}
  for(const c of this.crates){if(!c.body)continue;const v=_v1.set(c.body.position.x-cp.x,c.body.position.y-cp.y,c.body.position.z-cp.z);const d=v.length();if(d>CONFIG.SWING_RANGE)continue;v.normalize();if(v.dot(f)>0.6){hit=true;c.body.wakeUp();c.body.applyImpulse(new CANNON.Vec3(f.x*c.body.mass*2,0,f.z*c.body.mass*2),c.body.position);}}
  for(const it of this.items){if(it.placed||it.carriedBy||this.holdSystem.heldEntity===it||!it.mesh.visible)continue;const b=it.body;const v=_v1.set(b.position.x-cp.x,b.position.y-cp.y,b.position.z-cp.z);const d=v.length();if(d>CONFIG.SWING_RANGE)continue;v.normalize();if(v.dot(f)>0.6){hit=true;b.wakeUp();b.applyImpulse(new CANNON.Vec3(f.x*b.mass*2.2,f.y*b.mass+b.mass,f.z*b.mass*2.2),b.position);SOUND.play('drop');}}
  if(!hit)LOGGER.throttled('swing_miss','INPUT','взмах в пустоту',0.5);}
 hitNpc(n,f,w){if(n.ratKing){n.setMood('angry',5);n.setBubble('Ты ударил КОРОЛЯ?!',5);this.addRep(-5,'корона');SOUND.play('bonk');return;}
  if(n.policeman||n.inspector){n.setMood('angry',5);n.setBubble('Нападение на служивого?! ШТРАФ x2!',5);this.addRep(-10,'ударил служивого');SOUND.play('bonk');return;}
  if(w==='tool_mop'){n.addBruise();this.addMeter('shame',3,'швабра');}else{n.addBump();this.addMeter('shame',5,'лом');}
  this.addRep(-1,'избиение');n.setMood(Utils.pick(['cry','angry']),4);if(Math.random()<0.5)n.setBubble(Utils.pick(PHRASES.hit),4);n.knockV.set(f.x*4,0,f.z*4);this.emitFaceEvent('scared',n.group.position.x,n.group.position.z,6);SOUND.play('bonk');
  if(n.carryCrowbar&&Math.random()<0.6)this.dropCrowbarFromNpc(n,true);
  if(n.bumps+n.decals.length>=3){const i=this.queueSystem.clients.indexOf(n);if(i>=0)this.queueSystem.panicClient(n);}}
 giveCrowbarToNpc(n){const cb=this.crowbar;if(!cb||cb.carriedBy||this.holdSystem.heldEntity===cb)return false;this.interactSystem.unregister(cb.mesh);if(this.slotDefs.hook.entity===cb){this.slotDefs.hook.entity=null;cb.mesh.visible=true;this.syncSlotDecor();}cb.carriedBy=n;n.carryCrowbar=true;cb.body.type=CANNON.Body.KINEMATIC;return true;}
 dropCrowbarFromNpc(n,t){const cb=this.crowbar;if(!cb||cb.carriedBy!==n)return;n.carryCrowbar=false;cb.carriedBy=null;cb.body.type=CANNON.Body.DYNAMIC;cb.body.wakeUp();if(t)cb.body.velocity.set(Utils.rand(-4,4),Utils.rand(3,6),Utils.rand(-4,4));this.interactSystem.register(cb.mesh,cb.name,this.makeItemAction(cb));if(this.items.indexOf(cb)<0)this.items.push(cb);}
 takeIntoHands(e){if(this.holdSystem.heldEntity)return e;this.holdSystem.pickUp(e);this.interactSystem.unregister(e.mesh);this.items=this.items.filter(i=>i!==e);this.removeHighlightSafe(e);return e;}
 removeHighlightSafe(e){if(e.mesh)this.interactSystem.removeHighlight(e.mesh);if(e.group)this.interactSystem.removeHighlight(e.group);}
 makeItemAction(e){return()=>{if(this.holdSystem.heldEntity)return;if(e.carriedBy)return;this.holdSystem.pickUp(e);this.interactSystem.unregister(e.mesh);this.items=this.items.filter(i=>i!==e);this.hands.trigger();};}
 spawnItem(defId,pos,mystery){const def=ITEM_DEFS[defId];const e=new ItemEntity(this.scene,this.physics,def,pos,mystery);
  if(def.id==='tool_spray')e.spray=12;if(def.id==='tool_cigs')e.cigs=5;
  this.items.push(e);this.interactSystem.register(e.mesh,e.name,this.makeItemAction(e));this.interactSystem.addHighlight(e.mesh);
  e.body.addEventListener('collide',ev=>{const lbl=ev.body?ev.body.label:null;if(!lbl)return;const imp=ev.contact?Math.abs(ev.contact.getImpactVelocityAlongNormal()):0;
   if(lbl==='storedoor'||lbl==='bathdoor'||lbl==='fridgeDoor')return;
   if(lbl==='stove'&&def.kind==='sauce'){if(this.stoveSystem.onFire){this.consumeEntity(e,true);this.stoveSystem.extinguish();}else{this.puddleSystem.add(def.oil?'oil':'sauce',e.body.position.x,e.body.position.z,def.oil?1.6:0.7);this.consumeEntity(e,true);}return;}
   const now=performance.now()/1000;
   if((def.liquid||def.breakable)&&imp>8&&!e.placed&&this.holdSystem.heldEntity!==e&&now>e.noBreak){this.breakBottle(e);return;}
   const st=this.stackByLabel[lbl];if(!st||e.placed||this.holdSystem.heldEntity===e)return;if(e.body.velocity.length()>9)return;this.snapToStack(e,st);});
  return e;}
 consumeEntity(e,lb){const id=e.def.id,wl=e.def.liquid;const p=e.body.position.clone();if(this.holdSystem.heldEntity===e)this.holdSystem.releaseHeld();this.unplaceEntity(e);this.interactSystem.unregister(e.mesh);this.removeHighlightSafe(e);this.items=this.items.filter(i=>i!==e);e.dispose();if(lb&&wl)this.spawnItem('empty_bottle',{x:p.x,y:p.y+0.2,z:p.z});}
 breakBottle(e){const p=e.body.position;const nf=this.fireSystem.nearestNode(p.x,p.z,1.4);
  if(nf){const wo=e.def.oil;this.interactSystem.unregister(e.mesh);this.removeHighlightSafe(e);this.items=this.items.filter(x=>x!==e);e.dispose();if(wo)this.fireSystem.fuelAt(p.x,p.z,1.6);else{this.fireSystem.extinguishAt(p.x,p.z,1.6);this.toast('Соусом по огню!');}return;}
  this.toast('БУТЫЛКА РАЗБИЛАСЬ!');this.portrait.rig.setMood('cry',3);this.emitFaceEvent('scared',p.x,p.z,6);SOUND.play('glass');
  if(e.def.liquid)this.puddleSystem.add(e.def.oil?'oil':'sauce',p.x,p.z,e.def.oil?1.6:0.8);
  for(let i=0;i<4;i++){const s=this.spawnItem('hazard_shard',{x:p.x+Utils.rand(-0.5,0.5),y:p.y+0.3,z:p.z+Utils.rand(-0.5,0.5)});s.body.velocity.set(Utils.rand(-3,3),Utils.rand(2,5),Utils.rand(-3,3));}
  const id=e.def.id;this.interactSystem.unregister(e.mesh);this.removeHighlightSafe(e);this.items=this.items.filter(x=>x!==e);e.dispose();}
 releaseItemToWorld(e,t){e.body.type=CANNON.Body.DYNAMIC;e.body.wakeUp();if(t){const d=_fwd;this.camera.getWorldDirection(d);e.body.velocity.set(d.x*15,d.y*10+3,d.z*15);}else e.body.velocity.set(0,0,0);
  this.holdSystem.releaseHeld();SOUND.play('drop');
  if(e.def&&this.slotDefs.hook.defId===e.def.id&&Utils.dist2(e.body.position.x,e.body.position.z,CONFIG.HOOK_POS.x,CONFIG.HOOK_POS.z)<2.9&&Math.abs(e.body.position.y-CONFIG.HOOK_POS.y)<1.2){this.slotPlace(e,'hook');return;}
  this.interactSystem.register(e.mesh,e.name,this.makeItemAction(e));if(this.items.indexOf(e)<0)this.items.push(e);}
 stackHeightOf(s){let h=0;for(const e of(s.placed||[]))h+=defHeight(e.def);return h;}
 snapToStack(e,s){if(this.holdSystem.heldEntity===e)this.holdSystem.releaseHeld();if(e.placed)return;e.placed=s;s.placed.push(e);const h=defHeight(e.def);e.body.type=CANNON.Body.STATIC;e.body.velocity.set(0,0,0);e.body.angularVelocity.set(0,0,0);e.body.position.set(s.x,s.topY+s.h+h/2,s.z);e.body.quaternion.set(0,0,0,1);s.h+=h;this.interactSystem.unregister(e.mesh);}
 popFromStack(s){const e=(s.placed||[]).pop();if(!e)return null;e.placed=null;s.h=this.stackHeightOf(s);e.body.type=CANNON.Body.DYNAMIC;this.holdSystem.pickUp(e);this.items=this.items.filter(i=>i!==e);return e;}
 unplaceEntity(e){if(!e.placed||typeof e.placed!=='object')return;const s=e.placed;s.placed=(s.placed||[]).filter(x=>x!==e);s.h=this.stackHeightOf(s);e.placed=null;}
 onCutTable(){const h=this.holdSystem.heldEntity,s=this.cutStack;
  if(h){if(h.def.id==='tool_knife'){this.slotPlace(h,'knife_slot');this.toast('Нож на колонне.');return;}this.snapToStack(h,s);return;}
  if(this.slotDefs.knife_slot.entity){this.slotTake('knife_slot');return;}
  if(s.placed.length)this.popFromStack(s);else this.toast('Пусто. Нож на колонне — бей по столу!');}
 onAssemblyTable(){const h=this.holdSystem.heldEntity;
  if(h){if(h.def.id==='tool_knife'){this.slotPlace(h,'knife_slot');return;}this.sandwichBuilder.tryAdd(h);return;}
  if(this.sandwichBuilder.readyEntity){this.holdSystem.pickUp(this.sandwichBuilder.readyEntity);this.interactSystem.unregister(this.sandwichBuilder.readyEntity.group);this.sandwichBuilder.readyEntity=null;}
  else if(this.assemblyStack.placed.length)this.popFromStack(this.assemblyStack);
  else if(this.sandwichBuilder.stack.length)this.toast('Стек не закрыт! Q — закрыть.');else this.toast('Стол пуст.');}
 onStove(){const st=this.stoveSystem,h=this.holdSystem.heldEntity,S=CONFIG.STOVE_POS;
  if(st.onFire){if(h&&h.def.kind==='sauce'){if(h.def.oil){this.consumeEntity(h,true);this.fireSystem.fuelAt(S.x,S.z,1.6);}else{this.consumeEntity(h,true);st.extinguish();}}else this.toast('КИДАЙ СОУС в огонь!');return;}
  if(h&&h.def.id==='sauce_oil'){if(st.oiled)this.toast('Уже налито!');else{st.oiled=true;st.oilUses=GAME_DATA.upgrades.oil?3:2;this.consumeEntity(h,true);this.toast('Масло налито ('+st.oilUses+').');}return;}
  if(h&&h.def.friedId){if(!st.oiled){this.toast('Сначала МАСЛО!');return;}if(st.item){this.toast('Уже шкварчит!');return;}st.placeItem(h.def.id);this.consumeEntity(h,false);this.toast('На сковороду! E во время жарки = мини-игра!');return;}
  if(!h&&st.item){const it=st.item;
   if(it.burnt){this.takeIntoHands(st.removeItem());this.toast('Снял уголёк.');return;}
   if(it.needsFlip&&it.side===1&&it.t>=6){st.flip();this.toast('Перевернул!');return;}
   if(st.isReady()){st.oilUses--;if(st.oilUses<=0){st.oiled=false;this.toast('Масло кончилось!');}const e=st.removeItem();this.takeIntoHands(e);this.toast(it.perfect?'ИДЕАЛЬНАЯ прожарка! +15₽ к бутеру!':'Снял.');return;}
   if(!this.minigame&&it.t>1.5&&!it.perfect){this.startMinigame({type:'fry',t:0,center:Utils.rand(0.3,0.7),width:0.2,speed:5});this.el.mgText.textContent='ЖАРКА: попади в зелёную = ИДЕАЛЬНО (+15₽)!';
    if(!this.fryHinted){this.fryHinted=true;this.toast('Мини-игра прожарки! Идеальная котлета +15₽!');}
    return;}
   this.toast('Ещё шкварчит ('+it.t.toFixed(0)+'с). E = мини-игра прожарки.');return;}
  if(!h&&!st.item)this.toast('Плита: масло (E), потом еда (E).');}
 onSink(){if(this.sinkCd>0){this.toast('Уже чисто!');return;}this.sinkCd=6;this.hands.trigger();this.addMeter('shame',-15,'умылся');const d=this.meters.dirt;d.val=0;d.el.style.width='0%';d.warned=false;GAME_DATA.dirt=0;this.portrait.rig.wash();this.portrait.rig.setMood('happy',3);this.toast('Смыл всё. Чист!');SOUND.play('spray');}
 onGrinder(){const g=CONFIG.GRINDER_POS,d=this.ragdollFactory.near(g.x,g.z,1.8);if(!d){this.toast('Тащи регдолла (Shift)!');return;}this.ragdollFactory.remove(d);this.spawnItem('cutlet_human_raw',{x:g.x-0.3,y:g.y+0.4,z:g.z});this.spawnItem('cutlet_human_raw',{x:g.x+0.3,y:g.y+0.4,z:g.z});this.unlockAch('butcher');this.toast(Utils.pick(PHRASES.grinder));this.addMeter('shame',10,'мясорубка');SOUND.play('bonk');}
 breakGlass(){if(!this.worldBuilder.glassIntact){this.toast('Уже разбито.');return;}const h=this.holdSystem.heldEntity;if(!h||h.def.id!=='tool_crowbar'){this.toast('Нужен ЛОМ!');return;}
  this.worldBuilder.glassIntact=false;this.scene.remove(this.worldBuilder.glassMesh);this.physics.removeBody(this.worldBuilder.glassBody);this.interactSystem.unregister(this.worldBuilder.glassMesh);this.unlockAch('vandal');SOUND.play('glass');
  for(let i=0;i<5;i++){const s=this.spawnItem('hazard_shard',{x:CONFIG.GLASS_POS.x+Utils.rand(-0.8,0.8),y:CONFIG.GLASS_POS.y,z:CONFIG.GLASS_POS.z+Utils.rand(-0.3,0.3)});s.body.velocity.set(Utils.rand(-3,3),Utils.rand(1,4),Utils.rand(-3,3));}
  this.toast('СТЕКЛО РАЗБИТО!');}
 onCrate(c){const h=this.holdSystem.heldEntity;if(c.open){this.toast('Уже вскрыт.');return;}if(!h||h.def.id!=='tool_crowbar'){this.toast('Нужен ЛОМ!');return;}
  this.startMinigame({type:'crate',crate:c,t:0,center:Utils.rand(0.25,0.75),width:0.18,attempts:3,speed:4});this.el.mgText.textContent='E в зелёной! Q — сдаться.';}
 openCrate(c){const lid=c.openLid(this.scene,this.physics);this.lids.push(lid);this.lifeBump('crates');
  const cx=c.group.position.x,cz=c.group.position.z,now=performance.now()/1000;const roll=Math.random();
  if(roll<0.10)this.toast('Ящик ПУСТОЙ.');
  else if(roll<0.28){this.ratSystem.spawn(Math.random()<0.3?'rat':'cockroach',cx,cz);this.toast('Из ящика ВЫЛЕЗЛА живность!');}
  else{const n=Utils.randInt(3,5);for(let i=0;i<n;i++){const e=this.spawnItem(Utils.pick(['bread_white','bread_black','ing_sausage','ing_cheese','ing_cucumber','ing_tomato','ing_cutlet_raw','ing_egg','ing_onion','sauce_ketchup','sauce_mayo','sauce_oil','hazard_rotten','empty_bottle','slice_sausage','toast','hazard_shard','tool_spray','dead_rat']),{x:cx,y:0.9,z:cz});e.noBreak=now+6;const a=Utils.rand(0,Math.PI*2),sp=Utils.rand(2,5);e.body.velocity.set(Math.cos(a)*sp,Utils.rand(3,6),Math.sin(a)*sp);e.body.angularVelocity.set(Utils.rand(-5,5),Utils.rand(-5,5),Utils.rand(-5,5));}
   this.toast('Лут ВЫЛЕТЕЛ! 6с не бьётся.');}}
 findBottle(){const h=this.holdSystem.heldEntity;if(h&&h.def&&h.def.id==='empty_bottle')return{bottle:h,held:true};
  const a=this.interactSystem.raycastItemEntity(this.items,4.5);if(a&&a.def.id==='empty_bottle')return{bottle:a,held:false};
  const f=_fwd;this.camera.getWorldDirection(f);const cp=this.camera.position;
  for(const it of this.items){if(it.def.id!=='empty_bottle'||it.carriedBy||!it.mesh.visible)continue;const v=_v1.set(it.body.position.x-cp.x,it.body.position.y-cp.y,it.body.position.z-cp.z);const d=v.length();if(d>2.4||d<0.01)continue;v.normalize();if(v.dot(f)>0.4)return{bottle:it,held:false};}return null;}
 tryStartBottleMinigame(){if(this.state!=='play'||this.minigame||this.talk)return;const f=this.findBottle();if(!f)return;
  this.startMinigame({type:'bottle',bottle:f.bottle,held:f.held,t:0,hits:0,misses:0,center:Utils.rand(0.2,0.8),width:0.22,speed:5,witnessCd:0});
  this.el.mgText.textContent='ДРОЧ-О-ТРОН: 3 попадания! E/ЛКМ.';}
 startMinigame(m){this.minigame=m;this.el.minigame.style.display='block';this.el.mgZone.style.left=((m.center-m.width/2)*100)+'%';this.el.mgZone.style.width=(m.width*100)+'%';}
 endMinigame(){this.minigame=null;this.el.minigame.style.display='none';this.hands.setJerk(false);}
 minigameConfirm(){const m=this.minigame;if(!m)return;const mk=0.5+0.5*Math.sin(m.t*m.speed),hit=Math.abs(mk-m.center)<m.width/2;
  if(m.type==='fry'){const st=this.stoveSystem;this.endMinigame();
   if(st.item){if(hit){st.item.t=6;st.item.perfect=true;if(st.item.needsFlip)st.item.side=2;this.unlockAch('perfect_fry');this.toast('ИДЕАЛЬНАЯ прожарка! +15₽ к бутеру!');SOUND.play('perfect');}
    else{st.item.t+=4;this.toast('Мимо! Подгорает...');SOUND.play('deny');}}
   return;}
  if(m.type==='crate'){if(hit){this.openCrate(m.crate);this.endMinigame();}else{m.attempts--;SOUND.play('deny');if(m.attempts<=0){this.toast('Лом соскользнул.');this.endMinigame();}else{this.toast('Мимо! Попыток: '+m.attempts);m.center=Utils.rand(0.25,0.75);this.el.mgZone.style.left=((m.center-m.width/2)*100)+'%';}}return;}
  if(hit){m.hits++;this.hands.trigger();SOUND.play('beep');m.speed+=1.5;m.center=Utils.rand(0.2,0.8);m.width=Math.max(0.12,m.width-0.03);this.el.mgZone.style.left=((m.center-m.width/2)*100)+'%';this.el.mgZone.style.width=(m.width*100)+'%';
   const p=this.player.body.position,w=this.witnessesNear(p.x,p.z,8);if(w&&m.witnessCd<=0){m.witnessCd=2;this.addMeter('shame',25,'УВИДЕЛИ');w.setMood('scared',4);}
   if(m.hits>=3){this.finishBottle(m);this.endMinigame();}else this.el.mgText.textContent=m.hits+'/3!';}
  else{m.misses++;SOUND.play('deny');if(m.misses>=3){this.toast('Рука устала.');this.addMeter('shame',10,'неудача');this.endMinigame();}else this.el.mgText.textContent='Мимо ('+m.misses+'/3)';}}
 finishBottle(m){const b=m.bottle;const wh=m.held&&this.holdSystem.heldEntity===b;const pos=wh?this.camera.position.clone():b.body.position.clone();if(wh)this.holdSystem.releaseHeld();this.unplaceEntity(b);this.interactSystem.unregister(b.mesh);this.removeHighlightSafe(b);this.items=this.items.filter(i=>i!==b);b.dispose();
  const f=this.spawnItem('sauce_fake',{x:pos.x,y:pos.y+0.2,z:pos.z});if(wh){this.holdSystem.pickUp(f);this.items=this.items.filter(i=>i!==f);}this.addMeter('shame',10,'майонез');this.unlockAch('bottle_master');this.toast('Домашний майонез готов.');}
 comboBonus(got){let bonus=0;const ids=got.map(l=>l.defId);
  for(const c of COMBOS){let ok=true;const pool=ids.slice();
   for(const need of c.need){const i=pool.indexOf(need);if(i<0){ok=false;break;}pool.splice(i,1);}
   if(ok){bonus+=c.bonus;this.combosDay++;if(this.combosDay>=3)this.unlockAch('combo_master');this.toast('КОМБО: '+c.name+'! +'+c.bonus+'₽');SOUND.play('combo');}}
  return bonus;}
 shove(){if(this.state!=='play'||this.minigame||this.talk)return;if(this.shoveCd>0)return;this.shoveCd=0.5;this.hands.trigger();
  const f=_fwd;this.camera.getWorldDirection(f);const cp=this.camera.position;const cands=[];
  for(const d of this.ragdollFactory.dolls)cands.push(d.body);
  for(const it of this.items)if(!it.placed&&!it.carriedBy&&this.holdSystem.heldEntity!==it)cands.push(it.body);
  for(const s of this.sandwiches)if(this.holdSystem.heldEntity!==s)cands.push(s.body);
  for(const c of this.crates)if(c.body)cands.push(c.body);
  for(const r of this.ratSystem.rats)if(!r.onHead&&!r.wall)cands.push(r.body);
  let best=null,bd=0.85;for(const b of cands){const v=_v1.set(b.position.x-cp.x,b.position.y-cp.y,b.position.z-cp.z);const d=v.length();if(d>CONFIG.SHOVE_RANGE||d<0.01)continue;v.normalize();const dot=v.dot(f);if(dot>bd){bd=dot;best=b;}}
  if(best){const m=best.mass,dv=Utils.clamp(60/m,0.8,4);best.wakeUp();best.applyImpulse(new CANNON.Vec3(f.x*m*dv,f.y*m*dv*0.25+m*dv*0.2,f.z*m*dv),best.position);SOUND.play('bonk');}}
 pee(){if(this.state!=='play'||this.talk)return;const h=this.holdSystem.heldEntity,p=this.player.body.position;const seen=this.witnessesNear(p.x,p.z,6);
  if(h&&h.def.id==='empty_bottle'){this.interactSystem.unregister(h.mesh);this.removeHighlightSafe(h);this.items=this.items.filter(i=>i!==h);h.dispose();const pe=this.spawnItem('sauce_pee',{x:p.x,y:p.y,z:p.z});this.items=this.items.filter(i=>i!==pe);this.holdSystem.pickUp(pe);this.toast('Отлил в бутылку.');if(seen){this.addMeter('shame',40,'публично');seen.setMood('scared',4);}}
  else{this.puddleSystem.add('pee',p.x,p.z,0.7);if(seen){this.addMeter('shame',50,'прилюдно');seen.setMood('scared',4);this.emitFaceEvent('laugh',p.x,p.z,8);}else this.toast('Лужа. Надо было в бутылку.');}
  GAME_DATA.bladder=0;this.hands.trigger();}
 mopWipe(){const pp=this.player.body.position;
  if(Utils.dist2(pp.x,pp.z,CONFIG.TOILET_POS.x,CONFIG.TOILET_POS.z)<2&&this.bathSystem.dirt>0){this.bathSystem.clean();this.hands.trigger();return true;}
  const ah=this.interactSystem.floorPointInFront(1.2);let pud=this.puddleSystem.nearest(ah.x,ah.z,1.5);if(!pud)pud=this.puddleSystem.nearest(pp.x,pp.z,1);
  if(pud){this.puddleSystem.removePuddle(pud);this.lifeBump('wiped');this.toast('Вытерто!');SOUND.play('wipe');return true;}return false;}
 registerSandwich(e){this.sandwiches.push(e);this.interactSystem.addHighlight(e.group);}
 unregisterSandwich(e){this.sandwiches=this.sandwiches.filter(s=>s!==e);this.interactSystem.removeHighlight(e.group);}
 tryServe(npc){const a=this.queueSystem.activeClient();if(!a){this.toast('Этот не дотопал!');return;}if(npc!==a){this.toast('Не главный!');return;}
  if(GAME_DATA.dirt>=50){a.setMood('sick',4);a.setBubble(Utils.pick(PHRASES.dirty),5);this.toast('Клиент ОТКАЗЫВАЕТ: ГРЯЗНЫЙ!');this.addMeter('shame',5,'грязь');return;}
  const h=this.holdSystem.heldEntity;if(!h){this.toast('Руки пустые!');return;}
  if(h.meta&&h.meta.kind==='hazard'){this.toast(Utils.pick(PHRASES.ragdoll));this.queueSystem.ragdollClient(a,'опасным');this.holdSystem.releaseHeld();h.dispose();return;}
  if(!h.meta||h.meta.kind!=='sandwich'){this.toast('Это не бутерброд!');return;}
  const order=a.order||{layers:[]},got=h.meta.layers||[],king=!!a.ratKing;
  if(got.some(l=>l.kind==='hazard')){this.queueSystem.ragdollClient(a,'токсичный');this.holdSystem.releaseHeld();this.unregisterSandwich(h);h.dispose();return;}
  if(got.some(l=>l.kind==='pest')){if(king){const price=order.price*2;this.economySystem.addMoney(price);GAME_DATA.stats.served++;GAME_DATA.stats.earned+=price;this.addRep(3,'король доволен');this.toast('КОРОЛЬ В ВОСТОРГЕ! x2 = '+price+'₽!');a.setMood('happy',5);this.queueSystem.releaseCurrent(true);SOUND.play('cash');}
   else{this.toast(Utils.pick(PHRASES.pest));this.queueSystem.ragdollClient(a,'паразит');}
   this.holdSystem.releaseHeld();this.unregisterSandwich(h);h.dispose();return;}
  if(h.meta.contaminated){this.toast('Клиент ПОБЕЛЕЛ...');this.queueSystem.makeSick(a);this.holdSystem.releaseHeld();this.unregisterSandwich(h);h.dispose();return;}
  let ok=got.length===(order.layers||[]).length;
  if(ok)for(let i=0;i<got.length;i++){const x=got[i],y=(order.layers||[])[i];if(!y){ok=false;break;}const m=x.defId===y.defId||(x.kind==='sauce'&&WILD_SAUCES.indexOf(x.defId)>=0)||(y.defId==='ing_cutlet_fried'&&CUTLET_WILD.indexOf(x.defId)>=0);if(x.kind!==y.kind||!m){ok=false;break;}}
  const nt=(order.layers||[]).some(l=>l.top),gt=got.some(l=>l.top),tox=got.some(l=>WILD_SAUCES.indexOf(l.defId)>=0);let ph;
  if(ok&&tox&&Math.random()<0.6){this.toast('Клиент ПОБЕЛЕЛ...');this.queueSystem.makeSick(a);}
  else if(ok){let price=order.price+(h.perfect?15:0);price+=this.comboBonus(got);
   ph=king?Utils.pick(PHRASES.ratKingHappy):Utils.pick(PHRASES.happy);this.economySystem.addMoney(price);GAME_DATA.stats.served++;GAME_DATA.stats.earned+=price;this.addRep(king?3:1,'доволен');
   this.unlockAch('first_serve');if(GAME_DATA.stats.served>=8)this.unlockAch('shift');
   this.toast('+'+price+'₽! '+ph);a.setMood('happy',4);a.setBubble('😍 '+ph,6);this.queueSystem.releaseCurrent(true);SOUND.play('cash');
   if(king){GAME_DATA.kingServed=(GAME_DATA.kingServed||0)+1;
    if(GAME_DATA.kingServed>=3&&!GAME_DATA.patron){GAME_DATA.patron=true;this.unlockAch('king_patron');this.toast('👑 КРЫСИНЫЙ КОРОЛЬ — твой ПАТРОН! Крысы больше не воруют и не лезут в бутеры.');this.addRep(5,'патрон');storeSave();}}}
  else{ph=king?Utils.pick(PHRASES.ratKingAngry):(nt&&!gt?Utils.pick(PHRASES.missingTop):(!nt&&gt?Utils.pick(PHRASES.extraTop):Utils.pick(PHRASES.angry)));this.toast(ph);GAME_DATA.stats.angry++;this.addRep(king?-5:-2,'злой');a.setMood('angry',4);a.setBubble('😡 '+ph,5);this.queueSystem.releaseCurrent(false);SOUND.play('deny');}
  this.holdSystem.releaseHeld();this.unregisterSandwich(h);h.dispose();}
 handleLeft(){if(this.state!=='play'||this.talk)return;
  if(this.minigame){if(this.minigame.type==='bottle'||this.minigame.type==='fry')this.minigameConfirm();return;}
  const hr=this.ratSystem.headRat;if(hr){hr.struggle++;this.hands.trigger();if(hr.struggle>=6)this.ratSystem.detachHead(true);return;}
  const h=this.holdSystem.heldEntity;
  if(h&&h.def&&VIEWMODEL_DEFS.indexOf(h.def.id)>=0){if(this.swingCd>0)return;this.swingCd=h.def.id==='tool_crowbar'?0.55:(h.def.id==='tool_spray'?0.25:0.35);this.startAttack(h.def.id);return;}
  this.tryStartBottleMinigame();}
 handleInteract(){if(this.state!=='play')return;
  if(this.talk){this.advancePoliceTalk();return;}
  if(this.minigame){this.minigameConfirm();return;}
  const hov=this.interactSystem.hovered,h=this.holdSystem.heldEntity;
  if(h){
   if(CAT_FOOD.indexOf(h.def.id)>=0&&this.catSystem.cat){const c=this.catSystem.cat;const pp=this.player.body.position;
    if(Utils.dist2(c.x,c.z,pp.x,pp.z)<6){this.catSystem.feed();this.consumeEntity(h,false);this.hands.trigger();return;}}
   if(h.def&&h.def.id==='tool_cigs'){this.smokeStart(h);return;}
   if(hov&&hov.userData&&hov.userData.action&&(this.structureSet.has(hov)||(hov.userData.name||'').startsWith('Обслужить')||(hov.userData.name||'').startsWith('Кнопка')||(hov.userData.name||'').indexOf('Туалет')>=0||(hov.userData.name||'').indexOf('Дверь')>=0||(hov.userData.name||'').indexOf('Яйцо')>=0||(hov.userData.name||'').indexOf('Холодильник')>=0||(hov.userData.name||'').indexOf('Плита')>=0)){hov.userData.action();return;}
   this.releaseItemToWorld(h,false);this.hands.trigger();}
  else if(hov){this.interactSystem.interact();this.hands.trigger();}}
 handleDrop(){if(this.state!=='play'||this.talk)return;
  if(this.minigame){this.endMinigame();return;}
  const hov=this.interactSystem.hovered;
  if(hov===this.worldBuilder.assemblyMesh&&this.sandwichBuilder.stack.length>=1&&this.sandwichBuilder.stack[0].kind==='bread'){this.sandwichBuilder.finish();this.toast('Закрыто как есть!');return;}
  const h=this.holdSystem.heldEntity;if(!h)return;this.hands.trigger();
  if(h.meta&&h.meta.kind==='sandwich'){this.holdSystem.releaseHeld();h.body.type=CANNON.Body.DYNAMIC;h.body.wakeUp();const d=_fwd;this.camera.getWorldDirection(d);h.body.velocity.set(d.x*15,d.y*10+3,d.z*15);this.interactSystem.register(h.group,h.name,()=>{if(!this.holdSystem.heldEntity){this.holdSystem.pickUp(h);this.interactSystem.unregister(h.group);}});this.sandwichBuilder.readyEntity=h;}
  else this.releaseItemToWorld(h,true);}
 checkSlips(dt){this.slipCd-=dt;const p=this.player.body.position;const ss=GAME_DATA.upgrades.shoes?3.6:2;
  if(this.slipCd<=0&&!this.player.down&&this.player.getupT<=0){const pud=this.puddleSystem.at(p.x,p.z);const sp=Math.sqrt(this.player.body.velocity.x**2+this.player.body.velocity.z**2);
   if(pud&&sp>ss){this.slipCd=4;this.player.body.velocity.x+=Utils.rand(-4,4);this.player.body.velocity.z+=Utils.rand(-4,4);const h=this.holdSystem.heldEntity;if(h)this.releaseItemToWorld(h,true);this.player.fallDown();this.player.body.wakeUp();this.flashVignette(0.95);this.portrait.rig.addBruise();this.portrait.rig.addSplash(PUDDLE_COLORS[pud.type]);this.addMeter('dirt',10,'лужа');let st=0;SOUND.play('boing');
    for(const it of this.items){if(st>=3)break;if(STICKY_KINDS.indexOf(it.def.kind)>=0&&it.mesh.visible&&Utils.dist2(it.body.position.x,it.body.position.z,p.x,p.z)<4.84){this.portrait.rig.addStuck(it.def.color);this.addMeter('dirt',6,'прилипло');st++;}}
    this.toast('ПОДСКОЛЬЗНУЛСЯ! SPACE!');this.addMeter('shame',30,'позор');this.emitFaceEvent('laugh',p.x,p.z,10);}}
  for(const c of this.queueSystem.intruders){if(c.fallTimer>0||c.fleeing||c.saboteur||c.policeman||c.toilet||c.inspector)continue;const pud=this.puddleSystem.at(c.group.position.x,c.group.position.z);if(pud&&c.state==='walk'){c.fallTimer=3;c.setMood('blush',6);c.addSplash(PUDDLE_COLORS[pud.type]);this.emitFaceEvent('laugh',c.group.position.x,c.group.position.z,8);}}}
 checkBladder(dt){GAME_DATA.bladder=Math.min(100,GAME_DATA.bladder+dt*0.8);this.el.bladderbar.style.width=GAME_DATA.bladder+'%';
  if(GAME_DATA.bladder>=100){GAME_DATA.bladder=0;this.puddleSystem.add('pee',this.player.body.position.x,this.player.body.position.z,0.9);this.toast('НЕ ДОТЕРПЕЛ!');this.addMeter('shame',60,'авария');this.addMeter('dirt',20,'штаны');this.emitFaceEvent('laugh',this.player.body.position.x,this.player.body.position.z,10);SOUND.play('fart');}}
 toggleLogPanel(){const on=this.el.logpanel&&this.el.logpanel.style.display!=='block';if(this.el.logpanel)this.el.logpanel.style.display=on?'block':'none';}
 dumpState(){LOGGER.info('--- DUMP ---');LOGGER.info('state='+this.state+' day='+GAME_DATA.day+' money='+GAME_DATA.money+' rep='+GAME_DATA.reputation+' talk='+(this.talk?'ДА':'нет')+' dayT='+this.daySystem.t.toFixed(0)+' patron='+GAME_DATA.patron+' ach='+GAME_DATA.ach.length+'/'+ACHIEVEMENTS.length+' playerY='+this.player.body.position.y.toFixed(2)+' sleep='+this.player.body.sleepState);
  LOGGER.info('nest=('+this.nestSystem.pos.x.toFixed(1)+','+this.nestSystem.pos.z.toFixed(1)+') alive='+this.nestSystem.alive+' rats='+this.ratSystem.rats.length+'(carry '+this.ratSystem.rats.filter(r=>r.carry).length+') cat='+(this.catSystem.cat?('hunger '+this.catSystem.cat.hunger.toFixed(0)):'нет')+' flies='+this.flySystem.flies.length+' dolls='+this.ragdollFactory.dolls.length);
  LOGGER.info('--- END ---');}
 update(){requestAnimationFrame(()=>this.update());
  if(this.state==='computer'||this.state!=='play'){
   if(this.state==='dayend'&&this.el.overlay.style.display!=='flex'){this.el.overlay.style.display='flex';this.el.overlayTitle.textContent='🌙 День '+GAME_DATA.day+' завершён!';this.el.overlayHint.innerHTML='Итоги дня: 💰 '+GAME_DATA.money+'₽ | ⭐ '+GAME_DATA.reputation+' | 🏆 '+GAME_DATA.ach.length+'/'+ACHIEVEMENTS.length+'<br>[ КЛИК — магазин, потом день '+(GAME_DATA.day+1)+' ]';this.el.overlayHint.style.color='#00ff00';}
   this.renderer.render(this.scene,this.camera);return;}
  const dt=Math.min(this.clock.getDelta(),0.1);
  try{
   if(this.el.overlay.style.display!=='none')this.el.overlay.style.display='none';
   if(this.player.body.sleepState===CANNON.Body.SLEEPING||this.player.body.sleepState===CANNON.Body.SLEEPY)this.player.body.wakeUp();
   {const pb=this.player.body;
    if(!isFinite(pb.position.x)||!isFinite(pb.position.y)||!isFinite(pb.position.z)){pb.position.set(0,1,0);pb.velocity.set(0,0,0);this.player.smoothY=null;this.toast('Телепорт: физика сошла с ума.');}
    else if(pb.position.y<0.3){pb.position.y=0.8;if(pb.velocity.y<0)pb.velocity.y=0;this.player.smoothY=null;}}
   this.frames++;this.fpsTimer+=dt;if(this.fpsTimer>=2){LOGGER.phys('fps='+Math.round(this.frames/this.fpsTimer));this.frames=0;this.fpsTimer=0;}
   if(this.shoveCd>0)this.shoveCd-=dt;if(this.swingCd>0)this.swingCd-=dt;if(this.sinkCd>0)this.sinkCd-=dt;
   if(this.toastTimer>0){this.toastTimer-=dt;if(this.toastTimer<=0)this.el.toast.style.display='none';}
   if(this.vignetteT>0){this.vignetteT-=dt;if(this.vignetteT<=0)this.el.vignette.style.opacity='0';}
   const talking=!!this.talk;
   if(talking){this.input.mouse.dx=0;this.input.mouse.dy=0;}
   if(this.minigame){this.minigame.t+=dt;if(this.minigame.witnessCd>0)this.minigame.witnessCd-=dt;this.el.mgMarker.style.left=((0.5+0.5*Math.sin(this.minigame.t*this.minigame.speed))*100)+'%';}
   this.hands.setJerk(!!(this.minigame&&this.minigame.type==='bottle'));
   this.updatePendingHit(dt);
   if(!this.minigame&&!talking)this.player.update(dt,this.input);
   this.holdSystem.update();this.physics.update(dt);this.player.syncCamera(dt);this.updateViewmodel();
   const mv=Math.sqrt(this.player.body.velocity.x**2+this.player.body.velocity.z**2)>1;
   if(mv){const ph=Math.floor(this.player.walkPhase/Math.PI);if(ph!==this.stepLast){this.stepLast=ph;SOUND.play('step');}}
   this.murmurT-=dt;if(this.murmurT<=0){this.murmurT=Utils.rand(3,7);if(this.queueSystem.clients.length>=2)SOUND.play('murmur');}
   this.hands.update(dt,this.player.walkPhase,mv);this.portrait.update(dt);this.portrait.setHeadRat(!!this.ratSystem.headRat);
   this.updateSmoke(dt);this.updateNeon(dt);this.updateClock();this.dustSystem.update(dt,this.clock.elapsedTime);
   for(const s of this.sandwiches)if(this.holdSystem.heldEntity!==s)s.sync();
   for(const c of this.crates)c.sync();
   this.npcsCache=this.queueSystem.allNpcs();
   this.updateDoors(dt);this.lampSystem.update(dt,this.player.body.position);
   this.fireSystem.update(dt);this.stoveSystem.update(dt);this.fridgeSystem.update(dt);this.bathSystem.update(dt);
   this.updateDynamite(dt);this.updateSaboteur(dt);this.updateSprayFx(dt);
   this.interactSystem.update();this.queueSystem.update(dt);this.orderSystem.update(dt);this.sandwichBuilder.update(dt);
   this.ragdollFactory.update(dt);this.nestSystem.update(dt);this.catSystem.update(dt);this.flySystem.update(dt);this.puddleSystem.update(dt);this.ratSystem.update(dt);
   this.checkSlips(dt);this.checkBladder(dt);this.checkPolice(dt);this.checkInspection(dt);this.decayMeters(dt);this.daySystem.update(dt);
   this.clampFloaters(dt);
   this.crashGuard=0;
  }catch(err){this.crashGuard++;LOGGER.error('Кадр: '+err.message);if(this.crashGuard>5)this.toast('Внутренняя ошибка: '+err.message);}
  this.renderer.render(this.scene,this.camera);this.portrait.render();}
 start(){this.update();}}