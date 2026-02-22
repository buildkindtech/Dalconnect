import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Basic listing for your business.",
      features: [
        "Basic contact information",
        "Address & Map pin",
        "Business category",
        "Receive community reviews"
      ],
      buttonText: "Claim Free Listing",
      variant: "outline" as const
    },
    {
      name: "Premium",
      price: "$49",
      period: "/month",
      description: "Enhanced visibility and control.",
      features: [
        "Everything in Free",
        "Add business hours",
        "Upload up to 10 photos",
        "Link to website & social media",
        "Respond to reviews",
        "Priority in search results"
      ],
      buttonText: "Upgrade to Premium",
      variant: "default" as const,
      popular: true
    },
    {
      name: "Elite",
      price: "$99",
      period: "/month",
      description: "Maximum exposure and features.",
      features: [
        "Everything in Premium",
        "Featured badge on listing",
        "Displayed in 'Featured' carousel",
        "Unlimited photo uploads",
        "Remove competitor ads on your page",
        "Detailed analytics dashboard"
      ],
      buttonText: "Get Elite Access",
      variant: "outline" as const
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-ko tracking-tight">Grow Your Business With Us</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Reach thousands of local Korean-American residents in the Dallas-Fort Worth area. Choose the plan that fits your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <Card key={index} className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border shadow-sm mt-4 md:mt-0'}`}>
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase shadow-sm">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold font-ko mb-2">{tier.name}</CardTitle>
                <CardDescription className="text-base h-10">{tier.description}</CardDescription>
                <div className="mt-6 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground ml-1 font-medium">{tier.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-3 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8 pb-8">
                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  variant={tier.variant}
                >
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 font-ko">Have questions?</h3>
          <p className="text-muted-foreground mb-6">Contact our support team for custom advertising packages or bulk listing discounts.</p>
          <Button variant="link" className="text-primary text-lg">Contact Sales</Button>
        </div>
      </div>
    </div>
  );
}