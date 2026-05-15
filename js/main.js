import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, set, get, push, update, onValue, onDisconnect, serverTimestamp, remove }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

// ═══════════════════════════════════════════════════════════════
//  FIREBASE
// ═══════════════════════════════════════════════════════════════
const app = initializeApp({
  apiKey:            "AIzaSyAsn9ZFJP6QWFesfls9anBAJbAqcDMfnqg",
  authDomain:        "rpg-online-ad73f.firebaseapp.com",
  databaseURL:       "https://rpg-online-ad73f-default-rtdb.firebaseio.com",
  projectId:         "rpg-online-ad73f",
  storageBucket:     "rpg-online-ad73f.firebasestorage.app",
  messagingSenderId: "1031450807961",
  appId:             "1:1031450807961:web:369342194731ad0ae37208"
});
const db = getDatabase(app);

// ═══════════════════════════════════════════════════════════════
//  CLASSES
// ═══════════════════════════════════════════════════════════════
const CLASSES = {
  guerreiro: { nome:'Guerreiro', icon:'⚔️', avatar:'🤺', cor:'#8b4513', hp:120, sp:60,  atk:8,  def:5, desc:'Mestre do combate corpo a corpo',   stats:'HP Alto / SP Médio' },
  mago:      { nome:'Mago',      icon:'🔮', avatar:'🧙', cor:'#4a235a', hp:60,  sp:120, atk:3,  def:1, desc:'Conjurador de magias arcanas',       stats:'HP Baixo / SP Alto' },
  ladino:    { nome:'Ladino',    icon:'🗡️', avatar:'🥷', cor:'#1a2a1a', hp:80,  sp:80,  atk:6,  def:3, desc:'Especialista em furtividade',        stats:'HP Médio / SP Médio' },
  clerigo:   { nome:'Clérigo',   icon:'✨', avatar:'😇', cor:'#1a3a4a', hp:90,  sp:100, atk:4,  def:4, desc:'Curandeiro e protetor divino',       stats:'HP Médio / SP Alto' },
  barbaro:   { nome:'Bárbaro',   icon:'🪓', avatar:'😤', cor:'#5a1a1a', hp:150, sp:40,  atk:10, def:2, desc:'Guerreiro da fúria selvagem',        stats:'HP Muito Alto / SP Baixo' },
  arqueiro:  { nome:'Arqueiro',  icon:'🏹', avatar:'🧝', cor:'#1a3a1a', hp:85,  sp:70,  atk:7,  def:3, desc:'Atirador preciso à distância',       stats:'HP Médio / SP Médio' },
};

// ═══════════════════════════════════════════════════════════════
//  EQUIPAMENTOS INICIAIS POR CLASSE
// ═══════════════════════════════════════════════════════════════
const EQUIP_INICIAL = {
  guerreiro: [
    { id:'espada_longa',    nome:'Espada Longa',       slot:'arma',     icon:'🗡️', atk:5, def:0, hp:0,  sp:0,  desc:'Lâmina longa e bem balanceada',     equipado:true  },
    { id:'escudo_aco',      nome:'Escudo de Aço',      slot:'offhand',  icon:'🛡️', atk:0, def:4, hp:0,  sp:0,  desc:'Escudo robusto de aço temperado',   equipado:true  },
    { id:'armad_placas',    nome:'Armadura de Placas', slot:'armadura', icon:'🔰', atk:0, def:6, hp:0,  sp:0,  desc:'Proteção máxima em batalha',         equipado:true  },
    { id:'elmo_ferro',      nome:'Elmo de Ferro',      slot:'elmo',     icon:'⛑️', atk:0, def:2, hp:5,  sp:0,  desc:'Elmo resistente que protege a cabeça',equipado:true  },
  ],
  mago: [
    { id:'cajado_arcano',   nome:'Cajado Arcano',      slot:'arma',     icon:'🪄', atk:2, def:0, hp:0,  sp:15, desc:'Amplifica o poder mágico',           equipado:true  },
    { id:'grimorio',        nome:'Grimório Ancestral', slot:'offhand',  icon:'📖', atk:0, def:0, hp:0,  sp:25, desc:'Livro de feitiços de gerações',      equipado:true  },
    { id:'robe_magico',     nome:'Robe Mágico',        slot:'armadura', icon:'🥋', atk:0, def:1, hp:0,  sp:10, desc:'Robe imbuído de proteção arcana',    equipado:true  },
    { id:'anel_poder',      nome:'Anel do Poder',      slot:'anel',     icon:'💍', atk:1, def:0, hp:0,  sp:10, desc:'Amplifica a magia do usuário',       equipado:true  },
  ],
  ladino: [
    { id:'adaga_principal', nome:'Adaga Afiada',       slot:'arma',     icon:'🗡️', atk:4, def:0, hp:0,  sp:0,  desc:'Lâmina rápida e precisamente afiada',equipado:true  },
    { id:'adaga_second',    nome:'Adaga Secundária',   slot:'offhand',  icon:'🔪', atk:2, def:0, hp:0,  sp:0,  desc:'Segunda lâmina para ataques duplos', equipado:true  },
    { id:'armad_couro',     nome:'Armadura de Couro',  slot:'armadura', icon:'🥋', atk:0, def:3, hp:0,  sp:0,  desc:'Proteção leve para máxima mobilidade',equipado:true  },
    { id:'botas_furtivas',  nome:'Botas Furtivas',     slot:'bota',     icon:'👢', atk:0, def:1, hp:0,  sp:5,  desc:'Botas silenciosas para furtividade', equipado:true  },
  ],
  clerigo: [
    { id:'maca_sagrada',    nome:'Maça Sagrada',       slot:'arma',     icon:'🔨', atk:3, def:0, hp:0,  sp:0,  desc:'Arma abençoada pelos deuses',        equipado:true  },
    { id:'simbolo_sagrado', nome:'Símbolo Sagrado',    slot:'offhand',  icon:'✝️', atk:0, def:2, hp:0,  sp:20, desc:'Foco divino para canalizações',      equipado:true  },
    { id:'cota_malha',      nome:'Cota de Malha',      slot:'armadura', icon:'🔰', atk:0, def:5, hp:0,  sp:0,  desc:'Armadura equilibrada e confortável', equipado:true  },
    { id:'capuz_sagrado',   nome:'Capuz Sagrado',      slot:'elmo',     icon:'👑', atk:0, def:1, hp:5,  sp:5,  desc:'Capuz bento pelos deuses',           equipado:true  },
  ],
  barbaro: [
    { id:'machado_guerra',  nome:'Machado de Guerra',  slot:'arma',     icon:'🪓', atk:7, def:0, hp:0,  sp:0,  desc:'Machado pesado e devastador',        equipado:true  },
    { id:'pele_animal',     nome:'Pele de Animal',     slot:'armadura', icon:'🥋', atk:0, def:2, hp:10, sp:0,  desc:'Armadura primitiva mas eficaz',      equipado:true  },
    { id:'colar_dentes',    nome:'Colar de Dentes',    slot:'anel',     icon:'🦷', atk:1, def:0, hp:5,  sp:0,  desc:'Troféu de batalhas passadas',        equipado:true  },
    { id:'manoplas_ferro',  nome:'Manoplas de Ferro',  slot:'offhand',  icon:'🤜', atk:2, def:1, hp:0,  sp:0,  desc:'Reforça os golpes corpo a corpo',    equipado:true  },
  ],
  arqueiro: [
    { id:'arco_longo',      nome:'Arco Longo',         slot:'arma',     icon:'🏹', atk:5, def:0, hp:0,  sp:0,  desc:'Arco preciso de longo alcance',      equipado:true  },
    { id:'aljava_ref',      nome:'Aljava Reforçada',   slot:'offhand',  icon:'🪃', atk:1, def:0, hp:0,  sp:0,  desc:'Aljava com flechas especiais',       equipado:true  },
    { id:'armad_couro_arq', nome:'Armadura de Couro',  slot:'armadura', icon:'🥋', atk:0, def:3, hp:0,  sp:0,  desc:'Proteção leve para máxima mobilidade',equipado:true  },
    { id:'botas_velozes',   nome:'Botas Velozes',      slot:'bota',     icon:'👟', atk:0, def:1, hp:0,  sp:5,  desc:'Botas que aumentam agilidade',       equipado:true  },
  ],
};

const SLOTS_INFO = [
  { key:'arma',     label:'ARMA',      icon:'⚔️' },
  { key:'offhand',  label:'MÃO LIVRE', icon:'🛡️' },
  { key:'armadura', label:'ARMADURA',  icon:'🔰' },
  { key:'elmo',     label:'ELMO',      icon:'⛑️' },
  { key:'anel',     label:'ANEL',      icon:'💍' },
  { key:'bota',     label:'BOTAS',     icon:'👢' },
];

function buildInventarioInicial(classe) {
  const items = EQUIP_INICIAL[classe] || [];
  const inv = {};
  items.forEach(item => {
    inv[item.id] = { nome:item.nome, slot:item.slot, icon:item.icon, atk:item.atk, def:item.def, hp:item.hp, sp:item.sp, desc:item.desc, equipado:item.equipado };
  });
  return inv;
}

function calcularCombate(eu) {
  const cls = CLASSES[eu.classe] || {};
  let atk = cls.atk || 0;
  let def = cls.def || 0;
  const inv = eu.inventario || {};
  Object.values(inv).forEach(item => {
    if(item.equipado) { atk += (item.atk||0); def += (item.def||0); }
  });
  return { atk, def };
}

// ═══════════════════════════════════════════════════════════════
//  DADOS — MODIFICADORES POR CLASSE E TIPO DE AÇÃO
// ═══════════════════════════════════════════════════════════════
const MODS = {
  guerreiro: { atacar:5, defender:3, falar:0,  mover:1, skill:4, livre:2 },
  mago:      { atacar:2, defender:0, falar:1,  mover:0, skill:6, livre:3 },
  ladino:    { atacar:4, defender:2, falar:2,  mover:4, skill:5, livre:3 },
  clerigo:   { atacar:2, defender:3, falar:2,  mover:1, skill:5, livre:2 },
  barbaro:   { atacar:6, defender:2, falar:-1, mover:2, skill:3, livre:3 },
  arqueiro:  { atacar:5, defender:2, falar:1,  mover:3, skill:4, livre:3 },
};
const DC = { atacar:12, skill:13, defender:10, falar:11, mover:10, livre:11 };
const LABEL_TIPO = { atacar:'Ataque', skill:'Habilidade', defender:'Defesa', falar:'Persuasão', mover:'Agilidade', livre:'Teste' };

function rolarInimigos(inimigos, jogadores) {
  const jogVivos = Object.values(jogadores).filter(j => j.vivo && j.consciente);
  if(jogVivos.length === 0) return [];
  return Object.values(inimigos)
    .filter(i => i.visivel !== false && i.hp > 0)
    .map(ini => {
      const alvo = jogVivos[Math.floor(Math.random() * jogVivos.length)];
      const mod  = Math.max(1, Math.floor((ini.maxHp||20) / 15));
      const dado = Math.floor(Math.random() * 20) + 1;
      const total = dado + mod;
      const dc    = 12;
      const critico = dado === 20;
      const falha   = dado === 1;
      const sucesso = critico || (!falha && total >= dc);
      return { nome: ini.nome, icon: ini.icon||'👿', alvo: alvo.nome, dado, mod, total, dc, sucesso, critico, falha };
    });
}

function detectarTipoAcao(acao) {
  if(!acao) return 'livre';
  const a = acao.toLowerCase();
  if(a.includes('falar')   || a.includes('💬')) return 'falar';
  if(a.includes('atacar')  || a.includes('⚔'))  return 'atacar';
  if(a.includes('skill')   || a.includes('✨'))  return 'skill';
  if(a.includes('defender')|| a.includes('🛡'))  return 'defender';
  if(a.includes('mover')   || a.includes('🏃'))  return 'mover';
  return 'livre';
}

function rolarAcao(nome, classe, acao, bonus) {
  const tipo  = detectarTipoAcao(acao);
  const mod   = (MODS[classe] || {})[tipo] ?? 0;
  const dc    = DC[tipo] || 11;
  const dado  = Math.floor(Math.random() * 20) + 1;
  const total = dado + mod;
  const critico = dado === 20;
  const falha   = dado === 1;
  const sucesso = critico || (!falha && total >= dc);
  return { nome, classe, acao, tipo, dado, mod, total, dc, sucesso, critico, falha, bonus: !!bonus };
}

function rolarRodada(jogadores) {
  const rolls = [];
  Object.values(jogadores).forEach(j => {
    if(!j.vivo || !j.consciente) return;
    if(j.acao1 && j.acao1 !== '(nenhuma)') rolls.push(rolarAcao(j.nome, j.classe, j.acao1, false));
    if(j.acao2 && j.acao2 !== '(sem segunda ação)' && j.acao2 !== '(nenhuma)')
      rolls.push(rolarAcao(j.nome, j.classe, j.acao2, true));
  });
  return rolls;
}

// ═══════════════════════════════════════════════════════════════
//  ESTADO LOCAL
// ═══════════════════════════════════════════════════════════════
let myUid    = localStorage.getItem('rpg_uid')    || crypto.randomUUID();
let mySala   = localStorage.getItem('rpg_sala')   || null;
let myNome   = localStorage.getItem('rpg_nome')   || '';
let myClasse = localStorage.getItem('rpg_classe') || 'guerreiro';
let mySexo   = localStorage.getItem('rpg_sexo')   || 'm';
let amIHost  = false;
let chamandoIA = false;
let renderedHistKeys = new Set();
let unsubSala = null;

localStorage.setItem('rpg_uid', myUid);

// ═══════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-char-creation') { ccBuildGrid(); ccGoStep(1); }
  if (id === 'screen-sala') { updateEntryCharCard(); verificarUltimaSala(); }
}
window.showScreen = showScreen;

function spriteUrl(classe, sexo) {
  return `sprites/${classe}_${sexo || 'm'}.png`;
}

// ═══════════════════════════════════════════════════════════════
//  CRIAÇÃO DE PERSONAGEM — WIZARD
// ═══════════════════════════════════════════════════════════════
let ccClasse = myClasse;
let ccSexo   = mySexo;

function ccBuildGrid() {
  const grid = document.getElementById('cc-class-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(CLASSES).forEach(([key, cls]) => {
    const card = document.createElement('div');
    card.className = 'cc-class-card' + (key === ccClasse ? ' selected' : '');
    card.innerHTML = `
      <img src="${spriteUrl(key,'m')}" alt="${cls.nome}">
      <div class="cn">${cls.nome.toUpperCase()}</div>
      <div class="cs">HP ${cls.hp} / SP ${cls.sp}</div>`;
    card.onclick = () => {
      document.querySelectorAll('.cc-class-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      ccClasse = key;
    };
    grid.appendChild(card);
  });
}

function ccUpdateProgress(step) {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('cc-dot-' + i);
    dot.classList.toggle('done', i < step);
    dot.classList.toggle('active', i === step);
    if (i < 4) {
      const line = document.getElementById('cc-line-' + i);
      line.classList.toggle('done', i < step);
    }
  }
}

function ccGoStep(step) {
  document.querySelectorAll('.cc-step').forEach(s => s.classList.remove('active'));
  document.getElementById('cc-step' + step).classList.add('active');
  ccUpdateProgress(step);
  const sp = spriteUrl(ccClasse, ccSexo);
  ['2','3','4'].forEach(n => {
    const img = document.getElementById('cc-sprite' + n);
    if (img) img.src = sp;
  });
}

window.ccSetSexo = function(sexo) {
  ccSexo = sexo;
  document.getElementById('cc-btn-m').classList.toggle('active', sexo === 'm');
  document.getElementById('cc-btn-f').classList.toggle('active', sexo === 'f');
  document.getElementById('cc-sprite2').src = spriteUrl(ccClasse, sexo);
};

window.ccNext = function(fromStep) {
  if (fromStep === 3) {
    const nome = document.getElementById('cc-nome').value.trim();
    if (!nome) { toast('Digite o nome do seu herói!'); return; }
    // Update confirm panel
    const cls = CLASSES[ccClasse] || {};
    document.getElementById('cc-sprite4').src = spriteUrl(ccClasse, ccSexo);
    document.getElementById('cc-conf-nome').textContent = nome;
    document.getElementById('cc-conf-classe').textContent = cls.nome?.toUpperCase() + ' ' + (cls.icon || '');
    document.getElementById('cc-conf-sexo').textContent = ccSexo === 'm' ? '♂ MASCULINO' : '♀ FEMININO';
    document.getElementById('cc-conf-stats').textContent = `ATK ${cls.atk}  DEF ${cls.def}  HP ${cls.hp}  SP ${cls.sp}`;
  }
  ccGoStep(fromStep + 1);
};

window.ccBack = function(fromStep) {
  ccGoStep(fromStep - 1);
};

window.ccConfirmar = async function() {
  const nome = document.getElementById('cc-nome').value.trim();
  if (!nome) { toast('Nome inválido!'); return; }
  myNome   = nome;
  myClasse = ccClasse;
  mySexo   = ccSexo;
  const cls = CLASSES[myClasse] || {};
  localStorage.setItem('rpg_nome',   myNome);
  localStorage.setItem('rpg_classe', myClasse);
  localStorage.setItem('rpg_sexo',   mySexo);
  localStorage.removeItem('rpg_sala'); // new character = fresh start
  // Save to Firebase
  await salvarPersonagemFirebase({
    nome: myNome, classe: myClasse, sexo: mySexo,
    nivel: 1, xp: 0,
    atk: cls.atk||0, def: cls.def||0,
    hp: cls.hp||100, maxHp: cls.hp||100,
    sp: cls.sp||60,  maxSp: cls.sp||60,
    historia: [], fama: 0, criadoEm: Date.now()
  });
  updateEntryCharCard();
  document.getElementById('sala-opt-continuar').style.display = 'none';
  showScreen('screen-sala');
};

function updateEntryCharCard() {
  const el = document.getElementById('entry-char-card');
  if (!el || !myNome) return;
  const cls = CLASSES[myClasse] || {};
  document.getElementById('entry-char-sprite').src = spriteUrl(myClasse, mySexo);
  document.getElementById('entry-char-nome').textContent = myNome;
  document.getElementById('entry-char-cls').textContent = (cls.icon || '') + ' ' + (cls.nome || '').toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
//  CHARACTER — FIREBASE PERSISTENCE
// ═══════════════════════════════════════════════════════════════
async function carregarPersonagemFirebase() {
  try {
    const snap = await get(ref(db, `personagens/${myUid}`));
    if (snap.exists()) return snap.val();
  } catch(e) {}
  return null;
}

async function salvarPersonagemFirebase(dados) {
  try {
    await set(ref(db, `personagens/${myUid}`), { ...dados, uid: myUid, atualizadoEm: Date.now() });
  } catch(e) {}
}

function populateWelcomeCard(char) {
  const cls = CLASSES[char.classe] || {};
  document.getElementById('wlc-sprite').src  = spriteUrl(char.classe, char.sexo);
  document.getElementById('wlc-nome').textContent    = char.nome;
  document.getElementById('wlc-btn-nome').textContent = char.nome;
  document.getElementById('wlc-classe').textContent  = (cls.icon||'') + ' ' + (cls.nome||'').toUpperCase() + (char.sexo==='f'?' · ♀':' · ♂');
  const nivel = char.nivel || 1;
  const xp    = char.xp    || 0;
  document.getElementById('wlc-stats').textContent  = `Nível ${nivel}  ·  ${xp} XP  ·  ATK ${char.atk||cls.atk}  DEF ${char.def||cls.def}`;
}

window.usarPersonagemSalvo = function() {
  updateEntryCharCard();
  verificarUltimaSala();
  showScreen('screen-sala');
};

window.apagarPersonagem = async function() {
  const nome = myNome || 'este personagem';
  if (!confirm(`Apagar "${nome}" permanentemente? Esta ação não pode ser desfeita.`)) return;
  try { await remove(ref(db, `personagens/${myUid}`)); } catch(e) {}
  myNome = ''; myClasse = 'guerreiro'; mySexo = 'm';
  ['rpg_nome','rpg_classe','rpg_sexo','rpg_sala','rpg_nivel','rpg_xp'].forEach(k => localStorage.removeItem(k));
  document.getElementById('wlc-saved').style.display = 'none';
  document.getElementById('btn-apagar-personagem').style.display = 'none';
  toast('Personagem apagado.');
  showScreen('screen-welcome');
  document.getElementById('wlc-loading').style.display = 'none';
  document.getElementById('wlc-options').style.display = 'flex';
};

async function verificarUltimaSala() {
  const ultimaSala = localStorage.getItem('rpg_sala');
  const el = document.getElementById('sala-opt-continuar');
  if (!ultimaSala) { el.style.display='none'; return; }
  try {
    const snap = await get(ref(db, `salas/${ultimaSala}/config`));
    if (snap.exists() && snap.val().estado !== 'encerrada') {
      document.getElementById('sala-ultima-code').textContent = ultimaSala;
      el.style.display = 'flex';
      return;
    }
  } catch(e) {}
  localStorage.removeItem('rpg_sala');
  el.style.display = 'none';
}

window.continuarPartida = async function() {
  const codigo = localStorage.getItem('rpg_sala');
  if (!codigo) return;
  const snap = await get(ref(db, `salas/${codigo}`));
  if (!snap.exists()) { toast('Sala não encontrada'); localStorage.removeItem('rpg_sala'); return; }
  const data = snap.val();
  mySala = codigo;
  // Re-register player in case they disconnected
  const cls = CLASSES[myClasse];
  const existente = data.jogadores?.[myUid];
  if (!existente) {
    await set(ref(db, `salas/${codigo}/jogadores/${myUid}`), {
      nome: myNome, classe: myClasse, sexo: mySexo,
      hp: cls.hp, maxHp: cls.hp, sp: cls.sp, maxSp: cls.sp,
      exp: 0, ativo: true, vivo: true, consciente: true,
      acao1: null, acao2: null,
      inventario: buildInventarioInicial(myClasse), joinedAt: Date.now()
    });
  } else {
    await update(ref(db, `salas/${codigo}/jogadores/${myUid}`), { ativo: true });
  }
  onDisconnect(ref(db, `salas/${codigo}/jogadores/${myUid}/ativo`)).set(false);
  if (data.config.estado === 'lobby') irParaLobby(codigo);
  else irParaJogo(codigo);
};

// On startup: always show welcome, then check Firebase
(async function initStartScreen() {
  showScreen('screen-welcome');
  const char = await carregarPersonagemFirebase();
  // Also check localStorage fallback
  const localChar = (myNome && myClasse) ? { nome:myNome, classe:myClasse, sexo:mySexo,
    nivel: parseInt(localStorage.getItem('rpg_nivel')||'1'),
    xp: parseInt(localStorage.getItem('rpg_xp')||'0'),
    atk: CLASSES[myClasse]?.atk, def: CLASSES[myClasse]?.def } : null;
  const saved = char || localChar;
  if (saved) {
    // Sync to memory
    myNome   = saved.nome;   myClasse = saved.classe; mySexo = saved.sexo || 'm';
    localStorage.setItem('rpg_nome', myNome);
    localStorage.setItem('rpg_classe', myClasse);
    localStorage.setItem('rpg_sexo', mySexo);
    populateWelcomeCard(saved);
    document.getElementById('wlc-saved').style.display = 'flex';
    document.getElementById('btn-apagar-personagem').style.display = 'block';
  }
  document.getElementById('wlc-loading').style.display  = 'none';
  document.getElementById('wlc-options').style.display  = 'flex';
  ccBuildGrid();
})();

function toast(msg, dur=3500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display='none', dur);
}

// ═══════════════════════════════════════════════════════════════
//  VOZ — GROQ TTS
// ═══════════════════════════════════════════════════════════════
function updateVoiceBtn() {
  const btn = document.getElementById('voice-btn');
  if (!btn) return;
  const icon = btn.querySelector('.vb-icon');
  if (icon) icon.textContent = voiceEnabled ? '🔊' : '🔇';
  btn.classList.toggle('active', voiceEnabled);
  btn.title = voiceEnabled ? 'Desativar narração' : 'Ativar narração';
}

window.toggleVoz = function() {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('rpg_voice', voiceEnabled ? '1' : '0');
  updateVoiceBtn();
  if (!voiceEnabled) {
    voiceQueue = [];
    voiceBusy = false;
    setVoiceIndicator(false);
    if (_currentAudio) { _currentAudio.pause(); URL.revokeObjectURL(_currentAudio._url||''); _currentAudio = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  toast(voiceEnabled ? '🔊 Narração ativada' : '🔇 Narração desativada', 2000);
};

let voiceQueue = [];
let voiceBusy = false;

function setVoiceIndicator(on) {
  const el = document.getElementById('voice-indicator');
  if (el) el.className = on ? 'speaking' : '';
}

function _narrarWebSpeechQueued(limpo) {
  if (!window.speechSynthesis) { voiceBusy = false; setVoiceIndicator(false); _nextUtterance(); return; }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(limpo);
  const voices = speechSynthesis.getVoices();
  const voz = voices.find(v => v.lang.startsWith('pt')) || voices.find(v => v.lang.startsWith('es')) || null;
  if (voz) utt.voice = voz;
  utt.rate = 1.2; utt.pitch = 0.82;
  utt.onend = () => _nextUtterance();
  utt.onerror = () => _nextUtterance();
  speechSynthesis.speak(utt);
}

function _nextUtterance() {
  if (voiceQueue.length === 0) { voiceBusy = false; setVoiceIndicator(false); return; }
  voiceBusy = true;
  setVoiceIndicator(true);
  const texto = voiceQueue.shift();
  const limpo = texto.replace(/<[^>]+>/g,'').replace(/[*#_`~]/g,'').replace(/\s+/g,' ').trim().substring(0, 800);
  if (!limpo) { _nextUtterance(); return; }

  const apiKey = getApiKey();
  if (!apiKey) { _narrarWebSpeechQueued(limpo); return; }

  fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
    body: JSON.stringify({ model:'playai-tts', input: limpo, voice:'Fritz-PlayAI', response_format:'mp3', speed: 1.3 })
  }).then(async res => {
    if (!res.ok) { _narrarWebSpeechQueued(limpo); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio._url = url;
    _currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); _currentAudio = null; _nextUtterance(); };
    audio.onerror = () => { _nextUtterance(); };
    const p = audio.play();
    if (p) p.catch(() => { _narrarWebSpeechQueued(limpo); });
  }).catch(() => { _narrarWebSpeechQueued(limpo); });
}

function narrarTexto(texto) {
  if (!voiceEnabled) return;
  // Clear queue and cancel current
  voiceQueue = [];
  if (_currentAudio) { _currentAudio.pause(); URL.revokeObjectURL(_currentAudio._url||''); _currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  voiceBusy = false;
  voiceQueue.push(texto);
  _nextUtterance();
}

function getApiKey() { return localStorage.getItem('rpg_groq_key') || ''; }

function codigoAleatorio() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:4}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

window.copiarCodigo = function() {
  if(!mySala) return;
  navigator.clipboard?.writeText(mySala).then(() => toast(`Código "${mySala}" copiado!`));
};

window.sairDaSala = async function() {
  if(!confirm('Sair da sala e voltar ao início?')) return;
  if(unsubSala) { unsubSala(); unsubSala = null; }
  if(mySala && myUid) {
    try { await update(ref(db, `salas/${mySala}/jogadores/${myUid}`), { ativo: false }); } catch {}
  }
  mySala = null;
  _mortoMostrado = false;
  document.getElementById('modal-morto').classList.remove('open');
  localStorage.removeItem('rpg_sala');
  renderedHistKeys = new Set();
  updateEntryCharCard();
  showScreen('screen-sala');
};

// ═══════════════════════════════════════════════════════════════
//  ABAS ENTRADA
// ═══════════════════════════════════════════════════════════════
window.setTab = function(tab) { /* deprecated — sala screen uses direct buttons */ };

// ═══════════════════════════════════════════════════════════════
//  BUILD CLASSE GRID
// ═══════════════════════════════════════════════════════════════
function buildClasseGrid() {
  const grid = document.getElementById('classe-grid');
  if(!grid) return;
  grid.innerHTML = '';
  Object.entries(CLASSES).forEach(([key, cls]) => {
    const div = document.createElement('div');
    div.className = 'classe-card' + (key === myClasse ? ' selected' : '');
    div.dataset.classe = key;
    div.innerHTML = `<span class="ci">${cls.icon}</span><div class="cn">${cls.nome}</div><div class="cd">${cls.desc}</div><div class="cs">${cls.stats}</div>`;
    div.onclick = () => {
      document.querySelectorAll('.classe-card').forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
      myClasse = key;
    };
    grid.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════
//  API KEY MODAL
// ═══════════════════════════════════════════════════════════════
let keyCallback = null;
function pedirApiKey(cb) {
  keyCallback = cb;
  document.getElementById('modal-key').classList.add('open');
}
window.salvarKey = function() {
  const v = document.getElementById('inp-key').value.trim();
  if(!v) { toast('Cole a chave antes de salvar'); return; }
  localStorage.setItem('rpg_groq_key', v);
  document.getElementById('modal-key').classList.remove('open');
  if(keyCallback) { keyCallback(); keyCallback=null; }
};

// ═══════════════════════════════════════════════════════════════
//  CRIAR SALA
// ═══════════════════════════════════════════════════════════════
window.criarSala = async function() {
  if(!myNome) { toast('Crie seu personagem primeiro!'); showScreen('screen-char-creation'); return; }

  const codigo = codigoAleatorio();
  mySala = codigo;
  localStorage.setItem('rpg_sala', codigo);

  const cls = CLASSES[myClasse];
  await set(ref(db, `salas/${codigo}`), {
    config: { host: myUid, estado: 'lobby', rodada: 0, criadoEm: serverTimestamp() },
    jogadores: {
      [myUid]: {
        nome: myNome, classe: myClasse, sexo: mySexo,
        hp: cls.hp, maxHp: cls.hp,
        sp: cls.sp, maxSp: cls.sp,
        exp: 0, ativo: true, vivo: true, consciente: true,
        acao1: null, acao2: null,
        inventario: buildInventarioInicial(myClasse),
        joinedAt: serverTimestamp()
      }
    }
  });

  onDisconnect(ref(db, `salas/${codigo}/jogadores/${myUid}/ativo`)).set(false);
  irParaLobby(codigo);
};

// ═══════════════════════════════════════════════════════════════
//  ENTRAR EM SALA
// ═══════════════════════════════════════════════════════════════
window.entrarSala = async function() {
  if(!myNome) { toast('Crie seu personagem primeiro!'); showScreen('screen-char-creation'); return; }
  const codigo = document.getElementById('inp-codigo').value.trim().toUpperCase();
  if(codigo.length !== 4) { toast('O código tem 4 letras'); return; }

  const snap = await get(ref(db, `salas/${codigo}`));
  if(!snap.exists())       { toast('Sala não encontrada!'); return; }

  const salaData = snap.val();
  if(salaData.config.estado !== 'lobby') { toast('Esta partida já começou!'); return; }

  mySala = codigo;
  localStorage.setItem('rpg_sala', codigo);

  const cls = CLASSES[myClasse];
  await set(ref(db, `salas/${codigo}/jogadores/${myUid}`), {
    nome: myNome, classe: myClasse, sexo: mySexo,
    hp: cls.hp, maxHp: cls.hp,
    sp: cls.sp, maxSp: cls.sp,
    exp: 0, ativo: true, vivo: true, consciente: true,
    acao1: null, acao2: null,
    inventario: buildInventarioInicial(myClasse),
    joinedAt: serverTimestamp()
  });

  onDisconnect(ref(db, `salas/${codigo}/jogadores/${myUid}/ativo`)).set(false);
  irParaLobby(codigo);
};

// ═══════════════════════════════════════════════════════════════
//  LOBBY
// ═══════════════════════════════════════════════════════════════
function irParaLobby(codigo) {
  showScreen('screen-lobby');
  document.getElementById('lobby-code').textContent = codigo;

  if(unsubSala) unsubSala();
  unsubSala = onValue(ref(db, `salas/${codigo}`), snap => {
    if(!snap.exists()) return;
    const data = snap.val();
    const jogadores = data.jogadores || {};
    const host = data.config.host;
    amIHost = (myUid === host);

    // Lista de jogadores
    const lista = document.getElementById('lista-jogadores');
    lista.innerHTML = '';
    Object.entries(jogadores).forEach(([uid, j]) => {
      const cls = CLASSES[j.classe] || {};
      const online = j.ativo !== false;
      const div = document.createElement('div');
      div.className = 'player-row';
      div.innerHTML = `
        <div class="online-dot ${online?'on':''}"></div>
        <div class="player-avatar" style="overflow:hidden;padding:0">
          <img src="sprites/${j.classe||'guerreiro'}_${j.sexo||'m'}.png"
            style="width:100%;height:100%;object-fit:contain;object-position:bottom"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          ><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center">${cls.icon||'?'}</span>
        </div>
        <div class="player-info">
          <div class="player-nome">${j.nome}</div>
          <div class="player-classe">${cls.nome||j.classe} · ${online?'<span style="color:var(--green)">online</span>':'<span style="color:#555">ausente</span>'}</div>
        </div>
        ${uid===host ? '<span class="badge badge-host">Anfitrião</span>' : ''}
        ${uid===myUid ? '<span class="badge badge-you">você</span>' : ''}
      `;
      lista.appendChild(div);
    });

    document.getElementById('btn-iniciar').style.display    = amIHost ? 'block' : 'none';
    document.getElementById('lobby-status').style.display   = amIHost ? 'none'  : 'block';

    // Jogo iniciou
    if(data.config.estado !== 'lobby') {
      unsubSala();
      irParaJogo(codigo);
    }
  });
}

window.iniciarJogo = async function() {
  if(!amIHost) return;
  if(!getApiKey()) { pedirApiKey(() => iniciarJogo()); return; }
  await update(ref(db, `salas/${mySala}/config`), { estado: 'iniciando' });
  chamarIAInicio();
};

// ═══════════════════════════════════════════════════════════════
//  JOGO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function irParaJogo(codigo) {
  _mortoMostrado = false;
  _histInitialized = false;
  document.getElementById('modal-morto').classList.remove('open');
  showScreen('screen-game');
  document.getElementById('top-sala').textContent = codigo;
  updateVoiceBtn();
  setTimeout(() => { _histInitialized = true; }, 2500);

  if(unsubSala) unsubSala();
  unsubSala = onValue(ref(db, `salas/${codigo}`), snap => {
    if(!snap.exists()) return;
    const data = snap.val();
    const jogadores = data.jogadores || {};
    const eu = jogadores[myUid];
    if(!eu) return;

    amIHost = (data.config.host === myUid);
    document.getElementById('btn-reset-campanha').style.display = amIHost ? 'inline-block' : 'none';

    atualizarTopbar(eu);
    atualizarStatusBar(jogadores, data.config.rodada, data.config.estado);
    renderizarHistoria(data.historia);
    atualizarInputArea(eu, data.config.estado, jogadores);
    atualizarBotaoIniciar(data);
    atualizarFloatInimigos(data.inimigos);

    // Host: verifica se todos enviaram
    if(amIHost && data.config.estado === 'aguardando' && !chamandoIA) {
      verificarRodada(jogadores, data);
    }
  });
}

function atualizarBotaoIniciar(data) {
  const btn = document.getElementById('btn-iniciar-narrar');
  const semHistoria = !data.historia || Object.keys(data.historia).length === 0;
  const estado = data.config.estado;
  // Mostra para o host sempre que não há história e não está chamando a IA agora
  const mostrar = amIHost && semHistoria && !chamandoIA;
  btn.style.display = mostrar ? 'block' : 'none';
  if(mostrar) {
    const travado = estado === 'iniciando' || estado === 'narrando';
    btn.textContent = travado ? '🔄 Tentar Novamente' : '🎲 Iniciar Aventura';
  }
  if(!semHistoria) document.getElementById('historia-empty').style.display = 'none';
}

window.resetarCampanha = async function() {
  if(!amIHost) return;
  const ok = confirm('☢️ REINICIAR CAMPANHA?\n\nIsso apagará toda a história, os inimigos e resetará todos os personagens ao estado inicial.\n\nEsta ação não pode ser desfeita!');
  if(!ok) return;

  const snap = await get(ref(db, `salas/${mySala}`));
  if(!snap.exists()) return;
  const data = snap.val();
  const jogadores = data.jogadores || {};

  const ups = {};
  ups[`salas/${mySala}/historia`] = null;
  ups[`salas/${mySala}/inimigos`] = null;
  ups[`salas/${mySala}/config/estado`] = 'lobby';
  ups[`salas/${mySala}/config/rodada`] = 0;

  Object.entries(jogadores).forEach(([uid, j]) => {
    const cls = CLASSES[j.classe] || {};
    const base = `salas/${mySala}/jogadores/${uid}`;
    ups[`${base}/hp`]         = cls.hp || j.maxHp;
    ups[`${base}/sp`]         = cls.sp || j.maxSp;
    ups[`${base}/exp`]        = 0;
    ups[`${base}/vivo`]       = true;
    ups[`${base}/consciente`] = true;
    ups[`${base}/acao1`]      = null;
    ups[`${base}/acao2`]      = null;
    ups[`${base}/inventario`] = buildInventarioInicial(j.classe);
  });

  await update(ref(db), ups);

  renderedHistKeys = new Set();
  const historiaEl = document.getElementById('narrative-panel');
  Array.from(historiaEl.children).forEach(c => { if(c.id !== 'historia-empty') c.remove(); });
  document.getElementById('historia-empty').style.display = '';
  document.getElementById('modal-morto').classList.remove('open');
  toast('Campanha reiniciada!');
};

window.hostIniciarOuRetentar = async function() {
  if(!amIHost || chamandoIA) return;
  if(!getApiKey()) { pedirApiKey(() => hostIniciarOuRetentar()); return; }
  await update(ref(db, `salas/${mySala}/config`), { estado: 'iniciando' });
  chamarIAInicio();
};

// ─── Topbar ────────────────────────────────────────────────────
let _meuEuCache = null;

function atualizarTopbar(eu) {
  _meuEuCache = eu;
  const cls = CLASSES[eu.classe] || {};
  const nivel = Math.floor((eu.exp||0)/100)+1;
  const hp = Math.max(0,eu.hp), mhp = eu.maxHp;
  const sp = Math.max(0,eu.sp), msp = eu.maxSp;

  const portrait = document.getElementById('my-portrait');
  if (portrait) portrait.innerHTML = `<img src="${spriteUrl(eu.classe, eu.sexo || 'm')}" alt="">`;
  const nameEl = document.getElementById('my-name');
  if (nameEl) nameEl.textContent = eu.nome;
  const classEl = document.getElementById('my-class');
  if (classEl) classEl.textContent = `${cls.nome||''} · Nível ${nivel}`;
  const hpVal = document.getElementById('hp-val');
  const spVal = document.getElementById('sp-val');
  if (hpVal) hpVal.textContent = `${hp}/${mhp}`;
  if (spVal) spVal.textContent = `${sp}/${msp}`;
  const hpBar = document.getElementById('hp-bar');
  const spBar = document.getElementById('sp-bar');
  if (hpBar) hpBar.style.width = `${mhp>0?(hp/mhp)*100:0}%`;
  if (spBar) spBar.style.width = `${msp>0?(sp/msp)*100:0}%`;

  const condsEl = document.getElementById('my-conditions');
  if (condsEl) {
    const hpPct = mhp > 0 ? hp / mhp : 1;
    const tags = [];
    if (eu.vivo === false)        tags.push('<span class="condition-tag debuff">☠️ Morto</span>');
    else if (eu.consciente===false) tags.push('<span class="condition-tag debuff">💫 Inconsciente</span>');
    else if (hpPct < 0.25)        tags.push('<span class="condition-tag debuff">💀 Crítico</span>');
    else if (hpPct < 0.5)         tags.push('<span class="condition-tag debuff">🩸 Ferido</span>');
    else                           tags.push('<span class="condition-tag buff">⚡ Alerta</span>');
    condsEl.innerHTML = tags.join('');
  }

  const equipEl = document.getElementById('my-equip');
  if (equipEl) {
    const inv = eu.inventario || {};
    const equipped = Object.values(inv).filter(i => i.equipado);
    equipEl.innerHTML = equipped.map(i => `<span class="equip-tag"><span>${i.icon||'📦'}</span>${i.nome}</span>`).join('');
  }

  atualizarPortraitCards(eu);
}

function atualizarPortraitCards(eu) {
  const nivel = Math.floor((eu.exp||0)/100)+1;
  const hp = Math.max(0, eu.hp), mhp = eu.maxHp;
  const sp = Math.max(0, eu.sp), msp = eu.maxSp;

  const avatarEl = document.getElementById('pc-avatar');
  if (avatarEl) avatarEl.innerHTML = `<img src="${spriteUrl(eu.classe, eu.sexo || 'm')}" alt="">`;

  const pcName = document.getElementById('pc-name');
  if (pcName) pcName.textContent = `${eu.nome} · Nv${nivel}`;

  const hpFill = document.getElementById('pc-hp-fill');
  const spFill = document.getElementById('pc-sp-fill');
  const hpVal  = document.getElementById('pc-hp-val');
  const spVal  = document.getElementById('pc-sp-val');
  if (hpFill) hpFill.style.width = `${mhp>0?(hp/mhp)*100:0}%`;
  if (spFill) spFill.style.width = `${msp>0?(sp/msp)*100:0}%`;
  if (hpVal)  hpVal.textContent  = `${hp}/${mhp}`;
  if (spVal)  spVal.textContent  = `${sp}/${msp}`;

  const condsEl = document.getElementById('pc-conds');
  if (condsEl) {
    const hpPct = mhp > 0 ? hp / mhp : 1;
    let tag = '';
    if (eu.vivo === false)          tag = '<span class="condition-tag debuff">☠️ Morto</span>';
    else if (eu.consciente===false) tag = '<span class="condition-tag debuff">💫 Inconsciente</span>';
    else if (hpPct < 0.25)         tag = '<span class="condition-tag debuff">💀 Crítico</span>';
    else if (hpPct < 0.5)          tag = '<span class="condition-tag debuff">🩸 Ferido</span>';
    else if (hpPct < 0.75)         tag = '<span class="condition-tag">🛡 Guarda</span>';
    else                            tag = '<span class="condition-tag buff">⚡ Alerta</span>';
    condsEl.innerHTML = tag;
  }

  const equipsEl = document.getElementById('pc-equips');
  if (equipsEl) {
    const inv = eu.inventario || {};
    const equipped = Object.values(inv).filter(i => i.equipado).slice(0, 3);
    equipsEl.innerHTML = equipped.map(i => `<span class="equip-tag"><span>${i.icon||''}</span>${i.nome}</span>`).join('');
  }
}

window.abrirFicha = function() {
  const eu = _meuEuCache; if(!eu) return;
  const cls  = CLASSES[eu.classe] || {};
  const nivel = Math.floor((eu.exp||0)/100) + 1;
  const { atk, def } = calcularCombate(eu);
  const inv  = eu.inventario || {};
  const cor  = cls.cor || '#333';

  const hp = Math.max(0, eu.hp), mhp = eu.maxHp;
  const sp = Math.max(0, eu.sp), msp = eu.maxSp;
  const exp = eu.exp || 0;

  // Equipment slots
  const slotsHtml = SLOTS_INFO.map(slot => {
    const found = Object.entries(inv).find(([,i]) => i.slot === slot.key && i.equipado);
    if(found) {
      const [id, item] = found;
      const bonuses = [];
      if(item.atk) bonuses.push(`+${item.atk} ATK`);
      if(item.def) bonuses.push(`+${item.def} DEF`);
      if(item.hp)  bonuses.push(`+${item.hp} HP`);
      if(item.sp)  bonuses.push(`+${item.sp} SP`);
      return `<div class="fc-slot fc-slot-filled" onclick="toggleItem('${id}')">
        <div class="fc-slot-label">${slot.label}</div>
        <div class="fc-slot-item">
          <span class="fc-slot-icon">${item.icon||slot.icon}</span>
          <div class="fc-slot-info">
            <div class="fc-slot-nome">${item.nome}</div>
            <div class="fc-slot-bonus">${bonuses.join(' · ')||'—'}</div>
          </div>
          <span class="fc-slot-eq">✓</span>
        </div>
      </div>`;
    }
    return `<div class="fc-slot fc-slot-empty">
      <div class="fc-slot-label">${slot.label}</div>
      <div class="fc-slot-empty-inner">${slot.icon} <span>Vazio</span></div>
    </div>`;
  }).join('');

  // Mochila — unequipped items
  const naoEquip = Object.entries(inv).filter(([,i]) => !i.equipado);
  const mochilaHtml = naoEquip.length
    ? naoEquip.map(([id, item]) => {
        const bonuses = [];
        if(item.atk) bonuses.push(`+${item.atk} ATK`);
        if(item.def) bonuses.push(`+${item.def} DEF`);
        if(item.hp)  bonuses.push(`+${item.hp} HP`);
        if(item.sp)  bonuses.push(`+${item.sp} SP`);
        return `<div class="fc-mochila-item" onclick="toggleItem('${id}')">
          <span class="fc-mochila-icon">${item.icon||'📦'}</span>
          <div class="fc-mochila-info">
            <div class="fc-mochila-nome">${item.nome}</div>
            <div class="fc-mochila-bonus">${bonuses.join(' · ')||item.desc||''}</div>
          </div>
          <button class="fc-equip-btn" onclick="event.stopPropagation();toggleItem('${id}')">Equipar</button>
        </div>`;
      }).join('')
    : '<div class="fc-mochila-empty">Mochila vazia</div>';

  document.querySelector('#modal-ficha .ficha-sheet').innerHTML = `
    <div class="fc-header" style="background:linear-gradient(135deg,${cor}99 0%,transparent 70%),radial-gradient(ellipse at 15% 60%,${cor}55 0%,transparent 55%)">
      <div class="fc-avatar" style="border-color:${cor};background:${cor}33">${cls.avatar||cls.icon||'⚔️'}</div>
      <div class="fc-info">
        <div class="fc-nome">${eu.nome}</div>
        <div class="fc-classe">${cls.icon||''} ${cls.nome||eu.classe}</div>
        <div class="fc-nivel">NÍVEL ${nivel}</div>
      </div>
    </div>
    <div class="fc-combat">
      <div class="fc-combat-box fc-atk">
        <div class="fc-combat-val">${atk}</div>
        <div class="fc-combat-lbl">⚔️ ATK</div>
      </div>
      <div class="fc-combat-box fc-def">
        <div class="fc-combat-val">${def}</div>
        <div class="fc-combat-lbl">🛡️ DEF</div>
      </div>
      <div class="fc-res-bars">
        <div class="fc-bar">
          <div class="fc-bar-lbl"><span>HP</span><span>${hp}/${mhp}</span></div>
          <div class="fc-bar-track"><div class="fc-bar-fill" style="width:${(hp/mhp)*100}%;background:var(--hp)"></div></div>
        </div>
        <div class="fc-bar">
          <div class="fc-bar-lbl"><span>SP</span><span>${sp}/${msp}</span></div>
          <div class="fc-bar-track"><div class="fc-bar-fill" style="width:${(sp/msp)*100}%;background:var(--sp)"></div></div>
        </div>
        <div class="fc-bar">
          <div class="fc-bar-lbl"><span>EXP</span><span>${exp} XP</span></div>
          <div class="fc-bar-track"><div class="fc-bar-fill" style="width:${Math.min(exp%100,100)}%;background:var(--exp)"></div></div>
        </div>
      </div>
    </div>
    <div class="fc-section-title">EQUIPAMENTOS</div>
    <div class="fc-slots-grid">${slotsHtml}</div>
    <div class="fc-section-title">MOCHILA</div>
    <div class="fc-mochila">${mochilaHtml}</div>
    <div class="fc-close" onclick="fecharFicha()">▼ FECHAR</div>
  `;

  document.getElementById('modal-ficha').classList.add('open');
};

window.toggleItem = async function(itemId) {
  const eu = _meuEuCache;
  if(!eu?.inventario) return;
  const item = eu.inventario[itemId];
  if(!item) return;
  const nowEquipping = !item.equipado;
  const ups = {};
  if(nowEquipping && item.slot) {
    Object.entries(eu.inventario).forEach(([id, i]) => {
      if(i.slot === item.slot && i.equipado && id !== itemId) {
        ups[`salas/${mySala}/jogadores/${myUid}/inventario/${id}/equipado`] = false;
        eu.inventario[id].equipado = false;
      }
    });
  }
  ups[`salas/${mySala}/jogadores/${myUid}/inventario/${itemId}/equipado`] = nowEquipping;
  eu.inventario[itemId].equipado = nowEquipping;
  await update(ref(db), ups);
  abrirFicha();
};

window.fecharFicha = function() {
  document.getElementById('modal-ficha').classList.remove('open');
};
document.getElementById('modal-ficha').addEventListener('click', e => {
  if(e.target === document.getElementById('modal-ficha')) fecharFicha();
});

// ─── Painel flutuante de inimigos ─────────────────────────────
let _iniPanelOpen = false;

window.toggleInimigosPanel = function() {
  _iniPanelOpen = !_iniPanelOpen;
  document.getElementById('float-ini-panel').classList.toggle('open', _iniPanelOpen);
};

function atualizarFloatInimigos(inimigos) {
  const visiveis = Object.values(inimigos || {}).filter(i => i.visivel !== false && i.hp > 0);
  const btn  = document.getElementById('float-ini-btn');
  const list = document.getElementById('float-ini-list');
  const cnt  = document.getElementById('float-ini-count');

  btn.style.display = visiveis.length > 0 ? 'flex' : 'none';
  cnt.textContent   = visiveis.length;

  if(visiveis.length === 0) {
    _iniPanelOpen = false;
    document.getElementById('float-ini-panel').classList.remove('open');
  }

  list.innerHTML = visiveis.length === 0
    ? '<div class="fip-empty">Nenhum inimigo à vista</div>'
    : visiveis.map(ini => {
        const pct = Math.max(0, Math.min(100, Math.round((ini.hp / ini.maxHp) * 100)));
        const cor = pct > 55 ? '#e74c3c' : pct > 25 ? '#f39c12' : '#8b0000';
        return `<div class="fip-row">
          <span class="fip-icon">${ini.icon||'👿'}</span>
          <div class="fip-info">
            <div class="fip-nome">${ini.nome}</div>
            <div class="fip-bar"><div class="fip-fill" style="width:${pct}%;background:${cor}"></div></div>
          </div>
          <span class="fip-hp" style="color:${cor}">${ini.hp}/${ini.maxHp}</span>
        </div>`;
      }).join('');
}

// ─── Botões de ação rápida ─────────────────────────────────────
// ─── Modal de ação ────────────────────────────────────────────
const TIPOS_ACAO = {
  falar:    { titulo:'💬 Falar',      lbl1:'O QUE SEU PERSONAGEM DIZ?',    ph1:'Digite a fala...',             lbl2:'COMO? (TOM, EXPRESSÃO)',        ph2:'gritando, rindo, sussurrando...' },
  atacar:   { titulo:'⚔️ Ataque Básico', lbl1:'QUEM VOCÊ ATACA?',            ph1:'Descreva o alvo...',           lbl2:'COMO? COM QUÊ?',               ph2:'com a espada, com um soco...' },
  skill:    { titulo:'✨ Skill',       lbl1:'SKILL SELECIONADA',             ph1:'Nome da skill...',             lbl2:'ALVO OU DETALHE ADICIONAL',    ph2:'em quem / como aplica...' },
  defender: { titulo:'🛡️ Defender',  lbl1:'COMO VOCÊ SE DEFENDE?',         ph1:'Descreva sua defesa...',       lbl2:'DETALHE ADICIONAL',             ph2:'usando o escudo, recuando...' },
  mover:    { titulo:'🏃 Mover',      lbl1:'PARA ONDE VOCÊ SE MOVE?',       ph1:'Destino ou direção...',        lbl2:'COMO? (DETALHE)',               ph2:'furtivamente, correndo...' },
  livre:    { titulo:'🎯 Ação Livre',  lbl1:'O QUE VOCÊ FAZ?',              ph1:'Descreva livremente...',       lbl2:'DETALHE ADICIONAL (OPCIONAL)',  ph2:'mais detalhes...' },
};

let _tipoAcaoAtual = null;
let _slots = [null, null];
let _prevJaEnviou = false;
let _mortoMostrado = false;
let _histInitialized = false;
let _currentAudio = null;
let voiceEnabled = localStorage.getItem('rpg_voice') === '1';

window.abrirModalAcao = async function(tipo, preFill) {
  _tipoAcaoAtual = tipo;
  const t = TIPOS_ACAO[tipo];
  document.getElementById('modal-acao-title').textContent   = t.titulo;
  document.getElementById('modal-acao-lbl1').textContent    = t.lbl1;
  document.getElementById('modal-acao-txt').placeholder     = t.ph1;
  document.getElementById('modal-acao-txt').value           = preFill || '';
  document.getElementById('modal-acao-lbl2').textContent    = t.lbl2;
  document.getElementById('modal-acao-detalhe').placeholder = t.ph2;
  document.getElementById('modal-acao-detalhe').value       = '';

  const alvoDiv = document.getElementById('inimigos-alvo');
  const gridEl  = document.getElementById('inimigos-grid');
  alvoDiv.style.display = 'none';
  gridEl.innerHTML = '';

  if((tipo === 'atacar' || tipo === 'skill') && mySala) {
    const iniSnap = await get(ref(db, `salas/${mySala}/inimigos`));
    const inimigos = iniSnap.val() || {};
    const visiveis = Object.values(inimigos).filter(i => i.visivel !== false && i.hp > 0);
    if(visiveis.length > 0) {
      visiveis.forEach(ini => {
        const pct = Math.round((ini.hp / ini.maxHp) * 100);
        const btn = document.createElement('button');
        btn.className = 'inimigo-btn';
        btn.innerHTML = `
          <span class="inimigo-icon">${ini.icon||'👿'}</span>
          <div class="inimigo-info">
            <div class="inimigo-nome">${ini.nome}</div>
            <div class="inimigo-hp-bar"><div class="inimigo-hp-fill" style="width:${pct}%"></div></div>
          </div>
          <span class="inimigo-hp-txt">${ini.hp}/${ini.maxHp}</span>`;
        btn.onclick = () => selecionarAlvo(ini.nome, btn);
        gridEl.appendChild(btn);
      });
      alvoDiv.style.display = 'flex';
    }
  }

  document.getElementById('modal-acao').classList.add('open');
  if(!preFill) setTimeout(() => document.getElementById('modal-acao-txt').focus(), 100);
};

window.selecionarAlvo = function(nome, btn) {
  document.querySelectorAll('.inimigo-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const txt = document.getElementById('modal-acao-txt');
  txt.value = nome;
  txt.focus();
};

window.fecharModalAcao = function() {
  document.getElementById('modal-acao').classList.remove('open');
};

window.confirmarAcao = function() {
  const txt     = document.getElementById('modal-acao-txt').value.trim();
  const detalhe = document.getElementById('modal-acao-detalhe').value.trim();
  if(!txt) { toast('Descreva a ação antes de confirmar!'); return; }
  const t = TIPOS_ACAO[_tipoAcaoAtual];
  const acaoFinal = detalhe ? `${t.titulo}: ${txt} (${detalhe})` : `${t.titulo}: ${txt}`;
  // Preenche primeiro slot vazio
  if(_slots[0] === null) { _slots[0] = acaoFinal; }
  else if(_slots[1] === null) { _slots[1] = acaoFinal; }
  else { _slots[0] = _slots[1]; _slots[1] = acaoFinal; } // substitui a última
  renderizarSlots();
  fecharModalAcao();
};

window.limparSlot = function(idx) {
  _slots[idx] = null;
  renderizarSlots();
};

function renderizarSlots() {
  [0,1].forEach(i => {
    const slot = document.getElementById(`slot${i+1}`);
    if(_slots[i]) {
      slot.className = 'acao-slot preenchida';
      slot.innerHTML = `
        <span class="acao-slot-num">${i===0?'①':'②'}</span>
        <span class="acao-slot-texto">${_slots[i]}</span>
        <button class="acao-slot-del" onclick="limparSlot(${i})">✕</button>`;
    } else {
      slot.className = 'acao-slot';
      slot.innerHTML = `
        <span class="acao-slot-num">${i===0?'①':'②'}</span>
        <span class="acao-slot-vazia">${i===0?'Escolha uma ação abaixo...':'Segunda ação (opcional)...'}</span>`;
    }
  });
}

document.getElementById('modal-acao').addEventListener('click', e => {
  if(e.target === document.getElementById('modal-acao')) fecharModalAcao();
});

// ─── Status bar ────────────────────────────────────────────────
function atualizarStatusBar(jogadores, rodada, estado) {
  const roundEl = document.getElementById('chapter-round');
  if (roundEl) roundEl.textContent = `Rodada ${rodada || '—'}`;

  const bar = document.getElementById('player-portraits');
  if (!bar) return;
  bar.innerHTML = '';
  Object.entries(jogadores).forEach(([uid, j]) => {
    const online  = j.ativo !== false;
    const done    = (j.acao1 != null && j.acao2 != null) || !j.vivo || !j.consciente;
    const waiting = online && !done && estado === 'aguardando';
    const statusCls = !online ? 'away' : waiting ? 'typing' : 'online';
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.innerHTML = `
      <div class="pc-portrait">
        <img src="${spriteUrl(j.classe||'guerreiro', j.sexo||'m')}" onerror="this.style.display='none'" alt="">
        <span class="pc-status ${statusCls}"></span>
      </div>
      <div class="pc-name">${j.nome.split(' ')[0]}</div>
      <div class="pc-state">${done?'✓ pronto':'aguardando'}</div>`;
    bar.appendChild(chip);
  });
}

// ─── Historia ──────────────────────────────────────────────────
function renderizarHistoria(historia) {
  if(!historia) return;
  const entries = Object.entries(historia)
    .map(([k,v]) => ({k,...v}))
    .sort((a,b) => (a.ts||0)-(b.ts||0));

  if(entries.length === 0) return;
  document.getElementById('historia-empty').style.display = 'none';
  const el = document.getElementById('narrative-panel');
  const testCards = document.getElementById('test-cards');

  entries.forEach(entry => {
    if(renderedHistKeys.has(entry.k)) return;
    renderedHistKeys.add(entry.k);

    if(entry.role === 'dados') {
      // Render into test-cards panel
      if(!testCards) return;
      const linhas = (entry.content || '').split('\n').filter(l => l.trim());
      linhas.forEach(linha => {
        const [nome, acao, roll, result, cls] = linha.split('|');
        const card = document.createElement('div');
        card.className = 'test-card';
        const verdictCls = cls === 'crit' ? 'crit' : cls === 'fail' ? 'fail' : 'succ';
        const verdictTxt = cls === 'crit' ? 'CRÍTICO!' : cls === 'fail' ? 'FALHOU' : 'SUCESSO';
        const diceParts = (roll||'').match(/=\s*(\d+)\s*(?:[+-]\d+)?\s*=\s*(\d+)/);
        const total = diceParts ? diceParts[2] : '—';
        card.innerHTML = `
          <div class="tc-label">TESTE</div>
          <div class="tc-actor">${nome||''}</div>
          <div class="tc-desc">${(acao||'').substring(0,40)}</div>
          <div class="tc-roll">
            <span class="tc-dice-ico">🎲</span>
            <span class="tc-formula">${roll||''}</span>
          </div>
          <div class="tc-total ${verdictCls}">${total}</div>
          <div class="tc-verdict ${verdictCls}">${verdictTxt}</div>`;
        testCards.appendChild(card);
      });
      return;
    }

    const div = document.createElement('div');
    if(entry.role === 'rodada') {
      div.className = 'narr-divider';
      div.textContent = `RODADA ${entry.content}`;
    } else if(entry.role === 'model') {
      div.className = 'narr-entry';
      div.innerHTML = `<div class="narr-gm">
        <div class="narr-gm-header">✦ MESTRE</div>
        ${formatarTexto(entry.content)}
      </div>`;
      if (_histInitialized) narrarTexto(entry.content);
    } else if(entry.role === 'status') {
      return;
    } else {
      // user role — player actions block
      const linhas = (entry.content||'').split('\n').filter(l=>l.trim());
      const acoesDivs = linhas.map(l => {
        const colonIdx = l.indexOf(':');
        if(colonIdx === -1) return `<div class="narr-action"><div class="narr-action-body"><div class="narr-action-text">${l}</div></div></div>`;
        const nome = l.substring(0, colonIdx).trim();
        const texto = l.substring(colonIdx+1).trim();
        const isMe = nome.toLowerCase() === myNome.toLowerCase();
        const cls  = isMe ? (_meuEuCache?.classe || 'guerreiro') : 'guerreiro';
        const sexo = isMe ? (_meuEuCache?.sexo   || 'm')         : 'm';
        return `<div class="narr-action${isMe?' mine':''}">
          <div class="narr-action-avatar">
            <img src="${spriteUrl(cls, sexo)}" onerror="this.style.display='none'" alt="">
          </div>
          <div class="narr-action-body">
            <div class="narr-action-name ${isMe?'mine-label':'other-label'}">${nome.toUpperCase()}</div>
            <div class="narr-action-text">${texto}</div>
          </div>
        </div>`;
      }).join('');
      div.className = 'narr-entry';
      div.innerHTML = acoesDivs;
    }
    el.appendChild(div);
  });

  el.scrollTop = el.scrollHeight;
}

function formatarTexto(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .split('\n').join('<br>');
}

// ─── Nova entrada de ação por textarea ─────────────────────────
window.confirmarAcaoTexto = function() {
  const inp = document.getElementById('action-input');
  const txt = inp.value.trim();
  if(!txt) { toast('Descreva a ação antes de confirmar!'); return; }
  if(_slots[0] === null)      { _slots[0] = txt; }
  else if(_slots[1] === null) { _slots[1] = txt; }
  else { _slots[0] = _slots[1]; _slots[1] = txt; }
  inp.value = '';
  renderizarSlots();
  const slots = document.getElementById('acao-slots');
  if(slots) slots.style.display = 'flex';
  toast(_slots[1] ? '✅ Segunda ação definida!' : '✅ Primeira ação definida!', 1800);
};

window.focarInputAcao = function() {
  const inp = document.getElementById('action-input');
  if(inp) { inp.focus(); inp.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
};

window.qs = function(texto) {
  const inp = document.getElementById('action-input');
  if(inp) { inp.value = texto; inp.focus(); }
};

window.toggleTestPanel = function() {
  const header = document.getElementById('test-panel-header');
  const panel  = document.getElementById('test-panel');
  if(!header || !panel) return;
  header.classList.toggle('open');
  panel.classList.toggle('open');
};

window.toggleCharSheet = function() {
  document.getElementById('right-col').classList.toggle('sheet-open');
  document.getElementById('sheet-backdrop').classList.toggle('open');
};

window.sendChat = function() {
  const inp = document.getElementById('chat-input');
  if (!inp || !inp.value.trim()) return;
  inp.value = '';
};

window.toggleHistory = function() {
  const panel = document.getElementById('history-panel');
  if (panel) panel.classList.toggle('open');
};

// ─── Input area ────────────────────────────────────────────────
function atualizarInputArea(eu, estado, jogadores) {
  const btn   = document.getElementById('btn-encerrar');
  const mn    = document.getElementById('msg-narrando');
  const me    = document.getElementById('msg-enviado');
  const mi    = document.getElementById('msg-inconsciente');
  const btns  = document.getElementById('action-left');
  const slots = document.getElementById('acao-slots');

  const jaMorto  = !eu.vivo || !eu.consciente;
  const jaEnviou = eu.acao1 != null;
  const narrando = estado === 'narrando' || estado === 'iniciando';

  mn.style.display  = narrando ? 'flex'  : 'none';
  me.style.display  = jaEnviou ? 'block' : 'none';
  mi.style.display  = jaMorto  ? 'block' : 'none';

  btns.style.display  = (jaMorto || narrando) ? 'none' : 'flex';
  slots.style.display = (jaMorto || narrando || (_slots[0]===null && _slots[1]===null)) ? 'none' : 'flex';
  btn.style.display   = (jaMorto || jaEnviou || narrando) ? 'none' : 'block';

  if(_prevJaEnviou && !jaEnviou && !jaMorto) {
    _slots = [null, null];
    renderizarSlots();
    if(slots) slots.style.display = 'none';
    const inp = document.getElementById('action-input');
    if(inp) inp.value = '';
  }
  _prevJaEnviou = jaEnviou;

  if(!eu.vivo && !_mortoMostrado) {
    _mortoMostrado = true;
    document.getElementById('modal-morto').classList.add('open');
  }
}

// ─── Enviar ações ──────────────────────────────────────────────
window.enviarAcoes = async function() {
  if(!_slots[0]) { toast('Defina pelo menos a primeira ação!'); return; }
  await update(ref(db, `salas/${mySala}/jogadores/${myUid}`), {
    acao1: _slots[0],
    acao2: _slots[1] || '(sem segunda ação)'
  });
};


// ─── Verificar rodada ──────────────────────────────────────────
function verificarRodada(jogadores, data) {
  // Espera TODOS os participantes (vivos/conscientes), online ou não — jogo assíncrono
  const participantes = Object.values(jogadores).filter(j => j.vivo && j.consciente);
  if(participantes.length === 0) return;
  const todos = participantes.every(j => j.acao1 != null && j.acao2 != null);
  if(todos) chamarIA(jogadores, data);
}

// ═══════════════════════════════════════════════════════════════
//  IA — GEMINI
// ═══════════════════════════════════════════════════════════════
function buildSystemPrompt(jogadores, inimigos) {
  const fichas = Object.values(jogadores).map(j => {
    const cls = CLASSES[j.classe];
    const status = !j.vivo ? '(MORTO)' : !j.consciente ? '(INCONSCIENTE)' : '';
    return `• ${j.nome} [${cls?.nome||j.classe}] ${status} — HP ${j.hp}/${j.maxHp} | SP ${j.sp}/${j.maxSp} | EXP ${j.exp}`;
  }).join('\n');

  const iniList = Object.values(inimigos || {})
    .filter(i => i.visivel !== false && i.hp > 0)
    .map(i => `• ${i.icon||'👿'} ${i.nome} — HP ${i.hp}/${i.maxHp}`)
    .join('\n');

  return `Você é um narrador lendário de campanhas de RPG — um bardo veterano que faz os jogadores prenderem a respiração. Escreva em português do Brasil com alma e drama.

VOZ DO NARRADOR:
- Frases CURTAS e impactantes nos momentos tensos. Frases LONGAS e atmosféricas na exploração.
- Detalhes sensoriais concretos: cheiro de sangue e terra molhada, rangido de couro velho, frio nos dedos.
- Use travessões (—) e reticências (...) para criar pausas cinematográficas.
- Verbos fortes em vez de adjetivos fracos: "rasga", "despenca", "estala" — não "ataca fortemente".
- Chame os personagens pelo nome com naturalidade, como velhos conhecidos do narrador.
- Inimigos têm emoções: raiva, medo, dor — eles reagem, não são apenas alvos.

${iniList
  ? `COMBATE — máximo 120 palavras. Ritmo frenético, frases curtas.
CERTO: "A lâmina rasga o ar — o goblin se esquiva, tarde demais. Sangue. Ele recua rosnando."
CERTO (CRÍTICO): "O golpe parte o escudo ao meio. O inimigo vai ao chão com um grito abafado."
CERTO (FALHA): "Os pés escorregam na lama. Queda. Exposto. O arqueiro não perde a chance."
ERRADO: "tentou atacar mas não teve muita sorte dessa vez com o seu golpe."
Mencione: efeito físico de críticos/skills, posição dos combatentes, reação emocional dos inimigos.`
  : `EXPLORAÇÃO — máximo 160 palavras. Clima, presságio e atmosfera.
Estrutura: gancho de impacto → detalhes sensoriais → tensão latente → fim aberto que convida à ação.
O silêncio pode ser tão ameaçador quanto um rugido. Use o ambiente para criar pressentimento.`}

FICHAS DOS PERSONAGENS:
${fichas}
${iniList ? `\nINIMIGOS PRESENTES:\n${iniList}\n` : ''}
REGRAS DO SISTEMA:
- Trate todas as ações como simultâneas na mesma rodada
- Seja consistente com os eventos anteriores da história
- NÃO inclua tags de stats no corpo da narração
- AO FINAL inclua em linha separada APENAS as atualizações necessárias:
  STATS: [HP:Nome:valor] [SP:Nome:valor] [EXP:Nome:+ganho] [MORTO:Nome] [INCONS:Nome]
         [INIMIGO:Nome:hpAtual:hpMax:ícone] [MATAR:Nome]
- Exemplos: STATS: [HP:Igor:95] [EXP:Igor:+20] [INIMIGO:Goblin:45:80:👺] [MATAR:Rato]
- Atualize HP dos inimigos a cada rodada. Use [MATAR:Nome] quando derrotado.
- EXP mínimo +10 por rodada. HP/SP devem ser valores absolutos.`;
}

function mostrarRetryUI(tentativa, totalMs) {
  const info = document.getElementById('retry-info');
  const txt  = document.getElementById('retry-txt');
  const fill = document.getElementById('retry-fill');
  if(!info) return;
  info.style.display = 'block';
  const pct = Math.round((tentativa-1)/10*100);
  fill.style.width = pct+'%';
  const seg = Math.round(totalMs/1000);
  txt.textContent = `Tentativa ${tentativa}/10… aguardando ${seg}s`;
}

function ocultarRetryUI() {
  const info = document.getElementById('retry-info');
  const fill = document.getElementById('retry-fill');
  if(!info) return;
  info.style.display = 'none';
  fill.style.width = '0%';
}

async function chamarIAInicio() {
  if(chamandoIA) return;
  if(!getApiKey()) { pedirApiKey(() => chamarIAInicio()); return; }
  chamandoIA = true;
  const btn = document.getElementById('btn-iniciar-narrar');
  if(btn) btn.style.display = 'none';

  try {
    const snap = await get(ref(db, `salas/${mySala}`));
    const data = snap.val();
    const jogadores = data.jogadores || {};

    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    const nomes = Object.values(jogadores)
      .map(j => `${j.nome} (${CLASSES[j.classe]?.nome||j.classe})`)
      .join(', ');

    const prompt = `Abra esta campanha de RPG medieval com impacto cinematográfico. Personagens: ${nomes}.

ESTRUTURA DA ABERTURA — siga esta sequência em 4 partes:
1. AMBIÊNCIA (2 frases): pinte o cenário com detalhes sensoriais — sons, cheiros, texturas, não apenas o visual.
2. PRESSÁGIO (1-2 frases): um detalhe que algo está errado — silêncio suspeito, sombra que se move, animal que foge em pânico.
3. O ATAQUE: escolha LIVREMENTE o cenário (floresta, estrada, taverna, ruínas, porto, vila) e os antagonistas. Dê a eles um detalhe visual memorável que os torne únicos — não use criaturas genéricas sem personalidade.
4. GANCHO FINAL (1 frase): urgência máxima. Os aventureiros precisam agir AGORA.

Tom: narração de abertura de filme épico de fantasia. Apaixonado, tenso, vívido. Use o estilo de narrador que você é.
OBRIGATÓRIO ao final: STATS: [INIMIGO:nome:hp:hpMax:ícone] para cada inimigo visível.
Exemplo: STATS: [INIMIGO:Goblin Batedores:30:30:👺] [INIMIGO:Goblin Arqueiro:25:25:🏹] [INIMIGO:Líder Goblin:55:55:👹]`;

    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, {}), [], prompt, mostrarRetryUI);

    ocultarRetryUI();

    if(!resposta) {
      await update(ref(db, `salas/${mySala}/config`), { estado: 'lobby' });
      if(amIHost && btn) btn.style.display = 'block';
      return;
    }

    const ts = Date.now();
    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparStats(resposta), ts });
    await processarStats(resposta, jogadores, {});
    await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando', rodada: 1 });
  } finally {
    chamandoIA = false;
    ocultarRetryUI();
  }
}

async function chamarIA(jogadores, data) {
  if(chamandoIA) return;
  chamandoIA = true;

  try {
    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    const apiKey = getApiKey();
    if(!apiKey) {
      pedirApiKey(async () => {
        await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando' });
      });
      return;
    }

    const acoes = Object.values(jogadores)
      .map(j => {
        if(!j.vivo) return `${j.nome}: (morto, sem ação)`;
        if(!j.consciente) return `${j.nome}: (inconsciente, sem ação)`;
        return `${j.nome}: [Principal] ${j.acao1 || '(nenhuma)'}  [Bônus] ${j.acao2 || '(nenhuma)'}`;
      }).join('\n');

    const [histSnap, iniSnap] = await Promise.all([
      get(ref(db, `salas/${mySala}/historia`)),
      get(ref(db, `salas/${mySala}/inimigos`))
    ]);
    const inimigos = iniSnap.val() || {};
    const histRaw  = histSnap.val() || {};
    const histArr  = Object.values(histRaw).sort((a,b)=>(a.ts||0)-(b.ts||0));
    const gemHist  = histArr
      .filter(e => e.role==='model' || e.role==='user')
      .map(e => ({ role: e.role==='model'?'model':'user', parts:[{text:e.content}] }));

    const rodada = data.config.rodada || 1;

    // Rolar dados dos jogadores e dos inimigos
    const rolls      = rolarRodada(jogadores);
    const iniRolls   = rolarInimigos(inimigos, jogadores);

    const rollsTxt = [
      ...rolls.map(r => {
        const modStr = r.mod >= 0 ? `+${r.mod}` : `${r.mod}`;
        const status = r.critico ? 'CRÍTICO!' : r.falha ? 'FALHA CRÍTICA!' : r.sucesso ? 'SUCESSO' : 'FALHOU';
        return `  ${r.nome}${r.bonus?' (bônus)':''}: ${r.acao.substring(0,50)} → 1d20${modStr}=${r.dado}${modStr}=${r.total} vs DC${r.dc} → ${status}`;
      }),
      ...iniRolls.map(r => {
        const modStr = r.mod >= 0 ? `+${r.mod}` : `${r.mod}`;
        const status = r.critico ? 'CRÍTICO!' : r.falha ? 'ERROU!' : r.sucesso ? 'ACERTOU' : 'ERROU';
        return `  ${r.nome} ataca ${r.alvo}: 1d20${modStr}=${r.dado}${modStr}=${r.total} vs DC${r.dc} → ${status}`;
      })
    ].join('\n');

    // Salva o card de dados (pipe-delimited, sem JSON)
    const dadosLinhas = [
      ...rolls.map(r => {
        const modStr = r.mod >= 0 ? `+${r.mod}` : `${r.mod}`;
        const label  = LABEL_TIPO[r.tipo] || 'Teste';
        const emoji  = r.critico ? '💥' : r.falha ? '💀' : r.sucesso ? '✅' : '❌';
        const status = r.critico ? 'CRÍTICO!' : r.falha ? 'FALHA!' : r.sucesso ? 'SUCESSO' : 'FALHOU';
        const cls    = r.critico ? 'crit' : (!r.sucesso || r.falha) ? 'fail' : 'ok';
        const bonus  = r.bonus ? ' (bônus)' : '';
        const acao   = r.acao.substring(0, 50).replace(/\|/g, '/');
        return `${r.nome}${bonus}|${acao}|${label}: 1d20${modStr} = ${r.dado}${modStr} = ${r.total} vs DC${r.dc}|${emoji} ${status}|${cls}|jogador`;
      }),
      ...iniRolls.map(r => {
        const modStr = r.mod >= 0 ? `+${r.mod}` : `${r.mod}`;
        const emoji  = r.critico ? '💥' : r.falha ? '💨' : r.sucesso ? '⚔️' : '💨';
        const status = r.critico ? 'CRÍTICO!' : r.falha ? 'ERROU!' : r.sucesso ? 'ACERTOU!' : 'ERROU!';
        const cls    = r.critico ? 'crit' : !r.sucesso ? 'fail' : 'ok';
        return `${r.icon} ${r.nome}|→ ${r.alvo}|Ataque: 1d20${modStr} = ${r.dado}${modStr} = ${r.total} vs DC${r.dc}|${emoji} ${status}|${cls}|inimigo`;
      })
    ].join('\n');

    await push(ref(db, `salas/${mySala}/historia`), { role:'rodada', content: String(rodada), ts: Date.now()-3 });
    await push(ref(db, `salas/${mySala}/historia`), { role:'user',   content: acoes,           ts: Date.now()-2 });
    if(dadosLinhas) await push(ref(db, `salas/${mySala}/historia`), { role:'dados', content: dadosLinhas, ts: Date.now()-1 });

    const msgComDados = `${acoes}\n\nRESULTADOS DOS DADOS DESTA RODADA — use-os fielmente ao narrar:\n${rollsTxt}\nCRÍTICO = efeito espetacular / FALHA = desastre / SUCESSO/ACERTOU = funciona / FALHOU/ERROU = sem efeito.`;

    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, inimigos), gemHist, msgComDados, mostrarRetryUI);

    ocultarRetryUI();

    if(!resposta) {
      await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando' });
      return;
    }

    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparStats(resposta), ts: Date.now() });
    await processarStats(resposta, jogadores, inimigos);

    const ups = {};
    Object.keys(jogadores).forEach(uid => {
      ups[`salas/${mySala}/jogadores/${uid}/acao1`] = null;
      ups[`salas/${mySala}/jogadores/${uid}/acao2`] = null;
    });
    ups[`salas/${mySala}/config/estado`] = 'aguardando';
    ups[`salas/${mySala}/config/rodada`] = rodada + 1;
    await update(ref(db), ups);
  } finally {
    chamandoIA = false;
    ocultarRetryUI();
  }
}

function limparStats(texto) {
  return texto.replace(/\nSTATS:.*$/m,'').replace(/STATS:.*$/gm,'').trim();
}

async function processarStats(resposta, jogadores, iniAtual) {
  const statsLine = resposta.match(/STATS:([\s\S]*)/);
  if(!statsLine) return;
  const tags = statsLine[1].matchAll(/\[([A-Z]+):([^\]]+)\]/g);
  const ups = {};
  for(const [,tipo,resto] of tags) {
    const partes = resto.split(':');
    const nome   = partes[0].trim();
    const v1     = (partes[1] || '').trim();
    const v2     = (partes[2] || '').trim();
    const v3     = (partes[3] || '').trim();

    if(tipo === 'INIMIGO') {
      const hp    = parseInt(v1) || 0;
      const maxHp = parseInt(v2) || hp;
      const icon  = v3 || '👿';
      const key   = nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
      ups[`salas/${mySala}/inimigos/${key}`] = { nome, hp: Math.max(0,hp), maxHp, icon, visivel: hp > 0 };
      continue;
    }
    if(tipo === 'MATAR') {
      const key = nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
      ups[`salas/${mySala}/inimigos/${key}/hp`]      = 0;
      ups[`salas/${mySala}/inimigos/${key}/visivel`] = false;
      continue;
    }

    const uid = Object.keys(jogadores).find(u =>
      jogadores[u].nome.toLowerCase() === nome.toLowerCase()
    );
    if(!uid) continue;
    const j    = jogadores[uid];
    const base = `salas/${mySala}/jogadores/${uid}`;
    if(tipo==='HP') {
      const v = parseInt(v1);
      if(!isNaN(v)) ups[`${base}/hp`] = Math.max(0, Math.min(v, j.maxHp));
    } else if(tipo==='SP') {
      const v = parseInt(v1);
      if(!isNaN(v)) ups[`${base}/sp`] = Math.max(0, Math.min(v, j.maxSp));
    } else if(tipo==='EXP') {
      const v = parseInt(v1.replace('+',''));
      if(!isNaN(v)) ups[`${base}/exp`] = (j.exp||0)+v;
    } else if(tipo==='MORTO') {
      ups[`${base}/vivo`] = false; ups[`${base}/hp`] = 0;
    } else if(tipo==='INCONS') {
      ups[`${base}/consciente`] = false;
    }
  }
  if(Object.keys(ups).length) await update(ref(db), ups);
}

async function chamarOpenAI(systemPrompt, history, userMsg, onRetry) {
  const apiKey = getApiKey();
  if(!apiKey) return null;

  const messages = [
    { role:'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role==='model' ? 'assistant' : 'user', content: m.parts?.[0]?.text || m.content || '' })),
    { role:'user', content: userMsg }
  ];

  const body = JSON.stringify({ model:'llama-3.3-70b-versatile', messages, temperature:0.88, max_tokens:950 });
  const MAX = 10;

  for(let t=1; t<=MAX; t++) {
    if(t>1) {
      const waitMs = Math.min(t*2000, 16000);
      if(onRetry) onRetry(t, waitMs);
      await new Promise(r=>setTimeout(r, waitMs));
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
        body
      });
      const d = await res.json();
      if(d.error) {
        const msg = d.error.message || '';
        if((/rate.limit|overload|529|503|timeout/i.test(msg)) && t<MAX) continue;
        toast(`Erro IA: ${msg.substring(0,80)}`);
        return null;
      }
      return d.choices?.[0]?.message?.content || '';
    } catch(e) {
      if(t===MAX){ toast('Erro de conexão com a IA após 10 tentativas'); return null; }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  RECONECTAR
// ═══════════════════════════════════════════════════════════════
async function tentarReconectar() {
  if(!mySala || !myNome) return false;
  try {
    const snap = await get(ref(db, `salas/${mySala}`));
    if(!snap.exists()) return false;
    const data = snap.val();
    if(!data.jogadores?.[myUid]) return false;

    await update(ref(db, `salas/${mySala}/jogadores/${myUid}`), { ativo: true });
    onDisconnect(ref(db, `salas/${mySala}/jogadores/${myUid}/ativo`)).set(false);

    if(data.config.estado === 'lobby') irParaLobby(mySala);
    else irParaJogo(mySala);
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
//  SKILL TREE
// ═══════════════════════════════════════════════════════════════
const SKILLS = {
  guerreiro: [
    { nivel:1, nome:'Golpe Poderoso',    icon:'⚔️',  sp:10, desc:'Concentra força num golpe devastador que ignora parte da defesa.' },
    { nivel:1, nome:'Postura Defensiva', icon:'🛡️',  sp:8,  desc:'Adota postura que reduz o dano recebido por uma rodada.' },
    { nivel:1, nome:'Provocar',          icon:'😤',  sp:5,  desc:'Atrai a atenção dos inimigos, protegendo os aliados.' },
    { nivel:2, nome:'Investida',         icon:'🐂',  sp:15, desc:'Avança em alta velocidade causando dano e empurrando o alvo.' },
    { nivel:2, nome:'Desarmar',          icon:'🤜',  sp:12, desc:'Tenta arrancar a arma das mãos do inimigo.' },
    { nivel:2, nome:'Contra-Ataque',     icon:'↩️',  sp:15, desc:'Prepara um revide imediato ao próximo ataque recebido.' },
    { nivel:3, nome:'Fúria de Combate',  icon:'💢',  sp:22, desc:'Entra em frenesi desferindo múltiplos golpes rápidos.' },
    { nivel:3, nome:'Golpe Devastador',  icon:'💥',  sp:28, desc:'Ataque capaz de quebrar armaduras e atordoar.' },
    { nivel:3, nome:'Bastião',           icon:'🏰',  sp:20, desc:'Cria uma linha de defesa, protegendo todos os aliados próximos.' },
    { nivel:5, nome:'Redemoinho',        icon:'🌀',  sp:38, desc:'Gira com a arma atingindo todos os inimigos ao redor.' },
    { nivel:5, nome:'Lâmina da Ruína',   icon:'🗡️',  sp:45, desc:'Golpe lendário que corta a própria realidade.' },
  ],
  mago: [
    { nivel:1, nome:'Míssil Mágico',     icon:'💫',  sp:8,  desc:'Projétil arcano de energia pura que nunca erra o alvo.' },
    { nivel:1, nome:'Faísca Ardente',    icon:'🔥',  sp:10, desc:'Lança uma faísca de fogo que pode incendiar o alvo.' },
    { nivel:1, nome:'Choque Glacial',    icon:'❄️',  sp:10, desc:'Jato de gelo que pode congelar parcialmente o alvo.' },
    { nivel:2, nome:'Bola de Fogo',      icon:'🔥',  sp:22, desc:'Esfera de fogo que explode em área ao atingir o alvo.' },
    { nivel:2, nome:'Escudo Arcano',     icon:'🔮',  sp:18, desc:'Barreira mágica que absorve os próximos ataques.' },
    { nivel:2, nome:'Raio',             icon:'⚡',  sp:20, desc:'Descarga elétrica que atinge em linha reta.' },
    { nivel:3, nome:'Tempestade Arcana', icon:'🌩️',  sp:32, desc:'Invoca uma tempestade de energia mágica em área.' },
    { nivel:3, nome:'Dissipar Magia',    icon:'✨',  sp:25, desc:'Cancela um feitiço ativo inimigo ou efeito mágico.' },
    { nivel:3, nome:'Familiar',          icon:'🦉',  sp:28, desc:'Invoca um familiar para explorar, vigiar ou atacar.' },
    { nivel:5, nome:'Parar o Tempo',     icon:'⏳',  sp:50, desc:'Suspende o tempo brevemente, agindo antes de todos.' },
    { nivel:5, nome:'Toque da Morte',    icon:'💀',  sp:55, desc:'Magia necrótica que drena a vida do alvo diretamente.' },
  ],
  ladino: [
    { nivel:1, nome:'Ataque Furtivo',    icon:'🥷',  sp:8,  desc:'Ataque preciso em pontos vitais causando dano extra.' },
    { nivel:1, nome:'Fumaça',            icon:'💨',  sp:6,  desc:'Joga uma bomba de fumaça para dificultar visão inimiga.' },
    { nivel:1, nome:'Desviar',           icon:'💨',  sp:5,  desc:'Reflexos aguçados para esquivar de ataques.' },
    { nivel:2, nome:'Roubar',            icon:'💰',  sp:10, desc:'Tenta furtar um item do alvo sem ser notado.' },
    { nivel:2, nome:'Veneno',            icon:'☠️',  sp:15, desc:'Aplica veneno na arma causando dano contínuo.' },
    { nivel:2, nome:'Golpe Duplo',       icon:'⚡',  sp:18, desc:'Dois ataques rápidos em sequência.' },
    { nivel:3, nome:'Desaparecer',       icon:'🌑',  sp:25, desc:'Some das vistas tornando-se invisível por uma rodada.' },
    { nivel:3, nome:'Emboscada',         icon:'🎯',  sp:28, desc:'Prepara uma armadilha letal para o próximo inimigo.' },
    { nivel:3, nome:'Sombras',           icon:'🕷️',  sp:22, desc:'Funde-se às sombras se movendo sem ser detectado.' },
    { nivel:5, nome:'Assassínio',        icon:'🗡️',  sp:45, desc:'Golpe mortal em ponto vital com chances de abater instantaneamente.' },
    { nivel:5, nome:'Sombra Viva',       icon:'👤',  sp:40, desc:'Cria uma ilusão perfeita de si mesmo como distração.' },
  ],
  clerigo: [
    { nivel:1, nome:'Curar',             icon:'💚',  sp:12, desc:'Cura os ferimentos de um aliado usando energia divina.' },
    { nivel:1, nome:'Bênção',            icon:'✨',  sp:8,  desc:'Abençoa um aliado aumentando seus ataques e defesas.' },
    { nivel:1, nome:'Luz Sagrada',       icon:'☀️',  sp:10, desc:'Projeta luz sagrada que prejudica mortos-vivos.' },
    { nivel:2, nome:'Purificar',         icon:'🌿',  sp:15, desc:'Remove venenos, maldições e efeitos negativos.' },
    { nivel:2, nome:'Escudo Divino',     icon:'🛡️',  sp:18, desc:'Envolve um aliado em proteção divina.' },
    { nivel:2, nome:'Punição Sagrada',   icon:'⚡',  sp:20, desc:'Raio de energia sagrada que queima o alvo.' },
    { nivel:3, nome:'Cura em Área',      icon:'💚',  sp:30, desc:'Cura todos os aliados próximos simultaneamente.' },
    { nivel:3, nome:'Ressurreição',      icon:'🔆',  sp:40, desc:'Traz de volta um aliado inconsciente com HP mínimo.' },
    { nivel:3, nome:'Maldição',          icon:'🔮',  sp:25, desc:'Lança uma maldição enfraquecendo permanentemente o alvo.' },
    { nivel:5, nome:'Milagre',           icon:'🌟',  sp:55, desc:'Chama a intervenção divina para um efeito extraordinário.' },
    { nivel:5, nome:'Julgamento',        icon:'⚖️',  sp:48, desc:'Julgamento divino que pulveriza criaturas malignas.' },
  ],
  barbaro: [
    { nivel:1, nome:'Fúria',             icon:'💢',  sp:0,  desc:'Entra em estado de fúria aumentando força e resistência.' },
    { nivel:1, nome:'Golpe Selvagem',    icon:'🪓',  sp:8,  desc:'Ataque brutal sem técnica mas com força devastadora.' },
    { nivel:1, nome:'Rugido',            icon:'😤',  sp:5,  desc:'Rugido aterrorizante que intimida inimigos próximos.' },
    { nivel:2, nome:'Esmagar',           icon:'💥',  sp:15, desc:'Golpe que pode derrubar ou atordoar o alvo.' },
    { nivel:2, nome:'Agarrar',           icon:'✊',  sp:10, desc:'Agarra o inimigo imobilizando-o.' },
    { nivel:2, nome:'Resistência Bruta', icon:'🪨',  sp:12, desc:'Ignora parte do dano recebido pelo puro vigor.' },
    { nivel:3, nome:'Berserker',         icon:'🔴',  sp:25, desc:'Fúria absoluta: ataca sem parar mas ignora defesa.' },
    { nivel:3, nome:'Tremor',            icon:'🌍',  sp:28, desc:'Golpeia o chão causando tremor que derruba todos ao redor.' },
    { nivel:3, nome:'Pele de Pedra',     icon:'🪨',  sp:20, desc:'Pele endurece como pedra reduzindo muito o dano.' },
    { nivel:5, nome:'Caos',              icon:'🌪️',  sp:45, desc:'Destruição total: atinge tudo e todos ao redor.' },
    { nivel:5, nome:'Avatar',            icon:'👹',  sp:55, desc:'Transforma-se num avatar de destruição por uma rodada.' },
  ],
  arqueiro: [
    { nivel:1, nome:'Tiro Preciso',      icon:'🎯',  sp:8,  desc:'Mira cuidadosa que aumenta muito a precisão e dano.' },
    { nivel:1, nome:'Tiro Rápido',       icon:'💨',  sp:6,  desc:'Solta uma flecha rapidamente sem perder posição.' },
    { nivel:1, nome:'Marcar Alvo',       icon:'👁️',  sp:5,  desc:'Marca um inimigo para receber mais dano de todos.' },
    { nivel:2, nome:'Flecha de Fogo',    icon:'🔥',  sp:15, desc:'Flecha envolta em chamas que incendeia o alvo.' },
    { nivel:2, nome:'Chuva de Flechas',  icon:'🌧️',  sp:20, desc:'Lança diversas flechas em área atingindo vários alvos.' },
    { nivel:2, nome:'Tiro Perfurante',   icon:'⬆️',  sp:18, desc:'Flecha que atravessa múltiplos inimigos em linha.' },
    { nivel:3, nome:'Flecha Explosiva',  icon:'💥',  sp:28, desc:'Flecha com explosivo que causa dano em área.' },
    { nivel:3, nome:'Tiro Paralisante',  icon:'⚡',  sp:25, desc:'Flecha especial que paralisa o alvo temporariamente.' },
    { nivel:3, nome:'Olho de Águia',     icon:'🦅',  sp:22, desc:'Aguça a visão para atingir alvos em enorme distância.' },
    { nivel:5, nome:'Tiro Impossível',   icon:'⭐',  sp:45, desc:'Flecha que dobra no ar para contornar obstáculos.' },
    { nivel:5, nome:'Saraivada',         icon:'🌩️',  sp:50, desc:'Dezenas de flechas disparadas em frações de segundo.' },
  ],
};

let _skillSelecionada = null;

window.abrirArvoreSkills = function() {
  if(!_meuEuCache) return;
  const eu     = _meuEuCache;
  const nivel  = Math.floor((eu.exp || 0) / 100) + 1;
  const skills = SKILLS[eu.classe] || [];
  const cls    = CLASSES[eu.classe] || {};

  document.getElementById('skill-sheet-sub').textContent =
    `${cls.nome||eu.classe} · Nível ${nivel} · SP ${eu.sp}/${eu.maxSp}`;

  // Agrupa por nível
  const porNivel = {};
  skills.forEach(s => { (porNivel[s.nivel] = porNivel[s.nivel]||[]).push(s); });

  const lista = document.getElementById('skill-tree-lista');
  lista.innerHTML = '';

  Object.keys(porNivel).sort((a,b)=>a-b).forEach(nv => {
    const bloqueado = nivel < parseInt(nv);
    const sec = document.createElement('div');
    sec.className = 'skill-nivel';

    const lbl = document.createElement('div');
    lbl.className = 'skill-nivel-lbl' + (bloqueado?' locked':'');
    lbl.textContent = bloqueado ? `NÍVEL ${nv}  🔒 (requer nível ${nv})` : `NÍVEL ${nv}`;
    sec.appendChild(lbl);

    const cards = document.createElement('div');
    cards.className = 'skill-cards';
    porNivel[nv].forEach((sk, i) => {
      const spok = eu.sp >= sk.sp;
      const avail = !bloqueado && spok;
      const card = document.createElement('div');
      card.className = 'skill-card ' + (avail ? 'unlocked' : 'locked');
      card.innerHTML = `
        <div class="skill-card-top">
          <span class="skill-card-icon">${sk.icon}</span>
          <div>
            <div class="skill-card-nome">${sk.nome}</div>
            <div class="skill-card-sp">${sk.sp > 0 ? `${sk.sp} SP` : 'Grátis'}</div>
          </div>
        </div>
        <div class="skill-card-desc">${sk.desc}</div>
        ${bloqueado ? `<div class="skill-card-lock">🔒 Nível ${nv} necessário</div>` : ''}
        ${!bloqueado && !spok ? `<div class="skill-card-lock">SP insuficiente</div>` : ''}
      `;
      if(avail) card.onclick = () => selecionarSkill(sk);
      cards.appendChild(card);
    });
    sec.appendChild(cards);
    lista.appendChild(sec);
  });

  // Mostra fase 1
  document.getElementById('skill-tree-lista').style.display = '';
  document.getElementById('skill-detail-panel').classList.remove('active');
  document.getElementById('modal-skill').classList.add('open');
};

function selecionarSkill(sk) {
  _skillSelecionada = sk;
  document.getElementById('sk-icon').textContent  = sk.icon;
  document.getElementById('sk-nome').textContent  = sk.nome;
  document.getElementById('sk-desc').textContent  = sk.desc + (sk.sp > 0 ? ` (Custo: ${sk.sp} SP)` : '');
  document.getElementById('sk-detalhe').value     = '';
  document.getElementById('skill-tree-lista').style.display   = 'none';
  document.getElementById('skill-detail-panel').classList.add('active');
  setTimeout(() => document.getElementById('sk-detalhe').focus(), 100);
}

window.voltarArvore = function() {
  document.getElementById('skill-tree-lista').style.display   = '';
  document.getElementById('skill-detail-panel').classList.remove('active');
};

window.fecharSkillTree = function() {
  document.getElementById('modal-skill').classList.remove('open');
};

window.confirmarSkill = function() {
  if(!_skillSelecionada) return;
  const detalhe = document.getElementById('sk-detalhe').value.trim();
  const preFill = detalhe
    ? `${_skillSelecionada.icon} ${_skillSelecionada.nome}: ${detalhe}`
    : `${_skillSelecionada.icon} ${_skillSelecionada.nome}`;
  fecharSkillTree();
  // Abre modal de ação com skill pré-preenchida e seleção de alvo
  abrirModalAcao('skill', preFill);
};

document.getElementById('modal-skill').addEventListener('click', e => {
  if(e.target === document.getElementById('modal-skill')) fecharSkillTree();
});

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
// tentarReconectar routes to lobby/game if active session exists
// initStartScreen (async IIFE above) handles the welcome/char-creation flow
await tentarReconectar();
