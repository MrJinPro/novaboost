import { Plan, planPricing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Monitor, Smartphone } from "lucide-react";

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
  onSelect: (plan: Plan) => void;
  disabled?: boolean;
}

export const PlanCard = ({ plan, isPopular, onSelect, disabled }: PlanCardProps) => {
  const pricing = planPricing[plan.id] || { price: 0, currency: '₽', period: '/месяц' };
  
  const platformIcons = {
    mobile: <Smartphone className="h-4 w-4" />,
    desktop: <Monitor className="h-4 w-4" />,
  };

  const features = [
    'Автоматический буст стримов',
    'Аналитика в реальном времени',
    'Поддержка 24/7',
    plan.allowed_platforms.length > 1 ? 'Все платформы' : plan.allowed_platforms.includes('mobile') ? 'Мобильная версия' : 'Десктопная версия',
  ];

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 ${
        isPopular ? 'border-primary gold-glow' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl">
          Популярный
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
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gradient-gold">{pricing.price}</span>
          <span className="text-lg text-muted-foreground">{pricing.currency}</span>
          <span className="text-sm text-muted-foreground">{pricing.period}</span>
        </div>
        
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant={isPopular ? "gold" : "outline"} 
          className="w-full"
          onClick={() => onSelect(plan)}
          disabled={disabled}
        >
          Выбрать тариф
        </Button>
      </CardFooter>
    </Card>
  );
};
