import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CheckoutCancel from "@/pages/checkout-cancel";
import CheckoutSuccess from "@/pages/checkout-success";
import Home from "@/pages/home";
import Validate from "@/pages/validate";
import HowItWorks from "@/pages/how-it-works";
import Requirements from "@/pages/requirements";
import ValidatePassportPhoto from "@/pages/validate-passport-photo";
import ValidateDriverLicensePhoto from "@/pages/validate-driver-license-photo";
import OrderPassportPhoto from "@/pages/order-passport-photo";
import OrderDriverLicensePhoto from "@/pages/order-driver-license-photo";
import PassportPhotoRequirementsPage from "@/pages/passport-photo-requirements";
import DriverLicensePhotoRequirementsPage from "@/pages/driver-license-photo-requirements";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/validate" component={Validate} />
          <Route path="/validate-passport-photo" component={ValidatePassportPhoto} />
          <Route path="/validate-driver-license-photo" component={ValidateDriverLicensePhoto} />
          <Route path="/order-passport-photo" component={OrderPassportPhoto} />
          <Route path="/order-driver-license-photo" component={OrderDriverLicensePhoto} />
          <Route path="/passport-photo-requirements" component={PassportPhotoRequirementsPage} />
          <Route path="/driver-license-photo-requirements" component={DriverLicensePhotoRequirementsPage} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/requirements" component={Requirements} />
          <Route path="/admin" component={Admin} />
          <Route path="/checkout/cancel" component={CheckoutCancel} />
          <Route path="/checkout/success" component={CheckoutSuccess} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
