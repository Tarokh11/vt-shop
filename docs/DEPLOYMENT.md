# Linux VPS deployment

The `vt-shop` branch deploys to a Linux VPS with Docker Compose. GitHub Actions
connects over SSH, pulls this public repository, builds the application images,
runs database migrations and collects Django static files before restarting
the services. The workflow does not copy application secrets from GitHub; the
server keeps them in its untracked `.env` file.

## One-time VPS setup

1. Install Docker Engine with the Compose plugin and Git on the VPS. Use a
   dedicated deployment account that can run Docker commands.
2. Clone the public repository into `~/vt-shop`:

   ```sh
   git clone --branch vt-shop https://github.com/Tarokh11/vt-shop.git ~/vt-shop
   cd ~/vt-shop
   ```

3. Create the server-only environment file and edit its production values:

   ```sh
   cp .env.example .env
   chmod 600 .env
   ```

   Set at least:

   - `DJANGO_SECRET_KEY`: a new long random value, generated on the VPS (for
     example, `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`).
   - `DJANGO_DEBUG=false` and `DJANGO_SECURE_SSL_REDIRECT=true`.
   - `DJANGO_ALLOWED_HOSTS` to the public shop hostname, without a scheme.
   - `DJANGO_CSRF_TRUSTED_ORIGINS` to the HTTPS shop origin, with a scheme.
   - `FRONTEND_ORIGIN` to the HTTPS shop origin.
   - `POSTGRES_PASSWORD` to a new strong password; set `POSTGRES_HOST=db` and
     `POSTGRES_PORT=5432` for Compose.
   - `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`, and
     `ZARINPAL_CALLBACK_URL` for the merchant's verified production setup.

   Do not commit or send `.env` through GitHub Actions. Compose stores database,
   static, and uploaded media files in named persistent volumes.

4. Configure the VPS host Nginx (or another TLS reverse proxy) to terminate
   HTTPS and forward the shop hostname to `http://127.0.0.1:8080`. Preserve the
   original host and set the forwarded protocol:

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   Provision a valid TLS certificate and point the shop DNS record at the VPS.
   The Compose proxy only binds to loopback, so port 8080 is not exposed publicly.

5. Add these repository **Actions secrets** under `Tarokh11/vt-shop` settings:

   | Secret | Value |
   | --- | --- |
   | `DEPLOY_HOST` | VPS IP address or SSH hostname |
   | `DEPLOY_USER` | Dedicated VPS deployment account |
   | `DEPLOY_SSH_KEY` | Private SSH key authorized for that account |
   | `DEPLOY_KNOWN_HOSTS` | Verified `known_hosts` line for the VPS SSH host |

   Verify the VPS SSH host-key fingerprint using your VPS provider before
   adding its `known_hosts` line. Never put a private key or application
   credential in workflow YAML, a commit, or chat.

## Deploy and operate

After the one-time setup and secrets are ready, pushes to `vt-shop` deploy
automatically. You can also run **Actions → Deploy to VPS → Run workflow**.
The first deployment applies migrations and gathers static assets before
starting the app. Check service state and logs on the VPS with:

```sh
cd ~/vt-shop
docker compose ps
docker compose logs --tail=100 backend frontend proxy
```

Back up the `postgres_data` and `media_data` volumes regularly and store backups
off the VPS. Database migrations are applied automatically on each deploy.

## Current production prerequisites

This workflow prepares the application stack; production launch still requires
the merchant's real Zarinpal configuration, domain and TLS, and persistent
media backups. Email currently uses Django's console backend, so password
recovery emails require a separately configured SMTP integration before they
can be delivered to customers.
