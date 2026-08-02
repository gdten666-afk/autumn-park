// lib/storage.ts — image storage abstraction.
// Primary: S3-compatible object storage (Cloudflare R2 / AWS S3 / MinIO).
// Fallback: local disk under UPLOAD_DIR (works on Fly volumes / Docker / dev).
import fs from "fs";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type ImageVariant = "full" | "thumb";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";

export const useObjectStorage = Boolean(
  S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY,
);

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

/** Stable storage key for a photo variant. */
export function keyFor(photoId: string, variant: ImageVariant): string {
  return useObjectStorage
    ? `photos/${photoId}/${variant}.jpg`
    : path.posix.join(variant, `${photoId}.jpg`);
}

export function ensureStorageDirs(): void {
  if (useObjectStorage) return;
  fs.mkdirSync(path.join(UPLOAD_DIR, "full"), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, "thumb"), { recursive: true });
}

export async function writeImageBytes(
  key: string,
  bytes: Buffer,
  contentType = "image/jpeg",
): Promise<void> {
  if (useObjectStorage) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return;
  }
  const file = path.join(UPLOAD_DIR, key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
}

export async function readImageBytes(
  key: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (useObjectStorage) {
    try {
      const res = await getS3().send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      );
      const bytes = Buffer.from(await res.Body!.transformToByteArray());
      return { bytes, contentType: res.ContentType || "image/jpeg" };
    } catch {
      return null;
    }
  }
  const file = path.join(UPLOAD_DIR, key);
  if (!fs.existsSync(file)) return null;
  return { bytes: fs.readFileSync(file), contentType: "image/jpeg" };
}

export async function deleteImageKeys(keys: string[]): Promise<void> {
  for (const key of keys) {
    if (!key) continue;
    try {
      if (useObjectStorage) {
        await getS3().send(
          new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
        );
      } else {
        const file = path.join(UPLOAD_DIR, key);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    } catch {
      // Deleting is best-effort; orphaned objects can be cleaned separately.
    }
  }
}
