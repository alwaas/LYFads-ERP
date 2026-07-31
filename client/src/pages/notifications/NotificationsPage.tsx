import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import NotificationHeader from "../../components/notifications/NotificationHeader";
import NotificationList from "../../components/notifications/NotificationList";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
} from "../../services/notification.service";

import type { Notification } from "../../types/notification";

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();

      setNotifications(data);

      // TODO:
      // Replace with logged in user id
      const userId = localStorage.getItem("userId");

      if (userId) {
        const count = await getUnreadCount(userId);

        setUnread(count.unread);
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await markNotificationRead(id);

      toast.success("Notification marked as read.");

      loadNotifications();
    } catch (error) {
      console.error(error);

      toast.error("Operation failed.");
    }
  };

  const filteredNotifications = useMemo(() => {
    const keyword = search.toLowerCase();

    return notifications.filter(
      (notification) =>
        notification.title
          .toLowerCase()
          .includes(keyword) ||
        notification.message
          .toLowerCase()
          .includes(keyword),
    );
  }, [notifications, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <NotificationHeader unread={unread} />

        <input
          className="w-full border rounded-lg px-4 py-3"
          placeholder="Search Notifications..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {loading ? (
          <div>Loading...</div>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            onRead={handleRead}
          />
        )}

      </div>
    </DashboardLayout>
  );
}

export default NotificationsPage;