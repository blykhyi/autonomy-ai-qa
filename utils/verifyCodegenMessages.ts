import { testConfig } from './testConfig';
import { verifyWithOpenAI } from './llm/openai';

export function defaultExpectationsFromPrompt(): string[] {
  // Keep these aligned with the initial prompt intent.
  return [
    'Pagination is implemented (not just mentioned).',
    'Page size is 6 cards per page.',
    'User can navigate via Previous/Next controls.',
    'User can jump via page numbers.',
    'There is some visual indicator of the active page.',
  ];
}

export async function verifyCodegenMessages(params: {
  messagesText: string;
  prompt?: string;
  expectations?: string[];
}) {
  return verifyWithOpenAI({
    messagesText: params.messagesText,
    prompt: params.prompt ?? testConfig.prompt,
    expectations: params.expectations ?? defaultExpectationsFromPrompt(),
  });
}

