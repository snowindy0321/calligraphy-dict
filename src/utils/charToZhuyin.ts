import { pinyin } from 'pinyin-pro';

const INITIAL_MAP: Record<string, string> = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
  d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
  j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
  z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
};

const FINAL_MAP: Record<string, string> = {
  // 單韻母與複韻母
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ',
  ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ',
  er: 'ㄦ',
  // 齊齒呼 (i-)
  i: 'ㄧ',
  ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iai: 'ㄧㄞ',
  iao: 'ㄧㄠ', iu: 'ㄧㄡ', iou: 'ㄧㄡ',
  ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ',
  // 合口呼 (u-)
  u: 'ㄨ',
  ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
  ong: 'ㄨㄥ',
  // 撮口呼 (ü / v)
  ü: 'ㄩ', v: 'ㄩ',
  üe: 'ㄩㄝ', ve: 'ㄩㄝ',
  üan: 'ㄩㄢ', van: 'ㄩㄢ',
  ün: 'ㄩㄣ', vn: 'ㄩㄣ',
  iong: 'ㄩㄥ',
};

const TONE_MAP: Record<string, string> = {
  '1': '',
  '2': 'ˊ',
  '3': 'ˇ',
  '4': 'ˋ',
  '5': '˙',
  '0': '˙',
};

/**
 * 將單一漢語拼音含聲調數字（如 "yong3", "zhuang1", "lv4", "zhi1"）轉換為台灣標準注音符號
 */
export function singlePinyinToZhuyin(pyWithTone: string): string {
  const raw = pyWithTone.trim().toLowerCase();
  if (!raw) return '';

  const match = raw.match(/^([a-züvê]+)([0-5])?$/);
  if (!match) return '';

  let body = match[1];
  const toneNum = match[2] || '1';
  const toneMark = TONE_MAP[toneNum] ?? '';

  // 整體認讀音節特例處理
  const wholeSyllables: Record<string, string> = {
    zhi: 'ㄓ', chi: 'ㄔ', shi: 'ㄕ', ri: 'ㄖ',
    zi: 'ㄗ', ci: 'ㄘ', si: 'ㄙ',
    yi: 'ㄧ', wu: 'ㄨ', yu: 'ㄩ',
    ye: 'ㄧㄝ', yue: 'ㄩㄝ', yuan: 'ㄩㄢ',
    yin: 'ㄧㄣ', yun: 'ㄩㄣ', ying: 'ㄧㄥ',
    yo: 'ㄧㄛ',
  };

  if (wholeSyllables[body]) {
    return wholeSyllables[body] + toneMark;
  }

  // y, w 開頭轉換為 i, u, ü
  if (body.startsWith('yu')) {
    body = 'ü' + body.slice(2);
  } else if (body.startsWith('y')) {
    body = 'i' + body.slice(1);
  } else if (body.startsWith('w')) {
    body = 'u' + body.slice(1);
  }

  // 分離聲母
  let initial = '';
  let rest = body;
  for (const ini of ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's']) {
    if (body.startsWith(ini)) {
      initial = ini;
      rest = body.slice(ini.length);
      break;
    }
  }

  // j, q, x 後方的 u 實為 ü
  if ((initial === 'j' || initial === 'q' || initial === 'x') && rest.startsWith('u')) {
    rest = 'ü' + rest.slice(1);
  }

  const zhuyinInitial = INITIAL_MAP[initial] || '';
  const zhuyinFinal = FINAL_MAP[rest] || '';

  if (!zhuyinInitial && !zhuyinFinal) return '';
  return `${zhuyinInitial}${zhuyinFinal}${toneMark}`;
}

/**
 * 輸入單一中文字，自動回傳常見注音讀音陣列（第一項為最常用讀音，支援破音字候選）
 */
export function getZhuyinCandidates(char: string): string[] {
  const firstChar = Array.from(char.trim())[0];
  if (!firstChar || !/[\u4e00-\u9fff]/.test(firstChar)) return [];

  try {
    const pyList = pinyin(firstChar, {
      toneType: 'num',
      multiple: true,
      type: 'array',
    });

    const results: string[] = [];
    for (const py of pyList) {
      const zy = singlePinyinToZhuyin(py);
      if (zy && !results.includes(zy)) {
        results.push(zy);
      }
    }
    return results;
  } catch {
    return [];
  }
}
