export const getNestedValue = (obj: unknown, path: string): string | undefined => {
  const result = path.split(".").reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    obj
  );
  return typeof result === "string" ? result : undefined;
};

export const resolveKey = <Dict>(dict: Dict, value: string): string =>
  getNestedValue(dict, value) ?? value;

export function createI18nCore<
  Dictionaries extends Record<string, any>,
  LocaleKey extends keyof Dictionaries = keyof Dictionaries
>(dictionaries: Dictionaries, defaultLocale: LocaleKey) {
  type Locale = keyof Dictionaries;
  type Dictionary = Dictionaries[Locale];

  const getDictionary = (locale: string | Locale): Dictionary => {
    return dictionaries[locale as Locale] ?? dictionaries[defaultLocale];
  };

  return {
    getDictionary,
    resolveKey,
    getNestedValue,
    dictionaries,
    defaultLocale,
  };
}
