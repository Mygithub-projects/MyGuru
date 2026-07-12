// ===========================================================================
//  Abstraksi storan fail — adapter dipilih melalui env STORAGE_DRIVER.
//    - "local" (lalai): simpan ke public/uploads (untuk pembangunan)
//    - "s3": simpan ke bucket S3 (produksi) — perlu env S3_*
//  Antaramuka: simpan(buffer, namaFail, contentType) -> URL/path awam.
// ===========================================================================
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface StorageAdapter {
  simpan(data: Buffer, namaFail: string, contentType: string): Promise<string>;
}

// --- Adapter Local ---
class LocalStorage implements StorageAdapter {
  private dir = path.join(process.cwd(), "public", "uploads");
  async simpan(data: Buffer, namaFail: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(path.join(this.dir, namaFail), data);
    return `/uploads/${namaFail}`;
  }
}

// --- Adapter S3 (dimuat secara dinamik supaya build tidak terikat) ---
class S3Storage implements StorageAdapter {
  async simpan(data: Buffer, namaFail: string, contentType: string): Promise<string> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.S3_BUCKET!;
    const region = process.env.S3_REGION || "ap-southeast-1";
    const client = new S3Client({
      region,
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
    const key = `uploads/${namaFail}`;
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: contentType })
    );
    const base = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${base}/${key}`;
  }
}

let _adapter: StorageAdapter | null = null;
export function storage(): StorageAdapter {
  if (_adapter) return _adapter;
  _adapter = process.env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  return _adapter;
}
