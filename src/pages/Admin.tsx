import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, authApi, getToken, plansApi } from "@/lib/api";
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
  const [activity, setActivity] = useState<"" | "online" | "inactive">("");
  const [inactiveDays, setInactiveDays] = useState<number>(30);
  const [platform, setPlatform] = useState<"" | "android" | "ios" | "desktop">("");
  const [region, setRegion] = useState<string>("");
  const [tariffId, setTariffId] = useState<string>("");
  const [hasDonations, setHasDonations] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    "created_at" | "last_login_at" | "total_coins" | "today_coins" | "last_7d_coins" | "last_30d_coins"
  >("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [topPreset, setTopPreset] = useState<"off" | "today" | "7d" | "30d" | "all">("off");
  const [offset, setOffset] = useState(0);
  const [selectedPlanByUserId, setSelectedPlanByUserId] = useState<Record<string, string | null>>({});

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
  const isSuperadmin = (meRole || "user").toLowerCase() === "superadmin";

  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminApi.listRoles,
    enabled: isSuperadmin,
    retry: false,
  });

  const usersQueryKey = useMemo(
    () => ["admin", "users", { q, activity, inactiveDays, platform, region, tariffId, hasDonations, sortBy, sortDir, offset }],
    [q, activity, inactiveDays, platform, region, tariffId, hasDonations, sortBy, sortDir, offset]
  );

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: () =>
      adminApi.listUsers({
        q,
        activity: activity || null,
        inactive_days: activity === "inactive" ? inactiveDays : null,
        platform: platform || null,
        region: region || null,
        tariff_id: isSuperadmin ? (tariffId || null) : null,
        has_donations: hasDonations ? true : null,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit: PAGE_SIZE,
        offset,
      }),
    enabled: canView,
    retry: false,
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.getPlans,
    enabled: isSuperadmin,
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

  const setLicenseMutation = useMutation({
    mutationFn: (vars: { userId: string; plan: string | null; ttlDays: number }) =>
      adminApi.setUserLicense(vars.userId, vars.plan, vars.ttlDays),
    onSuccess: async () => {
      toast.success("Тариф/лицензия обновлены");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось обновить тариф");
    },
  });

  const extendLicenseMutation = useMutation({
    mutationFn: (vars: { userId: string; extendDays: number }) => adminApi.extendUserLicense(vars.userId, vars.extendDays),
    onSuccess: async () => {
      toast.success("Лицензия продлена");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось продлить лицензию");
    },
  });

  const revokeLicenseMutation = useMutation({
    mutationFn: (vars: { userId: string }) => adminApi.revokeUserLicense(vars.userId),
    onSuccess: async () => {
      toast.success("Лицензия отозвана");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось отозвать лицензию");
    },
  });

  const setBanMutation = useMutation({
    mutationFn: (vars: { userId: string; banned: boolean }) => adminApi.setUserBan(vars.userId, vars.banned),
    onSuccess: async () => {
      toast.success("Статус бана обновлён");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось обновить бан");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (vars: { userId: string }) => adminApi.deleteUser(vars.userId),
    onSuccess: async () => {
      toast.success("Пользователь удалён");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить пользователя");
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
                <Button variant="gold" onClick={() => navigate("/auth")}>
                  Войти
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
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
              <CardContent className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate("/profile")}>
                  Назад в профиль
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const roles = rolesQuery.data?.items?.map((r) => r.id) || [];
  const users = usersQuery.data?.items || [];
  const total = usersQuery.data?.total ?? 0;

  const paidPlans = plansQuery.data?.items || [];

  const tariffFilterOptions = (() => {
    const base = [
      { id: "__all__", label: "Все тарифы" },
      { id: "nova_free_streamer", label: "free" },
    ];
    const rest = paidPlans.map((p) => ({ id: p.id, label: p.id }));
    const seen = new Set<string>();
    return [...base, ...rest].filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  })();

  const columnsCount = isSuperadmin ? 14 : 11;

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Админка
              </CardTitle>
              <CardDescription>
                Пользователи
                {isSuperadmin ? " (режим superadmin)" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Input
                    placeholder="Поиск по логину / email"
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

                <div className="flex items-center gap-2">
                  <Link to="/admin/notifications">
                    <Button variant="outline">Уведомления</Button>
                  </Link>
                  <div className="text-sm text-muted-foreground">Всего: {total}</div>
                </div>
              </div>

              {usersQuery.isLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : usersQuery.isError ? (
                <div className="text-sm text-destructive">Не удалось загрузить пользователей</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select
                        value={activity || "__all__"}
                        onValueChange={(v) => {
                          setActivity(v === "__all__" ? "" : (v as any));
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-56">
                          <SelectValue placeholder="Активность" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Активность: все</SelectItem>
                          <SelectItem value="online">Только online</SelectItem>
                          <SelectItem value="inactive">Только неактивные</SelectItem>
                        </SelectContent>
                      </Select>

                      {activity === "inactive" && (
                        <Input
                          type="number"
                          min={1}
                          value={String(inactiveDays)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setInactiveDays(Number.isFinite(n) && n > 0 ? n : 30);
                            setOffset(0);
                          }}
                          className="w-full sm:w-40"
                          placeholder="Дней"
                        />
                      )}

                      <Select
                        value={platform || "__all__"}
                        onValueChange={(v) => {
                          setPlatform(v === "__all__" ? "" : (v as any));
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-56">
                          <SelectValue placeholder="Платформа" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Платформа: все</SelectItem>
                          <SelectItem value="android">Android</SelectItem>
                          <SelectItem value="ios">iOS</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Регион (например RU)"
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setOffset(0);
                        }}
                        className="w-full sm:w-56"
                      />

                      <Select
                        value={hasDonations ? "donations" : "all"}
                        onValueChange={(v) => {
                          setHasDonations(v === "donations");
                          setTopPreset("off");
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-56">
                          <SelectValue placeholder="Аналитика" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Аналитика: все</SelectItem>
                          <SelectItem value="donations">Только с донатами</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={topPreset}
                        onValueChange={(v) => {
                          const vv = (v as any) as "off" | "today" | "7d" | "30d" | "all";
                          setTopPreset(vv);
                          if (vv === "off") {
                            setOffset(0);
                            return;
                          }

                          setHasDonations(true);
                          setSortDir("desc");
                          if (vv === "today") setSortBy("today_coins");
                          else if (vv === "7d") setSortBy("last_7d_coins");
                          else if (vv === "30d") setSortBy("last_30d_coins");
                          else setSortBy("total_coins");
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-56">
                          <SelectValue placeholder="Топ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Топ: выкл</SelectItem>
                          <SelectItem value="today">Топ: сегодня</SelectItem>
                          <SelectItem value="7d">Топ: 7 дней</SelectItem>
                          <SelectItem value="30d">Топ: 30 дней</SelectItem>
                          <SelectItem value="all">Топ: всё время</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={`${sortBy}:${sortDir}`}
                        onValueChange={(v) => {
                          const [sb, sd] = String(v).split(":");
                          setSortBy((sb as any) || "created_at");
                          setSortDir(sd === "asc" ? "asc" : "desc");
                          setTopPreset("off");
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Сортировка" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at:desc">Новые (создан)</SelectItem>
                          <SelectItem value="last_login_at:desc">Последний логин</SelectItem>
                          <SelectItem value="total_coins:desc">Coins: всего</SelectItem>
                          <SelectItem value="today_coins:desc">Coins: сегодня</SelectItem>
                          <SelectItem value="last_7d_coins:desc">Coins: 7 дней</SelectItem>
                          <SelectItem value="last_30d_coins:desc">Coins: 30 дней</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isSuperadmin && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                          value={tariffId || "__all__"}
                          onValueChange={(v) => {
                            setTariffId(v === "__all__" ? "" : v);
                            setOffset(0);
                          }}
                          disabled={plansQuery.isLoading || plansQuery.isError}
                        >
                          <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="Тариф" />
                          </SelectTrigger>
                          <SelectContent>
                            {tariffFilterOptions.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/50">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-56 whitespace-normal">Пользователь</TableHead>
                        <TableHead>Online</TableHead>
                        <TableHead className="w-64 whitespace-normal">Устройство</TableHead>
                        <TableHead>Регион</TableHead>
                        <TableHead>Последний логин</TableHead>
                        <TableHead>TikTok</TableHead>
                        <TableHead>Последний LIVE</TableHead>
                        <TableHead className="w-36 whitespace-normal">Подарки</TableHead>
                        <TableHead className="w-56 whitespace-normal">Топ доноры</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Статус</TableHead>
                        {isSuperadmin && <TableHead>Тариф</TableHead>}
                        {isSuperadmin && <TableHead>Лицензия до</TableHead>}
                        {isSuperadmin && <TableHead>Действия</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columnsCount} className="text-center text-muted-foreground py-10">
                            Ничего не найдено
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {

                          const lastLogin = u.last_login_at
                            ? new Date(u.last_login_at).toLocaleString("ru-RU", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          const lastLive = u.last_live_at
                            ? new Date(u.last_live_at).toLocaleString("ru-RU", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          const status = u.is_banned
                            ? "blocked"
                            : (u.status || "active");

                          const deviceLine = [u.client_os || u.platform, u.device]
                            .filter((x) => !!(x && String(x).trim()))
                            .join(" • ");

                          const giftsLine = `${u.total_gifts ?? 0} / ${u.total_coins ?? 0}`;

                          const topDonorsAll = (u.top_donors_all || u.top_donors || [])
                            .map((d: any) => `${d.username} (${d.coins ?? d.total_coins ?? 0})`)
                            .join(", ");
                          const topDonorsToday = (u.top_donors_today || [])
                            .map((d) => `${d.username} (${d.coins ?? 0})`)
                            .join(", ");
                          const topDonors7d = (u.top_donors_7d || [])
                            .map((d) => `${d.username} (${d.coins ?? 0})`)
                            .join(", ");
                          const topDonors30d = (u.top_donors_30d || [])
                            .map((d) => `${d.username} (${d.coins ?? 0})`)
                            .join(", ");

                          const topGiftsAll = (u.top_gifts_all || [])
                            .map((g) => `${g.name} (${g.coins ?? 0})`)
                            .join(", ");
                          const topGiftsToday = (u.top_gifts_today || [])
                            .map((g) => `${g.name} (${g.coins ?? 0})`)
                            .join(", ");
                          const topGifts7d = (u.top_gifts_7d || [])
                            .map((g) => `${g.name} (${g.coins ?? 0})`)
                            .join(", ");
                          const topGifts30d = (u.top_gifts_30d || [])
                            .map((g) => `${g.name} (${g.coins ?? 0})`)
                            .join(", ");

                          return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium whitespace-normal break-words">
                                <div>{u.username}</div>
                                <div className="text-xs text-muted-foreground break-words">{u.email || "—"}</div>
                              </TableCell>
                              <TableCell>
                                {u.online_now ? (
                                  <span className="text-sm">online</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">offline</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-normal break-words text-xs">
                                {deviceLine || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{u.region || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{lastLogin || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{u.tiktok_username || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{lastLive || "—"}</TableCell>
                              <TableCell className="text-muted-foreground whitespace-normal break-words">
                                <div className="text-sm">{giftsLine}</div>
                                <div className="text-xs">today {u.today_coins ?? 0} • 7d {u.last_7d_coins ?? 0} • 30d {u.last_30d_coins ?? 0}</div>
                                <div className="text-[11px] text-muted-foreground mt-1">gift top all: {topGiftsAll || "—"}</div>
                                <div className="text-[11px] text-muted-foreground">gift top today: {topGiftsToday || "—"}</div>
                                <div className="text-[11px] text-muted-foreground">gift top 7d: {topGifts7d || "—"}</div>
                                <div className="text-[11px] text-muted-foreground">gift top 30d: {topGifts30d || "—"}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-normal break-words text-xs">
                                <div className="text-[11px]">all: {topDonorsAll || "—"}</div>
                                <div className="text-[11px]">today: {topDonorsToday || "—"}</div>
                                <div className="text-[11px]">7d: {topDonors7d || "—"}</div>
                                <div className="text-[11px]">30d: {topDonors30d || "—"}</div>
                              </TableCell>
                              <TableCell>
                                {isSuperadmin ? (
                                  <Select
                                    value={u.role}
                                    onValueChange={(value) => setRoleMutation.mutate({ userId: u.id, role: value })}
                                    disabled={setRoleMutation.isPending || rolesQuery.isLoading || rolesQuery.isError}
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

                              <TableCell>
                                {status === "blocked" ? (
                                  <span className="text-sm text-destructive">blocked</span>
                                ) : status === "expired" ? (
                                  <span className="text-sm text-muted-foreground">expired</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">active</span>
                                )}
                              </TableCell>

                              {isSuperadmin && (
                                <TableCell>
                                  <Select
                                    value={
                                      selectedPlanByUserId[u.id] !== undefined
                                        ? selectedPlanByUserId[u.id] ?? "__free__"
                                        : paidPlans.some((p) => p.id === u.tariff_id)
                                          ? (u.tariff_id as string)
                                          : "__free__"
                                    }
                                    onValueChange={(value) =>
                                      setSelectedPlanByUserId((prev) => ({
                                        ...prev,
                                        [u.id]: value === "__free__" ? null : value,
                                      }))
                                    }
                                    disabled={
                                      plansQuery.isLoading ||
                                      plansQuery.isError ||
                                      setLicenseMutation.isPending ||
                                      extendLicenseMutation.isPending ||
                                      revokeLicenseMutation.isPending
                                    }
                                  >
                                    <SelectTrigger className="w-56">
                                      <SelectValue placeholder="Тариф" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__free__">free</SelectItem>
                                      {paidPlans.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.id}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              )}

                              {isSuperadmin && (
                                <TableCell className="text-muted-foreground">
                                  {u.license_expires_at
                                    ? new Date(u.license_expires_at).toLocaleString("ru-RU", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </TableCell>
                              )}

                              {isSuperadmin && (
                                <TableCell>
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        const selected =
                                          selectedPlanByUserId[u.id] !== undefined
                                            ? selectedPlanByUserId[u.id]
                                            : paidPlans.some((p) => p.id === u.tariff_id)
                                              ? (u.tariff_id as string)
                                              : null;
                                        setLicenseMutation.mutate({ userId: u.id, plan: selected ?? null, ttlDays: 30 });
                                      }}
                                      disabled={
                                        setLicenseMutation.isPending ||
                                        extendLicenseMutation.isPending ||
                                        revokeLicenseMutation.isPending
                                      }
                                    >
                                      Применить 30д
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => extendLicenseMutation.mutate({ userId: u.id, extendDays: 30 })}
                                      disabled={
                                        !u.license_expires_at ||
                                        setLicenseMutation.isPending ||
                                        extendLicenseMutation.isPending ||
                                        revokeLicenseMutation.isPending
                                      }
                                    >
                                      +30д
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => revokeLicenseMutation.mutate({ userId: u.id })}
                                      disabled={
                                        !u.license_expires_at ||
                                        setLicenseMutation.isPending ||
                                        extendLicenseMutation.isPending ||
                                        revokeLicenseMutation.isPending ||
                                        setBanMutation.isPending ||
                                        deleteUserMutation.isPending
                                      }
                                    >
                                      Отозвать
                                    </Button>

                                    <Button
                                      variant="outline"
                                      onClick={() => setBanMutation.mutate({ userId: u.id, banned: !u.is_banned })}
                                      disabled={
                                        setLicenseMutation.isPending ||
                                        extendLicenseMutation.isPending ||
                                        revokeLicenseMutation.isPending ||
                                        setBanMutation.isPending ||
                                        deleteUserMutation.isPending
                                      }
                                    >
                                      {u.is_banned ? "Разбан" : "Бан"}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm(`Удалить пользователя ${u.username}? Это необратимо.`)) {
                                          deleteUserMutation.mutate({ userId: u.id });
                                        }
                                      }}
                                      disabled={
                                        setLicenseMutation.isPending ||
                                        extendLicenseMutation.isPending ||
                                        revokeLicenseMutation.isPending ||
                                        setBanMutation.isPending ||
                                        deleteUserMutation.isPending
                                      }
                                    >
                                      Удалить
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))} disabled={!hasPrev}>
                  Назад
                </Button>
                <div className="text-sm text-muted-foreground">
                  {total === 0 ? "" : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} из ${total}`}
                </div>
                <Button variant="outline" onClick={() => setOffset((v) => v + PAGE_SIZE)} disabled={!hasNext}>
                  Вперёд
                </Button>
              </div>

              {!isSuperadmin && (
                <div className="text-xs text-muted-foreground">
                  Управление ролями/лицензиями/баном доступно только для superadmin
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
