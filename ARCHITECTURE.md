# ARCHITECTURE.md — The Bundle: 시스템 아키텍처 & DB 스키마

> **버전**: v0.1 | **작성일**: 2026-03-12

---

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["클라이언트 (Browser)"]
        NEXT["Next.js 14\nApp Router"]
    end

    subgraph Vercel["Vercel (Edge/Serverless)"]
        API_ROUTES["Next.js API Routes\n/api/*"]
        CRON_V["Vercel Cron Jobs\n(매일 09:00 트리거)"]
    end

    subgraph Supabase["Supabase Cloud"]
        AUTH["Supabase Auth\n(이메일 + 카카오 OAuth)"]
        DB["PostgreSQL DB\n(핵심 테이블)"]
        EDGE["Edge Functions\n(Deno Runtime)"]
        REALTIME["Realtime\n(WebSocket)"]
        RLS["Row Level Security\n(사용자 데이터 분리)"]
    end

    subgraph External["외부 API"]
        KIS["한국투자증권\nKIS Developers API\n(ETF 시세/NAV/PDF)"]
        TOSS["토스페이먼츠\nBilling API\n(빌링키/자동결제)"]
        AI["OpenAI GPT-4o\nor\nGemini 1.5 Pro\n(번들 설명 생성)"]
        EMAIL["Resend\n(이메일 발송)"]
    end

    NEXT <-->|"RSC + Client fetch\n(Supabase JS SDK)"| AUTH
    NEXT <-->|"데이터 조회"| DB
    NEXT <-->|"Realtime 구독"| REALTIME
    API_ROUTES <-->|"결제 처리"| TOSS
    API_ROUTES <-->|"AI 초안 생성"| AI

    CRON_V -->|"ETF 수집 트리거"| EDGE
    EDGE -->|"KIS OAuth + 시세 조회"| KIS
    EDGE -->|"ETF 데이터 저장"| DB
    EDGE -->|"월별 결제 실행"| TOSS
    EDGE -->|"결제 완료 알림"| EMAIL

    DB --- RLS
```

---

## 2. ETF 데이터 수집 파이프라인 (Data Flow)

### 2-A. KIS API 인증 및 토큰 관리

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron / Supabase Edge
    participant KIS as KIS Developers API
    participant DB as Supabase DB

    Cron->>KIS: POST /oauth2/tokenP (app_key, app_secret)
    KIS-->>Cron: access_token (유효 24h)
    Note over Cron: 토큰을 Supabase secrets or\n환경변수에 캐싱 (만료 전 갱신)

    loop 매일 장 마감 후 (15:30 KST)
        Cron->>KIS: GET /uapi/etf-fund/v1/quotations/inquire-price\n(Bearer token + ETF 종목코드)
        KIS-->>Cron: 현재가, NAV, 전일비, 거래량
        Cron->>DB: INSERT INTO etf_prices (ticker, price, nav, fetched_at)
        Cron->>KIS: GET /uapi/etf-fund/v1/quotations/inquire-pdf\n(종목별 PDF 구성 정보)
        KIS-->>Cron: PDF 구성 종목, 비중
        Cron->>DB: UPSERT INTO etf_holdings (ticker, component, weight)
    end
```

### 2-B. 호출 주기 및 전략

| 데이터 종류 | 호출 빈도 | 저장 방식 |
|-------------|----------|----------|
| ETF 현재가 & NAV | 매일 15:30 KST (장 마감 후) | `etf_prices` 테이블 append |
| PDF (포트폴리오 구성) | 매주 월요일 09:00 | `etf_holdings` upsert |
| 리밸런싱 계획 | 매월 말일 23:00 (번들 준비) | `bundles` draft 생성 |

> **장중 실시간 시세 불필요**: v1은 일별 종가 NAV만 사용하여 KIS API 호출 비용 및 쿼터 최소화.  
> Cron 주체: 평일 장 마감 후 → Vercel Cron, 주말/월말 배치 → Supabase pg_cron (Edge Function 트리거)

### 2-C. 클라이언트 데이터 전달 최적화

```
[Supabase DB] → [Next.js RSC (Server Component)]
  - 번들/ETF 데이터: RSC에서 직접 Supabase query (서버 렌더링)
  - 개인 수익률/기다림 지수: Client Component + Supabase Realtime 구독
  - ETF 현재가 갱신: ISR (revalidate: 3600) 또는 SWR mutate

[최적화 전략]
  1. Bundle 데이터: ISR 캐싱 (1시간), 번들 발행 시 on-demand revalidate
  2. ETF 시세: 클라이언트에서 SWR + Supabase Realtime 구독
  3. 사용자 개인 데이터: SSR with Supabase Auth (RLS 활용)
```

---

## 3. AI 번들 생성 파이프라인

```mermaid
sequenceDiagram
    participant Admin as 관리자 (Admin Panel)
    participant API as Next.js API Route\n/api/admin/generate-bundle
    participant DB as Supabase DB
    participant AI as OpenAI / Gemini API

    Admin->>API: POST /generate-bundle (월 번들 요청)
    API->>DB: SELECT 최근 30일 ETF 시세 + 상위 거래량 + 섹터 정보
    API->>AI: Prompt:\n"다음 ETF 데이터를 기반으로 20대 친화적 언어로\n10종 번들 선정 이유와 코멘트를 작성해줘.\n데이터: {etf_data_json}"
    AI-->>API: 번들 초안 (ETF 10종 + 각 설명 + 월간 코멘트)
    API->>DB: INSERT INTO bundles (status='draft', ai_commentary, ...)
    API-->>Admin: 초안 응답 (편집 가능 UI로 표시)

    Admin->>API: PUT /bundles/{id}/publish (검토 후 발행)
    API->>DB: UPDATE bundles SET status='published'
    API->>DB: INSERT INTO bundle_items (번들 구성 확정)
    API-->>Admin: 발행 완료 + 구독자 알림 트리거
```

---

## 4. 토스페이먼츠 빌링 결제 흐름

```mermaid
sequenceDiagram
    participant User as 사용자 (Browser)
    participant Next as Next.js API Route
    participant Toss as 토스페이먼츠 API
    participant DB as Supabase DB
    participant Cron as 월별 Cron Job

    Note over User,DB: [최초 카드 등록 & 빌링키 발급]
    User->>Next: POST /api/payments/billing-key (cardNumber, etc.)
    Next->>Toss: POST /v1/billing/authorizations/card
    Toss-->>Next: billingKey + customerKey
    Next->>DB: INSERT INTO user_subscriptions\n(billing_key, status='active', next_billing_at)
    Next->>Toss: POST /v1/billing/{billingKey} (첫 달 4,900원 즉시 결제)
    Toss-->>Next: paymentKey + 승인 결과
    Next->>DB: INSERT INTO payment_histories (amount, status='success')
    Next-->>User: 구독 시작 완료 리디렉션

    Note over Cron,DB: [매월 1일 자동 결제 Cron]
    Cron->>DB: SELECT * FROM user_subscriptions\nWHERE status='active'\nAND next_billing_at <= NOW()
    loop 각 구독자
        Cron->>Toss: POST /v1/billing/{billingKey}\n(amount: 4900, orderId, orderName)
        alt 결제 성공
            Toss-->>Cron: paymentKey + success
            Cron->>DB: UPDATE next_billing_at = +1 month\nINSERT payment_histories (success)
        else 결제 실패
            Toss-->>Cron: 실패 사유
            Cron->>DB: INSERT payment_histories (failed)\nUPDATE failure_count += 1
            Note over Cron: failure_count >= 3 이면\nstatus = 'suspended'
        end
    end
```

---

## 5. 데이터베이스 스키마 (DB Schema)

### 5-A. 개요 ERD

```mermaid
erDiagram
    USERS ||--o{ USER_SUBSCRIPTIONS : "has"
    USER_SUBSCRIPTIONS ||--o{ PAYMENT_HISTORIES : "generates"
    USER_SUBSCRIPTIONS ||--o{ PATIENCE_LOGS : "tracks"
    BUNDLES ||--o{ BUNDLE_ITEMS : "contains"
    BUNDLE_ITEMS }o--|| ETF_MASTER : "references"
    ETF_MASTER ||--o{ ETF_PRICES : "has"
    ETF_MASTER ||--o{ ETF_HOLDINGS : "has"
    USER_SUBSCRIPTIONS }o--|| BUNDLES : "subscribed_to"
```

---

### 5-B. 상세 테이블 정의

#### 📦 `bundles` — 월별 ETF 번들

```sql
CREATE TABLE bundles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,                    -- "2026년 3월 번들: 안정속의 성장"
    theme           TEXT,                             -- "글로벌 분산 + 배당 안정"
    summary         TEXT,                             -- 20대 친화 요약 (AI 생성)
    ai_commentary   TEXT,                             -- AI 생성 월간 코멘트 (관리자 편집 가능)
    status          TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'published' | 'archived'
    published_at    TIMESTAMPTZ,
    valid_from      DATE NOT NULL,                    -- 번들 유효 시작일 (매월 1일)
    valid_until     DATE NOT NULL,                    -- 번들 유효 종료일 (매월 말일)
    created_by      UUID REFERENCES auth.users(id),  -- 관리자 UID
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📊 `bundle_items` — 번들 내 ETF 구성

```sql
CREATE TABLE bundle_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id       UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    etf_ticker      TEXT NOT NULL,                    -- ETF 종목코드 (예: "360750")
    etf_name        TEXT NOT NULL,                    -- "TIGER 미국S&P500"
    weight          NUMERIC(5,2) NOT NULL,            -- 편입 비중 % (합계 = 100.00)
    rationale       TEXT,                             -- AI 생성 선정 이유 (20대 언어)
    metaphor        TEXT,                             -- 비유 설명 (예: "미국 500대 기업 한번에")
    base_nav        NUMERIC(12,4),                    -- 번들 발행일 기준 NAV (수익률 계산 기준)
    order_index     INT DEFAULT 0,                    -- 카드 표시 순서
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bundle_id, etf_ticker)
);
```

#### 💳 `user_subscriptions` — 구독 및 빌링키 관리

```sql
CREATE TABLE user_subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 토스페이먼츠 빌링 관련
    billing_key         TEXT,                          -- 토스페이먼츠 빌링키 (암호화 권장)
    customer_key        TEXT UNIQUE,                   -- 토스페이먼츠 customerKey (사용자 식별)
    card_company        TEXT,                          -- 카드사 (예: "신한카드")
    card_number_masked  TEXT,                          -- 마스킹된 카드번호 (예: "****-****-****-1234")
    
    -- 구독 상태
    status              TEXT NOT NULL DEFAULT 'pending',
                                                       -- 'pending' | 'active' | 'suspended' | 'cancelled'
    plan_amount         INT NOT NULL DEFAULT 4900,     -- 월 구독료 (원)
    currency            TEXT NOT NULL DEFAULT 'KRW',
    
    -- 결제 스케줄링
    subscribed_at       TIMESTAMPTZ,                   -- 최초 구독(결제 성공) 시각
    next_billing_at     TIMESTAMPTZ,                   -- 다음 자동 결제 예정 시각
    last_billed_at      TIMESTAMPTZ,                   -- 마지막 성공 결제 시각
    billing_cycle_day   INT DEFAULT 1,                 -- 매월 결제일 (기본 1일)
    
    -- 실패 처리
    failure_count       INT DEFAULT 0,                 -- 연속 결제 실패 횟수
    suspended_at        TIMESTAMPTZ,                   -- 정지된 시각
    cancelled_at        TIMESTAMPTZ,                   -- 해지된 시각
    cancellation_reason TEXT,
    
    -- 구독 번들 추적
    current_bundle_id   UUID REFERENCES bundles(id),  -- 현재 구독 중인 번들
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)  -- 사용자당 구독 1개
);

-- 빌링키 보안: Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscription" ON user_subscriptions
    FOR ALL USING (auth.uid() = user_id);
-- billing_key 컬럼은 서버(Edge Function)에서만 SELECT (클라이언트 노출 방지)
```

#### 📈 `patience_logs` — 기다림 지수 기록

```sql
CREATE TABLE patience_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id     UUID NOT NULL REFERENCES user_subscriptions(id),
    
    -- 지수 계산
    patience_score      NUMERIC(5,2) NOT NULL,         -- 0.00 ~ 100.00
    virtual_return_pct  NUMERIC(8,4),                  -- 가상 수익률 % (기준일 대비)
    virtual_amount      NUMERIC(12,2),                 -- 가상 평가금액 (원)
    
    -- 지수 변동 원인
    delta               NUMERIC(5,2),                  -- 전일 대비 지수 변화량
    reason              TEXT,                          -- 변동 사유 (예: "수익 구간 진입 +5pt")
    
    -- 시점
    recorded_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, recorded_date)
);

ALTER TABLE patience_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_patience" ON patience_logs
    FOR ALL USING (auth.uid() = user_id);
```

#### 💰 `payment_histories` — 결제 이력

```sql
CREATE TABLE payment_histories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id),
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    
    -- 토스페이먼츠 결제 정보
    payment_key     TEXT UNIQUE,                       -- 토스페이먼츠 paymentKey
    order_id        TEXT UNIQUE NOT NULL,              -- 주문번호 (UUID 생성)
    amount          INT NOT NULL,                      -- 결제 금액 (원)
    status          TEXT NOT NULL,                     -- 'success' | 'failed' | 'cancelled'
    failure_code    TEXT,                              -- 실패 코드 (토스페이먼츠 에러코드)
    failure_message TEXT,                              -- 실패 메시지
    
    -- 결제 시점
    billed_at       TIMESTAMPTZ DEFAULT NOW(),
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🏷️ `etf_master` — ETF 기본 정보

```sql
CREATE TABLE etf_master (
    ticker          TEXT PRIMARY KEY,                  -- 종목코드 (예: "360750")
    name            TEXT NOT NULL,                     -- "TIGER 미국S&P500"
    name_short      TEXT,                              -- 약칭
    issuer          TEXT,                              -- 운용사 (예: "미래에셋자산운용")
    benchmark_index TEXT,                              -- 추종 지수
    category        TEXT,                              -- 섹터/테마 분류
    exchange        TEXT DEFAULT 'KRX',                -- 거래소
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📉 `etf_prices` — ETF 일별 시세

```sql
CREATE TABLE etf_prices (
    id          BIGSERIAL PRIMARY KEY,
    ticker      TEXT NOT NULL REFERENCES etf_master(ticker),
    price_date  DATE NOT NULL,
    close_price NUMERIC(12,4) NOT NULL,                -- 종가
    nav         NUMERIC(12,4),                         -- NAV
    prev_close  NUMERIC(12,4),                         -- 전일 종가
    change_pct  NUMERIC(8,4),                          -- 전일 대비 등락률
    volume      BIGINT,                                -- 거래량
    fetched_at  TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(ticker, price_date)
);

-- 시세 조회 최적화 인덱스
CREATE INDEX idx_etf_prices_ticker_date ON etf_prices(ticker, price_date DESC);
```

---

## 6. Supabase RLS 보안 정책 요약

| 테이블 | 읽기(SELECT) | 쓰기(INSERT/UPDATE) |
|--------|-------------|---------------------|
| `bundles` | 모두 (published만) | 관리자만 |
| `bundle_items` | 모두 | 관리자만 |
| `user_subscriptions` | 본인만 | 서버(Service Role)만 |
| `patience_logs` | 본인만 | 서버(Service Role)만 |
| `payment_histories` | 본인만 | 서버(Service Role)만 |
| `etf_prices` | 모두 | 서버(Service Role)만 |

---

## 7. 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용 (클라이언트 노출 금지)

# 한국투자증권 KIS
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_ACCOUNT_NUMBER=

# 토스페이먼츠
TOSS_CLIENT_KEY=                    # 클라이언트용 (NEXT_PUBLIC_ 가능)
TOSS_SECRET_KEY=                    # 서버 전용

# AI
OPENAI_API_KEY=
GEMINI_API_KEY=

# 이메일
RESEND_API_KEY=

# Cron 보안
CRON_SECRET=                        # Vercel Cron 인증 헤더
```
