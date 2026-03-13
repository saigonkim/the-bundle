---
name: etf-data-agent
description: |
  한국투자증권 KIS Developers API를 통해 ETF 시세, NAV, PDF(포트폴리오 구성) 데이터를
  수집하고 Supabase DB에 적재/업데이트하는 작업이 필요할 때 이 스킬을 사용하라.
  트리거 예시:
    - "ETF 시세를 KIS API에서 가져와서 DB에 저장해줘"
    - "etf_prices 테이블을 최신 데이터로 업데이트해줘"
    - "KIS API 연동 코드를 작성해줘"
    - "ETF 수집 스케줄러(Cron)를 구현해줘"
    - "NAV 데이터 파이프라인을 설계해줘"
---

# ETF Data Agent — KIS API 연동 & 데이터 수집 스킬

## Goal

한국투자증권 KIS Developers REST API를 호출하여 The Bundle 서비스가 큐레이션하는
ETF 종목들의 **일별 종가, NAV, PDF(포트폴리오 구성 비중)** 데이터를 수집하고
Supabase PostgreSQL DB(`etf_prices`, `etf_holdings`, `etf_master` 테이블)에 적재한다.
모든 수집 로직은 Vercel Cron 또는 Supabase Edge Function에서 스케줄 기반으로 실행 가능해야 한다.

---

## Instructions

### Step 1. KIS API 인증 토큰 관리

1. **OAuth 2.0 토큰 발급**
   - `POST https://openapi.koreainvestment.com:9443/oauth2/tokenP`
   - Body: `{ grant_type: "client_credentials", appkey: KIS_APP_KEY, appsecret: KIS_APP_SECRET }`
   - 응답: `access_token` (유효기간 24시간)

2. **토큰 캐싱 전략**
   - 토큰을 Supabase `app_config` 테이블(key-value 구조) 또는 서버 메모리에 캐싱한다.
   - 만료 30분 전(`expires_in - 1800` 초)에 자동 갱신 로직을 실행한다.
   - 구현 위치: `src/lib/kis/auth.ts`

   ```typescript
   // src/lib/kis/auth.ts
   export async function getKisAccessToken(): Promise<string> {
     // 1. 캐시에서 유효 토큰 확인
     // 2. 만료 임박 시 재발급
     // 3. Supabase app_config에 저장
   }
   ```

3. **환경변수 (서버 전용, NEXT_PUBLIC_ 절대 금지)**
   ```
   KIS_APP_KEY=
   KIS_APP_SECRET=
   KIS_BASE_URL=https://openapi.koreainvestment.com:9443
   ```

---

### Step 2. ETF 시세 및 NAV 수집

1. **엔드포인트**
   - 현재가/NAV: `GET /uapi/etf-fund/v1/quotations/inquire-price`
   - 헤더: `tr_id: FHPST02400000`, `Authorization: Bearer {access_token}`
   - 쿼리: `fid_input_iscd={종목코드}` (예: `360750`)

2. **수집 대상 ETF 목록**
   - `etf_master` 테이블에서 `is_active = true`인 종목 전체를 조회하여 순회한다.
   - KIS API는 종목별 단건 호출이므로 `Promise.allSettled`로 병렬 처리한다.
   - **Rate Limit 준수**: 초당 최대 20건 처리. `p-limit` 라이브러리 또는 청크 분할 사용.

3. **데이터 저장**
   ```typescript
   // etf_prices 테이블 UPSERT (같은 날짜 중복 방지)
   await supabase
     .from('etf_prices')
     .upsert({
       ticker,
       price_date: today,
       close_price: response.stck_prpr,
       nav: response.nav,
       prev_close: response.stck_sdpr,
       change_pct: response.prdy_ctrt,
       volume: response.acml_vol,
       fetched_at: new Date().toISOString(),
     }, { onConflict: 'ticker,price_date' });
   ```

---

### Step 3. PDF(포트폴리오 구성) 수집

1. **엔드포인트**
   - `GET /uapi/etf-fund/v1/quotations/inquire-pdf`
   - `tr_id: FHPST02450200`
   - 쿼리: `fid_input_iscd={종목코드}`

2. **저장 전략**
   - `etf_holdings` 테이블에 UPSERT (`ticker`, `component_ticker` 복합 유니크)
   - 주 1회 (매주 월요일 09:00 KST) 갱신으로 충분.

---

### Step 4. 스케줄러(Cron) 구현

#### 4-A. Vercel Cron (Next.js API Route)

```typescript
// src/app/api/cron/fetch-etf/route.ts
export async function GET(request: Request) {
  // 보안: CRON_SECRET 헤더 검증
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await fetchAndStoreAllEtfPrices(); // Step 2 로직 호출
    return Response.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Cron] ETF fetch failed:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/fetch-etf",
      "schedule": "30 6 * * 1-5"
    }
  ]
}
```
> `"30 6 * * 1-5"` = 평일 UTC 06:30 = **KST 15:30 (장 마감 30분 후)**

#### 4-B. Supabase Edge Function (대안)

```
supabase/functions/fetch-etf-prices/index.ts
```
- Deno 런타임에서 동작
- `supabaseAdmin` 클라이언트 (Service Role Key) 사용
- `supabase functions deploy fetch-etf-prices --no-verify-jwt`로 배포

---

### Step 5. 에러 핸들링 & 재시도

- **API 호출 실패 처리**
  ```typescript
  async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // 지수 백오프
      }
    }
  }
  ```

- **부분 실패 허용**: `Promise.allSettled` 사용으로 일부 종목 실패 시에도 나머지 종목 저장 계속 진행.
- **모니터링**: 실패한 티커 목록을 `console.error`로 기록하고 Sentry로 전송.
- **토큰 만료(401) 처리**: 응답 401 수신 시 즉시 토큰 재발급 후 1회 재시도.

---

### Step 6. 코드 검증 체크리스트

```
[ ] KIS Sandbox 환경에서 테스트 종목(360750) 시세 조회 성공
[ ] etf_prices 테이블에 레코드 INSERT 확인 (Supabase Table Editor)
[ ] 동일 종목 동일 날짜 재실행 시 UPSERT로 중복 없이 업데이트 확인
[ ] Cron 엔드포인트 CRON_SECRET 미제공 시 401 반환 확인
[ ] Promise.allSettled 적용으로 일부 실패 시 다른 종목 저장 완료 확인
[ ] Rate Limit 초과 없이 전체 종목 처리 완료 (로그 확인)
```

---

## Constraints

- ❌ `KIS_APP_KEY`, `KIS_APP_SECRET`은 절대 클라이언트 코드나 `NEXT_PUBLIC_` 환경변수로 노출하지 않는다.
- ❌ 장 중 분당 호출은 v1 범위 밖. 일별 종가(15:30 이후) 수집만 구현한다.
- ❌ DB 쓰기 작업에는 반드시 Supabase **Service Role Key**를 사용한다 (RLS 우회 필요).
- ✅ 모든 API 응답은 TypeScript 타입으로 정의하여 런타임 데이터 형식 오류를 방지한다.
- ✅ 스케줄러는 멱등성(Idempotent)을 보장해야 한다 (여러 번 실행해도 동일 결과).
- ✅ Vercel Cron 실행 로그는 Vercel Dashboard → Functions → Logs에서 반드시 확인한다.
