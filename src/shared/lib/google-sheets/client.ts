import crypto from 'node:crypto';
import { request } from 'node:https';
import type { RequestOptions } from 'node:https';

type JsonValue = Record<string, unknown>;

interface SheetCacheEntry {
  expiresAt: number;
  rows: string[][];
}

const SHEET_CACHE_TTL_MS = 5 * 60 * 1000;
const sheetCache = new Map<string, SheetCacheEntry>();

const base64urlEncode = (value: string): string => {
  return Buffer.from(value).toString('base64url');
};

const fetchJson = <T extends JsonValue>(options: RequestOptions, body?: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');

        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${text}`));
          return;
        }

        try {
          resolve(JSON.parse(text) as T);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

const createJwtAssertion = (serviceAccountEmail: string, privateKey: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${payload}`)
    .sign(privateKey, 'base64url');

  return `${header}.${payload}.${signature}`;
};

const getServiceAccountAccessToken = async (): Promise<string> => {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKeyRaw) {
    throw new Error('Google Sheets credentials are not configured');
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  const assertion = createJwtAssertion(serviceAccountEmail, privateKey);
  const tokenResponse = await fetchJson<{ access_token: string }>(
    {
      method: 'POST',
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  );

  return tokenResponse.access_token;
};

export const fetchGoogleSheetRows = async (spreadsheetId: string, range: string): Promise<string[][]> => {
  const cacheKey = `${spreadsheetId}:${range}`;
  const cached = sheetCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.rows;
  }

  const accessToken = await getServiceAccountAccessToken();
  const response = await fetchJson<{ values?: string[][] }>({
    hostname: 'sheets.googleapis.com',
    path: `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const rows = response.values ?? [];
  sheetCache.set(cacheKey, {
    rows,
    expiresAt: Date.now() + SHEET_CACHE_TTL_MS,
  });

  return rows;
};
