"use client";

import { useId, useState } from "react";
import { z } from "zod";
import type { CatalogNode } from "../types";

export const EmailGateSchema = z.object({
  field: z.string().default("email"),
  cta: z.string().default("Show my result"),
  privacyNote: z.string().optional(),
});

export const EmailGateDescription =
  "Hard gate before showing result. Bundles an email input + PrimaryCTA + optional privacy note. Use for lead capture.";

type EmailGateProps = z.infer<typeof EmailGateSchema>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate({ node }: { node: CatalogNode }) {
  const props = (node.props ?? {}) as Partial<EmailGateProps>;
  const id = useId();
  const [value, setValue] = useState("");
  const valid = EMAIL_RE.test(value);
  return (
    <div className="flex flex-col gap-3">
      <input
        id={id}
        name={props.field ?? "email"}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-12 w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--fborder)] bg-[var(--fsurf)] px-4 font-sans text-[15px] text-[var(--ftext)] placeholder:text-[var(--ftext-f)] transition-colors focus:border-[var(--faccent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--faccent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fbg)]"
      />
      <button
        type="button"
        disabled={!valid}
        className="flex w-full items-center justify-center bg-[var(--olive-500)] px-6 py-4 font-sans text-[16px] font-medium text-[var(--cream-50)] shadow-2 transition-transform hover:[@media(hover:hover)]:-translate-y-px disabled:opacity-50 disabled:shadow-none"
        style={{ borderRadius: 18 }}
      >
        {props.cta ?? "Show my result"}
      </button>
      {props.privacyNote && (
        <p className="text-center font-sans text-[13.5px] leading-[1.5] text-[var(--ftext-m)]">
          {props.privacyNote}
        </p>
      )}
    </div>
  );
}
