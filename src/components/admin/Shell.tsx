import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The admin frame.
 *
 * `UPDATE.md` §11: "Ugly is fine. Useful is mandatory." Taken literally — this
 * is dense, monochrome and has no animation, because the screens it holds are
 * read by one person looking for one number. It deliberately does not reuse
 * `WorkspaceShell`: that one is a product surface with brand and breathing
 * room, and making it serve both would push a `variant` prop through a
 * component that customers see.
 *
 * A server component. Nothing here is interactive, so nothing here needs to be
 * in a bundle.
 */

const NAV = [
  { href: "/admin", label: "Tenants" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/cost", label: "Cost" },
];

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#1C1C1C]">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            SOYL admin
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-neutral-600 underline-offset-4 hover:text-[#1C1C1C] hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/app"
            className="ml-auto text-sm text-neutral-500 underline-offset-4 hover:underline"
          >
            Back to the app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

/** A table that scrolls inside itself rather than making the page scroll sideways. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-neutral-200">
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

/** `children` is optional so a header cell over an actions column can be blank. */
export function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return (
    <th
      className={`border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-medium text-neutral-600 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  right,
  muted,
}: {
  children: ReactNode;
  right?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={`border-b border-neutral-100 px-3 py-2 align-top ${right ? "text-right tabular-nums" : ""} ${
        muted ? "text-neutral-500" : ""
      }`}
    >
      {children}
    </td>
  );
}

/**
 * A turn's status, coloured.
 *
 * `no_evidence` is deliberately not red. An honest "I don't have that" is the
 * system working — §12 makes it an acceptance criterion — and colouring it as
 * a failure would train whoever reads this screen to treat the correct
 * behaviour as a bug to fix.
 */
export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "complete"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "failed"
        ? "bg-red-50 text-red-700 ring-red-200"
        : status === "running"
          ? "bg-blue-50 text-blue-700 ring-blue-200"
          : "bg-amber-50 text-amber-800 ring-amber-200";

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs ring-1 ring-inset ${tone}`}>
      {status}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
