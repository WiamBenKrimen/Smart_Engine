import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '../api/notificationApi';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await notificationApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { notifications, loading, refresh };
}
