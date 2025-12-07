import { Loader2 } from "lucide-react";

export default function ValidationStep() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Validating Your Photo
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          We're checking your photo against EU biometric passport requirements. This may take a few moments...
        </p>
      </div>
    </div>
  );
}

