import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'db.json');

export interface Product {
  id: string;
  name: string;
  price: number;
  desc: string;
  image: string;
  category: string;
  hidden: boolean;
  options?: string[];
  optionImages?: Record<string, string>;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'single' | 'box';
  flavors?: { name: string; quantity: number }[];
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  pickupDay: string;
  pickupTimeSlot: string;
  birthdaySign: boolean;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
}

export interface DayAnalytics {
  visitors: number;
  pageviews: number;
  referrers: Record<string, number>;
  funnel: {
    visitor: number;
    add_to_cart: number;
    initiate_checkout: number;
    purchase: number;
  };
}

export interface DbSchema {
  products: Product[];
  orders: Order[];
  analytics: Record<string, DayAnalytics>;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'קורנפלקס', price: 15, image: 'cookies/cornflakes.jpg', desc: "קראנץ' קורנפלקס מיוחד בתוך עוגיית שוקולד צ'יפס רכה שכולם אוהבים", category: 'salty_sweet', hidden: false },
  { id: '3', name: 'הרשיז', price: 16, image: 'cookies/oreo.jpg', desc: "קראמבל פריך עם פירורי הרשיז ושוקולד לבן מפנק במיוחד", category: 'sweet', hidden: false },
  { id: '8', name: 'נוטלה', price: 13, image: 'cookies/nutella.png', desc: "מילוי נוטלה נוזלי ומושחת במיוחד שמתפרץ בכל ביס", category: 'sweet', hidden: false },
  { id: '13', name: "M&M's", price: 17, image: 'cookies/m&m.jpeg', desc: "עוגיית שוקולד צבעונית ושמחה שילדים ומבוגרים אוהבים כאחד", category: 'sweet', hidden: false },
  { id: '15', name: 'קינדר', price: 16, image: 'cookies/kinder.jpg', desc: "קרם קינדר עשיר עם אצבעות שוקולד קינדר מפנקות מעל", category: 'sweet', hidden: false },
  { id: '4', name: 'בוואנו', price: 15, image: 'cookies/b1.jpeg', desc: "קרם קינדר בואנו עשיר עם שברי וופל פריכים שנמסים בפה", category: 'sweet', hidden: false },
  { id: '2', name: 'כריות קליק', price: 16, image: 'cookies/kinder.jpeg', desc: "שברי כריות נוטלה וקליק שוקולד לחוויית קראנץ' מושלמת", category: 'sweet', hidden: false },
  { id: '5', name: 'אמסטרדם', price: 15, image: 'cookies/amsterdam.png', desc: "עוגיית קקאו כהה ועשירה עם לב שוקולד לבן נימוח ונמס", category: 'classic', hidden: false },
  { id: '6', name: 'בייגלה מלוח', price: 16, image: 'cookies/pretzel.png', desc: "שילוב מושלם של מתוק ומלוח עם שוקולד חלב איכותי ובייגלה פריך", category: 'salty_sweet', hidden: false },
  { id: '7', name: 'לוטוס', price: 15, image: 'cookies/lotus.png', desc: "קרם לוטוס עשיר עם פירורי עוגיית לוטוס פריכה מעל", category: 'sweet', hidden: false },
  { id: '9', name: 'במבה אדומה', price: 16, image: 'cookies/red_bamba.jpeg', desc: "חוויה נוסטלגית מתוקה של במבה אדומה מתוקה ופריכה במיוחד", category: 'classic', hidden: false },
  { id: '10', name: 'שוקולד חלב', price: 13, image: 'cookies/milk_choclat.jpeg', desc: "הקלאסיקה האהובה - שוקולד צ'יפס רכה ונימוחה עם שוקולד חלב", category: 'classic', hidden: false },
  { id: '11', name: 'טריקולד', price: 16, image: 'cookies/trikold.jpeg', desc: "שלושה סוגי שוקולד איכותיים - לבן, חלב ומריר במאפה אחד", category: 'sweet', hidden: false },
  { id: '12', name: 'ספרינקלס', price: 14, image: 'cookies/sprinkels.jpeg', desc: "עוגיית יום הולדת שמחה ומזמינה עם סוכריות צבעוניות מבחוץ ומבפנים", category: 'classic', hidden: false },
  { id: '14', name: 'חצי חצי', price: 16, image: 'cookies/half_half.jpeg', desc: "חצי שוקולד מריר וחצי שוקולד לבן - הטוב משני העולמות", category: 'classic', hidden: false }
];

export function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DbSchema = {
        products: DEFAULT_PRODUCTS,
        orders: [],
        analytics: {}
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Ensure safety defaults if fields are missing
    if (!parsed.products) parsed.products = DEFAULT_PRODUCTS;
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.analytics) parsed.analytics = {};
    
    return parsed;
  } catch (error) {
    console.error("Error reading database file:", error);
    return { products: DEFAULT_PRODUCTS, orders: [], analytics: {} };
  }
}

export function writeDb(db: DbSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to database file:", error);
  }
}

export function getTodayStr(): string {
  const now = new Date();
  // Adjust for local time YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOrCreateTodayAnalytics(db: DbSchema): DayAnalytics {
  const today = getTodayStr();
  if (!db.analytics[today]) {
    db.analytics[today] = {
      visitors: 0,
      pageviews: 0,
      referrers: {},
      funnel: {
        visitor: 0,
        add_to_cart: 0,
        initiate_checkout: 0,
        purchase: 0
      }
    };
  }
  return db.analytics[today];
}
