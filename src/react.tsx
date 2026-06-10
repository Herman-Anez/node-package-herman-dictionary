import React from 'react';
import { createI18nCore, getNestedValue } from './core';

export interface TProps {
  id?: string;
  [key: string]: React.ReactNode;
}

export function createI18nHooks<
  Dictionaries extends Record<string, any>,
  LocaleKey extends keyof Dictionaries = keyof Dictionaries
>(
  useLocaleHook: () => string,
  dictionaries: Dictionaries,
  defaultLocale: LocaleKey
) {
  const core = createI18nCore(dictionaries, defaultLocale);

  const useT = () => {
    const locale = useLocaleHook();
    const currentLocale = (locale || String(defaultLocale)) as string;
    
    const t = (props: TProps): any => {
      if (props.id) {
        const dictCurrent = core.getDictionary(currentLocale);
        const dictBase = core.getDictionary(defaultLocale);
        
        const value = getNestedValue(dictCurrent, props.id) || getNestedValue(dictBase, props.id);

        return value || props[String(defaultLocale)] || props['en'] || props['es'] || props.children || `[${props.id}]`;
      }

      return props[currentLocale] || props[String(defaultLocale)] || props['en'] || props['es'] || Object.values(props)[0] || null;
    };

    return { t, locale: currentLocale };
  };

  const T: React.FC<TProps> = (props) => {
    const { t } = useT();
    return <>{t(props)}</>;
  };

  T.displayName = 'T';

  return { useT, T, ...core };
}
