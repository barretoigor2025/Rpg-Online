import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
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
//  AD&D — CLASSES, PERÍCIAS E DERIVADOS
// ═══════════════════════════════════════════════════════════════
const CLASSES = {
  guerreiro: {
    nome: 'Guerreiro', icon: '⚔️',
    STR: 16, DEX: 14, CON: 15, INT: 10, WIS: 10, CHA: 10,
    dado_vida: 10, ca_armor: 5, fort_base: 2, ref_base: 0, will_base: 0,
    descricao: 'Combatente versátil. Usa qualquer arma ou armadura. Superior no corpo a corpo.',
    habilidade: { nome: 'Ataque Extra', desc: 'Uma vez por combate, faz dois ataques em um único turno.' }
  },
  mago: {
    nome: 'Mago', icon: '🔮',
    STR: 8, DEX: 12, CON: 10, INT: 17, WIS: 13, CHA: 12,
    dado_vida: 4, ca_armor: 0, fort_base: 0, ref_base: 0, will_base: 2,
    descricao: 'Arquimago em formação. Magias devastadoras — mas fisicamente frágil.',
    habilidade: { nome: 'Grimório', desc: 'Conhece 3 magias arcanas. Pode identificar itens e criaturas mágicas.' }
  },
  ladino: {
    nome: 'Ladino', icon: '🗡️',
    STR: 10, DEX: 17, CON: 11, INT: 13, WIS: 10, CHA: 13,
    dado_vida: 6, ca_armor: 2, fort_base: 0, ref_base: 2, will_base: 0,
    descricao: 'Especialista furtivo. Ataca na sombra para dano máximo e some antes da reação.',
    habilidade: { nome: 'Ataque Furtivo', desc: 'Causa dano duplo ao atacar por surpresa ou flanqueando inimigo.' }
  },
  clerigo: {
    nome: 'Clérigo', icon: '✨',
    STR: 12, DEX: 10, CON: 12, INT: 12, WIS: 16, CHA: 13,
    dado_vida: 8, ca_armor: 5, fort_base: 0, ref_base: 0, will_base: 2,
    descricao: 'Sacerdote guerreiro. Cura aliados e confronta mortos-vivos com poder divino.',
    habilidade: { nome: 'Canalizar Divindade', desc: 'Cura 1d6+SAB aliado adjacente ou repele mortos-vivos em 10m.' }
  },
  barbaro: {
    nome: 'Bárbaro', icon: '🪓',
    STR: 18, DEX: 12, CON: 16, INT: 8, WIS: 9, CHA: 8,
    dado_vida: 12, ca_armor: 3, fort_base: 2, ref_base: 2, will_base: 0,
    descricao: 'Força bruta da natureza. Em fúria, torna-se quase imparável.',
    habilidade: { nome: 'Fúria', desc: 'FOR +4 e resistência a dano físico por 3 rodadas. 1 uso por combate.' }
  },
  arqueiro: {
    nome: 'Arqueiro', icon: '🏹',
    STR: 12, DEX: 16, CON: 13, INT: 11, WIS: 13, CHA: 10,
    dado_vida: 8, ca_armor: 4, fort_base: 0, ref_base: 2, will_base: 0,
    descricao: 'Rastreador preciso. Abate inimigos à distância antes de serem vistos.',
    habilidade: { nome: 'Tiro Certeiro', desc: 'Ignora metade da cobertura. +2 de ataque a alvos acima de 10m.' }
  }
};

const PERICIAS = {
  atletismo:    { nome: 'Atletismo',    attr: 'FOR', icon: '💪', desc: '+2 escalada, natação e saltos' },
  furtividade:  { nome: 'Furtividade',  attr: 'DES', icon: '🌑', desc: '+2 mover-se sem ser detectado' },
  acrobacia:    { nome: 'Acrobacia',    attr: 'DES', icon: '🤸', desc: '+2 equilíbrio e manobras em combate' },
  arcana:       { nome: 'Arcana',       attr: 'INT', icon: '📚', desc: '+2 identificar magia e criaturas arcanas' },
  medicina:     { nome: 'Medicina',     attr: 'SAB', icon: '⚕️', desc: '+2 estabilizar feridos e tratar doenças' },
  percepcao:    { nome: 'Percepção',    attr: 'SAB', icon: '👁️', desc: '+2 notar detalhes ocultos e emboscadas' },
  persuasao:    { nome: 'Persuasão',    attr: 'CAR', icon: '💬', desc: '+2 convencer e negociar com NPCs' },
  sobrevivencia:{ nome: 'Sobrevivência',attr: 'SAB', icon: '🌿', desc: '+2 rastrear, caçar e orientar-se na natureza' }
};

function dndMod(val) { return Math.floor((val - 10) / 2); }

function dndDerivados(cls) {
  const conMod = dndMod(cls.CON);
  const dexMod = dndMod(cls.DEX);
  const wisMod = dndMod(cls.WIS);
  return {
    hp: Math.max(1, cls.dado_vida + conMod),
    ac: 10 + dexMod + cls.ca_armor,
    init: dexMod,
    fort: conMod + cls.fort_base,
    ref:  dexMod + cls.ref_base,
    will: wisMod + cls.will_base
  };
}

// ═══════════════════════════════════════════════════════════════
//  ESTADO
// ═══════════════════════════════════════════════════════════════
let myUid       = localStorage.getItem('rpg_uid') || (() => {
  const id = Math.random().toString(36).slice(2,10);
  localStorage.setItem('rpg_uid', id);
  return id;
})();
let mySala      = null;
let myNome      = null;
let myClasse    = 'guerreiro';
let amIHost     = false;
let chamandoIA  = false;
let unsubSala   = null;
let _apiKeyPendingCb = null;
let voiceEnabled = localStorage.getItem('rpg_voice') !== '0';
let voiceQueue  = [];
let voiceBusy   = false;
let _currentAudio = null;
let _selectedClass  = 'guerreiro';
let _selectedAdvs   = new Set();
let _selectedGender = 'm';
let _campanha   = null;
let _introSlides = [];
let _introIdx    = 0;
let _introAtivo  = false;
let _afterNarrationCb = null;
let _jogadoresCache   = {};

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function getApiKey() { return localStorage.getItem('rpg_groq_key') || ''; }

function toast(msg, ms = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

function codigoAleatorio() {
  return Array.from({length:5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');
}

function scrollDown() {
  const b = document.getElementById('story-bottom');
  if (b) b.scrollIntoView({ behavior:'smooth' });
}

function setActionStatus(msg) {
  const el = document.getElementById('action-status');
  if (el) el.textContent = msg;
}

function limparTags(txt) {
  return txt
    .replace(/STATS:\s*(\[(?:INIMIGO|HP|MATAR|MOV|JOGADOR|AUSENTE|PRESENTE)[^\]]*\]\s*)*/gi, '')
    .replace(/\[(?:INIMIGO|MOV|AUSENTE|PRESENTE|JOGADOR|HP|MATAR):[^\]]+\]/gi, '')
    .replace(/^\s*FALA:\s*\[[^\]]+\]\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ═══════════════════════════════════════════════════════════════
//  NPC — DADOS DE DIÁLOGO
// ═══════════════════════════════════════════════════════════════
const NPC_DATA = {
  'Gregoras Pellos':  { icon: '🗡️', cor: '#607080', voz: 'Fritz-PlayAI'   },
  'Catherine':        { icon: '👑', cor: '#b08030', voz: 'Val-PlayAI'      },
  'Hobbleboot Sam':   { icon: '🥾', cor: '#5a7a4a', voz: 'Briggs-PlayAI'  },
  'Mutter Grimmhaar': { icon: '🧙', cor: '#6a3a6a', voz: 'Deedee-PlayAI'  },
  'Wulfram':          { icon: '🦌', cor: '#6a5a30', voz: 'Orion-PlayAI'   },
  'Príncipe Kalos':   { icon: '🧝', cor: '#305070', voz: 'Gideon-PlayAI'  },
  'Rei Chutter':      { icon: '👹', cor: '#7a1a1a', voz: 'Thunder-PlayAI' },
  'Mac Rónán':        { icon: '🌿', cor: '#3a6a3a', voz: 'Briggs-PlayAI'  },
  'Ruzalka':          { icon: '💧', cor: '#306a8a', voz: 'Nova-PlayAI'    },
  'Blunkin':          { icon: '🦎', cor: '#4a5a2a', voz: 'Fritz-PlayAI'   },
  'Drizzle':          { icon: '🦎', cor: '#5a6a3a', voz: 'Fritz-PlayAI'   },
  'Rootflayer':       { icon: '🌳', cor: '#3a2a1a', voz: 'Thunder-PlayAI' },
};

function getNpcData(nome) {
  const key = Object.keys(NPC_DATA).find(
    k => nome.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(nome.toLowerCase())
  );
  return key ? NPC_DATA[key] : { icon: '👤', cor: '#4a5a70', voz: 'Fritz-PlayAI' };
}

function extrairFalas(txt) {
  const falas = [];
  const re = /^\s*FALA:\s*\[([^\|]+)\|"([^"]+)"\]/gim;
  let m;
  while ((m = re.exec(txt)) !== null) {
    falas.push({ nome: m[1].trim(), texto: m[2].trim() });
  }
  return falas;
}

function normalizarFalas(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.values(raw).filter(Boolean);
}

function parsearSegmentos(txt) {
  const segs = [];
  const linhas = txt.split('\n');
  let acum = [];
  linhas.forEach(linha => {
    const m = linha.match(/^\s*FALA:\s*\[([^\|]+)\|"([^"]+)"\]/i);
    if (m) {
      const t = acum.join('\n').trim();
      if (t) segs.push({ tipo: 'texto', conteudo: t });
      acum = [];
      segs.push({ tipo: 'fala', nome: m[1].trim(), texto: m[2].trim() });
    } else {
      acum.push(linha);
    }
  });
  const resto = acum.join('\n').trim();
  if (resto) segs.push({ tipo: 'texto', conteudo: resto });
  return segs;
}

function chuncarTexto(txt, maxWords = 50) {
  const palavras = txt.split(/\s+/).filter(Boolean);
  if (palavras.length <= maxWords) return [txt];
  const chunks = [];
  for (let i = 0; i < palavras.length; i += maxWords) {
    chunks.push(palavras.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

function renderizarSegmentos(container, segs, falas) {
  const items = [];
  segs.forEach(s => {
    if (s.tipo === 'texto') {
      chuncarTexto(s.conteudo, 50).forEach(c => { if (c.trim()) items.push({ tipo:'chunk', texto:c }); });
    } else {
      items.push({ tipo:'fala', nome: s.nome, texto: s.texto });
    }
  });
  if (!items.length) return;

  if (items.length === 1 && items[0].tipo === 'chunk') {
    const p = document.createElement('p');
    p.className = 'narr-chunk';
    p.textContent = items[0].texto;
    container.appendChild(p);
    narrarTexto(items[0].texto);
    return;
  }

  let idx = 0;
  function proxItem() {
    if (idx >= items.length) return;
    const it = items[idx++];
    if (it.tipo === 'chunk') {
      const p = document.createElement('p');
      p.className = 'narr-chunk';
      p.textContent = it.texto;
      container.appendChild(p);
      scrollDown();
      if (idx < items.length) {
        narrarTexto(it.texto, () => {
          const btn = document.createElement('button');
          btn.className = 'btn-continuar-narr';
          btn.textContent = '▶ Continuar';
          btn.onclick = () => { btn.remove(); proxItem(); };
          container.appendChild(btn);
          scrollDown();
        });
      } else {
        narrarTexto(it.texto);
      }
    } else {
      // Bolha inline permanente na história (para releitura cronológica)
      const npc    = getNpcData(it.nome);
      const bubble = document.createElement('div');
      bubble.className = 'dialogo-inline';
      bubble.innerHTML = `
        <div class="dialogo-inline-icon" style="background:${npc.cor}22">${npc.icon}</div>
        <div class="dialogo-inline-body">
          <div class="dialogo-inline-nome">${it.nome}</div>
          <div class="dialogo-inline-texto">"${it.texto}"</div>
        </div>`;
      container.appendChild(bubble);
      scrollDown();
      // Narra a fala (sem bloquear — usuário clica para continuar)
      narrarTexto(it.texto);
      const btn = document.createElement('button');
      btn.className = 'btn-continuar-narr';
      btn.textContent = '▶ Continuar';
      btn.onclick = () => { btn.remove(); proxItem(); };
      container.appendChild(btn);
      scrollDown();
    }
  }
  proxItem();
}

// ═══════════════════════════════════════════════════════════════
//  PAINEL DE PERÍCIAS
// ═══════════════════════════════════════════════════════════════
window.toggleSkillsPanel = function() {
  const panel = document.getElementById('skills-panel');
  if (!panel) return;
  if (panel.style.display === 'flex') { panel.style.display = 'none'; return; }
  const eu = _jogadoresCache[myUid];
  if (!eu) return;
  const cls = CLASSES[eu.classe];
  const hab = cls?.habilidade;
  const fmt = v => (v >= 0 ? '+' : '') + v;
  let html = `<div class="skills-header"><span class="skills-title">${cls?.icon||'⚔️'} ${cls?.nome||eu.classe}</span><button class="skills-close" onclick="toggleSkillsPanel()">✕</button></div>`;
  html += `<div class="skills-attrs">`;
  ['STR','DEX','CON','INT','WIS','CHA'].forEach(a => {
    const lbl = {STR:'FOR',DEX:'DES',CON:'CON',INT:'INT',WIS:'SAB',CHA:'CAR'}[a];
    html += `<span>${lbl} <strong>${eu[a]}</strong> <small>${fmt(Math.floor((eu[a]-10)/2))}</small></span>`;
  });
  html += `</div>`;
  html += `<div class="skills-derived"><span>❤️ PV ${eu.hp}/${eu.maxHp}</span><span>🛡️ CA ${eu.ac}</span><span>⚡ ${fmt(eu.init)}</span><span>Fort ${fmt(eu.fort)}</span><span>Ref ${fmt(eu.ref)}</span><span>Von ${fmt(eu.will)}</span></div>`;
  if (hab) html += `<div class="skills-feat"><div class="skills-feat-nome">⚡ ${hab.nome}</div><div class="skills-feat-desc">${hab.desc}</div></div>`;
  if (eu.pericias?.length) {
    html += `<div class="skills-pericia-list">`;
    eu.pericias.forEach(k => {
      const per = PERICIAS[k];
      if (per) html += `<div class="skills-pericia"><span class="per-icon">${per.icon}</span><div><strong>${per.nome}</strong><div class="per-desc">${per.desc}</div></div></div>`;
    });
    html += `</div>`;
  }
  panel.innerHTML = html;
  panel.style.display = 'flex';
};

// ═══════════════════════════════════════════════════════════════
//  LOBBY — SELEÇÃO DE CLASSE, GÊNERO E PERÍCIAS (AD&D)
// ═══════════════════════════════════════════════════════════════
function atualizarPreview() {
  const cls = CLASSES[_selectedClass];
  if (!cls) return;
  const d   = dndDerivados(cls);
  const fmt = v => (v >= 0 ? '+' : '') + v;

  document.getElementById('prev-STR').textContent     = cls.STR;
  document.getElementById('prev-DEX').textContent     = cls.DEX;
  document.getElementById('prev-CON').textContent     = cls.CON;
  document.getElementById('prev-INT').textContent     = cls.INT;
  document.getElementById('prev-WIS').textContent     = cls.WIS;
  document.getElementById('prev-CHA').textContent     = cls.CHA;
  document.getElementById('prev-STR-mod').textContent = fmt(dndMod(cls.STR));
  document.getElementById('prev-DEX-mod').textContent = fmt(dndMod(cls.DEX));
  document.getElementById('prev-CON-mod').textContent = fmt(dndMod(cls.CON));
  document.getElementById('prev-INT-mod').textContent = fmt(dndMod(cls.INT));
  document.getElementById('prev-WIS-mod').textContent = fmt(dndMod(cls.WIS));
  document.getElementById('prev-CHA-mod').textContent = fmt(dndMod(cls.CHA));
  document.getElementById('prev-HP').textContent      = d.hp;
  document.getElementById('prev-AC').textContent      = d.ac;
  document.getElementById('prev-Init').textContent    = fmt(d.init);
  document.getElementById('prev-Fort').textContent    = fmt(d.fort);
  document.getElementById('prev-Ref').textContent     = fmt(d.ref);
  document.getElementById('prev-Will').textContent    = fmt(d.will);

  const feat = document.getElementById('class-feature-lbl');
  if (feat) feat.textContent = `⚔ ${cls.habilidade.nome} — ${cls.habilidade.desc}`;

  const sprite = document.getElementById('char-sprite');
  if (sprite) sprite.src = `sprites/${_selectedClass}_${_selectedGender}.png`;
}

function renderFeatGrid() {
  const grid = document.getElementById('adv-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(PERICIAS).map(([k, v]) => {
    const sel = _selectedAdvs.has(k);
    return `<button class="adv-chip${sel ? ' selected' : ''}" onclick="toggleAdv('${k}')" title="${v.desc}">
      ${v.icon} ${v.nome} <span class="chip-attr">${v.attr}</span>
    </button>`;
  }).join('');
  atualizarPreview();
}

window.toggleAdv = function(k) {
  if (_selectedAdvs.has(k)) {
    _selectedAdvs.delete(k);
  } else {
    if (_selectedAdvs.size >= 2) { toast('Máximo 2 perícias.', 1500); return; }
    _selectedAdvs.add(k);
  }
  renderFeatGrid();
};

window.toggleGenero = function(g) {
  _selectedGender = g;
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.toggle('active', b.dataset.gender === g));
  const sprite = document.getElementById('char-sprite');
  if (sprite) sprite.src = `sprites/${_selectedClass}_${g}.png`;
};

document.querySelectorAll('.class-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _selectedClass = btn.dataset.class;
    _selectedAdvs  = new Set();
    renderFeatGrid();
  });
});

// ═══════════════════════════════════════════════════════════════
//  API KEY
// ═══════════════════════════════════════════════════════════════
window.salvarApiKey = function() {
  const val = document.getElementById('api-input')?.value?.trim();
  if (!val) return;
  localStorage.setItem('rpg_groq_key', val);
  const st = document.getElementById('api-status');
  if (st) { st.textContent = '✓ Salva'; setTimeout(() => st.textContent = '', 2000); }
};

function pedirApiKey(cb) {
  _apiKeyPendingCb = cb;
  document.getElementById('modal-apikey').style.display = 'flex';
}

window.confirmarApiKeyModal = function() {
  const val = document.getElementById('modal-api-input')?.value?.trim();
  if (!val) return;
  localStorage.setItem('rpg_groq_key', val);
  document.getElementById('modal-apikey').style.display = 'none';
  if (_apiKeyPendingCb) { _apiKeyPendingCb(); _apiKeyPendingCb = null; }
};

// ═══════════════════════════════════════════════════════════════
//  CAMPANHA — Carregar dados
// ═══════════════════════════════════════════════════════════════
async function carregarCampanha() {
  try {
    const res = await fetch('campanhas/beast-of-black-keep/campanha.json');
    if (!res.ok) return;
    _campanha = await res.json();
    const el = document.getElementById('campaign-name');
    if (el && _campanha) el.textContent = `📖 ${_campanha.titulo}`;
  } catch(e) {
    console.warn('Campanha não carregada:', e);
  }
}

function buildCampaignContext() {
  if (!_campanha) return '';

  const npcs = Object.values(_campanha.npcs).map(n =>
    `• ${n.nome} [${n.papel}]: ${(n.personalidade || '').substring(0, 100)}`
  ).join('\n');

  const regras = _campanha.regras_narracao.map(r => '• ' + r).join('\n');

  return `
═══ CAMPANHA: "${_campanha.titulo}" ═══
${_campanha.prompt_sistema}

REGRAS DO NARRADOR:
${regras}

NPCS PRINCIPAIS (conhecimento e comportamento):
${npcs}

MISSÃO DOS JOGADORES:
Rastrear os Grimhollow Thools — monstros semelhantes a ogros que atacam Mhoried. Um deles é o Duque Oswald Laskaris, amaldiçoado. O verdadeiro inimigo é o Rei Chutter (ettin de duas cabeças, feiticeiro) que planeja invadir as cidades do norte. Choir o Necromante age nas sombras.

CURA DE OSWALD (ingredientes para Mac Rónán ou Mac Rónán ritual):
• Gillshade (Gruta Afogada): respirar água. Ingrediente 1.
• Greybane (Caçada do Manticora): restaura memória. Ingrediente 2.
• Cogumelos de Log-Wife (próx. Carcaça da Larva): Ingrediente 3.
• Starshade Bloom (Twinfold Hollow): cura maldição sozinha (mais difícil de remover).
• Pó de Sabedoria: restaura memórias de Oswald temporariamente — fica pacifista e confuso.

IDENTIFICAR OSWALD:
• Marca de nascença de hayberry no ombro
• Dedo indicador maior que o polegar (Finn Willowheel o sapateiro sabe disso)
• Pó de Sabedoria ou chá de greybane: memórias retornam brevemente

ESTADO INICIAL DA CAMPANHA: ${_campanha.estado_inicial.localizacao} — ${_campanha.estado_inicial.momento}
`;
}

// Preenche input se já tiver chave
window.addEventListener('DOMContentLoaded', () => {
  const k = getApiKey();
  const el = document.getElementById('api-input');
  if (el && k) { el.value = k; }
  const st = document.getElementById('api-status');
  if (st && k) st.textContent = '✓ Chave salva';

  document.getElementById('action-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarAcao(); }
  });

  renderFeatGrid();
  carregarCampanha();
});

// ═══════════════════════════════════════════════════════════════
//  SALA — CRIAR / ENTRAR
// ═══════════════════════════════════════════════════════════════
function getDadosPersonagem() {
  const nome = document.getElementById('char-nome')?.value?.trim();
  if (!nome) { document.getElementById('lobby-error').textContent = 'Digite o nome do personagem.'; return null; }
  const cl  = _selectedClass || 'guerreiro';
  const cls = CLASSES[cl];
  const d   = dndDerivados(cls);
  return {
    nome, classe: cl, sexo: _selectedGender,
    STR: cls.STR, DEX: cls.DEX, CON: cls.CON,
    INT: cls.INT, WIS: cls.WIS, CHA: cls.CHA,
    hp: d.hp, maxHp: d.hp,
    ac: d.ac, init: d.init,
    fort: d.fort, ref: d.ref, will: d.will,
    pericias: [..._selectedAdvs],
    vivo: true, consciente: true
  };
}

window.criarSala = async function() {
  const p = getDadosPersonagem();
  if (!p) return;
  const codigo = codigoAleatorio();
  myNome  = p.nome;
  myClasse = p.classe;
  mySala  = codigo;
  amIHost = true;

  await set(ref(db, `salas/${codigo}`), {
    config: { host: myUid, estado: 'lobby', rodada: 0, criadoEm: serverTimestamp() },
    jogadores: { [myUid]: { ...p, uid: myUid, ativo: true } }
  });
  onDisconnect(ref(db, `salas/${codigo}/jogadores/${myUid}/ativo`)).set(false);
  irParaJogo(codigo);
};

window.entrarSala = async function() {
  const p    = getDadosPersonagem();
  if (!p) return;
  const code = document.getElementById('code-input')?.value?.trim().toUpperCase();
  if (!code) { document.getElementById('lobby-error').textContent = 'Digite o código da sala.'; return; }

  const snap = await get(ref(db, `salas/${code}`));
  if (!snap.exists()) { document.getElementById('lobby-error').textContent = 'Sala não encontrada.'; return; }

  const data = snap.val();
  myNome  = p.nome;
  myClasse = p.classe;
  mySala  = code;
  amIHost = data.config?.host === myUid;

  const existing = data.jogadores?.[myUid];
  if (existing) {
    await update(ref(db, `salas/${code}/jogadores/${myUid}`), { ativo: true, nome: p.nome, classe: p.classe, sexo: p.sexo });
  } else {
    await set(ref(db, `salas/${code}/jogadores/${myUid}`), { ...p, uid: myUid, ativo: true });
  }
  onDisconnect(ref(db, `salas/${code}/jogadores/${myUid}/ativo`)).set(false);
  irParaJogo(code);
};

// ═══════════════════════════════════════════════════════════════
//  IR PARA JOGO
// ═══════════════════════════════════════════════════════════════
function irParaJogo(codigo) {
  document.getElementById('screen-lobby').style.display = 'none';
  document.getElementById('screen-game').style.display  = 'flex';
  document.getElementById('room-code').textContent = codigo;

  if (unsubSala) unsubSala();
  unsubSala = onValue(ref(db, `salas/${codigo}`), snap => {
    if (!snap.exists()) return;
    const data = snap.val();
    const jogadores = data.jogadores || {};
    const config    = data.config    || {};
    const historia  = data.historia  || {};
    const inimigos  = data.inimigos  || {};

    amIHost = config.host === myUid;

    // Turno
    const rodEl = document.getElementById('round-display');
    if (rodEl) rodEl.textContent = config.rodada ? `Rodada ${config.rodada}` : '';

    _jogadoresCache = jogadores;
    renderizarJogadores(jogadores, config);
    renderizarInimigos(inimigos);
    renderizarHistoria(historia, jogadores);
    atualizarInputArea(jogadores[myUid], config);

    // Intro slides: abrir para todos quando estado = 'intro'
    if (config.estado === 'intro' && !_introAtivo) {
      iniciarIntroSlides(jogadores);
    }
    // Fechar intro quando estado mudar para qualquer outra coisa
    if (config.estado !== 'intro' && _introAtivo) {
      fecharIntro();
    }

    // Host inicia narração automaticamente se lobby com jogadores prontos
    if (amIHost && config.estado === 'lobby' && Object.keys(jogadores).length > 0) {
      const iniciarWrap = document.getElementById('btn-iniciar-wrap');
      if (iniciarWrap) iniciarWrap.style.display = 'block';
    }

    // Host narra quando estado = 'aguardando' e todos enviaram ação
    if (amIHost && config.estado === 'aguardando') {
      const ativos = Object.values(jogadores).filter(j => j.vivo && j.consciente && j.ativo && !j.ausente);
      const todosEnviaram = ativos.length > 0 && ativos.every(j => j.acao1 != null);
      if (todosEnviaram && !chamandoIA) chamarIA(jogadores, data);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  RENDERIZAR JOGADORES
// ═══════════════════════════════════════════════════════════════
function renderizarJogadores(jogadores, config) {
  const bar = document.getElementById('players-bar');
  if (!bar) return;
  bar.innerHTML = Object.values(jogadores).map(j => {
    const isMe  = j.uid === myUid;
    const hpPct = Math.round((j.hp / (j.maxHp||1)) * 100);
    const hpCls = hpPct < 30 ? 'low' : 'ok';
    const cls   = CLASSES[j.classe];
    const icon  = cls?.icon || '⚔️';
    const perIcons = (j.pericias||[]).map(k => PERICIAS[k]?.icon || '').join('');
    return `<div class="player-chip ${isMe ? 'me' : ''} ${j.ativo === false ? 'offline' : ''} ${j.ausente ? 'ausente' : ''}">
      <span>${icon}</span>
      <span class="chip-name">${j.nome}</span>
      ${j.ausente ? '<span class="chip-ausente">outra cena</span>' : `<span class="chip-hp ${hpCls}">PV ${j.hp}/${j.maxHp}</span>`}
      ${!j.ausente && j.ac != null ? `<span class="chip-hp" style="color:var(--blue)">CA ${j.ac}</span>` : ''}
      ${perIcons ? `<span class="chip-adv">${perIcons}</span>` : ''}
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  RENDERIZAR INIMIGOS
// ═══════════════════════════════════════════════════════════════
function renderizarInimigos(inimigos) {
  const bar = document.getElementById('enemies-bar');
  if (!bar) return;
  const vivos = Object.values(inimigos).filter(i => i.hp > 0);
  bar.style.display = vivos.length ? 'flex' : 'none';
  bar.innerHTML = vivos.map(ini => {
    const pct = Math.round((ini.hp / ini.maxHp) * 100);
    return `<div class="enemy-chip">
      <span>${ini.icon || '👹'}</span>
      <span>${ini.nome}</span>
      <div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:${pct}%"></div></div>
      <span style="font-size:9px;color:var(--text3)">${ini.hp}/${ini.maxHp}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  RENDERIZAR HISTÓRIA
// ═══════════════════════════════════════════════════════════════
let _renderedKeys = new Set();

function renderizarHistoria(historia, jogadores) {
  const el = document.getElementById('story-content');
  if (!el) return;
  const entries = Object.entries(historia).sort(([,a],[,b]) => (a.ts||0)-(b.ts||0));
  let adicionou = false;

  entries.forEach(([key, entry]) => {
    if (_renderedKeys.has(key)) return;
    _renderedKeys.add(key);
    adicionou = true;

    const div = document.createElement('div');
    if (entry.role === 'model') {
      div.className = 'msg msg-gm';
      const falas = normalizarFalas(entry.falas);
      const segs  = parsearSegmentos(entry.content);
      renderizarSegmentos(div, segs, falas);
    } else if (entry.role === 'user') {
      const j   = Object.values(jogadores).find(j => j.uid === entry.uid);
      const cls = CLASSES[j?.classe] || {};
      div.className = 'msg msg-player';
      div.innerHTML = `
        <div class="player-bubble-header">
          <span class="player-bubble-icon">${cls.icon || '⚔️'}</span>
          <span class="player-bubble-nome">${j?.nome || 'Jogador'}</span>
        </div>
        <div class="player-bubble-acao">${entry.content}</div>`;
    } else if (entry.role === 'system') {
      div.className = 'msg msg-system';
      div.textContent = entry.content;
    } else if (entry.role === 'dados') {
      div.className = 'msg msg-dados';
      div.textContent = entry.content;
    } else {
      return;
    }
    el.appendChild(div);
  });

  if (adicionou) scrollDown();
}

// ═══════════════════════════════════════════════════════════════
//  INPUT AREA
// ═══════════════════════════════════════════════════════════════
function atualizarInputArea(eu, config) {
  const btn        = document.getElementById('btn-send');
  const status     = document.getElementById('action-status');
  const iniciarWrap = document.getElementById('btn-iniciar-wrap');

  if (!eu) return;

  const jaEnviou = eu.acao1 != null;
  const narrando = config.estado === 'narrando' || config.estado === 'iniciando';
  const morto    = !eu.vivo || !eu.consciente;

  if (btn) btn.disabled = jaEnviou || narrando || morto;

  if (morto)         setActionStatus('Seu personagem está fora de combate.');
  else if (narrando) setActionStatus('⏳ Narrando...');
  else if (jaEnviou) setActionStatus('⏳ Aguardando os outros jogadores...');
  else               setActionStatus('');

  atualizarPromptAcao(eu, config);

  if (iniciarWrap && config.estado !== 'lobby') iniciarWrap.style.display = 'none';
}

function atualizarPromptAcao(eu, config) {
  const storyContent = document.getElementById('story-content');
  if (!storyContent) return;

  let card = document.getElementById('action-prompt-card');
  const deveExibir = eu && config.estado === 'aguardando' && eu.acao1 == null && eu.vivo && eu.consciente;

  if (!deveExibir) {
    if (card) card.remove();
    return;
  }

  if (!card) {
    card = document.createElement('div');
    card.id = 'action-prompt-card';
    card.className = 'action-prompt-card';
    card.innerHTML = `
      <div class="apc-icon">⚔</div>
      <div class="apc-body">
        <div class="apc-title">Declare sua ação</div>
        <div class="apc-sub">O que o seu personagem faz agora?</div>
      </div>
      <div class="apc-arrow">↓</div>`;
    storyContent.appendChild(card);
    scrollDown();
  }
}

// ═══════════════════════════════════════════════════════════════
//  ENVIAR AÇÃO
// ═══════════════════════════════════════════════════════════════
window.enviarAcao = async function() {
  const input = document.getElementById('action-input');
  const acao  = input?.value?.trim();
  if (!acao || !mySala) return;

  input.value = '';
  await push(ref(db, `salas/${mySala}/historia`), { role:'user', content: acao, uid: myUid, ts: Date.now() });
  await update(ref(db, `salas/${mySala}/jogadores/${myUid}`), { acao1: acao });
};

// ═══════════════════════════════════════════════════════════════
//  RESET
// ═══════════════════════════════════════════════════════════════
window.resetarSala = async function() {
  if (!mySala || !amIHost) { toast('Só o host pode resetar.'); return; }
  if (!confirm('Resetar a sala?')) return;
  _renderedKeys = new Set();
  const jogadores = (await get(ref(db, `salas/${mySala}/jogadores`))).val() || {};
  const ups = {};
  ups[`salas/${mySala}/historia`]  = null;
  ups[`salas/${mySala}/inimigos`]  = null;
  ups[`salas/${mySala}/config/estado`]  = 'lobby';
  ups[`salas/${mySala}/config/rodada`]  = 0;
  Object.keys(jogadores).forEach(uid => {
    const j   = jogadores[uid];
    const cls = CLASSES[j.classe] || CLASSES.guerreiro;
    const d   = dndDerivados(cls);
    ups[`salas/${mySala}/jogadores/${uid}/hp`]    = d.hp;
    ups[`salas/${mySala}/jogadores/${uid}/maxHp`] = d.hp;
    ups[`salas/${mySala}/jogadores/${uid}/ac`]    = d.ac;
    ups[`salas/${mySala}/jogadores/${uid}/acao1`] = null;
    ups[`salas/${mySala}/jogadores/${uid}/vivo`]  = true;
    ups[`salas/${mySala}/jogadores/${uid}/consciente`] = true;
  });
  await update(ref(db), ups);
  document.getElementById('story-content').innerHTML = '';
};

// ═══════════════════════════════════════════════════════════════
//  VOZ — GROQ TTS
// ═══════════════════════════════════════════════════════════════
window.toggleVoz = function() {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('rpg_voice', voiceEnabled ? '1' : '0');
  const btn = document.getElementById('voice-btn');
  if (btn) btn.textContent = voiceEnabled ? '🔊' : '🔇';
  if (!voiceEnabled) {
    voiceQueue = []; voiceBusy = false;
    setVoiceIndicator(false);
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  toast(voiceEnabled ? '🔊 Narração ativada' : '🔇 Narração desativada', 2000);
};

function setVoiceIndicator(on) {
  const el = document.getElementById('voice-indicator');
  if (el) el.className = on ? 'speaking' : '';
}

function narrarTexto(texto, afterCb) {
  _afterNarrationCb = afterCb || null;
  if (!voiceEnabled) {
    if (_afterNarrationCb) { const cb = _afterNarrationCb; _afterNarrationCb = null; cb(); }
    return;
  }
  voiceQueue = [];
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  voiceBusy = false;
  voiceQueue.push(texto);
  _nextUtterance();
}

function _nextUtterance() {
  if (!voiceQueue.length) {
    voiceBusy = false;
    setVoiceIndicator(false);
    if (_afterNarrationCb) { const cb = _afterNarrationCb; _afterNarrationCb = null; cb(); }
    return;
  }
  voiceBusy = true;
  setVoiceIndicator(true);
  const texto = voiceQueue.shift();
  const limpo = texto.replace(/<[^>]+>/g,'').replace(/[*#_`~]/g,'').replace(/\s+/g,' ').trim().substring(0,800);
  if (!limpo) { _nextUtterance(); return; }

  const apiKey = getApiKey();
  if (!apiKey) { _narrarWebSpeech(limpo); return; }

  fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
    body: JSON.stringify({ model:'playai-tts', input: limpo, voice:'Dorian-PlayAI', response_format:'mp3', speed:1.35 })
  }).then(async res => {
    if (!res.ok) { _narrarWebSpeech(limpo); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); _currentAudio = null; _nextUtterance(); };
    audio.onerror = () => _nextUtterance();
    audio.play().catch(() => _narrarWebSpeech(limpo));
  }).catch(() => _narrarWebSpeech(limpo));
}

function _narrarWebSpeech(texto) {
  if (!window.speechSynthesis) { _nextUtterance(); return; }
  const utt = new SpeechSynthesisUtterance(texto);
  const voz = speechSynthesis.getVoices().find(v => v.lang.startsWith('pt')) || null;
  if (voz) utt.voice = voz;
  utt.rate = 1.45; utt.pitch = 0.82;
  utt.onend = utt.onerror = () => _nextUtterance();
  speechSynthesis.speak(utt);
}

// ═══════════════════════════════════════════════════════════════
//  RETRY UI
// ═══════════════════════════════════════════════════════════════
function mostrarRetryUI(tentativa, waitMs) {
  const el = document.getElementById('retry-ui');
  if (el) {
    el.style.display = 'block';
    document.getElementById('retry-msg').textContent = `Tentativa ${tentativa}/10 — aguardando ${waitMs/1000}s...`;
  }
}
function ocultarRetryUI() {
  const el = document.getElementById('retry-ui');
  if (el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
//  PARSEAR STATS (inimigos / HP)
// ═══════════════════════════════════════════════════════════════
async function processarStats(resposta, jogadores, inimigos) {
  const ups = {};
  const statsLine = resposta.match(/STATS:\s*([^\n]+)/i)?.[1] || '';

  // Criar/atualizar inimigos
  [...statsLine.matchAll(/\[INIMIGO:([^:]+):(\d+):(\d+):([^\]]+)\]/gi)].forEach(([,nome,hp,maxHp,icon]) => {
    const key = nome.trim().replace(/\W/g,'_');
    ups[`salas/${mySala}/inimigos/${key}`] = {
      nome: nome.trim(), hp: +hp, maxHp: +maxHp, icon: icon.trim()
    };
  });

  // Atualizar HP inimigo
  [...resposta.matchAll(/\[HP:([^:]+):(\d+)\]/gi)].forEach(([,nome,hp]) => {
    const key = nome.trim().replace(/\W/g,'_');
    const ini = inimigos[key] || Object.values(inimigos).find(i => i.nome === nome.trim());
    if (ini) {
      const k = Object.entries(inimigos).find(([,v]) => v === ini)?.[0] || key;
      ups[`salas/${mySala}/inimigos/${k}/hp`] = +hp;
    }
  });

  // Matar inimigo
  [...resposta.matchAll(/\[MATAR:([^\]]+)\]/gi)].forEach(([,nome]) => {
    const ini = Object.entries(inimigos).find(([,v]) => v.nome === nome.trim());
    if (ini) ups[`salas/${mySala}/inimigos/${ini[0]}/hp`] = 0;
  });

  // Atualizar HP jogador
  [...resposta.matchAll(/\[JOGADOR:([^:]+):(\d+)\]/gi)].forEach(([,nome,hp]) => {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) ups[`salas/${mySala}/jogadores/${entry[0]}/hp`] = Math.max(0, +hp);
  });

  // Marcar jogador como ausente da cena atual
  [...resposta.matchAll(/\[AUSENTE:([^\]]+)\]/gi)].forEach(([,nome]) => {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) ups[`salas/${mySala}/jogadores/${entry[0]}/ausente`] = true;
  });

  // Marcar jogador como presente novamente
  [...resposta.matchAll(/\[PRESENTE:([^\]]+)\]/gi)].forEach(([,nome]) => {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) ups[`salas/${mySala}/jogadores/${entry[0]}/ausente`] = false;
  });

  if (Object.keys(ups).length) await update(ref(db), ups);
}

// ═══════════════════════════════════════════════════════════════
//  GROQ — chamarOpenAI
// ═══════════════════════════════════════════════════════════════
async function chamarOpenAI(systemPrompt, history, userMsg, onRetry, maxTokens = 600) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const messages = [
    { role:'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content || '' })),
    { role:'user', content: userMsg }
  ];

  const body = JSON.stringify({ model:'llama-3.3-70b-versatile', messages, temperature:0.85, max_tokens: maxTokens });

  for (let t = 1; t <= 10; t++) {
    if (t > 1) {
      const wait = Math.min(t * 2000, 16000);
      if (onRetry) onRetry(t, wait);
      await new Promise(r => setTimeout(r, wait));
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
        body
      });
      const d = await res.json();
      if (d.error) {
        if (/rate.limit|overload|529|503/i.test(d.error.message||'') && t < 10) continue;
        toast(`Erro IA: ${(d.error.message||'').substring(0,80)}`);
        return null;
      }
      return d.choices?.[0]?.message?.content || '';
    } catch {
      if (t === 10) { toast('Erro de conexão após 10 tentativas'); return null; }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  INTRO — SLIDES DE APRESENTAÇÃO DA CAMPANHA
// ═══════════════════════════════════════════════════════════════
function getIntroSlides(nomes) {
  return [
    { icone: '🏰', titulo: 'O Reino de Mhoried',
      texto: 'O reino de Mhoried celebra a colheita de outono. Sob a Arbor Aeterna — a árvore ancestral que fertiliza as terras há milênios — o mercado fervilha com avelãs, tapeçarias e prata lavrada. A jovem Duquesa Catherine Laskaris passeia entre as barracas com seu guarda-costas, Sir Gregoras Pellos.' },
    { icone: '⚔️', titulo: 'Os Aventureiros',
      texto: `Presentes no festival estão vocês: ${nomes}. Aventureiros de ofícios distintos, reunidos pelo acaso numa tarde de outono. O velho Bispo Methodios abençoa a colheita enquanto crianças brincam nas raízes imensas da Árvore. Uma tarde perfeita... até a primeira criança gritar.` },
    { icone: '🪨', titulo: 'O Ataque',
      texto: 'Espantalhos emergem dos campos ao sul — construtos de estopa podre e galhos partidos, olhos de brasa, brandindo foices enferrujadas. Eles arrancam barracas, aterrorizam cidadãos e arranham a casca da Árvore Eterna com garras de ferro. O caos explode no coração do festival.' },
    { icone: '🗡️', titulo: 'Gregoras Fala',
      texto: 'Com os espantalhos destruídos e os feridos atendidos, Sir Gregoras Pellos se aproxima. O guarda-costas da Duquesa é um homem de meia-idade com cicatrizes antigas e olhos cansados. Oferece cidra fria e pede que se afastem da multidão — tem algo que a cidade não pode ouvir.' },
    { icone: '🔮', titulo: 'A Verdade Oculta',
      texto: 'Há dois anos, o jovem Duque Oswald Laskaris partiu para estudar magia. O mestre que escolheu — Dendybar, o Manchado — o transformou em monstro como punição. Oswald vive agora nas Blackwoods, entre os Grimhollow Thools. A Duquesa proíbe ataques diretos: ainda há esperança de salvá-lo.' },
    { icone: '📜', titulo: 'A Missão',
      texto: 'Gregoras pede que entrem nas Blackwoods, rastreiem a toca dos Thools e encontrem Oswald — identificável por uma marca de fruto de hayberry no ombro esquerdo. Salvem-no se possível. Se não houver esperança, ponham fim à sua miséria. E descubram quem planeja os próximos ataques.' },
    { icone: '💰', titulo: 'A Recompensa',
      texto: '5.000 moedas de prata pagas pelos mercadores de Mhoried pelo fim dos ataques. Se Oswald voltar vivo, a Duquesa concede 100 hectares de terra fértil a cada herói. Gregoras menciona Hobbleboot Sam — um guia local por 100 pratas, ou um mapa rudimentar por apenas 10.' },
    { icone: '🌲', titulo: 'A Partida',
      texto: '"As Blackwoods começam a poucas milhas daqui," diz Gregoras, apontando para o sul. "Algo naquelas matas planeja o próximo ataque — e desta vez pode ser maior." Ele olha para cada um de vocês. "Oswald sofre. Mhoried sofre. Vocês são a única esperança que nos resta."' }
  ];
}

function iniciarIntroSlides(jogadores) {
  const nomes = Object.values(jogadores)
    .map(j => `${j.nome} (${CLASSES[j.classe]?.nome || j.classe})`)
    .join(', ');
  _introSlides = getIntroSlides(nomes);
  _introIdx    = 0;
  _introAtivo  = true;
  document.getElementById('intro-overlay').style.display = 'flex';
  mostrarSlide(0);
}

function mostrarSlide(idx) {
  const slide = _introSlides[idx];
  if (!slide) return;
  const total  = _introSlides.length;
  const isLast = idx === total - 1;

  document.getElementById('intro-progress').textContent = `${idx + 1} / ${total}`;
  document.getElementById('intro-icon').textContent     = slide.icone;
  document.getElementById('intro-titulo').textContent   = slide.titulo;
  document.getElementById('intro-texto').textContent    = slide.texto;

  const prevBtn = document.getElementById('btn-intro-prev');
  const nextBtn = document.getElementById('btn-intro-next');
  prevBtn.style.display = idx > 0 ? '' : 'none';

  if (isLast) {
    if (amIHost) {
      nextBtn.textContent = '⚔ Começar Aventura!';
      nextBtn.onclick = () => finalizarIntro();
    } else {
      nextBtn.textContent = '✓ Estou Pronto';
      nextBtn.disabled = false;
      nextBtn.onclick = () => { nextBtn.disabled = true; nextBtn.textContent = 'Aguardando o narrador...'; };
    }
  } else {
    nextBtn.disabled = false;
    nextBtn.textContent = 'Próximo ▶';
    nextBtn.onclick = () => avancarSlide();
  }

  narrarTexto(slide.texto);
}

window.avancarSlide = function() {
  if (_introIdx < _introSlides.length - 1) {
    _introIdx++;
    mostrarSlide(_introIdx);
  }
};

window.voltarSlide = function() {
  if (_introIdx > 0) {
    _introIdx--;
    mostrarSlide(_introIdx);
  }
};

async function finalizarIntro() {
  const nextBtn = document.getElementById('btn-intro-next');
  if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Iniciando...'; }

  try {
    const snap = await get(ref(db, `salas/${mySala}`));
    const data = snap.val();
    const jogadores = data.jogadores || {};
    const totalEsp  = Math.max(2, Object.keys(jogadores).length * 2);

    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    const nomes = Object.values(jogadores)
      .map(j => `${j.nome} (${CLASSES[j.classe]?.nome || j.classe})`).join(', ');

    const prompt = `Cena de combate: ${nomes} estão no festival de Mhoried quando espantalhos atacam. Em 2 frases curtas e impactantes, descreva o momento em que o primeiro espantalho irrompeu de entre as barracas. Tom de horror de aldeia, brutal e direto.
STATS: ${Array.from({length: totalEsp}, (_,i) => `[INIMIGO:Espantalho ${i+1}:10:10:🪨]`).join(' ')}`;

    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, {}), [], prompt, mostrarRetryUI, 150);
    ocultarRetryUI();

    if (resposta) {
      await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ts: Date.now() });
      await processarStats(resposta, jogadores, {});
    }
    await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando', rodada: 1 });
  } catch(e) {
    ocultarRetryUI();
    if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = '⚔ Começar Aventura!'; }
  }
}

function fecharIntro() {
  _introAtivo = false;
  const el = document.getElementById('intro-overlay');
  if (el) el.style.display = 'none';
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  voiceQueue = []; voiceBusy = false;
}

// ═══════════════════════════════════════════════════════════════
//  IA — INÍCIO (dispara slides de introdução)
// ═══════════════════════════════════════════════════════════════
window.chamarIAInicio = async function() {
  if (!getApiKey()) { pedirApiKey(() => chamarIAInicio()); return; }
  document.getElementById('btn-iniciar-wrap').style.display = 'none';
  const snap = await get(ref(db, `salas/${mySala}`));
  const jogadores = (snap.val()?.jogadores) || {};
  await update(ref(db, `salas/${mySala}/config`), { estado: 'intro' });
  iniciarIntroSlides(jogadores);
};

// ═══════════════════════════════════════════════════════════════
//  IA — TURNO
// ═══════════════════════════════════════════════════════════════
async function chamarIA(jogadores, data) {
  if (chamandoIA) return;
  if (!getApiKey()) { pedirApiKey(() => {}); return; }
  chamandoIA = true;

  try {
    const config  = data.config  || {};
    const inimigos = data.inimigos || {};
    const historia = data.historia || {};
    const rodada  = config.rodada || 1;

    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    // Monta histórico (últimas 10 entradas)
    const hist = Object.values(historia)
      .sort((a,b) => (a.ts||0)-(b.ts||0))
      .filter(e => e.role === 'model' || e.role === 'user')
      .slice(-10);

    // Monta mensagem das ações desta rodada
    const acoes = Object.values(jogadores)
      .filter(j => j.acao1)
      .map(j => `${j.nome}: ${j.acao1}`)
      .join('\n');

    const msg = `Rodada ${rodada}.\n\nAções dos jogadores:\n${acoes}`;

    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, inimigos), hist, msg, mostrarRetryUI);
    ocultarRetryUI();

    if (!resposta) {
      await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando' });
      return;
    }

    // Limpar ações dos jogadores + avançar rodada
    const ups = {};
    Object.keys(jogadores).forEach(uid => { ups[`salas/${mySala}/jogadores/${uid}/acao1`] = null; });
    ups[`salas/${mySala}/config/estado`] = 'aguardando';
    ups[`salas/${mySala}/config/rodada`] = rodada + 1;

    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ts: Date.now() });
    await processarStats(resposta, jogadores, inimigos);
    await update(ref(db), ups);
  } finally {
    chamandoIA = false;
    ocultarRetryUI();
  }
}

// ═══════════════════════════════════════════════════════════════
//  SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════
function buildSystemPrompt(jogadores, inimigos) {
  const jogList = Object.values(jogadores).map(j => {
    const cls = CLASSES[j.classe];
    const perStr = (j.pericias||[]).map(k => PERICIAS[k]?.nome).filter(Boolean).join(', ');
    const hab  = cls?.habilidade?.nome || '';
    const fmt  = v => (v >= 0 ? '+' : '') + v;
    return `${j.nome} (${cls?.nome||j.classe}) — FOR:${j.STR} DES:${j.DEX} CON:${j.CON} INT:${j.INT} SAB:${j.WIS} CAR:${j.CHA} | PV:${j.hp}/${j.maxHp} CA:${j.ac} Init:${fmt(j.init)}${hab ? ` | Hab:${hab}` : ''}${perStr ? ` | Perícias:${perStr}` : ''}`;
  }).join('\n');

  const iniList = Object.values(inimigos).filter(i => i.hp > 0).map(i =>
    `${i.icon||'👹'} ${i.nome} — HP:${i.hp}/${i.maxHp}`
  ).join('\n');

  const campCtx = buildCampaignContext();

  return `Você é o Narrador. Escreva em português do Brasil com drama, impacto e tom de folclore sombrio. Seja DIRETO — cada palavra conta.
${campCtx}
VOZ:
- Verbos fortes e sensoriais: "rasga", "despenca", "estala", "cheira a enxofre".
- Foque no RESULTADO das ações, não na preparação.
- ${iniList ? 'COMBATE ATIVO — máximo 50 palavras de narração.' : 'EXPLORAÇÃO — máximo 70 palavras por bloco narrativo (tags FALA não contam no limite).'}
- Mantenha o tom: a floresta observa, os NPCs têm segredos, nada é seguro.
- NUNCA termine com pergunta ao jogador. A narração termina com a consequência da cena.
- Se jogadores estiverem em locais diferentes, use [AUSENTE:nome] e [PRESENTE:nome].

JOGADORES ATIVOS:
${jogList}
${iniList ? `\nINIMIGOS EM CENA:\n${iniList}` : ''}

TAGS MECÂNICAS — SOMENTE na última linha da resposta:
STATS: [INIMIGO:nome:hp:hpMax:ícone] [HP:nome:novoHp] [MATAR:nome] [JOGADOR:nome:novoHp] [AUSENTE:nome] [PRESENTE:nome]
Exemplo: "O espantalho cai.\nSTATS: [MATAR:Espantalho 1] [JOGADOR:Aldric:8]"

DIÁLOGOS — sistema de bolhas inline. Regras OBRIGATÓRIAS:
1. Quando um NPC fala, descreva a ação de falar (terminando em dois-pontos) e coloque a tag na linha seguinte:
   FALA: [NomeExato|"frase completa do NPC"]

2. DIÁLOGO MULTI-TURNO: se a cena for uma conversa, gere múltiplas trocas com narração entre cada fala, até o diálogo se encerrar naturalmente:
   Gregoras olha ao redor antes de falar:
   FALA: [Gregoras Pellos|"As Blackwoods começam a poucas milhas daqui."]
   Ele hesita, escolhendo as palavras:
   FALA: [Gregoras Pellos|"Oswald ainda está lá dentro. Mudado, mas está."]
   O guarda-costas fecha os olhos por um momento:
   FALA: [Gregoras Pellos|"Salvem-no se puderem. Se não houver jeito... vocês saberão o que fazer."]

3. RESPOSTA A FALA DE JOGADOR: se um jogador declarou uma fala direta, narre a reação do NPC e use FALA para a resposta dele. Não deixe perguntas sem resposta.

4. Nunca suprima a fala de um NPC — se o contexto exige que ele fale, ele DEVE falar via tag FALA.
5. Coloque a fala COMPLETA do NPC na tag, não um resumo.`;
}
