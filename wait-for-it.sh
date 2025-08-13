#!/bin/sh
# wait-for-it.sh host:port [timeout]
hostport=$1
timeout=${2:-30}

IFS=: read host port <<< "$hostport"

for i in $(seq $timeout); do
  nc -z "$host" "$port" >/dev/null 2>&1 && exit 0
  echo "⏳ Waiting for $host:$port..."
  sleep 1
done

echo "❌ Timeout waiting for $host:$port"
exit 1
