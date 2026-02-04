import { config } from 'dotenv';
config({ path: '.env.local' });
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const client = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET = process.env.AWS_S3_BUCKET || '';

const SUB_FOLDERS = ['본문', '개별', '슬라이드', '콜라주', '라이브러리제외', '라이브러리제외_링크'];
const IMG_EXTS = /\.(png|jpg|jpeg|webp|gif)$/i;

async function uploadFolder(localBase: string, s3Base: string): Promise<number> {
  let total = 0;

  for (const sub of SUB_FOLDERS) {
    const localDir = path.join(localBase, sub);
    if (!fs.existsSync(localDir)) continue;

    const files = fs.readdirSync(localDir).filter((f) => IMG_EXTS.test(f));
    if (files.length === 0) continue;

    for (const file of files) {
      const body = fs.readFileSync(path.join(localDir, file));
      const ext = path.extname(file).toLowerCase();
      const contentType =
        ext === '.png' ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.webp' ? 'image/webp'
        : 'image/gif';

      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${s3Base}/${sub}/${file}`,
          Body: body,
          ContentType: contentType,
        })
      );
      total++;
    }
    console.log(`  ${sub}: ${files.length}장`);
  }

  const metaPath = path.join(localBase, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${s3Base}/metadata.json`,
        Body: fs.readFileSync(metaPath),
        ContentType: 'application/json',
      })
    );
    console.log('  metadata.json ✅');
  }

  return total;
}

const outputDir = process.argv[2] || './안과_출력';
const blogId = process.argv[3] || '';

async function main() {
  const folders = fs.readdirSync(outputDir).filter((f) =>
    fs.statSync(path.join(outputDir, f)).isDirectory()
  );

  const s3Root = blogId ? `product-images/${blogId}` : 'product-images';
  console.log(`S3 경로: ${s3Root}/`);
  console.log(`총 ${folders.length}개 폴더 업로드\n`);
  let grandTotal = 0;

  for (const folder of folders.sort()) {
    console.log(`📂 ${folder}`);
    const count = await uploadFolder(
      path.join(outputDir, folder),
      `${s3Root}/${folder}`
    );
    grandTotal += count;
    console.log(`  → ${count}장 완료\n`);
  }

  console.log(`🎉 총 ${grandTotal}장 업로드 완료`);
}

main().catch(console.error);
