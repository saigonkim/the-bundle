export interface KISTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getKISToken(): Promise<string> {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;
  const apiUrl = process.env.KIS_API_URL || 'https://openapivts.koreainvestment.com:29443';

  if (!appKey || !appSecret) {
    throw new Error('KIS_APP_KEY or KIS_APP_SECRET is missing in .env.local');
  }

  const response = await fetch(`${apiUrl}/oauth2/tokenP`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get KIS token: ${JSON.stringify(errorData)}`);
  }

  const data: KISTokenResponse = await response.json();
  return data.access_token;
}
