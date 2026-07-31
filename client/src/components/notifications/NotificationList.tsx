import NotificationCard from "./NotificationCard";
import EmptyNotifications from "./EmptyNotifications";

import type { Notification } from "../../types/notification";

type Props = {
  notifications: Notification[];
  onRead: (id: string) => void;
};

function NotificationList({
  notifications,
  onRead,
}: Props) {
  if (notifications.length === 0) {
    return <EmptyNotifications />;
  }

  return (
    <div className="space-y-4">

      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRead={onRead}
        />
      ))}

    </div>
  );
}

export default NotificationList;