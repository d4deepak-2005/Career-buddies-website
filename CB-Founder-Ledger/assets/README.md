# Brand and founder assets (you provide these files)

Place your real files here, then run the import (no rebuild needed):

```
CB-Founder-Ledger/assets/brand/careerbuddies-logo.png      (or .jpg / .webp)
CB-Founder-Ledger/assets/founders/nishant-sharma.jpg       (or .png / .webp)
CB-Founder-Ledger/assets/founders/deepak-sah.jpg
CB-Founder-Ledger/assets/founders/divyanshu-gautam.jpg
```

```powershell
docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/seedFounders.js
docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/importBrandAssets.js
```

* PNG, JPG/JPEG and WebP only; the real content is checked (not the file name); maximum size `IMAGE_MAX_BYTES` (default 2 MB).
* Portrait photos work best square (they are cropped to a circle/square with `object-fit: cover`).
* Alternatively upload them in the app: **Settings → Founders** (photograph) and **Settings → Branding** (logo). That needs no files here.
* Until you provide a photo, a neutral initials placeholder is shown. The existing official logo stays until you replace it.
* The folder contents are git-ignored (founder photographs are personal data); only this README is tracked.
