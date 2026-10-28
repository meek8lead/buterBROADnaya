// ==== КОНФИГ: все данные игры ====
export const CONFIG={GRAVITY:-9.82,STEP:1/60,PLAYER_SPEED:5,PLAYER_ACCEL:12,PLAYER_JUMP:6,PLAYER_RADIUS:0.4,PLAYER_HEIGHT:1.6,EYE_HEIGHT:0.65,
 INTERACT_DISTANCE:3.5,SHOVE_RANGE:2.6,SWING_RANGE:2.0,CUT_RANGE:3.0,SPRAY_RANGE:2.6,DENSITY:60,MIN_MASS:0.6,MAX_MASS:8,GETUP_TIME:1.5,DAY_LENGTH:150,
 SINK_POS:{x:-6.6,y:1,z:1.2},STOVE_POS:{x:-4,y:1,z:1.2},ASSEMBLY_POS:{x:-1.2,y:1,z:1.2},CUT_POS:{x:1.6,y:1,z:1.2},GRINDER_POS:{x:-8.6,y:1,z:-4.5},
 KNIFE_SLOT:{x:3.1,y:1.5,z:1.2},HOOK_POS:{x:3,y:1.4,z:-7.05},GLASS_POS:{x:0,y:1.55,z:3},RADIO_POS:{x:-3.2,y:1.26,z:3},
 NEST_SPOTS:[{x:-6,z:-13},{x:6,z:-13},{x:-6,z:-9.2},{x:6,z:-9.2},{x:-8.4,z:-0.5},{x:5.6,z:-6},{x:-8,z:13},{x:5,z:13},{x:0,z:-12.5},{x:-3,z:-9.5}],
 ENTRY_DOOR:{x:3,z:15},EXIT_DOOR:{x:10,z:8},CRATE_POS:[{x:-5.8,z:-12.5},{x:5.8,z:-12.5},{x:5.8,z:-10}],
 SHELF_Y:1.0,SHELF_Z:-14,SHELF1_X0:-6.8,SHELF1_X1:-1.2,SHELF2_X0:-0.8,SHELF2_X1:4.6,
 HOLE_POS:{x:0,z:-11},COMPUTER_POS:{x:-8.6,z:-9},FRIDGE_POS:{x:-9,y:0,z:-2},
 BATH_DOOR_HINGE:{x:7.5,z:10},BATH_DOOR_W:1.0,TOILET_POS:{x:8.4,z:12.6},
 STORE_DOOR_HINGE:{x:-1.2,z:-7.6},STORE_DOOR_W:2.4,
 STORE_GATE:{x:0,z:-7.6},KITCHEN_GATE:{x:7.5,z:3.0},BATH_GATE:{x:8,z:10.2},
 LAMP_POS:[[0,3.85,9],[0,3.85,13],[-4,3.85,0],[2,3.85,0],[-3,3.85,-11],[3,3.85,-11],[8,3.85,12],[-6,3.85,-4]],
 DYNAMITE_FUSE:20,COUNTER_Z:3,
 WALLS:[{n:[1,0,0],p:-9.45,ax:'zy'},{n:[-1,0,0],p:9.45,ax:'zy'},{n:[0,0,1],p:-14.45,ax:'xy'},{n:[0,0,-1],p:14.45,ax:'xy'}],
 HIDESPOTS:[{x:-6.2,z:-13.8},{x:6.2,z:-13.8},{x:-6.2,z:-8.6},{x:6.2,z:-8.6},{x:-8.8,z:0},{x:8.8,z:-2},{x:-6,z:-5},{x:6,z:-5}],
 KITCHEN_SPOTS:[{x:-4,z:0},{x:0,z:0},{x:4,z:0},{x:-4,z:-3},{x:0,z:-3},{x:4,z:-3},{x:0,z:-6},{x:3,z:-6}],
 COLORS:{FLOOR:0x888888,WALL:0xaaaaaa,STORAGE:0x8B5A2B,KITCHEN:0x66aacc,HALL:0xcc8888,COUNTER:0xffcc00,CUT:0x9933cc,ASSEMBLY:0x33cc66}};

export const GAME_DATA={money:0,day:1,status:'Открыто',heldItem:null,bladder:0,shame:0,dirt:0,reputation:50,upgrades:{},stats:{served:0,angry:0,died:0,rats:0,earned:0},kingServed:0,patron:false,eggTaken:false,ach:[],life:{rats:0,served:0,wiped:0,fed:0,sprayed:0,crates:0},reviews:[],tutDone:false};

export const SAVEKEY='buterbrod_save_v1';
export function loadSave(){try{const s=localStorage.getItem(SAVEKEY);return s?JSON.parse(s):null;}catch(e){return null;}}
export function storeSave(){try{localStorage.setItem(SAVEKEY,JSON.stringify({money:GAME_DATA.money,day:GAME_DATA.day,rep:GAME_DATA.reputation,up:GAME_DATA.upgrades,egg:!!GAME_DATA.eggTaken,king:GAME_DATA.kingServed||0,patron:!!GAME_DATA.patron,ach:GAME_DATA.ach,life:GAME_DATA.life,rev:GAME_DATA.reviews.slice(-40),tut:!!GAME_DATA.tutDone}));}catch(e){}}
export function resetSave(){try{localStorage.removeItem(SAVEKEY);}catch(e){} location.reload();}

export const NAMES=['Витёк','Санёк','Михалыч','Зина','Толян','Гена','Клавдия','Боря','Нюша','Фёдор','Маринка','Степан','Оля','Жора','Тамара','Лёха'];
export const WILD_SAUCES=['sauce_fake','sauce_pee'];
export const VIEWMODEL_DEFS=['tool_crowbar','tool_knife','tool_mop','tool_spray'];
export const RAW_CUTLETS=['ing_cutlet_raw','cutlet_human_raw'];
export const CUTLET_WILD=['ing_cutlet_fried','cutlet_human_fried'];
export const PUDDLE_COLORS={sauce:0xf2ead8,tears:0x66ccff,pee:0xe6d44a,vomit:0x88cc44,oil:0xddbb33};
export const STICKY_KINDS=['ingredient','sauce','bread'];
export const CAT_FOOD=['dead_rat','fried_rat'];

export const CUTTABLE={bread_white:{out:'half_white',count:2},bread_black:{out:'half_black',count:2},bread_baton:{out:'half_baton',count:2},ing_sausage:{out:'slice_sausage',count:2},ing_onion:{out:'slice_onion',count:2,tears:true},ing_cucumber:{out:'slice_cucumber',count:2},ing_tomato:{out:'slice_tomato',count:2}};
export const RAT_FOOD=['ing_cheese','ing_sausage','ing_cucumber','ing_tomato','ing_egg','ing_onion','ing_cutlet_raw','slice_sausage','slice_cucumber','slice_tomato','slice_onion'];
export const PILE_DEFS=[['bread_white',3],['bread_black',3],['bread_baton',3],['ing_sausage',3],['ing_cheese',4],['ing_cucumber',3],['ing_tomato',3],['ing_cutlet_raw',3],['ing_egg',3],['ing_onion',3],['sauce_ketchup',2],['sauce_mayo',2],['sauce_mustard',2],['sauce_oil',2],['hazard_bleach',1],['hazard_rotten',1]];
export const CRATE_LOOT=['bread_white','bread_black','bread_baton','ing_sausage','ing_cheese','ing_cheese','ing_cucumber','ing_tomato','ing_cutlet_raw','ing_egg','ing_onion','sauce_ketchup','sauce_mayo','sauce_mustard','sauce_oil','hazard_rotten','empty_bottle','slice_sausage','slice_onion','toast','hazard_shard','tool_spray','dead_rat'];
export const COMBOS=[{need:['ing_cheese','ing_cheese'],bonus:20,name:'Двойной сыр'},{need:['fried_rat','ing_cheese'],bonus:30,name:'Королевский хруст'},{need:['dead_rat','ing_cheese'],bonus:25,name:'Крыса под шубой'},{need:['slice_sausage','slice_onion'],bonus:15,name:'Классика двора'},{need:['ing_cutlet_fried','sauce_ketchup'],bonus:15,name:'Котлета-классик'}];

export const ITEM_DEFS={
 bread_white:{id:'bread_white',kind:'bread',variant:'white',name:'Белый',color:0xf5f0dc,shape:'box',p:[0.5,0.18,0.5],whole:true,friedId:'toast'},
 bread_black:{id:'bread_black',kind:'bread',variant:'black',name:'Чёрный',color:0x4a2f1d,shape:'box',p:[0.5,0.18,0.5],whole:true,friedId:'toast'},
 bread_baton:{id:'bread_baton',kind:'bread',variant:'baton',name:'Батон',color:0xd9a44a,shape:'box',p:[0.7,0.18,0.35],whole:true,friedId:'toast'},
 half_white:{id:'half_white',kind:'bread',variant:'white',name:'Половинка белого',color:0xf5f0dc,shape:'box',p:[0.5,0.09,0.5],friedId:'toast'},
 half_black:{id:'half_black',kind:'bread',variant:'black',name:'Половинка чёрного',color:0x4a2f1d,shape:'box',p:[0.5,0.09,0.5],friedId:'toast'},
 half_baton:{id:'half_baton',kind:'bread',variant:'baton',name:'Половинка батона',color:0xd9a44a,shape:'box',p:[0.35,0.09,0.5],friedId:'toast'},
 toast:{id:'toast',kind:'ingredient',variant:'toast',name:'Тост',color:0xc08a3a,shape:'box',p:[0.45,0.08,0.45]},
 ing_sausage:{id:'ing_sausage',kind:'ingredient',variant:'sausage',name:'Колбаса',color:0xe07a7a,shape:'cyl',p:[0.16,0.5],whole:true},
 slice_sausage:{id:'slice_sausage',kind:'ingredient',variant:'sausage',name:'Ломтики колбасы',color:0xe88a8a,shape:'cyl',p:[0.16,0.12],friedId:'slice_sausage_fried'},
 slice_sausage_fried:{id:'slice_sausage_fried',kind:'ingredient',variant:'sausage',name:'Жареная колбаса',color:0xb05a3a,shape:'cyl',p:[0.16,0.12]},
 ing_cheese:{id:'ing_cheese',kind:'ingredient',variant:'cheese',name:'Сыр',color:0xffd24a,shape:'box',p:[0.45,0.08,0.45]},
 ing_cucumber:{id:'ing_cucumber',kind:'ingredient',variant:'cucumber',name:'Огурец',color:0x3fa03f,shape:'cyl',p:[0.09,0.5]},
 slice_cucumber:{id:'slice_cucumber',kind:'ingredient',variant:'cucumber',name:'Ломтики огурца',color:0x5fc05f,shape:'cyl',p:[0.09,0.06],friedId:'slice_cucumber_fried'},
 slice_cucumber_fried:{id:'slice_cucumber_fried',kind:'ingredient',variant:'cucumber',name:'Жареный огурец',color:0x7a8a2a,shape:'cyl',p:[0.09,0.06]},
 ing_tomato:{id:'ing_tomato',kind:'ingredient',variant:'tomato',name:'Помидор',color:0xd43a3a,shape:'sphere',p:[0.2]},
 slice_tomato:{id:'slice_tomato',kind:'ingredient',variant:'tomato',name:'Ломтики помидора',color:0xe05a4a,shape:'cyl',p:[0.18,0.06],friedId:'slice_tomato_fried'},
 slice_tomato_fried:{id:'slice_tomato_fried',kind:'ingredient',variant:'tomato',name:'Жареный помидор',color:0x9a3a22,shape:'cyl',p:[0.18,0.06]},
 ing_cutlet_raw:{id:'ing_cutlet_raw',kind:'ingredient',variant:'cutlet_raw',name:'Сырая котлета',color:0xd8a0a0,shape:'cyl',p:[0.22,0.14],raw:true,friedId:'ing_cutlet_fried',needsFlip:true},
 cutlet_human_raw:{id:'cutlet_human_raw',kind:'ingredient',variant:'cutlet_human',name:'Сырая котлета (не спрашивай)',color:0xc89898,shape:'cyl',p:[0.22,0.14],raw:true,friedId:'cutlet_human_fried',needsFlip:true},
 ing_cutlet_fried:{id:'ing_cutlet_fried',kind:'ingredient',variant:'cutlet',name:'Котлета жареная',color:0x8a5a2a,shape:'cyl',p:[0.22,0.14]},
 cutlet_human_fried:{id:'cutlet_human_fried',kind:'ingredient',variant:'cutlet_human',name:'Человеческая котлета',color:0x7a4a22,shape:'cyl',p:[0.22,0.14]},
 cutlet_burnt:{id:'cutlet_burnt',kind:'ingredient',variant:'cutlet_burnt',name:'Сгоревшая котлета',color:0x222222,shape:'cyl',p:[0.22,0.14]},
 burnt_food:{id:'burnt_food',kind:'ingredient',variant:'burnt',name:'Обугленный кусок',color:0x1a1a1a,shape:'cyl',p:[0.2,0.1]},
 ing_egg:{id:'ing_egg',kind:'ingredient',variant:'egg',name:'Яйцо',color:0xfff6e0,shape:'sphere',p:[0.16]},
 ing_onion:{id:'ing_onion',kind:'ingredient',variant:'onion',name:'Лук',color:0xd8c0e8,shape:'sphere',p:[0.18]},
 slice_onion:{id:'slice_onion',kind:'ingredient',variant:'onion',name:'Кольца лука',color:0xe8d8f0,shape:'cyl',p:[0.16,0.06],friedId:'slice_onion_fried'},
 slice_onion_fried:{id:'slice_onion_fried',kind:'ingredient',variant:'onion',name:'Жареный лук',color:0xb09a5a,shape:'cyl',p:[0.16,0.06]},
 dead_rat:{id:'dead_rat',kind:'ingredient',variant:'rat',name:'Труп крысы',color:0x6a5a4a,shape:'box',p:[0.3,0.08,0.2],friedId:'fried_rat'},
 fried_rat:{id:'fried_rat',kind:'ingredient',variant:'rat',name:'Жареная крыса',color:0x8a5a32,shape:'box',p:[0.3,0.08,0.2]},
 dead_roach:{id:'dead_roach',kind:'ingredient',variant:'roach',name:'Труп таракана',color:0x2a1a0a,shape:'box',p:[0.12,0.04,0.08]},
 sauce_ketchup:{id:'sauce_ketchup',kind:'sauce',variant:'ketchup',name:'Кетчуп',color:0xcc1111,shape:'cyl',p:[0.09,0.34],liquid:true},
 sauce_mayo:{id:'sauce_mayo',kind:'sauce',variant:'mayo',name:'Майонез',color:0xf2ead8,shape:'cyl',p:[0.09,0.34],liquid:true},
 sauce_mustard:{id:'sauce_mustard',kind:'sauce',variant:'mustard',name:'Горчица',color:0xd8b400,shape:'cyl',p:[0.09,0.34],liquid:true},
 sauce_oil:{id:'sauce_oil',kind:'sauce',variant:'oil',name:'Масло',color:0xddbb33,shape:'cyl',p:[0.09,0.34],liquid:true,oil:true},
 sauce_fake:{id:'sauce_fake',kind:'sauce',variant:'fake',name:'Домашний майонез',color:0xe8e0c0,shape:'cyl',p:[0.09,0.34],liquid:true,toxic:true},
 sauce_pee:{id:'sauce_pee',kind:'sauce',variant:'pee',name:'Жёлтая жидкость',color:0xe6d44a,shape:'cyl',p:[0.09,0.34],liquid:true,toxic:true},
 empty_bottle:{id:'empty_bottle',kind:'bottle',variant:'empty',name:'Пустая бутылка',color:0xbbbbbb,shape:'cyl',p:[0.11,0.4],breakable:true},
 hazard_bleach:{id:'hazard_bleach',kind:'hazard',variant:'bleach',name:'Отбеливатель',color:0xddeeff,shape:'cyl',p:[0.1,0.4]},
 hazard_rotten:{id:'hazard_rotten',kind:'hazard',variant:'rotten',name:'Протухший помидор',color:0x7a8a3a,shape:'sphere',p:[0.2]},
 hazard_shard:{id:'hazard_shard',kind:'hazard',variant:'shard',name:'Осколок',color:0xcceeff,shape:'box',p:[0.12,0.02,0.12]},
 hazard_dynamite:{id:'hazard_dynamite',kind:'hazard',variant:'dynamite',name:'Связка динамита',color:0xcc2222,shape:'box',p:[0.32,0.6,0.32]},
 tool_crowbar:{id:'tool_crowbar',kind:'tool',variant:'crowbar',name:'Лом',color:0xbb3322,shape:'box',p:[0.1,0.1,1.0]},
 tool_knife:{id:'tool_knife',kind:'tool',variant:'knife',name:'Нож',color:0xdddddd,shape:'box',p:[0.08,0.06,0.6]},
 tool_mop:{id:'tool_mop',kind:'tool',variant:'mop',name:'Швабра',color:0x997744,shape:'box',p:[0.06,1.3,0.06]},
 tool_spray:{id:'tool_spray',kind:'tool',variant:'spray',name:'Спрей',color:0x22dd55,shape:'cyl',p:[0.1,0.4]},
 tool_cigs:{id:'tool_cigs',kind:'tool',variant:'cigs',name:'Пачка сигарет',color:0xeeeeee,shape:'box',p:[0.12,0.06,0.22]},
 crown:{id:'crown',kind:'quest',variant:'crown',name:'Корона Короля',color:0xffcc00,shape:'box',p:[0.3,0.12,0.3]}};

export const PHRASES={greet:['Эээ, мне бутер!','Сделай бутерброд мечты!','Я голодный как пылесос!','Мне бутерброд!'],
 happy:['Офигенно!','Лови деньги!','Пять звёзд!','Проглотил с фольгой!'],
 angry:['Это ЧТО?! Не плачу!','Ты издеваешься?!','Ну и дичь!','Бабушка лучше собирает!','Я ЖДАЛ ЦЕЛУЮ ВЕЧНОСТЬ! Не плачу!'],
 dirty:['Фу! Помойся!','Ты в чём измазан?!','Брезгую!'],
 hit:['АЙ! ЗА ЧТО?!','МОЯ ГОЛОВА!','У МЕНЯ СЕМЬЯ!','Пишу жалобу!','СИНЯК ЖЕ БУДЕТ!'],
 oops:['ОЙ! БЕГУ!!','МАМА! НЕ ХОТЕЛ!','УВОЛЬНЯЮСЬ!'],
 policeTalk:['Так-так-так. И что это у вас за заведение?','Мне доложили: трупы, блевота, крысы... Объясняйтесь.','Ну-ну. И что мне с вами делать, а?','(Он смотрит на вас оценивающе...)'],
 police:['ПРОТОКОЛ! Трупы не декор!','Платите за кошмар!','Деньги гони!'],
 inspector:['Так, открывайте! Санитарная ИНСПЕКЦИЯ!','Хм... пахнет интересно...','Это пятно?! Или КРЫСА?!','Покажите мне туалет. НЕМЕДЛЕННО.'],
 wait:['Ну сколько можно?!','Повар! Ты уснул?','Желудок подаёт в суд!','Очередь это декор?','Я состарился!','Где бутер, Лебовски?!'],
 laugh:['АХАХА! Позорище!','Красиво разъехался!','Смехота!','Снял на мысленную камеру!'],
 fire:['ГОРИМ!!','ПОЖАР!','Огонь!','Причёска горит!'],
 smoke:['Фу! Курит на работе!','Сам бы покурил... не тут!','Дым! Не хочу умирать!'],
 cat:['МИЛЫЙ КОТИК!','Кис-кис!','О, котик-работник!','Тукседо! Красавчик!'],
 toilet:['Занято! Я думаю!','Не стучи! Я не один!','Ты че? Я кушаю!','У меня процесс!','Стучишь? А я пою!','Подожди, у меня тут драма!','ПДДДД... ой, не тебе!'],
 seeKing:['ЭТО КРЫСИНЫЙ КОРОЛЬ!!','Король крыс лично!','Пустите его первым!'],
 ratKingGreet:['Я КРЫСИНЫЙ КОРОЛЬ! Неси крыс и сыр!','Подданные ждут!','Король голоден!'],
 ratKingHappy:['По-королевски!','Мои крысы одобрят!','Ты мой любимый повар!'],
 ratKingAngry:['НЕ крыса?! Казнь!','Оскорбление короны!','Двор это не ест!'],
 missingTop:['А ВЕРХ ГДЕ?!','Бутер без крыши?! Не плачу!'],
 extraTop:['Зачем ВЕРХ?!','Два хлеба?! Я хлебоед?!'],
 ragdoll:['ООО Я ЛЕЧУ!','АТОМЫ РАЗЛЕТАЮТСЯ!','Вкууус... и всё.','Мама была права!'],
 pest:['ХРУСЬ... КРЫСА?! АААА!!','Я СЪЕЛ ТАРАКАНА?!','ЧТО-ТО ШЕВЕЛИЛОСЬ!!'],
 grinder:['Мясорубка: ЖЖЖ! СЫРАЯ котлета.','Мясорубка довольна. Жарь.'],
 sick:['Мне нехорошо...','УООО бунт...','Зачем я это съел...','ЧЕМ ПШИКНУЛ?! УООО...'],
 scared:['АААА! КРЫСА!','ТАРАКАН!!','МАМА!!!','ПОЖАР!!','ДЫМ!','КРЫСА НА НЁМ!!','ДИНАМИТ!!','СВЕТ ПРОПАЛ!!','ЧТО ЭТО ЗА ЗВУК ИЗ ТУАЛЕТА?!'],
 shameStorm:['ФУ! ПОЗОР!','СМОТРИТЕ, ОН ОПОЗОРИЛСЯ!','ЗВОНЮ В САНСЛУЖБУ!!']};

// ==== ШАБЛОНЫ ГЕНЕРАТИВНЫХ ОТЗЫВОВ ====
export const REVIEW_OPEN=['Заглянул в забегаловку «У Бори».','Зашёл перекусить в бутербродную у дома.','Посетил легендарную «У Бори».','Мне советовали эту точку. Зря советовали, но я пришёл.','Зашёл на бутер — остался на шоу.','Однажды мне сказали: «Хочешь приключений — иди к Боре».'];
export const REVIEW_FOOD_GOOD=['Бутерброд собрали с душой','Слои лежали ровно, как моя жизнь до этого дня','Хлеб был свежий (насколько это возможно тут)','Котлета хрустела правильно','Соус дали не жалея, но и не топя','Конструкция не развалилась в руках — уважение','Прожарка идеальная, аж слеза'];
export const REVIEW_FOOD_BAD=['Бутерброд развалился ещё в очереди','Хлеб был жёстче, чем характер моей бывшей','Слои лежали в случайном порядке, как мои долги','Соус лили из глаза, и глаз был плохой','Что-то хрустело. Это было не то, что должно хрустеть','Конструкция шаталась, как курс валют','Мне подали это с лицом человека, который сам это есть не будет'];
export const REVIEW_WAIT_OK=['Ждал адекватно, успел подумать о вечном.','Обслужили ни быстро и ни медленно, идеально нейтрально.','Очередь шла как надо, претензий по темпу нет.'];
export const REVIEW_WAIT_BAD=['Ждал так долго, что у меня выросла борода.','Пока ждал, прожил небольшую жизнь и оплатил ипотеку.','Повар двигался как интернет на даче.','Очередь стояла намертво, я состарился и принял это.','Терпение кончилось раньше, чем бутерброд.'];
export const REVIEW_INCIDENT_RAT=['По залу бегала крыса — атмосфера!','Я видел крысу. Крыса видела меня. Мы всё поняли.','Крыса стырила сыр прямо из-под носа. Профессионально.','Крыса тащила что-то в гнездо. У крысы цели, у меня нет.'];
export const REVIEW_INCIDENT_VOMIT=['Сосед по очереди внезапно перекрасился.','Санитарный дух ощущался физически.','Кого-то вырвало в зале. Классический понедельник.','Половина очереди дружно побелела. Редкое зрелище.'];
export const REVIEW_INCIDENT_FIRE=['Немножно горело. Добавило уюта.','Дым был частью рецепта, видимо.','Пожар тушили соусом. Инновация.','Горела плита, горели глаза повара. Эпично.'];
export const REVIEW_INCIDENT_DIRT=['Пол лип к обуви. Свежий клей?','Столы помнят всех посетителей. И я это видел.','Санитария не их конёк, зато искренность — да.','Грязь лежала слоями, как культурный пласт.'];
export const REVIEW_INCIDENT_CROWN=['ТАМ БЫЛ КРЫСИНЫЙ КОРОЛЬ И ЕМУ СБИЛИ КОРОНУ. Лучший день в моей жизни.','Я видел летящую корону. Я не платил за этот спектакль, но он окупил всё.','Король орал. Я орал. Орали все.','Корона валялась на полу, и это было самое красивое, что я видел.'];
export const REVIEW_INCIDENT_RADIO=['Радио орало так, что ноги танцевали сами.','Под хардбасс бутер зашёл на ура.','Радио шипело как бабушкин телевизор. Ностальгия.','Диджей радио явно работал на износ. Уважаю.'];
export const REVIEW_INCIDENT_CAT=['Кот в смокинге там работает. Сотрудник месяца.','Кот поймал крысу прямо во время заказа. Шоу!','Кот смотрел на меня осуждающе. Я извинился.','Тукседо мурчит как трактор, когда ему дают крысу. Мило.'];
export const REVIEW_GOOD_END=['Вернусь снова. Наверное.','Пять звёзд, одну снял за запах. Шучу. Четыре с половиной.','Рекомендую врагам и друзьям.','Теперь ем только тут. Мой желудок в терапии, но счастлив.','Боря, держись. Ты молодец, наверное.'];
export const REVIEW_BAD_END=['Не вернусь. Наверное. Может быть.','Одна звезда, и то из жалости.','Мой юрист свяжется с вами.','Требую моральную компенсацию и бутерброд.','Книга жалоб тряслась, когда я в неё писал.','Заведение закрыто для меня и для моей мечты.'];

export const ACHIEVEMENTS=[
 ['first_serve','Первая продажа','Обслужи первого клиента'],
 ['shift','Смена удалась','8 обслуженных за один день'],
 ['perfect_fry','Шеф-прожарка','Попади в зелёную зону мини-игры жарки'],
 ['combo_master','Комбо-мастер','3 комбо-бонуса за день'],
 ['rat_slayer','Крысолов','Размажь 10 крыс/тараканов'],
 ['king_patron','Королевский патрон','Крысиный Король стал твоим патроном'],
 ['sanitary','Санитарный идеал','Пройди инспекцию без штрафа'],
 ['pyro','Пироман','4 огня одновременно'],
 ['butcher','Мясник','Прокрути регдолла через мясорубку'],
 ['vandal','Вандализм','Разбей стекло выдачи'],
 ['survivor','Выживший','Переживи взрыв динамита рядом'],
 ['egg','Золотое яйцо','Найди пасхалку в холодильнике'],
 ['cat_friend','Котолюб','Покорми кота 5 раз'],
 ['rich','Тысяча','Накопи 1000₽'],
 ['day5','Почти неделя','Доживи до дня 5'],
 ['day10','Ветеран','Доживи до дня 10'],
 ['clean_freak','Чистюля','Вытри 10 луж'],
 ['iron_stomach','Железные желудки','Клиент отравился твоим бутером'],
 ['peaceful','День без трупов','Закончи день без смертей'],
 ['conscience','Стальная совесть','Закончи день с позором меньше 1'],
 ['persistent','Настойчивый','Достучись до занятого туалета 3 раза'],
 ['chemist','Химик','Доведи 5 клиентов до тошноты спреем'],
 ['head_rat','Крыса на голове','Поживи с крысой на голове'],
 ['bottle_master','Дроч-о-тротрон','Заверши мини-игру бутылки'],
 ['treasure','Кладоискатель','Вскрой 10 ящиков']];
export const ACH_MAP={};for(const a of ACHIEVEMENTS)ACH_MAP[a[0]]={name:a[1],desc:a[2]};

export const Utils={rand:(a,b)=>Math.random()*(b-a)+a,randInt:(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pick:a=>a[Math.floor(Math.random()*a.length)],clamp:(v,a,b)=>Math.min(Math.max(v,a),b),dist2:(x1,z1,x2,z2)=>{const dx=x2-x1,dz=z2-z1;return dx*dx+dz*dz;}};
export const defVolume=d=>d.shape==='box'?d.p[0]*d.p[1]*d.p[2]:(d.shape==='cyl'?Math.PI*d.p[0]*d.p[0]*d.p[1]:(4/3)*Math.PI*d.p[0]**3);
export const defMass=d=>Utils.clamp(defVolume(d)*CONFIG.DENSITY,CONFIG.MIN_MASS,CONFIG.MAX_MASS);
export const defHeight=d=>d.shape==='sphere'?d.p[0]*2:d.p[1];
export function regionOf(x,z){if(x>7.2&&z>10.2)return'bath';if(z<-8.1)return'store';if(z<=3.0)return'kitchen';return'hall';}
export function computeRoute(fx,fz,tx,tz){const a=regionOf(fx,fz),b=regionOf(tx,tz);if(a===b)return[];
 const line=['store','kitchen','hall','bath'];const gates={'store|kitchen':CONFIG.STORE_GATE,'kitchen|hall':CONFIG.KITCHEN_GATE,'hall|bath':CONFIG.BATH_GATE};
 const ia=line.indexOf(a),ib=line.indexOf(b);const step=ia<ib?1:-1;const out=[];let cur=ia;
 while(cur!==ib){const nx=cur+step;const key=line[Math.min(cur,nx)]+'|'+line[Math.max(cur,nx)];out.push(gates[key]);cur=nx;}return out;}
