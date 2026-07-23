import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-24">
      <Container>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-8xl font-extrabold text-[var(--color-soyl-mint-dark)] mb-6">404</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
            Page not found
          </h1>
          <p className="text-lg text-[var(--color-soyl-gray-600)] mb-10 leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[var(--color-soyl-charcoal)] text-white font-semibold text-base hover:bg-[var(--color-soyl-charcoal)]/90 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Container>
    </section>
  );
}
