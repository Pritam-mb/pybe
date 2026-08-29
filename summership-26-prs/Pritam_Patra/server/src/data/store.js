const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'db.json');

async function readDb() {
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(dbPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function getSaga() {
  const db = await readDb();
  return db.saga;
}

// Flatten all acts from all arcs
async function getAllActs() {
  const db = await readDb();
  return db.saga.arcs.flatMap((arc) =>
    arc.acts.map((act) => ({ ...act, arcNumber: arc.arc, arcName: arc.name, arcColor: arc.color }))
  );
}

async function getAct(actNumber) {
  const acts = await getAllActs();
  return acts.find((a) => a.act === actNumber) || null;
}

async function saveSession(sessionData) {
  const db = await readDb();
  const session = {
    _id: crypto.randomUUID(),
    ...sessionData,
    createdAt: new Date().toISOString()
  };
  if (!db.sessions) db.sessions = [];
  db.sessions.push(session);
  await writeDb(db);
  return session;
}

module.exports = { getSaga, getAllActs, getAct, saveSession };
