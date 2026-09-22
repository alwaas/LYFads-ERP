import type { DashboardReport } from "../../types/report";

type Props = {
  data: DashboardReport;
};

const CARDS = [
  { label: "Total Sales", key: "totalSales", format: "currency" as const },
  { label: "Payments Received", key: "totalPaymentsReceived", format: "currency" as const },
  { label: "Outstanding AR", key: "outstandingReceivables", format: "currency" as const },
  { label: "Overdue AR", key: "overdueReceivables", format: "currency" as const, danger: true },
  { label: "Net Cash Flow", key: "netCashFlow", format: "currency" as const },
  { label: "Invoices", key: "invoiceCount", format: "number" as const },
  { label: "Customers", key: "customerCount", format: "number" as const },
  { label: "Orders", key: "orderCount", format: "number" as const },
];

function KpiCards({ data }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const value = data[card.key as keyof DashboardReport] as number;
        const display =
          card.format === "currency" ? `$${value.toLocaleString()}` : value.toLocaleString();

        return (
          <div key={card.key} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <h2 className={`text-3xl font-bold mt-2 ${card.danger ? "text-red-600" : ""}`}>
              {display}
            </h2>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;
