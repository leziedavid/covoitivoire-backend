# Étape 1 : Builder - installation dev + build + prisma generate
FROM node:20-alpine AS builder

WORKDIR /app

# Installer OpenSSL (version 3) requis par Prisma dans Alpine 3.22+
RUN apk add --no-cache openssl

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (prod + dev)
RUN npm install

# Copier fichiers Prisma et sources
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY nest-cli.json ./

# Générer le client Prisma (indispensable)
RUN npx prisma generate

# Builder le projet (NestJS ou autre)
RUN npm run build

# Étape 2 : Runner - image finale minimaliste pour exécuter
FROM node:20-alpine AS runner

WORKDIR /app

# Copier package.json pour info (optionnel)
COPY package*.json ./

# Installer uniquement les dépendances prod (pour modules natifs éventuels)
RUN npm install --only=production

# Installer OpenSSL (version 3) requis par Prisma dans Alpine 3.22+
RUN apk add --no-cache openssl

# Copier le build, node_modules et prisma depuis builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Créer dossier storage (requis par l'app)
RUN mkdir -p /app/storage

# Installer PM2 globalement
RUN npm install pm2 -g

# Copier script d'entrée et le rendre exécutable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Exposer port utilisé par l'app
EXPOSE 4000

# Commande de lancement (ton entrypoint.sh)
# CMD ["/app/entrypoint.sh"]
