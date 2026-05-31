# Padrão Técnico e Artístico de Sprites
## Projeto: Oráculo RPG — Jogo Tático em Pixel Art

> **Para a IA que receber este documento:**
> Leia na íntegra antes de produzir qualquer sprite.
> Cada seção é uma decisão já tomada. Não reinvente o que está aqui.

---

## 1. Decisão Principal: Novo Padrão Definitivo

### Regra Absoluta

Todos os sprites serão produzidos **SEM pedestal**.

Isso significa — proibido:
- base de pedra
- bloquinho embaixo
- tile decorativo acoplado ao sprite
- quadrado/hexágono desenhado embaixo
- marca de ocupação embutida na arte

### Motivo

O pedestal atrapalhava o uso real no mapa tático.
O novo padrão separa claramente:

| O que pertence ao **sprite** | O que pertence ao **sistema** |
|---|---|
| personagem / criatura | grid do mapa |
| silhueta | quadrados ocupados |
| pose, roupa, anatomia | seleção / alvo / alcance |
| estilo pixel art | movimento / área de efeito |

---

## 2. Princípio de Produção

```
SPRITE = arte limpa da unidade
MAPA   = mostra o grid
SISTEMA = decide quantos quadrados ela ocupa
```

---

## 3. Padrão Visual Oficial (DNA Artístico)

### Referência Estética Central

Mistura de:
- **Final Fantasy Tactics** (PS1)
- **Ragnarok Online**
- pixel art tática, fantasia medieval sombria
- visual mais maduro, não infantil

### Características Obrigatórias

- pixel art limpa com leitura clara de silhueta
- traço sério — não cartunesco infantil
- corpo inteiro visível
- pose idle neutra ou levemente pronta para combate
- perspectiva 3/4 / isométrica
- detalhamento de sprite tático: roupa/equipamento legíveis
- boa definição facial dentro do limite do pixel art
- mais próximo de "sprite de jogo tático" do que de "mascote fofo"

### Características Proibidas

- proporção infantil/chibi exagerada
- cabeças excessivamente grandes
- aparência "bonequinho fofo"
- deformação AI painterly (borrado, sem pixels definidos)
- excesso de detalhes caóticos
- pose espalhafatosa demais
- pedestal embutido de qualquer tipo

---

## 4. Regras Técnicas Obrigatórias para TODO Sprite

| Regra | Detalhe |
|---|---|
| Fundo | transparente (PNG com canal alpha) |
| Pedestal | inexistente |
| Chão embutido | proibido |
| Grid desenhado | proibido |
| Posicionamento | personagem/criatura centralizado |
| Âncora | base do corpo alinhada no limite inferior da composição |
| Uso no mapa | pronto para ser colocado sobre mapa tático |
| Grid | compatível com grid quadrado/isométrico |
| Enquadramento | unidade inteira deve caber no sprite |

> Criaturas grandes podem ultrapassar visualmente a área ocupada, mas a **ocupação oficial é definida pela ficha técnica**, não pela arte.

---

## 5. Convenção de Nomes de Arquivo

```
[tipo]_[slug]_[largura]x[altura].png
```

**Tipos válidos:**
- `player` — classes jogáveis
- `npc` — personagens não jogáveis
- `enemy` — inimigos

**Exemplos:**
```
player_guerreiro_m_1x1.png
player_arqueira_f_1x1.png
npc_catherine_laskaris_1x1.png
npc_rei_chutter_2x2.png
enemy_manticora_albina_2x2.png
enemy_mother_clutch_3x3.png
enemy_larva_gigante_3x2.png
```

---

## 6. Ocupação de Espaço no Mapa

A ocupação **NÃO é desenhada no sprite**. É definida por dados técnicos.

| Tamanho | Uso típico |
|---|---|
| 1×1 | humanoide normal |
| 2×1 | criatura comprida média |
| 2×2 | monstro grande |
| 3×2 | criatura enorme alongada |
| 3×3 | boss muito grande |

---

## 7. Manifesto Técnico (JSON por Sprite)

Cada sprite tem um manifesto técnico associado.

```json
{
  "id": "manticora_albina",
  "name": "Manticora Albina",
  "type": "enemy",
  "sprite": "sprites/enemies/enemy_manticora_albina_2x2.png",
  "size": {
    "width": 2,
    "height": 2
  },
  "anchor": "center-bottom",
  "gridShape": "square",
  "hasPedestal": false,
  "styleFamily": "fft_ragnarok_tactical",
  "notes": "Sprite sem pedestal. Ocupa 2×2 quadrados. A arte pode ultrapassar visualmente a área ocupada."
}
```

**Campo `anchor`:** sempre `"center-bottom"` — o ponto de encaixe no mapa é a base central inferior.

---

## 8. Inventário — Classes Jogáveis

Todas as classes jogáveis ocupam **1×1**.

| id | Nome | Arquivo |
|---|---|---|
| guerreiro_m | Guerreiro Masculino | player_guerreiro_m_1x1.png |
| guerreiro_f | Guerreira Feminina | player_guerreiro_f_1x1.png |
| mago_m | Mago Masculino | player_mago_m_1x1.png |
| mago_f | Maga Feminina | player_mago_f_1x1.png |
| ladino_m | Ladino Masculino | player_ladino_m_1x1.png |
| ladino_f | Ladina Feminina | player_ladina_f_1x1.png |
| clerigo_m | Clérigo Masculino | player_clerigo_m_1x1.png |
| clerigo_f | Clériga Feminina | player_cleriga_f_1x1.png |
| barbaro_m | Bárbaro Masculino | player_barbaro_m_1x1.png |
| barbaro_f | Bárbara Feminina | player_barbara_f_1x1.png |
| arqueiro_m | Arqueiro Masculino | player_arqueiro_m_1x1.png |
| arqueiro_f | Arqueira Feminina | player_arqueira_f_1x1.png |

---

## 9. Inventário — NPCs

NPCs humanoides normais: **1×1**.
Exceções: Oswald/Thool = 2×2, Rei Chutter = 2×2.

| id | Nome | Arquivo | Ocupação |
|---|---|---|---|
| catherine_laskaris | Duquesa Catherine Laskaris | npc_catherine_laskaris_1x1.png | 1×1 |
| gregoras_pellos | Sir Gregoras Pellos | npc_gregoras_pellos_1x1.png | 1×1 |
| hobbleboot_sam | Hobbleboot Sam | npc_hobbleboot_sam_1x1.png | 1×1 |
| oswald_thool | Duque Oswald / Thool | npc_oswald_thool_2x2.png | 2×2 |
| mutter_grimmhaar | Mutter Grimmhaar | npc_mutter_grimmhaar_1x1.png | 1×1 |
| wulfram | Wulfram | npc_wulfram_1x1.png | 1×1 |
| principe_kalos | Príncipe Kalos | npc_principe_kalos_1x1.png | 1×1 |
| rei_chutter | Rei Chutter (NPC) | npc_rei_chutter_2x2.png | 2×2 |
| choir | Choir | npc_choir_1x1.png | 1×1 |
| mac_ronan | Mac Rónán | npc_mac_ronan_1x1.png | 1×1 |
| muirenn | Muirenn | npc_muirenn_1x1.png | 1×1 |
| fariborz | Fariborz | npc_fariborz_1x1.png | 1×1 |
| ruzalka | Ruzalka | npc_ruzalka_1x1.png | 1×1 |
| blunkin | Blunkin | npc_blunkin_1x1.png | 1×1 |
| drizzle | Drizzle | npc_drizzle_1x1.png | 1×1 |
| valmorien | Valmorien | npc_valmorien_1x1.png | 1×1 |
| ysoria | Ysoria | npc_ysoria_1x1.png | 1×1 |
| aelar_eisenli | Aelar Eisenli | npc_aelar_eisenli_1x1.png | 1×1 |
| finn_willowheel | Finn Willowheel | npc_finn_willowheel_1x1.png | 1×1 |
| dvalinn | Dvalinn | npc_dvalinn_1x1.png | 1×1 |

---

## 10. Inventário — Inimigos

| id | Nome | Arquivo | Ocupação |
|---|---|---|---|
| espantalho_assombrado | Espantalho Assombrado | enemy_espantalho_assombrado_1x1.png | 1×1 |
| grimhollow_thool | Grimhollow Thool | enemy_grimhollow_thool_2x2.png | 2×2 |
| rei_chutter | Rei Chutter (inimigo) | enemy_rei_chutter_2x2.png | 2×2 |
| golem_pergaminho | Golem de Pergaminho | enemy_golem_pergaminho_1x1.png | 1×1 |
| mother_clutch | Mother Clutch | enemy_mother_clutch_3x3.png | 3×3 |
| marrowwither | Marrowwither | enemy_marrowwither_1x1.png | 1×1 |
| larva_gigante | Larva Gigante | enemy_larva_gigante_3x2.png | 3×2 |
| wraithweaver | Aranha Espectral | enemy_wraithweaver_2x2.png | 2×2 |
| manticora_albina | Manticora Albina | enemy_manticora_albina_2x2.png | 2×2 |
| barkthresher | Barkthresher | enemy_barkthresher_3x3.png | 3×3 |
| esqueleto_lanceiro | Esqueleto Lanceiro | enemy_esqueleto_lanceiro_1x1.png | 1×1 |
| kobold_pele_azul | Kobold de Pele Azul | enemy_kobold_pele_azul_1x1.png | 1×1 |
| elfo_sombrio | Elfo Sombrio | enemy_elfo_sombrio_1x1.png | 1×1 |
| javali_ensandecido | Javali Ensandecido | enemy_javali_ensandecido_2x1.png | 2×1 |
| quay_grabber | Quay Grabber | enemy_quay_grabber_2x2.png | 2×2 |
| caranguejo_gigante | Caranguejo Gigante | enemy_caranguejo_gigante_2x2.png | 2×2 |
| log_wife | Log-Wife | enemy_log_wife_2x2.png | 2×2 |
| ankle_snapper | Leguminosa-Tornozelo | enemy_ankle_snapper_2x2.png | 2×2 |
| moss_belly | Moss-Belly | enemy_moss_belly_2x2.png | 2×2 |
| bugbear_assassino | Bugbear Assassino | enemy_bugbear_assassino_1x1.png | 1×1 |
| orc_bandido | Orc Bandido | enemy_orc_bandido_1x1.png | 1×1 |

---

## 11. Notas de Consistência Estética (LEIA COM ATENÇÃO)

### Gregoras Pellos — PRECISA DE REVISÃO

A versão atual está fora do padrão aprovado. Ao refazer, obedecer:

- guarda-costas experiente, homem atraente, final dos 30 anos
- roupa acolchoada/pano — **não** armadura pesada
- maça na cintura
- semblante leal, levemente melancólico
- silhueta clara, traço coeso com o restante do conjunto
- mais sério, menos genérico

**Prioridade:** revisar Gregoras antes de finalizar o lote de NPCs.

---

### Mutter Grimmhaar — REFERÊNCIA APROVADA, NÃO ALTERAR

A versão atual agradou muito. Usar como referência de qualidade e direção artística.

O que manter:
- bruxa alta e muito magra
- vestido preto surrado
- chapéu estranho/assustador
- elegância ameaçadora
- sensação de fragilidade + perigo
- presença sombria e marcante

**Regra:** Mutter Grimmhaar é o termômetro visual do projeto. Qualquer sprite novo deve ser comparado ao nível de qualidade dela.

---

## 12. Estado Atual dos Arquivos no Repositório

Os sprites existentes estão em `sprites/` com a nomenclatura antiga:

```
sprites/guerreiro_m.png        → será: player_guerreiro_m_1x1.png
sprites/npc_gregoras_pellos.png → será: npc_gregoras_pellos_1x1.png
sprites/inimigo_manticora_albina.png → será: enemy_manticora_albina_2x2.png
```

A migração de nomes acontece junto com a refatoração visual (remoção do pedestal).

---

## 13. Ordem de Produção Recomendada

1. Classes jogáveis — sem pedestal (12 sprites: 6 classes × 2 sexos)
2. NPCs — sem pedestal (20 sprites, Gregoras com revisão especial)
3. Inimigos — sem pedestal (21 sprites)
4. Revisão final de consistência com Mutter Grimmhaar como referência

---

## 14. Prompt-Resumo para Colar em Outra IA

```
Estamos migrando todo o projeto para um novo padrão técnico e artístico.

NOVO PADRÃO:
- todos os sprites devem ser SEM pedestal
- sem base de pedra, sem tile embutido, sem grid desenhado
- fundo transparente
- sprite limpo, pronto para uso em mapa tático
- o tamanho ocupado no grid será definido por ficha técnica, não pela arte
- perspectiva 3/4 isométrica
- pixel art séria, detalhada, não infantil
- estilo visual: Final Fantasy Tactics (PS1) + Ragnarok Online

CONVENÇÃO DE NOMES:
  [tipo]_[slug]_[largura]x[altura].png
  Tipos: player | npc | enemy
  Ocupações: 1x1 | 2x1 | 2x2 | 3x2 | 3x3

REFERÊNCIAS:
- Mutter Grimmhaar = referência aprovada, manter estilo
- Gregoras Pellos = precisa ser revisado para harmonizar com o padrão

OBJETIVO:
Padronizar todos os sprites para combate em mapa tático.
Chão e ocupação são responsabilidade do sistema e do mapa, não da arte.

Ver documento completo em: sprites/PADRAO_SPRITES.md
```
