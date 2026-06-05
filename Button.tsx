import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-sm font-medium transition-all focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest text-[11px]";
  
  const variants = {
    primary: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-zinc-100 focus:ring-zinc-900 dark:focus:ring-white",
    secondary: "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:ring-zinc-200 dark:focus:ring-zinc-600",
    outline: "border border-zinc-200 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-zinc-300 dark:focus:ring-zinc-600",
    ghost: "bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 focus:ring-zinc-300 dark:focus:ring-zinc-600",
  };

  const sizes = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-10 py-5 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
