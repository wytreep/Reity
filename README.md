# Reity — Finanzas Personales Inteligentes

> Conoce el valor real de tu dinero, hoy y mañana.

App móvil de finanzas personales con ajuste por inflación IPC Colombia.

## Stack

| Capa | Tecnología |
|------|-----------|
| Mobile | React Native + Expo + Expo Router |
| Backend | NestJS + TypeScript + TypeORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Email | Resend API |
| Deploy BE | Railway |
| Deploy App | Expo EAS |

## Desarrollo local

### Prerrequisitos
- Node.js 20+
- Yarn 1.22+
- Docker Desktop

### Setup

```bash
# 1. Clonar
git clone https://github.com/wytreep/reity.git
cd reity

# 2. Instalar dependencias
yarn install

# 3. Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
# Edita apps/backend/.env con tus valores

# 4. Crear .env raíz para el mobile
echo "EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001/api/v1" > .env

# 5. Levantar PostgreSQL y Redis
docker compose -f docker/docker-compose.yml up -d

# 6. Correr migraciones
yarn workspace @reity/backend migration:run

# 7. Iniciar backend (Terminal 1)
yarn backend

# 8. Iniciar mobile (Terminal 2)
yarn mobile
```

## Deploy a Railway

### Backend

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Agregar PostgreSQL y Redis desde Railway dashboard

# 5. Configurar variables de entorno en Railway dashboard
#    (ver apps/backend/.env.production.example)

# 6. Deploy
railway up
```

### APK con Expo EAS

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configurar proyecto
eas build:configure

# 4. Build APK preview
eas build --platform android --profile preview

# 5. Build producción (AAB para Play Store)
eas build --platform android --profile production
```

## Sprints completados

| Sprint | Estado | Descripción |
|--------|--------|-------------|
| S0 — Setup | ✅ | Monorepo, Docker, CI/CD |
| S1 — Auth | ✅ | JWT, Redis, biometría, email |
| S2 — Transacciones | ✅ | CRUD, categorías, gráficas |
| S3 — Presupuesto | ✅ | Límites, alertas 80%/100% |
| S4 — Metas | ✅ | Ahorro, aportes, proyección |
| S5 — Inflación | ✅ | IPC DANE, poder adquisitivo |
| S6 — Seguridad | ✅ | Brute-force, lockout, OTP, Ley 1581 |
| S7 — Producción | ✅ | Migraciones, Railway, EAS |

## Seguridad implementada

- JWT con refresh token rotation
- Account lockout tras 5 intentos fallidos (15 min)
- OTP de 6 dígitos para reset de contraseña
- Validación DNS MX de correos
- Filtro de emails temporales (40+ dominios)
- Rate limiting: 100 req/15min global, 3 resets/hora
- CORS estricto por origen
- Helmet con CSP en producción
- Audit logs de todos los eventos de auth
- Cumplimiento Ley 1581 de 2012 (Colombia)

## Estructura

```
reity/
├── apps/
│   ├── backend/    # NestJS API
│   └── mobile/     # React Native + Expo
├── docker/         # Docker Compose
├── scripts/        # Scripts de utilidad
└── docs/           # PRD + Arquitectura
```

---

Desarrollado por Edwin Carabali · [@wytreep](https://github.com/wytreep)
