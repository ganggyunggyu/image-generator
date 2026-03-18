import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const BUCKET = process.env.AWS_S3_BUCKET || '';
const REGION = process.env.AWS_S3_REGION || 'ap-northeast-2';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'] as const;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const isImageKey = (key: string): boolean =>
  IMAGE_EXTENSIONS.some((extension) => key.toLowerCase().endsWith(extension));

const toS3Url = (key: string): string =>
  `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

export const listFolders = async (prefix: string): Promise<string[]> => {
  const folders: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      })
    );

    for (const commonPrefix of response.CommonPrefixes || []) {
      if (!commonPrefix.Prefix) {
        continue;
      }

      const folderName = commonPrefix.Prefix.replace(prefix, '').replace('/', '');
      if (folderName) {
        folders.push(folderName);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return folders;
};

export const listImagesInFolder = async (folder: string): Promise<string[]> => {
  const prefix = `images/${folder}/`;
  const images: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of response.Contents || []) {
      const key = item.Key || '';
      if (isImageKey(key)) {
        images.push(toS3Url(key));
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return images;
};
