"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerNav from "@/components/OwnerNav";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass, listRowHoverClass } from "@/lib/ui";

const ROOT_DOMAIN = "maw3edapp.com";

type Service = { id: string; name: string; durationMinutes: number };
type Employee = { id: string; name: string };
type Business = {
  name: string;
  slug: string;
  startHour: number;
  endHour: number;
  services: Service[];
  employees: Employee[];
  offDays: number[];
};

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatHour(h: number) {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [addingService, setAddingService] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  function loadBusiness() {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        setBusiness(data.business);
        setName(data.business.name);
        setStartHour(data.business.startHour);
        setEndHour(data.business.endHour);
        setOffDays(data.business.offDays);
      });
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsSaved(false);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startHour, endHour, offDays }),
      });
      loadBusiness();
      setDetailsSaved(true);
    } finally {
      setSavingDetails(false);
    }
  }

  function toggleOffDay(day: number) {
    setOffDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    setDetailsSaved(false);
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    setAddingService(true);
    try {
      await fetch("/api/business/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newServiceName, durationMinutes: newServiceDuration }),
      });
      setNewServiceName("");
      setNewServiceDuration(30);
      loadBusiness();
    } finally {
      setAddingService(false);
    }
  }

  async function removeService(id: string) {
    setRemovingId(id);
    try {
      await fetch(`/api/business/services/${id}`, { method: "DELETE" });
      loadBusiness();
    } finally {
      setRemovingId(null);
    }
  }

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;
    setAddingEmployee(true);
    try {
      await fetch("/api/business/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEmployeeName }),
      });
      setNewEmployeeName("");
      loadBusiness();
    } finally {
      setAddingEmployee(false);
    }
  }

  async function removeEmployee(id: string) {
    setRemovingEmployeeId(id);
    try {
      await fetch(`/api/business/employees/${id}`, { method: "DELETE" });
      loadBusiness();
    } finally {
      setRemovingEmployeeId(null);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordChanged(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/owner/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPasswordError(
          data.error === "incorrect_password" ? "Current password is incorrect." : "Something went wrong."
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <OwnerNav current="settings" />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Settings</h1>

        {!business ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : (
          <>
            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="text-sm font-semibold text-zinc-800">Your booking page</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  This is the link to share with customers — send it on WhatsApp, Instagram, or
                  anywhere else. Anyone who opens it can book an appointment directly.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200">
                    {business.slug}.{ROOT_DOMAIN}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${business.slug}.${ROOT_DOMAIN}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className={primaryButtonClass}
                  >
                    {linkCopied ? "Copied!" : "Copy link"}
                  </button>
                </div>
                <Link
                  href={`https://${business.slug}.${ROOT_DOMAIN}`}
                  target="_blank"
                  className="mt-2 inline-block text-sm font-medium text-zinc-600 underline"
                >
                  Open booking page →
                </Link>
              </div>
            </div>

            <form onSubmit={saveDetails} className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="flex flex-col gap-3 p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Business Details</h2>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Business name
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDetailsSaved(false);
                  }}
                  className={inputClass}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  Opens at
                  <select
                    value={startHour}
                    onChange={(e) => {
                      setStartHour(Number(e.target.value));
                      setDetailsSaved(false);
                    }}
                    className={inputClass}
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  Closes at
                  <select
                    value={endHour}
                    onChange={(e) => {
                      setEndHour(Number(e.target.value));
                      setDetailsSaved(false);
                    }}
                    className={inputClass}
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-1 text-sm text-zinc-600">
                Closed on
                <div className="flex flex-wrap gap-3">
                  {WEEKDAYS.map((w) => (
                    <label key={w.value} className="flex items-center gap-1.5 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={offDays.includes(w.value)}
                        onChange={() => toggleOffDay(w.value)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {w.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingDetails}
                  className={primaryButtonClass}
                >
                  {savingDetails ? "Saving..." : "Save"}
                </button>
                {detailsSaved && <span className="text-sm font-medium text-green-700">Saved.</span>}
              </div>
              </div>
            </form>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Services</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Each service has its own duration — customers pick one before choosing a time.
              </p>

              <ul className="mt-3 flex flex-col gap-2">
                {business.services.map((s) => (
                  <li
                    key={s.id}
                    className={`flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                  >
                    <span className="text-zinc-700">
                      {s.name} <span className="text-zinc-400">— {s.durationMinutes} min</span>
                    </span>
                    <button
                      onClick={() => removeService(s.id)}
                      disabled={removingId === s.id}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {removingId === s.id ? "..." : "Remove"}
                    </button>
                  </li>
                ))}
                {business.services.length === 0 && (
                  <li className="text-sm text-zinc-400">No services yet — add one below.</li>
                )}
              </ul>

              <form onSubmit={addService} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  Service name
                  <input
                    required
                    placeholder="e.g. Haircut"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  Duration
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className={inputClass}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={addingService}
                  className={primaryButtonClass}
                >
                  {addingService ? "Adding..." : "Add service"}
                </button>
              </form>
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Employees</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Bookings are automatically assigned to whichever employee is free at that time.
              </p>

              <ul className="mt-3 flex flex-col gap-2">
                {business.employees.map((emp) => (
                  <li
                    key={emp.id}
                    className={`flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                  >
                    <span className="text-zinc-700">{emp.name}</span>
                    <button
                      onClick={() => removeEmployee(emp.id)}
                      disabled={removingEmployeeId === emp.id}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {removingEmployeeId === emp.id ? "..." : "Remove"}
                    </button>
                  </li>
                ))}
                {business.employees.length === 0 && (
                  <li className="text-sm text-zinc-400">No employees yet — add one below.</li>
                )}
              </ul>

              <form onSubmit={addEmployee} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  Employee name
                  <input
                    required
                    placeholder="e.g. Sarah"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className={primaryButtonClass}
                >
                  {addingEmployee ? "Adding..." : "Add employee"}
                </button>
              </form>
              </div>
            </div>

            <form onSubmit={changePassword} className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="flex flex-col gap-3 p-4">
              <h2 className="text-sm font-semibold text-zinc-800">Change password</h2>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Current password
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordChanged(false);
                  }}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordChanged(false);
                  }}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Confirm new password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordChanged(false);
                  }}
                  className={inputClass}
                />
              </label>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={primaryButtonClass}
                >
                  {changingPassword ? "Saving..." : "Change password"}
                </button>
                {passwordChanged && <span className="text-sm font-medium text-green-700">Password changed.</span>}
              </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
