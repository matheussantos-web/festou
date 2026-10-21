# Identidade visual Festou!

## Essência

Festou! é uma marca alegre, acolhedora e cheia de energia, feita para transformar o planejamento de festas em parte da celebração. A comunicação deve ser calorosa, simples, inclusiva e otimista.

A direção visual vigente é a **noite festiva**: um céu profundo em roxo e magenta, pontilhado de confetes, estrelas e balões, com surfaces claras e limpas por cima.

## Paleta oficial

| Função | Cor | Hex | Uso |
| --- | --- | --- | --- |
| Rosa Magenta / ação principal | Festou Magenta | `#FF5E62` | Gradientes, brilhos, decoração, bordas em gradiente |
| Rosa Magenta profundo | Festou Primary | `#E11D48` | Fundo de botões (CTA) e texto sobre superfície clara |
| Roxo Profundo / noite festiva | Festou Night | `#4F46E5` | Base de hero, rodapé e gradientes principais |
| Amarelo Ouro / destaques | Festou Gold | `#F59E0B` | Badges, estrelas, confetes, pequenos acentos |
| Azul Turquesa / acentos | Festou Cyan | `#06B6D4` | Gradientes, ícones e detalhes frios |

### Cores de apoio

| Função | Cor | Hex | Uso |
| --- | --- | --- | --- |
| Base profunda | Festou Midnight | `#1A134D` | Sombreamento de heros noturnos, texto de marca |
| Roxo de apoio | Festou Purple | `#7B12A2` | Camadas de gradiente e decoração |
| Amarelo-limão | Festou Lemon | `#FFD938` | Confetes secundários |
| Laranja | Festou Orange | `#FF6B00` | Detalhes quentes de decoração |

### Variantes acessíveis

As cores puras da marca não atingem contraste AA quando usadas como **texto sobre superfície clara**. Por isso o Tailwind (`tailwind.config.js`) expõe variantes profundas para uso tipográfico:

| Token | Hex | Contraste sobre branco | Uso |
| --- | --- | --- | --- |
| `festou-primary` | `#E11D48` | 4.7:1 (AA) | Texto e botões sobre fundo claro |
| `festou-accent` | `#B45309` | 5.0:1 (AA) | Texto dourado sobre fundo claro |
| `festou-turquoise` | `#0E7490` | 5.4:1 (AA) | Texto turquesa sobre fundo claro |
| `festou-secondary` | `#4F46E5` | 6.3:1 (AA) | Texto roxo sobre fundo claro |

Sobre fundos escuros (`#1A134D` e gradientes noturnos) use as cores puras: dourado e turquesa atingem contraste acima de 7:1.

## Gradientes

Definidos como utilitários no Tailwind:

- `bg-festou-night` — `#4F46E5 → #8B5CF6 → #FF5E62` (hero principal).
- `bg-festou-dusk` — `#1A134D → #4F46E5 → #FF5E62` (rodapé, banner de fornecedor, tema "céu estrelado").
- `bg-festou-aurora` — `#06B6D4 → #4F46E5 → #7B12A2`.
- `bg-festou-candy` — `#F59E0B → #FF5E62 → #8B5CF6`.
- `bg-festou-ring` — fio de gradiente da marca usado no rodapé do header.

## Tipografia

- **Baloo 2**: títulos, chamadas e wordmark textual (`font-heading`).
- **Poppins**: display e fallback de títulos (`font-display`).
- **Inter**: textos corridos, formulários e interfaces (`font-sans`).

Títulos usam pesos fortes (`font-extrabold`) e `tracking-tight`; etiquetas e microtextos usam `tracking-wide` / `tracking-widest` em caixa alta.

## Componentes digitais

- Botões principais em `rounded-full` com sombra colorida (`shadow-festive`, `shadow-festive-strong`) e `transition-all duration-300 hover:scale-105`.
- Cards com `festou-card-gradient` (borda em gradiente magenta → roxo → turquesa) e `festou-card` (borda sólida, elevação no hover).
- Superfícies de vidro com `festou-glass` (sobre fundos escuros) e `festou-glass-light` (sobre fundos claros), usando `backdrop-blur`.
- Header fixo com `bg-white/80 backdrop-blur-xl` e fio de gradiente na base; rodapé com `bg-festou-dusk`.
- Gradientes noturnos são reservados para hero, rodapé e banners; o restante do produto usa `bg-festou-soft` (`#F8FAFC`) e cards claros.
- Ícones decorativos devem ser ocultados de leitores de tela quando não comunicam informação.

## Elementos gráficos

Confetes, estrelas, bandeirolas, balões, bolos e presentes aparecem como detalhes. Use-os com leveza para não competir com conteúdo ou controles.

- `public/festou-confetti.svg` — padrão reutilizável de confetes (classe `.festou-confetti-field`).
- `public/festou-marca.png` — arte principal da marca.
- `src/components/FestouDecor.vue` — camada de estrelas, confetes, balões e brilhos com animações suaves (`animate-festou-float`, `animate-festou-drift`, `animate-festou-twinkle`).
- `public/favicon.svg` — ícone do navegador.

Animações são desligadas automaticamente em `prefers-reduced-motion: reduce`.

## Tom de voz

Fale de forma direta, amigável e festiva. Prefira convites a comandos frios e use celebração sem exagerar em sinais ou emojis.
