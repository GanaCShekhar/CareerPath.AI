import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle }) => {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-none overflow-hidden transition-colors ${className}`}>
      {(title || subtitle) && (
        <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800">
          {title && <h3 className="font-serif text-2xl text-zinc-900 dark:text-white italic tracking-tight">{title}</h3>}
          {subtitle && <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 mt-2">{subtitle}</p>}
        </div>
      )}
      <div className="p-10">
        {children}
      </div>
    </div>
  );
};
