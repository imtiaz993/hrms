"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Loader from "@/components/loader";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && currentUser) {
        if (currentUser.is_admin) {
          router.push("/admin/dashboard");
        } else {
          router.push("/employee/dashboard");
        }
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  return <Loader />;
  
}
