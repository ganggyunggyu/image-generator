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

async function main() {
  const localDir = './뱅갈고양이/라이브러리제외_링크';
  const s3Prefix = 'product-images/뱅갈고양이/라이브러리제외_링크';

  const files = fs.readdirSync(localDir).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  console.log(`📂 라이브러리제외_링크: ${files.length}개`);

  for (const file of files) {
    const body = fs.readFileSync(path.join(localDir, file));
    const ext = path.extname(file).toLowerCase();
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${s3Prefix}/${file}`,
        Body: body,
        ContentType: contentType,
      })
    );
    console.log(`✅ ${s3Prefix}/${file}`);
  }

  // metadata.json도 다시 업로드 (lib_url 추가됨)
  const metaPath = './뱅갈고양이/metadata.json';
  if (fs.existsSync(metaPath)) {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: 'product-images/뱅갈고양이/metadata.json',
        Body: fs.readFileSync(metaPath),
        ContentType: 'application/json',
      })
    );
    console.log('✅ metadata.json 업데이트');
  }

  console.log('🎉 업로드 완료');
}

main().catch(console.error);
