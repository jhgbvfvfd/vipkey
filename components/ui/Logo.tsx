import React from 'react';

const LOGO_URL = 'https://img2.pic.in.th/pic/received_1477586920220219.jpeg';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-label="CSCODE"
    className={[
      'relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-lg ring-1 ring-white/10',
      'transition-transform duration-500 ease-out hover:scale-[1.03]',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <span
      aria-hidden
      className="absolute inset-[-45%] animate-[spin_14s_linear_infinite] rounded-full bg-[conic-gradient(from_90deg,rgba(255,255,255,0.35)_0deg,transparent_120deg,rgba(14,165,233,0.4)_300deg)] opacity-70"
    ></span>
    <span
      aria-hidden
      className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.3),transparent_60%)]"
    ></span>
    <img
      src={LOGO_URL}
      alt="CSCODE Logo"
      className="relative h-3/4 w-3/4 object-contain opacity-90 mix-blend-screen drop-shadow-[0_10px_24px_rgba(59,130,246,0.45)]"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/30"></span>
  </div>
);

export default Logo;
