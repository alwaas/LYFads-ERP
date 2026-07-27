type Props = {
  title: string;
  value: number | string;
  color: string;
};

function ClientCard({ title, value, color }: Props) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-md`}>
      <p className="text-sm opacity-90">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>
    </div>
  );
}

export default ClientCard;