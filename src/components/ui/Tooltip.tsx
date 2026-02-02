import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
}

export const Tooltip = ({ children, content, disabled = false }: TooltipProps) => {
  if (!content || disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};
