import { FILTER_STYLES, FRAME_STYLES } from './constants.js';

const API_BASE = 'https://image-generator-dsga.vercel.app';

export const getStyle = (styles, id) => {
  if (id === 'random') {
    const valid = styles.filter((s) => s.id !== 'none' && s.id !== 'random');
    return valid[Math.floor(Math.random() * valid.length)];
  }
  return styles.find((s) => s.id === id) || styles[0];
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const searchImages = async (query, count = 50) => {
  const res = await fetch(`${API_BASE}/api/image/search?q=${encodeURIComponent(query)}&n=${count}`);
  const json = await res.json();

  if (!json.success) throw new Error(json.error || '검색 실패');

  const results = json.data?.results || [];
  if (!results.length) throw new Error('결과 없음');

  return shuffle(results);
};

export const downloadImages = async (query, results, filterId, frameId) => {
  const images = results.map((r) => ({
    url: r.link || r.imageUrl,
    title: r.title,
    fallbackUrls: [r.imageUrl, r.previewUrl].filter(Boolean),
  }));

  const filter = getStyle(FILTER_STYLES, filterId);
  const frame = getStyle(FRAME_STYLES, frameId);

  const res = await fetch(`${API_BASE}/api/image/bulk-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images,
      keyword: query,
      effectOptions: { filter, frame },
    }),
  });

  if (!res.ok) throw new Error('다운로드 실패');

  return res.blob();
};
