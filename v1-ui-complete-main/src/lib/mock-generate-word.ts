// Local mock "AI" generator for the 自动生成 flow.
// No network calls — pure deterministic mock data suitable for use in China
// without VPN. Replace with a real API later without changing the UI.

export interface GeneratedWordDraft {
  pronunciation: string;
  chineseMeaning: string;
  thaiExample: string;
  chineseExample: string;
  category: string; // id from built-in categories or "mine"
  difficulty: number; // 1..3
}

interface MockEntry {
  match: string[]; // thai word or chinese hint substrings (lowercased)
  data: GeneratedWordDraft;
}

// A tiny curated mock dictionary. If nothing matches we fall back to a
// safe placeholder — never undefined/null/NaN.
const MOCK_ENTRIES: MockEntry[] = [
  {
    match: ["หมูกระทะ", "烤肉", "火锅"],
    data: {
      pronunciation: "mǔu grà-thá",
      chineseMeaning: "泰式烤肉火锅",
      thaiExample: "ฉันชอบกินหมูกระทะ",
      chineseExample: "我喜欢吃泰式烤肉火锅",
      category: "food",
      difficulty: 2,
    },
  },
  {
    match: ["สวัสดี", "你好", "hello"],
    data: {
      pronunciation: "sà-wàt-dii",
      chineseMeaning: "你好",
      thaiExample: "สวัสดีครับ ยินดีที่ได้รู้จัก",
      chineseExample: "你好，很高兴认识你。",
      category: "greetings",
      difficulty: 1,
    },
  },
  {
    match: ["ขอบคุณ", "谢谢"],
    data: {
      pronunciation: "kɔ̀ɔp-khun",
      chineseMeaning: "谢谢",
      thaiExample: "ขอบคุณมากครับ",
      chineseExample: "非常感谢。",
      category: "greetings",
      difficulty: 1,
    },
  },
  {
    match: ["ข้าวผัด", "炒饭"],
    data: {
      pronunciation: "khâao-phàt",
      chineseMeaning: "炒饭",
      thaiExample: "ฉันสั่งข้าวผัดหนึ่งจาน",
      chineseExample: "我点了一盘炒饭。",
      category: "food",
      difficulty: 1,
    },
  },
  {
    match: ["ต้มยำ", "冬阴"],
    data: {
      pronunciation: "tôm-yam",
      chineseMeaning: "冬阴（酸辣汤）",
      thaiExample: "ต้มยำกุ้งเป็นอาหารที่มีชื่อเสียง",
      chineseExample: "冬阴功是很有名的菜。",
      category: "food",
      difficulty: 2,
    },
  },
  {
    match: ["โรงแรม", "酒店", "旅馆"],
    data: {
      pronunciation: "roong-rɛɛm",
      chineseMeaning: "酒店；旅馆",
      thaiExample: "โรงแรมนี้อยู่ใกล้ชายหาด",
      chineseExample: "这家酒店离海滩很近。",
      category: "travel",
      difficulty: 2,
    },
  },
  {
    match: ["สนามบิน", "机场"],
    data: {
      pronunciation: "sà-nǎam-bin",
      chineseMeaning: "机场",
      thaiExample: "ฉันจะไปสนามบินพรุ่งนี้",
      chineseExample: "我明天要去机场。",
      category: "travel",
      difficulty: 2,
    },
  },
];

function pickByScenario(scenario: string): Partial<GeneratedWordDraft> {
  const s = scenario.toLowerCase();
  if (/(餐厅|食|吃|饭|food)/.test(s)) return { category: "food" };
  if (/(旅|游|机场|酒店|travel)/.test(s)) return { category: "travel" };
  if (/(聊天|问候|日常|greet)/.test(s)) return { category: "greetings" };
  if (/(购物|买|shop)/.test(s)) return { category: "shopping" };
  if (/(数字|number)/.test(s)) return { category: "numbers" };
  return {};
}

export function mockGenerateWord(input: {
  thaiWord: string;
  chineseHint?: string;
  scenario?: string;
}): GeneratedWordDraft {
  const key = `${input.thaiWord} ${input.chineseHint ?? ""}`.toLowerCase();
  const found = MOCK_ENTRIES.find((entry) =>
    entry.match.some((m) => key.includes(m.toLowerCase())),
  );

  if (found) {
    const override = input.scenario ? pickByScenario(input.scenario) : {};
    return { ...found.data, ...override };
  }

  // Placeholder fallback — always safe, never undefined/null/NaN.
  const scenarioOverride = input.scenario ? pickByScenario(input.scenario) : {};
  const thai = input.thaiWord.trim() || "คำใหม่";
  const meaning = input.chineseHint?.trim() || "示例释义";

  return {
    pronunciation: "示例发音",
    chineseMeaning: meaning,
    thaiExample: `นี่คือ${thai}`,
    chineseExample: `这是${meaning}的示例句子。`,
    category: scenarioOverride.category ?? "mine",
    difficulty: 2,
  };
}
