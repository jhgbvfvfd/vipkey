import React from 'react';

const LOGO_URL = 'https://img2.pic.in.th/pic/received_1477586920220219.jpeg';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={LOGO_URL}
    alt="CSCODE Logo"
    className={['object-contain drop-shadow-md', className].filter(Boolean).join(' ')}
    loading="lazy"
    referrerPolicy="no-referrer"
  />
);

export default Logo;
