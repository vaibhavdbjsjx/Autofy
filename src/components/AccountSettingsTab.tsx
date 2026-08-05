import React, { useState, useEffect } from "react";
import { User, Building, Mail, Phone, ShieldAlert, Trash2, Check, AlertCircle, Lock } from "lucide-react";
import { api } from "../lib/api";
import { signOut } from "../lib/auth";

interface AccountSettingsTabProps {
  triggerNotification?: (msg: string) => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ triggerNotification }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Owner");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Account Deletion Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/api/v1/auth/me");
      setName(res.name || "");
      setEmail(res.email || "");
      setRole(res.role || "Owner");
      if (res.business) {
        setBusinessName(res.business.name || "");
        setPhone(res.business.phone || "");
      }
    } catch (err) {
      /* non-fatal */
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put("/api/v1/auth/profile", {
        name,
        business_name: businessName,
        phone,
      });
      triggerNotification?.("Account profile updated successfully!");
    } catch (err: any) {
      triggerNotification?.(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm deletion.");
      return;
    }
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await api.delete("/api/v1/auth/delete-account", {
        confirmation_text: "DELETE",
        password: password || undefined,
      });

      triggerNotification?.("Your account and business data have been permanently deleted.");
      setShowDeleteModal(false);
      await signOut();
      window.location.href = "/login";
    } catch (err: any) {
      setDeleteError(err.message || "Account deletion failed. Please check password and retry.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="account-settings-module" className="space-y-8 font-sans text-left">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <User className="w-6 h-6 text-[#8B5CF6]" />
            Account & Profile Settings
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage your personal profile, business identity details, and account security.
          </p>
        </div>
      </div>

      {/* PROFILE MANAGEMENT FORM */}
      <form onSubmit={handleSaveProfile} className="surface-a p-6 sm:p-8 rounded-3xl space-y-6 border border-[var(--border)]">
        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-subtle)] font-display">
          Profile Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8B5CF6]" /> Your Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" /> Account Email (Read-Only)
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-zinc-900/40 text-xs text-zinc-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#8B5CF6]" /> Business / Company Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#8B5CF6]" /> Contact Phone Line
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {isSaving ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </div>
      </form>

      {/* DANGER ZONE — ACCOUNT DELETION */}
      <div className="p-6 sm:p-8 rounded-3xl surface-a border-2 border-red-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-2xl text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black font-display text-red-400">Danger Zone — Permanent Account Deletion</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Permanently delete your Autofy account, business profile, WhatsApp conversations, leads, and AI knowledge models.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setConfirmText("");
              setPassword("");
              setDeleteError(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-xs font-black transition cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Autofy Account
          </button>
        </div>
      </div>

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="surface-a p-6 sm:p-8 rounded-3xl border border-red-500/40 max-w-md w-full space-y-6 shadow-2xl text-left font-sans">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black font-display">Delete Autofy Account?</h3>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This action is <strong>permanent and cannot be undone</strong>. All associated business data including WhatsApp message history, leads, customer profiles, uploaded documents, and AI knowledge models will be deleted immediately.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">
                  Type <strong className="text-red-400 font-mono">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-zinc-400" /> Account Password:
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] hover:bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || confirmText.trim() !== "DELETE"}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting Account..." : "Confirm Account Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
