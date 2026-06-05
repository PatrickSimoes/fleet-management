# Plataforma de Gestão de Frota — Aivacol

Backend do módulo de gestão de frota: cadastro de **veículos**, **modelos**, **marcas** e **usuários**, com autenticação JWT, cache em Redis, mensageria com RabbitMQ e schema versionado por migrations.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | NestJS 11 |
| ORM | TypeORM |
| Banco | SQL Server |
| Cache | Redis |
| Mensageria | RabbitMQ |
| Autenticação | JWT |
| Testes | Jest |
| Infra local | Docker Compose |

## Arquitetura

- **Módulos de domínio** (`vehicles`, `models`, `brands`, `users`, `auth`) seguindo arquitetura modular do NestJS, com um `BaseService` genérico para CRUD e paginação.
- **Autenticação JWT** global: todas as rotas são protegidas por padrão; apenas o login é público (decorator `@Public`).
- **Cache Redis** nas consultas de veículos (listagem e item), com TTL configurável e invalidação automática ao criar, atualizar ou remover.
- **Mensageria RabbitMQ**: ao criar/atualizar/remover um veículo, um evento é publicado (`vehicle.created` / `vehicle.updated` / `vehicle.deleted`) e consumido de forma assíncrona, com ACK manual e _dead-letter queue_ para falhas.
- **Migrations** como fonte da verdade do schema (`synchronize` desligado).
- **Metadados** `created_at`, `updated_at` e `created_by` em todas as entidades.
- Segurança adicional: `helmet`, CORS restrito a `localhost`, _rate limiting_ (`@nestjs/throttler`) e validação de payload (`ValidationPipe` com `whitelist`).

## Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou superior
- [Docker](https://www.docker.com) e Docker Compose

---

## Como começar (passo a passo)

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

> Defina um valor para `JWT_SECRET`. Os demais valores já vêm prontos para rodar localmente.

### 3. Subir a infraestrutura (SQL Server, Redis e RabbitMQ)

```bash
docker compose up -d
```

Isso sobe os contêineres e o serviço `sqlserver-init`, que **cria o banco `fleet_management` automaticamente** assim que o SQL Server fica saudável.

### 4. Rodar as migrations (cria o schema)

```bash
npm run migration:run
```

### 5. Popular o banco com dados iniciais (seed)

```bash
npm run seed
```

Cria o usuário padrão **`aivacol`** e o catálogo de marcas → modelos → veículos a partir do mock [`seed_vehicles.json`](./seed_vehicles.json).

### 6. Subir a API

```bash
npm run start:dev
```

A API sobe em `http://localhost:3000` (porta configurável via `PORT`).

### 7. Autenticar e usar a API

Faça login para obter o token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aivacol@aivacol.com.br","password":"aivacol"}'
```

Use o token nas demais rotas:

```bash
curl http://localhost:3000/vehicles \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## Variáveis de ambiente

| Grupo | Variável | Descrição |
|---|---|---|
| App | `NODE_ENV` | Ambiente de execução |
| App | `PORT` | Porta da API (padrão `3000`) |
| Database | `DB_HOST` / `DB_PORT` | Host e porta do SQL Server |
| Database | `DB_USER` / `DB_PASSWORD` | Credenciais do banco |
| Database | `DB_NAME` | Nome do banco (`fleet_management`) |
| JWT | `JWT_SECRET` | Segredo de assinatura do token |
| JWT | `JWT_EXPIRES_IN` | Validade do token (ex.: `1d`) |
| Redis | `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Conexão do Redis |
| Redis | `REDIS_CACHE_TTL` | Tempo de vida do cache, em segundos |
| RabbitMQ | `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | Credenciais do RabbitMQ |
| RabbitMQ | `RABBITMQ_URI` | URI de conexão AMQP |
| Seed | `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | Credenciais do usuário criado no seed |

## CORS

O CORS é liberado apenas para a origem `http://localhost:<PORT>`, usando a mesma porta definida em `PORT` (padrão `3000`). São permitidos os métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` e `OPTIONS`, os headers `Content-Type` e `Authorization`, e o envio de credenciais (`credentials: true`).

Por enquanto a origem é fixa em `localhost`; para liberar outros domínios (ex.: front em produção), ajuste o `enableCors` em [`src/main.ts`](./src/main.ts).

## Credenciais padrão do seed

| Campo | Valor |
|---|---|
| email | `aivacol@aivacol.com.br` |
| senha | `aivacol` |
| nickname | `aivacol` |

## Serviços (Docker)

| Serviço | Porta | Observação |
|---|---|---|
| SQL Server | `1433` | Banco principal |
| Redis | `6379` | Cache |
| RabbitMQ | `5672` | Mensageria (AMQP) |
| RabbitMQ (UI) | `15672` | Painel de gerenciamento (`fleet` / `fleet`) |

---

## Migrations

O schema é versionado por migrations do TypeORM (`synchronize` desligado).

```bash
# aplicar as migrations pendentes
npm run migration:run

# reverter a última migration
npm run migration:revert

# ver o status das migrations
npm run migration:show

# gerar uma nova migration a partir de mudanças nas entidades
npm run migration:generate -- src/config/database/migrations/<Nome>
```

## Testes

```bash
# testes unitários
npm run test

# cobertura
npm run test:cov

# testes e2e
npm run test:e2e
```

## Endpoints

Todas as rotas (exceto o login) exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autenticação (público) |
| `GET` | `/vehicles` | Lista veículos (paginado: `?page=&limit=`) |
| `GET` | `/vehicles/:id` | Detalha um veículo |
| `POST` | `/vehicles` | Cria um veículo |
| `PATCH` | `/vehicles/:id` | Atualiza um veículo |
| `DELETE` | `/vehicles/:id` | Remove um veículo |
| `GET/POST/PATCH/DELETE` | `/models` | CRUD de modelos |
| `GET/POST/PATCH/DELETE` | `/brands` | CRUD de marcas |
| `GET/POST/PATCH/DELETE` | `/users` | CRUD de usuários |

## Estrutura do projeto

```
src/
├── app.module.ts
├── main.ts
├── common/                 # base service, entidade base, DTOs e utilitários compartilhados
├── config/
│   ├── database/           # módulo do TypeORM, data-source, seed e migrations
│   ├── redis/              # módulo e serviço de cache
│   └── rabbitmq/           # módulo de mensageria
└── modules/
    ├── auth/               # login, guard JWT e decorators
    ├── users/
    ├── brands/
    ├── models/
    └── vehicles/
```

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run start:dev` | Sobe a API em modo watch |
| `npm run build` | Compila o projeto |
| `npm run seed` | Popula o banco com dados iniciais |
| `npm run migration:run` | Aplica as migrations |
| `npm run migration:revert` | Reverte a última migration |
| `npm run migration:generate -- <caminho>` | Gera uma nova migration |
| `npm run schema:drop` | Remove todo o schema do banco |
| `npm run test` | Executa os testes |
| `npm run lint` | Roda o linter |
