import { uploadProductFolder } from './lib/upload-folder';

const folderName = process.argv[2];
if (!folderName) {
  console.error('사용법: npx tsx scripts/upload-product-images.ts <폴더명>');
  process.exit(1);
}

(async () => {
  const count = await uploadProductFolder({
    localBase: `./${folderName}`,
    s3Base: `product-images/${folderName}`,
  });
  console.log(`🎉 총 ${count}개 이미지 업로드 완료`);
})().catch(console.error);
