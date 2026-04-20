import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-10 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">notion-graphs</h1>
      <p className="text-zinc-600">
        Embeddable charts generated from your Notion databases. Connect a
        workspace, pick a database, choose how to slice it, and grab a signed
        embed URL to paste back into Notion.
      </p>

      {user ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/preview"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Open preview →
          </Link>
          <span className="text-sm text-zinc-500">
            Connected as{" "}
            <span className="font-medium text-zinc-700">
              {user.workspaceName ?? "your workspace"}
            </span>
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <a
          href="/api/auth/notion"
          className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Connect Notion →
        </a>
      )}

      <ol className="list-inside list-decimal space-y-2 text-zinc-700">
        <li>Authorize this app to read selected databases in your workspace.</li>
        <li>
          Open <code className="rounded bg-zinc-100 px-1">/preview</code>, paste
          a database ID, and shape the chart.
        </li>
        <li>
          Click <strong>Generate embed URL</strong>.
        </li>
        <li>
          Paste the <em>URL</em> (not the iframe) into Notion → Create embed.
        </li>
      </ol>
      <p className="text-sm text-zinc-500">
        Notion can&rsquo;t load <code>localhost</code> URLs — deploy first, then
        mint embed URLs against the public host.
      </p>
    </main>
  );
}
