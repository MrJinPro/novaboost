# NovaBoost — деплой на одном сервере (с backend)

Цель: сайт (Vite static) и backend (FastAPI) на **одной машине** и **одном домене**.

Идея:
- фронт: статика `dist/`
- nginx: отдаёт `dist/` и проксирует `/v2/`, `/static/` и `/v2/ws` на backend `127.0.0.1:8000`
- фронт использует `VITE_BACKEND_BASE_URL=` (пусто), чтобы ходить на `/v2/...` своего домена

## 1) Сборка фронта

```bash
cd /srv/novaboost/novaboost
npm ci
npm run build
```

После этого появится папка `dist/`.

## 2) nginx конфиг

Скопируй `deploy/nginx-site.conf` в, например, `/etc/nginx/sites-available/novaboost` и замени:
- `server_name` на свой домен
- путь к `dist/`

Включи сайт:

```bash
sudo ln -s /etc/nginx/sites-available/novaboost /etc/nginx/sites-enabled/novaboost
sudo nginx -t
sudo systemctl reload nginx
```

## 3) HTTPS (Let’s Encrypt)

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

## 4) Backend на той же машине

Важно: backend должен слушать `127.0.0.1:8000` (или 0.0.0.0:8000).

Если backend уже задеплоен отдельно, просто проверь доступность:

```bash
curl -s http://127.0.0.1:8000/ | head
```

## 5) Проверка

- Открой сайт: `https://your-domain.example`
- В DevTools → Network убедись, что запросы уходят на `https://your-domain.example/v2/...` и получают 200/401 (но не CORS).
- WebSocket: `wss://your-domain.example/v2/ws?token=...`
