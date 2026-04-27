"use client";

import { z } from "zod";

export const SpacerSchema = z.object({});

export const SpacerDescription =
  "Flex-1 vertical filler. Used inside Screen body to push the footer down on short content.";

export function Spacer() {
  return <div aria-hidden className="flex-1" />;
}
