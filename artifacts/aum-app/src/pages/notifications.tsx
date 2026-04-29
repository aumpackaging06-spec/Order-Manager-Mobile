import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Bell, Check, Package, FileText, IndianRupee } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync({ notificationId: id });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const handleMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('order') || t.includes('requirement') || t.includes('production') || t.includes('dispatch')) return <Package className="h-5 w-5" />;
    if (t.includes('payment') || t.includes('invoice')) return <IndianRupee className="h-5 w-5" />;
    if (t.includes('quotation') || t.includes('document')) return <FileText className="h-5 w-5" />;
    return <Bell className="h-5 w-5" />;
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-500">You have {unreadCount} unread notifications.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border shadow-sm min-h-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-500">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-medium text-gray-900 mb-1">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications?.map((notification) => {
              const content = (
                <div 
                  className={`p-4 flex gap-4 transition-colors ${!notification.read ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                  onClick={() => !notification.read && handleMarkRead(notification.id)}
                >
                  <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.read ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {getIcon(notification.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.body}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  )}
                </div>
              );

              return notification.link ? (
                <Link key={notification.id} href={notification.link}>
                  <div className="cursor-pointer block">
                    {content}
                  </div>
                </Link>
              ) : (
                <div key={notification.id}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
