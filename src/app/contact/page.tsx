"use client";

import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, MapPin, Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { COMPANY } from "@/lib/constants";
import { HONEYPOT_FIELD, type ContactFieldError } from "@/lib/contact";
import { track } from "@/lib/analytics";

type SubmitError = {
  message: string;
  fallbackEmail: string;
  fields: ContactFieldError[];
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => ({}));

      // Success is only ever what the server says it is. This form used to
      // show "Message sent!" after a setTimeout and send nothing at all.
      if (response.ok && payload?.ok === true) {
        form.reset();
        setSubmitted(true);
        track("Contact Submitted");
        return;
      }

      // Recorded so a spike in failures is visible in the dashboard rather
      // than only in the server logs.
      track("Contact Failed", { reason: payload?.error ?? `http_${response.status}` });
      setError({
        message:
          payload?.message ??
          (payload?.error === "invalid"
            ? "Please check the highlighted fields."
            : "We could not send your message just now."),
        fallbackEmail: payload?.fallbackEmail ?? COMPANY.email,
        fields: Array.isArray(payload?.errors) ? payload.errors : [],
      });
    } catch {
      track("Contact Failed", { reason: "network" });
      setError({
        message: "We could not reach our server. Please check your connection and try again.",
        fallbackEmail: COMPANY.email,
        fields: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col pt-24 pb-16 bg-[var(--color-soyl-white)]">
      <Container size="lg">
        {/* HERO */}
        <section className="pt-16 pb-12 text-center max-w-3xl mx-auto">
          <Badge variant="primary" className="mb-6 mx-auto inline-flex">Pilot Waitlist</Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
            Join the ARIP Pilot
          </h1>
          <p className="text-lg text-[var(--color-soyl-gray-600)] leading-relaxed">
            We are currently onboarding early adopters for the Autonomous Revenue Intelligence Platform. Request access to see the digital workforce in action.
          </p>
        </section>

        <section className="py-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-[32px] border border-[var(--color-soyl-gray-200)] shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Form Side */}
            <div className="flex-1 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Request Waitlist Access</h2>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--color-soyl-mint-light)] rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-[var(--color-soyl-mint)] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-2">Message sent!</h3>
                  <p className="text-[var(--color-soyl-gray-600)]">
                    Thanks for reaching out. A member of our team will get back to you within 24 hours.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {error && (
                    <div
                      role="alert"
                      className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                    >
                      <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">{error.message}</p>
                        {error.fields.length > 0 && (
                          <ul className="mt-2 list-disc pl-5">
                            {error.fields.map((fieldError) => (
                              <li key={fieldError.field}>{fieldError.message}</li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-2">
                          You can also email us directly at{" "}
                          <a href={`mailto:${error.fallbackEmail}`} className="font-semibold underline">
                            {error.fallbackEmail}
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        maxLength={120}
                        className="h-12 px-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Work Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="email"
                        maxLength={200}
                        className="h-12 px-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all"
                        placeholder="john@hotel.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="company" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Hotel / Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      autoComplete="organization"
                      maxLength={160}
                      className="h-12 px-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all"
                      placeholder="The Grand Resort"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={5}
                      className="p-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all resize-none"
                      placeholder="Tell us a bit about your property..."
                    />
                  </div>

                  {/* Honeypot. Hidden from people and from screen readers; bots
                      fill it in and the server silently drops the submission. */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor={HONEYPOT_FIELD}>Do not fill this in</label>
                    <input
                      type="text"
                      id={HONEYPOT_FIELD}
                      name={HONEYPOT_FIELD}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <Button type="submit" size="lg" loading={isSubmitting} className="w-full md:w-auto self-start">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="md:w-80 bg-[var(--color-soyl-gray-50)] border-l border-[var(--color-soyl-gray-200)] p-8 md:p-12 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Pilot Program Details</h3>
                
                <div className="flex flex-col gap-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[var(--color-soyl-gray-200)] flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-[var(--color-soyl-mint-dark)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-soyl-charcoal)] mb-1">Email</p>
                      <a href="mailto:ryan.gomez@soyl.cloud" className="text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-mint-dark)] transition-colors">ryan.gomez@soyl.cloud</a>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[var(--color-soyl-gray-200)] flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-[var(--color-soyl-mint-dark)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-soyl-charcoal)] mb-1">Phone</p>
                      <a href="tel:+917022509965" className="text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-mint-dark)] transition-colors">+91 7022509965</a>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[var(--color-soyl-gray-200)] flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-[var(--color-soyl-mint-dark)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-soyl-charcoal)] mb-1">Office</p>
                      <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">
                        Bengaluru, Karnataka<br />
                        560043
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-[var(--color-soyl-gray-200)]">
                <p className="text-sm text-[var(--color-soyl-gray-500)] mb-4">
                  Questions about the ARIP Pilot?
                </p>
                <Button variant="outline" size="md" href="/pricing" className="w-full">
                  View Pricing Instead
                </Button>
              </div>
            </div>
            
          </div>
        </section>
      </Container>
    </main>
  );
}
