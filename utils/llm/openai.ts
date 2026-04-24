type ChatMessage = { role: 'system' | 'user'; content: string };

export type LlmVerifyResult = {
  pass: boolean;
  rationale: string;
  extracted: {
    hasPagination: boolean;
    mentionsSixCards: boolean;
    mentionsPrevNext: boolean;
    mentionsPageNumbers: boolean;
  };
};

export async function verifyWithOpenAI(params: {
  messagesText: string;
  prompt: string;
  expectations: string[];
}): Promise<LlmVerifyResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = (process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini') as string;

  if (!apiKey) {
    return heuristicVerify(params);
  }

  const system: ChatMessage = {
    role: 'system',
    content:
      'You are a strict test oracle. Return JSON only, matching the provided schema exactly.',
  };

  const user: ChatMessage = {
    role: 'user',
    content: [
      'Validate whether the agent messages match expectations for the prompt.',
      '',
      `Prompt:\n${params.prompt}`,
      '',
      `Expectations:\n- ${params.expectations.join('\n- ')}`,
      '',
      `Agent messages:\n${params.messagesText}`,
      '',
      'Return JSON with shape:',
      '{ "pass": boolean, "rationale": string, "extracted": { "hasPagination": boolean, "mentionsSixCards": boolean, "mentionsPrevNext": boolean, "mentionsPageNumbers": boolean } }',
      '',
      'Rules:',
      '- pass=true only if expectations are clearly supported by the messages.',
      '- extracted flags should be grounded in explicit mention, not guesses.',
    ].join('\n'),
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [system, user],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}\n${body}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('OpenAI response missing JSON content.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`OpenAI returned non-JSON content: ${content.slice(0, 500)}`);
  }

  return parsed as LlmVerifyResult;
}

export function heuristicVerify(params: {
  messagesText: string;
  prompt: string;
  expectations: string[];
}): LlmVerifyResult {
  const t = params.messagesText.toLowerCase();
  const extracted = {
    hasPagination: /\bpaginat/.test(t),
    mentionsSixCards: /\b6\b/.test(t) && /\bcards?\b/.test(t),
    mentionsPrevNext: /\bprevious\b/.test(t) || /\bnext\b/.test(t),
    mentionsPageNumbers:
      /\bpage numbers?\b/.test(t) ||
      /\bpage number\b/.test(t) ||
      /\bnumbered page buttons?\b/.test(t) ||
      /\bpage buttons?\b/.test(t),
  };

  const pass =
    extracted.hasPagination &&
    extracted.mentionsSixCards &&
    extracted.mentionsPrevNext &&
    extracted.mentionsPageNumbers;

  return {
    pass,
    rationale: pass
      ? 'Heuristic check passed (pagination + 6 cards + prev/next + page numbers found).'
      : 'Heuristic check failed; one or more expected concepts not found explicitly.',
    extracted,
  };
}

