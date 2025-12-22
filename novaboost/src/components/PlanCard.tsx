import { Plan, planPricing, planDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Monitor, Smartphone, Clock } from "lucide-react";

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
  onSelect: (plan: Plan) => void;
  disabled?: boolean;
}

export const PlanCard = ({ plan, isPopular, onSelect, disabled }: PlanCardProps) => {
  const pricing = planPricing[plan.id] || { price: 0, currency: '$', period: '/месяц' };
  const details = planDetails[plan.id] || { description: '', features: [], available: true };
  
  const platformIcons = {
    mobile: <Smartphone className="h-4 w-4" />,
    desktop: <Monitor className="h-4 w-4" />,
  };

  const isAvailable = details.available;

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
        isPopular ? 'border-primary gold-glow hover:border-primary' : 'hover:border-primary/50'
      } ${!isAvailable ? 'opacity-75' : ''}`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl">
          Максимум
        </div>
      )}
      
      {!isAvailable && (
        <div className="absolute top-0 left-0 bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-br-xl flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Скоро
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          {plan.allowed_platforms.map((platform) => (
            <span 
              key={platform}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs"
            >
              {platformIcons[platform as keyof typeof platformIcons]}
              {platform === 'mobile' ? 'Mobile' : 'Desktop'}
            </span>
          ))}
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{details.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gradient-gold">{pricing.price}</span>
          <span className="text-lg text-muted-foreground">{pricing.currency}</span>
          <span className="text-sm text-muted-foreground">{pricing.period}</span>
        </div>
        
        <ul className="space-y-3">
          {details.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant={isAvailable ? (isPopular ? "gold" : "gold-outline") : "outline"} 
          className="w-full"
          onClick={() => onSelect(plan)}
          disabled={disabled || !isAvailable}
        >
          {isAvailable ? 'Выбрать тариф' : 'Скоро доступен'}
        </Button>
      </CardFooter>
    </Card>
  );
};
