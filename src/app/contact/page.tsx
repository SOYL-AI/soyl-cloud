"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex flex-col pt-32 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            Whether you're looking to upgrade your property's tech stack or have questions about our products, our team is ready to help.
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-mint-light)] text-[var(--color-mint-dark)] rounded-2xl flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-charcoal)] mb-1">Email</h3>
                <p className="text-gray-600">hello@soyl-ai.com</p>
                <p className="text-gray-600">support@soyl-ai.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-mint-light)] text-[var(--color-mint-dark)] rounded-2xl flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-charcoal)] mb-1">Office</h3>
                <p className="text-gray-600">
                  SOYL AI Private Limited<br />
                  Tech Park Hub, Block C<br />
                  Bangalore, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-mint-light)] text-[var(--color-mint-dark)] rounded-2xl flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-charcoal)] mb-1">Phone</h3>
                <p className="text-gray-600">+91 800 555 0199</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[var(--color-light-grey)] rounded-3xl p-10 shadow-sm border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-[var(--color-charcoal)] mb-6">Send us a message</h3>
          <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Name</label>
                <input type="text" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all bg-white" placeholder="John Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input type="email" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all bg-white" placeholder="john@hotel.com" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Message</label>
              <textarea rows={5} className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all bg-white resize-none" placeholder="How can we help you?"></textarea>
            </div>

            <button className="mt-2 bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-black transition-all w-full">
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
