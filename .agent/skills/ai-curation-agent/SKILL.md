---
name: ai-curation-agent
description: |
  OpenAI GPT-4o 또는 Google Gemini API를 호출하여 The Bundle의 월간 ETF 번들 선정 이유,
  각 ETF 비유 설명, 리밸런싱 초안을 20대 친화적 언어로 자동 생성하는 작업이 필요할 때 사용하라.
  트리거 예시:
    - "이달의 번들 설명 초안을 AI로 생성해줘"
    - "ETF 선정 이유를 20대 언어로 써줘"
    - "번들 AI 생성 API Route를 구현해줘"
    - "GPT/Gemini 프롬프트를 작성해줘"
    - "관리자 번들 초안 생성 파이프라인을 만들어줘"
---

# AI Curation Agent — 번들 콘텐츠 자동 생성 스킬

## Goal

매월 큐레이션된 ETF 10종에 대해, 딱딱한 금융 보고서 문체를 완전히 배제하고
**20대 사회초년생이 공감할 수 있는 일상 비유와 친근한 말투**로 번들 선정 이유,
각 ETF 설명 카드, 월간 코멘트를 AI로 자동 생성한다.
관리자가 검토 → 편집 → 발행하는 워크플로를 지원한다.

---

## Instructions

### Step 1. 프롬프트 템플릿 설계 원칙 (Tone & Manner)

**절대 사용 금지 표현**
- "포트폴리오 분산 효과", "알파 수익률", "리스크 프리미엄", "변동성 헤지"
- 딱딱한 수동태 문장 ("~이 선정되었습니다", "~가 포함됩니다")

**반드시 적용할 톤**
- 친구에게 설명하듯 말하기: "이거 진짜 좋아서 담아봤어"
- 일상 비유 필수 사용: 커피, 점심값, 월급, 넷플릭스 구독료 등
- 짧고 명확한 문장: 한 문장 최대 30자
- 이모지 1~2개 허용 (남발 금지)

**톤 예시 (Good vs Bad)**
```
❌ Bad:  "TIGER 미국S&P500 ETF는 미국 주요 지수를 추종하며 분산투자 효과를 제공합니다."
✅ Good: "미국 500대 기업에 한 번에 투자하는 ETF예요. 애플, 구글, 아마존이 다 들어있어요 ☕"
```

---

### Step 2. 프롬프트 파일 구조

```
src/lib/ai/prompts/
├── bundle-generation.ts     # 번들 초안 생성 시스템 프롬프트
├── etf-card.ts              # ETF 카드 설명 생성 프롬프트
└── monthly-comment.ts       # 월간 코멘트 생성 프롬프트
```

#### bundle-generation.ts — 시스템 프롬프트

```typescript
export const BUNDLE_SYSTEM_PROMPT = `
당신은 20대 사회초년생을 위한 ETF 투자 큐레이터입니다.
독자는 투자를 막 시작한 22~29세 직장인이며, 금융 용어에 익숙하지 않습니다.

[글쓰기 규칙]
1. 모든 설명은 일상적인 비유로 시작한다 (커피, 월급, 넷플릭스, 배달앱 등)
2. 한 문장은 최대 30자 이내로 유지한다
3. "~합니다" 체가 아닌 "~해요" 체를 사용한다
4. 금융 전문 용어는 반드시 괄호 안에 쉬운 말로 풀어준다
   예: "NAV(ETF의 실제 자산 가치)"
5. 긍정적이고 응원하는 톤을 유지한다
6. 이모지는 문장당 최대 1개만 사용한다

[출력 형식]
반드시 지정된 JSON 스키마 형식으로만 응답한다.
`;

export const BUNDLE_USER_PROMPT = (data: BundleGenerationInput) => `
이번 달 번들에 포함할 ETF 목록과 시장 데이터입니다:

${JSON.stringify(data, null, 2)}

위 데이터를 바탕으로 다음을 생성해주세요:
1. 이달의 번들 제목 (20자 이내, 흥미로운 테마명)
2. 번들 요약 (3문장, 20대 친화적 언어)
3. 각 ETF별 설명 카드 (비유, 선정 이유, 한 줄 설명)
4. 이달의 월간 코멘트 (100자 내외, 응원 메시지 포함)
`;
```

---

### Step 3. Structured Output 스키마 정의

```typescript
// src/lib/ai/schemas/bundle.ts
import { z } from 'zod';

export const EtfCardSchema = z.object({
  ticker: z.string(),
  metaphor: z.string().max(50),        // "커피 한 잔값으로 미국 전체에 투자"
  rationale: z.string().max(100),      // 선정 이유 (친근한 말투)
  one_liner: z.string().max(30),       // "미국 대장주 한번에 담기 ☕"
});

export const BundleDraftSchema = z.object({
  title: z.string().max(20),
  theme: z.string().max(30),
  summary: z.string().max(200),
  monthly_comment: z.string().max(150),
  etf_cards: z.array(EtfCardSchema).length(10),
});

export type BundleDraft = z.infer<typeof BundleDraftSchema>;
```

---

### Step 4. AI API Route 구현

```typescript
// src/app/api/admin/generate-bundle/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BundleDraftSchema } from '@/lib/ai/schemas/bundle';
import { BUNDLE_SYSTEM_PROMPT, BUNDLE_USER_PROMPT } from '@/lib/ai/prompts/bundle-generation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // 1. 관리자 권한 체크
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. 최근 ETF 데이터 조회 (30일 시세 + 활성 번들 후보)
  const { data: etfData } = await supabase
    .from('etf_prices')
    .select('ticker, close_price, nav, change_pct, price_date')
    .gte('price_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('price_date', { ascending: false });

  // 3. AI 호출 (OpenAI 우선, 실패 시 Gemini 폴백)
  let draft: BundleDraft;
  try {
    draft = await generateWithOpenAI(etfData);
  } catch (err) {
    console.warn('[AI] OpenAI failed, falling back to Gemini:', err);
    draft = await generateWithGemini(etfData);
  }

  // 4. 검증 (Zod 파싱)
  const parsed = BundleDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return Response.json({ error: 'AI output validation failed', details: parsed.error }, { status: 422 });
  }

  // 5. Supabase bundles 테이블에 draft 저장
  const { data: bundle, error } = await supabase
    .from('bundles')
    .insert({
      title: parsed.data.title,
      theme: parsed.data.theme,
      summary: parsed.data.summary,
      ai_commentary: parsed.data.monthly_comment,
      status: 'draft',
      valid_from: firstDayOfNextMonth(),
      valid_until: lastDayOfNextMonth(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ bundle, etf_cards: parsed.data.etf_cards });
}

async function generateWithOpenAI(etfData: unknown): Promise<BundleDraft> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: BUNDLE_SYSTEM_PROMPT },
      { role: 'user', content: BUNDLE_USER_PROMPT({ etf_data: etfData }) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  return JSON.parse(response.choices[0].message.content!);
}

async function generateWithGemini(etfData: unknown): Promise<BundleDraft> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent(
    BUNDLE_SYSTEM_PROMPT + '\n\n' + BUNDLE_USER_PROMPT({ etf_data: etfData })
  );
  return JSON.parse(result.response.text());
}
```

---

### Step 5. 프롬프트 품질 관리

- **Few-shot 예시 포함**: 시스템 프롬프트에 Good/Bad 예시를 3쌍 이상 포함하여 일관성 확보.
- **출력 길이 제어**: `max_tokens: 2000` 설정으로 과도한 응답 방지.
- **Temperature**: `0.7` 유지 (너무 낮으면 반복 표현, 너무 높으면 일관성 저하).
- **버전 관리**: 프롬프트 변경 시 `bundle-generation-v2.ts` 형태로 버전 분리.

---

### Step 6. 코드 검증 체크리스트

```
[ ] /api/admin/generate-bundle 호출 시 관리자 외 403 반환 확인
[ ] AI 응답이 BundleDraftSchema Zod 파싱 통과 확인
[ ] OpenAI 실패 시 Gemini 폴백 정상 동작 확인
[ ] 생성된 초안이 bundles 테이블 status='draft'로 저장 확인
[ ] 생성된 ETF 설명에 금융 전문 용어 미사용 여부 육안 검토
[ ] 각 ETF metaphor, one_liner가 지정 글자 수 초과하지 않음 확인
```

---

## Constraints

- ❌ `OPENAI_API_KEY`, `GEMINI_API_KEY`는 절대 클라이언트에 노출하지 않는다.
- ❌ AI 생성 콘텐츠를 검토 없이 즉시 `status='published'`로 저장하지 않는다.
  - 반드시 `status='draft'` → 관리자 검토 → `status='published'` 2단계를 지킨다.
- ❌ 금융 투자 권유로 오해될 수 있는 문구("반드시 오릅니다", "원금 보장") 생성 금지.
  - 필요 시 시스템 프롬프트에 명시적으로 금지 문구 목록을 추가한다.
- ✅ Zod 스키마 검증을 반드시 통과한 응답만 DB에 저장한다.
- ✅ OpenAI → Gemini 폴백 순서를 유지하여 서비스 가용성을 보장한다.
- ✅ 프롬프트 템플릿은 별도 파일(`src/lib/ai/prompts/`)로 분리하여 비개발자도 수정 가능하도록 한다.
