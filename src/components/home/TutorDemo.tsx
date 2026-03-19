/**
 * TutorDemo — Interactive AI tutor demo for the Meridian homepage.
 * Socratic tutoring powered by GPT-4o-mini via /api/tutor.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------
interface Problem {
  id: string;
  label: string;
  prompt: string;
  context: string; // sent to AI for grading context
}

const PROBLEMS: Problem[] = [
  {
    id: 'eval-f-neg2',
    label: 'Evaluate f(−2)',
    prompt: 'Given f(x) = 3x² − 2x + 1, evaluate f(−2).',
    context:
      `The problem is: Given f(x) = 3x² − 2x + 1, evaluate f(−2).
The correct answer is 17.
Step-by-step: Substitute −2 for every x: 3(−2)² − 2(−2) + 1 = 3(4) − 2(−2) + 1 = 12 + 4 + 1 = 17.

Common wrong answers to watch for:
- 9 → Student computed −2² = −4 instead of (−2)² = 4. The exponent applies to the entire value including the negative sign because we're substituting (−2). Guide them: "What is (−2)²? Remember, you're squaring the entire value −2."
- 5 → Student likely did 3(4) − 2(2) + 1 = 12 − 4 + 1, dropping the negative on −2(−2). Guide them: "What is −2 times −2? Watch the signs."
- If student answers just a sub-step like "4" (for (−2)²), that is correct for that step — celebrate it.`,
  },
  {
    id: 'is-function',
    label: 'Is it a function?',
    prompt:
      'Determine whether the relation {(1, 3), (2, 5), (3, 3), (4, 7)} is a function. Explain why or why not.',
    context:
      `The problem is: Is {(1, 3), (2, 5), (3, 3), (4, 7)} a function?
The correct answer is YES — it IS a function.

Why: Each INPUT (first number in each pair: 1, 2, 3, 4) maps to exactly one output. No input appears twice with different outputs.

CRITICAL MISCONCEPTION to watch for:
- Student says "No, because 3 appears twice" → They are confusing inputs with outputs! The number 3 appears as an OUTPUT in (1,3) and as an INPUT in (3,3). Two different inputs CAN map to the same output — that's perfectly fine. What would NOT be a function is if the same INPUT appeared with different outputs, like (1,3) and (1,5). Guide them: "Look at the first number in each pair — those are the inputs. Does any input appear more than once?"
- Student says "yes" without explanation → Ask them to explain WHY. They need to demonstrate understanding, not just guess.
- Accept variations like: "yes because each x has one y", "yes, no repeated x-values", "yes, passes vertical line test" — all valid.`,
  },
  {
    id: 'domain-sqrt',
    label: 'Find the domain',
    prompt:
      'Find the domain of g(x) = √(x − 4). Write your answer in interval notation.',
    context:
      `The problem is: Find the domain of g(x) = √(x − 4).
The correct answer is [4, ∞) in interval notation.

Step-by-step: The expression under the square root must be ≥ 0. So x − 4 ≥ 0, which gives x ≥ 4. In interval notation: [4, ∞).

Common wrong answers to watch for:
- (4, ∞) with open bracket → Student forgot that x = 4 IS valid (√0 = 0 is defined). Guide: "What happens when x = 4? Is √(4−4) = √0 defined?"
- (−∞, 4] → Student reversed the inequality. Guide: "If x = 0, what's under the square root? Is √(−4) a real number?"
- "x ≥ 4" → This is mathematically correct but not in interval notation as requested. Say: "That's the right inequality! Now can you write it in interval notation? Hint: use brackets and ∞."
- [4, inf) or [4, infinity) → ACCEPT THIS AS CORRECT. Text equivalents for ∞ are fine.
- {x | x ≥ 4} → Set-builder notation. Accept as correct understanding but ask: "That's correct in set-builder notation! Can you also write it in interval notation?"`,
  },
];

// ---------------------------------------------------------------------------
// Chat message type
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ---------------------------------------------------------------------------
// Math rendering helper: convert backtick-wrapped math to styled <code>
// ---------------------------------------------------------------------------
function renderMathText(text: string): React.ReactNode[] {
  // Split on backtick-delimited segments
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        style={{
          fontFamily: "'Cambria Math', 'Latin Modern Math', 'STIX Two Math', serif",
          background: 'rgba(139, 92, 246, 0.12)',
          padding: '0.1em 0.35em',
          borderRadius: '4px',
          fontSize: '0.95em',
          whiteSpace: 'nowrap',
        }}
      >
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TutorDemo() {
  const [activeProblem, setActiveProblem] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const problem = PROBLEMS[activeProblem];

  // Scroll chat container to bottom on new messages (without jumping the page)
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Reset when switching problems
  const switchProblem = useCallback((idx: number) => {
    setActiveProblem(idx);
    setMessages([]);
    setInput('');
    setAttempts(0);
    setSolved(false);
    setLoading(false);
  }, []);

  // Send message
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || rateLimited || solved) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      // Build history for API (include problem context in first user message)
      const apiHistory = updatedHistory.map((m, i) => {
        if (i === 0 && m.role === 'user') {
          return {
            role: m.role,
            content: `[Problem context: ${problem.context}]\n\nStudent's answer: ${m.content}`,
          };
        }
        return { role: m.role, content: m.content };
      });

      // If this is the first message, wrap with context
      const body = {
        problem_id: problem.id,
        student_answer:
          updatedHistory.length === 1
            ? `[Problem context: ${problem.context}] [Attempt ${newAttempts}/3]\n\nStudent's answer: ${text}`
            : `[Attempt ${newAttempts}/3]\n\nStudent's answer: ${text}`,
        history:
          updatedHistory.length === 1
            ? []
            : apiHistory.slice(0, -1), // all except the latest user msg
      };

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong — please try again.' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
        if (data.is_solution) {
          setSolved(true);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — please try again.' },
      ]);
    } finally {
      setLoading(false);
      // Re-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, rateLimited, solved, attempts, messages, problem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <section id="demo" style={{ background: 'var(--ax-bg)', padding: '5rem 1.5rem' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: 'var(--ax-text)' }}
          >
            Try the AI Tutor
          </h2>
          <p className="text-lg" style={{ color: 'var(--ax-text-secondary)' }}>
            See how our Socratic AI guides students through real Precalculus problems.
          </p>
        </div>

        {/* Problem switcher pills */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {PROBLEMS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => switchProblem(i)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background:
                  i === activeProblem
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'transparent',
                border:
                  i === activeProblem
                    ? '1px solid rgba(139, 92, 246, 0.5)'
                    : '1px solid var(--ax-border)',
                color:
                  i === activeProblem
                    ? 'var(--ax-text)'
                    : 'var(--ax-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main layout: problem + chat */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
          }}
          className="lg:grid-cols-[380px_1fr]"
        >
          {/* Problem Card */}
          <div
            style={{
              background: 'var(--ax-surface)',
              border: '1px solid var(--ax-border)',
              borderRadius: 'var(--ax-card-radius)',
              padding: '2rem',
              alignSelf: 'start',
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--ax-violet)' }}
            >
              Section 1.1 · Introduction to Functions
            </div>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'var(--ax-text)', fontFamily: "'Georgia', serif" }}
            >
              {renderMathText(problem.prompt)}
            </p>
            {attempts > 0 && (
              <div
                className="mt-4 text-xs"
                style={{ color: 'var(--ax-text-muted)' }}
              >
                {solved ? '✓ Solved' : `Attempt ${attempts}`}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div
            style={{
              background: 'var(--ax-surface)',
              border: '1px solid var(--ax-border)',
              borderRadius: 'var(--ax-card-radius)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '400px',
              maxHeight: '500px',
            }}
          >
            {/* Math symbol toolbar */}
            <div
              style={{
                borderBottom: '1px solid var(--ax-border)',
                padding: '0.4rem 1rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
              }}
            >
              {['∞', '√', 'π', '≥', '≤', '≠', '±', '²', '³', '∈', '∪', '∩', '[', ']', '(', ')'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setInput((prev) => prev + sym);
                    inputRef.current?.focus();
                  }}
                  className="transition-all"
                  style={{
                    background: 'var(--ax-elevated)',
                    border: '1px solid var(--ax-border)',
                    borderRadius: '6px',
                    color: 'var(--ax-text-secondary)',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    minWidth: '2rem',
                    textAlign: 'center',
                    fontFamily: "'Cambria Math', 'Latin Modern Math', serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.color = 'var(--ax-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ax-border)';
                    e.currentTarget.style.color = 'var(--ax-text-secondary)';
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div
              style={{
                borderBottom: '1px solid var(--ax-border)',
                padding: '0.75rem 1rem',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  rateLimited
                    ? 'Demo limit reached'
                    : solved
                      ? 'Problem solved! Try another →'
                      : 'Type your answer…'
                }
                disabled={loading || rateLimited || solved}
                className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                style={{
                  background: 'var(--ax-elevated)',
                  border: '1px solid var(--ax-border)',
                  color: 'var(--ax-text)',
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim() || rateLimited || solved}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    loading || !input.trim() || rateLimited || solved
                      ? 'rgba(139, 92, 246, 0.1)'
                      : '#8B5CF6',
                  color:
                    loading || !input.trim() || rateLimited || solved
                      ? 'var(--ax-text-muted)'
                      : '#fff',
                  cursor:
                    loading || !input.trim() || rateLimited || solved
                      ? 'not-allowed'
                      : 'pointer',
                  border: 'none',
                }}
              >
                Send
              </button>
            </div>

            {/* Messages area — below input */}
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
              }}
            >
              {messages.length === 0 && !rateLimited && (
                <div
                  className="text-sm text-center"
                  style={{
                    color: 'var(--ax-text-muted)',
                    paddingTop: '3rem',
                  }}
                >
                  Type your answer below to get started.
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      background:
                        msg.role === 'user'
                          ? 'rgba(139, 92, 246, 0.2)'
                          : 'var(--ax-elevated)',
                      border:
                        msg.role === 'user'
                          ? '1px solid rgba(139, 92, 246, 0.35)'
                          : '1px solid var(--ax-border)',
                      color: 'var(--ax-text)',
                      borderBottomRightRadius:
                        msg.role === 'user' ? '4px' : '12px',
                      borderBottomLeftRadius:
                        msg.role === 'assistant' ? '4px' : '12px',
                    }}
                  >
                    {renderMathText(msg.content)}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      borderBottomLeftRadius: '4px',
                      background: 'var(--ax-elevated)',
                      border: '1px solid var(--ax-border)',
                      color: 'var(--ax-text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span className="tutor-dots">
                      <span>•</span><span>•</span><span>•</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Rate limit message */}
              {rateLimited && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: 'var(--ax-text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <p style={{ marginBottom: '0.5rem' }}>
                    You've explored today's demo limit!
                  </p>
                  <a
                    href="mailto:contact@onyxenterprises.org"
                    style={{
                      color: '#8B5CF6',
                      textDecoration: 'underline',
                    }}
                  >
                    Sign up to get unlimited access →
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Loading dots animation */}
      <style>{`
        .tutor-dots span {
          animation: tutorBounce 1.4s ease-in-out infinite;
          display: inline-block;
          margin: 0 1px;
        }
        .tutor-dots span:nth-child(2) { animation-delay: 0.2s; }
        .tutor-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tutorBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-\\[380px_1fr\\] {
            grid-template-columns: 380px 1fr;
          }
        }
      `}</style>
    </section>
  );
}
