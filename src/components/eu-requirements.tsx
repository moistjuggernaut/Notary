import { Baby, FileText, Users } from "lucide-react";
import { ChecklistItem } from "@/components/ui/checklist-item";
import { InfoCard } from "@/components/ui/info-card";
import { 
  requirementsSections, 
  childrenRequirements, 
  infantRequirements,
  regulationLinks 
} from "@/data/requirements";

export default function EURequirements() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-6 space-y-8">
          {/* Dynamic Requirement Sections */}
          {requirementsSections.map((section) => (
            <div key={section.id}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <ChecklistItem key={index}>{item}</ChecklistItem>
                ))}
              </div>
            </div>
          ))}

          {/* Children Under 10 */}
          <InfoCard variant="warning" icon={Users} title={childrenRequirements.title}>
            <p className="text-sm mb-4">{childrenRequirements.description}</p>
            <div className="space-y-2">
              {childrenRequirements.items.map((item, index) => (
                <ChecklistItem key={index} variant="amber" size="sm">{item}</ChecklistItem>
              ))}
            </div>
          </InfoCard>

          {/* Babies & Infants */}
          <InfoCard variant="success" icon={Baby} title={infantRequirements.title}>
            <p className="text-sm mb-4">{infantRequirements.description}</p>
            <div className="space-y-2">
              {infantRequirements.items.map((item, index) => (
                <ChecklistItem key={index} variant="emerald" size="sm">{item}</ChecklistItem>
              ))}
            </div>
          </InfoCard>

          {/* Disclaimer */}
          <InfoCard variant="info" icon={FileText} className="p-4">
            <p className="text-sm">
              <strong>Important:</strong> This tool validates photos based on{" "}
              <a 
                href={regulationLinks.eu2252.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-blue-600"
              >
                {regulationLinks.eu2252.label}
              </a>
              {" "}and{" "}
              <a 
                href={regulationLinks.eu444.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-blue-600"
              >
                {regulationLinks.eu444.label}
              </a>
              , along with{" "}
              <a 
                href={regulationLinks.icao9303.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-blue-600"
              >
                {regulationLinks.icao9303.label}
              </a>{" "}
              biometric standards that all EU member states follow.
              Final photo acceptance is determined by national passport issuing authorities.
            </p>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
