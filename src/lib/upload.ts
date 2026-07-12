// ===========================================================================
//  Muat naik fail — validasi jenis/saiz, kemudian serah ke abstraksi storan
//  (local atau S3 mengikut env STORAGE_DRIVER). Lihat src/lib/storage.ts.
// ===========================================================================
import { randomBytes } from "node:crypto";
import path from "node:path";
import { storage } from "./storage";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const DIBENAR = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"];
const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function simpanFail(file: File, prefix = "fail"): Promise<string> {
  if (file.size === 0) throw new Error("Fail kosong.");
  if (file.size > MAX_BYTES) throw new Error("Fail terlalu besar (maks 8MB).");
  const ext = path.extname(file.name).toLowerCase();
  if (!DIBENAR.includes(ext)) throw new Error(`Jenis fail tidak dibenarkan: ${ext}`);

  const namaSelamat = `${prefix}-${randomBytes(6).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  return storage().simpan(buffer, namaSelamat, MIME[ext] ?? "application/octet-stream");
}

/** Ambil semua fail (multi) dari FormData mengikut nama medan. */
export async function simpanFailDariForm(
  form: FormData,
  field: string,
  prefix: string
): Promise<string | null> {
  const f = form.get(field);
  if (f instanceof File && f.size > 0) return simpanFail(f, prefix);
  return null;
}
