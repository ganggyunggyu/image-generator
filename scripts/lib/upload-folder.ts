import * as fs from 'fs';
import * as path from 'path';
import { s3, BUCKET, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from './s3-client';
import { SUB_FOLDERS } from './constants';
import { filterImageFiles } from './image-filter';
import { getContentType } from './content-type';

export interface UploadFolderOptions {
  localBase: string;
  s3Base: string;
  subFolders?: readonly string[];
  verbose?: boolean;
}

const DELETE_BATCH_SIZE = 1000;

const listPrefixKeys = async (prefix: string): Promise<string[]> => {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3().send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents || []) {
      if (item.Key && !item.Key.endsWith('/')) keys.push(item.Key);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
};

const deletePrefixKeys = async (prefix: string): Promise<number> => {
  const keys = await listPrefixKeys(prefix);
  if (keys.length === 0) return 0;

  for (let start = 0; start < keys.length; start += DELETE_BATCH_SIZE) {
    const batch = keys.slice(start, start + DELETE_BATCH_SIZE).map((Key) => ({ Key }));
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch },
      }),
    );
  }

  return keys.length;
};

export const uploadProductFolder = async ({
  localBase,
  s3Base,
  subFolders = SUB_FOLDERS,
  verbose = true,
}: UploadFolderOptions): Promise<number> => {
  const deletedCount = await deletePrefixKeys(`${s3Base}/`);
  if (deletedCount > 0) {
    console.log(`  기존 S3 정리: ${deletedCount}개`);
  }

  let total = 0;

  for (const sub of subFolders) {
    const localDir = path.join(localBase, sub);
    if (!fs.existsSync(localDir)) continue;

    const files = filterImageFiles(fs.readdirSync(localDir));
    if (files.length === 0) continue;

    for (const file of files) {
      const body = fs.readFileSync(path.join(localDir, file));
      await s3().send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${s3Base}/${sub}/${file}`,
          Body: body,
          ContentType: getContentType(file),
        }),
      );
      if (verbose) console.log(`  ✅ ${s3Base}/${sub}/${file}`);
      total++;
    }
    console.log(`  ${sub}: ${files.length}장`);
  }

  const metaPath = path.join(localBase, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${s3Base}/metadata.json`,
        Body: fs.readFileSync(metaPath),
        ContentType: 'application/json',
      }),
    );
    console.log('  metadata.json ✅');
  }

  return total;
};
