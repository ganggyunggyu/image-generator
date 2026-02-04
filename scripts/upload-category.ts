import { uploadProductFolder } from './lib/upload-folder';

async function main() {
  const localDir = process.argv[2];
  const categoryName = process.argv[3];

  if (!localDir || !categoryName) {
    console.log('Usage: npx tsx scripts/upload-category.ts <폴더경로> <카테고리명>');
    process.exit(1);
  }

  const count = await uploadProductFolder({
    localBase: localDir,
    s3Base: `category-images/${categoryName}`,
    verbose: false,
  });
  console.log(`\n🎉 category-images/${categoryName} 업로드 완료 (${count}장)`);
}

main().catch(console.error);
