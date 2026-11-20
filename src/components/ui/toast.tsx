"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Toast = { message: string; error: boolean } | null;
const ToastContext = createContext<(message: string, error?: boolean) => void>(() => {});

/** `const toast = useToast(); toast('Saved'); toast('Failed', true)` */
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string, error = false) => {
    setToast({ message, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 max-w-sm sm:right-6 sm:bottom-6">
        {toast && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border bg-panel px-4 py-3 text-sm font-medium text-ink shadow-[0_12px_35px_rgba(23,38,59,0.16)] ${
              toast.error ? "border-danger/30" : "border-teal/30"
            }`}
          >
            {toast.error ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> : <CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
