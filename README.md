## AutonomyAI E2E (Playwright + TypeScript)

This repo contains **end-to-end UI tests** for the AutonomyAI application.

### Prereqs

- Node.js 18+ (recommended: 20+)

### Setup

```bash
npm install
npx playwright install
```

### Configure the target app URL

By default, tests run against `http://localhost:3000`.

- **Windows (PowerShell)**:

```powershell
$env:BASE_URL="https://your-autonomyai-url"
npm test
```

- **macOS/Linux**:

```bash
BASE_URL="https://your-autonomyai-url" npm test
```

### Run tests

```bash
npm test
```

### Useful commands

```bash
npm run test:ui
npm run test:headed
npm run test:debug
npm run report
```

