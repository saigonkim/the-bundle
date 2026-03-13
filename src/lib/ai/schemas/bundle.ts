import { z } from 'zod';

export const EtfCardSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  metaphor: z.string().max(100),        
  rationale: z.string().max(300),      // Increased from 100
});

export const BundleDraftSchema = z.object({
  title: z.string().max(50),
  theme: z.string().max(100),
  summary: z.string().max(300),
  monthly_comment: z.string().max(500),
  etf_cards: z.array(EtfCardSchema).min(3), // Must have at least 3 cards
});

export type BundleDraft = z.infer<typeof BundleDraftSchema>;
