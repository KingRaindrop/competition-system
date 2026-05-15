#!/bin/sh
set -e

cd /app

echo "Syncing Prisma schema..."
cp /app/prisma.schema /app/prisma/schema.prisma

echo "Running prisma db push..."
npx prisma db push --skip-generate

if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts
fi

echo "Starting server on port ${PORT:-3000}..."
exec node dist/index.js
