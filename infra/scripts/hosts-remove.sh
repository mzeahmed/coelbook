#!/usr/bin/env bash
# Removes the local development domains from /etc/hosts if present.
# Requires sudo to write to /etc/hosts.
set -euo pipefail

HOSTS_FILE="/etc/hosts"
DOMAINS=("playbook.local" "api.playbook.local")

for domain in "${DOMAINS[@]}"; do
    if grep -qE "^127\.0\.0\.1[[:space:]]+${domain}$" "$HOSTS_FILE"; then
        sudo sed -i "/^127\.0\.0\.1[[:space:]]\+${domain}$/d" "$HOSTS_FILE"
        echo "Removed $domain from $HOSTS_FILE"
    else
        echo "$domain not present in $HOSTS_FILE"
    fi
done