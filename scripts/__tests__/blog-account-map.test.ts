import { describe, expect, it } from 'vitest';
import { resolveNaverId } from '../lib/blog-account-map';

describe('resolveNaverId', () => {
  it('사용자 최신 리스트 기준으로 이름을 blogId로 변환함', () => {
    expect(resolveNaverId('제아 - 영구정지')).toBe('biggoose488');
    expect(resolveNaverId('에스앤비안과 1')).toBe('nes1p2kx');
    expect(resolveNaverId('하준리뷰')).toBe('heavyzebra240');
    expect(resolveNaverId('미식가 2')).toBe('yenalk');
    expect(resolveNaverId('알리바바1')).toBe('weed3122');
    expect(resolveNaverId('알리바바2')).toBe('mad1651');
  });

  it('공백 차이가 있어도 교체 이름을 해석함', () => {
    expect(resolveNaverId('새로운 시작 - 교체')).toBe('dyust');
    expect(resolveNaverId('새로운 시작  - 교체')).toBe('dyust');
    expect(resolveNaverId('에스앤비안과의원 - 교체')).toBe('hagyga');
  });

  it('알리바바 숫자 폴더를 실제 blogId로 해석함', () => {
    expect(resolveNaverId('1')).toBe('weed3122');
    expect(resolveNaverId('2')).toBe('mad1651');
    expect(resolveNaverId('3')).toBe('chemical12568');
    expect(resolveNaverId('4')).toBe('copy11525');
    expect(resolveNaverId('5')).toBe('individual14144');
  });

  it('이미 blogId 형식이면 그대로 반환하고, 모르는 이름은 빈 문자열을 반환함', () => {
    expect(resolveNaverId('angrykoala270')).toBe('angrykoala270');
    expect(resolveNaverId('없는 블로그명')).toBe('');
  });
});
