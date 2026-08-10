"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerNav from "@/components/OwnerNav";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import Spinner from "@/components/Spinner";
import {
  inputClass,
  primaryButtonClass,
  cardClass,
  cardAccentBarClass,
  cardTopBorderClass,
  listRowHoverClass,
  emptyStateClass,
} from "@/lib/ui";
import {
  IconLink,
  IconBell,
  IconBuilding,
  IconTag,
  IconUsers,
  IconLock,
  IconImage,
  IconQuestion,
  IconCalendarX,
} from "@/components/icons";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { settingsCopy } from "@/lib/settingsPageTranslations";

const ROOT_DOMAIN = "maw3edapp.com";

type Service = { id: string; name: string; durationMinutes: number; priceUsd: number | null };
type Employee = { id: string; name: string };
type GalleryPhoto = { id: string; url: string };
type Faq = { id: string; question: string; answer: string };
type ScheduleException = { id: string; date: string; startTime: string | null; endTime: string | null; note: string | null };
type Business = {
  name: string;
  slug: string;
  startHour: number;
  endHour: number;
  services: Service[];
  employees: Employee[];
  offDays: number[];
  about: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  ownerPhone: string;
  allowEmployeeChoice: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
  gallery: GalleryPhoto[];
  faqs: Faq[];
};

const DEFAULT_ACCENT_COLOR = "#b5654f";

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6];

function formatHour(h: number) {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function SettingsPage() {
  const [lang, setLang] = useOwnerLang();
  const t = settingsCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [basicInfoSaved, setBasicInfoSaved] = useState(false);

  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceDuration, setEditServiceDuration] = useState(30);
  const [editServicePrice, setEditServicePrice] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [savingEmployeeChoice, setSavingEmployeeChoice] = useState(false);

  const [about, setAbout] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [scheduleExceptions, setScheduleExceptions] = useState<ScheduleException[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionAllDay, setNewExceptionAllDay] = useState(true);
  const [newExceptionStart, setNewExceptionStart] = useState("");
  const [newExceptionEnd, setNewExceptionEnd] = useState("");
  const [newExceptionNote, setNewExceptionNote] = useState("");
  const [addingException, setAddingException] = useState(false);
  const [removingExceptionId, setRemovingExceptionId] = useState<string | null>(null);

  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [addingFaq, setAddingFaq] = useState(false);
  const [removingFaqId, setRemovingFaqId] = useState<string | null>(null);

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
        setHasBreak(!!(data.business.breakStartTime && data.business.breakEndTime));
        setBreakStart(data.business.breakStartTime ?? "13:00");
        setBreakEnd(data.business.breakEndTime ?? "14:00");
        setAbout(data.business.about ?? "");
        setAccentColor(data.business.accentColor ?? DEFAULT_ACCENT_COLOR);
        setOwnerPhone(data.business.ownerPhone ?? "");
      });
  }

  function loadExceptions() {
    fetch("/api/business/schedule-exceptions")
      .then((r) => r.json())
      .then((data) => setScheduleExceptions(data.exceptions ?? []));
  }

  useEffect(() => {
    loadBusiness();
    loadExceptions();
  }, []);

  async function saveBasicInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingBasicInfo(true);
    setBasicInfoSaved(false);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerPhone }),
      });
      loadBusiness();
      setBasicInfoSaved(true);
    } finally {
      setSavingBasicInfo(false);
    }
  }

  async function saveHours(e: React.FormEvent) {
    e.preventDefault();
    if (hasBreak && breakEnd <= breakStart) {
      setHoursError(t.breakEndBeforeStart);
      return;
    }
    setHoursError(null);
    setSavingHours(true);
    setHoursSaved(false);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startHour,
          endHour,
          offDays,
          breakStartTime: hasBreak ? breakStart : null,
          breakEndTime: hasBreak ? breakEnd : null,
        }),
      });
      loadBusiness();
      setHoursSaved(true);
    } finally {
      setSavingHours(false);
    }
  }

  function toggleOffDay(day: number) {
    setOffDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    setHoursSaved(false);
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    setAddingService(true);
    try {
      const priceUsd = newServicePrice.trim() === "" ? null : Number(newServicePrice);
      await fetch("/api/business/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newServiceName, durationMinutes: newServiceDuration, priceUsd }),
      });
      setNewServiceName("");
      setNewServiceDuration(30);
      setNewServicePrice("");
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

  function startEditService(s: Service) {
    setEditingServiceId(s.id);
    setEditServiceName(s.name);
    setEditServiceDuration(s.durationMinutes);
    setEditServicePrice(s.priceUsd !== null ? String(s.priceUsd) : "");
  }

  async function saveEditService(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!editServiceName.trim()) return;
    setSavingEditId(id);
    try {
      const priceUsd = editServicePrice.trim() === "" ? null : Number(editServicePrice);
      await fetch(`/api/business/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editServiceName, durationMinutes: editServiceDuration, priceUsd }),
      });
      setEditingServiceId(null);
      loadBusiness();
    } finally {
      setSavingEditId(null);
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

  async function toggleAllowEmployeeChoice(checked: boolean) {
    setSavingEmployeeChoice(true);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowEmployeeChoice: checked }),
      });
      loadBusiness();
    } finally {
      setSavingEmployeeChoice(false);
    }
  }

  async function saveAbout(e: React.FormEvent) {
    e.preventDefault();
    setSavingAbout(true);
    setAboutSaved(false);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about, accentColor }),
      });
      loadBusiness();
      setAboutSaved(true);
    } finally {
      setSavingAbout(false);
    }
  }

  async function uploadPhoto(file: File, kind: "hero" | "gallery" | "logo") {
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(t.uploadTooLarge);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError(t.uploadUnsupportedType);
      return;
    }
    const setUploading = kind === "hero" ? setUploadingHero : kind === "logo" ? setUploadingLogo : setUploadingGallery;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const res = await fetch("/api/business/upload", { method: "POST", body: formData });
      if (!res.ok) {
        setPhotoError(t.uploadFailed);
        return;
      }
      loadBusiness();
    } finally {
      setUploading(false);
    }
  }

  async function removeGalleryPhoto(id: string) {
    setRemovingPhotoId(id);
    try {
      await fetch(`/api/business/gallery/${id}`, { method: "DELETE" });
      loadBusiness();
    } finally {
      setRemovingPhotoId(null);
    }
  }

  async function removeLogo() {
    setRemovingLogo(true);
    try {
      await fetch("/api/business/logo", { method: "DELETE" });
      loadBusiness();
    } finally {
      setRemovingLogo(false);
    }
  }

  async function addException(e: React.FormEvent) {
    e.preventDefault();
    if (!newExceptionDate) return;
    if (!newExceptionAllDay && (!newExceptionStart || !newExceptionEnd)) return;
    setAddingException(true);
    try {
      await fetch("/api/business/schedule-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newExceptionDate,
          startTime: newExceptionAllDay ? null : newExceptionStart,
          endTime: newExceptionAllDay ? null : newExceptionEnd,
          note: newExceptionNote.trim() || null,
        }),
      });
      setNewExceptionDate("");
      setNewExceptionAllDay(true);
      setNewExceptionStart("");
      setNewExceptionEnd("");
      setNewExceptionNote("");
      loadExceptions();
    } finally {
      setAddingException(false);
    }
  }

  async function removeException(id: string) {
    setRemovingExceptionId(id);
    try {
      await fetch(`/api/business/schedule-exceptions/${id}`, { method: "DELETE" });
      loadExceptions();
    } finally {
      setRemovingExceptionId(null);
    }
  }

  async function addFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setAddingFaq(true);
    try {
      await fetch("/api/business/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newFaqQuestion, answer: newFaqAnswer }),
      });
      setNewFaqQuestion("");
      setNewFaqAnswer("");
      loadBusiness();
    } finally {
      setAddingFaq(false);
    }
  }

  async function removeFaq(id: string) {
    setRemovingFaqId(id);
    try {
      await fetch(`/api/business/faqs/${id}`, { method: "DELETE" });
      loadBusiness();
    } finally {
      setRemovingFaqId(null);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordChanged(false);
    if (newPassword.length < 8) {
      setPasswordError(t.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordsDontMatch);
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
        setPasswordError(data.error === "incorrect_password" ? t.incorrectPassword : t.genericError);
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
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-4xl">
        <OwnerNav current="settings" lang={lang} onToggleLang={() => setLang(lang === "en" ? "ar" : "en")} />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">{t.title}</h1>

        {!business ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <Spinner />
            {t.loading}
          </div>
        ) : (
          <>
            <div className="mt-8">
              <h2 className="text-base font-semibold text-zinc-900">{t.sectionBookingPage}</h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t.sectionBookingPageBody}</p>
            </div>

            <div className={`mt-4 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconLink className="h-4 w-4 text-zinc-500" />
                  {t.bookingPageTitle}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">{t.bookingPageBody}</p>
                <div className="mt-3 flex items-center gap-2">
                  <code dir="ltr" className="flex-1 truncate rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200">
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
                    {linkCopied ? t.copied : t.copyLink}
                  </button>
                </div>
                <Link
                  href={`https://${business.slug}.${ROOT_DOMAIN}`}
                  target="_blank"
                  className="mt-2 inline-block text-sm font-medium text-zinc-600 underline"
                >
                  {t.openBookingPage}
                </Link>
              </div>
            </div>

            <form onSubmit={saveBasicInfo} className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="flex flex-col gap-3 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconBuilding className="h-4 w-4 text-zinc-500" />
                  {t.basicInfoTitle}
                </h3>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.businessName}
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setBasicInfoSaved(false);
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.ownerPhoneLabel}
                  <input
                    type="tel"
                    placeholder={t.ownerPhonePlaceholder}
                    value={ownerPhone}
                    onChange={(e) => {
                      setOwnerPhone(e.target.value);
                      setBasicInfoSaved(false);
                    }}
                    className={inputClass}
                  />
                  <span className="text-xs text-zinc-400">{t.ownerPhoneHint}</span>
                </label>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={savingBasicInfo} className={primaryButtonClass}>
                    {savingBasicInfo ? t.saving : t.save}
                  </button>
                  {basicInfoSaved && <span className="text-sm font-medium text-green-700">{t.saved}</span>}
                </div>
              </div>
            </form>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCalendarX className="h-4 w-4 text-zinc-500" />
                  {t.hoursAvailabilityTitle}
                </h3>

                <form onSubmit={saveHours} className="mt-3 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                      {t.opensAt}
                      <select
                        value={startHour}
                        onChange={(e) => {
                          setStartHour(Number(e.target.value));
                          setHoursSaved(false);
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
                      {t.closesAt}
                      <select
                        value={endHour}
                        onChange={(e) => {
                          setEndHour(Number(e.target.value));
                          setHoursSaved(false);
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
                    {t.closedOn}
                    <div className="flex flex-wrap gap-3">
                      {WEEKDAY_VALUES.map((value) => (
                        <label key={value} className="flex items-center gap-1.5 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            checked={offDays.includes(value)}
                            onChange={() => toggleOffDay(value)}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                          {t.weekdays[value]}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
                    <label className="flex items-center gap-1.5 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={hasBreak}
                        onChange={(e) => {
                          setHasBreak(e.target.checked);
                          setHoursSaved(false);
                          setHoursError(null);
                        }}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {t.dailyBreakLabel}
                    </label>
                    <p className="text-xs text-zinc-400">{t.dailyBreakHint}</p>
                    {hasBreak && (
                      <div className="flex gap-3">
                        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                          {t.fromLabel}
                          <input
                            type="time"
                            required
                            value={breakStart}
                            onChange={(e) => {
                              setBreakStart(e.target.value);
                              setHoursSaved(false);
                              setHoursError(null);
                            }}
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                          {t.toLabel}
                          <input
                            type="time"
                            required
                            value={breakEnd}
                            onChange={(e) => {
                              setBreakEnd(e.target.value);
                              setHoursSaved(false);
                              setHoursError(null);
                            }}
                            className={inputClass}
                          />
                        </label>
                      </div>
                    )}
                    {hoursError && <p className="text-sm text-red-600">{hoursError}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={savingHours} className={primaryButtonClass}>
                      {savingHours ? t.saving : t.save}
                    </button>
                    {hoursSaved && <span className="text-sm font-medium text-green-700">{t.saved}</span>}
                  </div>
                </form>

                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-medium text-zinc-700">{t.timeOffTitle}</p>
                  <p className="mt-1 text-xs text-zinc-500">{t.timeOffBody}</p>

                  <ul className="mt-3 flex flex-col gap-2">
                    {scheduleExceptions.map((ex) => (
                      <li
                        key={ex.id}
                        className={`flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                      >
                        <span className="text-zinc-700">
                          {ex.startTime && ex.endTime
                            ? t.exceptionBusyRange(ex.date, ex.startTime, ex.endTime)
                            : t.exceptionClosedAllDay(ex.date)}
                          {ex.note && <span className="text-zinc-400"> — {ex.note}</span>}
                        </span>
                        <button
                          onClick={() => removeException(ex.id)}
                          disabled={removingExceptionId === ex.id}
                          className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {removingExceptionId === ex.id ? t.removing : t.remove}
                        </button>
                      </li>
                    ))}
                    {scheduleExceptions.length === 0 && <li className={emptyStateClass}>{t.noExceptionsYet}</li>}
                  </ul>

                  <form onSubmit={addException} className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-sm text-zinc-600">
                      {t.dateLabel}
                      <input
                        type="date"
                        required
                        value={newExceptionDate}
                        onChange={(e) => setNewExceptionDate(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={newExceptionAllDay}
                        onChange={(e) => setNewExceptionAllDay(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {t.allDayLabel}
                    </label>
                    {!newExceptionAllDay && (
                      <div className="flex gap-3">
                        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                          {t.fromLabel}
                          <input
                            type="time"
                            required
                            value={newExceptionStart}
                            onChange={(e) => setNewExceptionStart(e.target.value)}
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                          {t.toLabel}
                          <input
                            type="time"
                            required
                            value={newExceptionEnd}
                            onChange={(e) => setNewExceptionEnd(e.target.value)}
                            className={inputClass}
                          />
                        </label>
                      </div>
                    )}
                    <label className="flex flex-col gap-1 text-sm text-zinc-600">
                      {t.exceptionNoteLabel}
                      <input
                        placeholder={t.exceptionNotePlaceholder}
                        value={newExceptionNote}
                        onChange={(e) => setNewExceptionNote(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <button type="submit" disabled={addingException} className={`self-start ${primaryButtonClass}`}>
                      {addingException ? t.adding : t.addException}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconTag className="h-4 w-4 text-zinc-500" />
                {t.servicesTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">{t.servicesBody}</p>

              <ul className="mt-3 flex flex-col gap-2">
                {business.services.map((s) =>
                  editingServiceId === s.id ? (
                    <li key={s.id} className="rounded-lg bg-zinc-50 px-3 py-3">
                      <form
                        onSubmit={(e) => saveEditService(e, s.id)}
                        className="flex flex-col gap-3 sm:flex-row sm:items-end"
                      >
                        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                          {t.serviceName}
                          <input
                            required
                            value={editServiceName}
                            onChange={(e) => setEditServiceName(e.target.value)}
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-zinc-600">
                          {t.duration}
                          <select
                            value={editServiceDuration}
                            onChange={(e) => setEditServiceDuration(Number(e.target.value))}
                            className={inputClass}
                          >
                            {DURATION_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {t.durationMin(d)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-zinc-600">
                          {t.price}
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder={t.pricePlaceholder}
                            value={editServicePrice}
                            onChange={(e) => setEditServicePrice(e.target.value)}
                            className={`${inputClass} sm:w-24`}
                          />
                        </label>
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingEditId === s.id} className={primaryButtonClass}>
                            {savingEditId === s.id ? t.saving : t.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="rounded-full px-3 py-2 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 hover:bg-zinc-100"
                          >
                            {t.cancelEdit}
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                    >
                      <span className="text-zinc-700">
                        {s.name}{" "}
                        <span className="text-zinc-400">
                          — {t.durationMin(s.durationMinutes)}
                          {s.priceUsd !== null ? ` · ${t.priceTag(s.priceUsd)}` : ""}
                        </span>
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => startEditService(s)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-300 transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-100 active:scale-95"
                        >
                          {t.edit}
                        </button>
                        <button
                          onClick={() => removeService(s.id)}
                          disabled={removingId === s.id}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {removingId === s.id ? t.removing : t.remove}
                        </button>
                      </div>
                    </li>
                  )
                )}
                {business.services.length === 0 && (
                  <li className={emptyStateClass}>{t.noServicesYet}</li>
                )}
              </ul>

              <form onSubmit={addService} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  {t.serviceName}
                  <input
                    required
                    placeholder={t.serviceNamePlaceholder}
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.duration}
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className={inputClass}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {t.durationMin(d)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.price}
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={t.pricePlaceholder}
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className={`${inputClass} sm:w-24`}
                  />
                </label>
                <button
                  type="submit"
                  disabled={addingService}
                  className={primaryButtonClass}
                >
                  {addingService ? t.adding : t.addService}
                </button>
              </form>
              </div>
            </div>

            <form onSubmit={saveAbout} className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="flex flex-col gap-3 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconImage className="h-4 w-4 text-zinc-500" />
                  {t.aboutPhotosTitle}
                </h3>
                <p className="text-xs text-zinc-500">{t.aboutPhotosBody}</p>

                <label className="flex items-center gap-3 text-sm text-zinc-600">
                  {t.accentColorLabel}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setAboutSaved(false);
                    }}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.aboutLabel}
                  <textarea
                    rows={3}
                    placeholder={t.aboutPlaceholder}
                    value={about}
                    onChange={(e) => {
                      setAbout(e.target.value);
                      setAboutSaved(false);
                    }}
                    className={inputClass}
                  />
                </label>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={savingAbout} className={primaryButtonClass}>
                    {savingAbout ? t.saving : t.save}
                  </button>
                  {aboutSaved && <span className="text-sm font-medium text-green-700">{t.saved}</span>}
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm text-zinc-600">{t.logoLabel}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {business.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logoUrl}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover ring-1 ring-zinc-200"
                      />
                    )}
                    <label className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100">
                      {uploadingLogo ? t.uploading : business.logoUrl ? t.replacePhoto : t.uploadPhoto}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingLogo}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(file, "logo");
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                    {business.logoUrl && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        disabled={removingLogo}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {removingLogo ? t.removing : t.remove}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm text-zinc-600">{t.heroPhotoLabel}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {business.heroImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.heroImageUrl}
                        alt=""
                        className="h-16 w-24 rounded-lg object-cover ring-1 ring-zinc-200"
                      />
                    )}
                    <label className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100">
                      {uploadingHero ? t.uploading : business.heroImageUrl ? t.replacePhoto : t.uploadPhoto}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingHero}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(file, "hero");
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm text-zinc-600">{t.galleryLabel}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {business.gallery.map((photo) => (
                      <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(photo.id)}
                          disabled={removingPhotoId === photo.id}
                          className="absolute end-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-red-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 disabled:opacity-50"
                        >
                          {removingPhotoId === photo.id ? t.removing : t.remove}
                        </button>
                      </div>
                    ))}
                  </div>
                  {business.gallery.length === 0 && <p className={`mt-2 ${emptyStateClass}`}>{t.noGalleryYet}</p>}
                  <label className="mt-3 inline-block cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100">
                    {uploadingGallery ? t.uploading : t.addPhoto}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingGallery}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhoto(file, "gallery");
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoError && <p className="text-sm text-red-600">{photoError}</p>}
              </div>
            </form>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconQuestion className="h-4 w-4 text-zinc-500" />
                  {t.faqTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{t.faqBody}</p>

                <ul className="mt-3 flex flex-col gap-2">
                  {business.faqs.map((faq) => (
                    <li
                      key={faq.id}
                      className={`flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                    >
                      <div>
                        <p className="font-medium text-zinc-800">{faq.question}</p>
                        <p className="mt-0.5 text-zinc-500">{faq.answer}</p>
                      </div>
                      <button
                        onClick={() => removeFaq(faq.id)}
                        disabled={removingFaqId === faq.id}
                        className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {removingFaqId === faq.id ? t.removing : t.remove}
                      </button>
                    </li>
                  ))}
                  {business.faqs.length === 0 && <li className={emptyStateClass}>{t.noFaqsYet}</li>}
                </ul>

                <form onSubmit={addFaq} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
                  <label className="flex flex-col gap-1 text-sm text-zinc-600">
                    {t.question}
                    <input
                      placeholder={t.questionPlaceholder}
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-600">
                    {t.answer}
                    <input
                      placeholder={t.answerPlaceholder}
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button type="submit" disabled={addingFaq} className={primaryButtonClass}>
                    {addingFaq ? t.adding : t.addFaq}
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-base font-semibold text-zinc-900">{t.sectionAccountOps}</h2>
              <p className="mt-0.5 text-xs text-zinc-500">{t.sectionAccountOpsBody}</p>
            </div>

            <div className={`mt-4 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconUsers className="h-4 w-4 text-zinc-500" />
                {t.employeesTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">{t.employeesBody}</p>

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
                      {removingEmployeeId === emp.id ? t.removing : t.remove}
                    </button>
                  </li>
                ))}
                {business.employees.length === 0 && (
                  <li className={emptyStateClass}>{t.noEmployeesYet}</li>
                )}
              </ul>

              <form onSubmit={addEmployee} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  {t.employeeName}
                  <input
                    required
                    placeholder={t.employeeNamePlaceholder}
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
                  {addingEmployee ? t.adding : t.addEmployee}
                </button>
              </form>

              {business.employees.length > 1 && (
                <label className="mt-4 flex items-start gap-2 border-t border-zinc-100 pt-4 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={business.allowEmployeeChoice}
                    disabled={savingEmployeeChoice}
                    onChange={(e) => toggleAllowEmployeeChoice(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                  />
                  <span>
                    {t.allowEmployeeChoiceLabel}
                    <span className="block text-xs text-zinc-400">{t.allowEmployeeChoiceHint}</span>
                  </span>
                </label>
              )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconBell className="h-4 w-4 text-zinc-500" />
                  {t.notificationsTitle}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">{t.notificationsBody}</p>
                <div className="mt-3">
                  <PushNotificationSettings />
                </div>
              </div>
            </div>

            <form onSubmit={changePassword} className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="flex flex-col gap-3 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconLock className="h-4 w-4 text-zinc-500" />
                {t.changePasswordTitle}
              </h3>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                {t.currentPassword}
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
                {t.newPassword}
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
                {t.confirmNewPassword}
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
                  {changingPassword ? t.saving : t.changePassword}
                </button>
                {passwordChanged && <span className="text-sm font-medium text-green-700">{t.passwordChanged}</span>}
              </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
