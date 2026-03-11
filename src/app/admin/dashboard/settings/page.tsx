"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseUser";

import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [clockInNotify, setClockInNotify] = useState<boolean>(false);
  const [leavesNotify, setLeavesNotify] = useState<boolean>(false);
  const [exemptionNotify, setExemptionNotify] = useState<boolean>(false);
  const [leaveEmail, setLeaveEmail] = useState<boolean>(false);
  const [exemptionEmail, setExemptionEmail] = useState<boolean>(false);

  useEffect(() => {
    setCurrentAdminId(1);
  }, []);

  const updateSetting = async (value: boolean) => {
    console.log("currentAdminId", currentAdminId);

    if (!currentAdminId) return;

    setClockInNotify(value);

    await supabase
      .from("admin_settings")
      .update({ clock_in_notification: value })
      .eq("admin_id", 1);
  };

  const updateLeavesNotify = async (value: boolean) => {
    setLeavesNotify(value);
    await supabase
      .from("admin_settings")
      .update({ leave_notification: value })
      .eq("admin_id", 1);
  };

  const updateExemptionNotify = async (value: boolean) => {
    setExemptionNotify(value);
    await supabase
      .from("admin_settings")
      .update({ exemption_notification: value })
      .eq("admin_id", 1);
  };

  const updateLeaveEmail = async (value: boolean) => {
    setLeaveEmail(value);
    await supabase
      .from("admin_settings")
      .update({ leave_email: value })
      .eq("admin_id", 1);
  };

  const updateExemptionEmail = async (value: boolean) => {
    setExemptionEmail(value);
    await supabase
      .from("admin_settings")
      .update({ exemption_email: value })
      .eq("admin_id", 1);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("clock_in_notification, leave_notification, exemption_notification, leave_email, exemption_email")
        .eq("admin_id", currentAdminId)
        .single();

      if (error) {
        console.error("Fetch settings error:", error);
        return;
      }

      if (data) {
        setClockInNotify(!!data.clock_in_notification);
        setLeavesNotify(!!data.leave_notification);
        setExemptionNotify(!!data.exemption_notification);
        setLeaveEmail(!!data.leave_email);
        setExemptionEmail(!!data.exemption_email);
      }
    };

    fetchSettings();
  }, [currentAdminId]);

  return (
    <div className="min-h-screen text-white  py-8">
      <div className="max-w-full mx-auto">
        <Card className="mb-4">
          <CardContent
            className="
      p-6
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between
    "
          >
            <div className="max-w-full sm:max-w-[80%]">
              <h3 className="text-black font-medium">
                Clock In / Clock Out Notifications
              </h3>
              <p className="text-sm text-gray-400">
                Receive alerts when employees clock in late, miss a punch, or
                successfully clock in/out.
              </p>
            </div>

            <div className="self-start sm:self-center">
              <Switch
                checked={clockInNotify}
                onCheckedChange={updateSetting}
              />
            </div>
          </CardContent>
        </Card>

        <Card className=" border mb-4">
          <CardContent
            className="
      p-6
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className=" text-black font-medium">Leave Notifications</h3>
              <p className="text-sm text-gray-400">
                Get notified when a leave request is submitted, approved, or
                rejected.
              </p>
            </div>
            <Switch checked={leavesNotify} onCheckedChange={updateLeavesNotify} />
          </CardContent>
        </Card>

        <Card className=" border mb-4">
          <CardContent
            className="
      p-6
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className=" text-black font-medium">Exemption Notifications</h3>
              <p className="text-sm text-gray-400">
                Get notified when a clock-in/out exemption is requested.
              </p>
            </div>
            <Switch checked={exemptionNotify} onCheckedChange={updateExemptionNotify} />
          </CardContent>
        </Card>

        <Card className=" border mb-4">
          <CardContent
            className="
      p-6
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className=" text-black font-medium">Leave Email Notifications</h3>
              <p className="text-sm text-gray-400">
                Receive an email when a leave request is submitted.
              </p>
            </div>
            <Switch checked={leaveEmail} onCheckedChange={updateLeaveEmail} />
          </CardContent>
        </Card>

        <Card className=" border ">
          <CardContent
            className="
      p-6
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className=" text-black font-medium">Exemption Email Notifications</h3>
              <p className="text-sm text-gray-400">
                Receive an email when an exemption is requested.
              </p>
            </div>
            <Switch checked={exemptionEmail} onCheckedChange={updateExemptionEmail} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
