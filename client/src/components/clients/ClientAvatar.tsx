type Props = {
  name: string;
};

function ClientAvatar({ name }: Props) {
  return (
    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default ClientAvatar;