"use client";

import { Container } from "@/components/ui/Container";

export default function PrivacyPolicy() {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg text-[var(--color-soyl-gray-600)]">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">
              At SOYL AI, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you 
              visit our website and tell you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">2. The Data We Collect</h2>
            <p className="mb-4">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">3. How We Use Your Data</h2>
            <p className="mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">4. Analytics</h2>
            <p className="mb-4">
              We use <a href="https://plausible.io/privacy-focused-web-analytics" className="underline hover:text-[var(--color-soyl-mint-dark)]" rel="noopener noreferrer" target="_blank">Plausible Analytics</a> to understand how this website is used. Plausible sets no cookies, does not track you across websites, and collects no personal data — page views and referrers are recorded in aggregate and cannot be traced back to an individual visitor. That is why you have not been asked to accept cookies.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">5. Data Security</h2>
            <p className="mb-4">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mt-8 mb-4">6. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              Email: ryan.gomez@soyl.cloud
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
