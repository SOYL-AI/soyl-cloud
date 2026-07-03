"use client";

import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission for MVP
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col pt-24 pb-16 bg-[var(--color-soyl-white)]">
      <Container size="lg">
        {/* HERO */}
        <section className="pt-16 pb-12 text-center max-w-3xl mx-auto">
          <Badge variant="primary" className="mb-6 mx-auto inline-flex">Contact Us</Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
            Get in touch
          </h1>
          <p className="text-lg text-[var(--color-soyl-gray-600)] leading-relaxed">
            Have questions about SOYL Cloud? Want to explore an enterprise deployment? Our team is ready to help you transform your property.
          </p>
        </section>

        <section className="py-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-[32px] border border-[var(--color-soyl-gray-200)] shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Form Side */}
            <div className="flex-1 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Send us a message</h2>
              
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        required
                        className="h-12 px-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Work Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        required
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
                      required
                      className="h-12 px-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all"
                      placeholder="The Grand Resort"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Message</label>
                    <textarea 
                      id="message" 
                      required
                      rows={5}
                      className="p-4 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)] focus:border-transparent transition-all resize-none"
                      placeholder="How can we help you?"
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
                <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-8">Contact Information</h3>
                
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
                  Prefer a live demo instead of a message?
                </p>
                <Button variant="outline" size="md" href="/book-demo" className="w-full">
                  Book a Demo
                </Button>
              </div>
            </div>
            
          </div>
        </section>
      </Container>
    </main>
  );
}
