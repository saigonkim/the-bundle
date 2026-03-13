import { getKISToken } from './auth';

export interface ETFPriceResponse {
  stck_prpr: string; // 현재가
  nav: string;       // NAV
  stck_sdpr: string; // 전일가
  prdy_ctrt: string; // 전일 대비율
  acml_vol: string;  // 누적 거래량
}

export interface ETFHoldingsResponse {
  output1: {
    stck_prpr: string;
    nav: string;
  };
  output2: Array<{
    stck_shrn_iscd: string; // 종목코드
    iscd_nm: string;        // 종목명
    bssas_invst_rate: string; // 투자비중
  }>;
}

const API_URL = process.env.KIS_API_URL || 'https://openapivts.koreainvestment.com:29443';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 401) {
          // Token expired possibly, but we'll let the caller handle token refresh if needed.
          // For now, treat as error to trigger retry or failure.
          throw new Error('KIS 401 Unauthorized');
      }
      if (!res.ok) throw new Error(`KIS HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export async function getETFPrice(ticker: string, token: string): Promise<ETFPriceResponse> {
  const url = `${API_URL}/uapi/etf-fund/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${ticker}`;
  
  const data = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'appkey': process.env.KIS_APP_KEY!,
      'appsecret': process.env.KIS_APP_SECRET!,
      'tr_id': 'FHPST02400000',
    },
  });

  if (data.rt_cd !== '0') {
    throw new Error(`KIS API Error: ${data.msg1}`);
  }

  return data.output;
}

export async function getETFHoldings(ticker: string, token: string): Promise<ETFHoldingsResponse> {
  const url = `${API_URL}/uapi/etf-fund/v1/quotations/inquire-pdf?fid_cond_mrkt_div_code=J&fid_input_iscd=${ticker}`;

  const data = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'appkey': process.env.KIS_APP_KEY!,
      'appsecret': process.env.KIS_APP_SECRET!,
      'tr_id': 'FHPST02450200',
    },
  });

  if (data.rt_cd !== '0') {
    throw new Error(`KIS API Error: ${data.msg1}`);
  }

  return data;
}
