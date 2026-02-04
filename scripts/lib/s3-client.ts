import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, PutObjectCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const getS3Client = () =>
  new S3Client({
    region: process.env.AWS_S3_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

export const BUCKET = process.env.AWS_S3_BUCKET || '';
export const REGION = process.env.AWS_S3_REGION || 'ap-northeast-2';

let _client: S3Client | null = null;
export const s3 = (): S3Client => {
  if (!_client) _client = getS3Client();
  return _client;
};

export { PutObjectCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand };
