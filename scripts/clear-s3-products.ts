import './lib/s3-client';
import { deleteS3Prefix } from '@/shared/lib/s3';

async function main() {
  const totalDeleted = await deleteS3Prefix('product-images/');
  console.log(`\n🗑️ product-images/ 전체 ${totalDeleted}개 삭제 완료`);
}

main().catch(console.error);
