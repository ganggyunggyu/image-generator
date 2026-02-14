import * as fs from 'fs';
import * as path from 'path';
import { BUCKET, s3, ListObjectsV2Command, GetObjectCommand } from './lib/s3-client';

const DEFAULT_PREFIX = 'category-images/한려담원/';
const DEFAULT_OUT_DIR = '/Users/ganggyunggyu/temp-image-gen/한려담원';

const requireEnv = (value: string, name: string): string => {
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const resolveArgs = (): { prefix: string; outDir: string } => {
  const [, , prefixArg, outDirArg] = process.argv;
  return {
    prefix: prefixArg || DEFAULT_PREFIX,
    outDir: outDirArg || DEFAULT_OUT_DIR,
  };
};

const listKeys = async (bucket: string, prefix: string): Promise<string[]> => {
  const client = s3();
  const list = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  return (list.Contents || [])
    .map((item) => item.Key)
    .filter((key): key is string => !!key && !key.endsWith('/'));
};

const download = async () => {
  const { prefix, outDir } = resolveArgs();
  const bucket = requireEnv(BUCKET, 'AWS_S3_BUCKET');
  const keys = await listKeys(bucket, prefix);

  console.log(`Found ${keys.length} files in s3://${bucket}/${prefix}`);

  const client = s3();
  for (const key of keys) {
    const relativePath = key.replace(prefix, '');
    const localPath = path.join(outDir, relativePath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (obj.Body) {
      const body = await obj.Body.transformToByteArray();
      fs.writeFileSync(localPath, Buffer.from(body));
      console.log(`Downloaded: ${relativePath}`);
    }
  }
  console.log(`\nDone! Files saved to ${outDir}`);
};

download().catch(console.error);
