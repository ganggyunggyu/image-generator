import { config } from 'dotenv';
config({ path: '.env.local' });
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET = process.env.AWS_S3_BUCKET || '';

async function main() {
  let totalDeleted = 0;
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'product-images/',
        ContinuationToken: continuationToken,
      })
    );

    const objects = (response.Contents || []).map((o) => ({ Key: o.Key! }));
    if (objects.length === 0) break;

    await client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects },
      })
    );

    totalDeleted += objects.length;
    console.log(`삭제: ${totalDeleted}개`);
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  console.log(`\n🗑️ product-images/ 전체 ${totalDeleted}개 삭제 완료`);
}

main().catch(console.error);
