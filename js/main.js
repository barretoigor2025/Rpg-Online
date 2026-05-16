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
//  GURPS — ARQUÉTIPOS, VANTAGENS E DESVANTAGENS
// ═══════════════════════════════════════════════════════════════
const ARQUETIPOS = {
  guerreiro: {
    nome: 'Guerreiro', icon: '⚔️',
    ST: 13, DX: 12, IQ: 10, HT: 12,
    descricao: 'Combatente experiente. FOR alta para dano brutal, DES sólida para acertar golpes.',
    sugeridas: ['combat_reflexes','high_pain_threshold']
  },
  mago: {
    nome: 'Mago', icon: '🔮',
    ST: 10, DX: 11, IQ: 14, HT: 10,
    descricao: 'Arcano poderoso. INT excepcional para magias. Fisicamente frágil — depende de aliados.',
    sugeridas: ['magery1','strong_will']
  },
  ladino: {
    nome: 'Ladino', icon: '🗡️',
    ST: 11, DX: 14, IQ: 11, HT: 11,
    descricao: 'Especialista furtivo. DES altíssima para ataques rápidos, esquivas e subterfúgio.',
    sugeridas: ['combat_reflexes','acute_vision']
  },
  clerigo: {
    nome: 'Clérigo', icon: '✨',
    ST: 11, DX: 11, IQ: 13, HT: 12,
    descricao: 'Curandeiro e combatente divino. INT e SAU equilibradas para cura e resistência.',
    sugeridas: ['strong_will','fit']
  },
  barbaro: {
    nome: 'Bárbaro', icon: '🪓',
    ST: 15, DX: 11, IQ: 9,  HT: 13,
    descricao: 'Força bruta da natureza. FOR máxima, SAU extraordinária. Instinto puro sobre intelecto.',
    sugeridas: ['high_pain_threshold','hard_to_kill']
  },
  arqueiro: {
    nome: 'Arqueiro', icon: '🏹',
    ST: 11, DX: 13, IQ: 11, HT: 12,
    descricao: 'Atirador preciso. DES e SAU sólidas para combate à distância e sobrevivência na floresta.',
    sugeridas: ['acute_vision','night_vision']
  }
};

const VANTAGENS = {
  combat_reflexes:    { nome: 'Reflexos de Combate',    custo: 15, icon: '⚡', desc: '+2 Testes de Medo; raramente surpreendido' },
  high_pain_threshold:{ nome: 'Alto Limiar de Dor',     custo: 10, icon: '🛡️', desc: 'Ignora penalidades de choque por ferimento' },
  magery1:            { nome: 'Magia 1',                 custo: 15, icon: '✨', desc: 'Pode usar magia; +1 em todas as magias' },
  night_vision:       { nome: 'Visão Noturna 3',         custo:  3, icon: '🌙', desc: 'Reduz penalidade de escuridão em 3' },
  fit:                { nome: 'Boa Forma',                custo:  5, icon: '💪', desc: '+1 em testes de SAU para fadiga e recuperação' },
  hard_to_kill:       { nome: 'Difícil de Matar 2',      custo:  4, icon: '❤️', desc: '+2 em testes de SAU ao beira da morte' },
  acute_vision:       { nome: 'Visão Aguçada +2',        custo:  4, icon: '🔍', desc: '+2 em Percepção visual' },
  luck:               { nome: 'Sorte',                   custo: 15, icon: '🍀', desc: 'Pode rerrolar 1 teste por hora real de jogo' },
  strong_will:        { nome: 'Força de Vontade +2',     custo:  8, icon: '🧠', desc: '+2 em testes de Vontade e resistência mental' }
};

const DESVANTAGENS = {
  bad_temper:    { nome: 'Mau Gênio',                 pts: -10, icon: '😤', desc: 'Perde o controle ao ser provocado (SAU-10)' },
  cowardice:     { nome: 'Covardia',                  pts: -10, icon: '😱', desc: '-2 em Testes de Medo; evita confronto' },
  curious:       { nome: 'Curioso',                   pts:  -5, icon: '🔎', desc: 'Precisa investigar o que é misterioso' },
  overconfident: { nome: 'Excessivamente Confiante',  pts:  -5, icon: '😏', desc: 'Subestima perigos e inimigos' }
};

function gurpsDerivados(arq) {
  const speed = ((arq.DX + arq.HT) / 4).toFixed(2);
  return {
    HP: arq.ST, maxHp: arq.ST,
    FP: arq.HT, maxFP: arq.HT,
    Will: arq.IQ, Per: arq.IQ,
    speed: parseFloat(speed),
    move: Math.floor(parseFloat(speed))
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
let _selectedDisadv = null;
let _campanha   = null;

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
    .replace(/STATS:\s*(\[(?:INIMIGO|HP|MATAR|MOV)[^\]]*\]\s*)+/gi, '')
    .replace(/\[MOV:[^\]]+\]/gi, '')
    .trim();
}

// ═══════════════════════════════════════════════════════════════
//  LOBBY — SELEÇÃO DE ARQUÉTIPO, VANTAGENS E DESVANTAGENS
// ═══════════════════════════════════════════════════════════════
function atualizarPreviewGurps() {
  const arq = ARQUETIPOS[_selectedClass];
  if (!arq) return;
  const d = gurpsDerivados(arq);

  document.getElementById('prev-ST').textContent   = arq.ST;
  document.getElementById('prev-DX').textContent   = arq.DX;
  document.getElementById('prev-IQ').textContent   = arq.IQ;
  document.getElementById('prev-HT').textContent   = arq.HT;
  document.getElementById('prev-HP').textContent   = d.HP;
  document.getElementById('prev-FP').textContent   = d.FP;
  document.getElementById('prev-Move').textContent = d.move;
  document.getElementById('prev-Will').textContent = d.Will;
  document.getElementById('prev-Per').textContent  = d.Per;
  const desc = document.getElementById('arquetipo-desc');
  if (desc) desc.textContent = arq.descricao;

  // Custo restante para mostrar quais vantagens cabem
  const pts = calcPontos();
  document.querySelectorAll('.adv-chip[data-adv]').forEach(chip => {
    const v = VANTAGENS[chip.dataset.adv];
    chip.classList.toggle('sem-pontos', v && pts + v.custo > 150 && !_selectedAdvs.has(chip.dataset.adv));
  });
}

function calcPontos() {
  const arq = ARQUETIPOS[_selectedClass] || {};
  const ST = arq.ST||10, DX = arq.DX||10, IQ = arq.IQ||10, HT = arq.HT||10;
  const attrCost = (ST-10)*10 + (DX-10)*20 + (IQ-10)*20 + (HT-10)*10;
  const advCost  = [..._selectedAdvs].reduce((s,k) => s + (VANTAGENS[k]?.custo||0), 0);
  const disadvPts= _selectedDisadv ? (DESVANTAGENS[_selectedDisadv]?.pts||0) : 0;
  return attrCost + advCost + disadvPts;
}

function renderAdvGrid() {
  const advGrid    = document.getElementById('adv-grid');
  const disadvGrid = document.getElementById('disadv-grid');
  if (!advGrid || !disadvGrid) return;

  advGrid.innerHTML = Object.entries(VANTAGENS).map(([k, v]) => {
    const sel = _selectedAdvs.has(k);
    return `<button class="adv-chip${sel?' selected':''}" data-adv="${k}" onclick="toggleAdv('${k}')">
      ${v.icon} ${v.nome} <span class="chip-cost">${v.custo}pts</span>
    </button>`;
  }).join('');

  disadvGrid.innerHTML = Object.entries(DESVANTAGENS).map(([k, v]) => {
    const sel = _selectedDisadv === k;
    return `<button class="adv-chip disadv${sel?' selected':''}" data-disadv="${k}" onclick="toggleDisadv('${k}')">
      ${v.icon} ${v.nome} <span class="chip-cost">${v.pts}pts</span>
    </button>`;
  }).join('');

  atualizarPreviewGurps();
}

window.toggleAdv = function(k) {
  if (_selectedAdvs.has(k)) {
    _selectedAdvs.delete(k);
  } else {
    if (_selectedAdvs.size >= 2) { toast('Máximo 2 vantagens.', 1500); return; }
    _selectedAdvs.add(k);
  }
  renderAdvGrid();
};

window.toggleDisadv = function(k) {
  _selectedDisadv = (_selectedDisadv === k) ? null : k;
  renderAdvGrid();
};

document.querySelectorAll('.class-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _selectedClass = btn.dataset.class;
    _selectedAdvs  = new Set();
    _selectedDisadv = null;
    renderAdvGrid();
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

  renderAdvGrid();
  carregarCampanha();
});

// ═══════════════════════════════════════════════════════════════
//  SALA — CRIAR / ENTRAR
// ═══════════════════════════════════════════════════════════════
function getDadosPersonagem() {
  const nome = document.getElementById('char-nome')?.value?.trim();
  const cl   = _selectedClass || 'guerreiro';
  const arq  = ARQUETIPOS[cl];
  if (!nome) { document.getElementById('lobby-error').textContent = 'Digite o nome do personagem.'; return null; }
  const d = gurpsDerivados(arq);
  const vantagens  = [..._selectedAdvs];
  const desvantagem = _selectedDisadv;
  return {
    nome, arquetipo: cl,
    ST: arq.ST, DX: arq.DX, IQ: arq.IQ, HT: arq.HT,
    hp: d.HP, maxHp: d.HP,
    FP: d.FP, maxFP: d.FP,
    Will: d.Will, Per: d.Per,
    speed: d.speed, move: d.move,
    vantagens, desvantagem,
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
    await update(ref(db, `salas/${code}/jogadores/${myUid}`), { ativo: true, nome: p.nome, arquetipo: p.arquetipo });
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

    renderizarJogadores(jogadores, config);
    renderizarInimigos(inimigos);
    renderizarHistoria(historia, jogadores);
    atualizarInputArea(jogadores[myUid], config);

    // Host inicia narração automaticamente se lobby com jogadores prontos
    if (amIHost && config.estado === 'lobby' && Object.keys(jogadores).length > 0) {
      const iniciarWrap = document.getElementById('btn-iniciar-wrap');
      if (iniciarWrap) iniciarWrap.style.display = 'block';
    }

    // Host narra quando estado = 'aguardando' e todos enviaram ação
    if (amIHost && config.estado === 'aguardando') {
      const ativos = Object.values(jogadores).filter(j => j.vivo && j.consciente && j.ativo);
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
    const arq   = ARQUETIPOS[j.arquetipo];
    const icon  = arq?.icon || '⚔️';
    const advIcons = (j.vantagens||[]).map(k => VANTAGENS[k]?.icon || '').join('');
    return `<div class="player-chip ${isMe ? 'me' : ''} ${j.ativo === false ? 'offline' : ''}">
      <span>${icon}</span>
      <span class="chip-name">${j.nome}</span>
      <span class="chip-hp ${hpCls}">PV ${j.hp}/${j.maxHp}</span>
      ${j.FP != null ? `<span class="chip-hp" style="color:var(--blue)">PF ${j.FP}/${j.maxFP}</span>` : ''}
      ${advIcons ? `<span class="chip-adv">${advIcons}</span>` : ''}
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
      div.textContent = entry.content;
      narrarTexto(entry.content);
    } else if (entry.role === 'user') {
      const j = Object.values(jogadores).find(j => j.uid === entry.uid);
      div.className = 'msg msg-player';
      div.innerHTML = `<span class="msg-author">${j?.nome || 'Jogador'}</span>${entry.content}`;
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

  if (morto)       setActionStatus('Seu personagem está fora de combate.');
  else if (narrando) setActionStatus('A IA está narrando...');
  else if (jaEnviou) setActionStatus('Aguardando outros jogadores...');
  else               setActionStatus('');

  if (iniciarWrap && config.estado !== 'lobby') iniciarWrap.style.display = 'none';
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
    const arq = ARQUETIPOS[j.arquetipo] || ARQUETIPOS.guerreiro;
    const d   = gurpsDerivados(arq);
    ups[`salas/${mySala}/jogadores/${uid}/hp`]    = d.HP;
    ups[`salas/${mySala}/jogadores/${uid}/maxHp`] = d.HP;
    ups[`salas/${mySala}/jogadores/${uid}/FP`]    = d.FP;
    ups[`salas/${mySala}/jogadores/${uid}/maxFP`] = d.FP;
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

function narrarTexto(texto) {
  if (!voiceEnabled) return;
  voiceQueue = [];
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  voiceBusy = false;
  voiceQueue.push(texto);
  _nextUtterance();
}

function _nextUtterance() {
  if (!voiceQueue.length) { voiceBusy = false; setVoiceIndicator(false); return; }
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
    body: JSON.stringify({ model:'playai-tts', input: limpo, voice:'Dorian-PlayAI', response_format:'mp3', speed:1.1 })
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
  utt.rate = 1.2; utt.pitch = 0.82;
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
//  IA — INÍCIO (introdução em dois atos)
// ═══════════════════════════════════════════════════════════════
window.chamarIAInicio = async function() {
  if (chamandoIA) return;
  if (!getApiKey()) { pedirApiKey(() => chamarIAInicio()); return; }
  chamandoIA = true;
  document.getElementById('btn-iniciar-wrap').style.display = 'none';

  try {
    const snap = await get(ref(db, `salas/${mySala}`));
    const data = snap.val();
    const jogadores = data.jogadores || {};
    const sysPrompt = buildSystemPrompt(jogadores, {});
    const nomes = Object.values(jogadores)
      .map(j => `${j.nome} (${CLASSES[j.classe]?.nome || j.classe})`)
      .join(', ');
    const totalEspantalhos = Math.max(2, Object.keys(jogadores).length * 2);

    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    // ── ATO 1: A cena e o ataque ──────────────────────────────
    const ato1 = _campanha
      ? `INÍCIO DA CAMPANHA "${_campanha.titulo}".
Personagens presentes: ${nomes}.

Narre em dois blocos sem títulos:

BLOCO A — A FESTA (3-4 frases):
O mercado festivo de outono de Mhoried fervilha sob os galhos dourados da Arbor Aeterna, a árvore ancestral que há milênios fertiliza as colheitas. Vendedores exibem avelãs, tapeçarias e prata lavrada. A jovem Duquesa Catherine Laskaris passeia entre as barracas acompanhada de seu guarda-costas Sir Gregoras Pellos. O velho Bispo Methodios abençoa a colheita enquanto atafulha a boca de avelãs. As crianças brincam entre as raízes imensas da árvore. Use detalhes sensoriais: sons, cheiros, texturas.

BLOCO B — O ATAQUE (4-5 frases):
De repente, uma criança grita. Um espantalho arranca o tecido de uma barraca com sua foice enferrujada — e em segundos mais surgem dos campos ao sul: construtos hediondos de estopa podre e galhos partidos, olhos de brasa, brandindo foices e carregando sacos para saquear. Alguns atacam os cidadãos. Outros arranha a casca da Árvore Eterna com garras de ferro. Os personagens estão em meio ao caos.

Tom: folclore sombrio, horror de aldeia, urgência brutal. Máximo 150 palavras no total.
OBRIGATÓRIO ao final: STATS: ${Array.from({length: totalEspantalhos}, (_,i) => `[INIMIGO:Espantalho ${i+1}:10:10:🪨]`).join(' ')}`
      : `Abertura cinematográfica de campanha de RPG medieval. Personagens: ${nomes}.
Descreva: 1) Cenário festivo (2 frases sensoriais); 2) Presságio; 3) Ataque de criaturas hostis.
Máximo 120 palavras. STATS: [INIMIGO:nome:hp:hpMax:ícone] para cada inimigo.`;

    const resp1 = await chamarOpenAI(sysPrompt, [], ato1, mostrarRetryUI, 700);
    ocultarRetryUI();
    if (!resp1) { await update(ref(db, `salas/${mySala}/config`), { estado: 'lobby' }); document.getElementById('btn-iniciar-wrap').style.display = amIHost ? 'block' : 'none'; return; }

    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resp1), ts: Date.now() });
    await processarStats(resp1, jogadores, {});

    // ── ATO 2: Após a batalha — briefing completo de Gregoras ──
    await new Promise(r => setTimeout(r, 1200));

    const ato2 = `Os espantalhos foram destruídos. Feridos são atendidos. O cheiro de estopa queimada paira no ar.

Sir Gregoras Pellos se aproxima dos personagens (${nomes}) com um copo de cidra fria para cada um e os convida para longe da multidão. Com voz baixa e grave, conta a verdade que a cidade não sabe:

Narre em três parágrafos curtos e diretos:

1. O DUQUE PERDIDO: Há dois anos, o jovem Duque Oswald Laskaris — irmão da Duquesa Catherine — partiu para estudar magia em Bannock. Confiou no mestre errado: Dendybar, o Manchado, um feiticeiro cruel e caprichoso que, em vez de ensinar, transformou Oswald num monstro semelhante a um ogro como punição por ser "indigno". A Duquesa proibiu qualquer ataque aos Thools por esperança de reverter a maldição.

2. A MISSÃO: Gregoras pede que os personagens entrem nas Blackwoods ao sul, rastreiem a toca secreta dos Grimhollow Thools, identifiquem qual deles é Oswald (uma marca de nascença em forma de fruto de hayberry no ombro pode ajudar) e — se houver como — o salvem. Se não houver esperança, que ponham fim à miséria do homem. E que descubram quem está por trás desses espantalhos e do plano de atacar a cidade.

3. A RECOMPENSA + PARTIDA: Os mercadores de Mhoried pagarão 5.000 moedas de prata pelo fim dos ataques dos Thools. Se Oswald for devolvido vivo, a Duquesa concederá cavalaria e 100 hectares de terra fértil ao norte a cada herói — terra suficiente para construir uma fazenda ou um solar. Gregoras menciona que um guia chamado Hobbleboot Sam pode acompanhá-los por 100 pratas, ou vender um mapa rudimentar por 10. Ele aponta para o sul: as Blackwoods começam a apenas algumas milhas dali.

Termine com uma fala final de Gregoras em discurso direto — sombria, esperançosa, deixando o peso da missão no ar.
Tom: grave, medieval, pessoal. Máximo 220 palavras. SEM tags STATS nesta cena.`;

    const hist1 = [{ role:'model', content: limparTags(resp1) }];
    const resp2 = await chamarOpenAI(sysPrompt, hist1, ato2, mostrarRetryUI, 900);
    ocultarRetryUI();

    if (resp2) {
      await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resp2), ts: Date.now() });
    }

    await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando', rodada: 1 });
  } finally {
    chamandoIA = false;
    ocultarRetryUI();
  }
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

    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), ts: Date.now() });
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
    const arq = ARQUETIPOS[j.arquetipo];
    const advStr = (j.vantagens||[]).map(k => VANTAGENS[k]?.nome).filter(Boolean).join(', ');
    const disStr = j.desvantagem ? DESVANTAGENS[j.desvantagem]?.nome : '';
    return `${j.nome} (${arq?.nome||j.arquetipo}) — FOR:${j.ST||'?'} DES:${j.DX||'?'} INT:${j.IQ||'?'} SAU:${j.HT||'?'} | PV:${j.hp}/${j.maxHp} PF:${j.FP||j.HT}/${j.maxFP||j.HT} Von:${j.Will||j.IQ} Per:${j.Per||j.IQ}${advStr?` | Vant:${advStr}`:''}${disStr?` | Desv:${disStr}`:''}`;
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
- ${iniList ? 'COMBATE ATIVO — máximo 80 palavras.' : 'EXPLORAÇÃO/DIÁLOGO — máximo 120 palavras.'}
- Mantenha o tom: a floresta observa, os NPCs têm segredos, nada é seguro.
- React às ações dos jogadores de forma coerente com o mundo da campanha.

JOGADORES ATIVOS:
${jogList}
${iniList ? `\nINIMIGOS EM CENA:\n${iniList}` : ''}

TAGS OBRIGATÓRIAS (inclua ao final de cada resposta quando aplicável):
• Novo inimigo em cena: STATS: [INIMIGO:nome:hp:hpMax:ícone]
• Inimigo recebe dano: STATS: [HP:NomeInimigo:novoHp]
• Inimigo morreu: STATS: [MATAR:NomeInimigo]
• Jogador recebe dano: STATS: [JOGADOR:NomeJogador:novoHp]`;
}
