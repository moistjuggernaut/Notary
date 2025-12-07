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
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/validate" component={Validate} />
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
