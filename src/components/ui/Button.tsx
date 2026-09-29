import type { ButtonHTMLAttributes } from "react";
import { Button as PrimitiveButton } from "./primitives/button";
type Variant = "primary" | "secondary" | "danger" | "ghost";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: "sm" | "md" }
const variants = { primary: "default", secondary: "outline", danger: "destructive", ghost: "ghost" } as const;
export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  return <PrimitiveButton type="button" variant={variants[variant]} size={size === "sm" ? "sm" : "default"} {...props} />;
}
