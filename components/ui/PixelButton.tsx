import React from 'react';
import Link from 'next/link';

type PixelButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'secondary' | 'outline';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  children: React.ReactNode;
  href?: string;
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ variant = 'primary', className = '', disabled = false, children, href, ...props }, ref) => {
    const variants: Record<PixelButtonVariant, string> = {
      primary: 'bg-indigo-500 hover:bg-indigo-400 text-white border-b-4 border-indigo-700 active:border-b-0 active:mt-1',
      success: 'bg-emerald-500 hover:bg-emerald-400 text-black border-b-4 border-emerald-700 active:border-b-0 active:mt-1',
      danger: 'bg-rose-500 hover:bg-rose-400 text-white border-b-4 border-rose-700 active:border-b-0 active:mt-1',
      warning: 'bg-amber-400 hover:bg-amber-300 text-black border-b-4 border-amber-600 active:border-b-0 active:mt-1',
      neutral: 'bg-slate-300 hover:bg-slate-200 text-black border-b-4 border-slate-500 active:border-b-0 active:mt-1',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-white border-b-4 border-slate-900 active:border-b-0 active:mt-1',
      outline: 'bg-transparent border-2 border-slate-500 hover:bg-slate-800 text-slate-300 active:translate-y-1',
    };

    const baseStyles = `
      font-pixel text-xs px-4 py-3 transition-all duration-75 uppercase tracking-wider flex items-center justify-center
      ${variants[variant]}
      ${disabled ? 'opacity-50 cursor-not-allowed active:border-b-4 active:mt-0' : ''}
      ${className}
    `;

    if (href && !disabled) {
      return (
        <Link href={href} className={baseStyles}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={baseStyles}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PixelButton.displayName = 'PixelButton';

export default PixelButton;
