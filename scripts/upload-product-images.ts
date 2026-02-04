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

async function uploadFolder(localBase: string, s3Base: string) {
  let total = 0;

  for (const sub of SUB_FOLDERS) {
    const localDir = path.join(localBase, sub);
    if (!fs.existsSync(localDir)) {
      console.log('⏭️ 스킵:', sub);
      continue;
    }

    const files = fs.readdirSync(localDir).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    console.log(`📂 ${sub}: ${files.length}개`);

    for (const file of files) {
      const filePath = path.join(localDir, file);
      const body = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const contentType =
        ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
              ? 'image/webp'
              : 'image/gif';

      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${s3Base}/${sub}/${file}`,
          Body: body,
          ContentType: contentType,
        })
      );
      console.log(`✅ ${s3Base}/${sub}/${file}`);
      total++;
    }
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
    console.log('✅ metadata.json 업로드');
  }

  return total;
}

const folderName = process.argv[2];
if (!folderName) {
  console.error('사용법: npx tsx scripts/upload-product-images.ts <폴더명>');
  process.exit(1);
}

(async () => {
  const count = await uploadFolder(`./${folderName}`, `product-images/${folderName}`);
  console.log(`🎉 총 ${count}개 이미지 업로드 완료`);
})().catch(console.error);
