"use client";

import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SummaryBlock, DefinitionList, FactTable } from "@/components/seo/AEOBlocks";
import { ProductSchema, FAQSchema } from "@/components/seo/SchemaInjector";

export default function SoylDine() {
  return (
    <div className="pt-32 pb-24">
      <ProductSchema
        name="SOYL Dine"
        description="A complete digital restaurant management system including QR ordering, kitchen display systems, and inventory tracking."
        category="RestaurantManagementSystem"
      />
      
      <Container>
        <SectionHeader title="SOYL Dine (Coming Soon)" align="left" />
        
        <SummaryBlock
          entityName="SOYL Dine"
          category="restaurant management system"
          coreFunction="provides digital QR ordering, kitchen display systems, and real-time inventory tracking"
          benefits="fine dining, quick service, and cloud kitchens can digitize operations, reduce order friction, and optimize table turnover"
        />

        <DefinitionList
          title="Core Capabilities"
          items={[
            { term: "QR Ordering", definition: "Guests scan a table QR code to browse the menu, place orders, and pay directly from their smartphone without downloading an app." },
            { term: "Kitchen Display System (KDS)", definition: "Digital screens in the kitchen receive orders instantly, replacing paper tickets and syncing prep times across stations." },
            { term: "Inventory Tracking", definition: "Ingredients are deducted automatically as orders are placed, preventing stockouts and reducing waste." },
            { term: "Table Management", definition: "Hosts use a visual floor plan to track real-time table status and optimize turn times." },
          ]}
        />

        <FactTable
          title="Designed For"
          headers={["Restaurant Type", "Primary Benefit"]}
          rows={[
            ["Fine Dining", "Elegant digital menus with high-resolution imagery and pairing suggestions."],
            ["Quick Service (QSR)", "High-volume speed optimization and instant kitchen ticket routing."],
            ["Cloud Kitchens", "Multi-brand management with separate digital menus but unified analytics."],
            ["Hotel Restaurants", "Direct integration with guest profiles for seamless room billing."],
          ]}
        />

        <div className="my-16">
          <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Frequently Asked Questions</h3>
          <dl className="space-y-6">
            <div>
              <dt className="font-bold text-[var(--color-soyl-charcoal)] text-lg mb-2">What is SOYL Dine?</dt>
              <dd className="text-[var(--color-soyl-gray-600)]">SOYL Dine is a comprehensive digital restaurant management system that digitizes the entire dining experience from ordering to kitchen fulfillment.</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--color-soyl-charcoal)] text-lg mb-2">Do guests need to download an app?</dt>
              <dd className="text-[var(--color-soyl-gray-600)]">No, SOYL Dine uses app-less QR ordering. Guests scan a code with their native smartphone camera to access the full menu.</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--color-soyl-charcoal)] text-lg mb-2">When will SOYL Dine be available?</dt>
              <dd className="text-[var(--color-soyl-gray-600)]">SOYL Dine is currently scheduled for release in Q4 2026.</dd>
            </div>
          </dl>
          <FAQSchema
            faqs={[
              { question: "What is SOYL Dine?", answer: "SOYL Dine is a comprehensive digital restaurant management system that digitizes the entire dining experience from ordering to kitchen fulfillment." },
              { question: "Do guests need to download an app?", answer: "No, SOYL Dine uses app-less QR ordering. Guests scan a code with their native smartphone camera to access the full menu." },
              { question: "When will SOYL Dine be available?", answer: "SOYL Dine is currently scheduled for release in Q4 2026." },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
