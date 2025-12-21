import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PlanCard } from "@/components/PlanCard";
import { Plan, mockPlans, plansApi, getToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import starLogo from "@/assets/star-logo.png";
import { Sparkles, Zap, Shield } from "lucide-react";

const Index = () => {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await plansApi.getPlans();
        setPlans(response.items);
      } catch (error) {
        // Use mock data if API fails
        console.log('Using mock plans data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    const token = getToken();
    if (!token) {
      toast.info('Войдите в аккаунт для покупки');
      navigate('/auth', { state: { selectedPlan: plan.id } });
      return;
    }
    navigate('/checkout', { state: { plan } });
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <img 
              src={starLogo} 
              alt="NovaBoost" 
              className="h-24 w-24 mx-auto mb-8 animate-float"
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient-gold">NovaBoost</span>
              <br />
              <span className="text-foreground">Стриминг нового уровня</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Автоматизируйте рост вашей аудитории с помощью мощных инструментов буста. 
              Выберите тариф и начните прямо сейчас.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
            {[
              { icon: Zap, title: 'Мгновенный эффект', desc: 'Результаты с первой минуты' },
              { icon: Shield, title: 'Безопасность', desc: 'Защита вашего аккаунта' },
              { icon: Sparkles, title: 'Авто-режим', desc: 'Работает 24/7 без участия' },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center p-6 rounded-2xl bg-card/50 border border-border/30 animate-fade-in-delay-${idx + 1}`}
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Выберите тариф
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Гибкие тарифы для любых потребностей. Отмените в любой момент.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={idx === 2}
                onSelect={handleSelectPlan}
                disabled={loading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/30">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NovaBoost. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
