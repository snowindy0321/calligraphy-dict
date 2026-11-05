/**
 * 台灣標準 37 個注音符號列表
 */
export const BOPOMOFO_SYMBOLS = [
  'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ',
  'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ',
  'ㄍ', 'ㄎ', 'ㄏ',
  'ㄐ', 'ㄑ', 'ㄒ',
  'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ',
  'ㄗ', 'ㄘ', 'ㄙ',
  'ㄧ', 'ㄨ', 'ㄩ',
  'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ',
  'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ',
  'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ',
  'ㄦ',
] as const;

export const SCRIPT_TYPES = [
  '',
  '楷書',
  '行書',
  '草書',
  '隸書',
  '篆書',
  '魏碑',
  '行草',
  '其他',
] as const;

/**
 * 自動擷取注音字串的第一個有效注音符號作為 bopomofo_initial
 * 若首字為輕聲符號（˙），則略過並提取第一個注音本體符號
 */
export function extractBopomofoInitial(zhuyin: string): string {
  const cleaned = zhuyin.trim().replace(/^[˙\s]+/, '');
  if (!cleaned) return '';
  return Array.from(cleaned)[0];
}
