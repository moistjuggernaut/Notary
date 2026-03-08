import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";

type IntentFaq = {
  question: string;
  answer: string;
};

type IntentLink = {
  href: string;
  label: string;
};

type IntentLandingPageProps = {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  heading: string;
  intro: string;
  supportNote?: string;
  primaryCta: IntentLink;
  secondaryCta?: IntentLink;
  benefits: string[];
  steps: string[];
  faqs: IntentFaq[];
  relatedLinks: IntentLink[];
};

export default function IntentLandingPage({
  title,
  description,
  canonicalPath,
  eyebrow,
  heading,
  intro,
  supportNote,
  primaryCta,
  secondaryCta,
  benefits,
  steps,
  faqs,
  relatedLinks,
}: IntentLandingPageProps) {
  usePageMeta({
    title,
    description,
    canonicalPath,
  });

  return (
    <PageLayout maxWidth="4xl">
      <section className="text-center py-4 sm:py-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary mb-3">
          {eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          {heading}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
          {intro}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryCta.href}>
              {primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          {secondaryCta ? (
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
        {supportNote ? (
          <p className="text-sm text-muted-foreground mt-4">{supportNote}</p>
        ) : null}
      </section>

      <section className="py-6 sm:py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-lg border border-border bg-card p-5">
              <CheckCircle2 className="w-5 h-5 text-primary mb-3" />
              <p className="text-sm text-foreground leading-relaxed">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <InfoCard variant="info" title="How It Works">
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="rounded-lg bg-background/70 border border-border px-4 py-4 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                  Step {index + 1}
                </span>
                <span className="text-foreground leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </InfoCard>
      </section>

      <section className="py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3">
          Common Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-4">Related Pages</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {relatedLinks.map((link) => (
            <Button key={link.href} asChild variant="outline">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
