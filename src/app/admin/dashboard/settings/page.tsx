"use client";
import { useState,useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseUser";

import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [clockInNotify, setClockInNotify] = useState(false);
  const[leavesNotify, setleavesNotify]=useState(false)


  useEffect(() => {
  const getAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setCurrentAdminId(user.id);
    }
  };

  getAdmin();
}, []);


  const updateSetting = async (value: boolean) => {
    setClockInNotify(value);

    await supabase
      .from("admin_settings")
      .update({ clock_in_notification: value })
      .eq("admin_id", currentAdminId)

  };

  const updateholidays = async (value: boolean) => {
  console.log("Leave toggle clicked:", value);

  setleavesNotify(value);

  const { data, error } = await supabase
    .from("admin_settings")
    .update({ leave_notification: value })
   .eq("admin_id", currentAdminId)

    .select();

  console.log("Leave update result:", data);
  console.log("Leave update error:", error);
};

useEffect(() => {
  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("clock_in_notification, leave_notification")
      .eq("admin_id", currentAdminId) 
      .single();

    if (error) {
      console.error("Fetch settings error:", error);
      return;
    }

    if (data) {
      setClockInNotify(data.clock_in_notification);
      setleavesNotify(data.leave_notification);
    }
  };

  fetchSettings();
}, [currentAdminId]);



  return (
    <div className="min-h-screen text-white  py-8">
      <div className="max-w-full mx-auto">
        <Card className=" mb-4">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-black font-medium">
                Clock In / Clock Out Notifications
              </h3>
              <p className="text-sm text-gray-400">
                Receive alerts when employees clock in late, miss a punch, or
                successfully clock in/out.
              </p>
            </div>
            <Switch checked={clockInNotify} onCheckedChange={updateSetting} />
          </CardContent>
        </Card>

        <Card className=" border ">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className=" text-black font-medium">Leave Notifications</h3>
              <p className="text-sm text-gray-400">
                Get notified when a leave request is submitted, approved, or
                rejected.
              </p>
            </div>
            <Switch  checked={leavesNotify} onCheckedChange={updateholidays}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
