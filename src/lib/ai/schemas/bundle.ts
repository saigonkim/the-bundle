import { z } from 'zod';

export const EtfCardSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  metaphor: z.string().max(50),        // "커피 한 잔값으로 미국 전체에 투자"
  rationale: z.string().max(100),      // 선정 이유 (친근한 말투)
  one_liner: z.string().max(50),       // "미국 대장주 한번에 담기 ☕"
});

export const BundleDraftSchema = z.object({
  title: z.string().max(30),
  theme: z.string().max(50),
  summary: z.string().max(200),
  monthly_comment: z.string().max(300),
  etf_cards: z.array(EtfCardSchema),
});

export type BundleDraft = z.infer<typeof BundleDraftSchema>;
