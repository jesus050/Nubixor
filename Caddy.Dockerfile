FROM caddy:2-alpine

# Hostinger Docker projects store the Compose file but do not reliably retain
# sibling bind-mounted files. Bake the Caddy configuration into the image so
# the proxy starts from the same immutable release as the application.
COPY Caddyfile /etc/caddy/Caddyfile
