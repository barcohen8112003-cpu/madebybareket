import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background dir-rtl text-right">
          <div className="flex flex-col items-center text-center w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-lg">
            <AlertTriangle
              size={56}
              className="text-amber-500 mb-4 flex-shrink-0 animate-bounce"
            />

            <h2 className="text-2xl font-bold text-foreground mb-3 font-serif">
              משהו השתבש... 🍪
            </h2>

            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              אירעה שגיאה בלתי צפויה בטעינת העמוד. אל דאגה, תוכלו לרענן את העמוד ולנסות שוב!
            </p>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all",
                "bg-primary text-primary-foreground hover:opacity-90 shadow-md cursor-pointer"
              )}
            >
              <RotateCcw size={18} />
              רענון העמוד
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
