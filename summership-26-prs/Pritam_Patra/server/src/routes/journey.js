const express = require('express');
const store = require('../data/store');
const llmService = require('../services/llmService');

const router = express.Router();

// GET /api/journey — return the full saga definition
router.get('/', async (_req, res, next) => {
  try {
    const saga = await store.getSaga();
    res.json(saga);
  } catch (err) {
    next(err);
  }
});

// GET /api/journey/acts — return flattened list of all acts
router.get('/acts', async (_req, res, next) => {
  try {
    const acts = await store.getAllActs();
    res.json(acts);
  } catch (err) {
    next(err);
  }
});

// POST /api/journey/evaluate — evaluate a user's act answer
router.post('/evaluate', async (req, res, next) => {
  try {
    const { actNumber, userAnswer } = req.body;
    if (!actNumber || !userAnswer) {
      return res.status(400).json({ message: 'actNumber and userAnswer are required' });
    }

    const act = await store.getAct(Number(actNumber));
    if (!act) {
      return res.status(404).json({ message: 'Act not found' });
    }

    const evaluation = await llmService.evaluate({
      actNumber: act.act,
      actName: act.name,
      arcName: act.arcName,
      concept: act.concept,
      storyBeat: act.narrative.map((n) => n.text).join(' '),
      questions: act.questions,
      expectedInsight: act.expectedInsight,
      userAnswer
    });

    res.json(evaluation);
  } catch (err) {
    next(err);
  }
});

// POST /api/journey/session — save a completed session
router.post('/session', async (req, res, next) => {
  try {
    const session = await store.saveSession(req.body);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
