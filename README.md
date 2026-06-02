# RotaCerta — Frontend

Dashboard financeiro para caminhoneiros acompanharem viagens, despesas e lucratividade.

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 14.2 | Framework React (App Router) |
| React | 18 | UI |
| TypeScript | 5 | Tipagem |
| Tailwind CSS | 4.3 | Estilização |
| shadcn/ui (Base UI) | — | Componentes |
| Lucide React | 1.16 | Ícones |
| React Leaflet | 4.2 | Mapa de rotas |

## Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm
- Backend .NET rodando em `http://localhost:5260`
- Chave de API do OpenRouter (para o chat com IA)

## Instalação

```bash
pnpm install
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:5260
OPENROUTER_API_KEY=sua_chave_aqui
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

| Variável | Obrigatório | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sim | URL do backend .NET |
| `OPENROUTER_API_KEY` | Sim (chat) | Chave para o Gemini 2.0 Flash |
| `OPENROUTER_MODEL` | Não | Modelo de IA (padrão: `google/gemini-2.0-flash-001`) |

## Scripts

```bash
pnpm dev       # Servidor de desenvolvimento com Turbopack
pnpm build     # Build de produção
pnpm start     # Inicia servidor de produção
pnpm lint      # Executa ESLint
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── (app)/                  # Rotas protegidas (requer autenticação)
│   │   ├── dashboard/          # Painel principal com métricas mensais
│   │   ├── viagens/            # Listagem de viagens
│   │   │   ├── nova/           # Criar nova viagem
│   │   │   ├── [id]/           # Detalhes da viagem + despesas
│   │   │   └── [id]/editar/    # Editar viagem
│   │   ├── chat/               # Assistente IA para estimativas
│   │   └── configuracoes/      # Configurações do perfil/caminhão
│   ├── api/                    # API Routes do Next.js
│   │   ├── chat/               # Endpoint do chat com IA
│   │   ├── cidades/            # Busca de cidades
│   │   └── distancia/          # Cálculo de distância
│   ├── login/                  # Página de login
│   ├── registrar/              # Página de cadastro
│   └── page.tsx                # Landing page (pública)
├── components/
│   ├── ui/                     # Componentes base (shadcn/ui)
│   ├── app-shell.tsx           # Layout principal das rotas protegidas
│   ├── auth-guard.tsx          # Proteção de rotas (redireciona para /login)
│   ├── nav-links.tsx           # Navegação do header
│   ├── page-header.tsx         # Título + botão de ação por página
│   ├── metric-card.tsx         # Card de métrica do dashboard
│   ├── mapa-rota.tsx           # Exibição do mapa (React Leaflet)
│   ├── cidade-input.tsx        # Input de cidade com autocomplete
│   └── texto-resposta.tsx      # Renderização de respostas do assistente
├── lib/
│   ├── api.ts                  # Cliente HTTP centralizado (todas as rotas)
│   ├── api-base.ts             # URL base, parse de erros, fetch wrapper
│   ├── auth.ts                 # Login, logout, token (localStorage)
│   ├── format.ts               # Formatação de moeda, data, cidade
│   ├── estimativa.ts           # Cálculo de lucro estimado da viagem
│   ├── configuracao.ts         # Configurações padrão
│   ├── rota-servidor.ts        # Cálculo de distância (server-side)
│   └── utils.ts                # Helper `cn()` (clsx + tailwind-merge)
└── types/
    └── index.ts                # Interfaces TypeScript compartilhadas
```

## Autenticação

- JWT armazenado em `localStorage` (`rotacerta_token`)
- Header `Authorization: Bearer <token>` em todas as requisições autenticadas
- Logout automático em respostas `401` (sessão expirada)
- Componente `AuthGuard` envolve todas as rotas protegidas

## Módulos Principais

### API Client (`src/lib/api.ts`)

Wrapper genérico `request<T>()` com tratamento de erros e autenticação automática.

Funções disponíveis:

| Função | Método | Endpoint |
|---|---|---|
| `listarViagens()` | GET | `/api/Viagem` |
| `buscarViagem(id)` | GET | `/api/Viagem/{id}` |
| `criarViagem(dados)` | POST | `/api/Viagem` |
| `atualizarViagem(dados)` | PUT | `/api/Viagem/{id}` |
| `excluirViagem(id)` | DELETE | `/api/Viagem/{id}` |
| `listarCustos(viagemId)` | GET | `/api/Custo/{viagemId}` |
| `buscarRelatorio(ano, mes)` | GET | `/api/Relatorio/{ano}/{mes}` |
| `buscarConfiguracao()` | GET | `/api/Configuracao` |
| `salvarConfiguracao(dados)` | PUT | `/api/Configuracao` |

### Estimativa de Viagem (`src/lib/estimativa.ts`)

Cálculo de lucro baseado em:

```
Custo combustível = (km total ÷ consumo km/L) × preço R$/L
Receita frete     = km total × preço R$/km
Lucro estimado    = Receita − Custo combustível
```

Parâmetros padrão: `R$ 3,50/km`, `2,8 km/L`, `R$ 6,20/L`.

### Chat com IA (`src/app/api/chat/route.ts`)

- Modelo: **Google Gemini 2.0 Flash** via OpenRouter
- Extrai origem, destino e preço do frete da mensagem do usuário
- Calcula distância via OSRM e retorna estimativa formatada

## Tipos Principais (`src/types/index.ts`)

```typescript
ListarViagem       // Dados de uma viagem
RegistrarViagem    // Payload para criar/atualizar viagem
ResumoViagem       // Viagem com métricas calculadas
ListarCusto        // Entrada de despesa
ConfiguracaoPerfil // Configuração do caminhão (consumo, capacidade)
RelatorioMensal    // Relatório financeiro mensal
Usuario            // Perfil do usuário autenticado
AuthResposta       // Resposta do endpoint de login
```

## Tema Visual

- Paleta **âmbar/laranja** — foco em energia e transporte
- Espaço de cores **OKLCH** (Tailwind v4)
- Suporte a **modo claro e escuro**
- Design responsivo: mobile-first (`sm:`, `lg:`)

## Proxy de API (Next.js)

O `next.config.mjs` configura um rewrite para que chamadas do browser a `/backend/*` sejam redirecionadas para o backend:

```
/backend/:path* → http://localhost:5260/:path*
```

Isso evita problemas de CORS em desenvolvimento e produção.
