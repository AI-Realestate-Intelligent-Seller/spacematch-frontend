"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

/** Dialog with a backdrop. Closes on Escape, backdrop click and the Close button. */
export function Modal({ open, title, onClose, children, wide }: ModalProps) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[calc(100vh-2rem)] w-full overflow-auto rounded-2xl border border-line bg-panel shadow-[0_24px_70px_rgba(23,38,59,0.18)] ${wide ? "max-w-4xl" : "max-w-lg"}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h3 id={titleId} className="text-base font-bold">
            {title}
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose} data-close aria-label="Close" className="text-muted! hover:text-ink!">
            <X />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

type ConfirmProps = {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => unknown;
  onClose: () => void;
};

export function ConfirmModal({ open, title, children, confirmLabel, danger = true, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => {
            void onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
