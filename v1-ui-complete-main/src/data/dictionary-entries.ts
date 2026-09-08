// Curated extra entries for the central Thai↔Chinese dictionary repository.
//
// This file is *data only*. It is merged with the built-in study vocabulary
// (src/data/vocabulary.ts) and the tier-3 local dictionary
// (src/data/local-dictionary.ts) by src/lib/dictionary.ts.
//
// Shape is intentionally close to what a real backend table / JSON / CSV
// import would produce, so a future `loadDictionaryEntries()` implementation
// can fetch rows instead of importing this module without any UI change.
//
// Never add per-word if/else logic anywhere — add rows here instead.

/** One meaning of a word: 中文释义 + 词性 + example pair. */
export interface DictionarySense {
  chinese: string;
  partOfSpeech?: string;
  thaiExample?: string;
  chineseExample?: string;
}

export interface RawDictionaryEntry {
  id?: string;
  thaiWord: string;
  pronunciation?: string;
  /** multiple meanings, each with its own 词性 / examples */
  senses: DictionarySense[];
  category?: string;
  tags?: string[];
  difficulty?: number; // 1..3
  createdAt?: number;
  updatedAt?: number;
}

export const dictionaryEntries: RawDictionaryEntry[] = [
  {
    thaiWord: "เข้า",
    pronunciation: "khâo",
    difficulty: 2,
    category: "daily",
    tags: ["动词", "高频"],
    senses: [
      {
        chinese: "进入",
        partOfSpeech: "动词",
        thaiExample: "เขาเข้าห้องแล้ว",
        chineseExample: "他已经进房间了。",
      },
      {
        chinese: "加入；参加",
        partOfSpeech: "动词",
        thaiExample: "ฉันอยากเข้าชมรมภาษาไทย",
        chineseExample: "我想加入泰语社团。",
      },
      {
        chinese: "理解；听得懂",
        partOfSpeech: "动词",
        thaiExample: "ฟังไม่เข้าใจ",
        chineseExample: "听不懂。",
      },
      {
        chinese: "相合；搭配得来",
        partOfSpeech: "动词",
        thaiExample: "สีนี้เข้ากับเสื้อของคุณ",
        chineseExample: "这个颜色和你的衣服很搭。",
      },
    ],
  },
  {
    thaiWord: "กิน",
    pronunciation: "gin",
    difficulty: 1,
    category: "food",
    tags: ["动词", "高频"],
    senses: [
      {
        chinese: "吃",
        partOfSpeech: "动词",
        thaiExample: "ฉันกินข้าวแล้ว",
        chineseExample: "我吃过饭了。",
      },
      {
        chinese: "食用；服用",
        partOfSpeech: "动词",
        thaiExample: "กินยาหลังอาหาร",
        chineseExample: "饭后服药。",
      },
      {
        chinese: "耗费（时间、电等）",
        partOfSpeech: "动词",
        thaiExample: "งานนี้กินเวลามาก",
        chineseExample: "这项工作很耗时间。",
      },
    ],
  },
  {
    thaiWord: "กินข้าว",
    pronunciation: "gin khâao",
    difficulty: 1,
    category: "food",
    tags: ["短语", "日常"],
    senses: [
      {
        chinese: "吃饭",
        partOfSpeech: "动词短语",
        thaiExample: "ไปกินข้าวกันไหม",
        chineseExample: "一起去吃饭吗？",
      },
    ],
  },
  {
    thaiWord: "ไป",
    pronunciation: "bpai",
    difficulty: 1,
    category: "travel",
    tags: ["动词", "高频"],
    senses: [
      {
        chinese: "去；前往",
        partOfSpeech: "动词",
        thaiExample: "ฉันจะไปตลาด",
        chineseExample: "我要去市场。",
      },
      {
        chinese: "（表示离开说话人的方向）过去",
        partOfSpeech: "助词",
        thaiExample: "เอาไปเลย",
        chineseExample: "拿走吧。",
      },
    ],
  },
  {
    thaiWord: "เอา",
    pronunciation: "ao",
    difficulty: 2,
    category: "daily",
    tags: ["动词", "高频"],
    senses: [
      {
        chinese: "拿；取",
        partOfSpeech: "动词",
        thaiExample: "เอาหนังสือมาให้ฉันหน่อย",
        chineseExample: "把书拿给我。",
      },
      {
        chinese: "要；想要",
        partOfSpeech: "动词",
        thaiExample: "คุณเอาอันไหน",
        chineseExample: "你要哪一个？",
      },
    ],
  },
  {
    thaiWord: "ลด",
    pronunciation: "lót",
    difficulty: 2,
    category: "shopping",
    tags: ["动词", "购物"],
    senses: [
      {
        chinese: "减少；降低",
        partOfSpeech: "动词",
        thaiExample: "ลดความเร็วหน่อย",
        chineseExample: "把速度降低一点。",
      },
      {
        chinese: "打折；减价",
        partOfSpeech: "动词",
        thaiExample: "ร้านนี้ลดราคา 50%",
        chineseExample: "这家店打五折。",
      },
    ],
  },
  {
    thaiWord: "ราคา",
    pronunciation: "raa-khaa",
    difficulty: 1,
    category: "shopping",
    tags: ["名词", "购物"],
    senses: [
      {
        chinese: "价格；价钱",
        partOfSpeech: "名词",
        thaiExample: "ราคาเท่าไหร่ครับ",
        chineseExample: "多少钱？",
      },
    ],
  },
  {
    thaiWord: "งาน",
    pronunciation: "ngaan",
    difficulty: 2,
    category: "work",
    tags: ["名词"],
    senses: [
      {
        chinese: "工作",
        partOfSpeech: "名词",
        thaiExample: "วันนี้งานเยอะมาก",
        chineseExample: "今天工作很多。",
      },
      {
        chinese: "活动；宴会",
        partOfSpeech: "名词",
        thaiExample: "งานแต่งงานจัดที่โรงแรม",
        chineseExample: "婚礼在酒店举办。",
      },
    ],
  },
  {
    thaiWord: "เรียน",
    pronunciation: "rian",
    difficulty: 1,
    category: "daily",
    tags: ["动词", "学习"],
    senses: [
      {
        chinese: "学习",
        partOfSpeech: "动词",
        thaiExample: "ฉันเรียนภาษาไทย",
        chineseExample: "我学泰语。",
      },
      {
        chinese: "敬启（书信开头的敬语）",
        partOfSpeech: "敬语",
        thaiExample: "เรียน ผู้จัดการ",
        chineseExample: "尊敬的经理：",
      },
    ],
  },
  {
    thaiWord: "รถ",
    pronunciation: "rót",
    difficulty: 1,
    category: "travel",
    tags: ["名词", "交通"],
    senses: [
      {
        chinese: "车；车辆",
        partOfSpeech: "名词",
        thaiExample: "รถติดมาก",
        chineseExample: "堵车很严重。",
      },
    ],
  },
  {
    thaiWord: "น้ำ",
    pronunciation: "náam",
    difficulty: 1,
    category: "food",
    tags: ["名词"],
    senses: [
      {
        chinese: "水",
        partOfSpeech: "名词",
        thaiExample: "ขอน้ำหนึ่งแก้ว",
        chineseExample: "请给我一杯水。",
      },
      {
        chinese: "汁；液体",
        partOfSpeech: "名词",
        thaiExample: "น้ำส้มอร่อยมาก",
        chineseExample: "橙汁很好喝。",
      },
    ],
  },
  {
    thaiWord: "ร้อน",
    pronunciation: "rɔ́ɔn",
    difficulty: 1,
    category: "daily",
    tags: ["形容词", "天气"],
    senses: [
      {
        chinese: "热；烫",
        partOfSpeech: "形容词",
        thaiExample: "วันนี้อากาศร้อนมาก",
        chineseExample: "今天天气很热。",
      },
      {
        chinese: "着急；焦躁",
        partOfSpeech: "形容词",
        thaiExample: "ใจร้อนเกินไป",
        chineseExample: "太性急了。",
      },
    ],
  },
  {
    thaiWord: "สวย",
    pronunciation: "sǔai",
    difficulty: 1,
    category: "conversation",
    tags: ["形容词"],
    senses: [
      {
        chinese: "漂亮；美丽",
        partOfSpeech: "形容词",
        thaiExample: "วันนี้คุณสวยมาก",
        chineseExample: "你今天很漂亮。",
      },
    ],
  },
  {
    thaiWord: "โรงพยาบาล",
    pronunciation: "roong-phá-yaa-baan",
    difficulty: 3,
    category: "daily",
    tags: ["名词", "场所"],
    senses: [
      {
        chinese: "医院",
        partOfSpeech: "名词",
        thaiExample: "โรงพยาบาลอยู่ใกล้ไหม",
        chineseExample: "医院离这里近吗？",
      },
    ],
  },
  {
    thaiWord: "สนามบิน",
    pronunciation: "sà-nǎam-bin",
    difficulty: 2,
    category: "travel",
    tags: ["名词", "交通"],
    senses: [
      {
        chinese: "机场",
        partOfSpeech: "名词",
        thaiExample: "ไปสนามบินยังไงครับ",
        chineseExample: "怎么去机场？",
      },
    ],
  },
];
