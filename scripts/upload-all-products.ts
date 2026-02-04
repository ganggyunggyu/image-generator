import { listSubdirectories } from './lib/local-fs';
import { uploadProductFolder } from './lib/upload-folder';

const outputDir = process.argv[2] || './안과_출력';
const blogId = process.argv[3] || '';

async function main() {
  const folders = listSubdirectories(outputDir);

  const s3Root = blogId ? `product-images/${blogId}` : 'product-images';
  console.log(`S3 경로: ${s3Root}/`);
  console.log(`총 ${folders.length}개 폴더 업로드\n`);
  let grandTotal = 0;

  for (const folder of folders) {
    console.log(`📂 ${folder}`);
    const count = await uploadProductFolder({
      localBase: `${outputDir}/${folder}`,
      s3Base: `${s3Root}/${folder}`,
      verbose: false,
    });
    grandTotal += count;
    console.log(`  → ${count}장 완료\n`);
  }

  console.log(`🎉 총 ${grandTotal}장 업로드 완료`);
}

main().catch(console.error);
