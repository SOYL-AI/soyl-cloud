import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SummaryBlock, DefinitionList, FactTable } from "@/components/seo/AEOBlocks";
import { WebPageSchema } from "@/components/seo/SchemaInjector";

export default function SecurityPage() {
  return (
    <div className="pt-32 pb-24">
      <WebPageSchema
        name="Security & Compliance — SOYL Cloud"
        description="Enterprise-grade security, GDPR compliance, and end-to-end encryption for hotel guest data."
        url="/security"
      />
      <Container>
        <SectionHeader as="h1" title="Security & Compliance" align="left" />
        
        <SummaryBlock
          entityName="SOYL Cloud Security Architecture"
          category="data protection framework"
          coreFunction="protects hotel and guest data using AES-256 encryption, role-based access control, and GDPR-compliant processing"
          benefits="hotels can automate operations without compromising privacy or regulatory compliance"
        />

        <DefinitionList
          title="Core Security Principles"
          items={[
            { term: "Data Encryption", definition: "All guest data and operational records are encrypted at rest using AES-256 and in transit using TLS 1.3." },
            { term: "GDPR Compliance", definition: "SOYL Cloud provides built-in tools for data anonymization, right-to-be-forgotten requests, and explicit guest consent tracking." },
            { term: "Access Control", definition: "Role-Based Access Control (RBAC) ensures staff members only access information strictly necessary for their specific department." },
            { term: "Data Residency", definition: "Hotels can choose data residency regions (EU, US, Asia) to comply with local data localization laws." },
          ]}
        />

        <FactTable
          title="Infrastructure Facts"
          headers={["Component", "Standard / Implementation"]}
          rows={[
            ["Cloud Provider", "Amazon Web Services (AWS)"],
            ["Database Encryption", "AES-256"],
            ["Transport Security", "TLS 1.3 / HTTPS"],
            ["Backup Frequency", "Continuous (Point-in-time recovery)"],
            ["Authentication", "OAuth 2.0 / JWT"],
          ]}
        />
      </Container>
    </div>
  );
}
