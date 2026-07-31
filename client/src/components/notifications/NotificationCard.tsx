import type { Notification } from "../../types/notification";

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
};

function NotificationCard({
  notification,
  onRead,
}: Props) {
  return (
    <div
      className={`border rounded-lg p-4 shadow-sm ${
        notification.isRead
          ? "bg-white"
          : "bg-blue-50 border-blue-300"
      }`}
    >
      <div className="flex justify-between items-start">

        <div className="space-y-1">

          <h3 className="font-semibold">
            {notification.title}
          </h3>

          <p className="text-gray-600">
            {notification.message}
          </p>

          <p className="text-xs text-gray-400">
            {new Date(
              notification.createdAt,
            ).toLocaleString()}
          </p>

        </div>

        {!notification.isRead && (
          <button
            onClick={() => onRead(notification.id)}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          >
            Mark Read
          </button>
        )}

      </div>
    </div>
  );
}

export default NotificationCard;