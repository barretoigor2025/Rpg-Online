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
    .replace(/^\s*FALA:\s*\[[^\]]+\]\s*$/gim, '')
    .replace(/^\s*TESTAR:\s*\[[^\]]+\]\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ═══════════════════════════════════════════════════════════════
//  NPC — DADOS DE DIÁLOGO
// ═══════════════════════════════════════════════════════════════
const NPC_DATA = {
  'Gregoras Pellos':  { icon: '🗡️', cor: '#607080', voz: 'Fritz-PlayAI',   portrait: 'npc_gregoras_pellos'         },
  'Catherine':        { icon: '👑', cor: '#b08030', voz: 'Val-PlayAI',      portrait: 'npc_catherine_laskaris'      },
  'Hobbleboot Sam':   { icon: '🥾', cor: '#5a7a4a', voz: 'Briggs-PlayAI',  portrait: 'npc_hobbleboot_sam'          },
  'Mutter Grimmhaar': { icon: '🧙', cor: '#6a3a6a', voz: 'Deedee-PlayAI',  portrait: 'npc_mutter_grimmhaar'        },
  'Wulfram':          { icon: '🦌', cor: '#6a5a30', voz: 'Orion-PlayAI',   portrait: 'npc_wulfram_chifrado'        },
  'Príncipe Kalos':   { icon: '🧝', cor: '#305070', voz: 'Gideon-PlayAI',  portrait: 'npc_principe_kalos'          },
  'Rei Chutter':      { icon: '👹', cor: '#7a1a1a', voz: 'Thunder-PlayAI', portrait: 'npc_rei_chutter'             },
  'Mac Rónán':        { icon: '🌿', cor: '#3a6a3a', voz: 'Briggs-PlayAI',  portrait: 'npc_mac_ronan'               },
  'Muirenn':          { icon: '🌱', cor: '#3a5a40', voz: 'Nova-PlayAI',    portrait: 'npc_muirenn'                 },
  'Ruzalka':          { icon: '💧', cor: '#306a8a', voz: 'Nova-PlayAI',    portrait: 'npc_ruzalka'                 },
  'Blunkin':          { icon: '🦎', cor: '#4a5a2a', voz: 'Fritz-PlayAI',   portrait: 'npc_blunkin_esmaga_cranios'  },
  'Drizzle':          { icon: '🦎', cor: '#5a6a3a', voz: 'Fritz-PlayAI',   portrait: 'npc_drizzle'                 },
  'Oswald':           { icon: '👁️', cor: '#5a6a70', voz: 'Thunder-PlayAI', portrait: 'npc_duque_oswald_thool'      },
  'Choir':            { icon: '💀', cor: '#2a1a3a', voz: 'Gideon-PlayAI',  portrait: 'npc_choir_necromante'        },
  'Fariborz':         { icon: '🔥', cor: '#7a3a10', voz: 'Orion-PlayAI',   portrait: 'npc_fariborz_piromante'      },
  'Aelar':            { icon: '🏹', cor: '#3a5a40', voz: 'Val-PlayAI',     portrait: 'npc_aelar_eisenli'           },
  'Finn Willowheel':  { icon: '👟', cor: '#6a5a30', voz: 'Briggs-PlayAI',  portrait: 'npc_finn_willowheel'         },
  'Dvalinn':          { icon: '⛏️', cor: '#5a4a30', voz: 'Thunder-PlayAI', portrait: 'npc_dvalinn_anao'            },
  'Valmorien':        { icon: '🎯', cor: '#4a5a3a', voz: 'Fritz-PlayAI',   portrait: 'npc_valmorien'               },
  'Ysoria':           { icon: '🏹', cor: '#4a6a3a', voz: 'Nova-PlayAI',    portrait: 'npc_ysoria'                  },
  'Rootflayer':       { icon: '🌳', cor: '#3a2a1a', voz: 'Thunder-PlayAI'                                          },
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

// ═══════════════════════════════════════════════════════════════
//  SISTEMA DE TESTES SEQUENCIAIS
// ═══════════════════════════════════════════════════════════════
function extrairTestes(txt) {
  const testes = [];
  const re = /^\s*TESTAR:\s*\[([^\|]+)\|([^\|]+)\|([^\|]+)\|(\d+)\]/gim;
  let m;
  while ((m = re.exec(txt)) !== null) {
    testes.push({ nomeJog: m[1].trim(), acao: m[2].trim(), attr: m[3].trim().toUpperCase(), dc: +m[4] });
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

let _testeFila      = [];
let _testeResultados = [];
let _testeCallbackFn = null;

function iniciarTestes(testes, jogadores, afterCb) {
  if (!testes.length) { afterCb([]); return; }
  _testeFila = testes.map(t => ({
    ...t,
    jog: Object.values(jogadores).find(j => j.nome === t.nomeJog) || null
  }));
  _testeResultados  = [];
  _testeCallbackFn  = afterCb;
  mostrarProximoTeste();
}

function mostrarProximoTeste() {
  const overlay = document.getElementById('teste-overlay');
  if (!_testeFila.length) {
    if (overlay) overlay.style.display = 'none';
    const cb = _testeCallbackFn;
    _testeCallbackFn = null;
    if (cb) cb(_testeResultados);
    return;
  }

  const t   = _testeFila.shift();
  const mod = getAttrMod(t.jog, t.attr);
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total   = d20 + mod;
  const sucesso = total >= t.dc;
  _testeResultados.push({ ...t, d20, mod, total, sucesso });

  const modStr  = mod >= 0 ? `+${mod}` : `${mod}`;
  const cor     = sucesso ? '#5cb85c' : '#c9534f';
  const icon    = sucesso ? '✅' : '❌';
  const restante = _testeFila.length;

  if (overlay) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="teste-card">
        <div class="teste-card-nome">${t.nomeJog}</div>
        <div class="teste-card-acao">${t.acao}</div>
        <div class="teste-card-atributo">${t.attr} <span class="teste-mod">(${modStr})</span></div>
        <div class="teste-dice-area">
          <div class="teste-d20-face">${d20}</div>
          <div class="teste-formula">d20 ${modStr} = <strong>${total}</strong> &nbsp;vs&nbsp; CD ${t.dc}</div>
        </div>
        <div class="teste-resultado" style="color:${cor}">${icon} ${sucesso ? 'SUCESSO' : 'FALHA'}</div>
        <button class="teste-avancar-btn" onclick="avancarTeste()">
          ${restante > 0 ? `▶ Próximo teste (${restante} restante${restante > 1 ? 's' : ''})` : '▶ Ver resultado'}
        </button>
      </div>`;
  }
}

window.avancarTeste = function() { mostrarProximoTeste(); };

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
    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ts: Date.now() });
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
    const res = await fetch('campanhas/beast-of-black-keep/campanha.json');
    if (!res.ok) return;
    _campanha = await res.json();
    const el = document.getElementById('campaign-name');
    if (el && _campanha) el.textContent = `📖 ${_campanha.titulo}`;
  } catch(e) {
    console.warn('Campanha não carregada:', e);
  }
}

async function carregarRegras() {
  const arquivos = ['sistema', 'personagem', 'dialogo', 'narrativa', 'recompensas'];
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
  const linhas = [];

  const narrativa = _regras.narrativa;
  if (narrativa?.voz) linhas.push('VOZ: ' + narrativa.voz.slice(0, 4).join(' | '));

  const dialogo = _regras.dialogo;
  if (dialogo) {
    const bloco = [`DIÁLOGO — PADRÃO OFICIAL OBRIGATÓRIO (${dialogo.versao || ''})`];
    bloco.push(`Formato: ${dialogo.formato}`);
    if (dialogo.regras) dialogo.regras.forEach(r => bloco.push('• ' + r));
    if (dialogo.exemplos?.length) {
      bloco.push('Exemplos corretos:');
      dialogo.exemplos.forEach(e => bloco.push(e));
    }
    linhas.push(bloco.join('\n'));
  }

  const personagem = _regras.personagem;
  if (personagem?.tags) linhas.push('TAGS PERSONAGEM:\n' + personagem.tags.map(t => '• ' + t).join('\n'));

  const recompensas = _regras.recompensas;
  if (recompensas?.categorias) {
    const c = recompensas.categorias;
    linhas.push('TAGS RECOMPENSAS:\n' +
      `• ${c.titulos.tag} — ${c.titulos.regra}\n` +
      `• ${c.posses.tag} — ${c.posses.regra}\n` +
      `• ${c.reputacao.tag} — ${c.reputacao.regra}`
    );
  }

  return linhas.length ? `\n═══ REGRAS DO SISTEMA ═══\n${linhas.join('\n\n')}\n` : '';
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

  // Carregar perfil persistente (se existe)
  const charSnap = await get(ref(db, `personagens/${myUid}`));
  const charData = charSnap.exists() ? charSnap.val() : null;

  // Montar dados do jogador para esta sala (com persistência)
  const jogData = {
    ...p, uid: myUid, ativo: true,
    xp:         charData?.xp         ?? 0,
    nivel:      charData?.nivel      ?? 1,
    lesoes:     charData?.lesoes     || {},
    titulos:    charData?.titulos    || {},
    posses:     charData?.posses     || {},
    reputacoes: charData?.reputacoes || {},
    equipamento: charData?.equipamento || {},
    mochila:    charData?.mochila    || {},
  };
  if (charData?.hp != null) jogData.hp = Math.min(charData.hp, p.maxHp);

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

  // Criar ou atualizar perfil persistente
  if (!charSnap.exists()) {
    await set(ref(db, `personagens/${myUid}`), {
      nome: p.nome, classe: p.classe, sexo: p.sexo, uid: myUid,
      STR: p.STR, DEX: p.DEX, CON: p.CON, INT: p.INT, WIS: p.WIS, CHA: p.CHA,
      hp: jogData.hp, maxHp: p.maxHp, ac: p.ac, init: p.init,
      fort: p.fort, ref: p.ref, will: p.will,
      pericias: p.pericias, vivo: true, xp: 0, nivel: 1,
      equipamento: jogData.equipamento, mochila: jogData.mochila
    });
  } else {
    await update(ref(db, `personagens/${myUid}`), {
      nome: p.nome, classe: p.classe, sexo: p.sexo, maxHp: p.maxHp,
      ac: p.ac, init: p.init, fort: p.fort, ref: p.ref, will: p.will, pericias: p.pericias,
      equipamento: jogData.equipamento, mochila: jogData.mochila
    });
  }

  const codigo = codigoAleatorio();
  await push(ref(db, `personagens/${myUid}/historico`), { sala: codigo, campanhaId: 'beast-of-black-keep', ts: Date.now() });

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

  // Carregar perfil persistente
  const charSnap = await get(ref(db, `personagens/${myUid}`));
  const charData = charSnap.exists() ? charSnap.val() : null;

  const jogData = {
    ...p, uid: myUid, ativo: true,
    xp:          charData?.xp          ?? 0,
    nivel:       charData?.nivel       ?? 1,
    lesoes:      charData?.lesoes      || {},
    titulos:     charData?.titulos     || {},
    posses:      charData?.posses      || {},
    reputacoes:  charData?.reputacoes  || {},
    equipamento: charData?.equipamento || {},
    mochila:     charData?.mochila     || {},
  };
  if (charData?.hp != null) jogData.hp = Math.min(charData.hp, p.maxHp);

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

  if (!charSnap.exists()) {
    await set(ref(db, `personagens/${myUid}`), {
      nome: p.nome, classe: p.classe, sexo: p.sexo, uid: myUid,
      STR: p.STR, DEX: p.DEX, CON: p.CON, INT: p.INT, WIS: p.WIS, CHA: p.CHA,
      hp: jogData.hp, maxHp: p.maxHp, ac: p.ac, init: p.init,
      fort: p.fort, ref: p.ref, will: p.will,
      pericias: p.pericias, vivo: true, xp: 0, nivel: 1,
      equipamento: jogData.equipamento, mochila: jogData.mochila
    });
  } else {
    await update(ref(db, `personagens/${myUid}`), {
      nome: p.nome, classe: p.classe, sexo: p.sexo, maxHp: p.maxHp,
      ac: p.ac, init: p.init, fort: p.fort, ref: p.ref, will: p.will, pericias: p.pericias,
      equipamento: jogData.equipamento, mochila: jogData.mochila
    });
  }
  await push(ref(db, `personagens/${myUid}/historico`), { sala: code, campanhaId: 'beast-of-black-keep', ts: Date.now() });

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
  document.getElementById('screen-lobby').style.display = 'none';
  document.getElementById('screen-game').style.display  = 'flex';
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
        await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: preamble, falas: extrairFalas(textoAntes), ts: Date.now() });
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
      ups[`salas/${mySala}/config/estado`] = 'aguardando';
      ups[`salas/${mySala}/config/rodada`] = rodada + 1;
      await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), falas: extrairFalas(resposta), ts: Date.now() });
      await processarStats(resposta, jogadores, inimigos);
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
- Se jogadores estiverem em locais diferentes, use [AUSENTE:nome] e [PRESENTE:nome].
- AÇÕES INDIVIDUAIS: cada jogador age de forma INDEPENDENTE. Narre SOMENTE o que CADA UM declarou. NUNCA aplique a ação de um jogador ao grupo todo nem a outros jogadores.

JOGADORES ATIVOS:
${jogList}
${iniList ? `\nINIMIGOS EM CENA:\n${iniList}` : ''}

TESTES DE AÇÃO — quando a ação de um jogador for complexa ou arriscada (correr, saltar, sacar em movimento, atacar pelas costas, etc.), determine quais testes são necessários e liste-os ANTES de narrar qualquer resultado. O sistema rola os dados e você narra depois.
Formato obrigatório (uma linha por teste, na ordem em que ocorrem):
  TESTAR: [NomeExato|Descrição curta da ação|Atributo|CD]
Atributos válidos: FOR, DES, CON, INT, SAB, CAR, FORT, REF, VON
CD típicas: fácil=8, médio=12, difícil=15, muito difícil=18, heróico=22
Exemplo — "Carne quer correr, sacar a faca e arremessá-la nas costas do goblin":
  TESTAR: [Carne|Corrida pelas barracas|DES|10]
  TESTAR: [Carne|Saque da faca em movimento|DES|13]
  TESTAR: [Carne|Arremesso nas costas|DES|15]
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
