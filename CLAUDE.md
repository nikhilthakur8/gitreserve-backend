# GitReserve

## Project Overview

GitReserve mirrors Git repositories to S3-compatible object storage (AWS S3 / Cloudflare R2). When a user connects their GitHub or GitLab account and a push event occurs on a watched repo, GitReserve downloads the repo archive, creates a `latest.tar.gz`, and uploads it to S3/R2 — replacing the previous build.

### MVP Flow

1. User connects GitHub or GitLab (provides token)
2. User selects repos to watch
3. GitReserve registers a webhook on the repo for push events
4. On push → job queued (SQS or BullMQ, TBD) → download repo tarball → upload `latest.tar.gz` to S3/R2

## Tech Stack

- **Runtime**: Node.js 20+ (ESM)
- **Language**: TypeScript 6 (strict mode, bundler module resolution)
- **Framework**: Express 5
- **Object Storage**: AWS S3 / Cloudflare R2 via `@aws-sdk/client-s3`
- **Validation**: Zod 4
- **Logging**: Pino
- **Testing**: Vitest
- **Build**: esbuild
- **Package Manager**: pnpm

## Architecture

Module-level DDD. Each provider is a self-contained module with its own client, mapper, types, and constants.

```
src/
├── providers/
│   ├── interfaces/
│   │   └── git-provider.interface.ts   # GitProvider contract
│   ├── github/
│   │   ├── github.provider.ts          # GitHub implementation
│   │   ├── github.client.ts            # HTTP client
│   │   ├── github.mapper.ts            # GitHub API → normalized types
│   │   ├── github.types.ts             # Raw API response shapes
│   │   ├── github.constants.ts
│   │   └── index.ts
│   ├── gitlab/
│   │   ├── gitlab.provider.ts          # GitLab implementation
│   │   ├── gitlab.client.ts            # HTTP client
│   │   ├── gitlab.mapper.ts            # GitLab API → normalized types
│   │   ├── gitlab.types.ts             # Raw API response shapes
│   │   ├── gitlab.constants.ts
│   │   └── index.ts
│   ├── provider.factory.ts             # createProvider(type, config)
│   ├── provider.types.ts               # Normalized types (Repository, User, Webhook)
│   └── index.ts
```

## GitProvider Interface (MVP)

Every provider implements these methods only:

- `getAuthenticatedUser()` — verify token, get user info
- `listRepositories()` — list repos the user has access to
- `getRepository()` — get single repo details
- `getRepositoryArchiveUrl()` — get tarball download URL
- `createWebhook()` — register push event webhook
- `deleteWebhook()` — remove webhook

## Commands

```bash
pnpm dev          # Dev server with hot reload (tsx watch)
pnpm build        # Bundle with esbuild
pnpm start        # Run bundled output
pnpm typecheck    # Type-check (tsc --noEmit)
pnpm test         # Run tests (Vitest)
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Conventions

- Use **named exports** everywhere, no default exports.
- Use `@/` path alias for cross-module imports, relative paths within same module.
- All imports use `.ts` extension (bundler mode).
- All providers implement `GitProvider` interface.
- New providers follow the same module structure: `client`, `mapper`, `types`, `constants`, `provider`, `index`.
- Use `createProvider()` factory — never instantiate providers directly.
- Provider mappers convert raw API types to normalized types from `provider.types.ts`.
- Use `pino` logger — no `console.log`.
- Use **Zod** for request validation.
