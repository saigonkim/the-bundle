---
name: billing-subscription-agent
description: |
  토스페이먼츠 빌링 API를 연동하여 월 4,900원 정기 구독 결제(빌링키 발급 및 자동 승인)를
  처리하고, 구독 상태 및 기다림 지수(Patience Gauge) 로그를 업데이트하는 작업이 필요할 때 사용하라.
  트리거 예시:
    - "토스페이먼츠 빌링키 발급 코드를 작성해줘"
    - "정기결제 Cron을 구현해줘"
    - "결제 실패 처리 로직을 만들어줘"
    - "user_subscriptions 구독 상태 업데이트 코드 작성해줘"
    - "기다림 지수(Patience Gauge)를 계산하고 patience_logs에 저장해줘"
    - "구독 해지/정지 로직을 구현해줘"
---

# Billing Subscription Agent — 토스페이먼츠 빌링 & 구독 관리 스킬

## Goal

토스페이먼츠 빌링 API를 사용하여 The Bundle 서비스의 **월 4,900원 자동 정기결제** 시스템을 구현한다.
빌링키 발급부터 월별 자동 승인, 결제 실패 예외 처리, 구독 해지까지 전체 라이프사이클을 안전하게 관리한다.
결제 이벤트에 연동하여 `user_subscriptions`, `payment_histories`, `patience_logs` 테이블을 업데이트한다.

---

## Instructions

### Step 1. 환경 설정

```env
# 서버 전용 (절대 NEXT_PUBLIC_ 사용 금지)
TOSS_SECRET_KEY=test_sk_...       # 운영 전환 시 live_sk_... 로 변경

# 클라이언트용 (결제 위젯 초기화)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
```

> **⚠️ 중요**: `TOSS_SECRET_KEY`는 Base64 인코딩하여 Basic Auth 헤더에 사용.
> `Authorization: Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`

---

### Step 2. 빌링키 발급 플로우

#### 2-A. 클라이언트 — 카드 등록 UI

```typescript
// src/app/subscribe/page.tsx (Client Component)
import { loadTossPayments } from '@tosspayments/payment-sdk';

const handleBillingAuth = async () => {
  const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
  await tossPayments.requestBillingAuth('카드', {
    customerKey: generateCustomerKey(user.id), // UUID 기반 고유 키
    successUrl: `${origin}/subscribe/success`,
    failUrl: `${origin}/subscribe/fail`,
  });
};
```

#### 2-B. 빌링키 발급 성공 콜백 처리

```typescript
// src/app/api/payments/billing-key/route.ts
export async function POST(req: NextRequest) {
  const { authKey, customerKey } = await req.json();

  // 1. 토스페이먼츠에 빌링키 발급 요청
  const billingRes = await fetch(
    `https://api.tosspayments.com/v1/billing/authorizations/${authKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerKey }),
    }
  );

  if (!billingRes.ok) {
    const err = await billingRes.json();
    return Response.json({ error: err.message }, { status: 400 });
  }

  const { billingKey, card } = await billingRes.json();

  // 2. Supabase Service Role로 user_subscriptions INSERT
  const supabaseAdmin = createSupabaseAdminClient();
  const orderId = `bundle-first-${crypto.randomUUID()}`;

  const { error: dbError } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: user.id,
      billing_key: billingKey,             // ⚠️ 암호화 저장 권장 (pgcrypto)
      customer_key: customerKey,
      card_company: card.company,
      card_number_masked: card.number,
      status: 'pending',
    }, { onConflict: 'user_id' });

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });

  // 3. 즉시 첫 결제 실행
  const chargeResult = await chargeSubscription({
    billingKey,
    customerKey,
    orderId,
    amount: 4900,
    orderName: 'The Bundle 구독료',
  });

  if (chargeResult.success) {
    // status = 'active', next_billing_at = 다음 달 1일
    await activateSubscription(user.id, chargeResult.paymentKey);
  }

  return Response.json({ success: chargeResult.success });
}
```

---

### Step 3. 결제 실행 공통 함수

```typescript
// src/lib/payments/toss.ts

interface ChargeParams {
  billingKey: string;
  customerKey: string;
  orderId: string;
  amount: number;
  orderName: string;
}

export async function chargeSubscription(params: ChargeParams) {
  const { billingKey, customerKey, orderId, amount, orderName } = params;

  const res = await fetch(
    `https://api.tosspayments.com/v1/billing/${billingKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerKey, orderId, amount, orderName }),
    }
  );

  const data = await res.json();

  return {
    success: res.ok,
    paymentKey: data.paymentKey ?? null,
    failureCode: data.code ?? null,
    failureMessage: data.message ?? null,
  };
}
```

---

### Step 4. 월별 자동 결제 Cron

```typescript
// src/app/api/cron/billing/route.ts
export async function GET(request: Request) {
  // 보안: CRON_SECRET 검증
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // 결제 대상: active 상태이고 next_billing_at이 현재 이전인 구독자
  const { data: subscriptions } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_billing_at', new Date().toISOString());

  const results = await Promise.allSettled(
    subscriptions!.map(async (sub) => {
      const orderId = `bundle-${sub.user_id}-${Date.now()}`;
      const result = await chargeSubscription({
        billingKey: sub.billing_key,
        customerKey: sub.customer_key,
        orderId,
        amount: sub.plan_amount,
        orderName: 'The Bundle 월 구독료',
      });

      if (result.success) {
        // 성공: next_billing_at 갱신, failure_count 리셋
        await supabaseAdmin.from('user_subscriptions').update({
          last_billed_at: new Date().toISOString(),
          next_billing_at: nextMonthFirstDay(),
          failure_count: 0,
        }).eq('id', sub.id);

        await supabaseAdmin.from('payment_histories').insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          payment_key: result.paymentKey,
          order_id: orderId,
          amount: sub.plan_amount,
          status: 'success',
        });

      } else {
        // 실패: failure_count 증가, 3회 이상이면 suspended
        const newFailureCount = (sub.failure_count ?? 0) + 1;
        const shouldSuspend = newFailureCount >= 3;

        await supabaseAdmin.from('user_subscriptions').update({
          failure_count: newFailureCount,
          status: shouldSuspend ? 'suspended' : 'active',
          suspended_at: shouldSuspend ? new Date().toISOString() : null,
        }).eq('id', sub.id);

        await supabaseAdmin.from('payment_histories').insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          order_id: orderId,
          amount: sub.plan_amount,
          status: 'failed',
          failure_code: result.failureCode,
          failure_message: result.failureMessage,
        });
      }
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return Response.json({ processed: results.length, succeeded, failed });
}
```

```json
// vercel.json에 추가
{
  "path": "/api/cron/billing",
  "schedule": "0 0 1 * *"
}
```
> `"0 0 1 * *"` = 매월 1일 UTC 00:00 = **KST 09:00**

---

### Step 5. 웹훅 핸들러

```typescript
// src/app/api/webhooks/tosspayments/route.ts
export async function POST(req: NextRequest) {
  // 토스페이먼츠는 별도 서명 검증 헤더 미제공 (IP 화이트리스트 또는 Secret 헤더로 보완)
  const event = await req.json();
  const supabaseAdmin = createSupabaseAdminClient();

  switch (event.eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      if (event.data.status === 'DONE') {
        await supabaseAdmin.from('payment_histories')
          .update({ status: 'success' })
          .eq('payment_key', event.data.paymentKey);
      }
      break;
    case 'BILLING_KEY_DELETED':
      await supabaseAdmin.from('user_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('billing_key', event.data.billingKey);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

---

### Step 6. 기다림 지수 (Patience Gauge) 일별 업데이트

```typescript
// src/app/api/cron/patience/route.ts
// 매일 새벽 실행 (Cron: "0 15 * * *" = KST 00:00)

async function calculateAndSavePatienceScore(userId: string, subId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  // 최근 기록 조회
  const { data: latest } = await supabaseAdmin
    .from('patience_logs')
    .select('patience_score, recorded_date')
    .eq('user_id', userId)
    .order('recorded_date', { ascending: false })
    .limit(1)
    .single();

  const currentScore = latest?.patience_score ?? 0;

  // 가상 수익률 계산 (현재 NAV vs 구독 시작일 NAV)
  const virtualReturn = await calculateVirtualReturn(userId);

  // 지수 변화량 계산
  let delta = 0.5;                          // 기본: 보유 지속 +0.5pt/일
  let reason = '구독 유지 중 🌱 +0.5pt';

  if (virtualReturn > 0) {
    delta += 2.0;
    reason = `수익 구간 돌입 📈 +2.5pt (수익률: +${virtualReturn.toFixed(2)}%)`;
  } else if (virtualReturn < -5) {
    delta -= 1.0;
    reason = `일시적 하락 구간 😤 -0.5pt (조정 중이에요, 버텨봐요!)`;
  }

  const newScore = Math.min(100, Math.max(0, currentScore + delta));

  await supabaseAdmin.from('patience_logs').upsert({
    user_id: userId,
    subscription_id: subId,
    patience_score: newScore,
    virtual_return_pct: virtualReturn,
    delta,
    reason,
    recorded_date: new Date().toISOString().split('T')[0],
  }, { onConflict: 'user_id,recorded_date' });
}
```

**지수 단계별 뱃지**

| 범위 | 뱃지 | 표시 문구 |
|------|------|----------|
| 0 ~ 25 | 씨앗 🌱 | "막 심었어요, 물 주는 중!" |
| 26 ~ 50 | 새싹 🌿 | "조금씩 자라고 있어요" |
| 51 ~ 75 | 나무 🌳 | "든든하게 뿌리내리는 중" |
| 76 ~ 100 | 현인 🧘 | "진정한 장기 투자자의 마음!" |

---

### Step 7. 코드 검증 체크리스트

```
[ ] 토스페이먼츠 테스트 카드로 빌링키 발급 성공 확인
[ ] 최초 결제(4,900원) 즉시 승인 및 user_subscriptions.status='active' 전환 확인
[ ] Cron 수동 트리거 후 next_billing_at 1개월 갱신 확인
[ ] 결제 실패 시 failure_count 증가 및 3회 실패 후 status='suspended' 확인
[ ] 웹훅 엔드포인트에 잘못된 이벤트 전송 시 에러 없이 처리 확인
[ ] Patience Gauge Cron 실행 후 patience_logs 레코드 생성 확인
[ ] 동일 날짜 재실행 시 UPSERT로 중복 방지 확인
```

---

## Constraints

- ❌ `TOSS_SECRET_KEY`는 절대 클라이언트 번들에 포함되지 않아야 한다.
  - Next.js에서 `NEXT_PUBLIC_` prefix 사용 금지.
  - 모든 결제 API 호출은 서버 사이드(API Route / Edge Function)에서만 수행.
- ❌ `billing_key`를 클라이언트 응답 JSON에 포함하여 반환하지 않는다.
  - Supabase RLS: `user_subscriptions`의 `billing_key` 컬럼은 서버(Service Role)만 읽기 가능.
- ❌ 결제 재시도를 동일한 `orderId`로 수행하지 않는다 (토스페이먼츠 중복 결제 오류 발생).
  - `orderId`는 매 결제마다 고유 UUID로 생성한다.
- ✅ Cron 엔드포인트는 반드시 `CRON_SECRET` Bearer 토큰으로 인증한다.
- ✅ 결제 실패 메시지는 사용자에게 표시할 때 반드시 개선된 문구로 치환한다.
  - 예: `"카드 한도 초과"` → `"이번 달 카드 한도가 꽉 찬 것 같아요. 카드를 변경해 주세요!"`
- ✅ 운영 전환 시 `test_sk_` → `live_sk_` 키 변경을 반드시 확인한다.
- ✅ `Promise.allSettled`를 사용하여 일부 사용자 결제 실패가 전체 Cron을 중단시키지 않도록 한다.
