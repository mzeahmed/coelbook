#!/usr/bin/env bash
# Adds the local development domains to /etc/hosts if they're not already
# present. Requires sudo to write to /etc/hosts.
set -euo pipefail

HOSTS_FILE="/etc/hosts"
DOMAINS=("coelbook.local" "api.coelbook.local")

for domain in "${DOMAINS[@]}"; do
    if grep -qE "^127\.0\.0\.1[[:space:]]+${domain}$" "$HOSTS_FILE"; then
        echo "$domain already present in $HOSTS_FILE"
    else
        echo "127.0.0.1 $domain" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo "Added $domain to $HOSTS_FILE"
    fi
done