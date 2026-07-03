"use client";

import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MapPin, Calendar, Heart, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const values = [
  {
    icon: <Zap className="text-[var(--color-soyl-mint-dark)]" size={24} />,
    title: "Ship fast, iterate faster",
    description: "We don't do endless planning cycles. We build, ship, learn, and improve."
  },
  {
    icon: <Heart className="text-[var(--color-soyl-mint-dark)]" size={24} />,
    title: "Guest-obsessed",
    description: "Every decision is weighed against how it improves the guest's experience at the property."
  },
  {
    icon: <Shield className="text-[var(--color-soyl-mint-dark)]" size={24} />,
    title: "Enterprise reliability",
    description: "Hotels never sleep. Neither does our infrastructure. We build for 99.99% uptime."
  }
];

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col pt-24 pb-16 bg-[var(--color-soyl-white)]">
      <Container size="lg">
        {/* HERO */}
        <section className="pt-16 pb-12 md:pt-24 text-center">
          <Badge variant="primary" className="mb-6 mx-auto inline-flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-soyl-mint)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-soyl-mint-dark)]"></span>
            </span>
            Built in India
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
            We build voice AI<br />for hospitality.
          </h1>
          <p className="text-xl text-[var(--color-soyl-gray-600)] max-w-2xl mx-auto leading-relaxed mb-12">
            Founded in 2026 by engineers who'd rather ship than talk. We're on a mission to bring next-generation AI to every hotel, resort, and serviced apartment.
          </p>
          <div className="flex justify-center gap-6 text-[var(--color-soyl-gray-500)] font-medium text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={18} /> Founded Feb 2026
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} /> Bengaluru, India
            </div>
          </div>
        </section>

        {/* TEAM PHOTO */}
        <section className="py-12">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            variants={fadeUp} 
            viewport={{ once: true }}
            className="rounded-[32px] overflow-hidden shadow-2xl relative aspect-video"
          >
            <Image
              src="/images/about_team.png"
              alt="SOYL AI Team in Bengaluru"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </section>

        {/* STORY */}
        <section className="py-24 max-w-3xl mx-auto">
          <div className="prose prose-lg text-[var(--color-soyl-gray-600)] leading-relaxed">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Our Story</h2>
            <p className="mb-6">
              When we looked at the hospitality industry, we saw a massive gap. Hotels were struggling with high staff turnover, rising guest expectations, and legacy software that looked like it was built in the 1990s.
            </p>
            <p className="mb-6">
              Guest experience shouldn't be gated behind clunky app downloads or long queues at the front desk. Staff shouldn't spend their shifts picking up the phone to answer the same three questions.
            </p>
            <p className="mb-6">
              We built SOYL Cloud to change this. By combining cutting-edge voice AI models with intuitive, lightning-fast interfaces, we've created a platform that feels like magic to guests and acts like a superpower for staff.
            </p>
            <p>
              We're a small, intense team based in Bengaluru, and we're just getting started.
            </p>
          </div>
        </section>

        {/* VALUES */}
        <section className="py-24 border-t border-[var(--color-soyl-gray-200)]">
          <SectionHeader title="Our Values" align="center" className="mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <motion.div 
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white p-8 rounded-3xl border border-[var(--color-soyl-gray-200)] shadow-sm"
              >
                <div className="w-12 h-12 bg-[var(--color-soyl-mint-light)] rounded-xl flex items-center justify-center mb-6">
                  {val.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-3">{val.title}</h3>
                <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">
                  {val.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="bg-[var(--color-soyl-charcoal)] rounded-[32px] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--gradient-mint)] opacity-10" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Join the revolution.</h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Whether you're a hotel owner looking to upgrade your guest experience, or an engineer wanting to build the future of hospitality AI.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" size="lg" href="/book-demo" className="bg-[var(--color-soyl-mint)] text-[var(--color-soyl-charcoal)] hover:bg-[var(--color-soyl-mint-light)]">
                  Book a Demo
                </Button>
                <Button variant="outline" size="lg" href="/contact" className="bg-transparent border-gray-600 text-white hover:bg-white/10 hover:text-white">
                  Join the Team
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
