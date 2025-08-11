# ... (les étapes précédentes restent inchangées)

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

RUN npm install pm2 -g

RUN mkdir -p /app/storage

# Copier le script entrypoint.sh dans l'image
COPY entrypoint.sh /app/entrypoint.sh

# Rendre le script exécutable
RUN chmod +x /app/entrypoint.sh

EXPOSE 4000

# Lancer le script au démarrage
CMD ["/app/entrypoint.sh"]
