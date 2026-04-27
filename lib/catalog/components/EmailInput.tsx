"use client";

import { useId, useState } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";

export const EmailInputSchema = z.object({
  field: z.string().default("email"),
  placeholder: z.string().default("you@example.com"),
  required: z.boolean().default(true),
});

export const EmailInputDescription =
  "Specialized ShortText with email validation. States: default, focused, valid (subtle olive border), error (red border + mono err caption).";

type EmailInputProps = z.infer<typeof EmailInputSchema>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailInput({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<EmailInputProps>;
  const id = useId();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const isValid = EMAIL_RE.test(value);
  const showError = touched && value.length > 0 && !isValid;
  const showValid = touched && isValid;

  return (
    <div className="flex flex-col gap-1.5">
      <input
        id={id}
        name={props.field ?? "email"}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder={props.placeholder ?? "you@example.com"}
        required={props.required ?? true}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        className={`h-12 w-full rounded-[var(--r-md)] border-[1.5px] bg-[var(--fsurf)] px-4 font-sans text-[15px] text-[var(--ftext)] placeholder:text-[var(--ftext-f)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)] ${
          showError
            ? "border-[var(--error)] focus-visible:ring-[var(--error)]"
            : showValid
              ? "border-[var(--faccent)] focus-visible:ring-[var(--faccent)]"
              : "border-[var(--fborder)] focus:border-[var(--faccent)] focus-visible:ring-[var(--faccent)]"
        }`}
      />
      {showError && (
        <p className="font-mono text-[11px] text-[var(--error)]">
          Please enter a valid email address.
        </p>
      )}
    </div>
  );
}
