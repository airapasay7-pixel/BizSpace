# BizSpace

A multi-user business workspace. Anyone can register and manage **their own** products (name, category, price,
stock). There is no admin role: every account is an isolated workspace, enforced on the server.

- **Backend:** Laravel 12, Laravel Sanctum (cookie-based SPA auth), MySQL, Eloquent, Form Requests, Policies, API Resources
- **Frontend:** React 18, Vite, Tailwind CSS 3, React Router, Axios, Lucide icons
- **Architecture:** one deployable app. Laravel serves a single Blade shell that mounts the React SPA; the SPA
  talks to the same-origin JSON API under `/api`. Because it is same-origin, no CORS or token storage is needed.

## Requirements

PHP 8.2+ (with `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`), Composer 2, Node 20+, MySQL 8 / MariaDB 10.4+.
XAMPP or WAMP works.

## Local setup

```bash
composer install
npm install
cp .env.example .env            # Windows: copy .env.example .env
php artisan key:generate
```

1. Start MySQL (XAMPP control panel) and create an empty database:
   `CREATE DATABASE bizspace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Check the `DB_*` values in `.env` (defaults: `root`, empty password, `127.0.0.1:3306`).
3. Create the tables and start both servers:

```bash
php artisan migrate
composer dev        # php artisan serve on 127.0.0.1:8000 + Vite dev server
```

Open **http://127.0.0.1:8000** (use this host and port; Sanctum treats it as the stateful frontend domain).

> `SANCTUM_STATEFUL_DOMAINS` is intentionally unset: Sanctum then trusts `localhost`, `127.0.0.1:8000` and the host
> of `APP_URL`. If you serve the app from any other host or port, set `APP_URL` correctly or list that host in
> `SANCTUM_STATEFUL_DOMAINS`, otherwise registration and login fail with a `500` (no session is started).
> Never copy a local `.env` to a server.

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL` | Standard Laravel settings. `APP_KEY` comes from `key:generate`. |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection. |
| `SANCTUM_STATEFUL_DOMAINS` | Optional. Hosts (with port) the SPA is served from. Defaults to localhost + the `APP_URL` host. |
| `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE` | Session cookie behaviour. |
| `LOW_STOCK_THRESHOLD` | A product is "low stock" at or below this quantity (default `5`; see `config/bizspace.php`). |
| `CORS_ALLOWED_ORIGINS` | Optional. Empty by default because the SPA is same-origin. |
| `BCRYPT_ROUNDS` | Password hashing cost. |

No secrets are committed; `.env` is git-ignored.

## API

All routes are under `/api`. Before the first `POST`, the SPA calls `GET /sanctum/csrf-cookie`.

| Method & path | Description |
|---|---|
| `POST /register`, `POST /login` | Guest only, throttled (10/min per IP + email) |
| `POST /logout`, `GET /user` | Authenticated |
| `GET /overview` | Totals, low-stock count, five most recent products |
| `GET /products` | Query: `search`, `category`, `sort` (`name`,`price`,`quantity`,`created_at`), `direction`, `per_page` (≤100), `page` |
| `GET /products/categories` | Distinct categories for the filter |
| `POST /products`, `GET/PUT/PATCH/DELETE /products/{id}` | Owner only; another user's ID returns `404` |
| `PATCH /profile`, `PUT /profile/password` | Update name/email, change password |

Validation failures return `422` with `{ message, errors: { field: [..] } }`.

## Security model

- Every product query goes through `$request->user()->products()`; a `ProductPolicy` additionally rejects foreign IDs
  (answered as `404` so IDs cannot be probed).
- `user_id` is not fillable and never read from the request; products are created through the relationship.
- Passwords are hashed (bcrypt); password strength is defined once in `AppServiceProvider` (breach check in production).
- Session is regenerated on login and invalidated on logout; auth state in the browser comes from `GET /user`, never localStorage.
- CSRF protection on all stateful API calls; sort fields are whitelisted; `LIKE` wildcards in search are escaped.
- API resources expose only intended fields (no password hash, no `user_id`).

## Tests and build

```bash
php artisan test          # 29 feature tests (auth, CRUD, isolation, validation, filtering, stats, profile)
npm run build             # production frontend build into public/build
vendor/bin/pint --test    # code style
```

Tests use an in-memory SQLite database (see `phpunit.xml`), so `pdo_sqlite` must be enabled.

## Production deployment

1. Provision PHP 8.2+, MySQL, and a web server whose **document root is `public/`**. Serve over HTTPS.
2. Deploy the code, then:

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
cp .env.example .env && php artisan key:generate   # then edit the values below
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

3. Production `.env`:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example
DB_*=<dedicated MySQL user with a strong password>
SANCTUM_STATEFUL_DOMAINS=your-domain.example
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=your-domain.example
```

4. Make `storage/` and `bootstrap/cache/` writable by the web server user.
5. Behind a reverse proxy or load balancer, configure trusted proxies so Laravel sees HTTPS.

## Project layout

```
app/Http/Controllers      Auth, Product, Overview, Profile controllers
app/Http/Requests         Form Requests (validation)
app/Http/Resources        JSON shapes returned to the client
app/Policies              ProductPolicy (ownership)
database/migrations       users, products (FK + composite indexes)
routes/api.php            REST API;  routes/web.php serves the SPA shell
resources/js              React app (pages, layouts, components, context, lib)
tests/Feature             Backend feature tests
```
