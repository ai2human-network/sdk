# AI2Human SDK

Official TypeScript and Python clients plus a deterministic local Mock Server for the AI2Human Agent API.

## Five-minute quickstart

### TypeScript

```bash
npm install @ai2human/sdk
```

```ts
import { AI2Human } from "@ai2human/sdk";

const client = new AI2Human({ apiKey: process.env.AI2HUMAN_API_KEY! });
const task = await client.tasks.create({
  title: "Reproduce a checkout error",
  description: "Open the target three times and submit screenshot-backed notes.",
  category: "digital_task",
  funding_mode: "test_no_payout",
  reward_usdc: 1,
  deadline_hours: 24,
  proof_requirements: ["screenshot", "timestamp", "notes"]
}, { idempotencyKey: "checkout-error-001" });
```

### Python

```bash
pip install ai2human
```

```python
from ai2human import AI2Human

client = AI2Human(api_key="...")
task = client.tasks.create({...}, idempotency_key="checkout-error-001")
```

## Local development

```bash
npm install
npm run dev:mock
```

The Mock Server listens on `http://127.0.0.1:8787` and implements deterministic task creation, categories, task status, and proof responses. It never sends payments or touches production.

## Packages

- `packages/typescript` — typed fetch client.
- `packages/python` — sync and async `httpx` clients.
- `packages/mock-server` — offline contract-compatible server.
- `fixtures` — shared request and response vectors used by every language.

Canonical API description: [`openapi.yaml`](openapi.yaml), mirrored from [`ai2human-network/protocol`](https://github.com/ai2human-network/protocol).
