import * as fs from 'fs';
import * as path from 'path';
import { s3, BUCKET, PutObjectCommand } from './s3-client';
import { SUB_FOLDERS } from './constants';
import { filterImageFiles } from './image-filter';
import { getContentType } from './content-type';

export interface UploadFolderOptions {
  localBase: string;
  s3Base: string;
  subFolders?: readonly string[];
  verbose?: boolean;
}

export const uploadProductFolder = async ({
  localBase,
  s3Base,
  subFolders = SUB_FOLDERS,
  verbose = true,
}: UploadFolderOptions): Promise<number> => {
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
