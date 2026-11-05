import { CalligraphyEntry } from '../types';

function createCalligraphySvgDataUri(char: string, source: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#FFFFFF"/>
    <!-- 九宮格淡紅輔助線 -->
    <line x1="0" y1="133" x2="400" y2="133" stroke="#E5D5C5" stroke-width="1" stroke-dasharray="6,6"/>
    <line x1="0" y1="266" x2="400" y2="266" stroke="#E5D5C5" stroke-width="1" stroke-dasharray="6,6"/>
    <line x1="133" y1="0" x2="133" y2="400" stroke="#E5D5C5" stroke-width="1" stroke-dasharray="6,6"/>
    <line x1="266" y1="0" x2="266" y2="400" stroke="#E5D5C5" stroke-width="1" stroke-dasharray="6,6"/>
    <rect x="8" y="8" width="384" height="384" fill="none" stroke="#D8C8B8" stroke-width="2"/>
    <text x="200" y="275" font-family="'Noto Serif TC', 'Kaiti TC', 'STKaiti', 'BiauKai', serif" font-size="230" font-weight="700" fill="#1C1B19" text-anchor="middle">${char}</text>
    <rect x="326" y="324" width="46" height="46" rx="4" fill="#B83B2B" opacity="0.88"/>
    <text x="349" y="355" font-family="serif" font-size="22" fill="#FAF8F5" text-anchor="middle">${source.slice(0, 1)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_DEMO_ENTRIES: CalligraphyEntry[] = [
  {
    id: 'demo-1',
    char: '永',
    zhuyin: 'ㄩㄥˇ',
    bopomofo_initial: 'ㄩ',
    source_name: '蘭亭序・王羲之',
    script_type: '行書',
    image_url: createCalligraphySvgDataUri('永', '蘭'),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-2',
    char: '和',
    zhuyin: 'ㄏㄜˊ',
    bopomofo_initial: 'ㄏ',
    source_name: '蘭亭序・王羲之',
    script_type: '行書',
    image_url: createCalligraphySvgDataUri('和', '蘭'),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'demo-3',
    char: '風',
    zhuyin: 'ㄈㄥ',
    bopomofo_initial: 'ㄈ',
    source_name: '九成宮醴泉銘・歐陽詢',
    script_type: '楷書',
    image_url: createCalligraphySvgDataUri('風', '歐'),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-4',
    char: '竹',
    zhuyin: 'ㄓㄨˊ',
    bopomofo_initial: 'ㄓ',
    source_name: '多寶塔碑・顏真卿',
    script_type: '楷書',
    image_url: createCalligraphySvgDataUri('竹', '顏'),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-5',
    char: '清',
    zhuyin: 'ㄑㄧㄥ',
    bopomofo_initial: 'ㄑ',
    source_name: '赤壁賦・趙孟頫',
    script_type: '行書',
    image_url: createCalligraphySvgDataUri('清', '趙'),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'demo-6',
    char: '靜',
    zhuyin: 'ㄐㄧㄥˋ',
    bopomofo_initial: 'ㄐ',
    source_name: '寒食帖・蘇軾',
    script_type: '行書',
    image_url: createCalligraphySvgDataUri('靜', '蘇'),
    created_at: new Date().toISOString(),
  },
];
