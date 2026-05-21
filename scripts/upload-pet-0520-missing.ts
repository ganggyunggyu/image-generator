import { uploadProductFolder } from './lib/upload-folder';
import * as path from 'path';
import * as fs from 'fs';

const NAS_BASE = '/Volumes/21lab_데이터관리/0_자동발행/0_애견자동발행/애견_0520_출력';

const ENTRIES: Array<{ nickname: string; blogId: string; keyword: string }> = [
  { nickname: '강아지강하지', blogId: 'k7d9x2m4', keyword: '닥스훈트' },
  { nickname: '강아지강하지', blogId: 'k7d9x2m4', keyword: '강아지품종' },
  { nickname: '고구마스틱', blogId: 'fail5644', keyword: '검은고양이' },
  { nickname: '고구마스틱', blogId: 'fail5644', keyword: '도베르만' },
  { nickname: '고양이밥', blogId: 'n7c3w8z2', keyword: '애견' },
  { nickname: '룰루랄라', blogId: 'compare14310', keyword: '랙돌분양가' },
  { nickname: '리스팩식스팩', blogId: 'respawnking9', keyword: '포메라니안분양' },
  { nickname: '바삭바삭해', blogId: 'ahffkdlek12', keyword: '강아지종류' },
  { nickname: '쉽고간단하게', blogId: 'ahsxkfldk12', keyword: '러시안블루분양' },
  { nickname: '쉽고간단하게', blogId: 'ahsxkfldk12', keyword: '말티즈' },
  { nickname: '실눈캐', blogId: 'ghostrush7', keyword: '말티푸분양가' },
  { nickname: '실눈캐', blogId: 'ghostrush7', keyword: '골든두들' },
  { nickname: '햄부기', blogId: 'ahfflwl123', keyword: '고양이종류' },
];

const main = async () => {
  let totalImages = 0;
  for (const entry of ENTRIES) {
    const localBase = path.join(NAS_BASE, entry.nickname, entry.keyword);
    const s3Base = `product-images/${entry.blogId}/${entry.keyword}`;

    if (!fs.existsSync(localBase)) {
      console.log(`[skip] ${entry.blogId}/${entry.keyword} → 경로 없음: ${localBase}`);
      continue;
    }

    console.log(`\n=== ${entry.blogId}/${entry.keyword} ===`);
    const uploaded = await uploadProductFolder({ localBase, s3Base, verbose: false });
    totalImages += uploaded;
  }
  console.log(`\n🎉 총 ${ENTRIES.length}건 처리 / 이미지 ${totalImages}장 업로드`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
