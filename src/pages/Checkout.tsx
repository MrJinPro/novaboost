import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plan, mockPlans, planPricing, getToken } from "@/lib/api";
import { toast } from "sonner";
import { CreditCard, Loader2, ArrowLeft, Monitor, Smartphone } from "lucide-react";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth');
      return;
    }

    // Get plan from state or URL
    const statePlan = location.state?.plan;
    const planId = location.state?.planId;
    
    if (statePlan) {
      setPlan(statePlan);
    } else if (planId) {
      const foundPlan = mockPlans.find(p => p.id === planId);
      if (foundPlan) setPlan(foundPlan);
      else navigate('/');
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Введите корректный email');
      return;
    }

    if (!plan) return;

    setLoading(true);

    try {
      // In production, this would call the server-side checkout endpoint
      // For now, simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page with mock license key
      navigate('/success', {
        state: {
          licenseKey: `TTB-${generateKey()}-${generateKey()}-${generateKey()}`,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          planName: plan.name,
        }
      });
    } catch (error) {
      toast.error('Ошибка при создании платежа');
    } finally {
      setLoading(false);
    }
  };

  const generateKey = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pricing = planPricing[plan.id] || { price: 0, currency: '₽', period: '/месяц' };

  const platformIcons = {
    mobile: <Smartphone className="h-4 w-4" />,
    desktop: <Monitor className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-lg">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к тарифам
          </Button>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl">Оформление заказа</CardTitle>
              <CardDescription>
                Завершите покупку тарифа
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Selected Plan Summary */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {plan.allowed_platforms.map((platform) => (
                        <span 
                          key={platform}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-xs"
                        >
                          {platformIcons[platform as keyof typeof platformIcons]}
                          {platform === 'mobile' ? 'Mobile' : 'Desktop'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gradient-gold">
                      {pricing.price}{pricing.currency}
                    </span>
                    <span className="text-sm text-muted-foreground block">
                      {pricing.period}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email для получения ключа
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    На этот адрес будет отправлен лицензионный ключ
                  </p>
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  size="lg" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Оплатить {pricing.price}{pricing.currency}
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Нажимая «Оплатить», вы соглашаетесь с условиями оферты
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
