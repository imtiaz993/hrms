import React from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";

const Refetch = ({ fetchAllData, selectedYear, selectedMonth }: any) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <p className="text-xs text-slate-400">
        Showing data for{" "}
        {format(new Date(selectedYear, selectedMonth - 1, 1), "MMM yyyy")}
        <button
          onClick={() => {
            fetchAllData();
          }}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <RefreshCw size={14} />
        </button>
      </p>
    </div>
  );
};

export default Refetch;
