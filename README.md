# GitReserve

Automated Git repository backup to S3-compatible object storage. Connect your GitHub or GitLab account, select repositories to watch, and GitReserve will automatically archive them to AWS S3 or Cloudflare R2 on every push.

## How It Works

1. Sign up with email and password
2. Connect your GitHub or GitLab account via OAuth
3. Select repositories to watch
4. GitReserve registers a webhook on the repo for push events
5. On push → job queued via SQS → repo cloned → `latest.tar.gz` uploaded to S3/R2

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (ESM) |
| Language | TypeScript 6 (strict mode) |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Queue | AWS SQS |
| Storage | AWS S3 / Cloudflare R2 |
| Auth | JWT + bcrypt |
| Validation | Zod 4 |
| Logging | Pino |
| Testing | Vitest |
| Build | esbuild |
| Package Manager | pnpm |

## Prerequisites

- Node.js >= 20
- pnpm >= 11
- MongoDB (local or remote)
- AWS account (for SQS + S3) or LocalStack for local development

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/GitReserve.git
cd GitReserve
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `LOG_LEVEL` | No | Pino log level (default: info) |
| `MONGO_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiry in seconds (default: 86400 = 24h) |
| `WEBHOOK_BASE_URL` | No | Public URL for receiving webhooks |
| `GITHUB_CLIENT_ID` | Yes* | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes* | GitHub OAuth app client secret |
| `GITHUB_REDIRECT_URI` | Yes* | GitHub OAuth callback URL |
| `GITLAB_CLIENT_ID` | Yes* | GitLab OAuth app client ID |
| `GITLAB_CLIENT_SECRET` | Yes* | GitLab OAuth app client secret |
| `GITLAB_REDIRECT_URI` | Yes* | GitLab OAuth callback URL |
| `AWS_REGION` | No | AWS region for SQS (default: us-east-1) |
| `SQS_QUEUE_URL` | Yes | SQS queue URL for sync jobs |
| `SQS_ENDPOINT` | No | Custom SQS endpoint (for LocalStack) |
| `CONSUMER_CONCURRENCY` | No | Parallel sync jobs (default: 5) |

*Required only if you want to use that provider.

### 4. Start MongoDB

```bash
# Using Docker
docker run -d --name gitreserve-mongo -p 27017:27017 mongo:7

# Or use your existing MongoDB instance
```

### 5. Run the development server

```bash
# API server (handles HTTP requests)
pnpm dev

# In a separate terminal — consumer (processes sync jobs from SQS)
pnpm dev:consumer
```

The API will be available at `http://localhost:3000`.

## Scripts

```bash
pnpm dev              # API server with hot reload
pnpm dev:consumer     # SQS consumer with hot reload
pnpm build            # Bundle API with esbuild
pnpm build:consumer   # Bundle consumer with esbuild
pnpm start            # Run bundled API
pnpm start:consumer   # Run bundled consumer
pnpm typecheck        # Type-check without emitting
pnpm test             # Run tests
pnpm lint             # Lint with ESLint
pnpm format           # Format with Prettier
```

## API Endpoints

### Auth (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register with email, password, name |
| POST | `/api/v1/auth/login` | Login, returns JWT token |
| GET | `/api/v1/auth/me` | Get current user (requires token) |

### Integrations (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/integrations/oauth/:type/url` | Get OAuth authorization URL |
| POST | `/api/v1/integrations/connect/:type` | Connect a provider |
| DELETE | `/api/v1/integrations/:type` | Disconnect a provider |
| POST | `/api/v1/integrations/:type/verify` | Verify integration is active |

### Repositories (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/repositories/available/:type` | List available repos from provider |
| POST | `/api/v1/repositories/track` | Start tracking a repository |
| GET | `/api/v1/repositories/` | List tracked repositories |
| GET | `/api/v1/repositories/:repoId` | Get tracked repo details |
| DELETE | `/api/v1/repositories/:repoId` | Stop tracking a repository |
| POST | `/api/v1/repositories/:repoId/sync` | Manually trigger a sync |

### Sync (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sync/:repoId/trigger` | Trigger sync job |
| GET | `/api/v1/sync/:repoId/status` | Get sync status |
| GET | `/api/v1/sync/jobs` | List sync jobs |
| GET | `/api/v1/sync/jobs/:jobId` | Get job details |

### Webhooks (Public — called by GitHub/GitLab)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/webhooks/github/:repoId` | GitHub push webhook receiver |
| POST | `/api/v1/webhooks/gitlab/:repoId` | GitLab push webhook receiver |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by calling `/api/v1/auth/signup` or `/api/v1/auth/login`.

## Project Structure

```
src/
├── auth/               # Authentication (signup, login, JWT, middleware)
├── bootstrap/          # App entrypoints (API server, SQS consumer)
├── common/             # Shared utilities (logger, types, async handler)
├── integrations/       # OAuth provider connections (GitHub, GitLab, S3)
├── providers/          # Git provider clients (GitHub API, GitLab API)
├── repositories/       # Repository tracking and management
├── storage/            # S3/R2 storage operations
├── sync/               # Sync job orchestration and processing
└── webhooks/           # Webhook receivers (GitHub, GitLab push events)
```

## License

ISC
