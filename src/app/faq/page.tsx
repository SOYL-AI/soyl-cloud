import { faqData } from '@/lib/faq-data';
import { FAQSchema } from '@/components/seo/SchemaInjector';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function FAQPage() {
  const allFaqs = faqData.flatMap((category) => category.faqs);

  return (
    <main className="py-16 md:py-24">
      <FAQSchema faqs={allFaqs} />
      
      <Container>
        <SectionHeader 
          title="Frequently Asked Questions" 
          description="Everything you need to know about SOYL Cloud, Butler AI, and our PMS Lite hospitality platform."
        />
        
        <div className="mt-16 max-w-4xl mx-auto space-y-16">
          {faqData.map((category) => (
            <section 
              key={category.category} 
              id={category.category.toLowerCase().replace(/\s+/g, '-')}
              className="scroll-mt-24"
            >
              <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
                {category.category}
              </h2>
              <div className="space-y-8">
                {category.faqs.map((faq) => (
                  <div key={faq.question} className="group">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
