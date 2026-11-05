'use client';

export const Logo = () => {
  return (
    <div className="flex items-center gap-[8px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 64 64"
        fill="none"
        className="min-w-[32px]"
        role="img"
        aria-label="Castrapid"
      >
        <rect width="64" height="64" rx="16" fill="#FFC92E"/><path d="M42.6 22.4a15 15 0 1 0 0 19.2" stroke="#1F3329" strokeWidth="8.5" strokeLinecap="round" fill="none"/><circle cx="47" cy="32" r="5.5" fill="#0F6B52"/>
      </svg>
      <span
        aria-hidden="true"
        className="font-display text-[24px] font-[800] tracking-[-0.025em] text-ink mobile:hidden"
      >
        Castrapid
      </span>
    </div>
  );
};
