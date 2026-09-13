# Reity — Finanzas Personales Inteligentes

> Conoce el valor real de tu dinero, hoy y mañana.

App móvil de finanzas personales ajustada por inflación para Colombia.

## Stack

| Capa | Tecnología |
|------|------------|
| Mobile | React Native + Expo + Expo Router |
| Backend | NestJS + TypeScript + TypeORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Deploy | Railway (BE) + Expo EAS (APK) |

## Inicio rápido

```bash
# 1. Clonar y configurar
git clone https://github.com/wytreep/reity.git
cd reity
bash scripts/setup.sh

# 2. Backend (Terminal 1)
yarn backend

# 3. Mobile (Terminal 2)
yarn mobile
```

## Estructura

```
reity/
├── apps/
│   ├── backend/    # NestJS API
│   └── mobile/     # React Native + Expo
├── docker/         # Docker Compose + init.sql
├── scripts/        # Scripts de utilidad
└── docs/           # Documentación adicional
```

## Sprints

| Sprint | Estado |
|--------|--------|
| S0 — Setup | ✅ Completado |
| S1 — Auth | ✅ Completado |
| S2 — Transacciones | ✅ Completado |
| S3 — Presupuesto | ✅ Completado |
| S4 — Metas | ✅ Completado |
| S5 — Inflación | ✅ Completado |
| S6 — Polish | ⏳ Siguiente |
| S7 — Deploy | 🔜 |

## Documentos

- [PRD](docs/PRD.md)
- [Arquitectura](docs/ARQUITECTURA.md)
