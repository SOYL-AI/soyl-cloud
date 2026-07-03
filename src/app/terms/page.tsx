"use client";

import { Container } from "@/components/ui/Container";

export default function TermsOfService() {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg text-[var(--color-soyl-gray-600)]">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing our website and using SOYL AI services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on SOYL AI's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on SOYL AI's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">3. Disclaimer</h2>
            <p className="mb-4">
              The materials on SOYL AI's website are provided on an 'as is' basis. SOYL AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">4. Limitations</h2>
            <p className="mb-4">
              In no event shall SOYL AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SOYL AI's website, even if SOYL AI or a SOYL AI authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">5. Contact Information</h2>
            <p className="mb-4">
              Questions about the Terms of Service should be sent to us at hello@soylai.com.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
