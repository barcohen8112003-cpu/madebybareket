import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Lock, User, Loader2, Cookie } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If token exists, check it
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(async res => {
        if (res.ok) {
          setLocation('/admin/dashboard');
        }
      })
      .catch(console.error);
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("נא למלא שם משתמש וסיסמה");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("תגובת השרת אינה תקינה. נא לוודא שהשרת רץ.");
      }

      if (!response.ok) {
        throw new Error(data.error || "חיבור נכשל - נא לבדוק את הסיסמה");
      }

      localStorage.setItem('admin_token', data.token);
      toast.success("התחברת בהצלחה!");
      setLocation('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#FAF5F0] via-[#FDFBF7] to-[#F3E5D8] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#E8B4A8]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-[#F5E6D3]/40 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-[#E8D4C8] shadow-2xl rounded-3xl p-8 md:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E8B4A8]/10 text-[#E8B4A8] mb-4 border border-[#E8B4A8]/30">
            <Cookie size={36} className="animate-spin-slow text-[#D78B78]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#5C4033] tracking-tight">כניסה למערכת הניהול</h1>
          <p className="text-[#8B7365] mt-2 text-sm">Made by Bareket Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          <div>
            <label className="block text-sm font-semibold text-[#5C4033] mb-2 mr-1">שם משתמש</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B7365]">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="הכנס שם משתמש"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                className="w-full pl-4 pr-10 py-3 bg-white border border-[#E8D4C8] rounded-2xl text-[#5C4033] placeholder-[#C2B2A2] focus:outline-hidden focus:ring-2 focus:ring-[#E8B4A8] transition-all text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5C4033] mb-2 mr-1">סיסמה</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B7365]">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="w-full pl-4 pr-10 py-3 bg-white border border-[#E8D4C8] rounded-2xl text-[#5C4033] placeholder-[#C2B2A2] focus:outline-hidden focus:ring-2 focus:ring-[#E8B4A8] transition-all text-right"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-[#D78B78] hover:bg-[#C27A68] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                מתחבר...
              </>
            ) : (
              "התחבר למערכת"
            )}
          </Button>
        </form>
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm font-semibold text-[#8B7365] hover:text-[#D78B78] transition-colors"
          >
            ← חזרה לאתר
          </a>
        </div>
      </div>
    </div>
  );
}
