# IronLog

A workout-tracking web app: log training sessions, watch your volume and
strength climb, and chase personal records. Spring Boot REST API plus a React
single-page app, shipped as one Docker image.

> Backend: Java 21 · Spring Boot · Spring Security (JWT) · JPA/Hibernate · Postgres (Neon)
> Frontend: React 19 · TypeScript · Vite · React Router · Recharts

## Features

- **Email + password auth** with stateless JWT sessions.
- **Exercise library** with ~60 seeded movements across muscle groups and
  equipment, plus your own custom exercises.
- **Session logging**: add exercises, add sets (reps, weight, optional RPE and
  set type), see live volume as you build the workout. Edit or delete later.
- **Analytics**: total volume, weekly volume trend, muscle-group distribution,
  current and longest streaks.
- **Personal records**: best weight per exercise, estimated 1RM (Epley), and a
  per-exercise progress chart over time.
- **KG / LB** display preference, converted at the edges; everything is stored
  in kilograms.

## Project layout

```
ironlog/
├── backend/                 Spring Boot API
│   ├── src/main/java/dev/ironlog/
│   │   ├── domain/          JPA entities + enums
│   │   ├── repo/            Spring Data repositories
│   │   ├── dto/             Request/response records
│   │   ├── service/         Business logic (incl. Analytics, Stats)
│   │   ├── security/        JWT filter, config, UserDetailsService
│   │   └── web/             REST controllers
│   └── src/test/java/       Unit + MockMvc integration tests
├── frontend/                React + Vite SPA
│   └── src/{api,auth,components,pages,lib,styles}
├── Dockerfile               multi-stage: node → maven → temurin jre
├── render.yaml              Render blueprint
└── .node-version            pin Node for the frontend build
```

At container build time the SPA is compiled and copied into
`backend/src/main/resources/static`, so a single Spring Boot process serves both
the API and the app. Client-side routes fall back to `index.html`
(`SpaWebConfig`).

## Run locally

### Backend (http://localhost:8080)

Requires JDK 21.

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The `default` profile uses an in-memory H2 database (data resets on restart) and
the H2 console at `/h2-console`. The API explorer is at `/swagger-ui.html`.

### Frontend (http://localhost:5173)

Requires Node >= 22.23.

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`, so run both together.

### Tests

```bash
cd backend && ./mvnw test     # Analytics, streaks, and full API lifecycle
cd frontend && npm run build  # tsc --noEmit && vite build
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` for Postgres; omit for H2 |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` (parsed into JDBC settings) |
| `IRONLOG_JWT_SECRET` | HMAC signing key for JWTs (required in prod) |
| `IRONLOG_CORS_ORIGINS` | Comma-separated allowed origins, or `*` (default) |

`DATABASE_URL` is normalized at startup by `DatabaseUrlSupport`: Neon/Render give
a `postgres://` URL, which is split into `spring.datasource.url/username/password`
system properties before the context starts.

## API

All endpoints are under `/api`. Everything except `register`/`login` needs
`Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account, returns token |
| POST | `/api/auth/login` | Sign in, returns token |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update display name / unit |
| GET | `/api/exercises` | Catalog with `q`, `category`, `muscle` filters |
| POST/PUT/DELETE | `/api/exercises[/{id}]` | Manage custom exercises |
| GET | `/api/workouts` | Paginated history (`page`, `size`, `from`, `to`) |
| GET | `/api/workouts/{id}` | Full session detail |
| POST/PUT/DELETE | `/api/workouts[/{id}]` | Create / update / delete a session |
| GET | `/api/stats/summary` | Totals + streaks |
| GET | `/api/stats/volume` | Weekly volume series (`weeks`) |
| GET | `/api/stats/muscles` | Volume by muscle group (`days`) |
| GET | `/api/stats/records` | Personal records |
| GET | `/api/stats/exercises/{id}` | Progress for one exercise (`days`) |

Full request/response schemas are in the OpenAPI docs at `/swagger-ui.html`.

## Deploy

The included `render.yaml` provisions a Docker web service:

1. Push this repo to GitHub.
2. In Render, create a Blueprint from the repo (or a Docker web service using the
   root `Dockerfile`) and set `DATABASE_URL` to a Postgres instance (e.g. Neon).
3. Deploy. Render generates `IRONLOG_JWT_SECRET` and health-checks
   `/actuator/health`.

## Notes

- Weights are stored in **kilograms**; the API never sees pounds.
- JWT secret must be set in production; there is no default in the `prod`
  profile.

## Known limitations / next steps

Deliberate scope choices for a portfolio build, called out rather than hidden:

- **Time handling is UTC-only.** Streaks, weekly volume, and "this week" bucket
  by UTC day, so a user far from UTC can see a session land on an adjacent day.
  The fix is a per-user timezone on `User`.
- **Stats are aggregated in memory** over the caller's full set history. This is
  fine at portfolio scale; production should push the totals into SQL
  aggregates over a bounded window.
- **Schema is managed by `ddl-auto: update`.** A real deployment should use
  Flyway or Liquibase migrations.
- **No rate limiting or lockout** on login, so it is brute-forceable.
- **The JWT lives in `localStorage`**, which is XSS-readable. A hardened build
  would use an httpOnly cookie with CSRF protection.
- **Session duration is entered by hand** (minutes); it is not auto-timed.
