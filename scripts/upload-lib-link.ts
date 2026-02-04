import * as fs from 'fs';
import * as path from 'path';
import { s3, BUCKET, PutObjectCommand } from './lib/s3-client';
import { filterImageFiles } from './lib/image-filter';
import { getContentType } from './lib/content-type';

async function main() {
  const localDir = './뱅갈고양이/라이브러리제외_링크';
  const s3Prefix = 'product-images/뱅갈고양이/라이브러리제외_링크';

  const files = filterImageFiles(fs.readdirSync(localDir));
  console.log(`📂 라이브러리제외_링크: ${files.length}개`);

  for (const file of files) {
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${s3Prefix}/${file}`,
        Body: fs.readFileSync(path.join(localDir, file)),
        ContentType: getContentType(file),
      }),
    );
    console.log(`✅ ${s3Prefix}/${file}`);
  }

  const metaPath = './뱅갈고양이/metadata.json';
  if (fs.existsSync(metaPath)) {
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: 'product-images/뱅갈고양이/metadata.json',
        Body: fs.readFileSync(metaPath),
        ContentType: 'application/json',
      }),
    );
    console.log('✅ metadata.json 업데이트');
  }

  console.log('🎉 업로드 완료');
}

main().catch(console.error);
