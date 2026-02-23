# Apex Keys — Painel de Gerenciamento de Keys

Sistema completo de autenticação e gerenciamento de keys para scripts Roblox.

## Stack
- **Next.js 14** (App Router)
- **TypeScript + Zod**
- **Tailwind CSS + shadcn/ui + Radix UI**
- **Recharts** (gráficos)
- **MongoDB Atlas** (banco de dados)
- **Vercel** (hosting)

---

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Gerar o hash da sua senha
```bash
node -e "const b=require('bcryptjs'); b.hash('SUA_SENHA_AQUI', 12).then(console.log)"
```
Copie o hash gerado.

### 3. Gerar JWT secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Rode duas vezes — uma para `JWT_SECRET` e outra para `JWT_REFRESH_SECRET`.

### 4. Criar `.env.local`
Copie `.env.example` para `.env.local` e preencha todos os valores.

### 5. Rodar localmente
```bash
npm run dev
```

### 6. Deploy no Vercel
1. Faça push para GitHub
2. Importe o projeto no Vercel
3. Adicione todas as variáveis do `.env.local` no painel do Vercel
4. Deploy

---

## Integração Lua (WindUI)

```lua
WindUI.Services.apexkeys = {
    Name = "Apex Keys",
    Icon = "key",
    Args = { "Key" },
    New = function(Key)
        function validateKey(key)
            local ok, res = pcall(function()
                return request({
                    Url    = "https://seu-site.vercel.app/api/validate",
                    Method = "POST",
                    Headers = { ["Content-Type"] = "application/json" },
                    Body   = game:GetService("HttpService"):JSONEncode({
                        key        = key,
                        hwid       = game:GetService("RbxAnalyticsService"):GetClientId(),
                        ip         = "",
                        robloxNick = game:GetService("Players").LocalPlayer.Name,
                    })
                })
            end)
            if not ok or not res then return false, "Erro de conexão." end
            local data = game:GetService("HttpService"):JSONDecode(res.Body)
            return data.valid, data.message
        end

        function copyLink()
            return setclipboard("https://seu-site.vercel.app")
        end

        return { Verify = validateKey, Copy = copyLink }
    end
}
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login       — Login com rate limit + bcrypt
│   │   ├── auth/logout      — Limpa cookies
│   │   ├── auth/refresh     — Renova JWT com rotação de refresh token
│   │   ├── validate         — Valida key (server-side, rate limited)
│   │   ├── keys             — CRUD de keys
│   │   ├── keys/usage       — Histórico de uso por key
│   │   ├── blacklist        — Gerencia HWID/IP/Nick banidos
│   │   ├── logs             — Logs com export CSV/JSON
│   │   ├── audit            — Ações do admin
│   │   └── stats            — Dados para os gráficos
│   ├── dashboard/
│   │   ├── page.tsx         — Dashboard com gráficos (Recharts)
│   │   ├── keys/            — Gerenciamento de keys
│   │   ├── logs/            — Logs de execução
│   │   ├── blacklist/       — Blacklist de HWID/IP/Nick
│   │   └── audit/           — Auditoria de ações admin
│   └── login/               — Tela de login
├── lib/
│   ├── db.ts                — Conexão MongoDB
│   ├── auth.ts              — JWT, CSRF, cookies
│   ├── rateLimit.ts         — Rate limiter em memória
│   └── webhook.ts           — Discord webhook com retry
├── models/                  — Schemas Mongoose com TTL index
├── middleware.ts             — Proteção de rotas
└── types/                   — Interfaces TypeScript
```

---

## Segurança implementada

- JWT httpOnly + SameSite Strict (nunca localStorage)
- Refresh token rotativo
- CSRF token em todas as mutations
- Rate limit no login (progressivo por IP)
- Rate limit no /api/validate (por HWID + IP)
- Bcrypt com salt 12
- HWID binding na primeira execução
- Bloqueio de uso simultâneo em múltiplos HWIDs
- Blacklist de HWID/IP/Nick
- Headers CSP, X-Frame-Options DENY, HSTS
- Zod em todos os endpoints
- Variáveis sensíveis apenas server-side
- TTL index MongoDB para limpeza automática (30 dias)
- Audit log de todas as ações admin
- Webhook Discord com retry automático
