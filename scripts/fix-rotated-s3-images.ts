import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  BUCKET,
  s3,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from './lib/s3-client';

const S3_PREFIX = process.argv[2] || 'category-images/한려담원/';
const DRY_RUN = process.argv.includes('--dry-run');
const ROTATION = parseInt(process.argv.find((a) => a.startsWith('--rotate='))?.split('=')[1] || '90', 10);

const KNOWN_ROTATED_DIMENSIONS = [
  { width: 4032, height: 3024 },
  { width: 3024, height: 4032 },
];

const isLikelyRotated = (width: number, height: number): boolean => {
  return width > height && KNOWN_ROTATED_DIMENSIONS.some(
    (d) => d.width === width && d.height === height
  );
};

const listImageKeys = async (prefix: string): Promise<string[]> => {
  const client = s3();
  const list = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (list.Contents || [])
    .map((item) => item.Key)
    .filter(
      (key): key is string =>
        !!key && /\.(webp|png|jpg|jpeg)$/i.test(key)
    );
};

const fixRotatedImages = async () => {
  const keys = await listImageKeys(S3_PREFIX);
  console.log(`Found ${keys.length} images in s3://${BUCKET}/${S3_PREFIX}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}, Rotation: ${ROTATION}°\n`);

  const client = s3();
  let fixedCount = 0;
  let skippedCount = 0;

  for (const key of keys) {
    const obj = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!obj.Body) continue;

    const body = await obj.Body.transformToByteArray();
    const buffer = Buffer.from(body);
    const metadata = await sharp(buffer).metadata();
    const { width = 0, height = 0 } = metadata;

    if (!isLikelyRotated(width, height)) {
      console.log(`  SKIP ${key} (${width}x${height}) - 정상`);
      skippedCount++;
      continue;
    }

    console.log(`  FIX  ${key} (${width}x${height}) → rotate ${ROTATION}°`);

    if (!DRY_RUN) {
      const rotatedBuffer = await sharp(buffer)
        .rotate(ROTATION)
        .toBuffer();

      const rotatedMeta = await sharp(rotatedBuffer).metadata();
      const ext = path.extname(key).toLowerCase();
      const contentType =
        ext === '.webp' ? 'image/webp' :
        ext === '.png' ? 'image/png' :
        'image/jpeg';

      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: rotatedBuffer,
          ContentType: contentType,
        })
      );

      console.log(`       → ${rotatedMeta.width}x${rotatedMeta.height} uploaded`);
    }

    fixedCount++;
  }

  console.log(`\nDone! Fixed: ${fixedCount}, Skipped: ${skippedCount}`);
  if (DRY_RUN) console.log('(dry run - no changes made)');
};

fixRotatedImages().catch(console.error);
