import Header from "@/components/header";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-lg p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-4">
            <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <h1 className="text-2xl font-semibold text-gray-900">Order canceled</h1>
          </div>
          <p className="text-gray-700 mb-6">
            Continue to review your photo and checkout when you're ready.
          </p>
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to validator
          </Link>
        </div>
      </main>
    </div>
  );
} 