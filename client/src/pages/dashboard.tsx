import { useState } from "react";
import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { usePrivatePosts } from "@/hooks/use-posts";
import { ShieldCheck, Loader2, SearchX, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SafeUser } from "@shared/routes";

function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { status?: string; role?: string } }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");
      return json;
    },
    onSuccess: (_, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const action = updates.status === "approved" ? "approved" : updates.status === "rejected" ? "rejected" : "updated";
      toast({ title: `User ${action} successfully` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update user", description: err.message, variant: "destructive" });
    },
  });

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle className="w-3 h-3" />{status}</span>;
    if (status === "rejected") return <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-md flex items-center gap-1"><XCircle className="w-3 h-3" />{status}</span>;
    return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock className="w-3 h-3" />{status}</span>;
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading users...</div>;

  const pending = users?.filter(u => u.status === "pending") ?? [];
  const others = users?.filter(u => u.status !== "pending") ?? [];

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Approval ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((user) => (
              <div key={user.id} data-testid={`row-user-${user.id}`} className="flex items-center gap-3 bg-card rounded-xl border border-amber-200/60 dark:border-amber-800/30 p-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {statusBadge(user.status)}
                <div className="flex gap-2 shrink-0">
                  <button
                    data-testid={`button-approve-${user.id}`}
                    onClick={() => updateUser.mutate({ id: user.id, updates: { status: "approved" } })}
                    disabled={updateUser.isPending}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    data-testid={`button-reject-${user.id}`}
                    onClick={() => updateUser.mutate({ id: user.id, updates: { status: "rejected" } })}
                    disabled={updateUser.isPending}
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">All Users ({others.length})</h3>
          <div className="space-y-2">
            {others.map((user) => (
              <div key={user.id} data-testid={`row-user-${user.id}`} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(user.status)}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{user.role}</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {user.status !== "approved" && (
                    <button
                      data-testid={`button-approve-${user.id}`}
                      onClick={() => updateUser.mutate({ id: user.id, updates: { status: "approved" } })}
                      disabled={updateUser.isPending}
                      className="px-2.5 py-1 bg-green-600 text-white text-[10px] font-bold rounded-lg disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {user.role !== "coordinator" && (
                    <button
                      data-testid={`button-make-coordinator-${user.id}`}
                      onClick={() => updateUser.mutate({ id: user.id, updates: { role: "coordinator" } })}
                      disabled={updateUser.isPending}
                      className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg disabled:opacity-50"
                    >
                      Make Coordinator
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!users || users.length === 0) && (
        <p className="text-sm text-muted-foreground py-4">No users registered yet.</p>
      )}
    </div>
  );
}

type Tab = "requests" | "users";

export default function DashboardPage() {
  const { data: posts, isLoading, error } = usePrivatePosts();
  const [tab, setTab] = useState<Tab>("requests");

  const tabs = [
    { id: "requests" as Tab, label: "Private Requests", count: posts?.length },
    { id: "users" as Tab, label: "User Management" },
  ];

  return (
    <Layout>
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Coordinator Only
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Coordinator Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage host family requests and user registrations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 max-w-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-2xl text-center">
              <p className="font-semibold">{error.message}</p>
            </div>
          )}
          {posts && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-card rounded-2xl border border-border border-dashed"
            >
              <SearchX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">All caught up!</h3>
              <p className="text-muted-foreground text-sm">No pending private requests from families right now.</p>
            </motion.div>
          )}
          {posts && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} showReply={true} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bold text-foreground">Registered Families</h2>
          </div>
          <UserManagement />
        </div>
      )}
    </Layout>
  );
}
