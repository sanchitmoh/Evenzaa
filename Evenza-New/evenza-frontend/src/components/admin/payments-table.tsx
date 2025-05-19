import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Payment {
  id: string | number;
  userId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  status: string;
  entityType?: string;
  entityId?: string;
  paymentMethod?: string;
  createdAt?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments = [], loading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter payments based on search query
  const filteredPayments = payments.filter(
    (payment) =>
      (payment.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(payment.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.razorpayOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.razorpayPaymentId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.entityType || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  // Get badge color based on payment status
  const getStatusBadgeColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "bg-green-500 hover:bg-green-600";
      case "PENDING":
        return "bg-amber-500 hover:bg-amber-600";
      case "FAILED":
      case "FAIL":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 w-full overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Transactions</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 bg-zinc-800 border-zinc-700 focus-visible:ring-violet-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      {payments.length === 0
                        ? "No transactions found"
                        : "No transactions matching your search"}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-zinc-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {String(payment.id).substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{payment.user?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{payment.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div>{payment.entityType || "N/A"}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[150px]" title={payment.razorpayOrderId}>
                            Order: {payment.razorpayOrderId || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadgeColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PaymentsTable; 