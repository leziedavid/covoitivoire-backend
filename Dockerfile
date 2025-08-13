# Étape 1 : Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY nest-cli.json ./
RUN npx prisma generate
RUN npm run build

# Étape 2 : Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh
RUN mkdir -p /app/storage
EXPOSE 4000

# Lancer l'app seulement quand PostgreSQL est prêt
CMD ["/app/wait-for-it.sh", "ms_pg_sql:5432", "--", "node", "dist/main.js"]
