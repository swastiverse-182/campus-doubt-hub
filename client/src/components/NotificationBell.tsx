import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchCount = async () => {
      try {
        const res = await notificationsApi.getAll();
        setUnreadCount(res.data.data?.unreadCount || 0);
      } catch {
        // silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Link to="/notifications" className="btn-icon notif-bell" id="notification-bell">
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </Link>
  );
};

export default NotificationBell;
