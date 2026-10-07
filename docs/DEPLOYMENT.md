# vt-shop VPS deployment

The workflow follows the supplied `action-deploy.yml` SSH deployment example,
using the current `vt-shop` branch and GitHub environment `vt-shop`. It checks
out the exact workflow commit on the VPS, builds the application, migrates the
database, collects static assets, and waits for container health checks.

## Current server configuration

- Host: `94.184.45.92`; SSH port: `22`; account: `root`.
- Application directory: `/opt/vt-shop`.
- Compose project: `vtshop`, with separate database and media volumes.
- Planned HTTP address: `http://94.184.45.92:8084`.
- Ports 8080–8083 are already in use on this shared VPS. Port 8084 was free
  during the read-only server check; confirm it remains free before first deploy.

The supplied `PRODUCTION _vtshop.txt` contains a private key. It is excluded
from Git and the Docker build context. Store its key only in GitHub Actions
secrets; this repository contains references to secret names, not key values.

## GitHub environment

Create environment **vt-shop** under **Settings → Environments** in
`Tarokh11/vt-shop`, then add these environment secrets:

| Secret | Value |
| --- | --- |
| `PRODUCTION_HOST` | `94.184.45.92` |
| `PRODUCTION_PORT` | `22` (also the workflow default) |
| `PRODUCTION_USER` | `root` |
| `PRODUCTION_PATH` | `/opt/vt-shop` |
| `PRODUCTION_SSH_KEY` | Private SSH key from the supplied production file |
| `PRODUCTION_KNOWN_HOSTS` | VPS SSH host-key entries pinned during setup |

The workflow uses strict host-key checking and does not discover a new host
key during each deploy. Update the pinned host-key secret if the VPS host key
changes. The previous `DEPLOY_*` secret names are no longer used.

## Prepare the server environment

Docker Compose 2.40.3 is installed on the VPS. Prepare the application directory
and server-only environment file:

```sh
git clone --branch vt-shop https://github.com/Tarokh11/vt-shop.git /opt/vt-shop
cd /opt/vt-shop
cp deploy/vtshop.env.example .env
chmod 600 .env
```

Edit `.env` on the VPS and fill the empty `DJANGO_SECRET_KEY` and
`POSTGRES_PASSWORD` with new random values. Generate each value on the server,
for example with `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`.
Keep that file out of GitHub and workflow logs.

The committed template keeps Django debug disabled and configures HTTP access
by IP. It disables HTTPS redirects, HSTS, and secure-only cookies for this
preview. Store-specific session and CSRF cookie names prevent collisions with
other projects on the same IP. The frontend's CSRF cookie name is baked into
its image at build time from `DJANGO_CSRF_COOKIE_NAME`.

`SHOP_BIND_ADDRESS=0.0.0.0` publishes the shop directly on port 8084. Allow
that port in the VPS firewall when starting the preview.

## Deploy and operate

Pushes to `vt-shop` deploy automatically after environment secrets and the
server `.env` are ready. Manual runs use **Actions → Deploy vt-shop →
Run workflow**. A missing server `.env` stops deployment before repository
or container changes on the VPS.

The workflow builds, starts PostgreSQL, applies migrations, collects static
files, starts all services, waits for healthy containers, and runs Django's
system check. It uses Compose project `vtshop` so this application's containers
and volumes remain separate from the existing Nora deployment.

```sh
cd /opt/vt-shop
docker compose --project-name vtshop ps
docker compose --project-name vtshop logs --tail=100 backend frontend proxy
docker compose --project-name vtshop exec backend python manage.py createsuperuser
```

A new database starts without the local development catalog. To install the
existing stationery samples once, including their product photos:

```sh
docker compose --project-name vtshop exec backend python manage.py seed_stationery
```

Back up the `vtshop_postgres_data` and `vtshop_media_data` volumes off the VPS
regularly. Migrations run automatically on each deploy.

## Move to domain and HTTPS

When a domain is ready, terminate TLS using the VPS host reverse proxy and
forward it to `127.0.0.1:8084`. Set `SHOP_BIND_ADDRESS=127.0.0.1`, update
the allowed hosts, trusted origins, frontend origin, and payment callback URL,
and enable `DJANGO_SECURE_SSL_REDIRECT`, `DJANGO_SESSION_COOKIE_SECURE`, and
`DJANGO_CSRF_COOKIE_SECURE`. Preserve the incoming host and forward the
original protocol:

```nginx
location / {
    proxy_pass http://127.0.0.1:8084;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Customer production launch still needs a verified Zarinpal merchant setup,
SMTP integration (email currently uses Django's console backend), HTTPS,
and persistent-media backups.
