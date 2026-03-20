/**
 * TutorDemo — Interactive AI tutor demo for the Meridian homepage.
 * Client-side problem generation with 3 topic areas + AI chat via /api/tutor.
 *
 * Flow: idle → wrong1 (hint) → attempt 2 → wrong2 (solution + chat option) | correct
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Mulberry32 seeded RNG (deterministic, copied from Axiom Engine)
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let s = seed | 0;
  return {
    next(): number {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    intExcluding(min: number, max: number, exclude: number[]): number {
      let v: number;
      let guard = 0;
      do {
        v = this.int(min, max);
        guard++;
      } while (exclude.includes(v) && guard < 100);
      return v;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
  };
}

// ---------------------------------------------------------------------------
// Problem types & generation
// ---------------------------------------------------------------------------
type Topic = 'precalculus' | 'calculus' | 'statistics';
type ValidationMode = 'numeric' | 'expression';

interface GeneratedProblem {
  topic: Topic;
  questionText: string;
  correctAnswer: string;
  validation: ValidationMode;
  tolerance: number;
  solution: string;
  hint: string;
}

// ─── Display helpers ─────────────────────────────────────────────────
function signedTerm(coeff: number, variable: string, first = false): string {
  if (coeff === 0) return '';
  const abs = Math.abs(coeff);
  const sign = coeff > 0 ? (first ? '' : '+ ') : '- ';
  if (abs === 1) return `${sign}${variable}`;
  return `${sign}${abs}${variable}`;
}

function signedConst(n: number, first = false): string {
  if (n === 0) return '';
  if (first) return `${n}`;
  return n > 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
}

function poly(a: number, b: number, c: number): string {
  const parts: string[] = [];
  if (a !== 0) {
    if (a === 1) parts.push('x²');
    else if (a === -1) parts.push('-x²');
    else parts.push(`${a}x²`);
  }
  if (b !== 0) {
    if (parts.length === 0) {
      if (b === 1) parts.push('x');
      else if (b === -1) parts.push('-x');
      else parts.push(`${b}x`);
    } else {
      parts.push(signedTerm(b, 'x'));
    }
  }
  if (c !== 0) {
    if (parts.length === 0) parts.push(`${c}`);
    else parts.push(signedConst(c));
  }
  return parts.join(' ') || '0';
}

// ─── Problem generators ──────────────────────────────────────────────

function generatePrecalculus(seed: number): GeneratedProblem {
  const rng = mulberry32(seed);
  const a = rng.int(1, 5);
  const b = rng.intExcluding(-6, 6, [0]);
  const c = rng.int(-8, 8);
  const k = rng.pick([-3, -2, -1, 1, 2, 3, 4]);

  const fExpr = poly(a, b, c);
  const answer = a * k * k + b * k + c;
  const kShow = k < 0 ? `(${k})` : `${k}`;

  const aTermStr = `${a}(${kShow})²`;
  const bTermStr = b > 0 ? `+ ${b}(${kShow})` : `- ${Math.abs(b)}(${kShow})`;
  const cTermStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  const subExpr = `${aTermStr} ${bTermStr} ${cTermStr}`.trim();

  const step2Parts: string[] = [];
  const aVal = a * k * k;
  const bVal = b * k;
  step2Parts.push(`${aVal}`);
  step2Parts.push(bVal >= 0 ? `+ ${bVal}` : `- ${Math.abs(bVal)}`);
  if (c !== 0) step2Parts.push(c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`);

  const solution = [
    `Step 1: Substitute \`x = ${k}\` into \`f(x) = ${fExpr}\`.`,
    `Step 2: \`f(${k}) = ${subExpr}\``,
    `       = \`${step2Parts.join(' ')}\``,
    `       = \`${answer}\`.`,
  ].join('\n');

  return {
    topic: 'precalculus',
    questionText: `Given \`f(x) = ${fExpr}\`, find \`f(${k})\`.`,
    correctAnswer: `${answer}`,
    validation: 'numeric',
    tolerance: 0.01,
    solution,
    hint: 'Replace every `x` with the given number, then simplify — exponents first, then multiply, then add/subtract.',
  };
}

function generateCalculus(seed: number): GeneratedProblem {
  const rng = mulberry32(seed);
  const a = rng.intExcluding(2, 8, [0]);
  const n = rng.int(3, 5);
  const b = rng.intExcluding(-7, 7, [0]);
  const m = rng.int(1, 2);
  const c = rng.intExcluding(-12, 12, [0]);

  const xnStr = `x^${n}`;
  const xmStr = m === 1 ? 'x' : `x^${m}`;
  const fExpr = `${a}${xnStr} ${signedTerm(b, xmStr)} ${signedConst(c)}`.trim();

  const da = a * n;
  const dn = n - 1;
  const db = b * m;
  const dm = m - 1;

  const term1 = dn === 1 ? `${da}x` : `${da}x^${dn}`;
  let fpExpr: string;
  if (dm === 0) {
    fpExpr = `${term1} ${signedConst(db)}`.trim();
  } else {
    fpExpr = `${term1} ${signedTerm(db, 'x')}`.trim();
  }

  const solution = [
    `The power rule says: if \`f(x) = x^n\`, then \`f'(x) = nx^(n-1)\`.`,
    `Apply to each term:`,
    `Term 1: \`d/dx[${a}x^${n}] = ${a} · ${n} · x^${n - 1} = ${da}x^${dn}\``,
    m === 1
      ? `Term 2: \`d/dx[${b > 0 ? b : `(${b})`}x] = ${db}\``
      : `Term 2: \`d/dx[${b > 0 ? b : `(${b})`}x^${m}] = ${b} · ${m} · x^${m - 1} = ${db}${dm === 0 ? '' : 'x'}\``,
    `Term 3: \`d/dx[${c > 0 ? c : `(${c})`}] = 0\` (derivative of a constant is 0)`,
    `Therefore: \`f'(x) = ${fpExpr}\`.`,
  ].join('\n');

  return {
    topic: 'calculus',
    questionText: `Find the derivative of \`f(x) = ${fExpr}\`.`,
    correctAnswer: fpExpr,
    validation: 'expression',
    tolerance: 0.01,
    solution,
    hint: 'Apply the power rule to each term separately: bring down the exponent as a coefficient, then reduce the exponent by 1. The derivative of a constant is 0.',
  };
}

function generateStatistics(seed: number): GeneratedProblem {
  const rng = mulberry32(seed);
  const n = rng.pick([5, 6, 7]);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    values.push(rng.int(12, 98));
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const meanRounded = Math.round(mean * 100) / 100;

  const dataStr = values.join(', ');
  const sumStr = values.join(' + ');

  const solution = [
    `Step 1: Add all the values.`,
    `\`${sumStr} = ${sum}\``,
    `Step 2: Divide by the number of values (\`n = ${n}\`).`,
    `\`Mean = ${sum} / ${n} = ${meanRounded}\``,
  ].join('\n');

  return {
    topic: 'statistics',
    questionText: `Find the mean of the dataset: \`{${dataStr}}\`.`,
    correctAnswer: `${meanRounded}`,
    validation: 'numeric',
    tolerance: 0.1,
    solution,
    hint: 'The mean is the sum of all values divided by the number of values. Add them up first, then divide.',
  };
}

function generateProblem(topic: Topic, seed: number): GeneratedProblem {
  switch (topic) {
    case 'precalculus': return generatePrecalculus(seed);
    case 'calculus': return generateCalculus(seed);
    case 'statistics': return generateStatistics(seed);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function evaluateExpression(expr: string, x: number): number | null {
  let s = expr.replace(/\s+/g, '');
  s = s.replace(/−/g, '-');
  // Convert Unicode superscripts to caret notation
  s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5')
       .replace(/⁶/g, '^6').replace(/⁷/g, '^7').replace(/⁸/g, '^8').replace(/⁹/g, '^9');

  const terms: string[] = [];
  let current = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ((ch === '+' || ch === '-') && i > 0 && s[i - 1] !== '^') {
      if (current) terms.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) terms.push(current);

  let result = 0;
  for (const term of terms) {
    const m = term.match(/^([+-]?\d*\.?\d*)(x?)(?:\^(\d+))?$/);
    if (!m) return null;

    let coeff: number;
    const coeffStr = m[1];
    const hasX = m[2] === 'x';
    const pow = m[3] ? parseInt(m[3], 10) : (hasX ? 1 : 0);

    if (!coeffStr || coeffStr === '+') coeff = 1;
    else if (coeffStr === '-') coeff = -1;
    else coeff = parseFloat(coeffStr);

    if (isNaN(coeff)) return null;
    result += coeff * Math.pow(x, pow);
  }
  return result;
}

function validateAnswer(problem: GeneratedProblem, studentAnswer: string): boolean {
  const trimmed = studentAnswer.trim();
  if (!trimmed) return false;

  if (problem.validation === 'numeric') {
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) return false;
    const correct = parseFloat(problem.correctAnswer);
    return Math.abs(parsed - correct) < problem.tolerance;
  }

  const testPoints = [1, 2, 3];
  for (const x of testPoints) {
    const studentVal = evaluateExpression(trimmed, x);
    const correctVal = evaluateExpression(problem.correctAnswer, x);
    if (studentVal === null || correctVal === null) return false;
    if (Math.abs(studentVal - correctVal) > 0.01) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Chat message type
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Math rendering helper
// ---------------------------------------------------------------------------
function renderMathText(text: string): React.ReactNode[] {
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
// State machine: idle → wrong1 → (attempt2 via idle) → wrong2 → chatOpen
//                                                     → correct
// ---------------------------------------------------------------------------
type DemoState = 'idle' | 'wrong1' | 'wrong2' | 'correct' | 'chatOpen';

const TOPICS: { key: Topic; label: string; badge: string }[] = [
  { key: 'precalculus', label: 'Precalculus', badge: 'Section 1.1 · Introduction to Functions' },
  { key: 'calculus', label: 'Calculus', badge: 'Calculus · Power Rule' },
  { key: 'statistics', label: 'Statistics', badge: 'Statistics · Descriptive Statistics' },
];

const SYMBOLS = ['^', '/', '√', 'π', '∞', '±', '≥', '≤', '≠', '(', ')', '[', ']'];
const SYMBOL_LABELS: Record<string, string> = { '^': 'xⁿ', '/': 'a/b' };

// Live preview: convert typed math to pretty display
function prettyMath(raw: string): string {
  let s = raw;
  // Superscripts: x^3 → x³, x^12 → x¹²
  const superMap: Record<string, string> = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' };
  s = s.replace(/\^(\d+)/g, (_, digits: string) => digits.split('').map((d: string) => superMap[d] || d).join(''));
  s = s.replace(/\^([a-z])/g, (_, v: string) => { const m: Record<string,string> = { n:'ⁿ' }; return m[v] || `^${v}`; });
  // sqrt → √
  s = s.replace(/sqrt\(/g, '√(');
  // pi → π
  s = s.replace(/\bpi\b/g, 'π');
  // inf → ∞
  s = s.replace(/\binf(inity)?\b/g, '∞');
  return s;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TutorDemo() {
  const [topic, setTopic] = useState<Topic>('precalculus');
  const [seed, setSeed] = useState(() => Date.now());
  const [state, setState] = useState<DemoState>('idle');
  const [input, setInput] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const problem = generateProblem(topic, seed);
  const topicMeta = TOPICS.find((t) => t.key === topic)!;

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const switchTopic = useCallback((t: Topic) => {
    setTopic(t);
    setSeed(Date.now());
    setState('idle');
    setInput('');
    setAttemptCount(0);
    setChatInput('');
    setChatMessages([]);
  }, []);

  const tryAnother = useCallback(() => {
    setSeed(Date.now());
    setState('idle');
    setInput('');
    setAttemptCount(0);
    setChatInput('');
    setChatMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const submitAnswer = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (state === 'wrong2' || state === 'correct' || state === 'chatOpen') return;

    const isCorrect = validateAnswer(problem, trimmed);
    const attempt = attemptCount + 1;
    setAttemptCount(attempt);

    if (isCorrect) {
      setState('correct');
    } else if (attempt >= 2) {
      setState('wrong2');
    } else {
      setState('wrong1');
      setInput('');
    }
  }, [input, state, problem, attemptCount]);

  const openChat = useCallback(async () => {
    setState('chatOpen');

    // Auto-send a contextual first message
    const autoMsg: ChatMessage = {
      role: 'user',
      content: "I've seen the solution but I'm still confused about the approach. Can you walk me through the thinking?",
    };
    setChatMessages([autoMsg]);
    setChatLoading(true);

    try {
      const contextPrefix = `[Problem context: The problem is: ${problem.questionText.replace(/`/g, '')}. The correct answer is ${problem.correctAnswer}. Solution: ${problem.solution}. Hint: ${problem.hint}]`;

      const body = {
        problem_id: 'eval-f-neg2',
        student_answer: `${contextPrefix}\n\nStudent's message: ${autoMsg.content}`,
        history: [],
      };

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setChatLoading(false);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong — please try again.' },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — please try again.' },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [problem]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || rateLimited) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput('');
    setChatLoading(true);

    try {
      const contextPrefix = `[Problem context: The problem is: ${problem.questionText.replace(/`/g, '')}. The correct answer is ${problem.correctAnswer}. Hint: ${problem.hint}]`;

      const body = {
        problem_id: 'eval-f-neg2',
        student_answer:
          updated.length === 1
            ? `${contextPrefix}\n\nStudent's message: ${text}`
            : `Student's message: ${text}`,
        history:
          updated.length === 1
            ? []
            : updated.slice(0, -1).map((m, i) => {
                if (i === 0 && m.role === 'user') {
                  return { role: m.role, content: `${contextPrefix}\n\nStudent's message: ${m.content}` };
                }
                return { role: m.role, content: m.content };
              }),
      };

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setChatLoading(false);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong — please try again.' },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — please try again.' },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [chatInput, chatLoading, rateLimited, chatMessages, problem]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  // Determine what to show in the interaction area
  const showInput = state === 'idle' || state === 'wrong1';
  const showHint = state === 'wrong1';
  const showSolution = state === 'wrong2' || state === 'correct' || state === 'chatOpen';
  const isCorrect = state === 'correct';
  const showChatButton = state === 'wrong2';
  const showChat = state === 'chatOpen';

  const currentAttempt = state === 'wrong1' ? 2 : attemptCount + 1;

  return (
    <section id="demo" style={{ background: 'var(--ax-bg)', padding: '5rem 1.5rem' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: 'var(--ax-text)' }}
          >
            Try the AI Tutor
          </h2>
          <p className="text-lg" style={{ color: 'var(--ax-text-secondary)' }}>
            Real problems. Real AI. Try it yourself.
          </p>
        </div>

        {/* Topic pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTopic(t.key)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: topic === t.key ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border:
                  topic === t.key
                    ? '1px solid rgba(139, 92, 246, 0.5)'
                    : '1px solid var(--ax-border)',
                color: topic === t.key ? 'var(--ax-text)' : 'var(--ax-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Two-column grid layout ── */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}
          className="lg:grid-cols-[380px_1fr]"
        >
          {/* ─── LEFT: Problem Card ─── */}
          <div
            style={{
              background: 'var(--ax-surface)',
              border: '1px solid var(--ax-border)',
              borderRadius: 'var(--ax-card-radius)',
              padding: '2rem',
              alignSelf: 'start',
            }}
          >
            {/* Section badge */}
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#8B5CF6' }}
            >
              {topicMeta.badge}
            </div>

            {/* Question */}
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'var(--ax-text)', fontFamily: "'Georgia', serif" }}
            >
              {renderMathText(problem.questionText)}
            </p>
          </div>

          {/* ─── RIGHT: Interaction Area ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── Input area (idle & wrong1) ── */}
            {showInput && (
              <div
                style={{
                  background: 'var(--ax-surface)',
                  border: '1px solid var(--ax-border)',
                  borderRadius: 'var(--ax-card-radius)',
                  padding: '1.5rem',
                }}
              >
                {/* Hint box (only after first wrong attempt) */}
                {showHint && (
                  <div
                    style={{
                      borderLeft: '2px solid #f59e0b',
                      background: 'rgba(245, 158, 11, 0.06)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 8px 8px 0',
                      marginBottom: '1rem',
                    }}
                  >
                    <p className="text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>
                      ❌ Not quite — here's a hint:
                    </p>
                    <p className="text-sm" style={{ color: 'var(--ax-text-secondary)' }}>
                      {renderMathText(problem.hint)}
                    </p>
                  </div>
                )}

                {/* Symbol toolbar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {SYMBOLS.map((sym) => (
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
                      {SYMBOL_LABELS[sym] || sym}
                    </button>
                  ))}
                </div>

                {/* Answer input + Preview + Submit */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Type your answer…"
                    className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                    style={{
                      background: 'var(--ax-elevated)',
                      border: '1px solid var(--ax-border)',
                      color: 'var(--ax-text)',
                    }}
                  />
                  {/* Live preview */}
                  {input.trim() && (
                    <div
                      style={{
                        minWidth: '120px',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--ax-elevated)',
                        border: '1px solid var(--ax-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.35), 0 0 6px rgba(139, 92, 246, 0.25)',
                      }}
                    >
                      <span style={{ fontSize: '0.55rem', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Preview</span>
                      <span style={{ fontSize: '1.1rem', color: 'var(--ax-text)', fontFamily: "'Cambria Math', 'Latin Modern Math', Georgia, serif" }}>
                        {prettyMath(input)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={submitAnswer}
                    disabled={!input.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: !input.trim() ? 'rgba(139, 92, 246, 0.1)' : '#8B5CF6',
                      color: !input.trim() ? 'var(--ax-text-muted)' : '#fff',
                      cursor: !input.trim() ? 'not-allowed' : 'pointer',
                      border: 'none',
                    }}
                  >
                    Submit
                  </button>
                </div>

                {/* Attempt indicator */}
                <div
                  className="mt-3 text-xs"
                  style={{ color: 'var(--ax-text-muted)' }}
                >
                  Attempt {currentAttempt} of 2
                </div>
              </div>
            )}

            {/* ── Solution panel (wrong2, correct, chatOpen) ── */}
            {showSolution && (
              <div
                style={{
                  background: 'var(--ax-surface)',
                  border: `1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                  borderRadius: 'var(--ax-card-radius)',
                  padding: '1.5rem 2rem',
                }}
              >
                {/* Result header */}
                <div className="mb-4">
                  {isCorrect ? (
                    <p className="text-lg font-semibold" style={{ color: '#34d399' }}>
                      ✅ Correct!
                    </p>
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: '#f87171' }}>
                      ❌ Let&apos;s work through this.
                    </p>
                  )}
                </div>

                {/* Step-by-step solution */}
                <div
                  style={{
                    borderLeft: '2px solid var(--ax-accent, #06b6d4)',
                    paddingLeft: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--ax-accent, #06b6d4)' }}
                  >
                    🧠 Step-by-Step Solution
                  </p>
                  {problem.solution.split('\n').map((line, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed mb-1"
                      style={{ color: 'var(--ax-text-secondary)' }}
                    >
                      {renderMathText(line)}
                    </p>
                  ))}
                </div>

                {/* Correct answer */}
                <div
                  className="text-sm font-medium mb-4"
                  style={{ color: '#34d399' }}
                >
                  ✅ Correct Answer: {renderMathText(`\`${problem.correctAnswer}\``)}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={tryAnother}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: '#8B5CF6',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Try Another Problem →
                  </button>

                  {showChatButton && (
                    <button
                      onClick={openChat}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: 'var(--ax-text)',
                        cursor: 'pointer',
                      }}
                    >
                      💬 Still have questions? Chat with AI Tutor
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Chat panel (only from wrong2 → chatOpen) ── */}
            {showChat && (
              <div
                style={{
                  background: 'var(--ax-surface)',
                  border: '1px solid var(--ax-border)',
                  borderRadius: 'var(--ax-card-radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px',
                }}
              >
                {/* Chat header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--ax-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--ax-text)' }}>
                    🤖 AI Tutor Chat
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ax-text-muted)' }}>
                    7/day limit
                  </span>
                </div>

                {/* Chat input (on top) */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--ax-border)',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder={rateLimited ? 'Demo limit reached' : 'Ask for help…'}
                    disabled={chatLoading || rateLimited}
                    className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                    style={{
                      background: 'var(--ax-elevated)',
                      border: '1px solid var(--ax-border)',
                      color: 'var(--ax-text)',
                    }}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim() || rateLimited}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background:
                        chatLoading || !chatInput.trim() || rateLimited
                          ? 'rgba(139, 92, 246, 0.1)'
                          : '#8B5CF6',
                      color:
                        chatLoading || !chatInput.trim() || rateLimited
                          ? 'var(--ax-text-muted)'
                          : '#fff',
                      cursor:
                        chatLoading || !chatInput.trim() || rateLimited
                          ? 'not-allowed'
                          : 'pointer',
                      border: 'none',
                    }}
                  >
                    Send
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}
                >
                  {chatMessages.length === 0 && !rateLimited && (
                    <div
                      className="text-sm text-center"
                      style={{ color: 'var(--ax-text-muted)', padding: '2rem 0' }}
                    >
                      Ask the AI tutor to explain any step or clarify your confusion.
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
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
                          borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                          borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                        }}
                      >
                        {renderMathText(msg.content)}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
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

                  {rateLimited && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1rem',
                        color: 'var(--ax-text-secondary)',
                        fontSize: '0.9rem',
                      }}
                    >
                      <p style={{ marginBottom: '0.5rem' }}>
                        You&apos;ve reached today&apos;s demo limit!
                      </p>
                      <a href="mailto:contact@onyxenterprises.org" style={{ color: '#8B5CF6', textDecoration: 'underline' }}>
                        Sign up to get unlimited access →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading dots animation + grid media query */}
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
