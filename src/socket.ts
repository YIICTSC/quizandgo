import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin;

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
});
