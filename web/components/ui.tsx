import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      {children}
    </main>
  );
}

type Tone = "white" | "sun" | "mint";
const tones: Record<Tone, string> = {
  white: "bg-white",
  sun: "bg-sun",
  mint: "bg-mint",
};

export function Card({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 border-ink p-4 shadow-pop ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

type Variant = "primary" | "secondary";
const variants: Record<Variant, string> = {
  primary: "bg-sun",
  secondary: "bg-white",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-xl border-2 border-ink px-5 py-2.5 text-lg font-bold shadow-pop disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${pressable} ${variants[variant]} ${className}`}
    />
  );
}
export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold ${className}`}
    >
      {children}
    </span>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border-2 border-berry bg-white px-4 py-3 font-semibold text-berry"
    >
      {message}
    </p>
  );
}

export const inputClass =
  "w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-lg font-medium placeholder:text-ink/40";

export const pressable =
  "transition-[transform,box-shadow] duration-100 enabled:cursor-pointer enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[6px_6px_0_0_var(--color-ink)] enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none";
