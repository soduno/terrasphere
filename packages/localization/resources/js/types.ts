export interface Language {
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  fallbackLocale: string | null;
}
