"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function OrderStatus({ filteredData, FMS_COLUMNS_INFO }) {
  const [statusData, setStatusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setStatusData([
        { name: "No Data", value: 1, color: "#cccccc" }, // Indicate no data
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let other = 0; // To catch any statuses not explicitly handled

    // Find the correct column property for "Order Status"
    // Based on Dashboard's FMS_COLUMNS_INFO, it's index 17 mapping to "col19"
    const orderStatusColProperty = Object.values(FMS_COLUMNS_INFO).find(info => info.label === "Order Status")?.property || "col19";

    filteredData.forEach((row) => {
      const orderStatus = String(row[orderStatusColProperty]).trim().toLowerCase(); // Normalize status text

      if (orderStatus === "order received" || orderStatus === "delivered" || orderStatus === "shipped") {
        completed++;
      } else if (orderStatus === "pending" || orderStatus === "in progress" || orderStatus === "order not received") {
        pending++;
      } else if (orderStatus === "cancelled" || orderStatus === "rejected") {
        cancelled++;
      } else if (orderStatus !== "" && orderStatus !== "—") { // Count anything else with a value as 'Other'
        other++;
      }
    });

    const newStatusData = [];

    if (completed > 0) {
        newStatusData.push({ name: "Completed", value: completed, color: "#10b981" });
    }
    if (pending > 0) {
        newStatusData.push({ name: "Pending", value: pending, color: "#f59e0b" });
    }
    if (cancelled > 0) {
        newStatusData.push({ name: "Cancelled", value: cancelled, color: "#ef4444" });
    }
    if (other > 0) {
        newStatusData.push({ name: "Other", value: other, color: "#6b7280" }); // A neutral color for 'Other'
    }

    // Handle case where no relevant statuses are found in the filtered data
    if (newStatusData.length === 0) {
        newStatusData.push({ name: "No Orders", value: 1, color: "#cccccc" });
    }


    setStatusData(newStatusData);
    setIsLoading(false);
  }, [filteredData, FMS_COLUMNS_INFO]); // Re-run effect when filteredData or FMS_COLUMNS_INFO changes

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-8 py-6">
        <h3 className="md:text-2xl font-bold text-white mb-2">Order Status</h3>
        <p className="text-purple-50 md:text-lg">
          Current distribution of order statuses
        </p>
      </div>
      <div className="p-4 sm:p-8">
        <div className="h-64 sm:h-80 ">
          {isLoading ? (
            <div className="text-center text-slate-500 pt-20 text-lg">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="70%" // Responsive radius
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontWeight: 500,
                    fontSize: window.innerWidth < 640 ? "12px" : "14px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "16px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderStatus;