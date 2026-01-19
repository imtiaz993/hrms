"use client";

import { useEffect, useRef, useState } from "react";
import { Employee } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";

interface ProfilePopupProps {
  employee: Employee;
  onClose: () => void;
  onChangePassword: () => void;
}

export function ProfilePopup({ employee, onClose }: ProfilePopupProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => setScrolled(el.scrollTop > 2);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const fullName = `${employee.first_name ?? ""} ${
    employee.last_name ?? ""
  }`.trim();
  const initials =
    (employee.first_name?.[0] ?? "").toUpperCase() +
    (employee.last_name?.[0] ?? "").toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-x-hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full items-end sm:items-center justify-center p-0 sm:p-4 overflow-x-scroll">
        <Card className="w-screen max-w-[100vw] sm:w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-scroll rounded-t-2xl sm:rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
          <div className="sm:hidden flex justify-center pt-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          <CardHeader
            className={[
              "sticky top-0 z-10 border-b border-slate-100 bg-white/95",
              "px-4 py-3 sm:px-6 sm:py-4",
              scrolled ? "shadow-sm" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Personal Information
              </CardTitle>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-600" />
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                {initials || "?"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {fullName || "—"}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {employee.email ?? "—"}
                </div>
              </div>
            </div>
          </CardHeader>

          <div
            ref={scrollerRef}
            className="overflow-y-auto overflow-x-hidden bg-slate-50/40"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            }}
          >
            <CardContent className="space-y-5 px-4 pb-6 pt-4 sm:px-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={fullName || "—"}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={employee.email || "—"}
                />
                {employee.phone_number && (
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={employee.phone_number}
                  />
                )}
                {employee.address && (
                  <InfoRow
                    icon={MapPin}
                    label="Address"
                    value={employee.address}
                  />
                )}
                <InfoRow
                  icon={Briefcase}
                  label="Designation"
                  value={employee.designation || "—"}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Department"
                  value={employee.department || "—"}
                />
                {employee.date_of_birth && (
                  <InfoRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={employee.date_of_birth}
                  />
                )}
                <InfoRow
                  icon={Calendar}
                  label="Join Date"
                  value={employee.join_date || "—"}
                />
                {employee.employee_id && (
                  <InfoRow
                    icon={User}
                    label="Employee ID"
                    value={employee.employee_id}
                  />
                )}
                {employee.employment_type && (
                  <InfoRow
                    icon={Briefcase}
                    label="Employment Type"
                    value={employee.employment_type.replace("_", " ")}
                  />
                )}
              </div>

              {employee.emergency_contact_name && (
                <section className="rounded-2xl border border-slate-100 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Emergency Contact
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <MiniInfo
                      label="Name"
                      value={employee.emergency_contact_name}
                    />
                    {employee.emergency_contact_relation && (
                      <MiniInfo
                        label="Relation"
                        value={employee.emergency_contact_relation}
                      />
                    )}
                    {employee.emergency_contact_phone && (
                      <MiniInfo
                        label="Phone"
                        value={employee.emergency_contact_phone}
                      />
                    )}
                  </div>
                </section>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

type InfoRowProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
};

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-white border border-slate-100 p-3">
      <div className="mt-0.5 rounded-full bg-slate-50 p-2">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 break-words [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 break-words [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}
