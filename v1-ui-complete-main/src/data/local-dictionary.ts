// Tier-3 local dictionary. Extra Thai↔中文 entries that are NOT in the main
// `vocabulary` dataset but are common enough to auto-fill. This is *data*,
// not per-word if/else logic. Add rows freely; the lookup service reads it
// generically.
//
// Structure mirrors the shape lookupVocabulary returns, plus a normalized
// key so lookups stay O(n) without repeated string work.

export interface LocalDictionaryEntry {
  thaiWord: string;
  pronunciation: string;
  chineseMeaning: string;
  thaiExample: string;
  chineseExample: string;
  category: string; // built-in CategoryId or "mine"
  difficulty: number; // 1..3
}

export const localDictionary: LocalDictionaryEntry[] = [
  {
    thaiWord: "หมูกระทะ",
    pronunciation: "mǔu grà-thá",
    chineseMeaning: "泰式烤肉火锅",
    thaiExample: "ฉันชอบกินหมูกระทะ",
    chineseExample: "我喜欢吃泰式烤肉火锅。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ต้มยำ",
    pronunciation: "tôm-yam",
    chineseMeaning: "冬阴（酸辣汤）",
    thaiExample: "ต้มยำกุ้งเป็นอาหารที่มีชื่อเสียง",
    chineseExample: "冬阴功是很有名的菜。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ก๋วยเตี๋ยว",
    pronunciation: "gǔai-tǐao",
    chineseMeaning: "粿条；泰式河粉",
    thaiExample: "ฉันสั่งก๋วยเตี๋ยวหนึ่งชาม",
    chineseExample: "我点了一碗粿条。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ส้มตำ",
    pronunciation: "sôm-tam",
    chineseMeaning: "青木瓜沙拉",
    thaiExample: "ส้มตำเผ็ดมาก",
    chineseExample: "青木瓜沙拉很辣。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ผัดไทย",
    pronunciation: "phàt-thai",
    chineseMeaning: "泰式炒河粉",
    thaiExample: "ผัดไทยจานนี้อร่อยมาก",
    chineseExample: "这盘泰式炒河粉很好吃。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ข้าวผัด",
    pronunciation: "khâao-phàt",
    chineseMeaning: "炒饭",
    thaiExample: "ฉันสั่งข้าวผัดหนึ่งจาน",
    chineseExample: "我点了一盘炒饭。",
    category: "food",
    difficulty: 1,
  },
  {
    thaiWord: "มะม่วง",
    pronunciation: "má-mûang",
    chineseMeaning: "芒果",
    thaiExample: "มะม่วงสุกหวานมาก",
    chineseExample: "熟芒果很甜。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "ทุเรียน",
    pronunciation: "thú-rian",
    chineseMeaning: "榴莲",
    thaiExample: "ฉันไม่กินทุเรียน",
    chineseExample: "我不吃榴莲。",
    category: "food",
    difficulty: 2,
  },
  {
    thaiWord: "สบายดี",
    pronunciation: "sà-baai-dii",
    chineseMeaning: "（身体/心情）很好",
    thaiExample: "ฉันสบายดี ขอบคุณ",
    chineseExample: "我很好，谢谢。",
    category: "conversation",
    difficulty: 1,
  },
  {
    thaiWord: "ยินดีที่ได้รู้จัก",
    pronunciation: "yin-dii thîi dâai rúu-jàk",
    chineseMeaning: "很高兴认识你",
    thaiExample: "ยินดีที่ได้รู้จักครับ",
    chineseExample: "很高兴认识你。",
    category: "conversation",
    difficulty: 3,
  },
];
