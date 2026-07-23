"use client";

import {
  SummaryBlock,
  DefinitionList,
  FactTable,
} from "@/components/seo/AEOBlocks";
import {
  ProductSchema,
  FAQSchema,
} from "@/components/seo/SchemaInjector";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function PmsLitePage() {
  const pmsFeatures = [
    {
      term: "Reservation Management",
      definition:
        "Centralized system tracking real-time status (checked in, cancelled, pending), guest profiles, and booking history with advanced filtering.",
    },
    {
      term: "Room Inventory Control",
      definition:
        "Visual grid tracking housekeeping statuses, room assignments, and availability across different room types.",
    },
    {
      term: "Operational Analytics",
      definition:
        "Automated reporting for key metrics including Occupancy Rate, Average Daily Rate (ADR), and Revenue Per Available Room (RevPAR).",
    },
    {
      term: "Billing and Invoicing",
      definition:
        "Integrated payment tracking, expense management, and automated invoice generation.",
    },
    {
      term: "Channel Integration",
      definition:
        "Optional sync capability with 100+ OTAs including Booking.com, Expedia, and Airbnb to prevent double-booking.",
    },
  ];

  const pmsSpecsHeaders = ["Specification", "Detail"];
  const pmsSpecsRows = [
    ["Deployment", "Cloud-based SaaS"],
    ["Target Audience", "Independent hotels, motels, and boutique properties"],
    ["Primary Function", "Property Management System (PMS)"],
    ["Key Integrations", "Booking.com, Expedia, Airbnb, Agoda, MakeMyTrip"],
    ["Reporting Export", "PDF, CSV formats supported"],
  ];

  const faqs = [
    {
      question: "What is PMS Lite?",
      answer: "PMS Lite is a cloud-based Property Management System (PMS) designed for independent hotels to manage reservations, room inventory, billing, and operational analytics from a single interface."
    },
    {
      question: "Who is PMS Lite for?",
      answer: "PMS Lite is built specifically for independent hotels, motels, bed and breakfasts, and boutique properties that require core property management features without the complexity of enterprise systems."
    },
    {
      question: "How does PMS Lite work?",
      answer: "It operates as a centralized web application where staff can input and track bookings, update room statuses, generate invoices, and view real-time performance metrics. It can also optionally sync inventory with Online Travel Agencies (OTAs) via a Channel Manager."
    },
    {
      question: "Why does PMS Lite matter for hoteliers?",
      answer: "It eliminates manual data entry and spreadsheet-based tracking, reducing the risk of overbookings and administrative errors while providing clear visibility into daily occupancy and revenue."
    }
  ];

  return (
    <div className="flex flex-col pb-24 bg-white">
      <StickyCTA title="PMS Lite — Property Management" />
      
      <ProductSchema 
        name="PMS Lite" 
        description="A cloud-based Property Management System for independent hotels to manage bookings, rooms, and billing." 
        category="SoftwareApplication" 
      />
      <FAQSchema faqs={faqs} />

      <Container className="pt-32">
        <SectionHeader title="PMS Lite Overview" align="left" />
        
        <SummaryBlock
          entityName="PMS Lite"
          category="property management system"
          coreFunction="centralizes reservation management, room inventory tracking, billing, and reporting for independent hospitality properties"
          benefits="hoteliers can replace manual spreadsheet tracking with a unified dashboard for daily operations"
        />

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Key Specifications</h2>
          <FactTable headers={pmsSpecsHeaders} rows={pmsSpecsRows} />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Core Features</h2>
          <DefinitionList items={pmsFeatures} />
        </div>

        <div className="mt-16 mb-24">
          <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[var(--color-soyl-gray-50)] p-6 rounded-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-[var(--color-soyl-charcoal)] mb-2">{faq.question}</h3>
                <p className="text-[var(--color-soyl-gray-600)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <FinalCTA />
    </div>
  );
}
