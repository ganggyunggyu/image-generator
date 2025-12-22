import { FILTER_STYLES, FRAME_STYLES } from '../lib/constants.js';

const API = 'https://image-generator-dsga.vercel.app';
const $ = (id) => document.getElementById(id);

const setStatus = (msg, type = '') => {
  $('status').textContent = msg;
  $('status').className = type;
};

const getStyle = (styles, id) => {
  if (id === 'random') {
    const valid = styles.filter((s) => s.id !== 'none' && s.id !== 'random');
    return valid[Math.floor(Math.random() * valid.length)];
  }
  return styles.find((s) => s.id === id) || styles[0];
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const init = () => {
  FILTER_STYLES.forEach((f) => $('filter').add(new Option(f.name, f.id)));
  FRAME_STYLES.forEach((f) => $('frame').add(new Option(f.name, f.id)));

  $('downloadBtn').onclick = run;
  $('query').onkeypress = (e) => e.key === 'Enter' && run();
};

const run = async () => {
  const query = $('query').value.trim();
  if (!query) return setStatus('검색어 입력해', 'error');

  $('downloadBtn').disabled = true;
  setStatus('검색 중...');

  try {
    const res = await fetch(`${API}/api/image/search?q=${encodeURIComponent(query)}&n=50`);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || '검색 실패');

    const results = shuffle(json.data?.results || []);
    if (!results.length) throw new Error('결과 없음');

    setStatus(`${results.length}개 찾음. 다운로드 준비 중...`);

    const images = results.map((r) => ({
      url: r.link || r.imageUrl,
      title: r.title,
      fallbackUrls: [r.imageUrl, r.previewUrl].filter(Boolean),
    }));

    const filter = getStyle(FILTER_STYLES, $('filter').value);
    const frame = getStyle(FRAME_STYLES, $('frame').value);

    const dlRes = await fetch(`${API}/api/image/bulk-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images,
        keyword: query,
        effectOptions: { filter, frame },
      }),
    });

    if (!dlRes.ok) throw new Error('다운로드 실패');

    setStatus('ZIP 생성 완료. 다운로드 중...');

    const blob = await dlRes.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${query}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus('완료!', 'success');
  } catch (e) {
    setStatus(e.message, 'error');
  } finally {
    $('downloadBtn').disabled = false;
  }
};

document.addEventListener('DOMContentLoaded', init);
