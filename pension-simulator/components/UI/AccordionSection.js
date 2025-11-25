'use client'
import React from "react";

export default function AccordionSection({
  title,
  children,
  defaultOpen = false,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[#EEE] bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-[#333] flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[#777]">
              {badge}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-[#999] transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 text-[13px] text-[#555]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
