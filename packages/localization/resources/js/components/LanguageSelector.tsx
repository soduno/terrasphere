import { Languages } from 'lucide-react';
import { Button } from '@ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import type { Language } from '../types';
import { LanguageFlag } from './LanguageFlag';

interface LanguageSelectorProps {
  languages: Language[];
  locale: string;
  onSelect: (language: Language) => void;
  compact?: boolean;
}

export function LanguageSelector({
  languages,
  locale,
  onSelect,
  compact = false,
}: LanguageSelectorProps) {
  const selected = languages.find((language) => language.locale === locale)
    ?? languages.find((language) => language.isDefault)
    ?? languages[0];

  if (!selected) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'icon' : 'sm'}
          className={compact
            ? 'size-8 shrink-0 rounded-lg border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-800'
            : 'gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800'}
          title={`Editing ${selected.name}`}
          aria-label={`Choose language. Currently ${selected.name}`}
        >
          {compact ? (
            <Languages className="size-4 text-indigo-600 dark:text-indigo-300" />
          ) : (
            <>
              <LanguageFlag language={selected} className="text-base" />
              <span>{selected.name}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-xl">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.id}
            onSelect={() => onSelect(language)}
            className="flex items-center gap-3"
          >
            <LanguageFlag language={language} className="text-lg" />
            <span className="flex-1">
              <span className="block text-sm">{language.name}</span>
              <span className="block text-xs text-gray-500">
                {language.nativeName}
              </span>
            </span>
            {language.isDefault && (
              <span className="text-[10px] font-semibold uppercase text-indigo-600">Default</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
