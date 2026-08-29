"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl"
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs print:hidden animate-backdrop"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative flex flex-col max-h-[92dvh] sm:max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-zinc-200 animate-modal`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4 bg-zinc-50/80">
          <div>
            <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
