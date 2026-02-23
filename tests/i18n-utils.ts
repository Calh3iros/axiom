import fs from 'fs';
import path from 'path';

export function getTranslations(locale: string) {
  const filePath = path.resolve(__dirname, `../src/messages/${locale}.json`);
  const file = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(file);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function t(dict: any, key: string, fallback?: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = key.split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), dict);
  return result || fallback || key;
}
