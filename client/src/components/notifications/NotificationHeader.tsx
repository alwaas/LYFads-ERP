type Props = {
  unread: number;
};

function NotificationHeader({
  unread,
}: Props) {
  return (
    <div className="flex justify-between items-center">

      <h1 className="text-3xl font-bold">
        Notifications
      </h1>

      <span className="bg-red-600 text-white px-4 py-2 rounded-full">
        {unread} Unread
      </span>

    </div>
  );
}

export default NotificationHeader;