"use client";

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
import { cn } from "@/lib/utils";

interface ProfilePopupProps {
  employee: Employee;
  onClose: () => void;
  onChangePassword: () => void;
}

export function ProfilePopup({
  employee,
  onClose,
  onChangePassword,
}: ProfilePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto  overflow-x-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
        <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-slate-100 bg-white/95 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Personal Information
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow
              icon={User}
              label="Full Name"
              value={`${employee.first_name} ${employee.last_name}`}
            />

            <InfoRow icon={Mail} label="Email" value={employee.email} />

            {employee.phone_number && (
              <InfoRow
                icon={Phone}
                label="Phone"
                value={employee.phone_number}
              />
            )}

            {employee.address && (
              <InfoRow icon={MapPin} label="Address" value={employee.address} />
            )}

            <InfoRow
              icon={Briefcase}
              label="Designation"
              value={employee.designation}
            />

            <InfoRow
              icon={Briefcase}
              label="Department"
              value={employee.department}
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
              value={employee.join_date}
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
            <section className="mt-2 border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <div className="border-t border-slate-100 pt-5">
            {/* <Button
              onClick={onChangePassword}
              className="w-full rounded-xl"
              size="lg"
            >
              Change Password
            </Button> */}
          </div>
        </CardContent>
      </Card>
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
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50/60 p-3">
      <div className="mt-1 rounded-full bg-white p-2 shadow-sm">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-900 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-900 break-words">
        {value}
      </p>
    </div>
  );
}
