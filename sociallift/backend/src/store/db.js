import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';

const defaultData = {
  users: [],
  posts: [],
  sessions: []
};

export async function createLowDb(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
  const adapter = new JSONFile(filePath);
  const db = new Low(adapter, defaultData);
  await db.read();
  if (!db.data) db.data = { ...defaultData };
  return db;
}