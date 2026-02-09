import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const bucket = process.env.AWS_S3_BUCKET!;
const prefix = process.argv[2] || 'category-images/한려담원/';
const outDir = process.argv[3] || '/Users/ganggyunggyu/temp-image-gen/한려담원';

const download = async () => {
  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  const keys = (list.Contents || [])
    .map((o) => o.Key)
    .filter((k): k is string => !!k && !k.endsWith('/'));

  console.log(`Found ${keys.length} files in s3://${bucket}/${prefix}`);

  for (const key of keys) {
    const relativePath = key.replace(prefix, '');
    const localPath = path.join(outDir, relativePath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (obj.Body) {
      const body = await obj.Body.transformToByteArray();
      fs.writeFileSync(localPath, Buffer.from(body));
      console.log(`Downloaded: ${relativePath}`);
    }
  }
  console.log(`\nDone! Files saved to ${outDir}`);
};

download().catch(console.error);
