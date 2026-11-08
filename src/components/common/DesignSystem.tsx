import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Search } from 'lucide-react';

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-800 dark:border-slate-200"
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0 mt-0.5" />}
              <div className="text-xs font-medium leading-relaxed flex-1">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// ==========================================
// BUTTON COMPONENT
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-transparent',
    secondary:
      'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs border border-transparent',
    outline:
      'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-4 py-2.5 gap-2.5 h-11',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};

// ==========================================
// BADGE & STATUS INDICATOR
// ==========================================
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'expired' | 'pending' | 'paid' | 'partial' | 'unpaid' | string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const normalized = status.toLowerCase();

  const config: Record<string, { label: string; text: string; bg: string; dot: string }> = {
    active: {
      label: 'Active',
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      dot: 'bg-emerald-500',
    },
    paid: {
      label: 'Paid in Full',
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      dot: 'bg-emerald-500',
    },
    pending: {
      label: 'Pending',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      dot: 'bg-amber-500',
    },
    partial: {
      label: 'Partial',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      dot: 'bg-amber-500',
    },
    expired: {
      label: 'Expired',
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
      dot: 'bg-rose-500',
    },
    unpaid: {
      label: 'Overdue / Unpaid',
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
      dot: 'bg-rose-500',
    },
    inactive: {
      label: 'Inactive',
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      dot: 'bg-slate-400',
    },
  };

  const item = config[normalized] || {
    label: status,
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${item.bg} ${item.text} ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
      <span>{item.label}</span>
    </span>
  );
};

// ==========================================
// CARD COMPONENT
// ==========================================
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// ==========================================
// METRIC KPI CARD
// ==========================================
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}> = ({ title, value, subtitle, change, isPositive, icon }) => {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{title}</span>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2 tabular-nums">
        {value}
      </div>
      {(subtitle || change) && (
        <div className="flex items-center gap-2 text-xs mt-1.5">
          {change && (
            <span
              className={`font-semibold tabular-nums ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};

// ==========================================
// MODAL DIALOG
// ==========================================
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, description, children, maxWidth = 'md' }) => {
  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`w-full ${widthClasses[maxWidth]} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100`}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

// ==========================================
// SEARCH INPUT & FILTERS
// ==========================================
export const SearchInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ==========================================
// EMPTY STATE
// ==========================================
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="py-12 px-4 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SKELETON LOADER
// ==========================================
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded hidden sm:block" />
          <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
};
