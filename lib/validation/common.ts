import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens.",
  );

export const urlSchema = z.string().url();

export const currentPriceSchema = z.object({
  sourceUrl: urlSchema,
  lastCheckedAt: z.coerce.date(),
  inputPricePer1M: z.number().finite().min(0),
  outputPricePer1M: z.number().finite().min(0),
});
