import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET = process.env.AWS_S3_BUCKET || '';

async function main() {
  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'product-images/',
      Delimiter: '/',
    })
  );

  const folders = (res.CommonPrefixes || [])
    .map((cp) => (cp.Prefix || '').replace('product-images/', '').replace('/', ''))
    .filter(Boolean);

  console.log(`S3 product-images 폴더 (${folders.length}개):\n`);

  for (const f of folders.sort()) {
    const items = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `product-images/${f}/`,
      })
    );
    console.log(`  ${f}: ${items.KeyCount || 0}개`);
  }
}

main().catch(console.error);
