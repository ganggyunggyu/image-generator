import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const getS3Client = () =>
  new S3Client({
    region: process.env.AWS_S3_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

const BUCKET = process.env.AWS_S3_BUCKET || '';
const REGION = process.env.AWS_S3_REGION || 'ap-northeast-2';

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadToS3 = async (
  buffer: Buffer,
  keyword: string,
  contentType: string = 'image/webp'
): Promise<UploadResult> => {
  const dateStr = formatDate(new Date());
  const fileId = uuidv4().slice(0, 8);
  const ext = contentType.includes('png') ? 'png' : contentType.includes('jpg') || contentType.includes('jpeg') ? 'jpg' : 'webp';
  const key = `search-images/${keyword}/${dateStr}_${fileId}.${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { url, key };
};

export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

export interface S3ImageItem {
  url: string;
  key: string;
  size?: number | undefined;
  lastModified?: Date | undefined;
}

export const listS3Images = async (
  folder: string,
  maxKeys: number = 100
): Promise<S3ImageItem[]> => {
  const response = await getS3Client().send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folder.endsWith('/') ? folder : `${folder}/`,
      MaxKeys: maxKeys,
    })
  );

  if (!response.Contents) return [];

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

  return response.Contents
    .filter((item) => {
      const key = item.Key || '';
      return imageExtensions.some((ext) => key.toLowerCase().endsWith(ext));
    })
    .map((item) => ({
      url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${item.Key}`,
      key: item.Key || '',
      size: item.Size,
      lastModified: item.LastModified,
    }));
};

export const listS3Folders = async (prefix: string): Promise<string[]> => {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const folders: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: normalizedPrefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      })
    );

    if (response.CommonPrefixes) {
      for (const cp of response.CommonPrefixes) {
        if (cp.Prefix) {
          const folderName = cp.Prefix.replace(normalizedPrefix, '').replace('/', '');
          if (folderName) folders.push(folderName);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return folders;
};

export const readS3TextFile = async (key: string): Promise<string> => {
  const response = await getS3Client().send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return (await response.Body?.transformToString()) || '';
};

export const readS3TextLines = async (key: string): Promise<string[]> => {
  const text = await readS3TextFile(key);
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
};

export const renameS3Folder = async (oldPrefix: string, newPrefix: string): Promise<number> => {
  const oldNorm = oldPrefix.endsWith('/') ? oldPrefix : `${oldPrefix}/`;
  const newNorm = newPrefix.endsWith('/') ? newPrefix : `${newPrefix}/`;
  const client = getS3Client();
  let count = 0;

  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: oldNorm,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of response.Contents || []) {
      if (!item.Key) continue;
      const newKey = item.Key.replace(oldNorm, newNorm);

      await client.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${item.Key}`,
          Key: newKey,
        })
      );
      await client.send(
        new DeleteObjectCommand({ Bucket: BUCKET, Key: item.Key })
      );
      count++;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return count;
};

export const deleteS3Prefix = async (prefix: string): Promise<number> => {
  const client = getS3Client();
  let totalDeleted = 0;
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const objects = (response.Contents || [])
      .filter((o) => o.Key)
      .map((o) => ({ Key: o.Key! }));

    if (objects.length === 0) break;

    await client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects },
      }),
    );

    totalDeleted += objects.length;
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return totalDeleted;
};
