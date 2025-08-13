#!/bin/sh

ENV_FILE=/app/.env

# Si .env est un dossier, on le supprime pour recréer un fichier
if [ -d "$ENV_FILE" ]; then
  echo "⚠️  .env est un dossier, suppression..."
  rm -rf "$ENV_FILE"
fi

# Si le fichier .env n'existe pas, on le crée avec la config par défaut
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env not found, creating default .env file..."

  cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://microservices:microservices@postgresql:5432/mscovoitivoire?schema=public
JWT_SECRET=72f21bf2916454b01dd8
JWT_EXPIRE=7d
COOKIE_EXPIRE=5
CLOUDINARY_CLOUD_NAME=dtakbf3ha
CLOUDINARY_API_KEY=196581248868223
CLOUDINARY_API_SECRET=_IN5L1lB4JNqh-t_csNWSb3z5W0
FILE_STORAGE_PATH=/app/storage
NODE_ENV=production
PORT=4000
EOF

  echo "✅ Default .env file created."
else
  echo "✅ .env file found, using existing config."
fi

# Lancer pm2-runtime en mode watch sur .env + dossier src
exec pm2-runtime dist/main.js --watch --watch-delay 1000 --ignore-watch="node_modules"
