// ===========================================================================
//  Abstraksi storan fail — adapter dipilih melalui env STORAGE_DRIVER.
//    - "local" (lalai): simpan ke storage/uploads (DI LUAR public/ — tidak
//      boleh dicapai terus melalui URL). Boleh tukar lokasi via UPLOAD_DIR.
//    - "s3": simpan ke bucket S3/R2 PERIBADI (produksi) — perlu env S3_*
//  Fail eviden pelajar adalah PERIBADI: hanya boleh dibaca melalui route
//  /api/fail/[nama] yang menyemak skop guru penasihat / admin.
//  Antaramuka: simpan(buffer, namaFail, contentType) -> URL route peribadi,
//              baca(namaFail) -> kandungan fail atau null.
// ===========================================================================
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { urlFail } from "./fail-url";

export interface StorageAdapter {
  simpan(data: Buffer, namaFail: string, contentType: string): Promise<string>;
  baca(namaFail: string): Promise<Buffer | null>;
}

// --- Adapter Local ---
class LocalStorage implements StorageAdapter {
  private dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
  async simpan(data: Buffer, namaFail: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(path.join(this.dir, namaFail), data);
    return urlFail(namaFail)!;
  }
  async baca(namaFail: string): Promise<Buffer | null> {
    try {
      return await readFile(path.join(this.dir, namaFail));
    } catch {
      return null;
    }
  }
}

// --- Adapter S3 (dimuat secara dinamik supaya build tidak terikat) ---
class S3Storage implements StorageAdapter {
  private async client() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: process.env.S3_REGION || "ap-southeast-1",
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
  }
  async simpan(data: Buffer, namaFail: string, contentType: string): Promise<string> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: `uploads/${namaFail}`,
        Body: data,
        ContentType: contentType,
      })
    );
    return urlFail(namaFail)!;
  }
  async baca(namaFail: string): Promise<Buffer | null> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: `uploads/${namaFail}` })
      );
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch {
      return null;
    }
  }
}

let _adapter: StorageAdapter | null = null;
export function storage(): StorageAdapter {
  if (_adapter) return _adapter;
  _adapter = process.env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  return _adapter;
}
