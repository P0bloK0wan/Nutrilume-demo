import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCb);
export const token = () => randomBytes(32).toString("base64url");
export const digest = (s) => createHash("sha256").update(s).digest("hex");
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function text(value, max = 500) {
  if (typeof value !== "string" || value.length > max)
    fail(400, "Campo de texto inválido.");
  return value.trim();
}
export function password(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    fail(400, "A senha precisa ter de 12 a 128 caracteres.");
  return value;
}
export function email(value) {
  const v = text(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(400, "E-mail inválido.");
  return v;
}
export async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  return (
    salt + ":" + Buffer.from(await scrypt(value, salt, 64)).toString("hex")
  );
}
export async function verifyPassword(value, hash) {
  if (typeof value !== "string" || value.length > 128) return false;
  const [salt, key] = hash.split(":");
  const actual = Buffer.from(await scrypt(value, salt, 64));
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}
export function number(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    fail(400, "Valor numérico fora do intervalo.");
  return n;
}
export function date(value) {
  const v = text(value, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(new Date(v + "T12:00:00Z").getTime()) ||
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) !== v
  )
    fail(400, "Data inválida.");
  return v;
}
export function moderate(t) {
  if (/(jejum prolongado|laxante|vomitar|me odeio|passar fome|purgar)/i.test(t))
    return "care";
  if (
    /\d+([.,]\d+)?\s*(kg|quilos?|mg|mcg)\b|https?:|www\.|\.com\b|\.br\b|\bdose\b|suplement/i.test(
      t,
    )
  )
    return "restricted";
  return null;
}
export function distance(a, b, c, d) {
  const r = (x) => (x * Math.PI) / 180;
  const h =
    Math.sin(r(c - a) / 2) ** 2 +
    Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
