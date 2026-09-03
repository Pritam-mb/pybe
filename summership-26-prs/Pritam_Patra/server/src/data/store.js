const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDir = __dirname;

function getDbPath(story = 'inheritance') {
  if (story === 'polymorphism') {
    return path.join(dataDir, 'polymorphism.json');
  }

  return path.join(dataDir, 'db.json');
}

async function readDb(story = 'inheritance') {
  const raw = await fs.readFile(getDbPath(story), 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data, story = 'inheritance') {
  await fs.writeFile(
    getDbPath(story),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8'
  );
}

async function getSaga(story = 'inheritance') {
  const db = await readDb(story);
  return db.saga;
}

// Flatten all acts from all arcs
async function getAllActs(story = 'inheritance') {
  const db = await readDb(story);

  return db.saga.arcs.flatMap((arc) =>
    arc.acts.map((act) => ({
      ...act,
      arcNumber: arc.arc,
      arcName: arc.name,
      arcColor: arc.color
    }))
  );
}

async function getAct(actNumber, story = 'inheritance') {
  const acts = await getAllActs(story);
  return acts.find((a) => a.act === actNumber) || null;
}

async function saveSession(sessionData, story = 'inheritance') {
  const db = await readDb(story);

  const session = {
    _id: crypto.randomUUID(),
    ...sessionData,
    createdAt: new Date().toISOString()
  };

  if (!db.sessions) db.sessions = [];

  db.sessions.push(session);

  await writeDb(db, story);

  return session;
}

module.exports = {
  getSaga,
  getAllActs,
  getAct,
  saveSession
};