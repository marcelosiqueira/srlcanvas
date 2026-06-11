# Setup do Backend (API Fastify + MySQL/Prisma)

Guia de configuracao da API propria do SRL Canvas (`apps/api`): Fastify + TypeScript,
Prisma sobre MySQL 8 e autenticacao por JWT. Substitui o antigo guia de Supabase.

## 1. Requisitos

- Node.js 22+
- pnpm 9+ (`corepack enable`)
- MySQL 8

Sugestao de MySQL local via Docker:

```bash
docker run -d --name srl-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=srlcanvas \
  -p 3307:3306 \
  mysql:8
```

Criar tambem o database de teste (usado pela suite da API):

```bash
docker exec srl-mysql mysql -uroot -proot \
  -e "CREATE DATABASE IF NOT EXISTS srlcanvas_test"
```

## 2. Configuracao da API (`apps/api/.env`)

Copie o exemplo e ajuste:

```bash
cp apps/api/.env.example apps/api/.env
```

Variaveis principais:

- `DATABASE_URL`: connection string do MySQL.
  Dev local (Docker acima): `mysql://root:root@127.0.0.1:3307/srlcanvas`
- `JWT_SECRET`: segredo para assinar os JWTs (minimo 32 caracteres). Gere com:

  ```bash
  openssl rand -base64 48
  ```

- `PORT` (opcional, default `3333`).

Aplicar as migracoes do Prisma:

```bash
pnpm --filter @srl/api exec prisma migrate dev
```

## 3. Rodar em desenvolvimento

```bash
pnpm --filter @srl/api dev   # API em http://localhost:3333
pnpm --filter @srl/web dev   # SPA com proxy /api -> localhost:3333 (ja configurado no vite.config.ts)
```

Frontend (`apps/web/.env.local`):

```env
VITE_API_URL=/api
```

Se `VITE_API_URL` ficar vazio/ausente, o app opera em modo local (sem conta),
persistindo apenas em `localStorage`.

## 4. Testes

```bash
pnpm --filter @srl/api test
```

- A suite usa o database `srlcanvas_test` (na mesma instancia MySQL).
- Para apontar outro banco, defina `TEST_DATABASE_URL` antes de rodar.

## 5. Deploy (VPS)

### 5.1 MySQL

- Banco escutando apenas em `127.0.0.1` (bind-address) — sem exposicao externa.
- Database com charset `utf8mb4` e usuario dedicado (sem usar `root`):

  ```sql
  CREATE DATABASE srlcanvas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'srlcanvas'@'127.0.0.1' IDENTIFIED BY 'SENHA_FORTE';
  GRANT ALL PRIVILEGES ON srlcanvas.* TO 'srlcanvas'@'127.0.0.1';
  ```

### 5.2 Migracoes e processo

- Aplicar migracoes em producao com:

  ```bash
  pnpm --filter @srl/api exec prisma migrate deploy
  ```

- Rodar a API como servico `systemd` (ver `infra/systemd/`, unit `srlcanvas-api.service`).

### 5.3 nginx

- Proxy reverso de `/api` para a API local (ver `infra/nginx/srlcanvas.conf`),
  servindo a SPA estatica no mesmo server block.

### 5.4 Publicacao da SPA

- IMPORTANTE: rebuildar a SPA com `VITE_API_URL=/api` antes de publicar o `dist/`
  (a variavel e embutida no bundle em build time):

  ```bash
  VITE_API_URL=/api pnpm --filter @srl/web run build
  ```

### 5.5 Backup

- Backup diario do banco:

  ```bash
  mysqldump --single-transaction srlcanvas | gzip > /backups/srlcanvas-$(date +%F).sql.gz
  ```

- Armazenar backups cifrados e com acesso restrito.
- Retencao conforme LGPD e exigencias de pesquisa academica: 6 anos para dados de pesquisa
  (ver `docs/LGPD.md`).
