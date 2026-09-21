"use client";

/**
 * Admin user management (specs/admin-console-and-subscription-lifecycle/).
 * List every account, drill into one for usage + payment history, block/
 * unblock, and create a brand-new account directly into a tier. Client-
 * rendered like every other admin page -- auth session lives in the
 * browser (app/admin/layout.tsx's AdminGuard already gates this route).
 */

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/lib/auth/use-session";

interface UserSummary {
  id: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  isBlocked: boolean;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

interface PaymentEvent {
  id: string;
  event_type: string;
  tier: string | null;
  amount_usd: number | null;
  status: string;
  created_at: string;
}

interface UserDetail extends UserSummary {
  trialEndsAt: string | null;
  createdByAdminId: string | null;
  usage: { assistantGenerations: number; lessonsCompleted: number };
  payments: PaymentEvent[];
}

export default function AdminUsersPage() {
  const { token } = useSession();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createTier, setCreateTier] = useState<"basic" | "premium">("basic");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function loadUsers() {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch("/api/admin/users", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: UserSummary[] }) => setUsers(d.data))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, [token]);

  function openUser(id: string) {
    if (!token) return;
    setDetailLoading(true);
    setActionMessage(null);
    fetch(`/api/admin/users/${id}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: UserDetail }) => setSelected(d.data))
      .catch(() => setError("Failed to load user detail."))
      .finally(() => setDetailLoading(false));
  }

  function toggleBlock(user: UserDetail) {
    if (!token) return;
    const action = user.isBlocked ? "unblock" : "block";
    fetch(`/api/admin/users/${user.id}/${action}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { warning?: string }) => {
        setActionMessage(d.warning ?? `User ${action}ed.`);
        openUser(user.id);
        loadUsers();
      })
      .catch(() => setActionMessage(`Failed to ${action} user.`));
  }

  function changeTier(user: UserDetail, tier: "basic" | "premium") {
    if (!token || tier === user.subscriptionTier) return;
    const label = tier === "premium" ? "$50 Premium" : "$10 Basic";
    // Changing a tier is an admin override that does not touch payment
    // records, status or expiry -- confirm before doing it.
    if (!window.confirm(`Change ${user.email} to ${label}? Status and expiry date stay as they are.`)) return;
    fetch(`/api/admin/users/${user.id}/tier`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ tier }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(() => {
        setActionMessage(`Tier changed to ${label}.`);
        openUser(user.id);
        loadUsers();
      })
      .catch(() => setActionMessage("Failed to change tier."));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: createEmail, tier: createTier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create account");
        return;
      }
      setCreateEmail("");
      setShowCreateForm(false);
      loadUsers();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between border-b border-console-line pb-6">
        <h1 className="text-console-text k-display">Users</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="h-11 k-btn k-btn-primary"
        >
          {showCreateForm ? "Cancel" : "+ New Account"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="mb-8 border border-console-line p-6">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex-1">
              <span className="mb-1 block text-console-text k-label">Email</span>
              <input
                required
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="h-11 w-full border border-console-line px-3 text-sm text-console-text"
              />
            </label>
            <label>
              <span className="mb-1 block text-console-text k-label">Tier</span>
              <select
                value={createTier}
                onChange={(e) => setCreateTier(e.target.value as "basic" | "premium")}
                className="h-11 border border-console-line px-3 text-sm text-console-text"
              >
                <option value="basic">$10 Basic</option>
                <option value="premium">$50 Premium</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={creating}
              className="h-11 disabled:opacity-50 k-btn k-btn-primary"
            >
              {creating ? "Creating…" : "Create & Invite"}
            </button>
          </div>
          <p className="mt-3 text-xs text-console-text opacity-60">
            Sends an email invite, no password is set here (E-4). The account is active on the
            chosen tier immediately.
          </p>
          {createError && <p className="mt-2 text-sm text-signal">{createError}</p>}
        </form>
      )}

      {loading && <p className="text-sm text-console-text opacity-60">Loading…</p>}
      {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="w-full border border-console-line text-left text-sm">
            <thead>
              <tr className="border-b border-console-line k-label">
                <th className="p-3">Email</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => openUser(u.id)}
                  className={`cursor-pointer border-b border-console-line transition-colors duration-150 ease-out hover:bg-paper-2 ${
                    u.isBlocked ? "opacity-50" : ""
                  }`}
                >
                  <td className="p-3">
                    {u.email}
                    {u.isBlocked && <span className="ml-2 text-xs font-bold text-signal">BLOCKED</span>}
                  </td>
                  <td className="p-3 k-label">{u.subscriptionTier}</td>
                  <td className="p-3">{u.subscriptionStatus}</td>
                  <td className="p-3">
                    {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : "n/a"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {detailLoading && <p className="text-sm text-console-text opacity-60">Loading…</p>}
          {actionMessage && (
            <p className="mb-4 border border-console-line p-3 text-sm text-console-text">{actionMessage}</p>
          )}
          {selected && (
            <div className="border border-console-line p-6">
              <h2 className="mb-1 text-console-text k-h4">
                {selected.email}
              </h2>
              <p className="mb-4 text-console-text opacity-60 k-label">
                {selected.role} · {selected.subscriptionTier} · {selected.subscriptionStatus}
                {selected.isBlocked && " · BLOCKED"}
              </p>

              <button
                type="button"
                onClick={() => toggleBlock(selected)}
                className={`mb-6 h-11 k-btn ${
                  selected.isBlocked
                    ? "border-black bg-black text-white hover:border-signal hover:bg-signal"
                    : "border-signal text-signal hover:bg-signal hover:text-white"
                }`}
              >
                {selected.isBlocked ? "Unblock User" : "Block User"}
              </button>

              <label className="mb-6 block">
                <span className="mb-1 block text-console-text k-label">Tier</span>
                <select
                  value={selected.subscriptionTier}
                  onChange={(e) => changeTier(selected, e.target.value as "basic" | "premium")}
                  className="h-11 w-full border border-console-line px-3 text-sm text-console-text"
                >
                  <option value="basic">$10 Basic</option>
                  <option value="premium">$50 Premium</option>
                </select>
              </label>

              <h3 className="mb-2 text-console-text k-label">Usage</h3>
              <ul className="mb-6 text-sm text-console-text">
                <li>Assistant generations: {selected.usage.assistantGenerations}</li>
                <li>Lessons completed: {selected.usage.lessonsCompleted}</li>
              </ul>

              <h3 className="mb-2 text-console-text k-label">
                Payment History
              </h3>
              {selected.payments.length === 0 ? (
                <p className="text-sm text-console-text opacity-60">No payment events.</p>
              ) : (
                <ul className="space-y-2 text-sm text-console-text">
                  {selected.payments.map((p) => (
                    <li key={p.id} className="border-b border-console-line pb-2">
                      {new Date(p.created_at).toLocaleDateString()}, {p.event_type}, $
                      {p.amount_usd ?? "?"}, {p.tier ?? "?"}, {p.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!selected && !detailLoading && (
            <p className="text-sm text-console-text opacity-60">Select a user to see their detail.</p>
          )}
        </div>
      </div>
    </div>
  );
}
