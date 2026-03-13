"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import {
  Building2,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const sharedBackgroundStyle = {
  gradient: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74, 222, 128, 0.15), transparent),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(251, 191, 36, 0.12), transparent),
    linear-gradient(180deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)
  `,
  grid: `
    linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
  `,
};

const inputClass =
  "w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200";

type FacilityItem = {
  facility_id: number;
  name: string;
  join_token: string | null;
  country: string;
  address: string | null;
  active_players: number;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type FormData = {
  name: string;
  join_token: string;
  country: string;
  address: string;
};

const defaultFormData: FormData = {
  name: "",
  join_token: "",
  country: "Philippines",
  address: "",
};

export default function FacilitiesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<FacilityItem | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login?returnUrl=/facilities");
      return;
    }
  }, [router]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.data?.user ?? data?.user ?? data;
        setUserEmail(user?.email ?? null);
      })
      .catch(() => setUserEmail(null));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchFacilities = useCallback(async (pageNum: number) => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: "10",
      });
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`${API_URL}/api/facilities?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load facilities");

      const json = await res.json();
      const data = json?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination ?? null);
    } catch {
      setError("Could not load facilities. Please try again.");
      setItems([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (getAuthToken()) {
      void fetchFacilities(page);
    }
  }, [page, debouncedSearch, fetchFacilities]);

  function openCreate() {
    setFormData(defaultFormData);
    setFormError("");
    setModal("create");
  }

  function openEdit(facility: FacilityItem) {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      join_token: facility.join_token ?? "",
      country: facility.country ?? "Philippines",
      address: facility.address ?? "",
    });
    setFormError("");
    setModal("edit");
  }

  function openDelete(facility: FacilityItem) {
    setDeletingFacility(facility);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setEditingFacility(null);
    setDeletingFacility(null);
    setFormError("");
  }

  async function handleCreate() {
    setFormError("");
    if (!formData.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/facilities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          join_token: formData.join_token.trim() || undefined,
          country: formData.country.trim() || "Philippines",
          address: formData.address.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message ?? json?.errors
          ? Object.values(json.errors ?? {}).flat().join(" ")
          : "Failed to create facility.";
        setFormError(msg);
        return;
      }

      showToast("Facility created successfully", "success");
      closeModal();
      void fetchFacilities(page);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    setFormError("");
    if (!editingFacility || !formData.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/facilities/${editingFacility.facility_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            join_token: formData.join_token.trim() || null,
            country: formData.country.trim() || "Philippines",
            address: formData.address.trim() || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message ?? json?.errors
          ? Object.values(json.errors ?? {}).flat().join(" ")
          : "Failed to update facility.";
        setFormError(msg);
        return;
      }

      showToast("Facility updated successfully", "success");
      closeModal();
      void fetchFacilities(page);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingFacility) return;

    const token = getAuthToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/facilities/${deletingFacility.facility_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const json = await res.json();
        showToast(json?.message ?? "Failed to delete facility", "error");
        return;
      }

      showToast("Facility deleted successfully", "success");
      closeModal();
      void fetchFacilities(page);
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: sharedBackgroundStyle.gradient }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: sharedBackgroundStyle.grid,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative px-6 pt-5 pb-24 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md mx-auto space-y-6">
          <nav
            className={cn(
              "flex items-center gap-2 transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-800 p-1 -ml-1 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <RacketTierLogo
              textSize="text-xl"
              tagline={null}
              mounted={mounted}
              className="min-h-[44px] flex items-center flex-1"
            />
          </nav>

          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">
              Manage Facilities
            </h1>
            <p className="text-sm text-zinc-500">
              Create, edit, and delete facilities. Players can join using the
              facility code or QR code.
            </p>
          </header>

          {/* Search + Create */}
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(inputClass, "pl-9")}
                aria-label="Search facilities"
              />
            </div>
            <Button
              onClick={openCreate}
              disabled={userEmail !== "marnelle24@gmail.com"}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Facility
            </Button>
          </div>

          {error && (
            <div className="transition-all duration-700 delay-100">
              <InlineError message={error} />
            </div>
          )}

          {isLoading ? (
            <div
              className={cn(
                "rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 flex flex-col items-center justify-center gap-3 transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500">Loading facilities...</p>
            </div>
          ) : items.length === 0 ? (
            <div
              className={cn(
                "rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 text-center transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Building2 className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">
                {debouncedSearch ? "No facilities match your search." : "No facilities yet."}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {debouncedSearch
                  ? "Try a different search term."
                  : "Create your first facility to get started."}
              </p>
              {!debouncedSearch && (
                <Button
                  onClick={openCreate}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Facility
                </Button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "space-y-3 transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              {items.map((facility) => (
                <div
                  key={facility.facility_id}
                  className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 truncate">
                          {facility.name}
                        </h3>
                        {facility.active_players > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                            <Users className="h-3 w-3" />
                            {facility.active_players} active
                          </span>
                        )}
                      </div>
                      {(facility.address || facility.country) && (
                        <p className="text-sm text-zinc-500 truncate mt-0.5">
                          {[facility.address, facility.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {facility.join_token && (
                        <p className="text-xs text-zinc-400 font-mono mt-1">
                          Code: {facility.join_token}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/facility/${facility.facility_id}/room`}
                        className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Open facility room"
                      >
                        <Building2 className="h-4 w-4" />
                      </Link>
                      {userEmail === "marnelle24@gmail.com" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(facility)}
                            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            aria-label="Edit facility"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(facility)}
                            className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete facility"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-zinc-500">
                    Page {pagination.current_page} of {pagination.last_page} (
                    {pagination.total} total)
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(pagination.last_page, p + 1)
                        )
                      }
                      disabled={page >= pagination.last_page}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="facility-modal-title"
        >
          <div
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in animation-duration-200"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-xl mx-auto animate-in slide-in-from-bottom fade-in animation-duration-300">
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 id="facility-modal-title" className="text-lg font-semibold text-zinc-900">
                {modal === "create" ? "Add Facility" : "Edit Facility"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 -mr-2 text-zinc-500 hover:text-zinc-700 rounded-lg"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <InlineError message={formError} />
              )}

              <div>
                <label htmlFor="facility-name" className="block text-sm font-medium text-zinc-700 mb-1">
                  Name *
                </label>
                <input
                  id="facility-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Downtown Badminton Court"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="facility-join-token" className="block text-sm font-medium text-zinc-700 mb-1">
                  Join code (optional)
                </label>
                <input
                  id="facility-join-token"
                  type="text"
                  value={formData.join_token}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      join_token: e.target.value,
                    }))
                  }
                  placeholder="Leave empty for auto-generated code"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="facility-country" className="block text-sm font-medium text-zinc-700 mb-1">
                  Country
                </label>
                <input
                  id="facility-country"
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country: e.target.value }))
                  }
                  placeholder="Philippines"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="facility-address" className="block text-sm font-medium text-zinc-700 mb-1">
                  Address
                </label>
                <input
                  id="facility-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Street, City, Region"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-4 flex gap-2 justify-end rounded-b-2xl">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={modal === "create" ? handleCreate : handleUpdate}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : modal === "create" ? (
                  "Create"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {modal === "delete" && deletingFacility && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-xl mx-auto p-6">
            <h2 id="delete-modal-title" className="text-lg font-semibold text-zinc-900">
              Delete Facility
            </h2>
            <p className="text-sm text-zinc-600 mt-2">
              Are you sure you want to delete &quot;{deletingFacility.name}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
