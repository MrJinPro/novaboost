import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, authApi, getToken } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Shield, Users } from "lucide-react";

const PAGE_SIZE = 50;

const isStaffRole = (role?: string): boolean => {
  const r = (role || "user").toLowerCase();
  return r !== "user";
};

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.getMe,
    enabled: !!getToken(),
    retry: false,
  });

  const meRole = meQuery.data?.role || "user";
  const canView = isStaffRole(meRole);
  const canEditRoles = (meRole || "user").toLowerCase() === "superadmin";

  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminApi.listRoles,
    enabled: canView,
    retry: false,
  });

  const usersQueryKey = useMemo(() => ["admin", "users", { q, offset }], [q, offset]);

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => adminApi.listUsers({ q, limit: PAGE_SIZE, offset }),
    enabled: canView,
    retry: false,
  });

  const setRoleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: string }) => adminApi.setUserRole(vars.userId, vars.role),
    onSuccess: async () => {
      toast.success("Роль обновлена");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось изменить роль");
    },
  });

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className="min-h-screen">
        <Header isLoggedIn={!!getToken()} />
        <main className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Админка
                </CardTitle>
                <CardDescription>Нужно войти в аккаунт</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gold" onClick={() => navigate("/auth")}>Войти</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen">
        <Header isLoggedIn={true} />
        <main className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Админка
                </CardTitle>
                <CardDescription>Доступ только для сотрудников</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => navigate("/profile")}>Назад в профиль</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const roles = rolesQuery.data?.items?.map((r) => r.id) || [];
  const users = usersQuery.data?.items || [];
  const total = usersQuery.data?.total ?? 0;

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Админка
              </CardTitle>
              <CardDescription>
                Пользователи и роли
                {canEditRoles ? " (режим superadmin)" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Input
                    placeholder="Поиск по логину"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full sm:w-80"
                  />
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })}
                    disabled={usersQuery.isFetching}
                  >
                    Обновить
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Всего: {total}
                </div>
              </div>

              {rolesQuery.isLoading || usersQuery.isLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : rolesQuery.isError ? (
                <div className="text-sm text-destructive">Не удалось загрузить роли</div>
              ) : usersQuery.isError ? (
                <div className="text-sm text-destructive">Не удалось загрузить пользователей</div>
              ) : (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Логин</TableHead>
                        <TableHead>TikTok</TableHead>
                        <TableHead>Создан</TableHead>
                        <TableHead>Роль</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                            Ничего не найдено
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {
                          const created = u.created_at
                            ? new Date(u.created_at).toLocaleString("ru-RU", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.username}</TableCell>
                              <TableCell className="text-muted-foreground">{u.tiktok_username || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{created || "—"}</TableCell>
                              <TableCell>
                                {canEditRoles ? (
                                  <Select
                                    value={u.role}
                                    onValueChange={(value) => setRoleMutation.mutate({ userId: u.id, role: value })}
                                    disabled={setRoleMutation.isPending}
                                  >
                                    <SelectTrigger className="w-44">
                                      <SelectValue placeholder="Выберите роль" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((r) => (
                                        <SelectItem key={r} value={r}>
                                          {r}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm">{u.role}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))}
                  disabled={!hasPrev}
                >
                  Назад
                </Button>
                <div className="text-sm text-muted-foreground">
                  {total === 0 ? "" : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} из ${total}`}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setOffset((v) => v + PAGE_SIZE)}
                  disabled={!hasNext}
                >
                  Вперёд
                </Button>
              </div>

              {!canEditRoles && (
                <div className="text-xs text-muted-foreground">
                  Редактирование ролей доступно только для superadmin
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
