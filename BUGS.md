## Bug / UX Report (Autonomy AI Studio)

### Issue 1: No password-set email when registering via email

- **Severity**: Major
- **Steps to Reproduce**:
  1. Go to the Studio login page.
  2. Click `Sign up`.
  3. Choose the “Sign up with an Email” path.
  4. Register a new account (email) using the custom email flow (i.e., not Google/GitHub).
  5. Check inbox (and spam/junk) for the password set / verification / onboarding link.
- **Expected vs Actual**:
  - **Expected**: User receives an email containing a verification and/or password set link promptly after registration.
  - **Actual**: No email arrives, blocking completion of sign-up (user cannot set password / proceed).

---

### Issue 2: Environment setup fails for some projects due to missing `DATABASE_URL`

- **Severity**: Major
- **Steps to Reproduce**:
  1. Open a project that requires an environment bootstrap (includes Prisma).
  2. Use the product’s “Set environment” / environment setup action.
  3. Wait for the workflow to run.
- **Expected vs Actual**:
  - **Expected**: Environment setup either (a) succeeds, or (b) presents a clear guided setup (e.g., prompts to provide required vars like `DATABASE_URL`), ideally with a one-click way to add missing env vars.
  - **Actual**: Setup fails after retries with a workflow error:
    - `v20.20.2 is already installed.`
    - `Prisma schema validation ... Error code: P1012`
    - `Environment variable not found: DATABASE_URL. --> schema.prisma:7 url = env("DATABASE_URL")`

---

### Issue 3: “Open in VS Code” from project settings redirects to 401 page

- **Severity**: Major
- **Steps to Reproduce**:
  1. Open any project in Autonomy AI Studio.
  2. Navigate to project settings.
  3. Click the action to open the project in VS Code.
  4. Observe the redirect/landing page.
- **Expected vs Actual**:
  - **Expected**: VS Code opens the project (or the user is guided through an authentication/authorization step that resolves access).
  - **Actual**: The flow redirects to `401 Authorization Required`, blocking the “open in VS Code” workflow.

