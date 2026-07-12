// src/lib/password.ts
// Penjana kata laluan sementara yang unik & selamat untuk akaun baharu.
// Guna node:crypto (rawak selamat). Mengelak aksara mengelirukan (0/O, 1/l/I)
// supaya mudah dibaca/diberi secara lisan. Kata laluan ini sementara — pengguna
// dipaksa menukarnya semasa log masuk pertama (mustChangePw).

import { randomInt } from "node:crypto";

const AKSARA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function janaKataLaluan(panjang = 10): string {
  let s = "";
  for (let i = 0; i < panjang; i++) s += AKSARA[randomInt(AKSARA.length)];
  return s;
}
