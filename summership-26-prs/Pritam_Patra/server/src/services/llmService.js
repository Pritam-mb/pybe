const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTIONS = `You are an adaptive learning evaluator for a visual-novel style learning app.
The learner is exploring a story-based saga about a zoologist discovering programming concepts through wildlife observation.

Your role is ONLY to evaluate whether the learner's observation shows the correct conceptual understanding.
You are NOT the teacher. You do NOT explain the concept. You guide them to see it themselves.

STRICT RULES:
- Before Act 3: NEVER use words like "class", "parent", "child", "inheritance", "object-oriented", "Python", "method", "super", "constructor", "__init__"
- After Act 3: You may reference programming concepts only if the act itself has already revealed them
- Do NOT give away the answer. Ask a better question that points them toward noticing it themselves.
- Follow-up questions MUST reference the story characters (Dr. Priya, Pip the owl, the animals) — not programming
- Tone: warm, curious, like a wise companion in a story — Pip the owl's voice
- If answer is partially correct: push deeper, don't reject

Respond ONLY in this exact JSON format:
{
  "understood": true or false,
  "encouragement": "short warm message when understood=true (null if false)",
  "misconception": "plain-English description of what they missed (null if understood=true)",
  "followUpQuestion": "a story-grounded question to guide them (null if understood=true)"
}`;

async function evaluate({ actNumber, actName, arcName, concept, storyBeat, questions, expectedInsight, userAnswer }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return localEvaluate({ actNumber, userAnswer });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_INSTRUCTIONS
  });

  const userMessage = `
ACT ${actNumber}: "${actName}" (${arcName} Arc)
CONCEPT BEING DISCOVERED (evaluator reference only — do not reveal): "${concept}"
STORY SO FAR: "${storyBeat}"
QUESTIONS ASKED TO LEARNER: ${questions.map((q, i) => `${i + 1}. ${q}`).join(' | ')}
EXPECTED INSIGHT: "${expectedInsight}"
LEARNER'S ANSWER: "${userAnswer}"

Evaluate and respond in the required JSON format.`;

  try {
    const result = await model.generateContent(userMessage);
    const text = result.response.text().trim();
    const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('LLM evaluation error:', err.message);
    return localEvaluate({ actNumber, userAnswer });
  }
}

function localEvaluate({ actNumber, userAnswer }) {
  const lower = userAnswer.toLowerCase().trim();

  if (lower.length < 15) {
    return {
      understood: false,
      encouragement: null,
      misconception: 'Try to say a bit more — describe what you noticed in detail.',
      followUpQuestion: 'Look at the story again. What specific things did you notice that stood out to you?'
    };
  }

  const evalByAct = {
    1: () => {
      const hits = ['breathe', 'move', 'eat', 'common', 'shared', 'same', 'all', 'similar', 'trait', 'every', 'foundation', 'general', 'together'];
      return hits.filter((h) => lower.includes(h)).length >= 2;
    },
    2: () => {
      const ext = ['extra', 'plus', 'also', 'addition', 'unique', 'special', 'on top', 'adds', 'more than', 'different', 'only', 'beyond'];
      const shared = ['same', 'common', 'shared', 'all animals', 'breathe', 'move', 'eat', 'general', 'base', 'normal'];
      return ext.some((h) => lower.includes(h)) && shared.some((h) => lower.includes(h));
    },
    3: () => lower.length > 30,
    4: () => true, // Code phase — evaluated by exact match in frontend
    5: () => {
      const override = ['replace', 'different way', 'own way', 'same name', 'own version', 'substitut', 'change', 'differently', 'instead', 'not the same'];
      return override.some((h) => lower.includes(h));
    },
    6: () => {
      const super_ = ['first', 'before', 'then', 'on top', 'reuse', 'foundation', 'original', 'base', 'normal', 'elder', 'parent', 'still'];
      return super_.filter((h) => lower.includes(h)).length >= 2;
    },
    7: () => {
      const init = ['first', 'standard', 'shared', 'name', 'habitat', 'before', 'plus', 'extra', 'additional', 'basic', 'starting'];
      return init.filter((h) => lower.includes(h)).length >= 2;
    }
  };

  const passed = evalByAct[actNumber] ? evalByAct[actNumber]() : true;

  const fallbackFollowUps = {
    1: { q: 'Look at the lion, eagle, and dolphin side by side. Name at least two specific things ALL three of them do.', miss: 'Try to name the specific shared behaviours, not just that they are similar.' },
    2: { q: 'Finish this sentence: "The eagle can do everything any animal can do, AND it can also..."', miss: 'Try describing both parts — what the eagle shares AND what only the eagle has.' },
    3: { q: 'Think of something you know in real life where one thing gets all the properties of another and adds its own. A car and a sports car? A phone and a smartphone?', miss: 'Try to think of a real-world pair where one thing "inherits" from another.' },
    5: { q: 'The chameleon eating with a tongue-flick — is it adding a brand new behaviour, or doing an existing behaviour (eating) in its own unique way?', miss: 'Focus on whether the chameleon is doing something new, or replacing how an existing trait works.' },
    6: { q: 'Before the tongue-flick, the chameleon still opens its mouth like every animal. Does it throw away the normal eating pattern, or use it first and then add to it?', miss: 'Notice that the chameleon uses the normal pattern FIRST, then adds. It doesn\'t throw the original away.' },
    7: { q: 'When a new eagle is first catalogued, which fields does it need — just its own (wingspan), or the standard animal fields too (name, habitat)? In what order would you fill them?', miss: 'Think about which information comes from the general animal pattern and which is eagle-specific. Order matters.' }
  };

  if (!passed) {
    const fb = fallbackFollowUps[actNumber] || { q: 'Look at the story again and describe what you noticed in more detail.', miss: 'Try to be more specific about what you observed.' };
    return { understood: false, encouragement: null, misconception: fb.miss, followUpQuestion: fb.q };
  }

  const encouragements = {
    1: 'Exactly! You spotted the shared foundation — the traits that belong to every animal.',
    2: 'Perfect. You saw both parts — the shared foundation AND the eagle\'s unique addition.',
    3: 'Great example! You\'ve mapped the pattern to a new context.',
    5: 'Yes! The chameleon is doing the same behaviour — just its own way. That\'s the key insight.',
    6: 'Exactly right — use the original first, then layer your own on top.',
    7: 'Spot on! The shared fields come first, then the eagle-specific ones. Order is everything.'
  };

  return { understood: true, encouragement: encouragements[actNumber] || 'Well observed!', misconception: null, followUpQuestion: null };
}

module.exports = { evaluate };
