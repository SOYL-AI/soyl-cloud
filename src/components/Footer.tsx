import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-charcoal)] text-gray-400 pt-20 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6">
              <Image src="/images/logo.png" alt="SOYL AI Logo" width={32} height={32} className="w-8 h-8 object-contain brightness-200" />
              <span className="font-bold text-lg text-white">SOYL AI</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              The all-in-one hospitality platform. Automate operations, delight guests, and grow revenue.
            </p>
            <p className="text-xs text-gray-500">
              A product by SOYL AI Private Limited
            </p>
          </div>
          
          {/* Products */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5">Products</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/butler-ai" className="text-sm hover:text-white transition-colors">Butler AI</Link></li>
              <li><Link href="/pms-lite" className="text-sm hover:text-white transition-colors">PMS Lite</Link></li>
              <li><Link href="/soyl-dine" className="text-sm hover:text-white transition-colors">SOYL Dine</Link></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5">Company</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/book-demo" className="text-sm hover:text-white transition-colors">Book Demo</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-5">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} SOYL AI Private Limited. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="https://twitter.com" className="text-gray-500 hover:text-white text-xs transition-colors">Twitter</Link>
            <Link href="https://linkedin.com" className="text-gray-500 hover:text-white text-xs transition-colors">LinkedIn</Link>
            <Link href="https://instagram.com" className="text-gray-500 hover:text-white text-xs transition-colors">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
