#!/bin/sh

ENV_FILE=/app/.env

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env not found, creating default .env file..."

  cat <<EOF > "$ENV_FILE"
DATABASE_URL=postgresql://microservices:microservices@db:5432/mscovoitivoire?schema=public
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
  echo ".env file found, using existing config."
fi

exec pm2-runtime dist/main.js --watch --watch-delay 1000 --watch-ignore node_modules
