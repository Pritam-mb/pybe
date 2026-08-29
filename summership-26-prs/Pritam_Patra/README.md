# PyBe — Inheritance Discovery Engine
### Contribution by Pritam Patra

---

## What This Adds to PyBe

This module teaches **Object-Oriented Inheritance** through a 4-phase guided discovery journey — without telling the learner the concept until they have already described it themselves.

It directly addresses the core PyBe philosophy:
> *"You give a case so that you keep exploring it and eventually you understand."*

---

## The 4-Phase Learning Journey

| Phase | Name | What the learner does |
|---|---|---|
| 1 | **Observe** | Reads a wildlife story. Describes what all animals have in common. No labels. |
| 2 | **Discover** | Observes the Eagle. Describes what makes it the same AND different from a general animal. |
| 3 | **Connect** | The concept name "Inheritance" is revealed. Learner bridges it to a new real-world example. |
| 4 | **Apply** | Fills in `class Eagle(____)` — syntax becomes a confirmation of what they already understood. |

---

## The Key Differentiator: Adaptive Correction Loop

When a learner gives an incomplete observation, instead of saying "Wrong", the system calls Gemini to:
1. Identify the specific gap in understanding
2. Generate a story-based follow-up question targeting that exact gap

The learner can only advance when the LLM confirms genuine understanding.

---

## Tech Stack

- **Frontend:** React + Vite (port 5174)
- **Backend:** Express + Node.js (port 5001)
- **Database:** `db.json` — no external database, no auth
- **AI:** Google Gemini 1.5 Flash (free tier, key in `.env`) with a local rule-based fallback

---

## How to Run

```bash
# 1. Copy your Gemini API key into the .env file
cp server/.env.example server/.env
# Edit server/.env and set GEMINI_API_KEY=your_key_here

# 2. Install dependencies
npm install --prefix server
npm install --prefix client

# 3. Start both servers
npm run dev --prefix server   # http://localhost:5001
npm run dev --prefix client   # http://localhost:5174
```

---

## Documentation

| File | Contents |
|---|---|
| [context.md](./context.md) | Why this approach, what problem it solves |
| [spec.md](./spec.md) | Full technical specification and data schema |
| [change.md](./change.md) | Computational thinking log — every design decision explained |
