import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <input
        id={id}
        className="block w-full px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                   disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
        {...props}
      />
    </div>
  );
};

export default Input;