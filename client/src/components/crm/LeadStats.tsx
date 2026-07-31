import type { Lead } from "../../types/lead";

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
    },
    {
      title: "New",
      value: newLeads,
    },
    {
      title: "Qualified",
      value: qualified,
    },
    {
      title: "Won",
      value: won,
    },
    {
      title: "Lost",
      value: lost,
    },
    {
      title: "Pipeline Value",
      value: `₹${pipeline.toLocaleString()}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-5"
        >
          <p className="text-gray-500 text-sm">
            {card.title}
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default LeadStats;