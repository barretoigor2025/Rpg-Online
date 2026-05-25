# Oráculo RPG — Registro Canônico de Mecânicas

Repositório: `barretoigor2025/Rpg-Online`  
GitHub Pages: `https://barretoigor2025.github.io/Rpg-Online/`  
Branch de desenvolvimento: `main` (sempre push direto para main)  
Stack: HTML/CSS/JS puro · Firebase Realtime Database compat v9 · Groq API (`llama-3.3-70b-versatile` + `playai-tts`) · Three.js r0.160.0

---

## Tags da IA Narrador

A IA usa tags especiais nas respostas para acionar mecânicas do sistema. Nunca aparecem no texto final exibido ao jogador.

### TESTAR
```
TESTAR: [NomeExato|Descrição curta|Atributo|CD|Alvo?]
```
- Dispara rolagem d20 + mod do atributo contra CD
- Atributos válidos: `FOR DES CON INT SAB CAR FORT REF VON`
- Alvo = nome do inimigo (opcional, só em ataques)
- d20 natural 20 → CRÍTICO · d20 natural 1 → CATÁSTROFE
- Múltiplos TESTAR são sequenciais com animação de dado acumulando lista
- O overlay Three.js exibe tudo antes de narrar o resultado

### ROLAR
```
ROLAR: [NomeExato|Descrição do dano|NotaçãoDados|Alvo?]
```
- Aparece logo após TESTAR de ataque com alvo
- Sistema cancela automaticamente se o TESTAR pai falhou
- Notação: `1d20`, `2d6`, `1d8+3`, `1d4-1` etc.
- Usa dado animado Three.js; dados de dano usam geometria d4/d6/d8/d10/d12/d20 correspondente

### FECHAR_ATO
```
FECHAR_ATO: [Título evocativo do ato]
```
- Penúltima linha (antes de AVANÇAR), sozinha
- Dispara cinematica de encerramento de capítulo: tela preta com título dourado (5.5s)
- Avança `config.parte` para o próximo (`parte1→parte2→parte3`)
- Deve ser seguido de `AVANÇAR` para o sistema narrar a abertura do próximo capítulo
- Usar quando: objetivo central do ato resolvido + novo gancho narrativo surgindo

### AVANÇAR
```
AVANÇAR
```
- Última linha da resposta da IA (sozinho)
- Estado Firebase `config.estado = 'avançando'`
- Botão ⏩ Avançar aparece para todos; quando todos clicam → `chamarIA_jogadoresAvançam()` com prompt de "Mestre entrando na cena"
- Timer de auto-avanço se ninguém clicar

### FALA
```
FALA: [NomeNPC|"frase completa"]
```
- Bolha de diálogo inline na história
- Multi-turno suportado (várias FALAs na mesma resposta)

### STATS
```
STATS: [tag:param:param...]
```
Só na última linha. Tags disponíveis:
| Tag | Efeito |
|-----|--------|
| `INIMIGO:nome:hp:hpMax:ícone` | Cria/atualiza inimigo |
| `HP:nome:novoHp` | Altera HP de personagem |
| `MATAR:nome` | Remove inimigo da cena |
| `JOGADOR:nome:novoHp` | Altera HP de jogador |
| `AUSENTE:nome` | Marca jogador como ausente |
| `PRESENTE:nome` | Retorna jogador à cena |
| `LESAO:nome:descrição` | Lesão permanente |
| `XP:nome:pontos` | Concede XP (10–50 pts) |
| `TITULO:nome:título` | Confere título |
| `POSSE:nome:descrição` | Confere posse |
| `REPUTACAO:nome:local:valor` | Reputação regional |
| `EQUIPAR:nome:slot:item` | Equipa item (slots: `cabeca tronco mao_d mao_e pes`) |
| `ITEM_BAG:nome:item:qtd` | Adiciona (qtd+) ou remove (qtd-) da mochila |

---

## Mecânicas do Sistema (Frontend)

### Troca de Itens entre Jogadores ✅
**Botão:** 🤝 Troca (action bar, ao lado de Skills)  
**Firebase node:** `salas/${id}/troca: { estado, iniciador, alvo, ts }`  
**Fluxo:**
1. Iniciador abre modal → seleciona jogador alvo
2. Firebase escreve `troca: { estado:'pendente', iniciador, alvo }`
3. Listener `onValue` detecta → alvo recebe modal de convite na tela
4. Alvo aceita → `estado = 'ativa'` · Alvo recusa → `troca = null`
5. Iniciador vê sua mochila, seleciona itens (Set `_trocaItens`)
6. Confirma → transferência atômica `update(ref(db), ups)`:
   - Remove slugs da mochila do iniciador (`salas/` + `personagens/`)
   - Adiciona na mochila do alvo (merge de qtd se slug já existe)
   - `troca = null`
7. Push para `historia`: `{ role:'trade', content, de, para, itens[], ts }`
8. Card verde `🤝 X entregou Y para Z.` aparece no story de todos

**IA ciente:** entradas `role:'trade'` são incluídas no histórico enviado à IA como `[TROCA] X entregou Y para Z.` para que o narrador possa comentar dramaticamente.

**Demo:** `https://barretoigor2025.github.io/Rpg-Online/troca-demo.html`

---

### Rolagem de Dados 3D (Three.js) ✅
**IIFE:** `DiceOverlay` em `js/main.js`  
**Demo:** `https://barretoigor2025.github.io/Rpg-Online/versus-demo.html`  
- Dados: d4 (tetraedro), d6 (cubo), d8 (octaedro), d10 (bipiramide pentagonal custom), d12 (dodecaedro), d20 (icosaedro)
- Vermelhos sólidos `MeshStandardMaterial({ color:0xbf1a0c, side:THREE.DoubleSide })`
- Linhas brancas nas arestas via `EdgesGeometry + LineSegments`
- Animação: queda de y=140 → y=0 (bounce) + spin rápido 18rad/s → desaceleração quadrática → para
- Die começa em `y=140` (câmera vê ±120 unidades — dado entra pelo topo do frame sem corte)
- Número do resultado aparece **sobreposto no rosto do dado** via `.dado-canvas-wrap { position:relative }` + `.dado-num-jogo { position:absolute; inset:0 }` — com glow colorido (verde=acerto, vermelho=falha, dourado=crítico) e sombra escura para legibilidade
- Veredicto ACERTO/FALHA/CRÍTICO/CATÁSTROFE aparece 500ms depois, abaixo do dado
- Retratos de atacante e alvo flanqueiam o dado (`.dado-portrait-vs`) — `.dado-versus-row { align-items:center }`
- Sequencial: playlist de rolls com histórico acumulado na tela
- ROLAR condicional: se TESTAR pai falhou → mostra CANCELADO sem animar
- **CRÍTICO em canvas multi-roll:** `_initThree` SEMPRE chama `_rend.setSize(SZ,SZ)` mesmo no early-return — NUNCA fazer `cv.width = SZ` manualmente antes de cada roll (destrói o framebuffer WebGL e corta o dado a partir do 2º roll)

---

### Mochila ✅
- Estrutura: `{ slug: { nome, qtd, slot? } }` em `salas/${id}/jogadores/${uid}/mochila/` e `personagens/${uid}/mochila/`
- Máximo 11 itens + 1 slot de dinheiro (`MOCHILA_ITENS = 11`, `MOCHILA_MAX = 12`)
- Delete = `null` no Firebase update
- Global: `_jogadoresCache`, `myUid`, `mySala`

### Skills Panel ✅
- **Ficha (📋):** atributos, equipamento, perícias — `toggleSkillsPanel()`
- **Skills (📜):** modal centralizado com habilidades de classe + magias — `togglePericiasPanel()`
  - Mago: Grimório + 3 magias escolhidas na criação
  - Outras classes: poderes da classe
  - Badges coloridos: ativo/passivo/combate/diário/ritual/temporário/perícia

### Falar ✅
- Overlay de bolha de NPC/jogador — `abrirFalar()`

### Sistema de Criaturas ✅
**Bestiário:** `campanhas/beast-of-black-keep/inimigos.json` — 21 criaturas com campos canônicos:
- `stats_dnd: { FOR, DES, CON, INT, SAB, CAR, CA }` — usados em combate via `getEnemyAttrMod(ini, attr)`
- `comportamento` — `bestial | agressivo | sadico | calculista | covarde_em_grupo | berserk | oportunista | territorial_perturbado | hostil_calculista | agressivo_desesperado`
- `pode_dialogar` — boolean; se true, IA pode pausar combate para roleplay usando a `fraqueza_social`
- `fraqueza_social` — o que faz a criatura baixar a guarda (null se bestial)
- `motivacao` — o que move a criatura narrativamente
- `ataques_principais` — array de strings com notação de dano; IA usa esses ataques no combate
- `poderes_especiais` — habilidades especiais que a IA deve usar
- `resistencias` — tipos de dano com resistência

**Em combate:** `getEnemyAttrMod(ini, attr)` converte `stats_dnd` em modificador D&D. `iniciarTestes` chama `getInimigo(t.nomeJog)` quando o atacante não é um jogador, e usa `getEnemyAttrMod` para o roll.

**No system prompt:** `iniList` inclui CA, comportamento, PODE NEGOCIAR, fraqueza social, ataques e poderes — tudo que a IA precisa para narrar cada criatura com identidade única.

### Sistema de Avançar ✅
- Ação especial `'__avançar__'`
- **Em estado `'aguardando'`:** todos clicam ⏩ Avançar → aciona `chamarIA_jogadoresAvançam()` (skip de turno)
- **Em estado `'avançando'`** (após tag AVANÇAR da IA): botão muda para "▶ Continuar" e fica visível a todos. Cada jogador clica → seta `acao1:'__avançar__'`. Quando TODOS confirmam, host dispara `chamarIA_continuar()` imediatamente. Fallback: auto-timer de 45s caso alguém fique AFK.
- `chamarIA_continuar` limpa `acao1` de todos ao iniciar (evita re-trigger do listener)
- Prompt especial: Mestre entra em cena, máximo 80 palavras

### Dados Multiplayer Sincronizados ✅
**Firebase node:** `salas/${id}/rolagem: { rolls: [...], ts } | null`
**Fluxo:**
1. Host calcula toda a playlist em `iniciarTestes` (d20s + ROLARs intercalados)
2. Serializa via `serializeRoll(r)` — strip do campo `jog` (objeto player não-serializável)
3. Escreve `salas/${mySala}/rolagem: { rolls, ts }` atomicamente antes de mostrar os dados localmente
4. Non-hosts: `onValue` em `salas/${codigo}/rolagem` → `DiceOverlay.mostrar(data.rolls, () => {})`
5. Host: afterCb do `DiceOverlay.mostrar` limpa `rolagem: null` antes de `narrarResultadoTestes`
6. `unsubRolagem` gerenciado junto com `unsubSala` (criado em `irParaJogo`, destruído em `deixarSala`)
- Todos os jogadores veem os mesmos dados girando com retratos de atacante/alvo em tempo real
- `amIHost` guard no listener: host não aciona `DiceOverlay` pelo Firebase (usa path direto)

---

## Firebase Schema (principais nós)

```
salas/${codigo}/
  config/          { host, estado, rodada, campanha... }
  jogadores/${uid}/ { nome, classe, hp, maxHp, ac, mochila{}, equipamento{}, acao1, ... }
  historia/${push}/ { role, content, ts, falas?, ataques?, de?, para?, itens? }
  inimigos/${push}/ { nome, hp, maxHp, icon }
  troca/           { estado, iniciador, alvo, ts }  ← null quando não há troca ativa
  rolagem/         { rolls: [...serialized], ts }   ← null quando não há rolagem ativa

personagens/${uid}/  ← espelho do jogador ativo (lido pelo host para builds dos outros)
chars/${uid}/s${0..7}/  ← slots de personagem salvos
```

---

## Variáveis Globais Importantes

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `myUid` | string | UID do jogador atual (localStorage) |
| `mySala` | string | Código da sala atual |
| `amIHost` | bool | Se sou o host (narrador) |
| `chamandoIA` | bool | Lock para evitar chamadas duplas |
| `_jogadoresCache` | object | Snapshot atual de todos os jogadores |
| `_trocaItens` | Set | Slugs selecionados para troca |
| `_trocaAtual` | object | Snapshot do nó `troca` do Firebase |
| `MOCHILA_MAX` | 12 | Capacidade total da mochila |
| `MOCHILA_ITENS` | 11 | Slots de itens (excluindo dinheiro) |

---

## Padrão de Update Firebase

```js
const ups = {};
ups[`salas/${mySala}/jogadores/${uid}/campo`] = valor;
ups[`personagens/${uid}/campo`] = valor;  // sempre espelhar
// null = deletar
await update(ref(db), ups);  // atômico
```

---

## Classes e Poderes

| Classe | Ícone | Habilidade | Poderes |
|--------|-------|-----------|---------|
| Guerreiro | ⚔️ | Ataque Extra | Golpe Poderoso, Postura de Defesa, Segundo Fôlego |
| Mago | 🔮 | Grimório | Pool de 9 magias, escolhe 3 na criação |
| Ladino | 🗡️ | Ataque Furtivo | Evasão, Veneno, Sombras |
| Clérigo | ✨ | Canalizar Divindade | Bênção, Curar Ferimentos, Expulsar Mortos-Vivos, Escudo da Fé |
| Bárbaro | 🪓 | Fúria | Golpe Devastador, Pele de Ferro, Uivo de Guerra |
| Arqueiro | 🏹 | Olho de Águia | Tiro Preciso, Chuva de Flechas, Passo do Vento |

---

## Versão do cache JS

Incrementar `?v=N` em `index.html` a cada deploy que altere `main.js` ou `layout.css`.  
Versão atual: `?v=46`
