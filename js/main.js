// ═══════════════════════════════════════════════════════════════
//  FIREBASE — compat SDK (carregado via script tag no HTML)
// ═══════════════════════════════════════════════════════════════
try {
  firebase.initializeApp({
    apiKey:            "AIzaSyAsn9ZFJP6QWFesfls9anBAJbAqcDMfnqg",
    authDomain:        "rpg-online-ad73f.firebaseapp.com",
    databaseURL:       "https://rpg-online-ad73f-default-rtdb.firebaseio.com",
    projectId:         "rpg-online-ad73f",
    storageBucket:     "rpg-online-ad73f.firebasestorage.app",
    messagingSenderId: "1031450807961",
    appId:             "1:1031450807961:web:369342194731ad0ae37208"
  });
} catch(e) { /* app já inicializado — reutilizar instância existente */ }
const db = firebase.database();

// Wrappers para manter a sintaxe da API modular intacta no restante do código
const ref          = (database, path) => path !== undefined ? database.ref(path) : database.ref();
const get          = (r) => r.get();
const set          = (r, val) => r.set(val);
const push         = (r, val) => val !== undefined ? r.push(val) : r.push();
const update       = (r, val) => r.update(val);
const onValue      = (r, cb) => { r.on('value', cb); return () => r.off('value', cb); };
const onDisconnect = (r) => r.onDisconnect();
const serverTimestamp = () => firebase.database.ServerValue.TIMESTAMP;

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
let _activeSlot  = parseInt(localStorage.getItem('rpg_active_slot') || '0');
let _charSlots   = new Array(8).fill(null);
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
let _kitMigrado  = false;
let _afterNarrationCb = null;
let _jogadoresCache   = {};
let _ultimoNpc        = null; // último NPC que falou, usado como ouvinte quando jogador responde
let _regras           = {};

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
    .replace(/STATS:\s*(\[(?:INIMIGO|HP|MATAR|MOV|JOGADOR|AUSENTE|PRESENTE|LESAO|XP|TITULO|POSSE|REPUTACAO|EQUIPAR|ITEM_BAG)[^\]]*\]\s*)*/gi, '')
    .replace(/\[(?:INIMIGO|MOV|AUSENTE|PRESENTE|JOGADOR|HP|MATAR|LESAO|XP|TITULO|POSSE|REPUTACAO|EQUIPAR|ITEM_BAG):[^\]]+\]/gi, '')
    .replace(/^\s*TESTAR:\s*\[.*\]\s*$/gim, '')
    .replace(/^\s*AVANÇAR\s*$/im, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extrairAvançar(txt) {
  return /^\s*AVANÇAR\s*$/im.test(txt);
}

function removerAvançar(txt) {
  return txt.replace(/^\s*AVANÇAR\s*$/im, '').replace(/\n{3,}/g, '\n\n').trim();
}

// ═══════════════════════════════════════════════════════════════
//  NPC — DADOS DE DIÁLOGO
// ═══════════════════════════════════════════════════════════════
// NPC_DATA é carregado dinamicamente de campanhas/<id>/npcs_visual.json em carregarCampanha()
let NPC_DATA = {};
// _inimigos é carregado dinamicamente de campanhas/<id>/inimigos.json em carregarCampanha()
let _inimigos = null;

function getNpcData(nome) {
  const key = Object.keys(NPC_DATA).find(
    k => nome.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(nome.toLowerCase())
  );
  return key ? NPC_DATA[key] : { icon: '👤', cor: '#4a5a70', voz: 'Fritz-PlayAI' };
}

function getInimigo(nome) {
  if (!_inimigos) return null;
  const todos = [...(_inimigos.essenciais || []), ...(_inimigos.encontros || [])];
  const n = nome.toLowerCase();
  // strip trailing number (e.g. "Espantalho 1" → "espantalho") for fuzzy match
  const nBase = n.replace(/\s+\d+$/, '').trim();
  return todos.find(e => {
    const en = e.nome.toLowerCase();
    return n.includes(en) || en.includes(n) || nBase.includes(en) || en.includes(nBase);
  }) || null;
}

function getPortraitAtaque(nome, costas = false) {
  const jog = Object.values(_jogadoresCache).find(j =>
    j.nome && (nome.toLowerCase().includes(j.nome.toLowerCase()) || j.nome.toLowerCase().includes(nome.toLowerCase()))
  );
  if (jog) return { src: `sprites/${jog.classe}_${jog.sexo || 'm'}.png`, icon: '🧑', cor: '#4a7090' };

  const ini = getInimigo(nome);
  if (ini) {
    const suf = costas ? '_costas' : '';
    return { src: `sprites/inimigo_${ini.id}${suf}.png`, icon: ini.icon || '💀', cor: ini.cor_hp || '#7a1a1a' };
  }

  const npcKey = Object.keys(NPC_DATA).find(
    k => nome.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(nome.toLowerCase())
  );
  if (npcKey) {
    const npc = NPC_DATA[npcKey];
    return { src: npc.portrait ? `sprites/${npc.portrait}.png` : '', icon: npc.icon || '👤', cor: npc.cor || '#4a5a70' };
  }
  return { src: '', icon: '💀', cor: '#7a1a1a' };
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

function extrairAtaques(txt) {
  const ataques = [];
  const re = /^\s*ATAQUE:\s*\[([^\|]+)\|([^\|]+)\|"([^"]+)"\|(sim|nao)\]/gim;
  let m;
  while ((m = re.exec(txt)) !== null) {
    ataques.push({ atacante: m[1].trim(), alvo: m[2].trim(), resultado: m[3].trim(), surpresa: m[4].trim().toLowerCase() === 'sim' });
  }
  return ataques;
}

function normalizarFalas(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.values(raw).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
//  SISTEMA DE TESTES SEQUENCIAIS
// ═══════════════════════════════════════════════════════════════
function extrairTestes(txt) {
  const testes = [];
  const re = /^\s*TESTAR:\s*\[([^\|]+)\|([^\|]+)\|([^\|]+)\|(\d+)(?:\|([^\]]+))?\]/gim;
  let m;
  while ((m = re.exec(txt)) !== null) {
    testes.push({ nomeJog: m[1].trim(), acao: m[2].trim(), attr: m[3].trim().toUpperCase(), dc: +m[4], alvo: m[5] ? m[5].trim() : null });
  }
  return testes;
}

function getAttrMod(jog, attr) {
  const map = { FOR:'STR', STR:'STR', DES:'DEX', DEX:'DEX', CON:'CON', INT:'INT', SAB:'WIS', WIS:'WIS', CAR:'CHA', CHA:'CHA' };
  const salvas = { FORT:'fort', REF:'ref', VON:'will', WILL:'will' };
  if (salvas[attr] !== undefined) return jog?.[salvas[attr]] ?? 0;
  const stat = map[attr] || 'DEX';
  return Math.floor(((jog?.[stat] ?? 10) - 10) / 2);
}

let _testeResultados = [];

function iniciarTestes(testes, jogadores, afterCb) {
  if (!testes.length) { afterCb([]); return; }

  // Rola todos os testes de uma vez
  const resultados = testes.map(t => {
    const jog = Object.values(jogadores).find(j => j.nome === t.nomeJog) || null;
    const mod = getAttrMod(jog, t.attr);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + mod;
    const sucesso = total >= t.dc;
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    return { ...t, jog, mod, d20, total, sucesso, modStr };
  });
  _testeResultados = resultados;

  // Portrait do atacante (jogador que age)
  const eu = _jogadoresCache[myUid];
  const pAtac = eu
    ? { src: `sprites/${eu.classe}_${eu.sexo || 'm'}.png`, icon: '🧑', cor: '#4a7090' }
    : { src: '', icon: '🧑', cor: '#4a7090' };

  // Portrait do alvo (inimigo/NPC, do campo alvo do 1º teste)
  const alvoNome = resultados[0].alvo || null;
  const pAlvo = alvoNome ? getPortraitAtaque(alvoNome, false) : null;

  const _phc = (p, espelhar) =>
    `<div class="combate-teste-portrait" style="background:${p.cor}22;border-color:${p.cor}55">
      ${p.src ? `<img src="${p.src}" alt=""${espelhar ? ' class="espelhado"' : ''} onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <span class="combate-teste-icon-fb"${p.src ? ' style="display:none"' : ''}>${p.icon}</span>
    </div>`;

  const linhasHTML = resultados.map((r, i) => {
    const cor = r.sucesso ? '#5a9a5a' : '#c05050';
    return `<div class="combate-teste-linha" style="color:${cor}">
      <span class="combate-teste-num">${i + 1}.</span>
      <span class="combate-teste-resultado">${r.sucesso ? 'ACERTO' : 'FALHA'}</span>
      <span class="combate-teste-roll">${r.d20}${r.modStr}=${r.total} <span class="combate-teste-cd">CD${r.dc}</span></span>
    </div>`;
  }).join('');

  const el = document.getElementById('story-content');
  if (el) {
    const card = document.createElement('div');
    card.className = 'combate-teste-card';
    card.innerHTML = `
      ${_phc(pAtac, true)}
      <div class="combate-teste-centro">
        <div class="combate-teste-acao">${resultados[0].acao}</div>
        ${linhasHTML}
      </div>
      ${pAlvo ? _phc(pAlvo, false) : `<div class="combate-teste-portrait combate-teste-sem-alvo"></div>`}`;
    el.appendChild(card);
    const btn = document.createElement('button');
    btn.className = 'btn-continuar-narr';
    btn.textContent = '▶ Ver resultado';
    btn.onclick = () => { btn.remove(); afterCb(_testeResultados); };
    el.appendChild(btn);
    scrollDown();
  } else {
    afterCb(resultados);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SISTEMA DE FALA DO JOGADOR
// ═══════════════════════════════════════════════════════════════
let _falarTom = 'normal';
let _falarAlvo = 'Todos';

function detectarAlvosContexto() {
  const alvos = ['Todos'];
  Object.values(_jogadoresCache).forEach(j => { if (j.uid !== myUid && j.ativo) alvos.push(j.nome); });
  const textoRecente = Array.from(document.querySelectorAll('.msg-gm')).slice(-6).map(el => el.textContent).join(' ');
  Object.keys(NPC_DATA).forEach(npc => { if (textoRecente.includes(npc)) alvos.push(npc); });
  return [...new Set(alvos)];
}

window.abrirFalar = function() {
  const overlay = document.getElementById('falar-overlay');
  if (!overlay) return;
  _falarTom = 'normal';
  _falarAlvo = 'Todos';
  const alvos = detectarAlvosContexto();

  overlay.innerHTML = `
    <div class="falar-card">
      <div class="falar-header">
        <span>💬 O que seu personagem diz?</span>
        <button class="falar-close" onclick="fecharFalar()">✕</button>
      </div>
      <div class="falar-section-label">Tom</div>
      <div class="falar-tom-row">
        <button class="falar-chip falar-chip-tom active" data-tom="sussurro" onclick="selecionarTom('sussurro',this)">🤫 Sussurro</button>
        <button class="falar-chip falar-chip-tom active" data-tom="normal"   onclick="selecionarTom('normal',this)" style="border-color:rgba(200,160,80,.6)">💬 Normal</button>
        <button class="falar-chip falar-chip-tom"        data-tom="grito"    onclick="selecionarTom('grito',this)">📢 Grito</button>
      </div>
      <div class="falar-section-label">Para quem</div>
      <div class="falar-alvo-row" id="falar-alvos">
        ${alvos.map((a,i) => `<button class="falar-chip falar-chip-alvo${i===0?' active':''}" onclick="selecionarAlvo('${a}',this)">${a}</button>`).join('')}
      </div>
      <textarea class="falar-textarea" id="falar-texto" placeholder="Digite a fala do seu personagem..." rows="3" maxlength="300"></textarea>
      <button class="falar-enviar-btn" onclick="enviarFalaPersonagem()">Enviar fala ▶</button>
    </div>`;

  // Fix: "normal" starts active, reset others
  overlay.querySelectorAll('.falar-chip-tom').forEach(b => b.classList.toggle('active', b.dataset.tom === 'normal'));
  overlay.style.display = 'flex';
  setTimeout(() => overlay.querySelector('#falar-texto')?.focus(), 100);
};

window.fecharFalar = function() {
  const el = document.getElementById('falar-overlay');
  if (el) el.style.display = 'none';
  const panel = document.getElementById('skills-panel');
  if (panel) panel.style.display = 'none';
};

window.selecionarTom = function(tom, btn) {
  _falarTom = tom;
  btn.closest('.falar-tom-row').querySelectorAll('.falar-chip-tom').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.selecionarAlvo = function(alvo, btn) {
  _falarAlvo = alvo;
  btn.closest('.falar-alvo-row').querySelectorAll('.falar-chip-alvo').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.enviarFalaPersonagem = async function() {
  const texto = document.getElementById('falar-texto')?.value?.trim();
  if (!texto || !mySala) return;
  const tomLabel = { sussurro: 'sussurra', normal: 'diz', grito: 'grita' }[_falarTom] || 'diz';
  const alvoStr  = _falarAlvo === 'Todos' ? '' : ` para ${_falarAlvo}`;
  const eu = _jogadoresCache[myUid];
  const nome = eu?.nome || myNome || 'Jogador';
  const acao = `${nome} ${tomLabel}${alvoStr}: "${texto}"`;

  fecharFalar();
  const input = document.getElementById('action-input');
  if (input) { input.value = acao; }
  await push(ref(db, `salas/${mySala}/historia`), { role:'user', content: acao, uid: myUid, ts: Date.now() });
  await update(ref(db, `salas/${mySala}/jogadores/${myUid}`), { acao1: acao });
};

async function narrarResultadoTestes(resultados, jogadores, inimigos, hist, rodada, ups) {
  const resumo = resultados.map(r =>
    `${r.nomeJog} — ${r.acao}: ${r.sucesso ? 'SUCESSO' : 'FALHA'} (rolou ${r.d20}${r.mod >= 0 ? '+' + r.mod : r.mod} = ${r.total} vs CD ${r.dc})`
  ).join('\n');

  const msg = `Resultados dos testes de ação:\n${resumo}\n\nCom base nesses resultados, narre o que DE FATO aconteceu — máximo 60 palavras, sem mencionar números, dados ou cálculos, apenas o resultado dramático.`;

  const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, inimigos), hist, msg, mostrarRetryUI, 250);
  ocultarRetryUI();

  if (resposta) {
    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ataques: extrairAtaques(resposta), ts: Date.now() });
    await processarStats(resposta, jogadores, inimigos);
  }
  ups[`salas/${mySala}/config/estado`] = 'aguardando';
  ups[`salas/${mySala}/config/rodada`] = rodada + 1;
  await update(ref(db), ups);
}

function parsearSegmentos(txt) {
  const segs = [];
  const linhas = txt.split('\n');
  let acum = [];
  linhas.forEach(linha => {
    const mFala = linha.match(/^\s*FALA:\s*\[([^\|]+)\|"([^"]+)"\]/i);
    const mAtaque = linha.match(/^\s*ATAQUE:\s*\[([^\|]+)\|([^\|]+)\|"([^"]+)"\|(sim|nao)\]/i);
    if (mFala) {
      const t = acum.join('\n').trim();
      if (t) segs.push({ tipo: 'texto', conteudo: t });
      acum = [];
      segs.push({ tipo: 'fala', nome: mFala[1].trim(), texto: mFala[2].trim() });
    } else if (mAtaque) {
      const t = acum.join('\n').trim();
      if (t) segs.push({ tipo: 'texto', conteudo: t });
      acum = [];
      segs.push({ tipo: 'ataque', atacante: mAtaque[1].trim(), alvo: mAtaque[2].trim(), resultado: mAtaque[3].trim(), surpresa: mAtaque[4].toLowerCase() === 'sim' });
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
    } else if (s.tipo === 'ataque') {
      items.push({ tipo:'ataque', atacante: s.atacante, alvo: s.alvo, resultado: s.resultado, surpresa: s.surpresa });
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
    } else if (it.tipo === 'fala') {
      // Bolha inline: FALANTE à esquerda (espelhado → olha pra direita) | OUVINTE à direita (normal → olha pra esquerda)
      const _ph = (src, icon, cor, espelhar) =>
        `<div class="dialogo-inline-portrait" style="background:${cor}22;border-color:${cor}55">
          ${src ? `<img src="${src}" alt=""${espelhar ? ' class="espelhado"' : ''} onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
          <span class="dialogo-inline-icon-fb"${src ? ' style="display:none"' : ''}>${icon}</span>
        </div>`;

      const jogEntry = Object.values(_jogadoresCache).find(j =>
        j.nome && it.nome.toLowerCase().includes(j.nome.toLowerCase())
      );

      let htmlEsq, htmlDir;
      if (jogEntry) {
        // Jogador fala → Jogador ESQUERDA (espelhado), último NPC DIREITA (normal)
        const sexo = jogEntry.sexo || 'm';
        htmlEsq = _ph(`sprites/${jogEntry.classe}_${sexo}.png`, '🧑', '#4a7090', true);
        const npcOuv = _ultimoNpc || { icon: '👤', cor: '#4a5a70', portrait: null };
        htmlDir = _ph(npcOuv.portrait ? `sprites/${npcOuv.portrait}.png` : '', npcOuv.icon, npcOuv.cor, false);
      } else {
        // NPC fala → NPC ESQUERDA (espelhado), Jogador atual DIREITA (normal)
        const npc = getNpcData(it.nome);
        _ultimoNpc = npc;
        htmlEsq = _ph(npc.portrait ? `sprites/${npc.portrait}.png` : '', npc.icon, npc.cor, true);
        const eu = _jogadoresCache[myUid];
        const src = eu ? `sprites/${eu.classe}_${eu.sexo || 'm'}.png` : '';
        htmlDir = _ph(src, '🧑', '#4a7090', false);
      }

      const bubble = document.createElement('div');
      bubble.className = 'dialogo-inline';
      bubble.innerHTML = `
        ${htmlEsq}
        <div class="dialogo-inline-body">
          <div class="dialogo-inline-nome">${it.nome}</div>
          <div class="dialogo-inline-texto">"${it.texto}"</div>
        </div>
        ${htmlDir}`;
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
    } else if (it.tipo === 'ataque') {
      // Card de batalha: ATACANTE à esquerda (espelhado), ALVO à direita (normal ou costas se surpresa)
      const pAtac = getPortraitAtaque(it.atacante, false);
      const pAlvo = getPortraitAtaque(it.alvo, it.surpresa);

      const _phb = (p, espelhar) =>
        `<div class="batalha-inline-portrait" style="background:${p.cor}22;border-color:${p.cor}55">
          ${p.src ? `<img src="${p.src}" alt=""${espelhar ? ' class="espelhado"' : ''} onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
          <span class="batalha-inline-icon-fb"${p.src ? ' style="display:none"' : ''}>${p.icon}</span>
        </div>`;

      const card = document.createElement('div');
      card.className = 'batalha-inline';
      card.innerHTML = `
        ${_phb(pAtac, true)}
        <div class="batalha-inline-body">
          <div class="batalha-inline-label">${it.atacante} → ${it.alvo}${it.surpresa ? ' <span class="batalha-surpresa">SURPRESA!</span>' : ''}</div>
          <div class="batalha-inline-texto">${it.resultado}</div>
        </div>
        ${_phb(pAlvo, false)}`;
      container.appendChild(card);
      scrollDown();
      narrarTexto(it.resultado);
      const btnA = document.createElement('button');
      btnA.className = 'btn-continuar-narr';
      btnA.textContent = '▶ Continuar';
      btnA.onclick = () => { btnA.remove(); proxItem(); };
      container.appendChild(btnA);
      scrollDown();
    }
  }
  proxItem();
}

// ═══════════════════════════════════════════════════════════════
//  EQUIPAMENTO — SLOTS E MOCHILA
// ═══════════════════════════════════════════════════════════════
const EQUIP_SLOTS = [
  { key: 'cabeca', label: 'Cabeça',      icon: '🪖', hint: 'Elmo, tiara...' },
  { key: 'tronco', label: 'Tronco',      icon: '🛡️', hint: 'Armadura, túnica...' },
  { key: 'mao_d',  label: 'Mão Direita', icon: '⚔️', hint: 'Arma, grimório...' },
  { key: 'mao_e',  label: 'Mão Esq.',    icon: '🫲',  hint: 'Escudo, 2ª arma...' },
  { key: 'pes',    label: 'Pés',         icon: '👢', hint: 'Botas, sandálias...' },
  { key: 'mochila',label: 'Mochila',     icon: '🎒', hint: 'Clique para abrir' },
];
const SLOT_LABELS = { cabeca:'Cabeça', tronco:'Tronco', mao_d:'Mão Direita', mao_e:'Mão Esquerda', pes:'Pés' };

const MOCHILA_MAX      = 12; // slots totais na mochila
const MOCHILA_ITENS    = 11; // slots para itens (1 reservado para dinheiro)

const STARTER_KITS = {
  guerreiro: {
    equipamento: { cabeca:'Elmo de Ferro', tronco:'Cota de Malha', mao_d:'Espada Longa', mao_e:'Escudo de Madeira', pes:'Botas de Couro' },
    mochila: { pocao_de_cura:{ nome:'Poção de Cura', qtd:1 }, tocha:{ nome:'Tocha', qtd:2 } }
  },
  mago: {
    equipamento: { cabeca:'Chapéu do Aprendiz', tronco:'Manto Arcano', mao_d:'Cajado de Madeira', mao_e:null, pes:'Sandálias de Couro' },
    mochila: { componentes:{ nome:'Componentes de Feitiço', qtd:5 }, tocha:{ nome:'Tocha', qtd:1 } }
  },
  ladino: {
    equipamento: { cabeca:'Capuz de Sombra', tronco:'Colete de Couro', mao_d:'Adaga', mao_e:'Adaga Curta', pes:'Botas Silenciosas' },
    mochila: { ferramentas:{ nome:'Ferramentas de Ladrão', qtd:1 }, corda:{ nome:'Corda', qtd:1 }, pocao:{ nome:'Poção de Cura', qtd:1 } }
  },
  arqueiro: {
    equipamento: { cabeca:'Capuz de Caçador', tronco:'Gibão de Couro', mao_d:'Arco Curto', mao_e:'Aljava de Flechas', pes:'Botas de Trilha' },
    mochila: { flechas:{ nome:'Flechas', qtd:20 }, faca_de_caca:{ nome:'Faca de Caça', qtd:1 } }
  },
  barbaro: {
    equipamento: { cabeca:'Tiara de Ossos', tronco:'Pelagem de Urso', mao_d:'Machado de Batalha', mao_e:null, pes:'Botas de Couro Grossa' },
    mochila: { pedra_amolar:{ nome:'Pedra de Amolar', qtd:1 }, racao:{ nome:'Ração de Viagem', qtd:3 } }
  },
  clerigo: {
    equipamento: { cabeca:'Elmo Abençoado', tronco:'Armadura Acolchoada', mao_d:'Mangual Sagrado', mao_e:'Escudo com Símbolo Sagrado', pes:'Sandálias Consagradas' },
    mochila: { agua_benta:{ nome:'Água Benta', qtd:2 }, ervas:{ nome:'Ervas Medicinais', qtd:2 } }
  },
};

window.equiparSlotPrompt = function(slot) {
  const eu = _jogadoresCache[myUid];
  if (!eu || !mySala) return;
  const atual = (eu.equipamento || {})[slot] || '';
  const label = SLOT_LABELS[slot] || slot;
  const novoItem = prompt(`${label} — O que está equipando?\n(deixe vazio para desequipar)`, atual);
  if (novoItem === null) return;
  const nome = novoItem.trim();
  if (!nome && atual) { window.desequiparParaMochila(slot); return; }
  const item = nome || null;
  const ups = {};
  ups[`salas/${mySala}/jogadores/${myUid}/equipamento/${slot}`] = item;
  ups[`personagens/${myUid}/equipamento/${slot}`] = item;
  update(ref(db), ups).then(() => {
    toast(item ? `${label}: ${item}` : `${label} desequipado`, 2000);
    const panel = document.getElementById('skills-panel');
    if (panel?.style.display === 'flex') { toggleSkillsPanel(); toggleSkillsPanel(); }
  });
};

window.desequiparParaMochila = async function(slot) {
  const eu = _jogadoresCache[myUid];
  if (!eu || !mySala) return;
  const item = (eu.equipamento || {})[slot];
  if (!item) return;
  const mochila = eu.mochila || {};
  const slug = item.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `item_${Date.now()}`;
  const jaExiste = !!mochila[slug];
  const qtdItens = Object.keys(mochila).filter(k => k !== 'dinheiro').length;
  if (!jaExiste && qtdItens >= MOCHILA_ITENS) {
    toast(`Mochila cheia! Máximo de ${MOCHILA_ITENS} itens.`, 2500); return;
  }
  const ups = {};
  ups[`salas/${mySala}/jogadores/${myUid}/equipamento/${slot}`] = null;
  ups[`personagens/${myUid}/equipamento/${slot}`] = null;
  if (jaExiste) {
    const qtdAtual = mochila[slug].qtd || 1;
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${slug}/qtd`] = qtdAtual + 1;
    ups[`personagens/${myUid}/mochila/${slug}/qtd`] = qtdAtual + 1;
  } else {
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${slug}`] = { nome: item, qtd: 1, slot };
    ups[`personagens/${myUid}/mochila/${slug}`] = { nome: item, qtd: 1, slot };
  }
  await update(ref(db), ups);
  toast(`${item} movido para mochila`, 2000);
  const panel = document.getElementById('skills-panel');
  if (panel?.style.display === 'flex') { toggleSkillsPanel(); toggleSkillsPanel(); }
};

window.equiparDaMochila = function(key) {
  const eu = _jogadoresCache[myUid];
  if (!eu) return;
  const item = (eu.mochila || {})[key];
  if (!item) return;
  const existente = document.getElementById('slot-picker');
  if (existente) existente.remove();
  const slotKeys = Object.keys(SLOT_LABELS);
  const equip = eu.equipamento || {};
  let html = `<div id="slot-picker" class="slot-picker">`;
  html += `<div class="slot-picker-title">Equipar "${item.nome}" em:</div>`;
  html += `<div class="slot-picker-btns">`;
  slotKeys.forEach(k => {
    const ocupado = equip[k] ? ` (${equip[k]})` : '';
    html += `<button class="slot-picker-btn" onclick="confirmarEquiparDaMochila('${key}','${k}')">${EQUIP_SLOTS.find(s=>s.key===k)?.icon||''} ${SLOT_LABELS[k]}${ocupado}</button>`;
  });
  html += `</div><button class="slot-picker-cancel" onclick="document.getElementById('slot-picker').remove()">Cancelar</button></div>`;
  const el = document.getElementById('mochila-overlay');
  if (el) el.insertAdjacentHTML('beforeend', html);
};

window.confirmarEquiparDaMochila = async function(mochilaKey, slot) {
  const picker = document.getElementById('slot-picker');
  if (picker) picker.remove();
  const eu = _jogadoresCache[myUid];
  if (!eu || !mySala) return;
  const item = (eu.mochila || {})[mochilaKey];
  if (!item) return;
  const itemAnterior = (eu.equipamento || {})[slot];
  const mochila = eu.mochila || {};
  const ups = {};
  ups[`salas/${mySala}/jogadores/${myUid}/equipamento/${slot}`] = item.nome;
  ups[`personagens/${myUid}/equipamento/${slot}`] = item.nome;
  if ((item.qtd || 1) <= 1) {
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${mochilaKey}`] = null;
    ups[`personagens/${myUid}/mochila/${mochilaKey}`] = null;
  } else {
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${mochilaKey}/qtd`] = (item.qtd || 1) - 1;
    ups[`personagens/${myUid}/mochila/${mochilaKey}/qtd`] = (item.qtd || 1) - 1;
  }
  if (itemAnterior) {
    const oldSlug = itemAnterior.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `item_${Date.now()}`;
    const jaExisteOld = !!mochila[oldSlug];
    if (jaExisteOld) {
      ups[`salas/${mySala}/jogadores/${myUid}/mochila/${oldSlug}/qtd`] = (mochila[oldSlug].qtd || 1) + 1;
      ups[`personagens/${myUid}/mochila/${oldSlug}/qtd`] = (mochila[oldSlug].qtd || 1) + 1;
    } else if (Object.keys(mochila).filter(k=>k!=='dinheiro').length < MOCHILA_ITENS || mochilaKey === oldSlug) {
      ups[`salas/${mySala}/jogadores/${myUid}/mochila/${oldSlug}`] = { nome: itemAnterior, qtd: 1, slot };
      ups[`personagens/${myUid}/mochila/${oldSlug}`] = { nome: itemAnterior, qtd: 1, slot };
    }
  }
  await update(ref(db), ups);
  toast(`${item.nome} equipado em ${SLOT_LABELS[slot]}`, 2000);
  setTimeout(() => renderizarMochila(), 200);
};

function _itemIcon(it) {
  if (!it) return '📦';
  if (it.slot) return EQUIP_SLOTS.find(s => s.key === it.slot)?.icon || '⚔';
  const n = (it.nome || '').toLowerCase();
  if (n.includes('poção') || n.includes('pocao')) return '🧪';
  if (n.includes('tocha'))                         return '🕯️';
  if (n.includes('corda'))                         return '🪢';
  if (n.includes('ração') || n.includes('racao'))  return '🍖';
  if (n.includes('erva'))                          return '🌿';
  if (n.includes('água') || n.includes('benta'))   return '💧';
  if (n.includes('flecha') || n.includes('aljava'))return '🪃';
  if (n.includes('ferramenta'))                    return '🔧';
  if (n.includes('componente') || n.includes('feitiço')) return '✨';
  if (n.includes('pedra'))                         return '🪨';
  if (n.includes('faca') || n.includes('adaga'))   return '🗡️';
  return '📦';
}

function _nomeAbrev(nome, max) {
  return nome.length > max ? nome.substring(0, max - 1) + '…' : nome;
}

window.toggleMochila = function() {
  const el = document.getElementById('mochila-overlay');
  if (!el) return;
  if (el.style.display !== 'none' && el.style.display !== '') {
    el.style.display = 'none'; return;
  }
  renderizarMochila();
  el.style.display = 'flex';
};

function renderizarMochila() {
  const el = document.getElementById('mochila-overlay');
  if (!el) return;
  const eu = _jogadoresCache[myUid];
  const mochila = eu?.mochila || {};
  const dinheiro = mochila.dinheiro || { nome: 'Dinheiro', qtd: 0 };
  const items = Object.entries(mochila)
    .filter(([k]) => k !== 'dinheiro')
    .sort(([,a],[,b]) => (a.nome||'').localeCompare(b.nome||''));
  const count = items.length;

  let h = `<div class="mochila-header">
    <span>🎒 Mochila <small class="mochila-count">${count}/${MOCHILA_ITENS}</small></span>
    <button class="mochila-close" onclick="toggleMochila()">✕</button>
  </div>`;

  h += `<div class="mochila-grid">`;
  // 11 slots de itens
  for (let i = 0; i < MOCHILA_ITENS; i++) {
    if (i < items.length) {
      const [key, it] = items[i];
      h += `<div class="mochila-slot ocupado" onclick="cliqueMochilaItem('${key}')">
        <div class="mochila-slot-icon">${_itemIcon(it)}</div>
        <div class="mochila-slot-nome">${_nomeAbrev(it.nome, 11)}</div>
        <div class="mochila-slot-qtd">×${it.qtd || 1}</div>
      </div>`;
    } else {
      h += `<div class="mochila-slot vazio" onclick="cliqueMochilaVazio()">
        <div class="mochila-slot-add">+</div>
      </div>`;
    }
  }
  // Slot de dinheiro (fixo, sempre último)
  h += `<div class="mochila-slot mochila-dinheiro" onclick="editarDinheiro()">
    <div class="mochila-slot-icon">🪙</div>
    <div class="mochila-slot-nome">Dinheiro</div>
    <div class="mochila-slot-qtd">${dinheiro.qtd || 0}</div>
  </div>`;
  h += `</div>`;
  el.innerHTML = h;
}

window.cliqueMochilaItem = function(key) {
  // Remove qualquer popup anterior
  document.getElementById('mochila-action-bar')?.remove();
  document.getElementById('mochila-add-form')?.remove();
  const eu = _jogadoresCache[myUid];
  const it = (eu?.mochila || {})[key];
  if (!it) return;
  const equippable = !!it.slot;
  let h = `<div id="mochila-action-bar" class="mochila-action-bar">
    <span class="mochila-action-nome">${it.nome} ×${it.qtd || 1}</span>
    <div class="mochila-action-btns">`;
  if (equippable) h += `<button class="mochila-equip-btn" onclick="equiparDaMochila('${key}')">⚔ Equipar</button>`;
  h += `<button class="mochila-qty-btn" onclick="ajustarMochila('${key}',${(it.qtd||1)-1})">−</button>
    <button class="mochila-qty-btn" onclick="ajustarMochila('${key}',${(it.qtd||1)+1})">+</button>
    <button class="mochila-remove-btn" onclick="ajustarMochila('${key}',0)">🗑</button>
    <button class="mochila-qty-btn" onclick="document.getElementById('mochila-action-bar').remove()">✕</button>
  </div></div>`;
  document.getElementById('mochila-overlay').insertAdjacentHTML('beforeend', h);
};

window.cliqueMochilaVazio = function() {
  document.getElementById('mochila-action-bar')?.remove();
  if (document.getElementById('mochila-add-form')) {
    document.getElementById('mochila-add-form').remove(); return;
  }
  const eu = _jogadoresCache[myUid];
  const mochila = eu?.mochila || {};
  const qtdItens = Object.keys(mochila).filter(k => k !== 'dinheiro').length;
  if (qtdItens >= MOCHILA_ITENS) { toast(`Mochila cheia!`, 1500); return; }
  const h = `<div id="mochila-add-form" class="mochila-add">
    <input type="text" id="mochila-new-item" placeholder="Nome do item..." maxlength="50" onkeydown="if(event.key==='Enter')adicionarMochila()">
    <input type="number" id="mochila-new-qtd" value="1" min="1" max="99">
    <button class="btn-sm" onclick="adicionarMochila()">+</button>
  </div>`;
  document.getElementById('mochila-overlay').insertAdjacentHTML('beforeend', h);
  setTimeout(() => document.getElementById('mochila-new-item')?.focus(), 50);
};

window.editarDinheiro = function() {
  const eu = _jogadoresCache[myUid];
  const atual = (eu?.mochila || {}).dinheiro?.qtd || 0;
  const val = prompt('Quantidade de dinheiro (pratas):', atual);
  if (val === null) return;
  const qtd = Math.max(0, parseInt(val) || 0);
  if (!mySala) return;
  const ups = {};
  ups[`salas/${mySala}/jogadores/${myUid}/mochila/dinheiro`] = { nome: 'Dinheiro', qtd };
  ups[`personagens/${myUid}/mochila/dinheiro`] = { nome: 'Dinheiro', qtd };
  update(ref(db), ups).then(() => setTimeout(() => renderizarMochila(), 200));
};

window.ajustarMochila = async function(key, novaQtd) {
  if (!mySala) return;
  const ups = {};
  if (novaQtd <= 0) {
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${key}`] = null;
    ups[`personagens/${myUid}/mochila/${key}`] = null;
  } else {
    ups[`salas/${mySala}/jogadores/${myUid}/mochila/${key}/qtd`] = novaQtd;
    ups[`personagens/${myUid}/mochila/${key}/qtd`] = novaQtd;
  }
  await update(ref(db), ups);
  setTimeout(() => renderizarMochila(), 200);
};

window.adicionarMochila = async function() {
  const nomeEl = document.getElementById('mochila-new-item');
  const qtdEl  = document.getElementById('mochila-new-qtd');
  const nome = nomeEl?.value?.trim();
  if (!nome || !mySala) return;
  const eu = _jogadoresCache[myUid];
  const mochila = eu?.mochila || {};
  const qtd = Math.max(1, Math.min(99, +(qtdEl?.value) || 1));
  const slug = nome.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') || `item_${Date.now()}`;
  const jaExiste = !!mochila[slug];
  const qtdItens = Object.keys(mochila).filter(k => k !== 'dinheiro').length;
  if (!jaExiste && qtdItens >= MOCHILA_ITENS) {
    toast(`Mochila cheia! Máximo de ${MOCHILA_ITENS} itens.`, 2500); return;
  }
  const qtdAtual = mochila[slug]?.qtd || 0;
  const ups = {};
  ups[`salas/${mySala}/jogadores/${myUid}/mochila/${slug}`] = { nome, qtd: qtdAtual + qtd };
  ups[`personagens/${myUid}/mochila/${slug}`] = { nome, qtd: qtdAtual + qtd };
  await update(ref(db), ups);
  if (nomeEl) nomeEl.value = '';
  if (qtdEl)  qtdEl.value = '1';
  setTimeout(() => renderizarMochila(), 200);
};

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
  const sexo = eu.sexo || 'm';

  let html = `<div class="skills-header"><span class="skills-title">${cls?.icon||'⚔️'} ${cls?.nome||eu.classe}</span><button class="skills-close" onclick="toggleSkillsPanel()">✕</button></div>`;

  // Top row: avatar + stats compacted
  html += `<div class="skills-top-row">`;
  html += `<img class="skills-avatar" src="sprites/${eu.classe}_${sexo}.png" alt="${cls?.nome||eu.classe}" onerror="this.src='sprites/${eu.classe}.png'">`;
  html += `<div class="skills-stats-col">`;
  html += `<div class="skills-attrs">`;
  ['STR','DEX','CON','INT','WIS','CHA'].forEach(a => {
    const lbl = {STR:'FOR',DEX:'DES',CON:'CON',INT:'INT',WIS:'SAB',CHA:'CAR'}[a];
    html += `<span>${lbl} <strong>${eu[a]}</strong> <small>${fmt(Math.floor((eu[a]-10)/2))}</small></span>`;
  });
  html += `</div>`;
  html += `<div class="skills-derived"><span>❤️ ${eu.hp}/${eu.maxHp}</span><span>🛡️ ${eu.ac}</span><span>⚡${fmt(eu.init)}</span><span>Ft${fmt(eu.fort)}</span><span>Rf${fmt(eu.ref)}</span><span>Vn${fmt(eu.will)}</span></div>`;
  const nivelStr = eu.nivel > 1 ? `Nv${eu.nivel}` : '';
  const xpStr    = eu.xp != null ? `⭐${eu.xp} XP` : '';
  if (nivelStr || xpStr) html += `<div class="skills-xp">${[nivelStr,xpStr].filter(Boolean).join(' · ')}</div>`;
  html += `</div>`; // skills-stats-col
  html += `</div>`; // skills-top-row
  if (hab) html += `<div class="skills-feat"><div class="skills-feat-nome">⚡ ${hab.nome}</div><div class="skills-feat-desc">${hab.desc}</div></div>`;
  if (eu.pericias?.length) {
    html += `<div class="skills-pericia-list">`;
    eu.pericias.forEach(k => {
      const per = PERICIAS[k];
      if (per) html += `<div class="skills-pericia"><span class="per-icon">${per.icon}</span><div><strong>${per.nome}</strong><div class="per-desc">${per.desc}</div></div></div>`;
    });
    html += `</div>`;
  }
  const lesoesArr = Object.values(eu.lesoes || {});
  if (lesoesArr.length) {
    html += `<div class="skills-lesoes-header">⚠️ Lesões Permanentes</div><div class="skills-lesao-list">`;
    lesoesArr.forEach(l => { html += `<div class="skills-lesao">${l.descricao}</div>`; });
    html += `</div>`;
  }
  const titulosArr = Object.values(eu.titulos || {});
  if (titulosArr.length) {
    html += `<div class="skills-lesoes-header" style="color:var(--gold);border-color:rgba(200,160,80,.2)">👑 Títulos</div><div class="skills-lesao-list">`;
    titulosArr.forEach(t => { html += `<div class="skills-lesao" style="border-left-color:rgba(200,160,80,.5);color:#d4b060">${t.titulo}</div>`; });
    html += `</div>`;
  }
  const possesArr = Object.values(eu.posses || {});
  if (possesArr.length) {
    html += `<div class="skills-lesoes-header" style="color:#70a060;border-color:rgba(112,160,96,.2)">📦 Posses & Terras</div><div class="skills-lesao-list">`;
    possesArr.forEach(p => { html += `<div class="skills-lesao" style="border-left-color:rgba(112,160,96,.5);color:#90c080">${p.descricao}</div>`; });
    html += `</div>`;
  }
  const repsArr = Object.entries(eu.reputacoes || {});
  if (repsArr.length) {
    html += `<div class="skills-lesoes-header" style="color:#7090b0;border-color:rgba(112,144,176,.2)">🏛️ Reputação</div><div class="skills-lesao-list">`;
    repsArr.forEach(([, r]) => {
      const cor = r.valor > 0 ? '#70b070' : '#b07070';
      const sinal = r.valor > 0 ? '+' : '';
      html += `<div class="skills-lesao" style="border-left-color:${cor}44;color:${cor}">${r.local || ''}: ${sinal}${r.valor}</div>`;
    });
    html += `</div>`;
  }

  // Equipamento
  const equip = eu.equipamento || {};
  const mochila = eu.mochila || {};
  const qtdMochila = Object.values(mochila).reduce((s, it) => s + (it.qtd || 1), 0);
  html += `<div class="equip-section-header">⚙️ Equipamento</div><div class="equip-grid">`;
  EQUIP_SLOTS.forEach(s => {
    if (s.key === 'mochila') {
      html += `<div class="equip-slot mochila-slot" onclick="toggleMochila()" title="Abrir mochila">
        <div class="equip-slot-icon">${s.icon}</div>
        <div class="equip-slot-label">${s.label}</div>
        <div class="equip-slot-item">${qtdMochila ? qtdMochila + ' item(s)' : '— vazia —'}</div>
      </div>`;
    } else {
      const item = equip[s.key] || null;
      html += `<div class="equip-slot ${item ? 'ocupado' : ''}" onclick="equiparSlotPrompt('${s.key}')" title="${s.hint}">
        ${item ? `<button class="equip-slot-remove" onclick="event.stopPropagation();desequiparParaMochila('${s.key}')" title="Mover para mochila">✕</button>` : ''}
        <div class="equip-slot-icon">${s.icon}</div>
        <div class="equip-slot-label">${s.label}</div>
        <div class="equip-slot-item">${item || '— vazio —'}</div>
      </div>`;
    }
  });
  html += `</div>`;

  // Botão Falar
  html += `<div class="skills-falar-wrap"><button class="btn-falar-abrir" onclick="abrirFalar()">💬 Falar</button></div>`;

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

// Alias for new navigation code
function renderizarPreview() { atualizarPreview(); }

function renderFeatGrid() {
  const grid = document.getElementById('adv-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(PERICIAS).map(([k, v]) => {
    const sel = _selectedAdvs.has(k);
    return `<button class="adv-chip${sel ? ' selected' : ''}" onclick="toggleAdv('${k}')">
      <div class="adv-chip-top">${v.icon} <strong>${v.nome}</strong> <span class="chip-attr">${v.attr}</span></div>
      <div class="adv-chip-desc">${v.desc}</div>
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
    const [resCamp, resNpcs, resIni] = await Promise.all([
      fetch('campanhas/beast-of-black-keep/campanha.json'),
      fetch('campanhas/beast-of-black-keep/npcs_visual.json'),
      fetch('campanhas/beast-of-black-keep/inimigos.json'),
    ]);
    if (resCamp.ok) {
      _campanha = await resCamp.json();
      const el = document.getElementById('campaign-name');
      if (el && _campanha) el.textContent = `📖 ${_campanha.titulo}`;
    }
    if (resNpcs.ok) {
      const data = await resNpcs.json();
      NPC_DATA = data.npcs || {};
    }
    if (resIni.ok) {
      _inimigos = await resIni.json();
    }
  } catch(e) {
    console.warn('Campanha não carregada:', e);
  }
}

async function carregarRegras() {
  const arquivos = [
    'sistema', 'personagem', 'dialogo', 'batalha',
    'narrativa', 'recompensas', 'equipamentos', 'inimigos', 'avançar'
  ];
  await Promise.all(arquivos.map(async nome => {
    try {
      const res = await fetch(`regras/${nome}.json`);
      if (res.ok) _regras[nome] = await res.json();
    } catch(e) {}
  }));
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

function buildRegrasContext() {
  if (!_regras || !Object.keys(_regras).length) return '';
  const sec = [];

  // VOZ / NARRAÇÃO
  const narr = _regras.narrativa;
  if (narr) {
    const b = ['VOZ E TOM:'];
    if (narr.voz) narr.voz.forEach(r => b.push('• ' + r));
    if (narr.proibido?.length) { b.push('PROIBIDO:'); narr.proibido.forEach(r => b.push('• ' + r)); }
    sec.push(b.join('\n'));
  }

  // DIÁLOGO
  const dial = _regras.dialogo;
  if (dial) {
    const b = [`DIÁLOGO — PADRÃO OFICIAL OBRIGATÓRIO (v${dial.versao || '?'})`];
    b.push(`Formato: ${dial.formato}`);
    if (dial.regras) dial.regras.forEach(r => b.push('• ' + r));
    if (dial.exemplos?.length) { b.push('Exemplos:'); dial.exemplos.forEach(e => b.push(e)); }
    sec.push(b.join('\n'));
  }

  // BATALHA / ATAQUE
  const bat = _regras.batalha;
  if (bat) {
    const b = [`BATALHA — PADRÃO OFICIAL (v${bat.versao || '?'})`];
    b.push(`Formato: ${bat.formato}`);
    b.push(`Surpresa: ${bat.surpresa_valores}`);
    if (bat.regras) bat.regras.forEach(r => b.push('• ' + r));
    if (bat.exemplos?.length) { b.push('Exemplos:'); bat.exemplos.forEach(e => b.push(e)); }
    sec.push(b.join('\n'));
  }

  // INIMIGOS
  const inim = _regras.inimigos;
  if (inim) {
    const b = ['INIMIGOS E TESTES:'];
    if (inim.tags_inimigos) inim.tags_inimigos.forEach(t => b.push('• ' + t));
    if (inim.regras_introducao) inim.regras_introducao.forEach(r => b.push('• ' + r));
    if (inim.testes) {
      b.push(`Testes — Formato: ${inim.testes.formato}`);
      const cds = inim.testes.cds;
      if (cds) b.push(`CDs: fácil=${cds.facil} médio=${cds.medio} difícil=${cds.dificil} muito difícil=${cds.muito_dificil} heróico=${cds.heroico}`);
      if (inim.testes.regras) inim.testes.regras.forEach(r => b.push('• ' + r));
    }
    if (inim.exemplos_testes?.length) { b.push('Exemplos testes:'); inim.exemplos_testes.forEach(e => b.push(e)); }
    sec.push(b.join('\n'));
  }

  // EQUIPAMENTOS
  const equip = _regras.equipamentos;
  if (equip) {
    const b = ['EQUIPAMENTOS E INVENTÁRIO:'];
    if (equip.tags) equip.tags.forEach(t => b.push('• ' + t));
    if (equip.regras_validacao) equip.regras_validacao.forEach(r => b.push('• ' + r));
    if (equip.exemplos?.length) { b.push('Exemplos:'); equip.exemplos.forEach(e => b.push(e)); }
    sec.push(b.join('\n'));
  }

  // PERSONAGEM PERSISTENTE
  const pers = _regras.personagem;
  if (pers?.tags) {
    const b = ['TAGS PERSONAGEM PERSISTENTE:'];
    pers.tags.forEach(t => b.push('• ' + t));
    if (pers.regras) pers.regras.forEach(r => b.push('• ' + r));
    sec.push(b.join('\n'));
  }

  // RECOMPENSAS
  const rec = _regras.recompensas;
  if (rec?.categorias) {
    const c = rec.categorias;
    const b = ['RECOMPENSAS E REPUTAÇÃO:'];
    b.push(`• ${c.titulos.tag} — ${c.titulos.regra}`);
    b.push(`• ${c.posses.tag} — ${c.posses.regra}`);
    b.push(`• ${c.reputacao.tag} — ${c.reputacao.regra}`);
    if (rec.efeitos_narrativos) {
      b.push('Efeitos narrativos:');
      Object.values(rec.efeitos_narrativos).forEach(ef => b.push('• ' + ef));
    }
    sec.push(b.join('\n'));
  }

  // AVANÇAR
  const av = _regras['avançar'];
  if (av) {
    const b = [`AUTO-AVANÇO — Tag ${av.tag}:`];
    if (av.quando_usar) { b.push('Usar quando:'); av.quando_usar.forEach(u => b.push('• ' + u)); }
    if (av.quando_nao_usar) { b.push('NÃO usar quando:'); av.quando_nao_usar.forEach(u => b.push('• ' + u)); }
    if (av.exemplos?.length) { b.push('Exemplos:'); av.exemplos.forEach(e => b.push(e)); }
    sec.push(b.join('\n'));
  }

  return sec.length ? `\n═══ REGRAS CANÔNICAS DO SISTEMA ═══\n${sec.join('\n\n')}\n═══════════════════════════════════\n` : '';
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
  carregarCampanha(); carregarRegras();

  // Show home screen on start
  irParaHome();
});

// ═══════════════════════════════════════════════════════════════
//  NAVEGAÇÃO POR TELAS
// ═══════════════════════════════════════════════════════════════
function mostrarTela(id) {
  ['screen-home','screen-chars','screen-create','screen-lobby','screen-game']
    .forEach(s => { const el = document.getElementById(s); if (el) el.style.display = 'none'; });
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

// ═══════════════════════════════════════════════════════════════
//  VINHETA ARCANA
// ═══════════════════════════════════════════════════════════════
let _vinhetaTocada = false;
function tocarVinhetaArcana() {
  if (_vinhetaTocada) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    _vinhetaTocada = true;
    const dur = 6.5;

    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.6);
    master.gain.setValueAtTime(0.55, ctx.currentTime + dur - 1.2);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);

    // Reverb via delay loop
    const delay = ctx.createDelay(0.6);
    delay.delayTime.value = 0.38;
    const delayFb = ctx.createGain();
    delayFb.gain.value = 0.42;
    delay.connect(delayFb);
    delayFb.connect(delay);
    delayFb.connect(master);

    // Drone grave
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(55, ctx.currentTime);
    bass.frequency.linearRampToValueAtTime(58, ctx.currentTime + dur);
    const bassG = ctx.createGain();
    bassG.gain.value = 0.22;
    bass.connect(bassG); bassG.connect(master);
    bass.start(ctx.currentTime); bass.stop(ctx.currentTime + dur);

    // Pad harmônico (A menor)
    [[220,.07],[330,.05],[440,.06],[550,.03],[660,.04]].forEach(([f, v]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f + (Math.random() - 0.5) * 2;
      const g = ctx.createGain(); g.gain.value = v;
      o.connect(g); g.connect(delay); g.connect(master);
      o.start(ctx.currentTime + 0.1); o.stop(ctx.currentTime + dur);
    });

    // Melodia arcana (arpejo ascendente-descendente)
    const notas = [
      [523.25, 0.5 ], // C5
      [659.25, 1.05], // E5
      [783.99, 1.6 ], // G5
      [880.00, 2.2 ], // A5
      [1046.5, 3.0 ], // C6
      [880.00, 3.7 ], // A5
      [783.99, 4.35], // G5
      [659.25, 4.9 ], // E5 — final
    ];
    notas.forEach(([f, t]) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = ctx.currentTime + t;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.18, at + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, at + 1.4);
      o.connect(g); g.connect(delay); g.connect(master);
      o.start(at); o.stop(at + 1.6);
    });

    // Shimmer alto (cintilação)
    [[2093, 1.8],[2637, 2.5],[3136, 3.2]].forEach(([f, t]) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); const at = ctx.currentTime + t;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.04, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.9);
      o.connect(g); g.connect(master);
      o.start(at); o.stop(at + 1);
    });
  } catch(e) { /* autoplay bloqueado — silencioso */ }
}

window.irParaHome = function() { mostrarTela('screen-home'); };

window.irParaPersonagens = async function() {
  tocarVinhetaArcana();
  mostrarTela('screen-chars');
  renderSlots();          // render cached state immediately (all empty slots)
  await carregarSlots();  // fetch Firebase
  renderSlots();          // update with real data
};

window.deixarSala = function() {
  if (!confirm('Sair da sala? Você poderá entrar novamente pelo código.')) return;
  if (unsubSala) { unsubSala(); unsubSala = null; }
  mySala = null; amIHost = false; _kitMigrado = false;
  _jogadoresCache = {};
  // Para narração em andamento
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  voiceQueue = []; voiceBusy = false;
  irParaPersonagens();
};

window.irParaCriacao = function(slotIndex) {
  _activeSlot = slotIndex;
  localStorage.setItem('rpg_active_slot', slotIndex);
  // Reset form
  _selectedClass = 'guerreiro';
  _selectedGender = 'm';
  _selectedAdvs = new Set();
  document.querySelectorAll('.class-btn').forEach(b => b.classList.toggle('active', b.dataset.class === 'guerreiro'));
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.toggle('active', b.dataset.gender === 'm'));
  const nomeEl = document.getElementById('char-nome');
  if (nomeEl) nomeEl.value = '';
  renderFeatGrid();
  renderizarPreview();
  mostrarTela('screen-create');
};

window.irParaLobbyScreen = function(slotIndex) {
  _activeSlot = slotIndex;
  localStorage.setItem('rpg_active_slot', slotIndex);
  renderLobbyCharCard();
  mostrarTela('screen-lobby');
};

function renderLobbyCharCard() {
  const card = document.getElementById('lobby-char-card');
  if (!card) return;
  const ch = _charSlots[_activeSlot];
  if (!ch) { card.innerHTML = ''; return; }
  const cls = CLASSES[ch.classe] || {};
  const nivel = ch.nivel || 1;
  const xp = ch.xp || 0;
  const cor = CLASS_COLORS[ch.classe] || '#4a5a70';
  card.innerHTML = `
    <img id="lobby-char-sprite" src="sprites/${ch.classe}_${ch.sexo||'m'}.png" alt=""
         onerror="this.style.opacity='.3'" style="border-radius:6px;background:${cor}22">
    <div id="lobby-char-info">
      <div id="lobby-char-nome">${ch.nome}</div>
      <div id="lobby-char-classe">${cls.icon||''} ${cls.nome||ch.classe} · Nível ${nivel}</div>
      <div id="lobby-char-stats">❤️ ${ch.maxHp} PV &nbsp; 🛡️ ${ch.ac} CA &nbsp; ★ ${xp} XP</div>
    </div>
    <button id="btn-trocar-char" onclick="irParaPersonagens()">Trocar</button>`;
}

// ═══════════════════════════════════════════════════════════════
//  SLOTS DE PERSONAGENS
// ═══════════════════════════════════════════════════════════════
const CLASS_COLORS = {
  guerreiro: '#8a4a20', mago: '#3a2a6a', ladino: '#0f2448',
  clerigo: '#4a3a10', barbaro: '#6a1a1a', arqueiro: '#2a4a2a',
};

async function carregarSlots() {
  try {
    // Migração: mover personagens/${myUid} antigo para chars/${myUid}/s0
    const oldSnap = await get(ref(db, `personagens/${myUid}`));
    const charsSnap = await get(ref(db, `chars/${myUid}`));
    if (oldSnap.exists() && !charsSnap.exists()) {
      const d = oldSnap.val();
      if (d.nome && d.classe) {
        await set(ref(db, `chars/${myUid}/s0`), { ...d, criadoEm: d.criadoEm || Date.now() });
      }
    }
    const snap = await get(ref(db, `chars/${myUid}`));
    _charSlots = new Array(8).fill(null);
    if (snap.exists()) {
      const data = snap.val();
      for (let i = 0; i < 8; i++) {
        _charSlots[i] = data[`s${i}`] || null;
      }
    }
  } catch(e) { console.warn('carregarSlots:', e); }
}

function renderSlots() {
  const grid = document.getElementById('chars-grid');
  if (!grid) return;
  grid.innerHTML = _charSlots.map((ch, i) => {
    if (!ch) {
      return `<div class="slot-card empty" onclick="irParaCriacao(${i})">
        <div class="slot-empty-icon">+</div>
        <div class="slot-empty-label">Criar Aventureiro</div>
      </div>`;
    }
    const cls = CLASSES[ch.classe] || {};
    const cor = CLASS_COLORS[ch.classe] || '#4a5a70';
    const nivel = ch.nivel || 1;
    return `<div class="slot-card occupied" onclick="selecionarSlotExistente(${i})"
                 style="background:linear-gradient(160deg,${cor}22 0%,rgba(6,8,15,.95) 60%);">
      <button class="slot-delete" onclick="event.stopPropagation();deletarSlot(${i})" title="Excluir">✕</button>
      <div class="slot-sprite-wrap">
        <img src="sprites/${ch.classe}_${ch.sexo||'m'}.png" alt=""
             onerror="this.style.display='none'">
      </div>
      <div class="slot-nome">${ch.nome}</div>
      <div class="slot-classe">${cls.icon||''} ${cls.nome||ch.classe}</div>
      <div class="slot-nivel">Nível ${nivel} &nbsp;·&nbsp; ★ ${ch.xp||0} XP</div>
      <div class="slot-class-bar" style="background:${cor}88"></div>
    </div>`;
  }).join('');
}

window.selecionarSlotExistente = function(i) {
  const ch = _charSlots[i];
  if (!ch) return;
  // Load character data into form state
  _selectedClass  = ch.classe || 'guerreiro';
  _selectedGender = ch.sexo   || 'm';
  _selectedAdvs   = new Set(Array.isArray(ch.pericias) ? ch.pericias : Object.values(ch.pericias||{}));
  const nomeEl = document.getElementById('char-nome');
  if (nomeEl) nomeEl.value = ch.nome || '';
  document.querySelectorAll('.class-btn').forEach(b => b.classList.toggle('active', b.dataset.class === _selectedClass));
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.toggle('active', b.dataset.gender === _selectedGender));
  renderFeatGrid();
  renderizarPreview();
  irParaLobbyScreen(i);
};

window.deletarSlot = async function(i) {
  if (!confirm(`Excluir "${_charSlots[i]?.nome}"? Isso é permanente.`)) return;
  await set(ref(db, `chars/${myUid}/s${i}`), null);
  _charSlots[i] = null;
  renderSlots();
};

window.confirmarCriacaoPersonagem = async function() {
  const nome = document.getElementById('char-nome')?.value?.trim();
  if (!nome) { document.getElementById('create-error').textContent = 'Digite o nome do personagem.'; return; }
  const cls = CLASSES[_selectedClass];
  const d   = dndDerivados(cls);
  const novoChar = {
    nome, classe: _selectedClass, sexo: _selectedGender,
    STR: cls.STR, DEX: cls.DEX, CON: cls.CON,
    INT: cls.INT, WIS: cls.WIS, CHA: cls.CHA,
    hp: d.hp, maxHp: d.hp, ac: d.ac, init: d.init,
    fort: d.fort, ref: d.ref, will: d.will,
    pericias: [..._selectedAdvs],
    xp: 0, nivel: 1, vivo: true,
    equipamento: {}, mochila: {},
    criadoEm: Date.now(),
  };
  // Apply starter kit
  const kit = STARTER_KITS[_selectedClass];
  if (kit) {
    Object.entries(kit.equipamento || {}).forEach(([slot, item]) => {
      if (item) novoChar.equipamento[slot] = item;
    });
    Object.entries(kit.mochila || {}).forEach(([key, item]) => {
      novoChar.mochila[key] = { ...item };
    });
  }
  await set(ref(db, `chars/${myUid}/s${_activeSlot}`), novoChar);
  _charSlots[_activeSlot] = novoChar;
  document.getElementById('create-error').textContent = '';
  irParaLobbyScreen(_activeSlot);
};

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

  // Use active character slot data
  const charData = _charSlots[_activeSlot];

  // Se a classe mudou em relação ao save, reseta equipamento (kit correto será aplicado abaixo)
  const classeChanged = charData?.classe && charData.classe !== p.classe;

  // Montar dados do jogador para esta sala (com persistência)
  const jogData = {
    ...p, uid: myUid, ativo: true,
    xp:         charData?.xp         ?? 0,
    nivel:      charData?.nivel      ?? 1,
    lesoes:     charData?.lesoes     || {},
    titulos:    charData?.titulos    || {},
    posses:     charData?.posses     || {},
    reputacoes: charData?.reputacoes || {},
    equipamento: classeChanged ? {} : (charData?.equipamento || {}),
    mochila:    classeChanged ? {} : (charData?.mochila    || {}),
  };
  if (!classeChanged && charData?.hp != null) jogData.hp = Math.min(charData.hp, p.maxHp);

  // Preencher slots vazios com o kit iniciante
  const kit = STARTER_KITS[p.classe];
  if (kit) {
    Object.entries(kit.equipamento || {}).forEach(([slot, item]) => {
      if (item && !jogData.equipamento[slot]) jogData.equipamento[slot] = item;
    });
    const mochilaKeys = Object.keys(jogData.mochila);
    Object.entries(kit.mochila || {}).forEach(([key, item]) => {
      if (!jogData.mochila[key] && mochilaKeys.length < MOCHILA_MAX) {
        jogData.mochila[key] = { ...item };
        mochilaKeys.push(key);
      }
    });
  }

  const codigo = codigoAleatorio();

  // Sync back to slot with updated state
  const slotData = { ...jogData };
  delete slotData.uid; delete slotData.ativo; delete slotData.consciente;
  await set(ref(db, `chars/${myUid}/s${_activeSlot}`), slotData);
  _charSlots[_activeSlot] = slotData;
  // Keep personagens/${myUid} as active char (for host to read other players' data via uid)
  await set(ref(db, `personagens/${myUid}`), slotData);

  myNome   = p.nome;
  myClasse = p.classe;
  mySala   = codigo;
  amIHost  = true;

  await set(ref(db, `salas/${codigo}`), {
    config: { host: myUid, estado: 'lobby', rodada: 0, criadoEm: serverTimestamp() },
    jogadores: { [myUid]: jogData }
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

  // Use active character slot data
  const charData = _charSlots[_activeSlot];

  // Se a classe mudou em relação ao save, reseta equipamento (kit correto será aplicado abaixo)
  const classeChangedE = charData?.classe && charData.classe !== p.classe;

  const jogData = {
    ...p, uid: myUid, ativo: true,
    xp:          charData?.xp          ?? 0,
    nivel:       charData?.nivel       ?? 1,
    lesoes:      charData?.lesoes      || {},
    titulos:     charData?.titulos     || {},
    posses:      charData?.posses      || {},
    reputacoes:  charData?.reputacoes  || {},
    equipamento: classeChangedE ? {} : (charData?.equipamento || {}),
    mochila:     classeChangedE ? {} : (charData?.mochila     || {}),
  };
  if (!classeChangedE && charData?.hp != null) jogData.hp = Math.min(charData.hp, p.maxHp);

  // Preencher slots vazios com o kit iniciante
  const kitE = STARTER_KITS[p.classe];
  if (kitE) {
    Object.entries(kitE.equipamento || {}).forEach(([slot, item]) => {
      if (item && !jogData.equipamento[slot]) jogData.equipamento[slot] = item;
    });
    const mochilaKeys = Object.keys(jogData.mochila);
    Object.entries(kitE.mochila || {}).forEach(([key, item]) => {
      if (!jogData.mochila[key] && mochilaKeys.length < MOCHILA_MAX) {
        jogData.mochila[key] = { ...item };
        mochilaKeys.push(key);
      }
    });
  }

  // Sync back to slot with updated state
  const slotData = { ...jogData };
  delete slotData.uid; delete slotData.ativo; delete slotData.consciente;
  await set(ref(db, `chars/${myUid}/s${_activeSlot}`), slotData);
  _charSlots[_activeSlot] = slotData;
  // Keep personagens/${myUid} as active char (for host to read other players' data via uid)
  await set(ref(db, `personagens/${myUid}`), slotData);

  myNome   = p.nome;
  myClasse = p.classe;
  mySala   = code;
  amIHost  = data.config?.host === myUid;

  const existing = data.jogadores?.[myUid];
  if (existing) {
    await update(ref(db, `salas/${code}/jogadores/${myUid}`), { ativo: true, ...jogData });
  } else {
    await set(ref(db, `salas/${code}/jogadores/${myUid}`), jogData);
  }
  onDisconnect(ref(db, `salas/${code}/jogadores/${myUid}/ativo`)).set(false);
  irParaJogo(code);
};

// ═══════════════════════════════════════════════════════════════
//  IR PARA JOGO
// ═══════════════════════════════════════════════════════════════
function irParaJogo(codigo) {
  mostrarTela('screen-game');
  document.getElementById('room-code').textContent = codigo;

  _kitMigrado = false;
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

    // Migração: preencher slots/mochila vazios com o kit iniciante
    const eu = jogadores[myUid];
    if (eu && !_kitMigrado) {
      _kitMigrado = true;
      const kit = STARTER_KITS[eu.classe];
      if (kit) {
        const equipAtual   = eu.equipamento || {};
        const mochilaAtual = eu.mochila     || {};
        const mochilaKeys  = Object.keys(mochilaAtual);
        const ups = {};

        Object.entries(kit.equipamento || {}).forEach(([slot, item]) => {
          if (item && !equipAtual[slot]) {
            ups[`salas/${codigo}/jogadores/${myUid}/equipamento/${slot}`] = item;
            ups[`personagens/${myUid}/equipamento/${slot}`]               = item;
          }
        });
        Object.entries(kit.mochila || {}).forEach(([key, item]) => {
          if (!mochilaAtual[key] && mochilaKeys.length < MOCHILA_MAX) {
            ups[`salas/${codigo}/jogadores/${myUid}/mochila/${key}`] = { ...item };
            ups[`personagens/${myUid}/mochila/${key}`]               = { ...item };
            mochilaKeys.push(key);
          }
        });

        if (Object.keys(ups).length) {
          update(ref(db), ups).then(() => toast('Kit inicial aplicado! Abra sua ficha. ⚔', 2500));
        }
      }
    }

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

    // Cancelar timer se saiu do estado avançando
    if (config.estado !== 'avançando') cancelarAutoAvancar();

    // Auto-avançar quando IA sinalizou AVANÇAR
    if (amIHost && config.estado === 'avançando' && !chamandoIA) {
      const ativos = Object.values(jogadores).filter(j => j.vivo && j.consciente && j.ativo && !j.ausente);
      const alguemAgiu = ativos.some(j => j.acao1 != null);
      if (alguemAgiu) {
        cancelarAutoAvancar();
        await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando' });
      } else {
        iniciarAutoAvancar();
      }
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
    const lesoesArr = Object.values(j.lesoes || {});
    const lesaoBadge = lesoesArr.length
      ? `<span class="chip-lesao" title="${lesoesArr.map(l=>l.descricao).join(' | ')}">⚠</span>` : '';
    const nivelBadge = j.nivel > 1 ? `<span class="chip-nivel">Nv${j.nivel}</span>` : '';
    return `<div class="player-chip ${isMe ? 'me' : ''} ${j.ativo === false ? 'offline' : ''} ${j.ausente ? 'ausente' : ''}">
      <span>${icon}</span>
      <span class="chip-name">${j.nome}</span>
      ${j.ausente ? '<span class="chip-ausente">outra cena</span>' : `<span class="chip-hp ${hpCls}">PV ${j.hp}/${j.maxHp}</span>`}
      ${!j.ausente && j.ac != null ? `<span class="chip-hp" style="color:var(--blue)">CA ${j.ac}</span>` : ''}
      ${perIcons ? `<span class="chip-adv">${perIcons}</span>` : ''}
      ${nivelBadge}${lesaoBadge}
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
      const j = Object.values(jogadores).find(j => j.uid === entry.uid);
      const cls = CLASSES[j?.classe] || {};

      // Detecta fala via botão Falar: "Nome diz/grita/sussurra [para X]: "texto""
      const mFala = entry.content.match(/^.+?\s(diz|grita|sussurra)(?:\s+para\s+(.+?))?\s*:\s*"(.+)"$/is);
      if (mFala) {
        const tom = mFala[1];
        const alvoNome = mFala[2] || null;
        const texto = mFala[3];
        const tomIcon = { diz: '💬', grita: '📢', sussurra: '🤫' }[tom] || '💬';

        const _ph = (src, icon, cor, espelhar) =>
          `<div class="dialogo-inline-portrait" style="background:${cor}22;border-color:${cor}55">
            ${src ? `<img src="${src}" alt=""${espelhar ? ' class="espelhado"' : ''} onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
            <span class="dialogo-inline-icon-fb"${src ? ' style="display:none"' : ''}>${icon}</span>
          </div>`;

        const srcJog = j ? `sprites/${j.classe}_${j.sexo || 'm'}.png` : '';
        const htmlEsq = _ph(srcJog, cls.icon || '🧑', '#4a7090', true);

        let htmlDir = '';
        if (alvoNome) {
          const npcKey = Object.keys(NPC_DATA).find(k =>
            alvoNome.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(alvoNome.toLowerCase())
          );
          if (npcKey) {
            const npc = NPC_DATA[npcKey];
            htmlDir = _ph(npc.portrait ? `sprites/${npc.portrait}.png` : '', npc.icon, npc.cor, false);
          } else {
            const ini = getInimigo(alvoNome);
            if (ini) htmlDir = _ph(`sprites/inimigo_${ini.id}.png`, ini.icon || '💀', ini.cor_hp || '#7a1a1a', false);
          }
        }

        div.className = 'dialogo-inline dialogo-jogador';
        div.innerHTML = `
          ${htmlEsq}
          <div class="dialogo-inline-body">
            <div class="dialogo-inline-nome">${j?.nome || 'Jogador'} <span class="dialogo-tom-badge">${tomIcon} ${tom.toUpperCase()}</span></div>
            <div class="dialogo-inline-texto">"${texto}"</div>
          </div>
          ${htmlDir}`;
      } else {
        div.className = 'msg msg-player';
        div.innerHTML = `
          <div class="player-bubble-header">
            <span class="player-bubble-icon">${cls.icon || '⚔️'}</span>
            <span class="player-bubble-nome">${j?.nome || 'Jogador'}</span>
          </div>
          <div class="player-bubble-acao">${entry.content}</div>`;
      }
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

  const totalAtivos = Object.values(_jogadoresCache || {}).filter(j => j.vivo && j.consciente && j.ativo && !j.ausente).length;
  const soloMode    = totalAtivos <= 1;
  if (morto)         setActionStatus('Seu personagem está fora de combate.');
  else if (narrando) setActionStatus('⏳ Narrando...');
  else if (jaEnviou) setActionStatus(soloMode ? '⏳ Processando ação...' : '⏳ Aguardando os outros jogadores...');
  else               setActionStatus('');

  atualizarPromptAcao(eu, config);

  if (iniciarWrap && config.estado !== 'lobby') iniciarWrap.style.display = 'none';
}

function atualizarPromptAcao(eu, config) {
  const storyContent = document.getElementById('story-content');
  if (!storyContent) return;

  let card = document.getElementById('action-prompt-card');
  const estadoAvançando = config.estado === 'avançando';
  const deveExibir = eu && (config.estado === 'aguardando' || estadoAvançando) && eu.acao1 == null && eu.vivo && eu.consciente;

  if (!deveExibir) {
    if (card) card.remove();
    return;
  }

  const novoTipo = estadoAvançando ? 'apc-avançando' : '';
  if (card && card.dataset.tipo !== novoTipo) { card.remove(); card = null; }

  if (!card) {
    card = document.createElement('div');
    card.id = 'action-prompt-card';
    card.dataset.tipo = novoTipo;
    if (estadoAvançando) {
      card.className = 'action-prompt-card apc-avançando';
      card.innerHTML = `
        <div class="apc-icon apc-pulse">⟫</div>
        <div class="apc-body">
          <div class="apc-title">A história continua…</div>
          <div class="apc-sub">Você pode agir a qualquer momento</div>
        </div>`;
    } else {
      card.className = 'action-prompt-card';
      card.innerHTML = `
        <div class="apc-icon">⚔</div>
        <div class="apc-body">
          <div class="apc-title">Declare sua ação</div>
          <div class="apc-sub">O que o seu personagem faz agora?</div>
        </div>
        <div class="apc-arrow">↓</div>`;
    }
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

  // Se estava em auto-avanço e sou o host, cancelar e retornar ao aguardando
  if (amIHost) {
    const configSnap = (await get(ref(db, `salas/${mySala}/config`))).val();
    if (configSnap?.estado === 'avançando') {
      cancelarAutoAvancar();
      await update(ref(db, `salas/${mySala}/config`), { estado: 'aguardando' });
    }
  }
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
//  XP → NÍVEL
// ═══════════════════════════════════════════════════════════════
function calcularNivel(xp) {
  const limites = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  for (let i = limites.length - 1; i >= 0; i--) {
    if (xp >= limites[i]) return i + 1;
  }
  return 1;
}

// ═══════════════════════════════════════════════════════════════
//  PARSEAR STATS (inimigos / HP / lesões / XP)
// ═══════════════════════════════════════════════════════════════
async function processarStats(resposta, jogadores, inimigos) {
  const ups = {};

  // Criar/atualizar inimigos
  for (const [, nome, hp, maxHp, icon] of resposta.matchAll(/\[INIMIGO:([^:]+):(\d+):(\d+):([^\]]+)\]/gi)) {
    const key = nome.trim().replace(/\W/g,'_');
    ups[`salas/${mySala}/inimigos/${key}`] = { nome: nome.trim(), hp: +hp, maxHp: +maxHp, icon: icon.trim() };
  }

  // Atualizar HP inimigo
  for (const [, nome, hp] of resposta.matchAll(/\[HP:([^:]+):(\d+)\]/gi)) {
    const key = nome.trim().replace(/\W/g,'_');
    const ini = inimigos[key] || Object.values(inimigos).find(i => i.nome === nome.trim());
    if (ini) {
      const k = Object.entries(inimigos).find(([,v]) => v === ini)?.[0] || key;
      ups[`salas/${mySala}/inimigos/${k}/hp`] = +hp;
    }
  }

  // Matar inimigo
  for (const [, nome] of resposta.matchAll(/\[MATAR:([^\]]+)\]/gi)) {
    const ini = Object.entries(inimigos).find(([,v]) => v.nome === nome.trim());
    if (ini) ups[`salas/${mySala}/inimigos/${ini[0]}/hp`] = 0;
  }

  // Atualizar HP jogador + persistir no perfil
  for (const [, nome, hp] of resposta.matchAll(/\[JOGADOR:([^:]+):(\d+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const novoHp = Math.max(0, +hp);
      ups[`salas/${mySala}/jogadores/${uid}/hp`] = novoHp;
      ups[`personagens/${uid}/hp`] = novoHp;
    }
  }

  // Marcar jogador como ausente da cena atual
  for (const [, nome] of resposta.matchAll(/\[AUSENTE:([^\]]+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) ups[`salas/${mySala}/jogadores/${entry[0]}/ausente`] = true;
  }

  // Marcar jogador como presente novamente
  for (const [, nome] of resposta.matchAll(/\[PRESENTE:([^\]]+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) ups[`salas/${mySala}/jogadores/${entry[0]}/ausente`] = false;
  }

  // Lesão permanente — grava no perfil e espelha na sala
  for (const [, nome, desc] of resposta.matchAll(/\[LESAO:([^:]+):([^\]]+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const lesaoId = push(ref(db, `personagens/${uid}/lesoes`)).key;
      const lesaoData = { descricao: desc.trim(), ts: Date.now() };
      ups[`personagens/${uid}/lesoes/${lesaoId}`] = lesaoData;
      ups[`salas/${mySala}/jogadores/${uid}/lesoes/${lesaoId}`] = lesaoData;
    }
  }

  // XP — acumula no perfil e espelha na sala
  for (const [, nome, pts] of resposta.matchAll(/\[XP:([^:]+):(\d+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const charSnap = await get(ref(db, `personagens/${uid}`));
      const xpAtual  = charSnap.exists() ? (charSnap.val().xp || 0) : 0;
      const novoXp   = xpAtual + (+pts);
      const novoNivel = calcularNivel(novoXp);
      ups[`personagens/${uid}/xp`]    = novoXp;
      ups[`personagens/${uid}/nivel`] = novoNivel;
      ups[`salas/${mySala}/jogadores/${uid}/xp`]    = novoXp;
      ups[`salas/${mySala}/jogadores/${uid}/nivel`]  = novoNivel;
    }
  }

  // Título permanente
  for (const [, nome, titulo] of resposta.matchAll(/\[TITULO:([^:]+):([^\]]+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const tituloId = push(ref(db, `personagens/${uid}/titulos`)).key;
      const tituloData = { titulo: titulo.trim(), campanhaId: 'beast-of-black-keep', ts: Date.now() };
      ups[`personagens/${uid}/titulos/${tituloId}`] = tituloData;
      ups[`salas/${mySala}/jogadores/${uid}/titulos/${tituloId}`] = tituloData;
    }
  }

  // Posse permanente
  for (const [, nome, desc] of resposta.matchAll(/\[POSSE:([^:]+):([^\]]+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const posseId = push(ref(db, `personagens/${uid}/posses`)).key;
      const posseData = { descricao: desc.trim(), campanhaId: 'beast-of-black-keep', ts: Date.now() };
      ups[`personagens/${uid}/posses/${posseId}`] = posseData;
      ups[`salas/${mySala}/jogadores/${uid}/posses/${posseId}`] = posseData;
    }
  }

  // Reputação em cidade/facção
  for (const [, nome, local, val] of resposta.matchAll(/\[REPUTACAO:([^:]+):([^:]+):(-?\d+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const localKey = local.trim().replace(/\s+/g, '_');
      const repSnap = await get(ref(db, `personagens/${uid}/reputacoes/${localKey}`));
      const repAtual = repSnap.exists() ? (repSnap.val().valor || 0) : 0;
      const novoValor = repAtual + (+val);
      const repData = { valor: novoValor, local: local.trim(), ts: Date.now() };
      ups[`personagens/${uid}/reputacoes/${localKey}`] = repData;
      ups[`salas/${mySala}/jogadores/${uid}/reputacoes/${localKey}`] = repData;
    }
  }

  // Equipar item em slot
  const validSlots = ['cabeca','tronco','mao_d','mao_e','pes'];
  for (const [, nome, slot, item] of resposta.matchAll(/\[EQUIPAR:([^:]+):([^:]+):([^\]]*)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    const slotKey = slot.trim().toLowerCase();
    if (entry && validSlots.includes(slotKey)) {
      const [uid] = entry;
      const itemVal = item.trim() || null;
      ups[`personagens/${uid}/equipamento/${slotKey}`] = itemVal;
      ups[`salas/${mySala}/jogadores/${uid}/equipamento/${slotKey}`] = itemVal;
    }
  }

  // Item na mochila (qtd positiva = adicionar, negativa = remover)
  for (const [, nome, itemNome, qtdStr] of resposta.matchAll(/\[ITEM_BAG:([^:]+):([^:]+):(-?\d+)\]/gi)) {
    const entry = Object.entries(jogadores).find(([,j]) => j.nome === nome.trim());
    if (entry) {
      const [uid] = entry;
      const qtd  = +qtdStr;
      const slug = itemNome.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') || `item_${Date.now()}`;
      const snap = await get(ref(db, `personagens/${uid}/mochila/${slug}`));
      const qtdAtual = snap.exists() ? (snap.val().qtd || 0) : 0;
      const novaQtd  = qtdAtual + qtd;
      if (novaQtd <= 0) {
        ups[`personagens/${uid}/mochila/${slug}`] = null;
        ups[`salas/${mySala}/jogadores/${uid}/mochila/${slug}`] = null;
      } else {
        const mochilaData = { nome: itemNome.trim(), qtd: novaQtd };
        ups[`personagens/${uid}/mochila/${slug}`] = mochilaData;
        ups[`salas/${mySala}/jogadores/${uid}/mochila/${slug}`] = mochilaData;
      }
    }
  }

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
      texto: `Presentes no festival estão vocês: ${nomes}. Aventureiros de ofícios distintos, reunidos pelo acaso numa tarde de outono. O velho Bispo Methodios abençoa a colheita enquanto crianças brincam nas raízes imensas da Árvore Eterna. Uma tarde perfeita... até a primeira criança gritar.` },
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
      await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ataques: extrairAtaques(resposta), ts: Date.now() });
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
//  AUTO-AVANÇO — timer e continuação sem input do jogador
// ═══════════════════════════════════════════════════════════════
const DELAY_AUTO_AVANCAR = 7000;
let _autoAvancarTimer = null;

function iniciarAutoAvancar() {
  if (_autoAvancarTimer) return;
  _autoAvancarTimer = setTimeout(async () => {
    _autoAvancarTimer = null;
    if (!amIHost || !mySala) return;
    await chamarIA_continuar();
  }, DELAY_AUTO_AVANCAR);
}

function cancelarAutoAvancar() {
  if (_autoAvancarTimer) { clearTimeout(_autoAvancarTimer); _autoAvancarTimer = null; }
}

async function chamarIA_continuar() {
  if (chamandoIA) return;
  if (!getApiKey()) { pedirApiKey(() => {}); return; }
  const snap = await get(ref(db, `salas/${mySala}`));
  if (!snap.exists()) return;
  const data = snap.val();
  if (data.config?.estado !== 'avançando') return;
  chamandoIA = true;
  try {
    const { config = {}, jogadores = {}, inimigos = {}, historia = {} } = data;
    const rodada = config.rodada || 1;
    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });
    const hist = Object.values(historia)
      .sort((a,b) => (a.ts||0)-(b.ts||0))
      .filter(e => e.role === 'model' || e.role === 'user')
      .slice(-10);
    const msg = `Rodada ${rodada}.\n\n[Continuação automática — nenhuma nova ação do jogador. Continue a narrativa naturalmente, avançando a cena ou introduzindo um novo elemento.]`;
    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, inimigos), hist, msg, mostrarRetryUI);
    ocultarRetryUI();
    const ups = {};
    if (!resposta) {
      ups[`salas/${mySala}/config/estado`] = 'aguardando';
      ups[`salas/${mySala}/config/rodada`] = rodada + 1;
      await update(ref(db), ups);
      return;
    }
    const temAvançar = extrairAvançar(resposta);
    const respostaFinal = temAvançar ? removerAvançar(resposta) : resposta;
    ups[`salas/${mySala}/config/estado`] = temAvançar ? 'avançando' : 'aguardando';
    ups[`salas/${mySala}/config/rodada`] = rodada + 1;
    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(respostaFinal), falas: extrairFalas(respostaFinal), ataques: extrairAtaques(respostaFinal), ts: Date.now() });
    await processarStats(respostaFinal, jogadores, inimigos);
    await update(ref(db), ups);
  } finally {
    chamandoIA = false;
    ocultarRetryUI();
  }
}

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

    // Sempre limpar acao1 (evita loop infinito em caso de falha da API)
    const ups = {};
    Object.keys(jogadores).forEach(uid => { ups[`salas/${mySala}/jogadores/${uid}/acao1`] = null; });

    if (!resposta) {
      ups[`salas/${mySala}/config/estado`] = 'aguardando';
      ups[`salas/${mySala}/config/rodada`] = rodada + 1;
      await update(ref(db), ups);
      return;
    }

    // Verificar se a IA pediu testes sequenciais
    const testes = extrairTestes(resposta);

    if (testes.length && amIHost) {
      // Apenas o texto ANTES da primeira linha TESTAR vai para a história agora
      // (tudo depois é descartado — a narrativa real vem da segunda chamada IA)
      const primeiroTestar = resposta.search(/^\s*TESTAR:/im);
      const textoAntes = primeiroTestar >= 0 ? resposta.substring(0, primeiroTestar) : '';
      const preamble = limparTags(textoAntes);
      if (preamble) {
        await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: preamble, falas: extrairFalas(textoAntes), ataques: extrairAtaques(textoAntes), ts: Date.now() });
      }
      // Limpar ações agora; estado/rodada avançam após todos os testes
      await update(ref(db), ups);
      // Mostrar cards de teste; segunda chamada IA narra o resultado
      iniciarTestes(testes, jogadores, async (resultados) => {
        const upsPos = {};
        await narrarResultadoTestes(resultados, jogadores, inimigos, hist, rodada, upsPos);
      });
    } else {
      // Fluxo normal sem testes
      const temAvançar = extrairAvançar(resposta);
      const respostaFinal = temAvançar ? removerAvançar(resposta) : resposta;
      ups[`salas/${mySala}/config/estado`] = temAvançar ? 'avançando' : 'aguardando';
      ups[`salas/${mySala}/config/rodada`] = rodada + 1;
      await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(respostaFinal), falas: extrairFalas(respostaFinal), ataques: extrairAtaques(respostaFinal), ts: Date.now() });
      await processarStats(respostaFinal, jogadores, inimigos);
      await update(ref(db), ups);
    }
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
    const lesoesArr  = Object.values(j.lesoes  || {});
    const titulosArr = Object.values(j.titulos || {});
    const possesArr  = Object.values(j.posses  || {});
    const repsArr    = Object.entries(j.reputacoes || {});
    const equip      = j.equipamento || {};
    const mochila    = j.mochila || {};
    const lesoesStr  = lesoesArr.length  ? ` | LESÕES:${lesoesArr.map(l=>l.descricao).join('; ')}` : '';
    const titulosStr = titulosArr.length ? ` | TÍTULOS:${titulosArr.map(t=>t.titulo).join(', ')}` : '';
    const possesStr  = possesArr.length  ? ` | POSSES:${possesArr.map(p=>p.descricao).join(', ')}` : '';
    const repStr     = repsArr.length    ? ` | REP:${repsArr.map(([,r]) => `${r.local||''}${r.valor > 0 ? '+' : ''}${r.valor}`).join(', ')}` : '';
    const nivelStr   = j.nivel > 1 ? ` Nv${j.nivel}` : '';
    const equipParts = [];
    if (equip.cabeca) equipParts.push(`Cabeça:${equip.cabeca}`);
    if (equip.tronco) equipParts.push(`Tronco:${equip.tronco}`);
    if (equip.mao_d)  equipParts.push(`MãoD:${equip.mao_d}`);
    if (equip.mao_e)  equipParts.push(`MãoE:${equip.mao_e}`);
    if (equip.pes)    equipParts.push(`Pés:${equip.pes}`);
    const mochilaItems = Object.values(mochila).map(it => `${it.nome}×${it.qtd||1}`);
    const equipStr   = equipParts.length ? ` | EQUIP:${equipParts.join(', ')}` : '';
    const mochilaStr = mochilaItems.length ? ` | MOCHILA:${mochilaItems.join(', ')}` : '';
    return `${j.nome} (${cls?.nome||j.classe}${nivelStr}) — FOR:${j.STR} DES:${j.DEX} CON:${j.CON} INT:${j.INT} SAB:${j.WIS} CAR:${j.CHA} | PV:${j.hp}/${j.maxHp} CA:${j.ac} Init:${fmt(j.init)}${hab ? ` | Hab:${hab}` : ''}${perStr ? ` | Perícias:${perStr}` : ''}${lesoesStr}${titulosStr}${possesStr}${repStr}${equipStr}${mochilaStr}`;
  }).join('\n');

  const iniList = Object.values(inimigos).filter(i => i.hp > 0).map(i =>
    `${i.icon||'👹'} ${i.nome} — HP:${i.hp}/${i.maxHp}`
  ).join('\n');

  const campCtx = buildCampaignContext();

  return `Você é o Narrador. Escreva em português do Brasil com drama, impacto e tom de folclore sombrio. Seja DIRETO — cada palavra conta.
${buildRegrasContext()}
${campCtx}
VOZ:
- Verbos fortes e sensoriais: "rasga", "despenca", "estala", "cheira a enxofre".
- Foque no RESULTADO das ações, não na preparação.
- ${iniList ? 'COMBATE ATIVO — máximo 40 palavras de narração (após testes). JAMAIS mencione dados, modificadores, CD ou cálculos no texto.' : 'EXPLORAÇÃO — máximo 70 palavras por bloco narrativo (tags FALA não contam no limite).'}
- Mantenha o tom: a floresta observa, os NPCs têm segredos, nada é seguro.
- NUNCA termine com pergunta ao jogador. A narração termina com a consequência da cena.
- Use AVANÇAR (sozinho, última linha da resposta) quando a cena não exige decisão do jogador — ex: consequência já resolvida, transição narrativa natural, momento puramente descritivo, NPC despedindo-se, multidão dispersando. O sistema continuará automaticamente. Não use AVANÇAR se o jogador precisar escolher algo ou se houver combate ativo.
- Se jogadores estiverem em locais diferentes, use [AUSENTE:nome] e [PRESENTE:nome].
- AÇÕES INDIVIDUAIS: cada jogador age de forma INDEPENDENTE. Narre SOMENTE o que CADA UM declarou. NUNCA aplique a ação de um jogador ao grupo todo nem a outros jogadores.

JOGADORES ATIVOS:
${jogList}
${iniList ? `\nINIMIGOS EM CENA:\n${iniList}` : ''}

TESTES DE AÇÃO — quando a ação de um jogador for complexa ou arriscada (correr, saltar, sacar em movimento, atacar pelas costas, etc.), determine quais testes são necessários e liste-os ANTES de narrar qualquer resultado. O sistema rola os dados e você narra depois.
Formato obrigatório (uma linha por teste, na ordem em que ocorrem):
  TESTAR: [NomeExato|Descrição curta da ação|Atributo|CD|Alvo]
Onde Alvo é o nome do inimigo ou NPC que está sendo atacado (opcional, omitir em testes não-combativos).
Atributos válidos: FOR, DES, CON, INT, SAB, CAR, FORT, REF, VON
CD típicas: fácil=8, médio=12, difícil=15, muito difícil=18, heróico=22
Exemplo — "Carne quer correr, sacar a faca e arremessá-la nas costas do goblin":
  TESTAR: [Carne|Golpe de espada|FOR|13|Espantalho 1]
  TESTAR: [Carne|Corrida pelas barracas|DES|10]
Após listar os TESTAR, escreva apenas uma frase curtíssima de suspense (sem revelar o resultado). NÃO narre o desfecho — ele depende dos dados.
Se a ação for simples (atacar de frente, falar com NPC, mover-se para adjacente), não use TESTAR — narre diretamente.

TAGS MECÂNICAS — SOMENTE na última linha da resposta:
STATS: [INIMIGO:nome:hp:hpMax:ícone] [HP:nome:novoHp] [MATAR:nome] [JOGADOR:nome:novoHp] [AUSENTE:nome] [PRESENTE:nome] [LESAO:nome:descrição] [XP:nome:pontos] [TITULO:nome:título] [POSSE:nome:descrição] [REPUTACAO:nome:local:valor] [EQUIPAR:nome:slot:item] [ITEM_BAG:nome:item:qtd]
Exemplos:
  Fim de combate: "STATS: [MATAR:Espantalho 1] [JOGADOR:Aldric:8] [XP:Aldric:25]"
  Recompensa: "STATS: [TITULO:Carne:Cavaleiro de Mhoried] [POSSE:Carne:100 hectares em Mhoried] [REPUTACAO:Carne:Mhoried:3]"
  Lesão: "STATS: [LESAO:Carne:braço direito decepado]"
  Equipar: "STATS: [EQUIPAR:Carne:mao_d:Espada Longa] [EQUIPAR:Carne:tronco:Cota de Malha]"
  Mochila: "STATS: [ITEM_BAG:Carne:Poção de Cura:2] [ITEM_BAG:Carne:Tocha:-1]"
LESAO: somente lesões PERMANENTES irreversíveis. Persiste entre campanhas.
XP: conceda 10-50 pts por vitória ou feito relevante.
TITULO/POSSE/REPUTACAO: use quando a narrativa conferir recompensas concretas ou reconhecimento formal.
EQUIPAR: slots válidos — cabeca, tronco, mao_d, mao_e, pes. Item vazio = desequipar.
ITEM_BAG: qtd positiva = adicionar, negativa = remover da mochila.
VALIDAÇÃO DE EQUIPAMENTO: o jogador APENAS usa armas/itens que constam em EQUIP ou MOCHILA. Se declarar usar algo que não possui, narre o improviso ("sem espada, usa os punhos") ou falha — NUNCA invente itens nem ignore a ausência.

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
