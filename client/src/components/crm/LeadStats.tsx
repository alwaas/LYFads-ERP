import type { Lead } from "../../types/lead";
import { Users, UserPlus, BadgeCheck, Trophy, XCircle, IndianRupee, } from "lucide-react";

type Props = {
  leads: Lead[];
};

function LeadStats({ leads }: Props) {
  const total = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "NEW",
  ).length;

  const qualified = leads.filter(
    (lead) => lead.status === "QUALIFIED",
  ).length;

  const won = leads.filter(
    (lead) => lead.status === "WON",
  ).length;

  const lost = leads.filter(
    (lead) => lead.status === "LOST",
  ).length;

  const pipeline = leads.reduce(
    (sum, lead) => sum + Number(lead.estimatedValue ?? 0),
    0,
  );

  const cards = [
    {
      title: "Total Leads",
      value: total,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "New",
      value: newLeads,
      icon: UserPlus,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
    },
    {
      title: "Qualified",
      value: qualified,
      icon: BadgeCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Won",
      value: won,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Lost",
      value: lost,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      title: "Pipeline",
      value: `₹${pipeline.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <h2 className="text-3xl font-bold mt-3">
                  {card.value}
                </h2>

              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}
              >
                <Icon className={card.color} />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LeadStats;