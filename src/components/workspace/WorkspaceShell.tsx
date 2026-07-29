"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  LayoutGrid,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";

/**
 * The frame every authenticated page sits in.
 *
 * A sidebar rather than the marketing `Navbar`, because the two are doing
 * opposite jobs: the marketing nav sells the product to someone who has not
 * bought it, and showing "Book a demo" to a signed-in customer is the detail
 * that makes software feel unfinished. This one is for moving around inside
 * something you already own.
 *
 * The brand carries over — mint, charcoal, the same rounded geometry — but the
 * density does not. Marketing pages breathe; a workspace should not make you
 * scroll to find the thing you came for.
 */

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  soon?: boolean;
};

const NAV: NavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutGrid },
  { href: "/app/documents", label: "Documents", icon: FileText },
  { href: "/app/ask", label: "Ask", icon: MessageSquareText },
];

export function WorkspaceShell({
  workspaceName,
  userEmail,
  children,
}: {
  workspaceName: string | null;
  userEmail: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Closed on click rather than by watching the path. A navigation that leaves
  // its own menu open has not navigated — but the cause is the click, and
  // reacting to the effect of the click instead is how you end up with state
  // that lags behind the thing that changed it.

  return (
    <div className="min-h-screen bg-[var(--color-soyl-gray-50)] lg:flex">
      {/* Mobile bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-soyl-gray-200)] bg-white px-4 lg:hidden">
        <Link href="/app" className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="font-semibold text-[var(--color-soyl-charcoal)]">
            {workspaceName ?? "SOYL"}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 text-[var(--color-soyl-gray-600)] transition-colors hover:bg-[var(--color-soyl-gray-100)]"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-16 z-20 overflow-hidden border-b border-[var(--color-soyl-gray-200)] bg-white lg:hidden"
          >
            <ul className="flex flex-col gap-1 p-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--color-soyl-gray-200)] p-4">
              <span className="truncate text-sm text-[var(--color-soyl-gray-600)]">
                {userEmail}
              </span>
              <SignOutButton />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-soyl-gray-200)] bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-soyl-gray-200)] px-5">
          <Image
            src="/images/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="truncate font-semibold text-[var(--color-soyl-charcoal)]">
            {workspaceName ?? "SOYL"}
          </span>
        </div>

        <nav className="flex-1 p-3">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-soyl-gray-200)] p-4">
          {userEmail && (
            <p className="mb-3 truncate text-xs text-[var(--color-soyl-gray-500)]">{userEmail}</p>
          )}
          <SignOutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  // Exact match for /app so it does not light up on every child route.
  const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <li>
        <span className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-soyl-gray-400)]">
          <Icon size={18} />
          {item.label}
          {/* Says what it is instead of pretending to be clickable. */}
          <span className="ml-auto rounded-full bg-[var(--color-soyl-gray-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Soon
          </span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={[
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          active
            ? "bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)]"
            : "text-[var(--color-soyl-gray-600)] hover:bg-[var(--color-soyl-gray-100)] hover:text-[var(--color-soyl-charcoal)]",
        ].join(" ")}
      >
        <Icon size={18} />
        {item.label}
      </Link>
    </li>
  );
}
