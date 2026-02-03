---
description: Jarvis Start - Start all backend services and open Admin in browser
---

# Jarvis Start 🤖

Hello sir! I am **Jarvis**, your personal AI assistant. When you say "Jarvis Start", I will:

1. Start all backend services for **PolarisAPI**
2. Start the frontend dev server for **AltairWeb**
3. Open the Admin panel in your browser

---

## Projects Overview

| Project        | Type            | URL                   |
| -------------- | --------------- | --------------------- |
| **PolarisAPI** | Laravel Backend | http://localhost:8000 |
| **AltairWeb**  | Vue.js Frontend | http://localhost:5173 |

---

## Startup Sequence

// turbo-all

### Step 1: Start PolarisAPI Backend

Run the following commands in separate terminals from `c:\Projects\PolarisAPI`:

1. Start the main Laravel server:

```bash
cd c:\Projects\PolarisAPI && php artisan serve --host=localhost
```

2. Start the Reverb WebSocket server for real-time features:

```bash
cd c:\Projects\PolarisAPI && php artisan reverb:start --debug
```

3. Start the queue worker for background jobs:

```bash
cd c:\Projects\PolarisAPI && php artisan queue:work --queue=default,data-stream
```

---

### Step 2: Start AltairWeb Frontend

Run from `c:\Projects\AltairWeb`:

```bash
cd c:\Projects\AltairWeb && npm run dev
```

---

### Step 3: Open Admin in Browser

1. Navigate to: **http://localhost:5173**
2. **If already logged in**: Click the **"Admin"** button to access the Admin panel
3. **If not logged in**: Login first using the test credentials below, then click the **"Admin"** button

---

## Test Credentials

For testing, use the seeded account:

- **Email**: account@gmail.com
- **Password**: account@gmail.com

---

_"At your service, sir."_ - Jarvis
