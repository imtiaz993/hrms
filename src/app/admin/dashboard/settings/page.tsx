"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseUser";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [clockInNotify, setClockInNotify] = useState<boolean>(false);
  const [leavesNotify, setLeavesNotify] = useState<boolean>(false);
  const [exemptionNotify, setExemptionNotify] = useState<boolean>(false);
  const [leaveEmail, setLeaveEmail] = useState<boolean>(false);
  const [exemptionEmail, setExemptionEmail] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("*")
          .eq("admin_id", 1)
          .single();

        if (error) {
          console.error("Fetch settings error:", error.message);
        }

        if (data) {
          console.log("Settings loaded from DB:", data);
          setClockInNotify(!!data.clock_in_notification);
          setLeavesNotify(!!data.leave_notification);
          setExemptionNotify(!!data.exemption_notification);
          setLeaveEmail(!!data.leave_email);
          setExemptionEmail(!!data.exemption_email);
        }
      } catch (err) {
        console.error("Unexpected error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = async (column: string, value: boolean, setter: (val: boolean) => void) => {
    // Optimistic update
    setter(value);

    const { error } = await supabase
      .from("admin_settings")
      .update({ [column]: value })
      .eq("admin_id", 1);

    if (error) {
      console.error(`Update failed for ${column}:`, error.message);
      // Revert UI if database update fails
      setter(!value);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Fetching your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 max-w-full sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Notification Settings</h1>

        <div className="grid max-w-full gap-6">
          {/* Clock In / Clock Out */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Clock In / Clock Out Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive real-time alerts for employee attendance activities.
                </p>
              </div>
              <Switch
                checked={clockInNotify}
                onCheckedChange={(val) => handleToggle("clock_in_notification", val, setClockInNotify)}
              />
            </CardContent>
          </Card>

          {/* Leave Notifications */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Leave Notifications</h3>
                <p className="text-sm text-gray-500">
                  Get notified on your mobile device when leave requests are submitted.
                </p>
              </div>
              <Switch
                checked={leavesNotify}
                onCheckedChange={(val) => handleToggle("leave_notification", val, setLeavesNotify)}
              />
            </CardContent>
          </Card>

          {/* Exemption Notifications */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Exemption Notifications</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase">New</span>
                </div>
                <p className="text-sm text-gray-500">
                  Stay updated with incoming exemption requests via push notifications.
                </p>
              </div>
              <Switch
                checked={exemptionNotify}
                onCheckedChange={(val) => handleToggle("exemption_notification", val, setExemptionNotify)}
              />
            </CardContent>
          </Card>

          {/* Leave Email */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Email Alerts</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Email</span>
                </div>
                <p className="text-sm text-gray-500">
                  Receive a detailed summary of every leave application in your inbox.
                </p>
              </div>
              <Switch
                checked={leaveEmail}
                onCheckedChange={(val) => handleToggle("leave_email", val, setLeaveEmail)}
              />
            </CardContent>
          </Card>

          {/* Exemption Email */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Exemption Email Alerts</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Email</span>
                </div>
                <p className="text-sm text-gray-500">
                  Receive comprehensive exemption request details via email.
                </p>
              </div>
              <Switch
                checked={exemptionEmail}
                onCheckedChange={(val) => handleToggle("exemption_email", val, setExemptionEmail)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
