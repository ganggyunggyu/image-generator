import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || '';

async function renameImages(folder: string) {
  const prefix = `product-images/${folder}/`;

  console.log(`📦 ${prefix} 조회 중...`);

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 1000,
    })
  );

  if (!response.Contents || response.Contents.length === 0) {
    console.log('❌ 파일 없음');
    return;
  }

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const files = response.Contents.filter((item) => {
    const key = item.Key || '';
    return imageExtensions.some((ext) => key.toLowerCase().endsWith(ext));
  }).sort((a, b) => {
    const aTime = a.LastModified?.getTime() || 0;
    const bTime = b.LastModified?.getTime() || 0;
    return aTime - bTime;
  });

  console.log(`📦 ${files.length}개 이미지 발견`);

  for (let i = 0; i < files.length; i++) {
    const oldKey = files[i]!.Key!;
    const ext = oldKey.substring(oldKey.lastIndexOf('.'));
    const newKey = `${prefix}image_${i + 1}${ext}`;

    if (oldKey === newKey) {
      console.log(`⏭️ 스킵 (동일): ${oldKey}`);
      continue;
    }

    await client.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: encodeURIComponent(`${BUCKET}/${oldKey}`),
        Key: newKey,
      })
    );

    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: oldKey,
      })
    );

    console.log(`✅ ${oldKey} → ${newKey}`);
  }

  console.log(`🎉 완료: ${files.length}개 → image_1 ~ image_${files.length}`);
}

const folder = process.argv[2] || '케이온';
renameImages(folder).catch(console.error);
