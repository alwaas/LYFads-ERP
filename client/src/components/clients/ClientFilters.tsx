type Props = {
  search: string;
  setSearch: (value: string) => void;
};

function ClientFilters({
  search,
  setSearch,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <input
        type="text"
        placeholder="Search Client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      />
    </div>
  );
}

export default ClientFilters;