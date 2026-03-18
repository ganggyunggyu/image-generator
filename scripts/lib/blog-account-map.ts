export const BLOG_NAME_TO_NAVER_ID: Record<string, string> = {
  패밀리넛: 'ecjroe6558',
  '빨간모자앤 - 준3': 'dhtksk1p',
  '정의 - 준4': 'eqsdxv2863',
  찐찐찐찐찐이야: 'ags2oigb',
  '에스앤비안과 1': 'mixxut',
  '에스앤비안과 2': 'ynattg',
  '에스앤비안과 정보': 'nahhjo',
  '에스앤비안과, 28년 경력': 'mzuul',
  에스앤비안과의원: 'hagyga',
  모험: 'geenl',
  탐험기: 'ghhoy',
  '얼음땡 - 준4': 'cookie4931',
  '투디치과 스킨블': 'wound12567',
  토토리토: 'precede1451',
  라우드: 'loand3324',
  고구마스틱: 'fail5644',
  룰루랄라: 'compare14310',
  글로벌: 'gmezz',
  글로벌발자국: 'gmezz',
  '운명의 마법사': 'dyulp',
  운명의마법사: 'dyulp',
  '맛집 탐험대': 'lesyt',
  맛집탐험대: 'lesyt',
  '먹방 여행기': 'aryunt',
  먹방여행기: 'aryunt',
  '새로운 여행지': 'zhuwl',
  은길: 'enugii',
  '떠나는날의 이야기': 'nnhha',
  이야기: 'nnhha',
  투데이: 'aqahdp5252',
  해리포터: 'selzze',
  불꽃: 'bjwuo',
  '새로운 발견': 'ebbte',
  다이어리: 'ganir',
  '꿈꾸는 나날': 'shcint',
  미식가: 'yenalk',
  '새로운 시작': 'dyust',
  숙면구출: 'momenft5251',
  고뇌물렁: 'column13365',
};

const normalizeKey = (value: string): string => value.normalize('NFC').trim();

export const resolveNaverId = (blogFolderNameOrId: string): string => {
  const key = normalizeKey(blogFolderNameOrId);
  const mapped = BLOG_NAME_TO_NAVER_ID[key];
  if (mapped) return mapped;
  return key;
};
