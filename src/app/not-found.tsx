import Link from "next/link";

export default function NotFound() {
  return <main className="main-content">
    <h1>Page not found</h1>
    <p>This page may have moved, or the address may be incorrect.</p>
    <Link className="button primary" href="/clinic">Return to workspace</Link>
  </main>;
}
