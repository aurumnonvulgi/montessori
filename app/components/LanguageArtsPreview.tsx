"use client";

import Image from "next/image";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/moveable_alphabet_board1.svg";

export default function LanguageArtsPreview({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none overflow-hidden rounded-[24px] border border-stone-200 bg-[radial-gradient(circle_at_top,_#f6efe7,_#f3ebdf)] p-3 shadow-inner ${className ?? ""}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[18px] border border-stone-200 bg-white/92">
        <Image
          src={BOARD_IMAGE}
          alt="Moveable alphabet board preview"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, 420px"
          priority={false}
        />
      </div>
    </div>
  );
}
