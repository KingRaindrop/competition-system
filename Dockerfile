# ---- Stage 1: Build Frontend ----
FROM node:22-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
ENV VITE_API_BASE=
RUN npm run build

# ---- Stage 2: Build Backend ----
FROM node:22-alpine AS backend-builder
WORKDIR /build/backend

COPY backend/package.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/
COPY backend/prisma/ ./prisma/

RUN npx prisma generate
RUN npm run build

# ---- Stage 3: Runtime ----
FROM node:22-alpine
WORKDIR /app

COPY backend/package.json ./
RUN npm install --omit=dev && npm install -g tsx

COPY --from=backend-builder /build/backend/dist ./dist
COPY --from=backend-builder /build/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /build/backend/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma/ ./prisma/
COPY backend/prisma/schema.prisma ./prisma.schema
COPY --from=frontend-builder /build/frontend/dist ./public

RUN mkdir -p /app/uploads

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
