"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  children: React.ReactNode;
}
let currentlyOpenMenuClose: (() => void) | null = null;

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const setOpenSafely = (value: boolean) => {
    if (value) {
   
      currentlyOpenMenuClose?.();
      currentlyOpenMenuClose = () => setOpen(false);
    }
    setOpen(value);
  };

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            onOpenChange: setOpenSafely, 
            triggerRef,
          });
        }
        return child;
      })}
    </>
  );
};


const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    asChild?: boolean;
    triggerRef?: React.RefObject<HTMLButtonElement>;
  }
>(({ children, open, onOpenChange, asChild, triggerRef }, _) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenChange?.(!open);
      },
    });
  }

  return null;
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = ({
  children,
  open,
  onOpenChange,
  align = "end",
  triggerRef,
  className,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "end";
  triggerRef?: React.RefObject<HTMLButtonElement>;
  className?: string;
}) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: align === "end" ? rect.right - 160 : rect.left,
      });
    }
  }, [open, align, triggerRef]);

  React.useEffect(() => {
    const close = () => onOpenChange?.(false);
    if (open) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed z-[9999] min-w-[10rem] rounded-md border bg-white p-1 shadow-md",
        className
      )}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    destructive?: boolean;
  }
>(({ className, destructive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100",
      destructive && "text-red-600 hover:bg-red-50 focus:bg-red-50",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-200", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
