import { FILTER_STYLES, FRAME_STYLES } from '../lib/constants.js';
import { searchImages, downloadImages } from '../lib/api.js';

const $ = (id) => document.getElementById(id);

let currentAnim = null;

const playLottie = (type) => {
  if (currentAnim) {
    currentAnim.destroy();
    currentAnim = null;
  }

  const container = $('lottie');
  container.innerHTML = '';

  if (!type) return;

  currentAnim = lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: type === 'loading',
    autoplay: true,
    path: `../lib/lottie/${type}.json`,
  });
};

const setStatus = (msg, type = '') => {
  $('status').textContent = msg;
  $('status').className = type;

  if (type === 'error') playLottie('error');
  else if (type === 'success') playLottie('success');
  else if (msg) playLottie('loading');
  else playLottie(null);
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
    const results = await searchImages(query);
    setStatus(`${results.length}개 찾음. 다운로드 준비 중...`);

    const blob = await downloadImages(query, results, $('filter').value, $('frame').value);

    setStatus('ZIP 생성 완료. 다운로드 중...');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${query}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus('완료!', 'success');
    setTimeout(() => setStatus(''), 3000);
  } catch (e) {
    setStatus(e.message, 'error');
  } finally {
    $('downloadBtn').disabled = false;
  }
};

document.addEventListener('DOMContentLoaded', init);
