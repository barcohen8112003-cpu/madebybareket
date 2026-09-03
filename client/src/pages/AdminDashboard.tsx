import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Cookie, Plus, Shield, TrendingUp, Users, ShoppingBag, 
  Eye, EyeOff, Edit2, LogOut, Check, X, RefreshCw, Layers, Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
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

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'single' | 'box';
  flavors?: { name: string; quantity: number }[];
}

interface Order {
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

interface DayAnalytics {
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

const COLORS = ['#D78B78', '#F5E6D3', '#C2B2A2', '#8B7365', '#5C4033', '#A8C3B4'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders'>('analytics');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, DayAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'weekly' | 'monthly'>('monthly');
  
  // Drag & drop file upload states
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("נא לבחור קובץ תמונה בלבד");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);
  
  // Add product states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('sweet');
  const [newImage, setNewImage] = useState('cookies/cornflakes.jpg');

  const [, setLocation] = useLocation();

  const getHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products
      const prodRes = await fetch('/api/admin/products', { headers: getHeaders() });
      if (!prodRes.ok) throw new Error("אינך מחובר או פג תוקף החיבור");
      const prodData = await prodRes.json();
      setProducts(prodData);

      // 2. Fetch analytics and orders
      const analyticRes = await fetch('/api/admin/analytics', { headers: getHeaders() });
      if (!analyticRes.ok) throw new Error("שגיאה בטעינת נתונים");
      const analyticData = await analyticRes.json();
      setAnalytics(analyticData.dailyAnalytics || {});
      setOrders(analyticData.orders || []);
    } catch (err: any) {
      toast.error(err.message || "שגיאה בטעינת נתוני לוח הבקרה");
      localStorage.removeItem('admin_token');
      setLocation('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success("התנתקת בהצלחה!");
    setLocation('/admin/login');
  };

  // Product visibility toggle
  const toggleVisibility = async (id: string, currentHidden: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ hidden: !currentHidden })
      });
      if (!res.ok) throw new Error();
      toast.success(currentHidden ? "המוצר מוצג כעת באתר" : "המוצר הוסתר מהאתר");
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? { ...p, hidden: !currentHidden } : p));
    } catch {
      toast.error("שגיאה בעדכון זמינות המוצר");
    }
  };

  // Inline price edit
  const savePrice = async (id: string) => {
    if (isNaN(editPriceVal) || editPriceVal <= 0) {
      toast.error("מחיר לא תקין");
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ price: editPriceVal })
      });
      if (!res.ok) throw new Error();
      toast.success("המחיר עודכן בהצלחה!");
      setProducts(prev => prev.map(p => p.id === id ? { ...p, price: editPriceVal } : p));
      setEditingProductId(null);
    } catch {
      toast.error("שגיאה בעדכון המחיר");
    }
  };

  // Add Product submission
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      toast.error("נא למלא שם ומחיר");
      return;
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          desc: newDesc,
          category: newCategory,
          image: newImage
        })
      });
      if (!res.ok) throw new Error();
      const addedProduct = await res.json();
      
      toast.success("מוצר חדש נוסף בהצלחה!");
      setProducts(prev => [...prev, addedProduct]);
      setIsAddModalOpen(false);
      // Reset form
      setNewName('');
      setNewPrice('');
      setNewDesc('');
      setNewCategory('sweet');
      setNewImage('cookies/cornflakes.jpg');
    } catch {
      toast.error("שגיאה בהוספת מוצר");
    }
  };

  // Get aggregated stats
  const getAggregatedStats = () => {
    let totalVisitors = 0;
    let totalPageviews = 0;
    let funnel = { visitor: 0, add_to_cart: 0, initiate_checkout: 0, purchase: 0 };
    const referrerMap: Record<string, number> = {};

    const now = new Date();

    Object.entries(analytics).forEach(([dateStr, day]) => {
      // Check date range
      const dayDate = new Date(dateStr);
      const diffTime = Math.abs(now.getTime() - dayDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let inRange = false;
      if (timeRange === 'today') {
        const localToday = new Date();
        const year = localToday.getFullYear();
        const month = String(localToday.getMonth() + 1).padStart(2, '0');
        const dayNum = String(localToday.getDate()).padStart(2, '0');
        const formattedToday = `${year}-${month}-${dayNum}`;
        inRange = (dateStr === formattedToday);
      } else if (timeRange === 'weekly') {
        inRange = diffDays <= 7;
      } else if (timeRange === 'monthly') {
        inRange = diffDays <= 30;
      }

      if (!inRange) return;

      totalVisitors += day.visitors || 0;
      totalPageviews += day.pageviews || 0;
      
      if (day.funnel) {
        funnel.visitor += day.funnel.visitor || 0;
        funnel.add_to_cart += day.funnel.add_to_cart || 0;
        funnel.initiate_checkout += day.funnel.initiate_checkout || 0;
        funnel.purchase += day.funnel.purchase || 0;
      }

      if (day.referrers) {
        Object.entries(day.referrers).forEach(([ref, count]) => {
          referrerMap[ref] = (referrerMap[ref] || 0) + count;
        });
      }
    });

    const conversionRate = funnel.visitor > 0 ? ((funnel.purchase / funnel.visitor) * 100).toFixed(1) : '0';

    const funnelData = [
      { name: 'מבקרים', value: funnel.visitor },
      { name: 'הוספה לסל', value: funnel.add_to_cart },
      { name: 'התחלת צ\'קאאוט', value: funnel.initiate_checkout },
      { name: 'רכישות', value: funnel.purchase },
    ];

    const referrerData = Object.entries(referrerMap).map(([name, value]) => ({
      name,
      value
    }));

    return {
      totalVisitors,
      totalPageviews,
      conversionRate,
      funnelData,
      referrerData
    };
  };

  const stats = getAggregatedStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-[#D78B78]" size={48} />
        <p className="text-[#8B7365] font-semibold">טוען את נתוני לוח הבקרה...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5F0] pb-12 font-sans select-none" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E8D4C8] shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8B4A8]/10 text-[#D78B78] flex items-center justify-center border border-[#E8B4A8]/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#5C4033]">לוח בקרת מנהל</h1>
              <p className="text-xs text-[#8B7365]">ניהול מכירות ומוצרים - Made by Bareket</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 border-[#E8D4C8] text-[#8B7365] hover:bg-[#FAF5F0] rounded-xl cursor-pointer"
            >
              <span>חזרה לאתר 🏠</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchAllData}
              className="flex items-center gap-2 border-[#E8D4C8] text-[#8B7365] hover:bg-[#FAF5F0] rounded-xl cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>רענן</span>
            </Button>
            <Button 
              onClick={handleLogout}
              className="bg-[#D78B78] hover:bg-[#C27A68] text-white flex items-center gap-2 rounded-xl shadow-md cursor-pointer"
            >
              <LogOut size={16} />
              <span>התנתק</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white border border-[#E8D4C8] p-1.5 rounded-2xl mb-8 w-fit shadow-xs">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-[#E8B4A8]/20 text-[#D78B78]' 
                : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={18} />
            <span>אנליטיקה וסטטיסטיקות</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'products' 
                ? 'bg-[#E8B4A8]/20 text-[#D78B78]' 
                : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
            }`}
          >
            <Cookie size={18} />
            <span>ניהול מוצרים</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-[#E8B4A8]/20 text-[#D78B78]' 
                : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
            }`}
          >
            <ShoppingBag size={18} />
            <span>הזמנות אחרונות</span>
          </button>
        </div>

        {/* Tab 1: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Time range selector */}
            <div className="flex bg-white border border-[#E8D4C8] p-1.5 rounded-2xl w-fit shadow-xs gap-1">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'today' ? 'bg-[#D78B78] text-white shadow-xs' : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
                }`}
              >
                היום 📅
              </button>
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'weekly' ? 'bg-[#D78B78] text-white shadow-xs' : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
                }`}
              >
                שבוע אחרון 📊
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'monthly' ? 'bg-[#D78B78] text-white shadow-xs' : 'text-[#8B7365] hover:text-[#5C4033] hover:bg-slate-50'
                }`}
              >
                30 יום אחרונים 🗓️
              </button>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#E8D4C8] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#8B7365]">מבקרים יחודיים (היום/כולל)</p>
                  <h3 className="text-3xl font-extrabold text-[#5C4033] mt-2">
                    {stats.totalVisitors} <span className="text-lg font-normal text-[#8B7365]">משתמשים</span>
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#E8B4A8]/10 text-[#D78B78] flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>

              <div className="bg-white border border-[#E8D4C8] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#8B7365]">סה"כ הזמנות שהושלמו</p>
                  <h3 className="text-3xl font-extrabold text-[#5C4033] mt-2">
                    {orders.length} <span className="text-lg font-normal text-[#8B7365]">הזמנות</span>
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#D78B78]/10 text-[#D78B78] flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
              </div>

              <div className="bg-white border border-[#E8D4C8] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#8B7365]">יחס המרה כולל</p>
                  <h3 className="text-3xl font-extrabold text-[#5C4033] mt-2">
                    {stats.conversionRate}%
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            {/* Funnel and Referrers Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Funnel Chart */}
              <div className="bg-white border border-[#E8D4C8] p-6 rounded-3xl shadow-sm flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#5C4033]">משפך המרות (Conversion Funnel)</h3>
                  <p className="text-xs text-[#8B7365]">פעולות המשתמשים באתר לאורך זמן</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.funnelData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E5D8" />
                      <XAxis dataKey="name" stroke="#8B7365" />
                      <YAxis stroke="#8B7365" />
                      <Tooltip formatter={(value) => [`${value} פעולות`, 'כמות']} contentStyle={{ direction: 'rtl', borderRadius: '12px', border: '1px solid #E8D4C8' }} />
                      <Bar dataKey="value" fill="#D78B78" radius={[8, 8, 0, 0]}>
                        {stats.funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Referrers Pie Chart */}
              <div className="bg-white border border-[#E8D4C8] p-6 rounded-3xl shadow-sm flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#5C4033]">מקורות תנועה (Referrers)</h3>
                  <p className="text-xs text-[#8B7365]">מאיפה נכנסים המבקרים לאתר</p>
                </div>
                {stats.referrerData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[#8B7365] text-sm">
                    אין נתוני כניסות מוקלטים עדיין.
                  </div>
                ) : (
                  <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="h-full w-full md:w-[60%]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.referrerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.referrerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} כניסות`, 'כמות']} contentStyle={{ direction: 'rtl', borderRadius: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend Custom */}
                    <div className="flex flex-col gap-2 w-full md:w-[40%] text-sm">
                      {stats.referrerData.map((ref, idx) => (
                        <div key={ref.name} className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          <span className="text-[#5C4033] font-medium text-xs truncate max-w-[120px]">{ref.name}</span>
                          <span className="text-[#8B7365] text-xs">({ref.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#5C4033]">מוצרי האתר</h3>
                <p className="text-xs text-[#8B7365]">ניהול עוגיות, מחירים וזמינות בחנות</p>
              </div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#D78B78] hover:bg-[#C27A68] text-white flex items-center gap-2 rounded-xl shadow-md cursor-pointer"
              >
                <Plus size={18} />
                <span>הוסף מוצר חדש</span>
              </Button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-[#E8D4C8] shadow-sm rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5F0] border-b border-[#E8D4C8] text-[#8B7365] font-semibold text-sm">
                      <th className="py-4 px-6">תמונה</th>
                      <th className="py-4 px-6">שם המוצר</th>
                      <th className="py-4 px-6">קטגוריה</th>
                      <th className="py-4 px-6 text-center">מחיר (₪)</th>
                      <th className="py-4 px-6 text-center">זמינות באתר</th>
                      <th className="py-4 px-6 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D4C8]">
                    {products.map(product => (
                      <tr key={product.id} className="text-[#5C4033] hover:bg-slate-50 transition-colors text-sm">
                        <td className="py-4 px-6">
                          <img 
                            src={product.image || 'logo.png'} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded-xl border border-[#E8D4C8]" 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'logo.png'; }}
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#5C4033]">{product.name}</div>
                          <div className="text-xs text-[#8B7365] max-w-[250px] truncate">{product.desc}</div>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#8B7365]">
                          {product.category === 'sweet' ? 'מתוק' : product.category === 'salty_sweet' ? 'מתוק-מלוח' : 'קלאסי'}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold">
                          {editingProductId === product.id ? (
                            <div className="flex items-center gap-1.5 justify-center">
                              <input 
                                type="number" 
                                value={editPriceVal}
                                onChange={(e) => setEditPriceVal(Number(e.target.value))}
                                className="w-16 px-1.5 py-1 text-center bg-white border border-[#E8D4C8] rounded-lg text-sm text-[#5C4033] focus:ring-1 focus:ring-[#D78B78] focus:outline-hidden"
                              />
                              <button 
                                onClick={() => savePrice(product.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => setEditingProductId(null)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-center">
                              <span>₪{product.price}</span>
                              <button 
                                onClick={() => {
                                  setEditingProductId(product.id);
                                  setEditPriceVal(product.price);
                                }}
                                className="p-1.5 text-[#8B7365] hover:text-[#D78B78] hover:bg-[#FAF5F0] rounded-lg transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            product.hidden 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {product.hidden ? (
                              <>
                                <EyeOff size={12} />
                                מוסטר מהאתר
                              </>
                            ) : (
                              <>
                                <Eye size={12} />
                                פעיל באתר
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleVisibility(product.id, product.hidden)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                              product.hidden 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {product.hidden ? "הצג באתר" : "הסתר מהאתר"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-[#5C4033]">הזמנות שהתקבלו</h3>
              <p className="text-xs text-[#8B7365]">רשימת הזמנות אחרונות הממתינות לאימות/טיפול</p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-[#E8D4C8] shadow-sm rounded-3xl p-12 text-center text-[#8B7365]">
                <ShoppingBag size={48} className="mx-auto text-[#C2B2A2] mb-3" />
                <p>לא נמצאו הזמנות רשומות במערכת.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E8D4C8] shadow-sm rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#FAF5F0] border-b border-[#E8D4C8] text-[#8B7365] font-semibold text-sm">
                        <th className="py-4 px-6">לקוח</th>
                        <th className="py-4 px-6">פרטי קשר</th>
                        <th className="py-4 px-6">מועד איסוף</th>
                        <th className="py-4 px-6">שלט מזל טוב?</th>
                        <th className="py-4 px-6">הזמנה</th>
                        <th className="py-4 px-6 text-center">סה"כ לתשלום</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D4C8]">
                      {orders.map(order => (
                        <tr key={order.id} className="text-[#5C4033] hover:bg-slate-50 transition-colors text-sm">
                          <td className="py-4 px-6 font-bold">{order.customerName}</td>
                          <td className="py-4 px-6">
                            <div>{order.phone}</div>
                            <div className="text-xs text-[#8B7365]">
                              {new Date(order.createdAt).toLocaleString('he-IL')}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs">
                            <div className="font-semibold text-[#5C4033]">{order.pickupDay}</div>
                            <div className="text-[#8B7365]">{order.pickupTimeSlot}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                              order.birthdaySign ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {order.birthdaySign ? "כן (+5 ₪)" : "לא"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs max-w-[280px]">
                            <div className="flex flex-col gap-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="bg-[#FAF5F0] p-1.5 rounded-lg border border-[#E8D4C8]/30">
                                  <span className="font-bold text-[#D78B78]">{item.quantity}x</span> {item.name}
                                  {item.flavors && item.flavors.length > 0 && (
                                    <div className="text-[10px] text-[#8B7365] mr-3 mt-0.5">
                                      ({item.flavors.map(f => `${f.name} (${f.quantity})`).join(', ')})
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-[#D78B78] text-base">
                            ₪{order.totalPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E8D4C8] shadow-2xl p-6 md:p-8 w-full max-w-lg relative animate-in zoom-in-95 duration-200" dir="rtl">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-[#8B7365] hover:text-[#5C4033] hover:bg-[#FAF5F0] rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#5C4033] mb-6 flex items-center gap-2">
              <Plus size={22} className="text-[#D78B78]" />
              <span>הוספת מוצר חדש לחנות</span>
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-1">שם המוצר</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="לדוגמה: עוגיית קוקוס לבנה"
                  className="w-full px-4 py-2.5 bg-white border border-[#E8D4C8] rounded-xl text-sm focus:ring-2 focus:ring-[#D78B78] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#5C4033] mb-1">מחיר (₪)</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="15"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8D4C8] rounded-xl text-sm focus:ring-2 focus:ring-[#D78B78] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#5C4033] mb-1">קטגוריה</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8D4C8] rounded-xl text-sm focus:ring-2 focus:ring-[#D78B78] focus:outline-hidden"
                  >
                    <option value="sweet">מתוק</option>
                    <option value="salty_sweet">מתוק-מלוח</option>
                    <option value="classic">קלאסי</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-1">תיאור המוצר</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="רשום תיאור קצר ומזמין של העוגייה..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8D4C8] rounded-xl text-sm focus:ring-2 focus:ring-[#D78B78] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-2">תמונת המוצר</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('product-image-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group ${
                    isDragging 
                      ? 'border-[#D78B78] bg-[#E8B4A8]/10' 
                      : newImage && newImage.startsWith('data:') 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-[#E8D4C8] hover:border-[#D78B78] hover:bg-[#FFF8F3]'
                  }`}
                >
                  <input
                    type="file"
                    id="product-image-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {newImage && (newImage.startsWith('data:') || newImage.startsWith('cookies/') || newImage.startsWith('http')) ? (
                    <div className="relative w-full flex flex-col items-center gap-2">
                      <img
                        src={newImage}
                        alt="Product Preview"
                        className="w-20 h-20 object-cover rounded-xl border border-[#E8D4C8] shadow-xs"
                      />
                      <span className="text-xs text-emerald-600 font-bold">✓ התמונה נטענה בהצלחה</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewImage('');
                        }}
                        className="text-xs text-rose-500 hover:underline font-semibold mt-1"
                      >
                        הסר תמונה
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#E8B4A8]/10 text-[#D78B78] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-[#5C4033] mb-1">גרור לכאן תמונה, או לחץ לבחירה מהגלריה</p>
                      <p className="text-[10px] text-[#8B7365]">תומך בקבצי JPG, PNG, WEBP</p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#D78B78] hover:bg-[#C27A68] text-white py-5 rounded-xl cursor-pointer"
                >
                  הוסף מוצר
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 border-[#E8D4C8] text-[#8B7365] py-5 rounded-xl cursor-pointer"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
