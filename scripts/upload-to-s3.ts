import * as fs from 'fs';
import * as path from 'path';
import { s3, BUCKET, PutObjectCommand } from './lib/s3-client';
import { filterImageFiles } from './lib/image-filter';
import { getContentType } from './lib/content-type';

async function main() {
  const folder = process.argv[2] || '케이온';
  const sourceDir = process.argv[3] || folder;

  const rootDir = path.resolve(__dirname, '..');
  const targetDir = path.join(rootDir, sourceDir);
  const files = filterImageFiles(fs.readdirSync(targetDir));

  console.log(`📦 ${files.length}개 파일 발견 (폴더: ${sourceDir})`);

  for (const file of files) {
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `product-images/${folder}/${file}`,
        Body: fs.readFileSync(path.join(targetDir, file)),
        ContentType: getContentType(file),
      }),
    );
    console.log(`✅ 업로드: product-images/${folder}/${file}`);
  }

  console.log(`🎉 완료: ${files.length}개 업로드 → product-images/${folder}/`);
}

main().catch(console.error);
