import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || '';

async function upload(filePath: string, key: string) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  console.log('✅ 업로드:', key);
}

async function main() {
  const folder = process.argv[2] || '케이온';
  const sourceDir = process.argv[3] || folder;

  const rootDir = path.resolve(__dirname, '..');
  const targetDir = path.join(rootDir, sourceDir);
  const files = fs.readdirSync(targetDir).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));

  console.log(`📦 ${files.length}개 파일 발견 (폴더: ${sourceDir})`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const ext = path.extname(file);
    const key = `product-images/${folder}/${file}`;
    await upload(path.join(targetDir, file), key);
  }

  console.log(`🎉 완료: ${files.length}개 업로드 → product-images/${folder}/`);
}

main().catch(console.error);
