import { s3, BUCKET, ListObjectsV2Command } from './lib/s3-client';

async function main() {
  const res = await s3().send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'product-images/',
      Delimiter: '/',
    }),
  );

  const folders = (res.CommonPrefixes || [])
    .map((cp) => (cp.Prefix || '').replace('product-images/', '').replace('/', ''))
    .filter(Boolean);

  console.log(`S3 product-images 폴더 (${folders.length}개):\n`);

  for (const f of folders.sort()) {
    const items = await s3().send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `product-images/${f}/`,
      }),
    );
    console.log(`  ${f}: ${items.KeyCount || 0}개`);
  }
}

main().catch(console.error);
