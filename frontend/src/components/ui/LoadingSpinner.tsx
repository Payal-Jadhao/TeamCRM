import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeMap[size]} text-primary animate-spin`} />
      {text && <span className="text-xs font-semibold text-text-secondary animate-pulse">{text}</span>}
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading data...',
  className = 'py-20',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-200 shadow-xs">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
      <p className="text-xs font-bold text-text-primary tracking-wide">{message}</p>
      <p className="text-[11px] text-text-secondary">Please wait while we sync with the database</p>
    </div>
  );
};

export const ButtonSpinner: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      {text && <span>{text}</span>}
    </span>
  );
};

export const TableLoader: React.FC<{ colSpan: number; message?: string }> = ({
  colSpan,
  message = 'Loading records...',
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        <LoadingSpinner size="lg" text={message} />
      </td>
    </tr>
  );
};
