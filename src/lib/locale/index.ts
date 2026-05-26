import { en } from "./en";
import { ptBR } from "./pt-BR";
import type { Translations } from "./en";

export type Locale = "en" | "pt-BR";

export type { Translations };

export const defaultLocale: Locale = "en";

export const locales: Record<Locale, Translations> = {
  en,
  "pt-BR": ptBR,
};

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

type DeepKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DeepKeys<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

export type TranslationKey = DeepKeys<typeof en>;
