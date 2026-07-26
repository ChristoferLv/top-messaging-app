import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = 'http://localhost:3000';
const socketIO = io("http://localhost:3000", {
  autoConnect: false
});

export default socketIO;