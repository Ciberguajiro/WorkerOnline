import { createContext } from 'react';
import { ToastItem } from '../components/Toast';

interface ToastContextValue {
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {},
});
