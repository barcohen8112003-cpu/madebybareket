import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Instagram, ShoppingCart, Trash2, Plus, Minus, Star, Heart, Calendar, Clock, Gift, Info, Check } from 'lucide-react';

interface Cookie {
  id: string;
  name: string;
  price: number;
  emoji?: string;
  image?: string;
}

interface CartItem {
  instanceId: string;
  type: 'single' | 'box';
  id: string; // cookie ID, or 'box-4' / 'box-6'
  name: string;
  price: number;
  image?: string;
  flavors?: { cookie: Cookie; quantity: number }[]; // list of chosen flavors for box
  quantity: number;
}

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  date: string;
}

const COOKIES: Cookie[] = [
  { id: '1', name: 'קורנפלקס', price: 15, image: 'cookies/cornflakes.jpg' },
  { id: '2', name: 'כריות קליק', price: 16, image: 'cookies/kinder.jpeg' },
  { id: '3', name: 'הרשיז', price: 16, image: 'cookies/oreo.jpg' },
  { id: '4', name: 'בוואנו', price: 15, image: 'cookies/b1.jpeg' },
  { id: '5', name: 'אמסטרדם', price: 15, image: 'cookies/amsterdam.png' },
  { id: '6', name: 'בייגלה מלוח', price: 16, image: 'cookies/pretzel.png' },
  { id: '7', name: 'לוטוס', price: 15, image: 'cookies/lotus.png' },
  { id: '8', name: 'נוטלה', price: 13, image: 'cookies/nutella.png' },
  { id: '9', name: 'במבה אדומה', price: 16, image: 'cookies/red_bamba.jpeg' },
  { id: '10', name: 'שוקולד חלב', price: 13, image: 'cookies/milk_choclat.jpeg' },
  { id: '11', name: 'טריקולד', price: 16, image: 'cookies/trikold.jpeg' },
  { id: '12', name: 'ספרינקלס', price: 14, image: 'cookies/sprinkels.jpeg' },
  { id: '13', name: "M&M's", price: 17, image: 'cookies/m&m.jpeg' },
  { id: '14', name: 'חצי חצי', price: 16, image: 'cookies/half_half.jpeg' },
  { id: '15', name: 'קינדר', price: 16, image: 'cookies/kinder.jpg' },
];

interface BoxConfig {
  size: number;
  name: string;
  price: number;
  emoji: string;
  description: string;
}

const BOXES: BoxConfig[] = [
  { size: 2, name: 'מארז 2 עוגיות', price: 38, emoji: '📦', description: 'הרכיבו מארז של 2 עוגיות בטעמים שתבחרו' },
  { size: 4, name: 'מארז 4 עוגיות', price: 70, emoji: '📦', description: 'הרכיבו מארז של 4 עוגיות בטעמים שתבחרו' },
  { size: 5, name: 'מארז 5 עוגיות', price: 83, emoji: '📦', description: 'הרכיבו מארז של 5 עוגיות בטעמים שתבחרו' },
  { size: 6, name: 'מארז 6 עוגיות', price: 95, emoji: '🎁', description: 'הרכיבו מארז של 6 עוגיות בטעמים שתבחרו' },
  { size: 8, name: 'מארז 8 עוגיות', price: 125, emoji: '🎁', description: 'הרכיבו מארז של 8 עוגיות בטעמים שתבחרו' },
  { size: 10, name: 'מארז 10 עוגיות', price: 150, emoji: '🎉', description: 'הרכיבו מארז של 10 עוגיות בטעמים שתבחרו' },
];

const TELEGRAM_BOT_TOKEN = "8848230768:AAEt9orzMdgl0HLry2kW12L1-XylnYe9F7Q" as string;
const TELEGRAM_CHAT_ID = "8768411817" as string;

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 'success'>(1);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSelfPickupConfirmed, setIsSelfPickupConfirmed] = useState(false);
  const [pickupDay, setPickupDay] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false);
  const [hasBirthdaySign, setHasBirthdaySign] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Box customization state
  const [boxSize, setBoxSize] = useState<number | null>(null);
  const [boxFlavors, setBoxFlavors] = useState<Record<string, number>>({});
  const [editingBoxInstanceId, setEditingBoxInstanceId] = useState<string | null>(null);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
  const [isEditChoiceOpen, setIsEditChoiceOpen] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', name: 'שירה ד.', text: 'העוגיות הכי טעימות בארץ בפער! הכריות קליק פשוט מושלם והגיע חם ונימוח.', rating: 5, date: '12/07/2026' },
    { id: 'r2', name: 'גיא ל.', text: 'מזמין כל שבוע מחדש! השירות מדהים והעוגיות ממכרות בטירוף, במיוחד הקורנפלקס.', rating: 5, date: '10/07/2026' },
    { id: 'r3', name: 'מעיין א.', text: 'מארז מושלם לאירוחים או סתם כשמתחשק משהו מתוק ואיכותי. ממליצה בחום!', rating: 5, date: '05/07/2026' }
  ]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const cookiesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedReviews = localStorage.getItem('bareket_reviews');
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        console.error("Error loading reviews", e);
      }
    }
  }, []);

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

  const handleAddCookie = (cookie: Cookie) => {
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
  };

  const handleRemoveOneCookie = (cookieId: string) => {
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

  const handleOpenBoxModal = (size: number, editingInstanceId: string | null = null) => {
    setBoxSize(size);
    setEditingBoxInstanceId(editingInstanceId);
    
    const initialFlavors: Record<string, number> = {};
    COOKIES.forEach(c => {
      initialFlavors[c.id] = 0;
    });

    if (editingInstanceId) {
      const existingItem = cart.find(item => item.instanceId === editingInstanceId);
      if (existingItem && existingItem.flavors) {
        existingItem.flavors.forEach(f => {
          initialFlavors[f.cookie.id] = f.quantity;
        });
      }
    }
    
    setBoxFlavors(initialFlavors);
  };

  const handleCloseBoxModal = () => {
    setBoxSize(null);
    setEditingBoxInstanceId(null);
    setShowUpgradeOptions(false);
  };

  const handleAdjustBoxFlavor = (cookieId: string, delta: number) => {
    setBoxFlavors(prev => {
      const currentCount = prev[cookieId] || 0;
      const totalSelected = Object.values(prev).reduce((sum, val) => sum + val, 0);
      
      if (delta > 0 && totalSelected >= (boxSize || 0)) return prev;
      if (delta < 0 && currentCount <= 0) return prev;
      
      return {
        ...prev,
        [cookieId]: currentCount + delta
      };
    });
  };

  const handleUpgradeBoxSize = (newSize: number) => {
    setBoxSize(newSize);
    
    // Adjust flavors if newSize is smaller than current selections
    setBoxFlavors(prev => {
      const currentFlavors = { ...prev };
      let totalSelected = Object.values(currentFlavors).reduce((sum, val) => sum + val, 0);
      
      if (totalSelected > newSize) {
        // Truncate flavors until we reach newSize
        const entries = Object.entries(currentFlavors).filter(([_, qty]) => qty > 0);
        for (const [cookieId, qty] of entries) {
          const diff = totalSelected - newSize;
          if (qty >= diff) {
            currentFlavors[cookieId] = qty - diff;
            break;
          } else {
            totalSelected -= qty;
            currentFlavors[cookieId] = 0;
          }
        }
      }
      return currentFlavors;
    });
    
    setShowUpgradeOptions(false);
  };

  const handleAddBoxToCart = () => {
    if (!boxSize) return;
    const selectedFlavorsList: { cookie: Cookie; quantity: number }[] = [];
    Object.entries(boxFlavors).forEach(([cookieId, qty]) => {
      if (qty > 0) {
        const cookie = COOKIES.find(c => c.id === cookieId);
        if (cookie) {
          selectedFlavorsList.push({ cookie, quantity: qty });
        }
      }
    });

    const boxConfig = BOXES.find(b => b.size === boxSize);
    const boxPrice = boxConfig ? boxConfig.price : 95;
    const boxName = `מארז ${boxSize} עוגיות`;

    if (editingBoxInstanceId) {
      setCart(prev => prev.map(item => {
        if (item.instanceId === editingBoxInstanceId) {
          return {
            ...item,
            flavors: selectedFlavorsList
          };
        }
        return item;
      }));
      setEditingBoxInstanceId(null);
    } else {
      setCart(prev => [
        ...prev,
        {
          instanceId: `box-${boxSize}-${Date.now()}-${Math.random()}`,
          type: 'box',
          id: `box-${boxSize}`,
          name: boxName,
          price: boxPrice,
          image: 'logo.png',
          flavors: selectedFlavorsList,
          quantity: 1
        }
      ]);
    }

    setBoxSize(null);
    setShowUpgradeOptions(false);
  };

  const handleAddReview = () => {
    if (!newReviewName.trim() || !newReviewText.trim()) return;
    const newReview: Review = {
      id: `r-${Date.now()}`,
      name: newReviewName,
      text: newReviewText,
      rating: newReviewRating,
      date: new Date().toLocaleDateString('he-IL')
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('bareket_reviews', JSON.stringify(updatedReviews));
    
    setNewReviewName('');
    setNewReviewText('');
    setNewReviewRating(5);
    setIsReviewModalOpen(false);
  };

  const handleOpenCheckout = () => {
    setCheckoutStep(1);
    setFullName('');
    setPhoneNumber('');
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
      if (item.type === 'box') {
        const boxSizeNum = parseInt(item.id.replace('box-', '')) || 0;
        return sum + (boxSizeNum * item.quantity);
      }
      return sum;
    }, 0);
  };

  const getOrderSummaryText = () => {
    const summaryParts = cart.map(item => {
      if (item.type === 'single') {
        return `${item.quantity} x ${item.name}`;
      } else {
        const flavorDesc = item.flavors?.map(f => `${f.cookie.name} (${f.quantity})`).join(', ');
        return `${item.quantity} x ${item.name} [${flavorDesc}]`;
      }
    });
    if (hasBirthdaySign) {
      summaryParts.push("שלט מזל טוב (+5 ₪)");
    }
    return `סיכום הזמנה: ${summaryParts.join(' | ')} | סה״כ: ${getTotalPrice()} ₪`;
  };

  const sendTelegramNotification = async () => {
    if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
      console.warn("Telegram Chat ID is not configured.");
      return;
    }

    const orderSummaryText = cart.map(item => {
      if (item.type === 'single') {
        return `${item.quantity} x ${item.name}`;
      } else {
        const flavorsStr = item.flavors?.map(f => `${f.cookie.name} (${f.quantity})`).join(', ');
        return `${item.quantity} x ${item.name} (${flavorsStr})`;
      }
    }).join('\n');

    const totalPrice = getTotalPrice();

    const now = new Date();
    const formattedDateTime = now.toLocaleString('he-IL', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const birthdaySignText = hasBirthdaySign ? "כן (+5 ₪)" : "לא";

    const message = `🚨 *הזמנה חדשה התקבלה מ-Made by Bareket!* 🍪\n\n*שם הלקוח:* ${fullName}\n*טלפון:* ${phoneNumber}\n*יום איסוף:* ${pickupDay}\n*טווח שעות איסוף:* ${pickupTimeSlot}\n*שלט מזל טוב:* ${birthdaySignText}\n\n*פירוט ההזמנה:*\n${orderSummaryText}\n\n*סכום לתשלום:* ${totalPrice} ₪\n*תאריך ושעה:* ${formattedDateTime}\n\n🔴 *מחכה לאימות תשלום ב-Bit!* ⚠️`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send Telegram notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  const handlePaymentClick = async () => {
    const cleanPhone = phoneNumber.replace(/[-\s]/g, '');
    const isFormValid = 
      fullName.trim() !== '' && 
      cleanPhone.length >= 9 && 
      pickupDay !== '' && 
      pickupTimeSlot !== '' && 
      allergyConfirmed && 
      cancellationConfirmed && 
      isSelfPickupConfirmed;

    if (!isFormValid) return;

    if (isDesktop) {
      setCheckoutStep(2);
    } else {
      await sendTelegramNotification();

      window.open('https://www.bitpay.co.il/app/me/ADF769B1-C5CB-4F12-98D2-C628177192C5', '_blank');

      setCart([]);
      setCheckoutStep('success');
    }
  };

  const handleFinalizeDesktopPayment = async () => {
    await sendTelegramNotification();
    
    setCart([]);
    setCheckoutStep('success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#FFF8F3] to-[#F5E6D3]">
      {/* Social Floating Buttons */}
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

            {boxSize === null ? (
        <div key="landing-page-view" className="space-y-12">
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-8 pb-8 px-4">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-20 w-40 h-40 bg-[#E8B4A8] rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-10 w-60 h-60 bg-[#F5E6D3] rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto text-center">
              <div className="mb-4 flex justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                <img src="logo.png" alt="made.by.bareket logo" className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-lg border-4 border-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#3D2817] mb-4" style={{ fontFamily: 'Alef' }}>
                made.by.bareket
              </h1>
              <div className="inline-block bg-[#E8B4A8]/20 text-[#6B4423] font-bold px-4 py-2 rounded-full mb-6 text-sm md:text-base border border-[#E8B4A8]">
                🕒 מזמינים ראשון עד רביעי ומקבלים בסופש
              </div>
              <div className="h-1 w-24 bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] mx-auto rounded-full"></div>
            </div>
          </section>

          {/* Special Bundles Section */}
          <section className="py-6 px-4 pb-20">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-[#3D2817] text-center mb-2" style={{ fontFamily: 'Alef' }}>
                מארזים מפנקים במחיר מיוחד 🎁
              </h2>
              <p className="text-center text-[#6B4423] mb-8">
                הרכיבו מארז מושלם מהעוגיות האהובות עליכם
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto" dir="rtl">
                {BOXES.map((box) => (
                  <div
                    key={box.size}
                    className="bg-white border-2 border-[#E8D4C8] hover:border-[#E8B4A8] hover:shadow-lg rounded-3xl p-5 transition-all flex flex-col justify-between items-center text-center group"
                  >
                    <div className="mb-4">
                      <span className="text-4xl md:text-5xl">{box.emoji}</span>
                      <h3 className="font-bold text-[#3D2817] text-lg md:text-xl mt-3">{box.name}</h3>
                      <p className="text-xs md:text-sm text-[#6B4423] mt-1">{box.description}</p>
                      <p className="text-xl md:text-2xl font-black text-[#E8B4A8] mt-3">{box.price} ₪</p>
                    </div>
                    <Button
                      onClick={() => handleOpenBoxModal(box.size)}
                      className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-white font-bold py-2 md:py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm md:text-base"
                    >
                      הרכב מארז
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <section className="py-12 px-4 bg-[#FFF8F3] border-t border-b border-[#E8D4C8] pb-24">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-[#3D2817] text-center mb-2" style={{ fontFamily: 'Alef' }}>
                לקוחות מפרגנים עלינו 💬
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
                  className="bg-white border-2 border-[#E8B4A8] hover:bg-[#FFF8F3] text-[#E8B4A8] font-bold py-2 px-6 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  הוסף ביקורת משלך ✨
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div key="configurator-page-view">
          <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in" dir="rtl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-[#E8D4C8]">
            <div>
              <h2 className="text-3xl font-extrabold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>
                {editingBoxInstanceId ? 'עריכת הרכב מארז' : `הרכבת מארז של ${boxSize} עוגיות`}
              </h2>
              <p className="text-sm text-[#6B4423] mt-1.5">
                בחרו בדיוק {boxSize} עוגיות לפי הטעם שלכם
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto relative">
              {/* Upgrade Button */}
              {BOXES.some(b => b.size !== boxSize) && (
                <div className="relative">
                  <button
                    onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
                    className="bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] hover:from-[#D89B8E] hover:to-[#C88A7E] text-white font-bold py-2.5 px-5 rounded-2xl text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡ שדרוג/שינוי מארז</span>
                    <span className="text-xs opacity-80">▼</span>
                  </button>
                  
                  {showUpgradeOptions && (
                    <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white border border-[#E8D4C8] shadow-xl z-50 p-2 animate-fade-in">
                      <p className="text-xs text-[#6B4423] font-bold text-center mb-1.5 border-b border-gray-100 pb-1">שדרוג/שינוי מארז ל:</p>
                      {BOXES.filter(b => b.size !== boxSize).map(b => (
                        <button
                          key={b.size}
                          onClick={() => handleUpgradeBoxSize(b.size)}
                          className="w-full text-right hover:bg-[#FFF8F3] hover:text-[#E8B4A8] font-bold text-sm text-[#3D2817] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex justify-between items-center"
                        >
                          <span>{b.name}</span>
                          <span className="text-xs text-[#E8B4A8] font-normal">{b.price} ₪</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleCloseBoxModal}
                className="border-2 border-[#E8B4A8] text-[#E8B4A8] hover:bg-[#F5E6D3] font-bold py-2 px-5 rounded-2xl text-sm transition-all cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#E8D4C8] shadow-md mb-8">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-[#3D2817]">התקדמות המארז:</span>
              <span className="font-extrabold text-xl text-[#E8B4A8]">
                {Object.values(boxFlavors).reduce((sum, val) => sum + val, 0)} מתוך {boxSize} עוגיות
              </span>
            </div>
            
            <div className="w-full bg-[#E8D4C8] h-3 rounded-full overflow-hidden mt-3 shadow-inner">
              <div 
                className="bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] h-full transition-all duration-500 rounded-full"
                style={{ width: `${(Object.values(boxFlavors).reduce((sum, val) => sum + val, 0) / boxSize) * 100}%` }}
              />
            </div>
          </div>

          {/* Cookies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-24">
            {COOKIES.map((cookie) => {
              const count = boxFlavors[cookie.id] || 0;
              const totalSelected = Object.values(boxFlavors).reduce((sum, val) => sum + val, 0);

              return (
                <div
                  key={cookie.id}
                  className={`bg-white border-2 rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all duration-300 ${
                    count > 0 ? 'border-[#E8B4A8] shadow-md scale-[1.02]' : 'border-[#E8D4C8] hover:border-[#E8B4A8]'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex justify-center mb-3">
                      <img
                        src={cookie.image}
                        alt={cookie.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm border border-[#E8D4C8]"
                      />
                    </div>
                    <h3 className="font-bold text-[#3D2817] text-base mb-1 line-clamp-1">{cookie.name}</h3>
                    <div className="mb-4"></div>
                  </div>

                  <div className="w-full">
                    {count > 0 ? (
                      <div className="flex items-center justify-between bg-[#F5E6D3] rounded-xl p-1 w-full border border-[#E8D4C8]">
                        <button
                          type="button"
                          onClick={() => handleAdjustBoxFlavor(cookie.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-[#E8B4A8] hover:bg-white rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-base text-[#3D2817]">{count}</span>
                        <button
                          type="button"
                          disabled={totalSelected >= boxSize}
                          onClick={() => handleAdjustBoxFlavor(cookie.id, 1)}
                          className={`w-8 h-8 flex items-center justify-center text-[#E8B4A8] hover:bg-white rounded-lg font-bold transition-colors ${
                            totalSelected >= boxSize ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={totalSelected >= boxSize}
                        onClick={() => handleAdjustBoxFlavor(cookie.id, 1)}
                        className={`w-full font-bold py-2 rounded-xl text-sm transition-all duration-300 ${
                          totalSelected >= boxSize
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#E8B4A8] hover:bg-[#D89B8E] text-white cursor-pointer active:scale-95'
                        }`}
                      >
                        הוסף למארז
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Finish Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8D4C8] shadow-2xl py-4 px-6 z-40">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-right">
                <p className="text-sm text-[#6B4423]">
                  נבחרו <span className="font-bold text-[#E8B4A8]">{Object.values(boxFlavors).reduce((sum, val) => sum + val, 0)}</span> מתוך <span className="font-bold text-[#3D2817]">{boxSize}</span> עוגיות
                </p>
                <p className="text-lg font-extrabold text-[#3D2817]">
                  מחיר המארז: <span className="text-[#E8B4A8]">{BOXES.find(b => b.size === boxSize)?.price || 0} ₪</span>
                </p>
              </div>

              {Object.values(boxFlavors).reduce((sum, val) => sum + val, 0) === boxSize ? (
                <button
                  onClick={handleAddBoxToCart}
                  className="w-full sm:w-auto bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] hover:from-[#D89B8E] hover:to-[#C88A7E] text-white font-bold py-3.5 px-10 rounded-2xl text-base transition-all duration-300 shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{editingBoxInstanceId ? 'שמור שינויים במארז ✨' : 'הוסף מארז לסל 🛒'}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto bg-gray-200 text-gray-400 font-bold py-3.5 px-10 rounded-2xl text-base cursor-not-allowed"
                >
                  🔒 בחרו עוד {boxSize - Object.values(boxFlavors).reduce((sum, val) => sum + val, 0)} עוגיות להשלמה
                </button>
              )}
            </div>
          </div>
        </main>
        </div>
      )}

      

      {/* Sticky Cart Bar */}
      {cart.length > 0 && !isCartOpen && boxSize === null && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#E8B4A8] shadow-2xl p-4 z-50 animate-slide-up">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4" dir="rtl">
              <div className="flex-1 w-full md:w-auto text-right">
                <p className="font-semibold text-[#3D2817] text-sm sm:text-base mb-2">
                  בסל הקניות שלך: <span className="text-[#E8B4A8] font-bold">{getTotalCookieCount()} עוגיות</span> 
                  <span className="text-gray-300 mx-2">|</span>
                  סה"כ לתשלום: <span className="text-[#E8B4A8] font-bold">{getTotalPrice()} ₪</span>
                </p>
                {/* List of items inside the sticky bar with delete functionality */}
                <div className="flex flex-wrap gap-2 justify-start max-h-20 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.instanceId}
                      className="bg-[#F5E6D3] rounded-full px-3 py-1 flex items-center gap-2 text-sm border border-[#E8D4C8] shadow-xs"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-6 h-6 rounded-full object-cover shadow-xs border border-[#E8D4C8]"
                        />
                      ) : (
                        <span className="text-sm">🍪</span>
                      )}
                      <span className="text-[#3D2817] font-semibold">
                        {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                      </span>
                      <button
                        onClick={() => handleRemoveCartItem(item.instanceId)}
                        className="text-[#E8B4A8] hover:text-red-500 mr-1 flex items-center transition-colors cursor-pointer"
                        title="הסר מהסל"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full md:w-auto bg-gradient-to-l from-[#E8B4A8] to-[#D89B8E] hover:from-[#D89B8E] hover:to-[#C88A7E] text-white font-bold py-2.5 px-6 rounded-xl text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                style={{ animationDuration: '3s' }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>צפייה בסל ({getTotalPrice()} ₪)</span>
              </Button>
            </div>
          </div>
        </div>
      )}

          {/* Floating Edit Box Button */}
      {boxSize === null && !isCartOpen && cart.some(item => item.type === 'box') && (
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={() => {
              const boxes = cart.filter(item => item.type === 'box');
              if (boxes.length === 1) {
                const box = boxes[0];
                const size = parseInt(box.id.replace('box-', '')) || 4;
                handleOpenBoxModal(size, box.instanceId);
              } else {
                setIsEditChoiceOpen(true);
              }
            }}
            className="bg-white hover:bg-[#FFF8F3] text-[#3D2817] border-2 border-[#E8B4A8] font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
            title="עריכת מארז קיים"
            dir="rtl"
          >
            <span>📝 עריכת מארז בסל</span>
          </button>
        </div>
      )}

      {/* Sliding Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l-2 border-[#E8D4C8]">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E8D4C8] flex justify-between items-center bg-[#FFF8F3]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-[#E8B4A8]" />
                  <h3 className="text-xl font-bold text-[#3D2817]" style={{ fontFamily: 'Alef' }}>סל הקניות שלך</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body (Items List) */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                    <span className="text-5xl">🍪</span>
                    <p className="text-lg font-bold text-[#3D2817]">סל הקניות ריק</p>
                    <p className="text-sm text-[#6B4423]">התחילו לבחור עוגיות ומארזים מהתפריט!</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.instanceId} className="flex gap-3 bg-[#FFFBF7] border border-[#E8D4C8] p-3 rounded-2xl relative shadow-xs text-right">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#E8D4C8]"
                      />
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-[#3D2817] text-sm sm:text-base">{item.name}</h4>
                          {item.type === 'box' && item.flavors && (
                            <>
                              <p className="text-xs text-[#6B4423] mt-1 leading-relaxed">
                                {item.flavors.map(f => `${f.cookie.name} (${f.quantity})`).join(', ')}
                              </p>
                              <button
                                onClick={() => {
                                  const sizeNum = parseInt(item.id.replace('box-', '')) || 4;
                                  handleOpenBoxModal(sizeNum, item.instanceId);
                                }}
                                className="text-xs text-[#E8B4A8] hover:text-[#D89B8E] mt-1 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                ערוך הרכב מארז 📝
                              </button>
                            </>
                          )}
                          <p className="text-xs font-bold text-[#E8B4A8] mt-1">{item.price} ₪</p>
                        </div>

                        {/* Adjust quantities */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-2 bg-[#F5E6D3] rounded-xl px-1.5 py-0.5 border border-[#E8D4C8]">
                            <button
                              onClick={() => handleUpdateQuantity(item.instanceId, -1)}
                              className="text-[#E8B4A8] hover:text-[#D89B8E] font-bold text-base w-5 h-5 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-sm text-[#3D2817] w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.instanceId, 1)}
                              className="text-[#E8B4A8] hover:text-[#D89B8E] font-bold text-base w-5 h-5 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          
                          <span className="font-bold text-sm text-[#3D2817]">{item.price * item.quantity} ₪</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveCartItem(item.instanceId)}
                        className="absolute top-2 left-2 text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="הסר מהסל"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="border-t border-[#E8D4C8] px-6 py-5 bg-[#FFF8F3] space-y-4">
                  {/* Happy Birthday upgrade */}
                  <div className="bg-white p-3 rounded-2xl border border-[#E8D4C8] flex justify-between items-center shadow-xs">
                    <label className="flex gap-2.5 items-center cursor-pointer text-sm text-[#6B4423] w-full">
                      <input
                        type="checkbox"
                        checked={hasBirthdaySign}
                        onChange={(e) => setHasBirthdaySign(e.target.checked)}
                        className="w-4 h-4 rounded border-2 border-[#E8D4C8] text-[#E8B4A8] accent-[#E8B4A8] cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 mr-2">
                        <span>🎂</span>
                        <strong>הוספת שלט "מזל טוב" קטן</strong> (+5 ₪)
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <div className="flex justify-between text-sm text-[#6B4423]">
                      <span>סיכום ביניים:</span>
                      <span>{getSubtotal()} ₪</span>
                    </div>
                    {hasBirthdaySign && (
                      <div className="flex justify-between text-sm text-[#6B4423]">
                        <span>שלט מזל טוב:</span>
                        <span>5 ₪</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-[#3D2817] border-t border-[#E8D4C8] pt-2 mt-1">
                      <span>סה"כ לתשלום:</span>
                      <span>{getTotalPrice()} ₪</span>
                    </div>
                  </div>

                  {getTotalCookieCount() >= 2 ? (
                    <Button
                      className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-white font-bold py-3.5 rounded-2xl text-base transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => {
                        setIsCartOpen(false);
                        handleOpenCheckout();
                      }}
                    >
                      <span>מעבר לקופה</span>
                    </Button>
                  ) : (
                    <div className="space-y-1">
                      <Button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-bold py-3.5 rounded-2xl text-base cursor-not-allowed"
                      >
                        🔒 מינימום להזמנה: 2 עוגיות
                      </Button>
                      <p className="text-xs text-red-500 font-semibold text-center">
                        בחרו עוד {2 - getTotalCookieCount()} עוגיות להשלמת המינימום
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      

      {/* Edit Choice Modal */}
      {isEditChoiceOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[110] transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-[#E8D4C8] relative" dir="rtl">
            <button
              onClick={() => setIsEditChoiceOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-[#3D2817] text-center mb-6" style={{ fontFamily: 'Alef' }}>
              בחירת מארז לעריכה
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6 pr-1 pl-1">
              {cart
                .filter(item => item.type === 'box')
                .map((item, idx) => {
                  const size = parseInt(item.id.replace('box-', '')) || 4;
                  return (
                    <button
                      key={item.instanceId}
                      onClick={() => {
                        handleOpenBoxModal(size, item.instanceId);
                        setIsEditChoiceOpen(false);
                      }}
                      className="w-full text-right bg-[#FFFBF7] hover:bg-[#FFF8F3] border-2 border-[#E8D4C8] hover:border-[#E8B4A8] p-4 rounded-2xl transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div className="text-right">
                        <span className="font-bold text-[#3D2817] block">
                          מארז #{idx + 1} ({size} עוגיות)
                        </span>
                        <span className="text-xs text-[#6B4423] mt-1 block line-clamp-1 leading-relaxed">
                          {item.flavors ? item.flavors.map(f => `${f.cookie.name} (${f.quantity})`).join(', ') : ''}
                        </span>
                      </div>
                      <span className="text-[#E8B4A8] group-hover:translate-x-[-4px] transition-transform font-bold text-lg">📝</span>
                    </button>
                  );
                })}
            </div>
            
            <button
              onClick={() => setIsEditChoiceOpen(false)}
              className="w-full border-2 border-[#E8B4A8] text-[#E8B4A8] hover:bg-[#F5E6D3] font-bold py-3 rounded-2xl text-base transition-all cursor-pointer text-center"
            >
              סגירה
            </button>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[110] transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-[#E8D4C8] relative" dir="rtl">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-[#3D2817] text-center mb-6" style={{ fontFamily: 'Alef' }}>
              כתיבת ביקורת
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-1.5">שם מלא</label>
                <input
                  type="text"
                  placeholder="השם שלך..."
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] focus:outline-none p-3 text-right bg-[#FFF8F3]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-1.5 font-bold">דירוג עוגיות</label>
                <div className="flex gap-2 justify-center py-2 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewReviewRating(i + 1)}
                      className="transition-transform active:scale-125 cursor-pointer"
                    >
                      <Star className={`w-8 h-8 ${i < newReviewRating ? 'fill-current text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-1.5">תוכן הביקורת</label>
                <textarea
                  placeholder="איך היו העוגיות? מה הכי אהבתם?..."
                  rows={4}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] focus:outline-none p-3 text-right bg-[#FFF8F3] resize-none"
                />
              </div>

              <Button
                disabled={!newReviewName.trim() || !newReviewText.trim()}
                onClick={handleAddReview}
                className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-white font-bold py-3.5 rounded-2xl text-base transition-all duration-300 cursor-pointer"
              >
                פרסם ביקורת 🚀
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100] transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-[#E8D4C8] relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Order Summary (At the very top) */}
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
                    פרטי לקוח ואיסוף
                  </h3>
                  <p className="text-sm text-[#6B4423]">
                    מלאו את הפרטים והסכימו לתנאים כדי להשלים את ההזמנה
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
                      מספר טלפון <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="הכנס מספר טלפון..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-2xl border border-[#E8D4C8] focus:border-[#E8B4A8] p-3 text-right text-base text-[#3D2817] transition-all bg-[#FFF8F3]"
                      dir="rtl"
                    />
                  </div>

                  {/* Pick-up Day Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-1">
                      יום איסוף <span className="text-red-500 font-bold">*</span>
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
                      טווח שעות איסוף (שעתיים בין 09:00-20:00) <span className="text-red-500 font-bold">*</span>
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
                        <span className="text-red-500 font-bold">*</span> אני מאשר/ת שההזמנה היא לאיסוף עצמי בלבד (עד 7 ימי עסקים).
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dynamic Payment Button */}
                {(() => {
                  const cleanPhone = phoneNumber.replace(/[-\s]/g, '');
                  const isFormValid = 
                    fullName.trim() !== '' && 
                    cleanPhone.length >= 9 && 
                    pickupDay !== '' && 
                    pickupTimeSlot !== '' && 
                    allergyConfirmed && 
                    cancellationConfirmed && 
                    isSelfPickupConfirmed;

                  return (
                    <div className="pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        className="border-[#E8B4A8] text-[#E8B4A8] hover:bg-[#F5E6D3] rounded-2xl py-3.5 px-4 text-base transition-colors duration-200 cursor-pointer"
                        onClick={() => setIsCheckoutOpen(false)}
                      >
                        ביטול
                      </Button>
                      <Button
                        disabled={!isFormValid}
                        onClick={handlePaymentClick}
                        className={`flex-1 font-bold py-3.5 rounded-2xl text-base transition-all duration-300 cursor-pointer ${
                          isFormValid
                            ? 'bg-[#E8B4A8] hover:bg-[#D89B8E] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed border-none shadow-none'
                        }`}
                      >
                        לתשלום ב-Bit
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 2: Desktop only Payment Info */}
            {checkoutStep === 2 && (
              <div className="text-right space-y-6" dir="rtl">
                <div className="text-center mb-2">
                  <h3 className="text-2xl font-bold text-[#3D2817] mb-1" style={{ fontFamily: 'Alef' }}>
                    תשלום מהמחשב
                  </h3>
                </div>

                <p className="text-base text-[#3D2817] leading-relaxed bg-[#FFF8F3] border border-[#E8D4C8] p-4 rounded-2xl text-center font-semibold">
                  גולשים מהמחשב? סרקו את הברקוד או העבירו למספר 0512909911
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-[#FFF8F3] border-2 border-[#E8D4C8] rounded-2xl text-center space-y-2">
                  <div className="bg-white p-2 rounded-xl shadow-xs border border-[#E8D4C8] max-w-[160px] mx-auto">
                    <img
                      src="qr_code.jpg"
                      alt="קוד QR לתשלום בביט"
                      className="w-full h-auto rounded-lg object-contain"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="border-[#E8B4A8] text-[#E8B4A8] hover:bg-[#F5E6D3] rounded-2xl py-3.5 px-4 text-base transition-colors duration-200 cursor-pointer"
                    onClick={() => setCheckoutStep(1)}
                  >
                    חזור
                  </Button>
                  <Button
                    onClick={handleFinalizeDesktopPayment}
                    className="flex-1 bg-[#E8B4A8] hover:bg-[#D89B8E] text-white font-bold py-3.5 rounded-2xl text-base transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    סרקתי והעברתי
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {checkoutStep === 'success' && (
              <div className="text-center space-y-6 py-4" dir="rtl">
                {/* Bouncing Cookie Icon */}
                <div className="flex justify-center">
                  <div className="text-6xl md:text-7xl animate-bounce" style={{ animationDuration: '2s' }}>
                    🍪
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#E8B4A8]" style={{ fontFamily: 'Alef' }}>
                    העוגיות כבר בתנור! ✨
                  </h3>
                  <p className="text-base text-[#3D2817] font-semibold leading-relaxed">
                    קיבלנו את פרטי ההזמנה שלך ואנחנו כבר מתחילים לעבוד עליה באהבה!
                  </p>
                </div>

                <div className="bg-[#FFF8F3] border-2 border-dashed border-[#E8D4C8] rounded-2xl p-5 space-y-3 text-right">
                  <p className="text-sm text-[#6B4423] flex items-center gap-2">
                    <span>🕒</span>
                    <span><strong>פרטי איסוף:</strong> ההזמנה שלך נקבעה ליום <strong>{pickupDay}</strong> בטווח השעות <strong>{pickupTimeSlot}</strong> לאיסוף עצמי.</span>
                  </p>
                </div>

                <Button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-white font-bold py-3.5 rounded-2xl text-base transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  הבנתי, תודה!
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
