import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

/**
 * CookieChatBot — a self-contained, rule-based chat widget for made.by.bareket.
 * No API key, no server, no external UI libraries. Just drop <CookieChatBot />
 * anywhere inside your app (e.g. in App.tsx or Home.tsx) and it renders a
 * floating launcher in the corner of the page.
 */

type Cookie = {
  name: string;
  price: number;
  tags: string[];
  desc: string;
};

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
  packageItems?: { cookie: Cookie; qty: number }[];
  packagePrice?: number;
  link?: { label: string; url: string };
};

const COOKIES: Cookie[] = [
  { name: "קינדר", price: 17, tags: ["chocolate", "crunchy", "kids"], desc: "עוגיית שוקולד עשירה עם פירורי קינדר ומילוי קרמי" },
  { name: "אוראו", price: 17, tags: ["chocolate", "crunchy", "classic"], desc: "עוגייה פריכה עם פירורי אוראו וקרם וניל" },
  { name: "בייגלה מלוח", price: 16, tags: ["saltysweet", "unique", "crunchy"], desc: "שילוב מפתיע של בייגלה מלוח בתוך עוגיית חמאה מתוקה" },
  { name: "במבה אדומה", price: 16, tags: ["saltysweet", "unique", "israeli"], desc: "עוגיית חמאה עם פירורי במבה אדומה קלויה" },
  { name: "טריקולד", price: 16, tags: ["chocolate", "rich", "classic"], desc: "שלושה סוגי שוקולד נמסים בעוגייה אחת" },
  { name: "M&M's", price: 16, tags: ["chocolate", "crunchy", "kids", "colorful"], desc: "עוגיית שוקולד עמוסה בקראנץ' צבעוני של M&M's" },
  { name: "קורנפלקס", price: 15, tags: ["crunchy", "classic"], desc: "עוגייה עם ציפוי קורנפלקס פריך במיוחד" },
  { name: "בוואנו", price: 15, tags: ["chocolate", "nutty", "rich"], desc: "עוגייה עם פירורי בוואנו - שוקולד ואגוזים" },
  { name: "אמסטרדם", price: 14, tags: ["chocolate", "unique"], desc: "עוגיית שוקולד עשירה ומיוחדת בסגנון בלגי" },
  { name: "לוטוס", price: 14, tags: ["classic", "sweet"], desc: "עוגיית ביסקוויט לוטוס בטעם קרמל עדין" },
  { name: "ספרינקלס", price: 14, tags: ["kids", "colorful", "sweet"], desc: "עוגייה חגיגית עם פיזור ססגוני של ספרינקלס" },
  { name: "נוטלה", price: 13, tags: ["chocolate", "nutty", "classic", "budget"], desc: "עוגיית נוטלה קלאסית עם לב שוקולד-אגוזים נמס" },
  { name: "שוקולד חלב", price: 13, tags: ["chocolate", "classic", "budget"], desc: "עוגיית שוקולד חלב פשוטה וקלאסית לחובבי הבייסיק" },
];

const QUIZ_TASTE_OPTIONS: { label: string; tag: string | null }[] = [
  { label: "🍫 שוקולד עשיר", tag: "chocolate" },
  { label: "🥨 מתוק-מלוח מפתיע", tag: "saltysweet" },
  { label: "🌰 אגוזים וקראנצ'ים", tag: "nutty" },
  { label: "✨ קלאסי ופשוט", tag: "classic" },
  { label: "🎁 תפתיעו אותי", tag: null },
];

type Package = { size: number; price: number };

const PACKAGES: Package[] = [
  { size: 2, price: 38 },
  { size: 4, price: 70 },
  { size: 5, price: 83 },
  { size: 6, price: 95 },
  { size: 8, price: 125 },
  { size: 10, price: 150 },
];

const FAQ_INTENTS: { key: string; keywords: string[]; answer: string; link?: { label: string; url: string } }[] = [
  {
    key: "days",
    keywords: [
      "מתי אפשר להזמין", "ימי הזמנה", "ראשון עד רביעי", "מתי ההזמנות פתוחות", "אילו ימים",
      "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "באיזה ימים אפשר", "מתי פותחים הזמנות",
      "מתי סוגרים הזמנות", "מתי ניתן להזמין", "עד מתי אפשר להזמין",
    ],
    answer: "אפשר להזמין בין ימי ראשון עד רביעי 🗓️ ההזמנות נאפות ומגיעות לקראת סוף השבוע.",
  },
  {
    key: "delivery-time",
    keywords: [
      "מתי מגיע", "זמן אספקה", "כמה זמן", "מתי מוכן", "מתי יהיה מוכן", "כמה זמן לוקח",
      "מתי אקבל", "כמה ימים", "זמן הכנה", "כמה מהר", "מתי אני מקבל את ההזמנה",
    ],
    answer: "העוגיות נאפות טריות ומוכנות לאיסוף לקראת סוף השבוע, עם זמן הכנה של עד 7 ימי עסקים ⏳",
  },
  {
    key: "pickup",
    keywords: [
      "משלוח", "איסוף", "אספקה עד הבית", "משלוחים", "מגיעים אליי", "יש משלוח עד הבית",
      "אין משלוחים", "רק איסוף", "אפשר לשלוח אליי", "איך מקבלים את ההזמנה", "מישלוח", "משלוחה",
      "משלוחים בחיפה", "משלוח לחיפה", "איסוף עצמי", "איסוף עצמי מחיפה",
    ],
    answer: "כרגע יש רק איסוף עצמי מחיפה 📦 ברגע שהעוגיות מוכנות, תקבלו הודעה לאיסוף.",
  },
  {
    key: "location",
    keywords: [
      "איפה זה", "כתובת", "איפה לאסוף", "מיקום", "איפה נמצאים", "איפה האיסוף", "חיפה", "חייפה",
      "איפה בחיפה", "איפה אתם יושבים", "מיקום בחיפה", "כתובת לאיסוף", "איפה האפייה",
    ],
    answer: "האיסוף מתבצע מחיפה 📍 פרטי המיקום המדויק לאיסוף נשלחים אישית אחרי ביצוע ההזמנה. לשאלות נוספות מוזמנים לפנות אלינו באינסטגרם!",
  },
  {
    key: "minimum",
    keywords: [
      "מינימום", "כמה עוגיות חייב", "הזמנה מינימלית", "כמה צריך להזמין",
      "אפשר להזמין רק עוגייה אחת", "הזמנה של עוגייה אחת", "כמה מינימלי", "מה הכי קטן שיש",
    ],
    answer: "ההזמנה היא במארזים, כשהכי קטן הוא מארז 2 עוגיות ב-38₪ 🍪🍪",
  },
  {
    key: "payment",
    keywords: [
      "תשלום", "ביט", "bit", "איך משלמים", "כרטיס אשראי", "העברה", "איך אני משלם",
      "קישור לתשלום", "תשלום בהעברה", "אשראי אפשר", "איפה משלמים",
    ],
    answer: "התשלום מתבצע בביט 💳 מעבירים את סכום ההזמנה דרך הקישור, ואנחנו מתחילים להכין לכם אותה מיד!",
    link: { label: "💳 לתשלום בביט", url: "https://www.bitpay.co.il/app/me/ADF769B1-C5CB-4F12-98D2-C628177192C5" },
  },
  {
    key: "order-status",
    keywords: ["ההזמנה שלי מוכנה", "מתי ההזמנה שלי", "סטטוס הזמנה", "איפה ההזמנה שלי", "עוד לא קיבלתי הודעה"],
    answer: "ברגע שההזמנה מוכנה לאיסוף תקבלו הודעה אישית 📩 אם עבר זמן ואתם לא בטוחים, הכי מהיר לשלוח לנו הודעה באינסטגרם.",
  },
  {
    key: "change-cancel",
    keywords: ["לבטל הזמנה", "לשנות הזמנה", "טעות בהזמנה", "לתקן הזמנה", "אפשר לבטל", "אפשר לשנות"],
    answer: "לשינוי או ביטול הזמנה הכי מהיר לפנות אלינו ישירות באינסטגרם, נשמח לעזור 💌",
  },
  {
    key: "bulk-business",
    keywords: ["הזמנה גדולה", "אירוע", "עסקי", "כמות גדולה", "מתנות לעובדים", "הזמנה לחברה", "הזמנה מרובה"],
    answer: "בשביל הזמנות גדולות לאירועים או מתנות עסקיות מוזמנים לפנות אלינו באינסטגרם, ונתאים לכם הצעה 🎉",
  },
  {
    key: "allergens",
    keywords: [
      "רכיבים", "מרכיבים", "אלרגיה", "אלרגנים", "בוטנים", "גלוטן", "יש חלב", "אגוזים בפנים",
      "רגיש לאגוזים", "רגישה לאגוזים", "יש שומשום",
    ],
    answer: "כדי לוודא רגישויות ואלרגנים במדויק (גלוטן, חלב, אגוזים ועוד) הכי בטוח לפנות אלינו ישירות באינסטגרם לפני ההזמנה 🙏",
  },
  {
    key: "vegan-gf",
    keywords: ["טבעוני", "ללא גלוטן", "גלוטן פרי", "ללא סוכר", "יש טבעוני"],
    answer: "כרגע כל העוגיות שלנו הן הרגילות (לא טבעוני ולא ללא-גלוטן). לשאלות מיוחדות אפשר לפנות אלינו באינסטגרם 💌",
  },
  {
    key: "kosher",
    keywords: ["כשר", "כשרות", "הכשר"],
    answer: "לשאלות על כשרות מומלץ לפנות אלינו ישירות באינסטגרם, נשמח לענות במדויק 🙏",
  },
  {
    key: "storage",
    keywords: ["כמה זמן טרי", "איך לשמור", "טריות", "הקפאה", "לשמור במקרר", "אפשר להקפיא"],
    answer: "העוגיות הכי טובות טריות! מומלץ לאכול תוך כמה ימים מהאיסוף ולשמור בקופסה סגורה בטמפרטורת החדר 🍪",
  },
  {
    key: "contact",
    keywords: [
      "אינסטגרם", "instagram", "יצירת קשר", "וואטסאפ", "פרטים ליצירת קשר", "מספר טלפון",
      "קשר איתכם", "אינסטה", "עמוד אינסטגרם", "איך אפשר לפנות",
    ],
    answer: "אפשר לעקוב ולהתרשם מהמוצרים באינסטגרם: @made.by.bareket 📸",
  },
  {
    key: "prices",
    keywords: [
      "מחיר", "מחירים", "כמה עולה", "עלות", "תמחור", "מה המחיר", "מחיר מארז",
      "כמה עולה מארז", "תמחור מארזים", "עלות מארז",
    ],
    answer:
      "המארזים שלנו במחיר קבוע: מארז 2 = 38₪ | מארז 4 = 70₪ | מארז 5 = 83₪ | מארז 6 = 95₪ | מארז 8 = 125₪ | מארז 10 = 150₪. רוצים שאבנה לכם מארז לפי הטעם שאתם אוהבים? 😊",
  },
  {
    key: "greeting",
    keywords: ["שלום", "היי", "הי", "מה קורה", "בוקר טוב", "ערב טוב", "הלו", "מה נשמע", "אהלן"],
    answer: "היי! 👋 אני כאן כדי לענות על שאלות על ההזמנות, ואפילו לבנות לכם מארז מושלם. איך אפשר לעזור?",
  },
];

const RECOMMEND_KEYWORDS = [
  "המלצה", "המלץ", "מה כדאי", "מה טעים", "מה הכי טוב", "תבחר בשבילי", "עוגייה מומלצת", "עוגיה מומלצת",
  "תעזרו לי לבחור", "לא יודע מה לבחור", "לא יודעת מה לבחור", "מה אתם ממליצים", "תמליצו לי", "בנה לי מארז", "תבנו לי מארז",
];

let idCounter = 0;
const nextId = () => ++idCounter;

function getFaq(key: string): (typeof FAQ_INTENTS)[number] {
  return FAQ_INTENTS.find((i) => i.key === key) ?? FAQ_INTENTS[0];
}

function matchFaq(text: string): string | null {
  const normalized = text.trim();
  if (!normalized) return null;

  if (RECOMMEND_KEYWORDS.some((kw) => normalized.includes(kw))) return "recommend";

  let bestKey: string | null = null;
  let bestScore = 0;
  for (const intent of FAQ_INTENTS) {
    const score = intent.keywords.reduce((acc, kw) => (normalized.includes(kw) ? acc + kw.length : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestKey = intent.key;
    }
  }
  return bestScore > 0 ? bestKey : null;
}

function buildPackage(size: number, tag: string | null): { cookie: Cookie; qty: number }[] {
  let pool = tag ? COOKIES.filter((c) => c.tags.includes(tag)) : COOKIES;
  if (pool.length === 0) pool = COOKIES;

  const distinctCount = Math.min(size, 4, pool.length);
  const step = pool.length / distinctCount;
  const chosen: Cookie[] = [];
  for (let i = 0; i < distinctCount; i++) {
    chosen.push(pool[Math.floor(i * step)]);
  }

  const base = Math.floor(size / distinctCount);
  let remainder = size - base * distinctCount;
  return chosen.map((cookie) => ({ cookie, qty: base + (remainder-- > 0 ? 1 : 0) }));
}

type CookieChatBotProps = {
  onAddBoxToCart?: (size: number, price: number, items: { cookieName: string; qty: number }[]) => void;
  onAddSingleCookieToCart?: (cookieName: string) => void;
};

export default function CookieChatBot({ onAddBoxToCart, onAddSingleCookieToCart }: CookieChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIfDesktop = () => {
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isLargeScreen = window.innerWidth >= 1024;
      setIsDesktop(!isMobileUA || isLargeScreen);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      sender: "bot",
      text: "היי! 👋 אני העוזרת המתוקה של made.by.bareket. אפשר לשאול אותי על ימי הזמנה, תשלום, איסוף — או ללחוץ על \"בנה לי מארז\" ואני אבנה לכם מארז מפנק 🍪",
    },
  ]);
  const [input, setInput] = useState("");
  // 0 = idle, 1 = choosing package size, 2 = choosing taste
  const [quizStep, setQuizStep] = useState<0 | 1 | 2>(0);
  const [chosenPackage, setChosenPackage] = useState<Package | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen, quizStep, isTyping]);

  function addBotMessage(
    text: string,
    packageItems?: { cookie: Cookie; qty: number }[],
    packagePrice?: number,
    link?: { label: string; url: string }
  ) {
    setMessages((prev) => [...prev, { id: nextId(), sender: "bot", text, packageItems, packagePrice, link }]);
  }

  // Shows a brief "typing..." bubble before the bot's reply appears, so it feels less robotic.
  function botReply(
    text: string,
    packageItems?: { cookie: Cookie; qty: number }[],
    packagePrice?: number,
    link?: { label: string; url: string }
  ) {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      addBotMessage(text, packageItems, packagePrice, link);
    }, 500 + Math.random() * 300);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), sender: "user", text }]);
  }

  function startQuiz() {
    addUserMessage("בנה לי מארז 🎁");
    setQuizStep(1);
    botReply("איזה מארז מתאים לכם?");
  }

  function handlePackageChoice(pkg: Package) {
    addUserMessage(`מארז ${pkg.size} עוגיות (${pkg.price}₪)`);
    setChosenPackage(pkg);
    setQuizStep(2);
    botReply("מעולה! ומה בא לכם היום?");
  }

  function handleTasteChoice(label: string, tag: string | null) {
    addUserMessage(label);
    setQuizStep(0);
    const pkg = chosenPackage ?? PACKAGES[0];
    const items = buildPackage(pkg.size, tag);
    const summary = items.map((it) => `${it.cookie.name} ×${it.qty}`).join(", ");
    botReply(
      `בניתי לכם מארז ${pkg.size} עוגיות ב-${pkg.price}₪: ${summary} 🍪 אפשר להזמין דרך ביט!`,
      items,
      pkg.price,
      { label: "💳 לתשלום בביט", url: "https://www.bitpay.co.il/app/me/ADF769B1-C5CB-4F12-98D2-C628177192C5" }
    );
  }

  function handleFaqClick(intent: (typeof FAQ_INTENTS)[number]) {
    addUserMessage(intent.keywords[0]);
    botReply(intent.answer, undefined, undefined, intent.link);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    addUserMessage(text);
    setInput("");

    const intentKey = matchFaq(text);
    if (intentKey === "recommend") {
      setQuizStep(1);
      botReply("איזה מארז מתאים לכם?");
      return;
    }
    const intent = FAQ_INTENTS.find((i) => i.key === intentKey);
    if (intent) {
      botReply(intent.answer, undefined, undefined, intent.link);
    } else {
      botReply(
        "לא בטוחה שהבנתי 🙈 אפשר לשאול אותי על ימי הזמנה, תשלום, איסוף ומחירים — או ללחוץ על \"בנה לי מארז\". לשאלות נוספות אפשר גם לפנות באינסטגרם @made.by.bareket."
      );
    }
  }

  return (
    <div className="mbb-chatbot-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700&family=Assistant:wght@400;500;600&display=swap');

        .mbb-chatbot-root {
          --mbb-bg: #FDF1F0;
          --mbb-rose: #E38FA0;
          --mbb-rose-dark: #C96F82;
          --mbb-cocoa: #4A312B;
          --mbb-caramel: #C68A4E;
          --mbb-chip: #4A312B;
          --mbb-cream: #FFFDFB;
          --mbb-bubble-user: #F3C9D3;
          direction: rtl;
          font-family: 'Assistant', sans-serif;
        }

        .mbb-launcher {
          position: fixed;
          bottom: 22px;
          right: 22px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: var(--mbb-cream);
          border: none;
          box-shadow: 0 6px 20px rgba(74, 49, 43, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: transform 0.2s ease;
        }
        .mbb-launcher:hover { transform: scale(1.08) rotate(-4deg); }
        .mbb-launcher svg { width: 40px; height: 40px; }

        .mbb-panel {
          position: fixed;
          bottom: 96px;
          right: 22px;
          width: 340px;
          max-width: calc(100vw - 32px);
          height: 460px;
          max-height: calc(100vh - 140px);
          background: var(--mbb-bg);
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(74, 49, 43, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9999;
          font-family: 'Assistant', sans-serif;
        }

        .mbb-header {
          background: linear-gradient(135deg, var(--mbb-rose), var(--mbb-rose-dark));
          color: #fff;
          padding: 14px 16px;
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mbb-header-title { display: flex; align-items: center; gap: 8px; }
        .mbb-close {
          background: rgba(255,255,255,0.25);
          border: none;
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .mbb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mbb-bubble {
          max-width: 82%;
          padding: 9px 13px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .mbb-bubble.bot {
          background: var(--mbb-cream);
          color: var(--mbb-cocoa);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        .mbb-bubble.user {
          background: var(--mbb-bubble-user);
          color: var(--mbb-cocoa);
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .mbb-cookie-card {
          background: var(--mbb-cream);
          border: 1px solid rgba(198,138,78,0.35);
          border-radius: 12px;
          padding: 8px 10px;
          margin-top: 6px;
        }
        .mbb-cookie-card.interactive {
          cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .mbb-cookie-card.interactive:hover {
          transform: translateY(-2px);
          border-color: var(--mbb-rose);
          background: #FFF5F6;
        }
        .mbb-cookie-card.interactive:active {
          transform: scale(0.98);
        }
        .mbb-cookie-card-action {
          background: var(--mbb-rose);
          color: #fff;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 999px;
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
        }
        .mbb-cookie-card.interactive:hover .mbb-cookie-card-action {
          background: var(--mbb-rose-dark);
        }
        .mbb-cookie-card + .mbb-cookie-card { margin-top: 6px; }
        .mbb-cookie-name {
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
          font-size: 13px;
          color: var(--mbb-cocoa);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mbb-cookie-price { color: var(--mbb-caramel); font-weight: 600; font-size: 12.5px; }
        .mbb-cookie-desc { font-size: 12px; color: #7a6058; margin-top: 2px; }
        .mbb-cookie-total {
          margin-top: 8px;
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
          font-size: 13px;
          color: var(--mbb-rose-dark);
        }

        .mbb-link-btn {
          display: inline-block;
          margin-top: 8px;
          background: var(--mbb-rose);
          color: #fff;
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
          font-size: 12.5px;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 999px;
        }
        .mbb-link-btn:hover { background: var(--mbb-rose-dark); }

        .mbb-typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
        .mbb-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--mbb-caramel);
          opacity: 0.5;
          animation: mbb-bounce 1.1s infinite ease-in-out;
        }
        .mbb-typing span:nth-child(2) { animation-delay: 0.15s; }
        .mbb-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes mbb-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .mbb-quick-replies {
          padding: 8px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          border-top: 1px solid rgba(198,138,78,0.2);
        }
        .mbb-quick-btn {
          background: var(--mbb-cream);
          border: 1px solid rgba(227,143,160,0.5);
          color: var(--mbb-cocoa);
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Assistant', sans-serif;
        }
        .mbb-quick-btn:hover { background: var(--mbb-bubble-user); }
        .mbb-quick-btn.primary {
          background: var(--mbb-caramel);
          border-color: var(--mbb-caramel);
          color: #fff;
          font-weight: 600;
        }

        .mbb-input-row {
          display: flex;
          gap: 6px;
          padding: 10px 12px;
          border-top: 1px solid rgba(198,138,78,0.2);
          background: var(--mbb-cream);
        }
        .mbb-input-row input {
          flex: 1;
          border: 1px solid rgba(198,138,78,0.35);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          font-family: 'Assistant', sans-serif;
          outline: none;
          direction: rtl;
        }
        .mbb-input-row input:focus { border-color: var(--mbb-rose); }
        .mbb-send-btn {
          background: var(--mbb-rose);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 15px;
          flex-shrink: 0;
        }
        .mbb-send-btn:hover { background: var(--mbb-rose-dark); }
        .mbb-add-recommended-btn {
          background: var(--mbb-caramel);
          border: none;
          color: #fff;
          font-family: 'Rubik', sans-serif;
          font-weight: 600;
          font-size: 11.5px;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .mbb-add-recommended-btn:hover {
          background: var(--mbb-rose-dark);
        }
        .mbb-add-recommended-btn:active {
          transform: scale(0.95);
        }
        .mbb-cookie-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          gap: 10px;
        }
      `}</style>

      <button className="mbb-launcher" onClick={() => setIsOpen((v) => !v)} aria-label="פתיחת הצ'אט">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="mbb-bite-mask">
              <rect width="64" height="64" fill="white" />
              <circle cx="49" cy="15" r="13" fill="black" />
            </mask>
          </defs>
          <circle cx="32" cy="34" r="26" fill="var(--mbb-caramel)" mask="url(#mbb-bite-mask)" />
          <circle cx="22" cy="26" r="2.4" fill="var(--mbb-chip)" />
          <circle cx="34" cy="43" r="2.6" fill="var(--mbb-chip)" />
          <circle cx="16" cy="40" r="2" fill="var(--mbb-chip)" />
          <circle cx="24" cy="46" r="1.8" fill="var(--mbb-chip)" />
        </svg>
      </button>

      {isOpen && (
        <div className="mbb-panel">
          <div className="mbb-header">
            <div className="mbb-header-title">🍪 made.by.bareket</div>
            <button className="mbb-close" onClick={() => setIsOpen(false)} aria-label="סגירה">✕</button>
          </div>

          <div className="mbb-messages" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`mbb-bubble ${m.sender}`}>
                {m.text}
                {m.link && (
                  <div>
                    <a className="mbb-link-btn" href={m.link.url} target="_blank" rel="noopener noreferrer">
                      {m.link.label}
                    </a>
                    {isDesktop && m.link.url.includes("bitpay.co.il") && (
                      <div className="mbb-bit-qr" style={{ marginTop: '10px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid rgba(198,138,78,0.2)', maxWidth: '140px' }}>
                        <img src="/qr_code.jpg" alt="קוד QR לביט" style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }} />
                        <div style={{ fontSize: '11px', textAlign: 'center', color: 'var(--mbb-cocoa)', marginTop: '4px', fontWeight: 'bold' }}>סרקו לתשלום בביט 📱</div>
                      </div>
                    )}
                  </div>
                )}
                {m.packageItems?.map((it) => (
                  <div
                    className={`mbb-cookie-card ${onAddSingleCookieToCart ? "interactive" : ""}`}
                    key={it.cookie.name}
                    onClick={(e) => {
                      console.log("Chatbot cookie card clicked:", it.cookie.name);
                      if (onAddSingleCookieToCart) {
                        onAddSingleCookieToCart(it.cookie.name);
                        toast.success(`עוגיית ${it.cookie.name} נוספה לסל הקניות! 🍪`);
                      } else {
                        console.warn("onAddSingleCookieToCart is undefined!");
                      }
                    }}
                  >
                    <div className="mbb-cookie-name">
                      <span>{it.cookie.name} <span className="mbb-cookie-price">× {it.qty}</span></span>
                      {onAddSingleCookieToCart && (
                        <span className="mbb-cookie-card-action">הוסף עוגייה 🛒</span>
                      )}
                    </div>
                    <div className="mbb-cookie-desc">{it.cookie.desc}</div>
                  </div>
                ))}
                {m.packagePrice != null && (
                  <div className="mbb-cookie-action-row">
                    <div className="mbb-cookie-total" style={{ margin: 0 }}>סה"כ למארז: {m.packagePrice}₪</div>
                    {onAddBoxToCart && (
                      <button
                        className="mbb-add-recommended-btn"
                        onClick={() => {
                          const items = m.packageItems?.map(it => ({ cookieName: it.cookie.name, qty: it.qty })) || [];
                          onAddBoxToCart(
                            m.packageItems ? m.packageItems.reduce((acc, x) => acc + x.qty, 0) : 0,
                            m.packagePrice!,
                            items
                          );
                          toast.success("המארז המומלץ נוסף לסל הקניות! 🍪");
                        }}
                      >
                        🛒 הוסף לסל
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="mbb-bubble bot mbb-typing">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>

          <div className="mbb-quick-replies">
            {quizStep === 0 && (
              <>
                <button className="mbb-quick-btn primary" onClick={startQuiz}>🎁 בנה לי מארז</button>
                <button className="mbb-quick-btn" onClick={() => handleFaqClick(getFaq("days"))}>ימי הזמנה</button>
                <button className="mbb-quick-btn" onClick={() => handleFaqClick(getFaq("payment"))}>תשלום ב-Bit</button>
                <button className="mbb-quick-btn" onClick={() => handleFaqClick(getFaq("pickup"))}>איסוף</button>
                <button className="mbb-quick-btn" onClick={() => handleFaqClick(getFaq("prices"))}>מחירי מארזים</button>
                <button className="mbb-quick-btn" onClick={() => handleFaqClick(getFaq("allergens"))}>אלרגנים</button>
              </>
            )}
            {quizStep === 1 &&
              PACKAGES.map((pkg) => (
                <button key={pkg.size} className="mbb-quick-btn" onClick={() => handlePackageChoice(pkg)}>
                  מארז {pkg.size} ({pkg.price}₪)
                </button>
              ))}
            {quizStep === 2 &&
              QUIZ_TASTE_OPTIONS.map((opt) => (
                <button key={opt.label} className="mbb-quick-btn" onClick={() => handleTasteChoice(opt.label, opt.tag)}>
                  {opt.label}
                </button>
              ))}
          </div>

          <div className="mbb-input-row">
            <input
              type="text"
              placeholder="שאלו אותי משהו..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="mbb-send-btn" onClick={handleSend} aria-label="שליחה">➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
