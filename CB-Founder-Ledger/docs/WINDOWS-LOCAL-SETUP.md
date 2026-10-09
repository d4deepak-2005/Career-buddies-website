# Run CareerBuddies Founder Finance on your own Windows PC

Everything below runs **on your PC**, in Windows PowerShell. Nothing here touches the cloud sandbox.

> **`localhost` is not shared.** `localhost` / `127.0.0.1` always means *the machine the browser runs on*. The application that was verified earlier ran inside a cloud sandbox container, so `http://localhost:8080` in your Windows browser could never reach it. To use `http://localhost:8080` on your PC, the Docker stack has to be running **on your PC**. That is what this guide does.

Verified in the sandbox (Linux, Docker): the same `docker compose` file, ports, health endpoint, seed script and login flow. **Not verified on Windows**: the sandbox has no PowerShell or Windows, so the PowerShell commands below were written from the verified Linux steps and have not been executed on a PC. If any step behaves differently, see Troubleshooting.

## 1. Prerequisites

| Need | Notes |
|---|---|
| Windows 10/11 64-bit | with virtualization enabled in BIOS/UEFI |
| [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) | WSL 2 backend (default). Must be **running** (whale icon in the tray says "Engine running") |
| [Git for Windows](https://git-scm.com/download/win) | to clone the repository |
| Windows PowerShell 5.1 or PowerShell 7 | the commands work in both |
| Free TCP port **8080** | change it in step 4 if it is taken |
| GitHub access to the repository | if it is private, Git will open a sign-in window |

Node.js is **not** needed on your PC; the containers build everything.

## 2. Clone the repository and check out the verified branch

```powershell
cd $HOME
git clone --branch claude/compassionate-bardeen-9zxrjv --single-branch https://github.com/d4deepak-2005/Career-buddies-website.git
cd Career-buddies-website\CB-Founder-Ledger
git log -1 --oneline
```

The last line should show commit `a1ed893` (or a later commit on the same branch). Stay in `CB-Founder-Ledger` for every command below.

## 3. Create `.env` (secrets are generated on your PC, never committed)

`.env` is git-ignored. This block creates it with fresh random secrets and prints the admin password once. **These values are for your local test stack only; do not reuse them anywhere else.**

```powershell
function New-Secret([int]$bytes) {
  $b = New-Object byte[] $bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  ([Convert]::ToBase64String($b)) -replace '[+/=]', ''
}
$jwt        = New-Secret 48
$mongoPass  = New-Secret 24
$adminPass  = New-Secret 15          # >= 12 characters is required
$adminEmail = 'admin@careerbuddies.test'

@"
NODE_ENV=development
COOKIE_SECURE=false
JWT_ACCESS_SECRET=$jwt
MONGO_ROOT_USERNAME=cbroot
MONGO_ROOT_PASSWORD=$mongoPass
SEED_ADMIN_EMAIL=$adminEmail
SEED_ADMIN_PASSWORD=$adminPass
SEED_ADMIN_NAME=Local Admin
WEB_PORT=8080
CLIENT_ORIGIN=http://localhost:8080
ALLOWED_ORIGINS=http://127.0.0.1:8080
"@ | Set-Content -Path .env -Encoding ascii

Write-Host "Login email:    $adminEmail"
Write-Host "Login password: $adminPass     (also stored in .env)"
```

(`-Encoding ascii` matters: Windows PowerShell 5.1's default would add a byte-order mark that breaks the first line of `.env`.)

### Environment variables

| Variable | Required | Meaning |
|---|---|---|
| `JWT_ACCESS_SECRET` | **yes** | random, 32+ characters; signs sessions. Compose refuses to start without it |
| `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` | **yes** | credentials of the MongoDB container (not published to the host). Set once; changing the password later does not change an existing database volume |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | **yes** (for the seed step) | first admin; password 12–128 characters. `SEED_ADMIN_NAME` is optional |
| `NODE_ENV` | yes for HTTP | `development` — in `production` the API refuses insecure cookies |
| `COOKIE_SECURE` | yes for HTTP | `false` for `http://localhost`; must be `true` behind HTTPS |
| `CLIENT_ORIGIN` | yes | **exactly** the address you type in the browser (scheme + host + port). State-changing requests from any other origin get `403 BAD_ORIGIN` |
| `ALLOWED_ORIGINS` | optional | extra comma-separated origins, e.g. `http://127.0.0.1:8080` so that address also works |
| `WEB_PORT` | optional | host port for the web app (default 8080) |

Other settings (token lifetimes, rate limits, currency `INR`, receipt size) have safe defaults; see `.env.example`.

## 4. Start the stack

```powershell
docker compose --env-file .env -f docker/docker-compose.yml up --build -d
```

The first build downloads images and compiles the app (a few minutes). Port mapping: the **client** container publishes `0.0.0.0:${WEB_PORT:-8080}` → container port 80 (nginx, which also proxies `/api/` to the API); the **server** (4000) and **MongoDB** (27017) are *not* published to your PC. Wait until all three are healthy:

```powershell
docker compose --env-file .env -f docker/docker-compose.yml ps
```

Expected: `client`, `server` and `mongo` all `Up ... (healthy)`. If one says `starting`, wait 30 s and run it again.

## 5. Create the admin account

```powershell
docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/seedAdmin.js
```

Expected output: `Admin admin@careerbuddies.test created.` (running it again just says it already exists).

## 6. Verify

Health endpoint (served by the API through the same port):

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Expected: `status : ok` and `db : connected`.

Then open **http://localhost:8080** in your browser, sign in with the email and password printed in step 3, and the **Dashboard** opens. (`http://127.0.0.1:8080` also works because of `ALLOWED_ORIGINS`.)

**The database is empty on purpose**, so the Dashboard shows ₹0.00 and "No transactions …" messages. That is correct. Add founders and categories under **Settings**, then transactions under **Add Transaction**. New transactions are *Pending approval*, and the approval workflow does not exist yet (a later phase), so the Dashboard will not count them. For **local testing only** you can approve all pending transactions directly in the database:

```powershell
$u = (Select-String -Path .env -Pattern '^MONGO_ROOT_USERNAME=').Line.Split('=',2)[1]
$p = (Select-String -Path .env -Pattern '^MONGO_ROOT_PASSWORD=').Line.Split('=',2)[1]
docker compose --env-file .env -f docker/docker-compose.yml exec -T mongo mongosh --quiet -u $u -p $p --authenticationDatabase admin cb_founder_ledger --eval "db.transactions.updateMany({status:'pending_approval'},{`$set:{status:'approved'}}).modifiedCount"
```

Refresh the Dashboard. Do not use this on real data: it bypasses approval.

## 7. Everyday commands

```powershell
docker compose --env-file .env -f docker/docker-compose.yml logs -f server   # follow API logs (Ctrl+C to stop following)
docker compose --env-file .env -f docker/docker-compose.yml stop             # stop, keep data
docker compose --env-file .env -f docker/docker-compose.yml start            # start again
docker compose --env-file .env -f docker/docker-compose.yml up -d            # re-create after editing .env
docker compose --env-file .env -f docker/docker-compose.yml down             # remove containers, KEEP data
docker compose --env-file .env -f docker/docker-compose.yml down -v          # remove containers AND DELETE the database
```

After editing `.env`, use `up -d` (restart alone does not re-read it).

## 8. Troubleshooting

**Docker Desktop is not running** — errors such as `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` or `Cannot connect to the Docker daemon`. Start *Docker Desktop*, wait for "Engine running", check with `docker version` (both Client and Server sections must print). If it will not start: enable virtualization in BIOS, run `wsl --update` and `wsl --status`, restart the PC.

**Port 8080 is in use** — `Bind for 0.0.0.0:8080 failed: port is already allocated`. Find the owner:
```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen | ForEach-Object { Get-Process -Id $_.OwningProcess }
```
Either stop that program or use another port, e.g. 8081. Edit `.env`: `WEB_PORT=8081`, `CLIENT_ORIGIN=http://localhost:8081`, `ALLOWED_ORIGINS=http://127.0.0.1:8081`, then `docker compose --env-file .env -f docker/docker-compose.yml up -d` and open `http://localhost:8081`. The origin must match the new port, otherwise login fails (see below).

**MongoDB connection errors / server unhealthy** — look at the logs: `docker compose --env-file .env -f docker/docker-compose.yml logs mongo server`.
* `Authentication failed`: `.env` now has a different `MONGO_ROOT_PASSWORD` than the one the database volume was created with. Either put the old password back, or reset the database (**deletes its data**): `docker compose ... down -v` then `up --build -d` and seed again.
* `set MONGO_ROOT_PASSWORD in .env` / `set JWT_ACCESS_SECRET in .env`: `.env` is missing, empty, or you are not in the `CB-Founder-Ledger` folder. Check `Get-Content .env` and your current directory.
* `JWT_ACCESS_SECRET must be at least 32 characters`: regenerate it with step 3.
* The server restarts in a loop right after `up`: MongoDB is still starting; give it a minute, then `ps` again.

**Login fails / "Request origin not allowed" (`403 BAD_ORIGIN`)** — the address in the browser must equal `CLIENT_ORIGIN` or be listed in `ALLOWED_ORIGINS` (scheme, host and port all count; `localhost` and `127.0.0.1` are different origins). Fix `.env`, then `up -d`.
* *Invalid email or password*: use the values from step 3 (`Select-String -Path .env -Pattern '^SEED_ADMIN'`). Changing `SEED_ADMIN_PASSWORD` later does not change an existing admin; reset with `down -v`, or create another admin through the API as an admin.
* *Login works but you are sent back to the login page*: `COOKIE_SECURE` must be `false` and `NODE_ENV=development` for plain `http://`.
* *Too many attempts / 429*: login is rate limited (10 per 15 minutes per address). Wait, or `docker compose ... restart server`.
* A few `401` lines in the browser console before you sign in (and after you sign out) are normal.

**Build fails with certificate / network errors** — a corporate proxy re-signing TLS: set `NODE_IMAGE=<a Node 22 image that trusts your CA>` in `.env`, or build from a network without the proxy. Docker Hub rate limits (`429`) clear after a few minutes.

**Git clone asks for credentials or says repository not found** — the repository may be private; sign in with the GitHub account that has access (Git Credential Manager opens a window), or ask the owner for access.

## 9. Public testing alternative

I do not have a genuine way to publish this application: the cloud sandbox has no inbound network exposure, no tunnel tooling and no hosting credentials, so I have **not** deployed anything and there is **no public URL** (none is claimed here). The supported way to test is the local stack above. Options if you later want a shareable URL: deploy the same Docker Compose stack to a server or VM you control behind HTTPS (set `NODE_ENV=production`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://<your-domain>`), or, if your Claude session is linked to your PC, ask for the stack to be started there. Never expose MongoDB, and never reuse the throw-away credentials from this guide on a shared server.
