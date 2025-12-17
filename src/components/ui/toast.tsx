"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "destructive"
  duration?: number
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).slice(2)
      const newToast = { ...toast, id }
      setToasts((prev) => [...prev, newToast])

      const duration = toast.duration ?? 3000
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

function ToastViewport({
  toasts,
  onRemove,
}: {
  toasts: ToastProps[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

function Toast({
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps & { onClose: () => void }) {
  const variantClasses = {
    default: "bg-white border-slate-200",
    success: "bg-green-50 border-green-200",
    destructive: "bg-red-50 border-red-200",
  }

  const textClasses = {
    default: "text-slate-900",
    success: "text-green-900",
    destructive: "text-red-900",
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
        variantClasses[variant]
      )}
    >
      <div className="flex-1">
        {title && (
          <div
            className={cn("text-sm font-semibold", textClasses[variant])}
          >
            {title}
          </div>
        )}
        {description && (
          <div className={cn("text-sm", textClasses[variant])}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          textClasses[variant]
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}
