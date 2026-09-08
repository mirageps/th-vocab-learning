// Local vocabulary dataset (MVP). Structured so a remote backend
// (Supabase/self-hosted) can replace this module later without UI changes.

export type CategoryId =
  | "food"
  | "daily"
  | "travel"
  | "shopping"
  | "work"
  | "conversation";

export type LevelId = "beginner" | "intermediate" | "advanced";

export interface Category {
  id: CategoryId;
  thai: string;
  chinese: string;
  emoji: string;
  /** premium categories are locked in the free tier */
  premium?: boolean;
}

export interface VocabularyWord {
  id: number;
  thai: string;
  pronunciation: string;
  chinese: string;
  category: CategoryId;
  level: LevelId;
  exampleThai: string;
  exampleChinese: string;
  audio: string; // reserved for future hosted audio; empty => use TTS
  difficulty: number; // 1 (easy) .. 3 (hard)
  premium?: boolean; // reserved for future monetization
}

export const categories: Category[] = [
  { id: "food", thai: "อาหาร", chinese: "食物", emoji: "🍜" },
  { id: "daily", thai: "ชีวิตประจำวัน", chinese: "日常生活", emoji: "🏠" },
  { id: "travel", thai: "ท่องเที่ยว", chinese: "旅游", emoji: "✈️" },
  { id: "shopping", thai: "ช้อปปิ้ง", chinese: "购物", emoji: "🛍️" },
  { id: "work", thai: "การทำงาน", chinese: "工作", emoji: "💼", premium: true },
  { id: "conversation", thai: "การสนทนา", chinese: "日常会话", emoji: "💬" },
];

export const categoryMap: Record<CategoryId, Category> = categories.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export const vocabulary: VocabularyWord[] = [
  // ---------- Food 食物 ----------
  { id: 1, thai: "กิน", pronunciation: "gin", chinese: "吃", category: "food", level: "beginner", exampleThai: "ฉันกินข้าว", exampleChinese: "我吃饭", audio: "", difficulty: 1 },
  { id: 2, thai: "ข้าว", pronunciation: "khâao", chinese: "米饭", category: "food", level: "beginner", exampleThai: "ข้าวอร่อยมาก", exampleChinese: "米饭很好吃", audio: "", difficulty: 1 },
  { id: 3, thai: "น้ำ", pronunciation: "náam", chinese: "水", category: "food", level: "beginner", exampleThai: "ขอน้ำหนึ่งแก้ว", exampleChinese: "请给我一杯水", audio: "", difficulty: 1 },
  { id: 4, thai: "อาหาร", pronunciation: "aa-hǎan", chinese: "食物", category: "food", level: "beginner", exampleThai: "อาหารไทยอร่อย", exampleChinese: "泰国菜很好吃", audio: "", difficulty: 2 },
  { id: 5, thai: "ผลไม้", pronunciation: "phǒn-la-máai", chinese: "水果", category: "food", level: "beginner", exampleThai: "ฉันชอบกินผลไม้", exampleChinese: "我喜欢吃水果", audio: "", difficulty: 2 },
  { id: 6, thai: "เนื้อ", pronunciation: "núea", chinese: "肉", category: "food", level: "beginner", exampleThai: "เนื้อวัวแพง", exampleChinese: "牛肉很贵", audio: "", difficulty: 1 },
  { id: 7, thai: "ไข่", pronunciation: "khài", chinese: "鸡蛋", category: "food", level: "beginner", exampleThai: "ไข่ต้มหนึ่งฟอง", exampleChinese: "一个煮鸡蛋", audio: "", difficulty: 1 },
  { id: 8, thai: "กาแฟ", pronunciation: "gaa-fae", chinese: "咖啡", category: "food", level: "beginner", exampleThai: "ฉันดื่มกาแฟทุกเช้า", exampleChinese: "我每天早上喝咖啡", audio: "", difficulty: 1 },
  { id: 9, thai: "ชา", pronunciation: "chaa", chinese: "茶", category: "food", level: "beginner", exampleThai: "ชาไทยหวานมาก", exampleChinese: "泰式奶茶很甜", audio: "", difficulty: 1 },
  { id: 10, thai: "เผ็ด", pronunciation: "phèt", chinese: "辣", category: "food", level: "beginner", exampleThai: "อาหารนี้เผ็ดมาก", exampleChinese: "这道菜很辣", audio: "", difficulty: 2 },
  { id: 11, thai: "อร่อย", pronunciation: "a-ròi", chinese: "好吃", category: "food", level: "beginner", exampleThai: "ต้มยำกุ้งอร่อย", exampleChinese: "冬阴功很好吃", audio: "", difficulty: 2 },
  { id: 12, thai: "หิว", pronunciation: "hǐu", chinese: "饿", category: "food", level: "beginner", exampleThai: "ฉันหิวข้าว", exampleChinese: "我饿了", audio: "", difficulty: 1 },

  // ---------- Daily life 日常生活 ----------
  { id: 13, thai: "ไป", pronunciation: "bpai", chinese: "去", category: "daily", level: "beginner", exampleThai: "ฉันไปโรงเรียน", exampleChinese: "我去学校", audio: "", difficulty: 1 },
  { id: 14, thai: "มา", pronunciation: "maa", chinese: "来", category: "daily", level: "beginner", exampleThai: "เขามาบ้านฉัน", exampleChinese: "他来我家", audio: "", difficulty: 1 },
  { id: 15, thai: "นอน", pronunciation: "naawn", chinese: "睡觉", category: "daily", level: "beginner", exampleThai: "ฉันนอนดึก", exampleChinese: "我睡得很晚", audio: "", difficulty: 1 },
  { id: 16, thai: "ทำ", pronunciation: "tham", chinese: "做", category: "daily", level: "beginner", exampleThai: "คุณทำอะไร", exampleChinese: "你在做什么", audio: "", difficulty: 1 },
  { id: 17, thai: "พูด", pronunciation: "phûut", chinese: "说", category: "daily", level: "beginner", exampleThai: "ฉันพูดภาษาไทย", exampleChinese: "我说泰语", audio: "", difficulty: 2 },
  { id: 18, thai: "อ่าน", pronunciation: "àan", chinese: "读", category: "daily", level: "beginner", exampleThai: "ฉันอ่านหนังสือ", exampleChinese: "我看书", audio: "", difficulty: 1 },
  { id: 19, thai: "เขียน", pronunciation: "khǐan", chinese: "写", category: "daily", level: "beginner", exampleThai: "เด็กเขียนหนังสือ", exampleChinese: "孩子在写字", audio: "", difficulty: 2 },
  { id: 20, thai: "ดู", pronunciation: "duu", chinese: "看", category: "daily", level: "beginner", exampleThai: "ฉันดูหนัง", exampleChinese: "我看电影", audio: "", difficulty: 1 },
  { id: 21, thai: "ฟัง", pronunciation: "fang", chinese: "听", category: "daily", level: "beginner", exampleThai: "ฉันฟังเพลง", exampleChinese: "我听音乐", audio: "", difficulty: 1 },
  { id: 22, thai: "เดิน", pronunciation: "dooen", chinese: "走路", category: "daily", level: "beginner", exampleThai: "ฉันเดินไปทำงาน", exampleChinese: "我走路去上班", audio: "", difficulty: 1 },
  { id: 23, thai: "วิ่ง", pronunciation: "wîng", chinese: "跑", category: "daily", level: "beginner", exampleThai: "เขาวิ่งเร็วมาก", exampleChinese: "他跑得很快", audio: "", difficulty: 1 },
  { id: 24, thai: "บ้าน", pronunciation: "bâan", chinese: "家", category: "daily", level: "beginner", exampleThai: "บ้านของฉันใหญ่", exampleChinese: "我的家很大", audio: "", difficulty: 1 },

  // ---------- Travel 旅游 ----------
  { id: 25, thai: "โรงแรม", pronunciation: "roong-raem", chinese: "酒店", category: "travel", level: "beginner", exampleThai: "โรงแรมนี้สวย", exampleChinese: "这家酒店很漂亮", audio: "", difficulty: 2 },
  { id: 26, thai: "สนามบิน", pronunciation: "sa-nǎam-bin", chinese: "机场", category: "travel", level: "intermediate", exampleThai: "ฉันไปสนามบิน", exampleChinese: "我去机场", audio: "", difficulty: 3 },
  { id: 27, thai: "รถไฟ", pronunciation: "rót-fai", chinese: "火车", category: "travel", level: "beginner", exampleThai: "รถไฟมาแล้ว", exampleChinese: "火车来了", audio: "", difficulty: 2 },
  { id: 28, thai: "รถ", pronunciation: "rót", chinese: "车", category: "travel", level: "beginner", exampleThai: "รถของฉันสีแดง", exampleChinese: "我的车是红色的", audio: "", difficulty: 1 },
  { id: 29, thai: "เครื่องบิน", pronunciation: "khrûeang-bin", chinese: "飞机", category: "travel", level: "intermediate", exampleThai: "เครื่องบินขึ้นแล้ว", exampleChinese: "飞机起飞了", audio: "", difficulty: 3 },
  { id: 30, thai: "ทะเล", pronunciation: "tha-lee", chinese: "海", category: "travel", level: "beginner", exampleThai: "ฉันชอบทะเล", exampleChinese: "我喜欢大海", audio: "", difficulty: 2 },
  { id: 31, thai: "ภูเขา", pronunciation: "phuu-khǎo", chinese: "山", category: "travel", level: "beginner", exampleThai: "ภูเขาสูงมาก", exampleChinese: "山很高", audio: "", difficulty: 2 },
  { id: 32, thai: "แผนที่", pronunciation: "phǎen-thîi", chinese: "地图", category: "travel", level: "intermediate", exampleThai: "ขอดูแผนที่หน่อย", exampleChinese: "请让我看一下地图", audio: "", difficulty: 3 },
  { id: 33, thai: "กระเป๋า", pronunciation: "gra-bpǎo", chinese: "包/行李", category: "travel", level: "beginner", exampleThai: "กระเป๋าของฉันหนัก", exampleChinese: "我的包很重", audio: "", difficulty: 2 },
  { id: 34, thai: "ตั๋ว", pronunciation: "dtǔa", chinese: "票", category: "travel", level: "beginner", exampleThai: "ฉันซื้อตั๋ว", exampleChinese: "我买票", audio: "", difficulty: 1 },

  // ---------- Shopping 购物 ----------
  { id: 35, thai: "ซื้อ", pronunciation: "súe", chinese: "买", category: "shopping", level: "beginner", exampleThai: "ฉันซื้อเสื้อ", exampleChinese: "我买衣服", audio: "", difficulty: 1 },
  { id: 36, thai: "ขาย", pronunciation: "khǎai", chinese: "卖", category: "shopping", level: "beginner", exampleThai: "ร้านนี้ขายผลไม้", exampleChinese: "这家店卖水果", audio: "", difficulty: 1 },
  { id: 37, thai: "เงิน", pronunciation: "ngoen", chinese: "钱", category: "shopping", level: "beginner", exampleThai: "ฉันไม่มีเงิน", exampleChinese: "我没有钱", audio: "", difficulty: 2 },
  { id: 38, thai: "ราคา", pronunciation: "raa-khaa", chinese: "价格", category: "shopping", level: "beginner", exampleThai: "ราคาเท่าไหร่", exampleChinese: "多少钱", audio: "", difficulty: 2 },
  { id: 39, thai: "แพง", pronunciation: "phaeng", chinese: "贵", category: "shopping", level: "beginner", exampleThai: "อันนี้แพงมาก", exampleChinese: "这个很贵", audio: "", difficulty: 1 },
  { id: 40, thai: "ถูก", pronunciation: "thùuk", chinese: "便宜", category: "shopping", level: "beginner", exampleThai: "อันนี้ถูกมาก", exampleChinese: "这个很便宜", audio: "", difficulty: 1 },
  { id: 41, thai: "ร้าน", pronunciation: "ráan", chinese: "商店", category: "shopping", level: "beginner", exampleThai: "ร้านนี้เปิดแล้ว", exampleChinese: "这家店开门了", audio: "", difficulty: 1 },
  { id: 42, thai: "เสื้อ", pronunciation: "sûea", chinese: "衣服", category: "shopping", level: "beginner", exampleThai: "เสื้อสีขาว", exampleChinese: "白色的衣服", audio: "", difficulty: 1 },
  { id: 43, thai: "รองเท้า", pronunciation: "raawng-tháo", chinese: "鞋子", category: "shopping", level: "beginner", exampleThai: "รองเท้าคู่นี้สวย", exampleChinese: "这双鞋很漂亮", audio: "", difficulty: 2 },
  { id: 44, thai: "ตลาด", pronunciation: "dta-làat", chinese: "市场", category: "shopping", level: "beginner", exampleThai: "ฉันไปตลาด", exampleChinese: "我去市场", audio: "", difficulty: 2 },

  // ---------- Work 工作 (premium) ----------
  { id: 45, thai: "งาน", pronunciation: "ngaan", chinese: "工作", category: "work", level: "beginner", exampleThai: "งานเยอะมาก", exampleChinese: "工作很多", audio: "", difficulty: 1, premium: true },
  { id: 46, thai: "ทำงาน", pronunciation: "tham-ngaan", chinese: "上班", category: "work", level: "beginner", exampleThai: "ฉันทำงานที่กรุงเทพ", exampleChinese: "我在曼谷上班", audio: "", difficulty: 2, premium: true },
  { id: 47, thai: "บริษัท", pronunciation: "baaw-ri-sàt", chinese: "公司", category: "work", level: "intermediate", exampleThai: "บริษัทของฉันใหญ่", exampleChinese: "我的公司很大", audio: "", difficulty: 3, premium: true },
  { id: 48, thai: "ประชุม", pronunciation: "bpra-chum", chinese: "会议", category: "work", level: "intermediate", exampleThai: "วันนี้มีประชุม", exampleChinese: "今天有会议", audio: "", difficulty: 3, premium: true },
  { id: 49, thai: "เงินเดือน", pronunciation: "ngoen-duean", chinese: "工资", category: "work", level: "intermediate", exampleThai: "เงินเดือนออกแล้ว", exampleChinese: "工资发了", audio: "", difficulty: 3, premium: true },
  { id: 50, thai: "เจ้านาย", pronunciation: "jâo-naai", chinese: "老板", category: "work", level: "intermediate", exampleThai: "เจ้านายใจดี", exampleChinese: "老板很好", audio: "", difficulty: 3, premium: true },
  { id: 51, thai: "โทรศัพท์", pronunciation: "thoo-ra-sàp", chinese: "电话", category: "work", level: "intermediate", exampleThai: "โทรศัพท์ของฉันเสีย", exampleChinese: "我的电话坏了", audio: "", difficulty: 3, premium: true },
  { id: 52, thai: "อีเมล", pronunciation: "ii-meel", chinese: "电子邮件", category: "work", level: "intermediate", exampleThai: "ส่งอีเมลให้ฉัน", exampleChinese: "给我发邮件", audio: "", difficulty: 2, premium: true },

  // ---------- Conversation 日常会话 ----------
  { id: 53, thai: "สวัสดี", pronunciation: "sa-wàt-dii", chinese: "你好", category: "conversation", level: "beginner", exampleThai: "สวัสดีครับ", exampleChinese: "你好", audio: "", difficulty: 2 },
  { id: 54, thai: "ขอบคุณ", pronunciation: "khàawp-khun", chinese: "谢谢", category: "conversation", level: "beginner", exampleThai: "ขอบคุณมาก", exampleChinese: "非常感谢", audio: "", difficulty: 2 },
  { id: 55, thai: "ขอโทษ", pronunciation: "khǎaw-thôot", chinese: "对不起", category: "conversation", level: "beginner", exampleThai: "ขอโทษครับ", exampleChinese: "对不起", audio: "", difficulty: 2 },
  { id: 56, thai: "ใช่", pronunciation: "châi", chinese: "是", category: "conversation", level: "beginner", exampleThai: "ใช่ ถูกต้อง", exampleChinese: "是的，对", audio: "", difficulty: 1 },
  { id: 57, thai: "ไม่", pronunciation: "mâi", chinese: "不", category: "conversation", level: "beginner", exampleThai: "ไม่เป็นไร", exampleChinese: "没关系", audio: "", difficulty: 1 },
  { id: 58, thai: "ดี", pronunciation: "dii", chinese: "好", category: "conversation", level: "beginner", exampleThai: "สบายดีไหม", exampleChinese: "你好吗", audio: "", difficulty: 1 },
  { id: 59, thai: "ชื่อ", pronunciation: "chûe", chinese: "名字", category: "conversation", level: "beginner", exampleThai: "คุณชื่ออะไร", exampleChinese: "你叫什么名字", audio: "", difficulty: 1 },
  { id: 60, thai: "รัก", pronunciation: "rák", chinese: "爱", category: "conversation", level: "beginner", exampleThai: "ฉันรักคุณ", exampleChinese: "我爱你", audio: "", difficulty: 1 },
  { id: 61, thai: "เพื่อน", pronunciation: "phûean", chinese: "朋友", category: "conversation", level: "beginner", exampleThai: "เขาเป็นเพื่อนฉัน", exampleChinese: "他是我的朋友", audio: "", difficulty: 2 },
  { id: 62, thai: "ช่วย", pronunciation: "chûai", chinese: "帮助", category: "conversation", level: "beginner", exampleThai: "ช่วยฉันหน่อย", exampleChinese: "请帮我一下", audio: "", difficulty: 1 },
];

export const getWordById = (id: number) =>
  vocabulary.find((w) => w.id === id);

export const wordsByCategory = (id: CategoryId) =>
  vocabulary.filter((w) => w.category === id);
