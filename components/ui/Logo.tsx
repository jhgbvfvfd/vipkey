import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M14.25 4.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
    <path d="M10.5 9.75a.75.75 0 00-1.5 0V21a1.5 1.5 0 001.5 1.5h.75a.75.75 0 000-1.5h-.75V9.75z" />
    <path d="M14.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
    <path d="M14.25 15a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
  </svg>
);

export default Logo;
