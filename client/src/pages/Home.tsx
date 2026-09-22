import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Instagram, ShoppingCart, Trash2, Plus, Minus, Star, Heart, Calendar, Clock, Gift, Info, Check, MapPin, Shuffle, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Cookie {
  id: string;
  name: string;
  price: number;
  image: string;
  allergens?: string[];
}

interface CartItem {
  instanceId: string;
  type: 'box' | 'single';
  id: string;
  name: string;
  price: number;
  image?: string;
  flavors?: { cookie: Cookie; quantity: number }[];
  quantity: number;
}

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  date: string;
}

// 18 official cookie flavors
const COOKIES: Cookie[] = [
  { id: '1', name: 'הרשיז', price: 17, image: '/cookies/oreo.jpg', allergens: ['חלב', 'גלוטן', 'סויה'] },
  { id: '2', name: 'אמסטרדם', price: 15, image: '/cookies/amsterdam.png', allergens: ['חלב', 'גלוטן'] },
  { id: '3', name: 'ספרינקלס', price: 15, image: '/cookies/sprinkels.jpeg', allergens: ['חלב', 'גלוטן'] },
  { id: '4', name: 'טריקולד', price: 18, image: '/cookies/trikold.jpeg', allergens: ['חלב', 'גלוטן'] },
  { id: '5', name: 'M&M', price: 20, image: '/cookies/m&m.jpeg', allergens: ['חלב', 'גלוטן', 'בוטנים'] },
  { id: '6', name: 'קינדר', price: 17, image: '/cookies/kinder.jpg', allergens: ['חלב', 'גלוטן', 'אגוזים'] },
  { id: '7', name: 'נוטלה', price: 16, image: '/cookies/nutella.png', allergens: ['חלב', 'גלוטן', 'אגוזים'] },
  { id: '8', name: 'קורנפלקס', price: 16, image: '/cookies/cornflakes.jpg', allergens: ['חלב', 'גלוטן'] },
  { id: '9', name: 'במבה אדומה ושוקולד לבן', price: 18, image: '/cookies/red_bamba.jpeg', allergens: ['בוטנים', 'גלוטן', 'חלב'] },
  { id: '10', name: 'בואנו', price: 16, image: '/cookies/bueno.jpg', allergens: ['חלב', 'גלוטן', 'אגוזים'] },
  { id: '11', name: 'מושחתת חומה', price: 15, image: '/cookies/placeholder.png', allergens: ['חלב', 'גלוטן'] },
  { id: '12', name: 'בייגלה מלוח', price: 17, image: '/cookies/pretzel.png', allergens: ['חלב', 'גלוטן', 'שומשום'] },
  { id: '13', name: 'חצי חצי', price: 20, image: '/cookies/half_half.jpeg', allergens: ['חלב', 'גלוטן'] },
  { id: '14', name: 'לוטוס', price: 17, image: '/cookies/lotus.png', allergens: ['חלב', 'גלוטן', 'סויה'] },
  { id: '15', name: "Reese’s", price: 20, image: '/cookies/placeholder.png', allergens: ['בוטנים', 'חלב', 'גלוטן', 'סויה'] },
  { id: '16', name: 'כריות', price: 16, image: '/cookies/kinder.jpeg', allergens: ['חלב', 'גלוטן', 'סויה'] },
  { id: '17', name: 'מושחתת לבנה', price: 15, image: '/cookies/placeholder.png', allergens: ['חלב', 'גלוטן'] },
  { id: '18', name: 'סמורס', price: 16, image: '/cookies/placeholder.png', allergens: ['חלב', 'גלוטן'] },
];

interface MysteryBoxConfig {
  size: number;
  name: string;
  price: number;
  emoji: string;
  description: string;
}

const MYSTERY_BOXES: MysteryBoxConfig[] = [
  { size: 2, name: 'מארז 2 עוגיות מיסטרי', price: 38, emoji: '🎁', description: '2 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
  { size: 4, name: 'מארז 4 עוגיות מיסטרי', price: 70, emoji: '🎁', description: '4 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
  { size: 5, name: 'מארז 5 עוגיות מיסטרי', price: 83, emoji: '🎁', description: '5 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
  { size: 6, name: 'מארז 6 עוגיות מיסטרי', price: 95, emoji: '🎲', description: '6 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
  { size: 8, name: 'מארז 8 עוגיות מיסטרי', price: 125, emoji: '✨', description: '8 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
  { size: 10, name: 'מארז 10 עוגיות מיסטרי', price: 150, emoji: '🎉', description: '10 עוגיות בטעמים אקראיים וייחודיים ללא כפילויות' },
];

// Helper to generate UNIQUE random cookie flavors for a mystery box (no duplicate cookies!)
const generateUniqueRandomFlavors = (size: number): { cookie: Cookie; quantity: number }[] => {
  const shuffled = [...COOKIES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(size, COOKIES.length));
  return selected.map(cookie => ({ cookie, quantity: 1 }));
};

function trackAnalyticsEvent(type: 'pageview' | 'visitor' | 'add_to_cart' | 'initiate_checkout') {
  void fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      type,
      referrer: document.referrer || 'Direct / קישור ישיר',
    }),
  }).catch(() => {
    // Analytics must never block shopping.
  });
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('bareket_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bareket_cart', JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving cart to localStorage", e);
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 'success'>(1);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSelfPickupConfirmed, setIsSelfPickupConfirmed] = useState(false);
  const [pickupDay, setPickupDay] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false);
  const [hasBirthdaySign, setHasBirthdaySign] = useState(false);

  // Active Mystery Box Preview Modal State
  const [activeMysteryBox, setActiveMysteryBox] = useState<{
    config: MysteryBoxConfig;
    flavors: { cookie: Cookie; quantity: number }[];
  } | null>(null);

  // Reviews state
  const reviews: Review[] = [
    { id: 'r1', name: 'שירה ד.', text: 'מארז המיסטרי פשוט מטורף! כל עוגייה במארז הייתה טעם שונה לחלוטין וטעים ברמות.', rating: 5, date: '12/07/2026' },
    { id: 'r2', name: 'גיא ל.', text: 'הזמנתי מארז 8 מיסטרי — קיבלתי 8 עוגיות שונות ושום טעם לא חזר על עצמו! איסוף תקתק בחיפה.', rating: 5, date: '10/07/2026' },
    { id: 'r3', name: 'מעיין א.', text: 'העוגיות של ברקת באיכות הכי גבוהה שיש. 18 טעמים מדהימים!', rating: 5, date: '05/07/2026' }
  ];
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');

  const cookiesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackAnalyticsEvent('pageview');
    try {
      if (!sessionStorage.getItem('bareket_visitor_tracked')) {
        sessionStorage.setItem('bareket_visitor_tracked', '1');
        trackAnalyticsEvent('visitor');
      }
    } catch {
      trackAnalyticsEvent('visitor');
    }
  }, []);

  const handleOpenMysteryBoxModal = (box: MysteryBoxConfig) => {
    setActiveMysteryBox({
      config: box,
      flavors: generateUniqueRandomFlavors(box.size)
    });
  };

  const handleRerollMysteryFlavors = () => {
    if (!activeMysteryBox) return;
    setActiveMysteryBox({
      ...activeMysteryBox,
      flavors: generateUniqueRandomFlavors(activeMysteryBox.config.size)
    });
  };

  const handleAddActiveMysteryBoxToCart = () => {
    if (!activeMysteryBox) return;
    const { config, flavors } = activeMysteryBox;
    setCart(prev => [
      ...prev,
      {
        instanceId: `mystery-${config.size}-${Date.now()}-${Math.random()}`,
        type: 'box',
        id: `box-${config.size}`,
        name: config.name,
        price: config.price,
        image: '/logo.png',
        flavors,
        quantity: 1
      }
    ]);
    trackAnalyticsEvent('add_to_cart');
    setActiveMysteryBox(null);
  };

  const handleQuickAddMysteryBox = (box: MysteryBoxConfig) => {
    const flavors = generateUniqueRandomFlavors(box.size);
    setCart(prev => [
      ...prev,
      {
        instanceId: `mystery-${box.size}-${Date.now()}-${Math.random()}`,
        type: 'box',
        id: `box-${box.size}`,
        name: box.name,
        price: box.price,
        image: '/logo.png',
        flavors,
        quantity: 1
      }
    ]);
    trackAnalyticsEvent('add_to_cart');
  };

  const handleAddSingleCookie = (cookie: Cookie) => {
    setCart(prev => {
      const existing = prev.find(item => item.type === 'single' && item.id === cookie.id);
      if (existing) {
        return prev.map(item => item.type === 'single' && item.id === cookie.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        instanceId: `single-${cookie.id}-${Date.now()}-${Math.random()}`,
        type: 'single',
        id: cookie.id,
        name: cookie.name,
        price: cookie.price,
        image: cookie.image,
        quantity: 1
      }];
    });
    trackAnalyticsEvent('add_to_cart');
  };

  const handleRemoveOneSingleCookie = (cookieId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.type === 'single' && item.id === cookieId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(item => item.type === 'single' && item.id === cookieId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => !(item.type === 'single' && item.id === cookieId));
    });
  };

  const handleUpdateQuantity = (instanceId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.instanceId === instanceId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (instanceId: string) => {
    setCart(prev => prev.filter(item => item.instanceId !== instanceId));
  };

  const handleAddReview = () => {
    if (!newReviewName.trim() || !newReviewText.trim()) return;
    setReviewMessage("תודה רבה על הביקורת! היא נשלחה לבדיקה ❤️");
    setTimeout(() => {
      setNewReviewName('');
      setNewReviewText('');
      setNewReviewRating(5);
      setReviewMessage('');
      setIsReviewModalOpen(false);
    }, 2000);
  };

  const handleOpenCheckout = () => {
    trackAnalyticsEvent('initiate_checkout');
    setCheckoutStep(1);
    setFullName('');
    setPhoneNumber('');
    setPhoneError('');
    setIsSelfPickupConfirmed(false);
    setPickupDay('');
    setPickupTimeSlot('');
    setAllergyConfirmed(false);
    setCancellationConfirmed(false);
    setIsCheckoutOpen(true);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    return getSubtotal() + (hasBirthdaySign ? 5 : 0);
  };

  const getTotalCookieCount = () => {
    return cart.reduce((sum, item) => {
      if (item.type === 'single') return sum + item.quantity;
      const boxSizeNum = parseInt(item.id.replace('box-', '')) || 0;
      return sum + (boxSizeNum * item.quantity);
    }, 0);
  };

  const getOrderSummaryText = () => {
    const summaryParts = cart.map(item => {
      if (item.type === 'single') {
        return `${item.quantity} x ${item.name}`;
      } else {
        const flavorDesc = item.flavors?.map(f => `${f.cookie.name} (${f.quantity})`).join(', ') || '';
        return `${item.quantity} x ${item.name} [${flavorDesc}]`;
      }
    });
    if (hasBirthdaySign) {
      summaryParts.push("שלט מזל טוב (+5 ₪)");
    }
    return `סיכום הזמנה: ${summaryParts.join(' | ')} | סה״כ: ${getTotalPrice()} ₪`;
  };

  const handleProceedToPayment = async () => {
    const cleanPhone = phoneNumber.replace(/[-\s]/g, '');
    const isPhoneValid = /^05\d{8}$/.test(cleanPhone);
    
    if (!isPhoneValid) {
      setPhoneError('נא להזין מספר טלפון נייד תקין בישראל (10 ספרות, למשל 0501234567)');
      return;
    }
    setPhoneError('');

    const isFormValid = 
      fullName.trim() !== '' && 
      pickupDay !== '' && 
      pickupTimeSlot !== '' && 
      allergyConfirmed && 
      cancellationConfirmed && 
      isSelfPickupConfirmed;

    if (!isFormValid) return;

    const orderRef = `MB-${Math.floor(100000 + Math.random() * 900000)}`;
    setCurrentOrderId(orderRef);

    const orderSummaryText = cart.map(item => {
      if (item.type === 'single') {
        return `${item.quantity} x ${item.name}`;
      } else {
        const flavorsStr = item.flavors?.map(f => `${f.cookie.name} (${f.quantity})`).join(', ') || '';
        return `${item.quantity} x ${item.name} (${flavorsStr})`;
      }
    }).join('\n');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderRef,
          fullName,
          phoneNumber,
          pickupDay,
          pickupTimeSlot,
          birthdaySign: hasBirthdaySign,
          orderSummaryText,
          totalPrice: getTotalPrice(),
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            type: item.type,
            flavors: item.flavors?.map(flavor => ({
              name: flavor.cookie.name,
              quantity: flavor.quantity,
            })),
          })),
        }),
      });
      if (!response.ok) {
        throw new Error('Order request failed');
      }
    } catch (err) {
      console.error("Order API request error:", err);
      toast.error("לא הצלחנו לשמור את ההזמנה. נסו שוב בעוד רגע.");
      return;
    }

    setCheckoutStep(2);
  };

  const handleConfirmPayment = () => {
    setCart([]);
    try {
      localStorage.removeItem('bareket_cart');
    } catch {}
    setCheckoutStep('success');
  };

  const renderAllergenBadges = (allergens?: string[]) => {
    if (!allergens || allergens.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 justify-center my-1.5">
        {allergens.map(allergen => (
          <span key={allergen} className="text-[10px] bg-[#FFF8F3] text-[#6B4423] border border-[#E8D4C8] px-1.5 py-0.5 rounded-full font-medium">
            {allergen === 'חלב' && '🥛 '}
            {allergen === 'גלוטן' && '🌾 '}
            {allergen === 'בוטנים' && '🥜 '}
            {allergen === 'אגוזים' && '🌰 '}
            {allergen === 'סויה' && '🌱 '}
            {allergen === 'שומשום' && '🌾 '}
            {allergen}
          </span>
        ))}
      </div>
    );
  };

  const renderPickupDetails = () => (
    <div className="bg-[#FFF8F3] border-2 border-[#E8B4A8] rounded-2xl p-4 my-4 text-right space-y-2 shadow-sm" dir="rtl">
      <div className="flex items-center justify-center gap-2 font-black text-[#3D2817] text-base sm:text-lg bg-[#E8B4A8]/30 px-4 py-2 rounded-xl w-full text-center">
        <MapPin className="w-5 h-5 text-[#C85A54]" />
        <span className="text-[#C85A54] font-extrabold">📍 איסוף עצמי מחיפה בלבד!</span>
      </div>
      <p className="text-sm text-[#6B4423] text-center font-medium">
        <strong>מדיניות הזמנות:</strong> הזמנות בימים א'–ד', קבלת העוגיות בסוף השבוע (חמישי-שישי/שבת).
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#FFF8F3] to-[#F5E6D3] flex flex-col justify-between">
      {/* Social Floating Buttons - Top Left */}
      <div className="fixed top-6 left-6 z-40 flex gap-3">
        <a
          href="https://www.instagram.com/made.by.bareket?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white p-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
          title="לעמוד האינסטגרם שלנו"
        >
          <Instagram className="w-6 h-6" />
        </a>
        <a
          href="https://www.tiktok.com/@made.by.bareket?_r=1&_t=ZS-980TDGsac1h"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black hover:bg-neutral-800 text-white p-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
          title="לעמוד הטיקטוק שלנו"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        </a>
      </div>

      {/* Floating Shield Button for Admin Panel - Bottom Left */}
      <a
        href="/admin"
        className={`fixed left-6 z-40 bg-[#3D2817] hover:bg-[#5C4033] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-[#E8B4A8] flex items-center justify-center group ${
          cart.length > 0 ? 'bottom-24 md:bottom-28' : 'bottom-6'
        }`}
        title="כניסה למערכת ניהול (Admin Panel)"
      >
        <Shield className="w-6 h-6 text-[#E8B4A8] group-hover:rotate-12 transition-transform" />
      </a>

      <div className="space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-4 px-4">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 w-40 h-40 bg-[#E8B4A8] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-60 h-60 bg-[#F5E6D3] rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="mb-4 flex justify-center animate-bounce" style={{ animationDuration: '3s' }}>
              <img src="/logo.png" alt="made.by.bareket logo" className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover shadow-lg border-4 border-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#3D2817] mb-3" style={{ fontFamily: 'Alef' }}>
              made.by.bareket
            </h1>
            <div className="inline-block bg-[#E8B4A8]/20 text-[#6B4423] font-bold px-4 py-2 rounded-full mb-4 text-sm md:text-base border border-[#E8B4A8]">
              🕒 מזמינים ראשון עד רביעי — מקבלים בסופ״ש
            </div>
            
            {/* Hero Pickup Card */}
            <div className="max-w-md mx-auto">
              {renderPickupDetails()}
            </div>
          </div>
        </section>

        {/* Mystery Box Section */}
        <section className="py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#E8B4A8]/30 text-[#C85A54] px-4 py-1.5 rounded-full text-sm font-extrabold mb-3">
                <Sparkles className="w-4 h-4" />
                <span>מארזי המיסטרי של ברקת</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                מארזי מיסטרי - Mystery Box 🎁
              </h2>
              <p className="text-base text-[#6B4423] max-w-xl mx-auto mt-2">
                האתר בוחר עבורכם אקראית טעמים ייחודיים (ללא כפילויות בכל מארז!) מתוך 18 עוגיות השחיתות של ברקת 🎲✨
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" dir="rtl">
              {MYSTERY_BOXES.map((box) => (
                <div
                  key={box.size}
                  className="bg-white border-2 border-[#E8D4C8] hover:border-[#E8B4A8] hover:shadow-xl rounded-3xl p-6 transition-all flex flex-col justify-between items-center text-center group relative overflow-hidden"
                >
                  <div className="absolute top-3 left-3 bg-[#FFF8F3] text-[#E8B4A8] border border-[#E8D4C8] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Shuffle className="w-3 h-3" />
                    <span>טעמים שונים (ללא כפילות)</span>
                  </div>

                  <div className="mb-6 pt-2">
                    <span className="text-5xl md:text-6xl block mb-2 transition-transform group-hover:scale-110">{box.emoji}</span>
                    <h3 className="font-extrabold text-[#3D2817] text-xl md:text-2xl mt-2">{box.name}</h3>
                    <p className="text-xs md:text-sm text-[#6B4423] mt-2 leading-relaxed px-2">{box.description}</p>
                    <p className="text-2xl md:text-3xl font-black text-[#C85A54] mt-4">{box.price} ₪</p>
                  </div>

                  <div className="w-full space-y-2">
                    <Button
                      onClick={() => handleOpenMysteryBoxModal(box)}
                      className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer text-base flex items-center justify-center gap-2"
                    >
                      <span>הצצה לטעמים האקראיים 🎲</span>
                    </Button>
                    <button
                      onClick={() => handleQuickAddMysteryBox(box)}
                      className="w-full bg-[#FFF8F3] hover:bg-[#F5E6D3] text-[#6B4423] font-bold py-2 rounded-xl border border-[#E8D4C8] text-xs transition-colors cursor-pointer"
                    >
                      + הוספה מהירה לסל 🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full 18 Cookies Showcase Catalog Section */}
        <section className="py-12 px-4 bg-[#FFF8F3] border-t border-b border-[#E8D4C8]" ref={cookiesSectionRef}>
          <div className="max-w-6xl mx-auto" dir="rtl">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                כל העוגיות שלנו 🍪 (18 טעמים)
              </h2>
              <p className="text-base text-[#6B4423] mt-2">
                הכירו את כל 18 טעמי השחיתות של ברקת הנאפים טריים מדי שבוע
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {COOKIES.map((cookie) => {
                const cartSingleItem = cart.find(item => item.type === 'single' && item.id === cookie.id);
                const qtyInCart = cartSingleItem ? cartSingleItem.quantity : 0;

                return (
                  <div
                    key={cookie.id}
                    className="bg-white border-2 border-[#E8D4C8] hover:border-[#E8B4A8] rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all shadow-xs hover:shadow-md group"
                  >
                    <div className="w-full flex flex-col items-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-sm border border-[#E8D4C8] mb-3 flex items-center justify-center bg-[#FFF8F3]">
                        <img
                          src={cookie.image}
                          alt={cookie.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-bold text-[#3D2817] text-sm sm:text-base leading-tight">{cookie.name}</h3>
                      <p className="text-sm font-extrabold text-[#C85A54] mt-1">{cookie.price} ₪</p>
                      {renderAllergenBadges(cookie.allergens)}
                    </div>

                    <div className="w-full mt-3">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center justify-between bg-[#F5E6D3] rounded-xl p-1 w-full border border-[#E8D4C8]">
                          <button
                            type="button"
                            onClick={() => handleRemoveOneSingleCookie(cookie.id)}
                            className="w-8 h-8 flex items-center justify-center text-[#E8B4A8] hover:bg-white rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-base text-[#3D2817]">{qtyInCart}</span>
                          <button
                            type="button"
                            onClick={() => handleAddSingleCookie(cookie)}
                            className="w-8 h-8 flex items-center justify-center text-[#E8B4A8] hover:bg-white rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddSingleCookie(cookie)}
                          className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          הוסף לסל +
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-12 px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#3D2817] text-center mb-2" style={{ fontFamily: 'Alef' }}>
              לקוחות מפרגנים על המארזים 💬
            </h2>
            <div className="flex justify-center mb-8">
              <div className="h-1 w-20 bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" dir="rtl">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-5 rounded-2xl border border-[#E8D4C8] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-2 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-[#3D2817] italic leading-relaxed">"{review.text}"</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="font-bold text-xs text-[#6B4423]">{review.name}</span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-white border-2 border-[#E8B4A8] hover:bg-[#FFF8F3] text-[#3D2817] font-bold py-2 px-6 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                הוסף ביקורת משלך ✨
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#E8D4C8] bg-[#FFF8F3] text-center text-xs text-[#6B4423] mt-12 mb-16 sm:mb-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" dir="rtl">
          <p>© {new Date().getFullYear()} made.by.bareket — כל הזכויות שמורות</p>
          <a
            href="/admin"
            className="text-[#6B4423]/70 hover:text-[#C85A54] transition-colors p-2 rounded-xl hover:bg-[#E8B4A8]/20 flex items-center gap-1.5 font-bold border border-transparent hover:border-[#E8D4C8]"
            title="כניסה למערכת ניהול (Admin)"
          >
            <Shield size={18} className="text-[#C85A54]" />
            <span>כניסה למערכת ניהול 🛡️</span>
          </a>
        </div>
      </footer>

      {/* Active Mystery Box Preview Modal */}
      {activeMysteryBox && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" dir="rtl">
            <button
              onClick={() => setActiveMysteryBox(null)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>

            <div className="text-center mb-6">
              <span className="text-5xl block mb-2">{activeMysteryBox.config.emoji}</span>
              <h3 className="text-2xl font-black text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                {activeMysteryBox.config.name}
              </h3>
              <p className="text-sm text-[#6B4423] mt-1">
                האתר הציב עבורך {activeMysteryBox.config.size} טעמים אקראיים וייחודיים (שום טעם לא חוזר על עצמו!):
              </p>
              <p className="text-2xl font-extrabold text-[#C85A54] mt-2">
                {activeMysteryBox.config.price} ₪
              </p>
            </div>

            {/* Randomly Selected Unique Flavors Display */}
            <div className="bg-[#FFF8F3] border-2 border-[#E8D4C8] rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center border-b border-[#E8D4C8] pb-2">
                <span className="font-bold text-sm text-[#3D2817]">הטעמים הייחודיים במארז:</span>
                <button
                  type="button"
                  onClick={handleRerollMysteryFlavors}
                  className="text-xs font-extrabold text-[#C85A54] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#E8D4C8]"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>ערבב אקראית מחדש 🎲</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {activeMysteryBox.flavors.map(item => (
                  <div key={item.cookie.id} className="bg-white p-2.5 rounded-xl border border-[#E8D4C8] flex items-center gap-3">
                    <img
                      src={item.cookie.image}
                      alt={item.cookie.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-[#E8D4C8]"
                    />
                    <div className="text-right">
                      <p className="font-bold text-xs text-[#3D2817]">{item.cookie.name}</p>
                      <p className="text-[11px] text-[#6B4423] font-bold">1 עוגייה (טעם ייחודי)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveMysteryBox(null)}
                className="border-[#E8B4A8] text-[#3D2817] rounded-2xl py-3.5 px-4 font-bold cursor-pointer"
              >
                סגור
              </Button>
              <Button
                onClick={handleAddActiveMysteryBoxToCart}
                className="flex-1 bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3.5 rounded-2xl shadow-md cursor-pointer text-base"
              >
                הוסף מארז מיסטרי לסל 🛒
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Cart Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#E8B4A8] shadow-2xl p-4 z-50 animate-slide-up">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4" dir="rtl">
              <div className="flex-1 w-full md:w-auto text-right">
                <p className="font-semibold text-[#3D2817] text-sm sm:text-base mb-2">
                  בסל הקניות שלך: <span className="text-[#E8B4A8] font-bold">{getTotalCookieCount()} עוגיות</span> 
                  <span className="text-gray-300 mx-2">|</span>
                  סה"כ לתשלום: <span className="text-[#E8B4A8] font-bold">{getTotalPrice()} ₪</span>
                </p>
                <div className="flex flex-wrap gap-2 justify-start max-h-20 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.instanceId}
                      className="bg-[#F5E6D3] rounded-full px-3 py-1 flex items-center gap-2 text-sm border border-[#E8D4C8] shadow-xs"
                    >
                      <span className="font-bold text-[#3D2817]">{item.name}</span>
                      <span className="text-[#6B4423] font-bold">x{item.quantity}</span>
                      <button
                        onClick={() => handleRemoveCartItem(item.instanceId)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs p-0.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                        title="הסר פריט"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setIsCartOpen(true)}
                  variant="outline"
                  className="border-[#E8B4A8] text-[#3D2817] hover:bg-[#FFF8F3] rounded-2xl py-3.5 px-6 font-bold cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  צפייה בסל ({cart.length})
                </Button>
                <Button
                  onClick={handleOpenCheckout}
                  className="flex-1 md:flex-none bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3.5 px-8 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  קופה לתשלום 💳
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto" dir="rtl">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#E8D4C8] mb-6">
                <h2 className="text-2xl font-bold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                  סל הקניות שלך 🛒
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.instanceId} className="bg-[#FFF8F3] border border-[#E8D4C8] rounded-2xl p-4 shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-[#3D2817] text-lg">{item.name}</h3>
                        <p className="text-sm font-extrabold text-[#E8B4A8]">{item.price * item.quantity} ₪</p>
                      </div>
                      <button
                        onClick={() => handleRemoveCartItem(item.instanceId)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {item.flavors && item.flavors.length > 0 && (
                      <div className="text-xs text-[#6B4423] bg-white p-2.5 rounded-xl border border-[#E8D4C8] my-2 space-y-1">
                        <p className="font-bold text-[#3D2817] mb-1">טעמים אקראיים שנבחרו במארז:</p>
                        {item.flavors.map(f => (
                          <p key={f.cookie.id}>• {f.cookie.name} ({f.quantity})</p>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8D4C8]">
                      <span className="text-xs text-[#6B4423] font-semibold">כמות:</span>
                      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-[#E8D4C8]">
                        <button
                          onClick={() => handleUpdateQuantity(item.instanceId, -1)}
                          className="text-[#E8B4A8] font-bold hover:bg-gray-100 rounded px-1 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-[#3D2817] text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.instanceId, 1)}
                          className="text-[#E8B4A8] font-bold hover:bg-gray-100 rounded px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Birthday sign option */}
              <div className="bg-[#FFF8F3] p-4 rounded-2xl border border-[#E8D4C8] mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBirthdaySign}
                    onChange={(e) => setHasBirthdaySign(e.target.checked)}
                    className="w-5 h-5 accent-[#E8B4A8] rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[#3D2817] text-sm">הוספת שלט "מזל טוב" 🎉</span>
                    <span className="text-xs text-[#E8B4A8] font-extrabold mr-2">(+5 ₪)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-[#E8D4C8] pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-[#3D2817]">
                <span>סה"כ לתשלום:</span>
                <span className="text-[#E8B4A8] text-2xl font-black">{getTotalPrice()} ₪</span>
              </div>
              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  handleOpenCheckout();
                }}
                className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-4 rounded-2xl text-lg shadow-md cursor-pointer"
              >
                המשך לקופה לתשלום 💳
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {checkoutStep !== 'success' && (
              <div className="bg-[#FFF8F3] border border-[#E8D4C8] p-3.5 rounded-2xl mb-6 text-center text-sm font-semibold text-[#6B4423] mt-2" dir="rtl">
                {getOrderSummaryText()}
              </div>
            )}

            {/* Step 1: Customer Details */}
            {checkoutStep === 1 && (
              <div className="text-right space-y-4" dir="rtl">
                <div className="text-center mb-2">
                  <h3 className="text-2xl font-bold text-[#3D2817] mb-1" style={{ fontFamily: 'Alef' }}>
                    פרטי לקוח ואיסוף בחיפה
                  </h3>
                  <p className="text-sm text-[#6B4423]">
                    מלאו את הפרטים והסכימו לתנאים כדי להמשיך לתשלום
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-1">
                      שם מלא <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="הכנס שם מלא..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3]"
                      dir="rtl"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-1">
                      מספר טלפון (10 ספרות, למשל 0501234567) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0500000000"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneError('');
                      }}
                      className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3]"
                      dir="rtl"
                    />
                    {phoneError && (
                      <p className="text-red-500 text-xs mt-1 font-semibold">{phoneError}</p>
                    )}
                  </div>

                  {/* Pick-up Day Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-1">
                      יום איסוף (בסוף השבוע בחיפה) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={pickupDay}
                      onChange={(e) => setPickupDay(e.target.value)}
                      className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3] cursor-pointer outline-none"
                    >
                      <option value="">בחר יום איסוף...</option>
                      <option value="יום חמישי">יום חמישי</option>
                      <option value="יום שישי">יום שישי</option>
                      <option value="יום שבת">יום שבת</option>
                    </select>
                  </div>

                  {/* Pick-up Time Window Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-1">
                      טווח שעות איסוף <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={pickupTimeSlot}
                      onChange={(e) => setPickupTimeSlot(e.target.value)}
                      className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3] cursor-pointer outline-none"
                    >
                      <option value="">בחר טווח שעות...</option>
                      <option value="09:00 - 11:00">09:00 - 11:00</option>
                      <option value="11:00 - 13:00">11:00 - 13:00</option>
                      <option value="13:00 - 15:00">13:00 - 15:00</option>
                      <option value="15:00 - 17:00">15:00 - 17:00</option>
                      <option value="17:00 - 19:00">17:00 - 19:00</option>
                      <option value="18:00 - 20:00">18:00 - 20:00</option>
                    </select>
                  </div>
                </div>

                {renderPickupDetails()}

                <div className="space-y-2 mt-4 pt-2 border-t border-gray-100">
                  {/* Allergy policy checkbox */}
                  <div className="bg-[#FFFBF7] p-2.5 rounded-xl border border-gray-100">
                    <label className="flex gap-2.5 items-start cursor-pointer text-xs sm:text-sm text-[#6B4423]">
                      <input
                        type="checkbox"
                        checked={allergyConfirmed}
                        onChange={(e) => setAllergyConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-2 border-[#E8D4C8] text-[#E8B4A8] focus:ring-[#E8B4A8] accent-[#E8B4A8] cursor-pointer"
                      />
                      <span className="mr-2">
                        <span className="text-red-500 font-bold">*</span> אני מודע.ת לעובדה שהכל homemade והאחריות על האלרגיות היא על המזמין.
                      </span>
                    </label>
                  </div>

                  {/* Cancellation policy checkbox */}
                  <div className="bg-[#FFFBF7] p-2.5 rounded-xl border border-gray-100">
                    <label className="flex gap-2.5 items-start cursor-pointer text-xs sm:text-sm text-[#6B4423]">
                      <input
                        type="checkbox"
                        checked={cancellationConfirmed}
                        onChange={(e) => setCancellationConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-2 border-[#E8D4C8] text-[#E8B4A8] focus:ring-[#E8B4A8] accent-[#E8B4A8] cursor-pointer"
                      />
                      <span className="mr-2">
                        <span className="text-red-500 font-bold">*</span> אני יודע.ת שאם לא הגעתי בטווח השעות שכתבתי ולא הודעתי 24 שעות מראש התשלום יחויב באופן מלא.
                      </span>
                    </label>
                  </div>

                  {/* Self-Pickup Checkbox */}
                  <div className="bg-[#FFFBF7] p-2.5 rounded-xl border border-gray-100">
                    <label className="flex gap-2.5 items-start cursor-pointer text-xs sm:text-sm text-[#6B4423]">
                      <input
                        type="checkbox"
                        checked={isSelfPickupConfirmed}
                        onChange={(e) => setIsSelfPickupConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-2 border-[#E8D4C8] text-[#E8B4A8] focus:ring-[#E8B4A8] accent-[#E8B4A8] cursor-pointer"
                      />
                      <span className="mr-2">
                        <span className="text-red-500 font-bold">*</span> אני מאשר/ת שההזמנה היא לאיסוף עצמי מחיפה בלבד בסוף השבוע (הזמנות בימים א'–ד').
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                {(() => {
                  const cleanPhone = phoneNumber.replace(/[-\s]/g, '');
                  const isPhoneValid = /^05\d{8}$/.test(cleanPhone);
                  const isFormValid = 
                    fullName.trim() !== '' && 
                    isPhoneValid &&
                    pickupDay !== '' && 
                    pickupTimeSlot !== '' && 
                    allergyConfirmed && 
                    cancellationConfirmed && 
                    isSelfPickupConfirmed;

                  return (
                    <div className="pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        className="border-[#E8B4A8] text-[#3D2817] hover:bg-[#F5E6D3] rounded-2xl py-3.5 px-4 text-base transition-colors duration-200 cursor-pointer"
                        onClick={() => setIsCheckoutOpen(false)}
                      >
                        ביטול
                      </Button>
                      <Button
                        disabled={!isFormValid}
                        onClick={handleProceedToPayment}
                        className={`flex-1 font-bold py-3.5 rounded-2xl text-base transition-all duration-300 cursor-pointer ${
                          isFormValid
                            ? 'bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] shadow-md hover:shadow-lg active:scale-[0.98]'
                            : 'bg-gray-300 text-gray-[#555] cursor-not-allowed border-none shadow-none'
                        }`}
                      >
                        המשך לתשלום ב-Bit 💳
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 2: Payment Step */}
            {checkoutStep === 2 && (
              <div className="text-right space-y-6" dir="rtl">
                <div className="text-center mb-2">
                  <span className="bg-[#E8B4A8]/20 text-[#6B4423] font-bold px-4 py-1.5 rounded-full text-sm inline-block mb-2">
                    הזמנה מספר #{currentOrderId}
                  </span>
                  <h3 className="text-2xl font-bold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                    אישור ותשלום ב-Bit
                  </h3>
                </div>

                {/* Big & Clear Exact Sum Display */}
                <div className="bg-[#FFF8F3] border-2 border-[#E8B4A8] rounded-2xl p-5 text-center shadow-sm">
                  <p className="text-sm font-semibold text-[#6B4423] mb-1">סכום מדויק להעברה:</p>
                  <p className="text-4xl font-black text-[#C85A54] tracking-tight">{getTotalPrice()} ₪</p>
                </div>

                <div className="space-y-3">
                  <a
                    href="https://www.bitpay.co.il/app/me/ADF769B1-C5CB-4F12-98D2-C628177192C5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#00A896] hover:bg-[#008678] text-white font-bold py-4 px-6 rounded-2xl text-center block shadow-md hover:shadow-lg transition-all text-lg cursor-pointer"
                  >
                    📲 לחצו כאן למעבר תשלום ב-Bit
                  </a>

                  <a
                    href={`https://wa.me/972549232429?text=${encodeURIComponent(`היי! ביצעתי העברת Bit עבור הזמנה #${currentOrderId} על שם ${fullName} בסך ${getTotalPrice()} ₪ 🍪`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3.5 px-6 rounded-2xl text-center flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all text-base cursor-pointer"
                  >
                    💬 שלח אישור תשלום בוואטסאפ
                  </a>
                </div>

                {renderPickupDetails()}

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="border-[#E8B4A8] text-[#3D2817] hover:bg-[#F5E6D3] rounded-2xl py-3.5 px-4 text-base transition-colors duration-200 cursor-pointer"
                    onClick={() => setCheckoutStep(1)}
                  >
                    חזור
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-extrabold py-4 rounded-2xl text-base transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    שילמתי ב-Bit, אשר הזמנה ✨
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {checkoutStep === 'success' && (
              <div className="text-center space-y-6 py-4" dir="rtl">
                <div className="flex justify-center">
                  <div className="text-6xl md:text-7xl animate-bounce" style={{ animationDuration: '2s' }}>
                    🍪
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="bg-[#E8B4A8]/20 text-[#6B4423] font-bold px-4 py-1.5 rounded-full text-sm inline-block">
                    הזמנה #{currentOrderId} אושרה!
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#E8B4A8]" style={{ fontFamily: 'Alef' }}>
                    העוגיות כבר בתנור! ✨
                  </h3>
                  <p className="text-base text-[#3D2817] font-semibold leading-relaxed">
                    תודה רבה {fullName}! קיבלנו את ההזמנה ואנחנו מתחילים לאפות באהבה!
                  </p>
                </div>

                <div className="bg-[#FFF8F3] border-2 border-dashed border-[#E8D4C8] rounded-2xl p-5 space-y-3 text-center">
                  <p className="text-sm font-bold text-[#C85A54]">
                    📍 איסוף עצמי מחיפה בלבד!
                  </p>
                  <p className="text-sm text-[#6B4423]">
                    <strong>מועד איסוף:</strong> נקבע ליום <strong>{pickupDay}</strong> בטווח <strong>{pickupTimeSlot}</strong>.
                  </p>
                </div>

                <Button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3.5 rounded-2xl text-base transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  סגור והמשך לגלוש
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative" dir="rtl">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-[#3D2817] mb-4 text-center" style={{ fontFamily: 'Alef' }}>
              הוספת ביקורת ✨
            </h3>

            {reviewMessage ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-center font-bold my-4 border border-emerald-200">
                {reviewMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3D2817] mb-1">שם מלא</label>
                  <input
                    type="text"
                    placeholder="השם שלך..."
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3D2817] mb-1">דירוג</label>
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-8 h-8 ${star <= newReviewRating ? 'fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3D2817] mb-1">הביקורת שלך</label>
                  <textarea
                    rows={3}
                    placeholder="מה חשבת על העוגיות ומארזי המיסטרי?..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3]"
                  />
                </div>

                <Button
                  onClick={handleAddReview}
                  disabled={!newReviewName.trim() || !newReviewText.trim()}
                  className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3.5 rounded-2xl text-base shadow-md cursor-pointer"
                >
                  שליחת ביקורת 💌
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Padding for sticky cart */}
      {cart.length > 0 && <div className="h-48 md:h-32"></div>}
    </div>
  );
}
