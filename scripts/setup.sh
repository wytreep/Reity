#!/bin/bash
set -e

echo "🚀 Configurando Reity..."

# Verificar dependencias
command -v node >/dev/null || { echo "❌ Node.js no instalado"; exit 1; }
command -v yarn >/dev/null || { echo "❌ Yarn no instalado. Ejecuta: npm install -g yarn"; exit 1; }
command -v docker >/dev/null || { echo "❌ Docker no instalado"; exit 1; }

echo "✅ Dependencias verificadas"

# Copiar .env del backend
if [ ! -f "apps/backend/.env" ]; then
  cp apps/backend/.env.example apps/backend/.env
  echo "✅ .env del backend creado (ajusta las variables)"
else
  echo "⚠️  .env del backend ya existe, no se sobreescribe"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
yarn install

# Levantar Docker
echo "🐳 Levantando PostgreSQL y Redis..."
yarn docker:up

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando base de datos..."
sleep 5

echo ""
echo "✅ Reity configurado correctamente"
echo ""
echo "Para iniciar el desarrollo:"
echo "  Terminal 1 → yarn backend"
echo "  Terminal 2 → yarn mobile"
echo ""
echo "Swagger disponible en: http://localhost:3000/docs"
