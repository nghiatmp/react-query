"use client";
import { useRef, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "./primitives/dialog";
interface ModalProps { open: boolean; title: string; onClose: () => void; children: ReactNode }
export function Modal({ open, title, onClose, children }: ModalProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <DialogContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto rounded-2xl bg-card"
      onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement; }}
      onCloseAutoFocus={event => { event.preventDefault(); (returnFocus.current?.isConnected ? returnFocus.current : document.getElementById("main"))?.focus(); }}>
      <DialogTitle>{title}</DialogTitle>
      {children}
    </DialogContent>
  </Dialog>;
}
