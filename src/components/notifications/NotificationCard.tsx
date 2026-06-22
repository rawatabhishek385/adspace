import { NotificationType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";

interface Notification {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export default function NotificationCard({ notification, onRead }: NotificationCardProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "NEARBY_LISTING":
      case "ALERT":
        return "📍";
      case "REVIEW_REMINDER":
      case "REVIEW":
        return "⭐";
      case "CHAT":
      case "MESSAGE":
        return "💬";
      case "FAVORITE":
        return "❤️";
      case "PROMOTION":
        return "🔥";
      case "ADMIN":
        return "🛡️";
      case "SYSTEM":
      default:
        return "🔔";
    }
  };

  const content = (
    <div
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
      }}
      className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative ${
        !notification.isRead ? "bg-blue-50/50" : ""
      }`}
    >
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
      )}
      <div className="flex gap-3">
        {notification.imageUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative border border-slate-200">
            <Image src={notification.imageUrl} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 text-xl">
            {getIcon(notification.type)}
          </div>
        )}
        <div className="flex-1 pr-4">
          <h4 className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
            {notification.title}
          </h4>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
          <span className="text-xs text-slate-400 mt-1 block">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={() => { if (!notification.isRead) onRead(notification.id); }}>
        {content}
      </Link>
    );
  }

  return content;
}
