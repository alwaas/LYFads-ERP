type Props = {
  name: string;
};

function EmployeeAvatar({ name }: Props) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default EmployeeAvatar;