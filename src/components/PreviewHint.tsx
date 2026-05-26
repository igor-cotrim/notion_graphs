"use client";

import { useLocale } from "@/hooks/useLocale";

type Props =
  | { variant: "no-db" }
  | { variant: "error"; errorMessage: string }
  | { variant: "empty" };

export function PreviewHint(props: Props) {
  const { t } = useLocale();

  let text: React.ReactNode;

  if (props.variant === "no-db") {
    text = t("preview.hintNoDb");
  } else if (props.variant === "error") {
    text = (
      <>
        {t("preview.hintFailed")} {props.errorMessage}
        <br />
        {t("preview.hintFailedSub")}
      </>
    );
  } else {
    text = t("preview.hintEmpty");
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <p
        className={`max-w-sm text-center text-sm leading-relaxed ${
          props.variant === "error" ? "text-red-500" : "text-zinc-400"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
