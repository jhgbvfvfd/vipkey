import React from 'react';

const LOGO_URL = 'https://img2.pic.in.th/pic/received_1477586920220219.jpeg';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-label="CSCODE"
    className={[
      'relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-2xl',
      'bg-blue-500 text-white shadow-md ring-1 ring-blue-400/40',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <img
      src={LOGO_URL}
      alt="CSCODE Logo"
      className="relative h-full w-full object-contain p-2"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  </div>
);

export default Logo;
