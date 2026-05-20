# Deploy no Vercel — Atlas Training

## Pré-requisito

- Conta em [vercel.com](https://vercel.com) (login com GitHub é o mais fácil)

## Opção A — CLI direto (mais rápido)

No PowerShell, dentro de `C:\Users\combu\Downloads\Personal`:

```powershell
npx vercel login
# escolhe o provider (GitHub, Google, etc) e autentica no browser

npx vercel
# responde:
#  ? Set up and deploy? Y
#  ? Which scope? (sua conta)
#  ? Link to existing project? N
#  ? Project name? atlas-training
#  ? In which directory is your code? ./
#  ? Want to override the settings? N
```

A primeira execução faz um **deploy preview** (URL `atlas-training-xxxx.vercel.app`).

Depois configura as variáveis de ambiente:

```powershell
npx vercel env add NOCODB_BASE_URL          # https://app.nocodb.com
npx vercel env add NOCODB_BASE_ID            # p05zxqswa3jjdn5
npx vercel env add NOCODB_PAT                # vgfnX7Pkz4Nm_ha8RhRr-rHWR6H3SxnPuBCNnKpM
npx vercel env add AUTH_SECRET               # gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Quando perguntar `Which environments?` marca **Production** e **Preview** e **Development**.

Aí promove pra produção:

```powershell
npx vercel --prod
```

Vai gerar a URL final tipo `atlas-training.vercel.app`.

## Opção B — Via GitHub (auto-redeploy a cada push)

1. Cria um repo privado no GitHub (`gh repo create atlas-training --private --source . --remote origin --push`)
2. Em [vercel.com/new](https://vercel.com/new), importa o repo
3. Em **Environment Variables**, cola as 4 vars acima
4. Clica **Deploy**

## Upload de PDF de treino

O Vercel tem filesystem read-only — pra PDF funcionar em prod, ativa o **Vercel Blob**:

1. No dashboard do projeto: **Storage** → **Create** → **Blob**
2. Vincula ao projeto (gera `BLOB_READ_WRITE_TOKEN` automaticamente)
3. Faz redeploy (`npx vercel --prod`)

Sem essa env var, o app continua rodando — só a aba "Enviar PDF" vai falhar em prod (no dev local funciona normalmente porque cai no fallback de filesystem).

## Variáveis de ambiente em resumo

| Var | Obrigatória | Valor |
|---|---|---|
| `NOCODB_BASE_URL` | sim | `https://app.nocodb.com` |
| `NOCODB_BASE_ID` | sim | `p05zxqswa3jjdn5` |
| `NOCODB_PAT` | sim | seu token NocoDB |
| `AUTH_SECRET` | sim | 32 bytes hex aleatórios |
| `BLOB_READ_WRITE_TOKEN` | só se for usar PDF | auto via Vercel Blob |
| `NOCODB_TABLE_IDS` | não | override do mapa (raramente preciso) |

## Instalar no iPhone (depois do deploy)

1. Abre a URL `*.vercel.app` no **Safari** (não Chrome)
2. Toca no ícone de compartilhar (quadrado com seta ↑, na barra inferior)
3. Rola e toca em **"Adicionar à Tela de Início"**
4. Confirma o nome "Atlas" → toca em **Adicionar**

Pronto — ícone verde do Atlas vai aparecer na home. Toca e abre como app full-screen.

## Atualizando depois

```powershell
npx vercel --prod
```

Ou se conectou via GitHub: só `git push` que o Vercel redeploya automaticamente.
