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
//  CLASSES
// ═══════════════════════════════════════════════════════════════
const CLASSES = {
  guerreiro: { nome:'Guerreiro', icon:'⚔️', hp:120, sp:60,  atk:8, def:5  },
  mago:      { nome:'Mago',      icon:'🔮', hp:60,  sp:120, atk:3, def:1  },
  ladino:    { nome:'Ladino',    icon:'🗡️', hp:80,  sp:80,  atk:6, def:3  },
  clerigo:   { nome:'Clérigo',   icon:'✨', hp:90,  sp:100, atk:4, def:4  },
  barbaro:   { nome:'Bárbaro',   icon:'🪓', hp:150, sp:40,  atk:10, def:2 },
  arqueiro:  { nome:'Arqueiro',  icon:'🏹', hp:85,  sp:70,  atk:7, def:3  },
};

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
let _selectedClass = 'guerreiro';

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
//  LOBBY — CLASSE SELEÇÃO
// ═══════════════════════════════════════════════════════════════
document.querySelectorAll('.class-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _selectedClass = btn.dataset.class;
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
});

// ═══════════════════════════════════════════════════════════════
//  SALA — CRIAR / ENTRAR
// ═══════════════════════════════════════════════════════════════
function getDadosPersonagem() {
  const nome  = document.getElementById('char-nome')?.value?.trim();
  const cl    = _selectedClass || 'guerreiro';
  const stats = CLASSES[cl];
  if (!nome) { document.getElementById('lobby-error').textContent = 'Digite o nome do personagem.'; return null; }
  return { nome, classe: cl, hp: stats.hp, maxHp: stats.hp, sp: stats.sp, maxSp: stats.sp, atk: stats.atk, def: stats.def, vivo: true, consciente: true };
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
    await update(ref(db, `salas/${code}/jogadores/${myUid}`), { ativo: true, nome: p.nome, classe: p.classe });
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
    const hpPct = Math.round((j.hp / j.maxHp) * 100);
    const hpCls = hpPct < 30 ? 'low' : 'ok';
    const cls   = CLASSES[j.classe];
    return `<div class="player-chip ${isMe ? 'me' : ''} ${j.ativo === false ? 'offline' : ''}">
      <span>${cls?.icon || '⚔️'}</span>
      <span class="chip-name">${j.nome}</span>
      <span class="chip-hp ${hpCls}">${j.hp}/${j.maxHp}</span>
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
    const j = jogadores[uid];
    const s = CLASSES[j.classe] || CLASSES.guerreiro;
    ups[`salas/${mySala}/jogadores/${uid}/hp`] = s.hp;
    ups[`salas/${mySala}/jogadores/${uid}/maxHp`] = s.hp;
    ups[`salas/${mySala}/jogadores/${uid}/sp`] = s.sp;
    ups[`salas/${mySala}/jogadores/${uid}/maxSp`] = s.sp;
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
async function chamarOpenAI(systemPrompt, history, userMsg, onRetry) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const messages = [
    { role:'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content || '' })),
    { role:'user', content: userMsg }
  ];

  const body = JSON.stringify({ model:'llama-3.3-70b-versatile', messages, temperature:0.85, max_tokens:600 });

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
//  IA — INÍCIO
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

    await update(ref(db, `salas/${mySala}/config`), { estado: 'narrando' });

    const nomes = Object.values(jogadores)
      .map(j => `${j.nome} (${CLASSES[j.classe]?.nome || j.classe})`)
      .join(', ');

    const prompt = `Abra esta campanha de RPG medieval com impacto cinematográfico. Personagens: ${nomes}.

ESTRUTURA DA ABERTURA:
1. AMBIÊNCIA (2 frases): cenário com detalhes sensoriais — sons, cheiros, texturas.
2. PRESSÁGIO (1-2 frases): um detalhe que algo está errado.
3. O ATAQUE: escolha livremente o cenário e antagonistas com detalhes visuais únicos.
4. GANCHO FINAL (1 frase): urgência máxima.

Máximo 100 palavras. Tom épico e cinematográfico.
OBRIGATÓRIO ao final: STATS: [INIMIGO:nome:hp:hpMax:ícone] para cada inimigo.`;

    const resposta = await chamarOpenAI(buildSystemPrompt(jogadores, {}), [], prompt, mostrarRetryUI);
    ocultarRetryUI();

    if (!resposta) {
      await update(ref(db, `salas/${mySala}/config`), { estado: 'lobby' });
      document.getElementById('btn-iniciar-wrap').style.display = amIHost ? 'block' : 'none';
      return;
    }

    await push(ref(db, `salas/${mySala}/historia`), { role:'model', content: limparTags(resposta), ts: Date.now() });
    await processarStats(resposta, jogadores, {});
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
  const jogList = Object.values(jogadores).map(j =>
    `${j.nome} (${CLASSES[j.classe]?.nome||j.classe}) — HP:${j.hp}/${j.maxHp} SP:${j.sp}/${j.maxSp}`
  ).join('\n');

  const iniList = Object.values(inimigos).filter(i => i.hp > 0).map(i =>
    `${i.icon||'👹'} ${i.nome} — HP:${i.hp}/${i.maxHp}`
  ).join('\n');

  return `Você é um narrador de RPG. Escreva em português do Brasil com drama e impacto — mas seja DIRETO. Cada palavra deve contar.

VOZ:
- Verbos fortes: "rasga", "despenca", "estala". Sem enchimento.
- Foque no RESULTADO da ação, não na preparação.
- ${iniList ? 'COMBATE — máximo 70 palavras.' : 'EXPLORAÇÃO — máximo 100 palavras.'}

JOGADORES:
${jogList}
${iniList ? `\nINIMIGOS:\n${iniList}` : ''}

FORMATO DE RESPOSTA:
- Narração curta e impactante.
- Para atualizar HP de inimigos: STATS: [HP:NomeInimigo:novoHp]
- Para matar inimigo: STATS: [MATAR:NomeInimigo]
- Para dano ao jogador: STATS: [JOGADOR:NomeJogador:novoHp]
- Para novos inimigos: STATS: [INIMIGO:nome:hp:hpMax:ícone]`;
}
