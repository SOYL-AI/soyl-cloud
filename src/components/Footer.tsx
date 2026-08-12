import Link from "next/link";
import Image from "next/image";
import { Container } from "./ui/Container";
import { COMPANY, NAVIGATION, LEGAL, SOCIAL, RESOURCES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-soyl-charcoal)] text-[var(--color-soyl-gray-400)] pt-20 pb-8 mt-auto border-t border-[var(--color-soyl-gray-900)]">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 opacity-90 hover:opacity-100 transition-opacity">
              <Image src="/images/logo.png" alt={`${COMPANY.name} Logo`} width={32} height={32} className="w-8 h-8 object-contain brightness-200" />
              <span className="font-bold text-lg text-white">{COMPANY.name}</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              The all-in-one hospitality platform. Automate operations, delight guests, and grow revenue with AI-powered concierges and management tools.
            </p>
            <p className="text-xs text-[var(--color-soyl-gray-500)]">
              Built in {COMPANY.address}
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h2 className="font-semibold text-white text-sm mb-5">Product</h2>
            <ul className="flex flex-col gap-3">
              {NAVIGATION.slice(0, 3).map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors flex items-center justify-between group">
                    {item.name}
                    {/* Was gray-400 on gray-900 at 50% opacity, which is unreadable.
                        The opacity did most of the damage: it composites the text
                        toward its background. Lighter text, full opacity, 10px. */}
                    {item.name === "SOYL Dine" && (
                      <span className="text-[10px] uppercase tracking-wider bg-[var(--color-soyl-gray-900)] text-[var(--color-soyl-gray-200)] px-1.5 py-0.5 rounded-sm">
                        Soon
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="font-semibold text-white text-sm mb-5">Company</h2>
            <ul className="flex flex-col gap-3">
              {NAVIGATION.slice(3).map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">{item.name}</Link>
                </li>
              ))}
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/contact" className="text-sm text-[var(--color-soyl-mint)] hover:text-white transition-colors font-medium">Join Pilot Waitlist</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-white text-sm mb-5">Legal</h2>
            <ul className="flex flex-col gap-3">
              {LEGAL.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-white text-sm mb-5">Resources</h2>
            <ul className="flex flex-col gap-3">
              {RESOURCES.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--color-soyl-gray-900)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--color-soyl-gray-500)]">
            © {new Date().getFullYear()} SOYL AI Private Limited. All rights reserved.
          </p>
          <div className="flex gap-6">
            {SOCIAL.map((item) => (
              <a 
                key={item.name} 
                href={item.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[var(--color-soyl-gray-500)] hover:text-white text-xs transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
