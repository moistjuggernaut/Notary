import { Globe, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ICAOCountries() {
  const [isEuropeExpanded, setIsEuropeExpanded] = useState(false);
  const [isAmericaExpanded, setIsAmericaExpanded] = useState(false);

  const europeanCountries = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
    "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Liechtenstein",
    "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", 
    "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", 
    "Switzerland", "United Kingdom"
  ];

  const americanCountries = [
    "United States", "Canada", "Mexico", "Argentina", "Brazil", "Chile",
    "Colombia", "Peru", "Uruguay", "Costa Rica", "Panama", "Guatemala",
    "Honduras", "Nicaragua", "El Salvador", "Belize", "Jamaica", "Trinidad and Tobago",
    "Barbados", "Dominican Republic", "Ecuador", "Venezuela", "Bolivia",
    "Paraguay", "Guyana", "Suriname"
  ];

  return (
    <section className="mb-16">
      <div className="bg-white rounded-lg p-10 border border-gray-100 shadow-sm">
        <div className="flex items-start mb-8">
          <Globe className="w-6 h-6 text-official-blue mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-2xl font-semibold text-dark-slate mb-4">Countries Requiring ICAO Compliance</h3>
            <p className="text-lg text-slate-grey leading-relaxed mb-6">
              ICAO standards are required by countries worldwide for passport photos. 
              If you're applying for a passport from any of these countries, 
              your baby's photo must comply with ICAO requirements:
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* European Countries */}
          <div>
            <button
              onClick={() => setIsEuropeExpanded(!isEuropeExpanded)}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-semibold text-dark-slate">European Countries</h4>
                <span className="text-sm text-slate-grey">({europeanCountries.length} countries)</span>
              </div>
              {isEuropeExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-grey" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-grey" />
              )}
            </button>
            
            {isEuropeExpanded && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {europeanCountries.map((country, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success-emerald flex-shrink-0" />
                    <span className="text-sm text-dark-slate font-medium">{country}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* American Countries */}
          <div>
            <button
              onClick={() => setIsAmericaExpanded(!isAmericaExpanded)}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-semibold text-dark-slate">American Countries</h4>
                <span className="text-sm text-slate-grey">({americanCountries.length} countries)</span>
              </div>
              {isAmericaExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-grey" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-grey" />
              )}
            </button>
            
            {isAmericaExpanded && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {americanCountries.map((country, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success-emerald flex-shrink-0" />
                    <span className="text-sm text-dark-slate font-medium">{country}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This list includes major countries in Europe and the Americas that follow ICAO Document 9303 standards. 
            Most countries worldwide have adopted ICAO standards for machine-readable travel documents. 
            Always verify current requirements with your local passport office.
          </p>
        </div>
      </div>
    </section>
  );
}