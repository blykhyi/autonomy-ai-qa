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

By default, tests run against `https://studio.autonomyai.io`.

Create a local env file (not committed):

```bash
copy .env.example .env
```

- **Windows (PowerShell)**:

```powershell
$env:BASE_URL="https://studio.autonomyai.io"
$env:TEST_USER_NAME="you@example.com"
$env:TEST_USER_PASSWORD="your-password"
npm test
```

- **macOS/Linux**:

```bash
BASE_URL="https://studio.autonomyai.io" TEST_USER_NAME="you@example.com" TEST_USER_PASSWORD="your-password" npm test
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

