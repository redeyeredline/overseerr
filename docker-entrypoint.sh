#!/bin/sh
set -e

# Ensure commitTag is always set to "local" to prevent refresh loops
echo '{"commitTag": "local"}' > /app/committag.json

# Ensure config symlink exists
if [ ! -L /app/config ]; then
  rm -rf /app/config
  ln -s /config /app/config
fi

# Execute the original command
exec "$@"
