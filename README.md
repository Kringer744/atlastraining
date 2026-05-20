# Atlas Training

PWA para personal trainers e alunos. Treino, evolução real, gamificação.

## Stack

- **Next.js 15** (App Router, RSC, Server Actions)
- **TypeScript**
- **Tailwind CSS** + identidade visual Atlas (Space Grotesk, #C6FF00)
- **NocoDB** (banco — REST API v2 via `xc-token`)
- **JWT + bcrypt** em cookie HTTP-only (auth próprio, sem dependência externa)
- **PWA** com manifest + service worker próprio

## Setup

```bash
npm install
cp .env.example .env.local
# preencha NOCODB_BASE_URL, NOCODB_BASE_ID, NOCODB_PAT e AUTH_SECRET
npm run bootstrap:nocodb   # cria todas as tabelas no NocoDB
npm run dev
```

> ⚠️ Se você compartilhou o PAT em algum lugar (chat, screenshot), **revogue** em
> NocoDB → Account → Tokens e gere outro antes de subir pra produção.

### Variáveis

| Var | Descrição |
|---|---|
| `NOCODB_BASE_URL` | URL do NocoDB (ex: `https://app.nocodb.com`) |
| `NOCODB_BASE_ID` | ID do base/workspace (do link da URL) |
| `NOCODB_PAT` | Personal Access Token do NocoDB |
| `AUTH_SECRET` | Segredo HS256 para assinar JWT (gere com `openssl rand -hex 32`) |

### Bootstrap das tabelas

O script `scripts/bootstrap-nocodb.mjs` cria 10 tabelas no NocoDB:
`users`, `coach_clients`, `workouts`, `workout_exercises`, `sessions`,
`session_sets`, `reminders`, `measurements`, `client_stats`, `achievements`.

Ele grava o mapa `nome → tableId` em `src/lib/nocodb/tables.json`, lido em runtime
pelo cliente. Em produção você pode passar via `NOCODB_TABLE_IDS` (JSON inline).

## Roles

- `/signup?role=personal` ou `/signup?role=client`
- Login em `/login`, logout pelo botão do header
- `/app` redireciona para `/personal` ou `/cliente` conforme role

## Personal (`/personal`)

- Dashboard com alunos ativos, treinos, atividade, últimas sessões
- `/personal/alunos` listar, `/alunos/novo` vincular por email
- `/personal/alunos/[id]` detalhe do aluno (XP, streak, volume, treinos)
- `/personal/treinos` listar + `/treinos/novo` (manual ou PDF — PDF é gravado
  em `/public/uploads/workouts/...`)
- `/personal/avisos` enviar lembretes (um aluno ou broadcast pra todos)
- `/personal/relatorios` últimos 7 dias agregados

## Cliente (`/cliente`)

- Home com nível, XP, streak, próximo treino, atividade
- `/cliente/treinos/[id]/iniciar` execução com cronômetro, sets, RPE
- Ao concluir: calcula XP, atualiza streak, desbloqueia conquistas
- `/cliente/evolucao` registrar peso, % gordura, medidas
- `/cliente/conquistas` catálogo completo
- `/cliente/avisos` recebe lembretes do personal

## Gamificação

- XP por treino = 80 + min(60, volume/200) + (RPE-5)·6
- Streak diário (reset se pular ≥2 dias)
- Medalhas: `FIRST_WORKOUT`, `STREAK_3/7/30`, `WORKOUTS_10/50`, `VOLUME_5K`

## PWA

- `/public/manifest.webmanifest` aponta para `/icons/app-icon.png`
- `/public/sw.js` — network-first em navegação, SWR para estáticos

## Identidade visual

| Token | Hex | Uso |
|---|---|---|
| `energy` | `#C6FF00` | destaque, CTAs |
| `focus` | `#0F0F12` | fundo |
| `focus-2` | `#1A1A1F` | cards |
| `balance` | `#2A2A31` | superfícies |
| `structure` | `#3B3B45` | bordas |
| `contrast` | `#EDEDED` | texto |

Logo mark: `/public/icons/logo-mark.png` · App icon: `/public/icons/app-icon.png`
