import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket(onTicketNew) {
  const cbRef = useRef(onTicketNew);
  cbRef.current = onTicketNew;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(
        import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
        { transports: ['websocket', 'polling'] }
      );
    }

    const handler = (ticket) => cbRef.current?.(ticket);
    socketInstance.on('ticket:new', handler);

    return () => {
      socketInstance.off('ticket:new', handler);
    };
  }, []);

  return socketInstance;
}
