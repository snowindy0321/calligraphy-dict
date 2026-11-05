export interface CalligraphyEntry {
  id: string;
  char: string;             // 中文字（例如：永）
  zhuyin: string;           // 完整注音（例如：ㄩㄥˇ）
  bopomofo_initial: string; // 注音首符號（例如：ㄩ）
  source_name: string | null; // 碑帖或作品名稱（選填，例如：蘭亭序）
  script_type: string | null; // 書體（選填，例如：行書、草書、楷書）
  image_url: string;        // 圖片於 Storage 的公開存取網址
  created_at: string;
}

export interface CreateCalligraphyInput {
  char: string;
  zhuyin: string;
  source_name?: string;
  script_type?: string;
  imageBlob: Blob;
}

export interface UpdateCalligraphyInput {
  id: string;
  char: string;
  zhuyin: string;
  source_name?: string;
  script_type?: string;
}
