
import { useLocalData } from "@/lib/local-data";
import { useMemo} from "react";


export function useGetUpcomingHolidays(daysAhead: number = 90) {
  const { holidays } = useLocalData();

  const data = useMemo(() => {
    const today = new Date();
    const startStr = today.toISOString().split("T")[0];
    const future = new Date(today);
    future.setDate(future.getDate() + daysAhead);
    const futureStr = future.toISOString().split("T")[0];

    return holidays
      .filter(
        (holiday) => holiday.date >= startStr && holiday.date <= futureStr
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, daysAhead]);

  return { data, isLoading: false, error: null as unknown };
}





