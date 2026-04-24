import { testConfig } from '../utils/testConfig';
import { test, expect } from './fixtures/authed';
import { verifyCodegenMessages } from '../utils/verifyCodegenMessages';

test('select project, run codegen prompt, wait for completion', async ({ studio, authedPage }) => {
  test.setTimeout(15 * 60 * 1000);

  await studio.selectProject(testConfig.projectName);
  await studio.waitForTaskComposer();
  await studio.submitPrompt(testConfig.prompt);
  await studio.waitForGenerationComplete();

  // Capture generated messages and persist as an artifact.
  const messagesText = await studio.getCodegenMessagesText();
  await test.info().attach('codegen-messages.txt', {
    body: messagesText,
    contentType: 'text/plain',
  });

  const verify = await verifyCodegenMessages({ messagesText });
  await test.info().attach('codegen-messages-llm-verdict.json', {
    body: JSON.stringify(verify, null, 2),
    contentType: 'application/json',
  });

  expect(verify.pass, verify.rationale).toBeTruthy();

  await expect(authedPage.getByText(/\bpagination\b/i).first()).toBeVisible();
});

