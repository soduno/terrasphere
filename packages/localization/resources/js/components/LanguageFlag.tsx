import { Flag } from 'lucide-react';
import type { Language } from '../types';

const flagAssets = import.meta.glob<string>(
  '../../../../../node_modules/flag-icons/flags/4x3/*.svg',
  { eager: true, query: '?url', import: 'default' },
);

interface LanguageFlagProps {
  language: Pick<Language, 'flag' | 'locale' | 'name'>;
  className?: string;
}

const localeFlagDefaults: Record<string, string> = {
  ar: 'sa',
  da: 'dk',
  en: 'gb',
  ja: 'jp',
  ko: 'kr',
  zh: 'cn',
};

function regionalIndicatorCode(value: string): string | null {
  const characters = Array.from(value.trim());
  if (characters.length !== 2) return null;

  const points = characters.map((character) => character.codePointAt(0) ?? 0);
  if (points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) return null;

  return points
    .map((point) => String.fromCharCode(97 + point - 0x1f1e6))
    .join('');
}

function flagCode(flag: string, locale: string): string | null {
  const normalizedFlag = flag.trim().toLocaleLowerCase();
  if (/^[a-z]{2}$/.test(normalizedFlag)) return normalizedFlag;

  const emojiCode = regionalIndicatorCode(flag);
  if (emojiCode) return emojiCode;

  const localeParts = locale.split('-');
  const region = localeParts.find((part) => /^[A-Z]{2}$/.test(part));
  if (region) return region.toLocaleLowerCase();

  return localeFlagDefaults[localeParts[0]?.toLocaleLowerCase() ?? ''] ?? null;
}

export function LanguageFlag({ language, className = '' }: LanguageFlagProps) {
  const code = flagCode(language.flag, language.locale);

  if (!code) {
    return <Flag className={`size-4 text-gray-400 ${className}`} aria-hidden="true" />;
  }

  const source = flagAssets[
    `../../../../../node_modules/flag-icons/flags/4x3/${code}.svg`
  ];

  if (!source) {
    return <Flag className={`size-4 text-gray-400 ${className}`} aria-hidden="true" />;
  }

  return (
    <img
      src={source}
      alt={`${language.name} flag`}
      className={`inline-block h-[1em] w-[1.333em] shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-black/10 ${className}`}
    />
  );
}
