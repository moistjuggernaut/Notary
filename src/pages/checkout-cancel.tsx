import { PageLayout } from "@/components/layout";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutCancel() {
  return (
    <PageLayout maxWidth="4xl" showFooter={false}>
      <div className="bg-card border border-destructive/30 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-4">
          <XCircle className="w-6 h-6 text-destructive mt-0.5" />
          <h1 className="text-2xl font-semibold text-foreground">Order canceled</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Continue to review your photo and checkout when you're ready.
        </p>
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to validator
        </Link>
      </div>
    </PageLayout>
  );
}
