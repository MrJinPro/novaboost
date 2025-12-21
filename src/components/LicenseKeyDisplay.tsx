import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LicenseKeyDisplayProps {
  licenseKey: string;
  expiresAt: string;
  planName: string;
}

export const LicenseKeyDisplay = ({ licenseKey, expiresAt, planName }: LicenseKeyDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      toast.success('Ключ скопирован!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const formattedDate = new Date(expiresAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="w-full max-w-lg mx-auto gold-glow animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
          <Check className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl text-gradient-gold">Оплата прошла успешно!</CardTitle>
        <CardDescription>
          Тариф: <span className="text-foreground font-medium">{planName}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Ваш лицензионный ключ
          </label>
          <div className="relative">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border font-mono text-lg break-all">
              <span className="flex-1 text-primary">{licenseKey}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
          <p className="text-sm text-muted-foreground">
            Действует до: <span className="text-foreground font-medium">{formattedDate}</span>
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <h4 className="font-semibold text-foreground">Как активировать:</h4>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>Скопируйте ключ выше</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Откройте приложение TTBoost</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>Перейдите: <strong className="text-foreground">Profile → License</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                4
              </span>
              <span>Вставьте ключ и нажмите <strong className="text-foreground">Activate</strong></span>
            </li>
          </ol>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <a href="/">
            <ExternalLink className="h-4 w-4 mr-2" />
            Вернуться на главную
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
