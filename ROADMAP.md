## Test Automation Roadmap (Autonomy AI Studio)

This document outlines a pragmatic, scalable test automation strategy for an AI-powered product like Autonomy AI Studio (auth, projects, prompt-to-codegen workflows, and collaboration/review).

### 1) Test pyramid (unit → integration → e2e)

- **Unit (largest share, ~60–70%)**
  - **Goal**: Fast feedback on deterministic logic.
  - **Scope**: UI components (rendering, validation, formatting), state management, reducers/stores, prompt building, request/response parsing, feature flags, permissions/roles, routing guards, utility libraries.
  - **Why**: Keeps most test coverage cheap, stable, and quick in CI.

- **Integration / contract (mid share, ~20–30%)**
  - **Goal**: Verify boundaries between systems are correct.
  - **Scope**:
    - API contract tests (client ↔ backend) with schema validation.
    - “Agent orchestration” flows with **mocked model responses** (deterministic fixtures) to validate: job lifecycle, retries, streaming, error mapping, telemetry, persistence.
    - Auth/session integration (token refresh, SSO callback handling) using test doubles where possible.
  - **Why**: Catches most regressions without full browser flakiness or long runtimes.

- **E2E UI (smallest share, ~5–10%)**
  - **Goal**: Validate critical user journeys end-to-end in a real browser.
  - **Scope**: A curated suite of **high-value smoke/regression** scenarios that cover the product’s unique value: prompt → agent work → codegen → review → share/ship.
  - **Why**: Essential for confidence, but should remain minimal and high-signal.

### 2) What to automate first (highest ROI flows)

Prioritize flows that are both **business-critical** and **regression-prone**:

- **Authentication & session reliability**
  - Email/password + SSO paths, session persistence, logout, and “expired session → recover” behavior.
  - Reason: a single auth regression blocks all users and all tests.

- **Project selection & workspace navigation**
  - Open project picker, switch projects, preserve state, handle missing permissions.
  - Reason: navigation issues create widespread breakage and high support impact.

- **Core “Generate a task” workflow**
  - Prompt submission, job lifecycle, streaming/updates, completion, and “ready” state (e.g., share/deploy action available).
  - Reason: this is the product’s primary value path and the most frequently changing surface.

- **Review + iteration loop**
  - Read generated messages, apply a follow-up change request, ensure the next run completes and updates artifacts.
  - Reason: iterative refinement is the typical real user pattern.

- **Failure modes**
  - Timeouts, rate limits, model errors, network interruptions, and graceful recovery (retry/cancel).
  - Reason: production quality for AI products is largely defined by resilience.

Start with a **thin vertical slice** (login → select a known project → run a prompt → verify completion), then add targeted assertions and negative cases.

### 3) CI/CD integration (PR checks, nightly, release gates)

- **PR checks (fast, deterministic)**
  - Run: unit + integration/contract tests, lint/typecheck.
  - E2E: a very small **smoke** subset (or mocked-model E2E) that finishes in minutes.
  - Strategy: fail fast; keep PR feedback < 10 minutes where possible.

- **Nightly (broad, realistic)**
  - Run: full integration suite + expanded E2E against a stable staging environment.
  - Include: cross-browser (at least Chromium + one additional), longer timeouts, artifact retention (traces, screenshots, videos, extracted “agent messages”).
  - Use scheduled runs to catch environmental drift and slow-burn regressions.

- **Release gates (high confidence)**
  - Run: full E2E regression + key performance checks (page load budgets, job completion time percentiles).
  - Add: canary run on production-like infra, and require clean runs before promoting.

Operationally:
- Quarantine flaky tests with a tracked “flake budget” and an owner.
- Maintain stable test data/projects; auto-reset the environment when possible.
- Always upload artifacts for failed E2E runs to reduce triage time.

### 4) Challenges (AI nondeterminism) and how to handle it

AI-powered flows are uniquely hard because:
- **Outputs vary** (wording, ordering, partial results) even for the same prompt.
- **Latency varies** and long-running jobs can time out.
- **Model/backend changes** can shift behavior without a traditional “code diff.”

Recommended approach:
- **Assert on invariants, not exact text**
  - Prefer UI state transitions (job “ready” actions), presence of structured artifacts, and key concepts (e.g., “pagination”, “6 cards/page”, “prev/next”, “page numbers”).
- **Introduce evaluation layers**
  - Use deterministic heuristics as a baseline, and optionally an LLM-as-judge (with strict JSON output) for richer semantic validation.
  - Keep LLM verification **optional** in CI (gated by API key) and treat it as a “signal,” not the sole gate, until calibrated.
- **Control variability where possible**
  - Fixed test projects/data, pinned model versions, seeded generation (if supported), and mocked model responses in integration tests.
- **Build for observability**
  - Capture run artifacts: agent messages, steps, traces, request logs, and job IDs for replay/debugging.
- **Set realistic timeouts + retries**
  - Retries should be for infrastructure flake, not product correctness; record retry counts as a stability metric.

---

**Next milestones**
- Establish a stable test account + staging project data set.
- Expand E2E suite to cover iteration loop + failure modes.
- Add contract tests for agent job lifecycle and API schemas.
- Track reliability: flake rate, mean time to triage, and nightly pass rate.

