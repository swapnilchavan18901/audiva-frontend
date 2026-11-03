"use client";

import { ErrorNotice } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="main-content" aria-label="Page error">
    <ErrorNotice text="This page could not be loaded. Try again, or return to your workspace." />
    <button className="button primary" onClick={reset}>Try again</button>
    <a className="button secondary" href="/clinic">Return to workspace</a>
  </section>;
}
