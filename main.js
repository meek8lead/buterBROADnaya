// ==== MAIN: точка входа ====
import { NPCEntity } from './npcs.js';
import { CONFIG, GAME_DATA, Utils } from './config.js';
import { LOGGER, SOUND } from './media.js';
import { Game } from './game.js';

// глобальные перехватчики ошибок — до первого кадра
window.addEventListener('error',(e)=>{const el=document.getElementById('overlay-hint');if(el&&e.message){el.textContent='ОШИБКА: '+e.message+' (стр '+(e.lineno||'?')+')';el.style.color='#ff3333';}});
window.addEventListener('unhandledrejection',(e)=>{console.error('unhandled',e.reason);});

try{
 const game=new Game();
 // спавн служебных НПС (полиция/инспектор/саботёр) вешаем на game после создания,
 // чтобы не тащить NPCEntity в конструктор до инициализации
 game._spawnIntruder=(color,kind)=>{const n=new NPCEntity(game.scene,CONFIG.ENTRY_DOOR.x,16.5,color,0);n.game=game;n.intruder=true;n.speed=2.6;
  if(kind==='inspector'){n.inspector=true;n.addHat();n.setBubble('Так, открывайте! Санитарная ИНСПЕКЦИЯ!',6);n.setTargetRouted(game.player.body.position.x,game.player.body.position.z,'walk');game.queueSystem.intruders.push(n);}
  return n;};
 game.spawnInspector=function(){const n=this._spawnIntruder(0xf2f2f2,'inspector');this.toast('САНИТАРНАЯ ИНСПЕКЦИЯ на пороге!');SOUND.play('siren');return n;};
 game.checkPolice=function(dt){this.policeCd-=dt;if(this.policeCd>0)return;this.policeCd=12;
  if(this.queueSystem.intruders.some(c=>c.policeman))return;
  if(this.ragdollFactory.dolls.length>=3||GAME_DATA.reputation<20){this.policeCd=999;
   const n=new NPCEntity(this.scene,CONFIG.ENTRY_DOOR.x,16.5,0x1a1a66,0);n.game=this;n.policeman=true;n.intruder=true;n.speed=3.2;
   n.setBubble('СТОЯТЬ! Полиция! Ни с места!',6);
   this.queueSystem.intruders.push(n);this.toast('ПОЛИЦИЯ идёт к вам! Отвечай (E).');SOUND.play('siren');}};
 game._spawnSaboteur=function(){const n=new NPCEntity(this.scene,Utils.rand(2,4),16.5,0x222222,0);n.game=this;n.saboteur=true;n.intruder=true;n.speed=3;n.setTargetRouted(Utils.rand(-4,4),Utils.rand(-6,-2),'walk');this.queueSystem.intruders.push(n);};
 game._checkInspection=game.checkInspection;
 game.checkInspection=function(dt){if(this.inspectDone||!this.daySystem.active)return;
  if(!this.inspectWarned&&this.daySystem.t<CONFIG.DAY_LENGTH*0.62){this.inspectWarned=true;this.toast('Скоро ПРИДЁТ санитарная инспекция! Приберись и спрячь трупы!');SOUND.play('beep');}
  if(this.daySystem.t<CONFIG.DAY_LENGTH*0.55){this.inspectDone=true;if(Math.random()<0.8)this.spawnInspector();}};
 game.start();
 LOGGER.info('main: игра запущена');
}catch(err){console.error(err);
 const el=document.getElementById('overlay-hint');
 if(el){el.textContent='ОШИБКА СТАРТА: '+err.message+' [КЛИК = перезагрузка]';el.style.color='#ff3333';}
 const ov=document.getElementById('overlay');
 if(ov){ov.style.display='flex';ov.onclick=()=>location.reload();}}