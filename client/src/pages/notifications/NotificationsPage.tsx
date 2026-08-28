import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import NotificationHeader from "../../components/notifications/NotificationHeader";
import NotificationList from "../../components/notifications/NotificationList";
import Pagination from "../../components/ui/Pagination";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
} from "../../services/notification.service";

import { useAuthStore } from "../../stores/auth.store";

import type { Notification } from "../../types/notification";

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [unread, setUnread] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const user = useAuthStore((state) => state.user);

  const loadNotifications = async () => {
    try {
      const result: any = await getNotifications(page, limit, search);
      setNotifications(result.data || []);
      setTotalPages(result.totalPages || 1);

      if (user?.id) {
        const count = await getUnreadCount(user.id);
        setUnread(count.unread);
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, limit, search]);

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

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Loading notifications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <NotificationHeader unread={unread} />

        <input
          className="w-full border rounded-lg px-4 py-3"
          placeholder="Search Notifications..."
          value={search}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
        />

        <NotificationList
          notifications={notifications}
          onRead={handleRead}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

export default NotificationsPage;
