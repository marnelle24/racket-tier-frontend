"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  Users,
  X,
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

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

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
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "qr" | null>(null);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<FacilityItem | null>(null);
  const [qrFacility, setQrFacility] = useState<FacilityItem | null>(null);
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

  function openQrModal(facility: FacilityItem) {
    setQrFacility(facility);
    setModal("qr");
  }

  function closeModal() {
    setModal(null);
    setEditingFacility(null);
    setDeletingFacility(null);
    setQrFacility(null);
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
            <p className="mt-4 text-xs bg-yellow-400/10 border border-yellow-400/70 p-2 rounded-lg text-yellow-600">
              <strong>Beta Testing:</strong> For now, only administrators can add a facility location due to limited server resources.
              Please contact the administrator to request a facility location.
            </p>
          </header>

          {/* Search + Create */}
          <div
            className={cn(
              "grid grid-cols-6 items-center gap-2 transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="relative flex-1 col-span-5">
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
              // disabled={userEmail !== "marnelle24@gmail.com"}
              className="shrink-0 col-span-1 h-10 rounded-lg border-zinc-200/80 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
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
                "space-y-1 transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              {items.map((facility) => (
                <div
                  key={facility.facility_id}
                  className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openQrModal(facility)}
                      className="flex flex-col gap-0 items-start justify-center p-1 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      aria-label="View QR code"
                    >
                      {/* <QrCode className="w-10 h-10" /> */}
                      <svg className="w-full h-10 text-zinc-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier"></g><g id="SVGRepo_tracerCarrier"></g><g id="SVGRepo_iconCarrier"><path d="M3 9h6V3H3zm1-5h4v4H4zm1 1h2v2H5zm10 4h6V3h-6zm1-5h4v4h-4zm1 1h2v2h-2zM3 21h6v-6H3zm1-5h4v4H4zm1 1h2v2H5zm15 2h1v2h-2v-3h1zm0-3h1v1h-1zm0-1v1h-1v-1zm-10 2h1v4h-1v-4zm-4-7v2H4v-1H3v-1h3zm4-3h1v1h-1zm3-3v2h-1V3h2v1zm-3 0h1v1h-1zm10 8h1v2h-2v-1h1zm-1-2v1h-2v2h-2v-1h1v-2h3zm-7 4h-1v-1h-1v-1h2v2zm6 2h1v1h-1zm2-5v1h-1v-1zm-9 3v1h-1v-1zm6 5h1v2h-2v-2zm-3 0h1v1h-1v1h-2v-1h1v-1zm0-1v-1h2v1zm0-5h1v3h-1v1h-1v1h-1v-2h-1v-1h3v-1h-1v-1zm-9 0v1H4v-1zm12 4h-1v-1h1zm1-2h-2v-1h2zM8 10h1v1H8v1h1v2H8v-1H7v1H6v-2h1v-2zm3 0V8h3v3h-2v-1h1V9h-1v1zm0-4h1v1h-1zm-1 4h1v1h-1zm3-3V6h1v1z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>
                      <p className="text-[0.55rem] text-center">Show QR</p>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold truncate p-0 m-0">
                          {facility.name}
                        </h3>
                        <a className="text-zinc-900" href={`/facility/${facility.facility_id}/room`}>
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </a>
                        {facility.active_players > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                            <Users className="h-3 w-3" />
                            {facility.active_players} active
                          </span>
                        )}
                      </div>
                      {(facility.address || facility.country) && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {[facility.address, facility.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {userEmail === "marnelle24@gmail.com" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(facility)}
                            className="p-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            aria-label="Edit facility"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDelete(facility)}
                            className="p-1 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <X className="h-6 w-6" />
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
                  placeholder="e.g. City Sports Club"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="facility-join-token" className="block text-sm font-medium text-zinc-700 mb-1">
                  Custom QR Code (optional)
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
                disabled={isSubmitting || userEmail !== "marnelle24@gmail.com"}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : modal === "create" ? (
                  "Administrator Only"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal - only render after mount to avoid hydration mismatch with qrcode.react */}
      {mounted && modal === "qr" && qrFacility && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in animation-duration-200"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-xl mx-auto animate-in slide-in-from-bottom fade-in animation-duration-300">
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 id="qr-modal-title" className="text-lg font-semibold text-zinc-900">
                {qrFacility.name} QR Code
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 -mr-2 text-zinc-500 hover:text-zinc-700 rounded-lg"
                aria-label="Close"
              >
                <X className="h-6 w-6" />

              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {qrFacility.join_token ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <p className="font-normal text-zinc-900 text-xl">
                    Scan QR to enter the game room
                  </p>
                  <div className="p-2 bg-white rounded-xl border border-zinc-200">
                    <QRCodeSVG
                      key={qrFacility.facility_id}
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/facility/join?token=${encodeURIComponent(qrFacility.join_token)}`}
                      size={300}
                      level="M"
                    />
                  </div>
                  <div className="text-center space-y-1 w-full flex flex-col items-center">
                    <p className="text-xl text-zinc-500 font-mono italic text-center">
                      {qrFacility.join_token.length > 10
                        ? `${qrFacility.join_token.slice(0, 10)}...`
                        : qrFacility.join_token}
                      {/* add a copy to clipboard button */}
                      <button
                        onClick={() => {
                          if (qrFacility.join_token) {
                            navigator.clipboard.writeText(qrFacility.join_token);
                            showToast("Copied", "success", 500);
                          }
                        }}
                        className="text-zinc-500 hover:text-zinc-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <QrCode className="w-16 h-16 text-zinc-300 mx-auto" />
                  <div>
                    <p className="font-semibold text-zinc-900">{qrFacility.name}</p>
                    <p className="text-sm text-zinc-500 mt-2">
                      No join code set. Edit this facility to add a code, then the QR
                      code will appear here.
                    </p>
                  </div>
                </div>
              )}
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
