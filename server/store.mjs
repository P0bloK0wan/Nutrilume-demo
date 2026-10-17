import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
export function store(path) {
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  if (path !== ":memory:") chmodSync(path, 0o600);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,role TEXT NOT NULL,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,verified INTEGER DEFAULT 0,must_change INTEGER DEFAULT 0,profile TEXT NOT NULL DEFAULT '{}',created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS links(id TEXT PRIMARY KEY,patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,nutritionist_id TEXT REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL,consents TEXT NOT NULL DEFAULT '{}',UNIQUE(patient_id,nutritionist_id));
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,data TEXT NOT NULL,author_id TEXT REFERENCES users(id) ON DELETE SET NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,nutritionist_id TEXT REFERENCES users(id) ON DELETE CASCADE,start TEXT NOT NULL,end TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reminders(id TEXT PRIMARY KEY,appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,nutritionist_id TEXT REFERENCES users(id) ON DELETE CASCADE,due TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS finance(id TEXT PRIMARY KEY,nutritionist_id TEXT REFERENCES users(id) ON DELETE CASCADE,patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS files(id TEXT PRIMARY KEY,patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,mime TEXT NOT NULL,name TEXT NOT NULL,content BLOB NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,room TEXT NOT NULL,author_id TEXT REFERENCES users(id) ON DELETE CASCADE,nickname TEXT NOT NULL,text TEXT NOT NULL,hidden INTEGER DEFAULT 0,reported INTEGER DEFAULT 0,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,room TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS blocks(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,blocked_id TEXT REFERENCES users(id) ON DELETE CASCADE,PRIMARY KEY(user_id,blocked_id));
CREATE TABLE IF NOT EXISTS audits(id INTEGER PRIMARY KEY,user_id TEXT,action TEXT NOT NULL,target_id TEXT,created TEXT NOT NULL);
`);
  return db;
}
