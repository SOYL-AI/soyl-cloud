import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SummaryBlock, DefinitionList, FactTable } from "@/components/seo/AEOBlocks";
import { WebPageSchema } from "@/components/seo/SchemaInjector";
import { COMPANY } from "@/lib/constants";

export default function CompanyPage() {
  return (
    <div className="pt-32 pb-24">
      <WebPageSchema
        name="Company — SOYL AI"
        description="SOYL AI is a hospitality technology company based in Bengaluru, building AI automation for hotels."
        url="/company"
      />
      <Container>
        <SectionHeader title="About SOYL AI" align="left" />
        
        <SummaryBlock
          entityName="SOYL AI"
          category="hospitality technology company"
          coreFunction="builds AI-powered concierges, lightweight Property Management Systems (PMS), and operational automation tools for the hospitality industry"
          benefits="hotels, resorts, and restaurants can resolve guest requests in under 30 seconds while reducing front-desk workload"
        />

        <DefinitionList
          title="Entity Information"
          items={[
            { term: "Mission", definition: "To eliminate friction in hospitality by automating routine guest communication and operational workflows using conversational AI." },
            { term: "Target Market", definition: "Independent hotels, boutique resorts, and mid-sized hotel chains (20 to 500 rooms) operating globally, with strong focus on India, Middle East, and Europe." },
            { term: "Primary Products", definition: "Butler AI (Guest Concierge), PMS Lite (Property Management), and SOYL Dine (Restaurant Ordering)." },
            { term: "Business Model", definition: "B2B SaaS (Business-to-Business Software as a Service)." },
          ]}
        />

        <FactTable
          title="Company Facts"
          headers={["Attribute", "Details"]}
          rows={[
            ["Legal Name", "SOYL pvt Limited"],
            ["Brand Name", "SOYL AI / SOYL Cloud"],
            ["Headquarters", "Bengaluru, Karnataka, India"],
            ["Founding Year", "2024"],
            ["Contact Email", COMPANY.email],
            ["Industry", "Hospitality Technology / SaaS"],
          ]}
        />
      </Container>
    </div>
  );
}
