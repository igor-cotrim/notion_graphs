import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-10 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">notion-graphs</h1>
      <p className="text-zinc-600">
        Embeddable charts generated from Notion databases. Connect a database,
        filter rows, render a chart, and grab a signed embed URL to paste into
        Notion.
      </p>
      <Link
        href="/preview"
        className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Open preview →
      </Link>
      <ol className="list-inside list-decimal space-y-2 text-zinc-700">
        <li>Create a Notion integration and connect each monthly database to it.</li>
        <li>Open <code className="rounded bg-zinc-100 px-1">/preview</code> and paste a database ID.</li>
        <li>
          Pick a chart, filters, and click <strong>Generate embed URL</strong>.
        </li>
        <li>
          Paste the <em>URL</em> (not the iframe) into Notion → Create embed.
        </li>
      </ol>
      <p className="text-sm text-zinc-500">
        Notion can&rsquo;t load <code>localhost</code> URLs — deploy to Vercel
        first, then mint embed URLs against the public host.
      </p>
    </main>
  );
}
