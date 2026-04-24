## Demo video script (5–7 minutes)

### Intro (0:00–0:30)
Hi, I’m going to walk through the Playwright + TypeScript E2E test suite I built for Autonomy AI Studio. I’ll cover how it’s structured, how I handle non-deterministic AI behavior, the key tradeoffs, what I’d improve with more time, and how I’d use AI to automate QA workflows. I’ll also call out which parts I used AI assistance for and what I wrote or verified myself.

---

## How the test suite is structured (0:30–2:00)
At a high level, the suite is organized around maintainability and speed.

- **Configuration and environment**
  - Test configuration lives in `utils/testConfig.ts` and reads env like `TEST_PROJECT_NAME` and `TEST_PROMPT`.
  - Environment variables are loaded via `dotenv` in `playwright.config.ts`.
  - Required secrets like `TEST_USER_NAME` and `TEST_USER_PASSWORD` are enforced through `utils/env.ts` so missing config fails fast with a clear error.

- **Page Object Model**
  - Page objects live under `tests/pages/`:
    - `LoginPage.ts` encapsulates login flow and stable selectors for email/password sign-in.
    - `StudioPage.ts` encapsulates post-login actions: selecting a project, submitting a prompt, waiting for completion, and extracting agent “Messages”.
  - The goal is to keep tests small and readable, while selectors and UI mechanics are centralized.

- **Fixtures for setup/teardown**
  - In `tests/fixtures/authed.ts`, fixtures manage authenticated state.
  - The fixture ensures a `storageState` exists and creates a fresh authenticated browser context per test, then closes it after the test.
  - This avoids re-logging-in on every test, while still isolating state across tests.

- **The E2E spec**
  - The main E2E is `tests/autonomyai-codegen.spec.ts`.
  - It covers the value path: select project → submit prompt → wait for completion → validate results and captured messages.

---

## Handling non-deterministic AI behavior (2:00–3:30)
AI systems are inherently variable, so the key is asserting on invariants, not exact strings.

- **Completion signal**
  - Instead of relying on a literal “Done” label, I assert on a stable completion signal: the “Send to Devs” button becoming visible.

- **Semantic validation**
  - I capture the agent’s generated “Messages” from the UI and attach them as a test artifact (`codegen-messages.txt`).
  - Then I verify those messages meet expectations derived from the prompt, e.g.:
    - pagination exists
    - 6 cards per page
    - prev/next navigation
    - page numbers / page buttons
    - active page indicator

- **Two-layer verifier**
  - Deterministic heuristic check (always available).
  - Optional LLM-as-judge via OpenAI API (enabled when `OPENAI_API_KEY` is set), constrained to strict JSON output.
  - The verdict is attached as `codegen-messages-llm-verdict.json`.

---

## Key decisions and tradeoffs (3:30–4:30)
- **Speed vs realism**: E2E is expensive, so I keep it focused on the highest-value path and push detail into page objects/helpers.
- **Strictness vs resilience**: Avoid brittle exact-text assertions; prefer invariants and semantic checks.
- **Auth approach**: Use fixtures + `storageState` caching for speed, but isolate per-test contexts for reliability.
- **LLM verification**: Useful for intent checking, but kept optional to avoid cost/variability until calibrated.

---

## What I’d improve with more time (4:30–5:30)
- Add `data-testid` on key UI elements (project picker, composer, status widgets, messages panel) to reduce locator fragility.
- Establish dedicated test workspace + seeded projects/test data.
- Expand coverage to iteration flows (“make changes”), failure modes (timeouts/quota errors), and collaboration/sharing.
- Add observability hooks (job IDs, request logs) to make failures easier to debug.
- Parallelize longer E2E flows for nightly runs.

---

## How I’d use AI to automate QA workflows (5:30–6:30)
- Generate draft test cases/scripts from user journeys and specs.
- Suggest more robust selectors and highlight where test IDs should be added.
- Triage flakes by summarizing traces/screenshots and clustering common failures.
- Add semantic assertions for intent validation when outputs are variable.
- Auto-draft structured bug reports from Playwright artifacts and logs.

---

## Where I used AI tools vs what I wrote/reviewed myself (6:30–7:00)
- **AI-assisted**
  - Drafting initial scaffolding, first-pass flow, and the verifier prompt/schema.
  - Iterating on resilient locators and message extraction based on observed screenshots.

- **Written/validated by me**
  - Final suite structure (fixtures, page objects, config layout).
  - Assertion strategy for nondeterminism (invariants + optional semantic validation).
  - CI workflow design and secrets/guardrails.
  - Running the suite end-to-end and tightening selectors/assertions based on actual UI behavior.

