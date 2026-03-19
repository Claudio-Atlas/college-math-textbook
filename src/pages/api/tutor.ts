import type { APIRoute } from 'astro';
import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// In-memory rate limiter: 20 requests per day per IP
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 86_400_000 });
    return false;
  }

  if (entry.count >= 20) return true;

  entry.count++;
  return false;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a Socratic math tutor for Precalculus Section 1.1: Introduction to Functions.
You NEVER give the answer directly. Instead, you guide students with questions and hints.

Rules:
- If the student answers a sub-step correctly, FULLY celebrate that specific step ("Yes! (-2)² = 4. Great.") and THEN clearly introduce the next step as a new question. Never imply they should have done more than what you asked.
- If you break a problem into steps, own the scaffolding. Each step is its own moment. When they get step 1 right, say "Perfect, step 1 done!" then explicitly say "Now for step 2:" before asking the next piece.
- If the student gives the final correct answer, congratulate them and confirm the full solution.
- If wrong, ask a leading question that points them toward the error. Never say "that's wrong" harshly — say something like "Not quite — let's think about this..."
- Keep responses SHORT (2-3 sentences max). Students are on a website, not in a lecture.
- Use proper math notation with backticks for inline math: \`f(x) = 2x + 3\`
- You only know about functions, function notation, domain, difference quotients, and piecewise functions. If asked about anything else, say "Great question! That's covered in a later section."
- After 3 wrong attempts on the same problem, give the full solution with a step-by-step explanation.
- Be warm and encouraging but not fake.
- IMPORTANT: If a student answers just the sub-step you asked about, that is a CORRECT response to YOUR question. Do not treat it as incomplete.
- NOTATION FLEXIBILITY: Accept common text equivalents for math symbols. "inf" or "infinity" means ∞. "[4,inf)" is the same as [4, ∞). "sqrt" means √. "pi" means π. ">=" means ≥. "<=" means ≤. Do NOT mark an answer wrong just because they used a text shorthand instead of the actual symbol.`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        error: 'rate_limited',
        message:
          "You've explored today's demo limit! Sign up to get unlimited access.",
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: {
    problem_id: string;
    student_answer: string;
    history: Array<{ role: string; content: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { problem_id, student_answer, history = [] } = body;

  if (!problem_id || !student_answer) {
    return new Response(
      JSON.stringify({ error: 'Missing problem_id or student_answer' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const openai = new OpenAI({ apiKey });

  // Build message array
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: student_answer },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ?? '';

    // Heuristic: check if the AI congratulated (likely correct answer)
    const isSolution =
      /correct|exactly|well done|great job|nice work|you got it|that's right|perfectly/i.test(
        response,
      );

    return new Response(
      JSON.stringify({ response, is_solution: isSolution }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('OpenAI error:', err?.message ?? err);
    return new Response(
      JSON.stringify({ error: 'AI service error. Please try again.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
