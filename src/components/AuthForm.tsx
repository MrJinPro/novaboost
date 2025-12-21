import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, setToken, normalizeUsername } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Info } from "lucide-react";

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show normalized username preview
  const normalizedPreview = username ? normalizeUsername(username) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      toast.error('Заполните все поля');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const response = mode === 'login' 
        ? await authApi.login(username, password)
        : await authApi.register(username, password);
      
      setToken(response.access_token);
      
      // Verify token works
      const isValid = await authApi.verifyToken();
      if (!isValid) {
        throw new Error('Ошибка проверки токена');
      }
      
      toast.success(mode === 'login' ? 'Вход выполнен!' : 'Регистрация успешна!');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? 'Войдите для покупки тарифа' 
            : 'Зарегистрируйтесь для начала работы'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Логин
            </label>
            <Input
              type="text"
              placeholder="username123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
            {username && normalizedPreview !== username.trim() && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Будет сохранён как: <span className="text-primary font-mono">{normalizedPreview}</span>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-xs text-muted-foreground">
                Латиница (a-z), цифры, точка, дефис, подчёркивание. 2-64 символа.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Пароль
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="pr-10"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Подтвердите пароль
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}
          
          <Button type="submit" variant="gold" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === 'login' 
              ? 'Нет аккаунта? Зарегистрируйтесь' 
              : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
