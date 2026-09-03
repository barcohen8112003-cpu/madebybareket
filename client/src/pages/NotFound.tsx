import { Button } from "@/components/ui/button";
import { Home as HomeIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#FFFBF7] via-[#FFF8F3] to-[#F5E6D3] p-4 text-right" dir="rtl">
      <div className="w-full max-w-md bg-white border-2 border-[#E8D4C8] rounded-3xl p-8 text-center shadow-xl space-y-6">
        <div className="text-7xl animate-bounce" style={{ animationDuration: '2.5s' }}>
          🍪
        </div>

        <div>
          <h1 className="text-5xl font-extrabold text-[#3D2817] mb-2" style={{ fontFamily: 'Alef' }}>
            404
          </h1>
          <h2 className="text-2xl font-bold text-[#E8B4A8] mb-3">
            אופס! העמוד לא נמצא
          </h2>
          <p className="text-sm text-[#6B4423] leading-relaxed">
            נראה שהגעתם לעמוד שלא קיים, או שהעוגייה שחיפשתם כבר נאפתה ונעלמה!
          </p>
        </div>

        <Button
          onClick={handleGoHome}
          className="w-full bg-[#E8B4A8] hover:bg-[#D89B8E] text-[#3D2817] font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-base"
        >
          <HomeIcon className="w-5 h-5 ml-2" />
          חזרה לחנות העוגיות
        </Button>
      </div>
    </div>
  );
}
