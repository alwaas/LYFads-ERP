interface Props {
  value: string;

  onChange(value: string): void;
}

function LeadFilters({
  value,
  onChange,
}: Props) {
  return (
    <input
      className="w-full border rounded-lg px-4 py-3"
      placeholder="Search Leads..."
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
    />
  );
}

export default LeadFilters;