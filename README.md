# Elite Ware Shop

> A **Telegram Mini App** storefront — a React shop UI backed by a typed Hono/PostgreSQL API, with server-side Telegram `initData` validation and **manual card payment** (customer uploads a receipt, an admin confirms it).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](./tsconfig.base.json)

🇬🇧 English · [🇷🇺 Русский](#-русский)

---

## ✨ Overview

A reusable storefront that any merchant can configure: set a shop name, currency, bank card details and catalog, and you have a native-feeling Telegram Mini App with a catalog, cart, checkout, order history, and an in-app admin panel — no separate backoffice needed. It is built as a small, strict TypeScript monorepo and ships with tests and Docker.

The entire store is driven by a single shop configuration record (bootstrapped automatically on first boot) plus catalog data.

### Features

- 🛍️ **Storefront** — categories, product search, product details, cart and checkout
- 🔐 **Secure auth** — server-side HMAC-SHA256 validation of Telegram `initData` → short-lived JWT session
- 💳 **Manual card payment** — admin sets a card number/instructions; customer uploads a payment receipt; admin reviews and confirms from the order list
- 📦 **Orders** — order history for customers, an admin view for managing products, categories and order status
- 👤 **Admin management** — an admin can promote any user (by Telegram id, once they've opened the Mini App at least once) to admin, or demote them, directly from the app — no redeploy needed
- 🌐 **i18n** — Uzbek and Russian, switchable in-app
- 🎨 **Branded, themeable UX** — Telegram UI components, a minimalist light/dark brand theme, MainButton / BackButton, hash routing
- 🧩 **Shared types** — one set of zod schemas validates the API and types the client
- ✅ **Quality bar** — TS strict, ESLint + Prettier, Vitest (unit + live-Postgres integration), Docker + Compose

---

## 🏗️ Architecture

```
┌────────────────────────┐        initData (HMAC) → JWT        ┌─────────────────────────┐
│      apps/miniapp       │  ───────────────────────────────►  │        apps/api         │
│  React 18 + Vite        │            REST + Bearer            │  Hono + Drizzle ORM     │
│  @telegram-apps/sdk v3  │  ◄───────────────────────────────  │  PostgreSQL             │
│  Telegram UI            │             JSON / zod              │  Manual payment confirm │
└────────────────────────┘                                     └─────────────────────────┘
```

| Package           | Stack                                                                   | Responsibility                                            |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/shared` | TypeScript, **zod 4**                                                   | Schemas & types shared by API and client                  |
| `apps/api`        | **Hono 4**, **Drizzle 0.45**, PostgreSQL, **jose**                      | initData validation, JWT, catalog/cart/orders/admin/users |
| `apps/miniapp`    | **React 18.3**, **Vite 8**, `@telegram-apps/sdk-react` 3, Telegram UI 2 | Storefront + admin UI                                     |

> **Why React 18 in the Mini App?** `@telegram-apps/telegram-ui` peers on React 18, so the storefront pins React 18.3 while the rest of the stack tracks the latest releases.

---

## 🔐 Telegram `initData` validation

Authentication never trusts the client. The Mini App sends the raw `initData` string; the API verifies it before issuing a session:

1. Parse the query string and pull out `hash`.
2. Build the **data-check-string**: every remaining field (including `signature`, when present) as `key=value`, sorted by key, joined by `\n`.
3. Derive the secret key: `HMAC_SHA256(key="WebAppData", message=botToken)`.
4. Compute `HMAC_SHA256(key=secretKey, message=dataCheckString)` and compare to `hash` in constant time.
5. Reject if `auth_date` is older than `INITDATA_MAX_AGE_SECONDS` (replay protection).

The validator is a pure, dependency-free function in [`apps/api/src/auth/init-data.ts`](apps/api/src/auth/init-data.ts), covered by unit tests (valid, tampered, wrong-token, expired, missing-field). On success the API upserts the user and signs a short-lived JWT.

## 💳 Manual payment flow

1. Customer checks out → API creates an order from the server-side cart (`pending`).
2. The Mini App shows the shop's card number, holder name and any instructions, plus a file picker.
3. Customer uploads a screenshot of the transfer; it's compressed client-side and stored as a data URL on the order (`awaiting_payment`).
4. An admin opens the order list, sees the receipt thumbnail, and taps **Confirm payment** — the order is marked `paid` (idempotently) and tracked stock is decremented.

## 👤 Admin management

The first admin is set via the `ADMIN_TELEGRAM_IDS` env var. From then on, any admin can grant or revoke admin rights to other users directly from the Mini App's Admin page — the target user just needs to have opened the Mini App once (so the API knows their Telegram id). The last remaining admin can't be demoted, and nobody can change their own role, so the shop can never end up unmanageable.

---

## 🚀 Quick start

### Prerequisites

- Node.js ≥ 22
- PostgreSQL 16 (or use Docker Compose)

### Local development

```bash
# 1. Install
npm install

# 2. Build the shared package (consumed by api & miniapp)
npm run build --workspace packages/shared

# 3. Configure the API
cp apps/api/.env.example apps/api/.env   # set BOT_TOKEN, JWT_SECRET, ADMIN_TELEGRAM_IDS, DATABASE_URL

# 4. Create the schema (a default shop is bootstrapped automatically on first request;
#    optionally seed a demo catalog instead)
npm run db:migrate --workspace apps/api
npm run db:seed    --workspace apps/api   # optional demo data

# 5. Run API and Mini App (two terminals)
npm run dev:api        # http://localhost:3000
npm run dev:miniapp    # http://localhost:5173 (proxies /api → :3000)
```

### Docker Compose

```bash
# Brings up Postgres + API (auto-migrated) + the Mini App (nginx)
BOT_TOKEN=123:abc JWT_SECRET=$(openssl rand -hex 32) ADMIN_TELEGRAM_IDS=123456789 docker compose up --build
# API → http://localhost:3000 · Mini App → http://localhost:8080
```

---

## 🧪 Testing & quality

```bash
npm run lint        # ESLint (flat config) across the monorepo
npm run format      # Prettier check
npm run typecheck   # tsc --noEmit, every workspace
npm test            # Vitest: shared + api (+ integration) + miniapp
```

The API ships a full **integration test** against a real Postgres (`apps/api/src/__tests__/integration.test.ts`), covering auth → cart → order → receipt → admin confirmation, and admin role management. It's skipped unless `TEST_DATABASE_URL` is set.

---

## 📁 Project structure

```
elite-ware-shop/
├── apps/
│   ├── api/                 # Hono + Drizzle backend
│   │   ├── src/auth/        # initData validation, JWT, middleware
│   │   ├── src/db/          # Drizzle schema, client, migrations, seed
│   │   ├── src/routes/      # auth, catalog, cart, orders, admin
│   │   └── src/services/    # business logic (cart, orders, shop, users, …)
│   └── miniapp/             # React + Vite storefront
│       └── src/             # pages, providers, hooks, SDK init, i18n, API client
├── packages/shared/         # zod schemas + inferred types
```

---

## ⚙️ Configuration (API)

| Variable                   | Description                                                             | Default |
| -------------------------- | ----------------------------------------------------------------------- | ------- |
| `DATABASE_URL`             | Postgres connection string                                              | —       |
| `BOT_TOKEN`                | Telegram bot token (from @BotFather)                                    | —       |
| `JWT_SECRET`               | Secret for signing session JWTs (≥16 chars)                             | —       |
| `JWT_TTL_SECONDS`          | Session lifetime                                                        | `3600`  |
| `INITDATA_MAX_AGE_SECONDS` | Max accepted `initData` age                                             | `86400` |
| `ADMIN_TELEGRAM_IDS`       | Comma-separated admin user ids (first admins; more can be added in-app) | —       |
| `SHOP_ID`                  | Active shop id (optional; resolved/bootstrapped automatically)          | —       |
| `CORS_ORIGIN`              | Allowed Mini App origin(s)                                              | `*`     |

---

## 📝 License

[MIT](./LICENSE)

---

## 🇷🇺 Русский

> Магазин в формате **Telegram Mini App** — витрина на React и типизированный API на Hono/PostgreSQL, с серверной проверкой Telegram `initData` и **ручной оплатой картой** (покупатель загружает чек, админ подтверждает).

### Возможности

- 🛍️ **Витрина** — категории, поиск, карточка товара, корзина и оформление
- 🔐 **Безопасная авторизация** — серверная проверка `initData` по HMAC-SHA256 → короткоживущий JWT
- 💳 **Ручная оплата картой** — админ задаёт номер карты и инструкции; покупатель загружает чек об оплате; админ проверяет и подтверждает из списка заказов
- 📦 **Заказы** — история заказов для покупателя, админ-панель для товаров, категорий и статусов
- 👤 **Управление админами** — любой админ может назначить или снять права админа у другого пользователя прямо в приложении — без передеплоя
- 🌐 **Локализация** — узбекский и русский, переключение прямо в приложении
- 🎨 **Брендированный UX** — компоненты Telegram UI, минималистичная светлая/тёмная тема бренда, MainButton / BackButton
- ✅ **Качество** — TS strict, ESLint + Prettier, Vitest (юнит + интеграция с реальным Postgres), Docker + Compose

### Архитектура

| Пакет             | Стек                                                                    | Назначение                                                   |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/shared` | TypeScript, **zod 4**                                                   | Схемы и типы для API и клиента                               |
| `apps/api`        | **Hono 4**, **Drizzle 0.45**, PostgreSQL, **jose**                      | Проверка initData, JWT, каталог/корзина/заказы/админка/юзеры |
| `apps/miniapp`    | **React 18.3**, **Vite 8**, `@telegram-apps/sdk-react` 3, Telegram UI 2 | Витрина + админ-интерфейс                                    |

> **Почему React 18?** `@telegram-apps/telegram-ui` требует React 18, поэтому витрина зафиксирована на React 18.3, а остальной стек использует свежие версии.

### Проверка `initData`

Сервер не доверяет клиенту. Mini App присылает сырую строку `initData`, а API проверяет её перед выдачей сессии:

1. Разобрать query-строку, извлечь `hash`.
2. Собрать **data-check-string**: остальные поля (включая `signature`, если есть) как `key=value`, отсортированные по ключу и соединённые через `\n`.
3. Получить секретный ключ: `HMAC_SHA256(ключ="WebAppData", сообщение=botToken)`.
4. Вычислить `HMAC_SHA256(ключ=secretKey, сообщение=dataCheckString)` и сравнить с `hash` за постоянное время.
5. Отклонить, если `auth_date` старше `INITDATA_MAX_AGE_SECONDS` (защита от повторов).

Валидатор — чистая функция без зависимостей в [`apps/api/src/auth/init-data.ts`](apps/api/src/auth/init-data.ts), покрытая детерминированными тестами.

### Оплата

1. Покупатель оформляет заказ → API создаёт заказ из серверной корзины (`pending`).
2. Mini App показывает номер карты магазина, имя владельца и инструкции, плюс выбор файла.
3. Покупатель загружает скриншот перевода; он сжимается на клиенте и сохраняется в заказе (`awaiting_payment`).
4. Админ открывает список заказов, видит миниатюру чека и нажимает **«Подтвердить оплату»** — заказ помечается `paid` (идемпотентно), отслеживаемый остаток списывается.

### Управление админами

Первый админ задаётся через переменную `ADMIN_TELEGRAM_IDS`. Далее любой админ может выдать или отозвать права админа другому пользователю прямо со страницы «Админ» — у пользователя должен быть хотя бы один вход в Mini App. Последнего админа снять нельзя, и никто не может изменить собственную роль — магазин никогда не останется без управления.

### Быстрый старт

```bash
npm install
npm run build --workspace packages/shared
cp apps/api/.env.example apps/api/.env   # задать BOT_TOKEN, JWT_SECRET, ADMIN_TELEGRAM_IDS, DATABASE_URL
npm run db:migrate --workspace apps/api
npm run db:seed    --workspace apps/api   # опционально, демо-данные
npm run dev:api        # http://localhost:3000
npm run dev:miniapp    # http://localhost:5173
```

Или через Docker Compose (Postgres + API + Mini App):

```bash
BOT_TOKEN=123:abc JWT_SECRET=$(openssl rand -hex 32) ADMIN_TELEGRAM_IDS=123456789 docker compose up --build
```

### Тесты и качество

```bash
npm run lint
npm run format
npm run typecheck
npm test
```

Интеграционный тест API выполняется против реального Postgres и проверяет путь авторизация → корзина → заказ → чек → подтверждение админом, а также управление ролями админов.

### Лицензия

[MIT](./LICENSE)
