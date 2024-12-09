#!/usr/bin/env sh

#!/bin/sh
set -e

# Ensure the HOST_IP variable is set
if [ -z "$HOST_IP" ]; then
  echo "HOST_IP environment variable is not set. Exiting."
  exit 1
fi

# Replace all occurrences of 127.0.0.1 with $HOST_IP in the config file
sed -i "s/127.0.0.1/$HOST_IP/g" /usr/local/etc/php-fpm.d/www.conf

cd /var/www/html

exec php-fpm
