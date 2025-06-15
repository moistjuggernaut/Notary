import { CheckCircle, AlertTriangle, XCircle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ValidationResult } from "@/types/validation";

interface ValidationResultsProps {
  result: ValidationResult;
  onValidateAnother: () => void;
}

export default function ValidationResults({ result, onValidateAnother }: ValidationResultsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-success-emerald" />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" />;
      case 'fail':
        return <XCircle className="text-red-500" />;
      default:
        return <CheckCircle className="text-success-emerald" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getOverallStatusMessage = () => {
    switch (result.status) {
      case 'success':
        return {
          icon: <CheckCircle className="text-success-emerald text-2xl" />,
          title: 'Photo Meets ICAO Standards',
          description: 'Your child\'s photo is ready for passport application.',
          bgColor: 'bg-green-50 border-l-4 border-success-emerald'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-yellow-500 text-2xl" />,
          title: 'Minor Issues Detected',
          description: 'Your photo may be acceptable, but consider the recommendations below.',
          bgColor: 'bg-yellow-50 border-l-4 border-yellow-400'
        };
      case 'error':
        return {
          icon: <XCircle className="text-red-500 text-2xl" />,
          title: 'Photo Does Not Meet ICAO Standards',
          description: 'Please address the issues below and upload a new photo.',
          bgColor: 'bg-red-50 border-l-4 border-red-400'
        };
      default:
        return {
          icon: <CheckCircle className="text-success-emerald text-2xl" />,
          title: 'Validation Complete',
          description: 'Review the results below.',
          bgColor: 'bg-gray-50 border-l-4 border-gray-400'
        };
    }
  };

  const statusMessage = getOverallStatusMessage();

  return (
    <section className="mb-16">
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10">
        <h3 className="text-2xl font-semibold text-dark-slate mb-8">Validation Results</h3>
        
        {/* Overall Status */}
        <div className={`flex items-center p-4 rounded-lg mb-6 ${statusMessage.bgColor}`}>
          {statusMessage.icon}
          <div className="ml-4">
            <h4 className="font-semibold text-dark-slate">{statusMessage.title}</h4>
            <p className="text-sm text-slate-grey mt-1">{statusMessage.description}</p>
          </div>
          <div className="ml-auto">
            <span className="text-2xl font-bold text-dark-slate">{result.score}%</span>
          </div>
        </div>

        {/* Detailed Checks */}
        <div className="space-y-4 mb-6">
          {result.checks.map((check, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(check.status)}`}>
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <div>
                  <h4 className="font-medium text-dark-slate">{check.name}</h4>
                  <p className="text-sm text-slate-grey">{check.description}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-dark-slate">{check.score}%</span>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-blue-700 flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Processed Image */}
        {result.processedImage && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-dark-slate mb-3">Processed Image</h4>
            <div className="flex justify-center">
              <img 
                src={`data:image/jpeg;base64,${result.processedImage}`}
                alt="Processed passport photo"
                className="max-w-full max-h-96 rounded-lg shadow-sm border border-gray-200"
              />
            </div>
            <p className="text-sm text-slate-grey mt-2 text-center">
              This is how your photo was processed and analyzed by the system.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 bg-official-blue hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Validation Report
          </Button>
          <Button 
            variant="outline" 
            onClick={onValidateAnother}
            className="sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Validate Another Photo
          </Button>
        </div>
      </div>
    </section>
  );
}
