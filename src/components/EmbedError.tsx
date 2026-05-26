"use client";

import { useLocale } from "@/hooks/useLocale";
import type { TranslationKey } from "@/lib/locale";

export function EmbedError({ messageKey }: { messageKey: TranslationKey }) {
  const { t } = useLocale();

  return (
    <main className="flex h-dvh min-h-[200px] w-full items-center justify-center bg-white p-6 text-center text-sm text-gray-500">
      {t(messageKey)}
    </main>
  );
}
