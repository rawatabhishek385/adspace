import { io, Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// Socket.IO Client Singleton
// ---------------------------------------------------------------------------
// Connects to the DEPLOYED socket server on Render. Never spawns a local
// server. Prevents duplicate connections by maintaining a module-level
// singleton and tracking connection state via a simple state-machine.
// ---------------------------------------------------------------------------

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

// ── Event name constants (must match socket-server exactly) ──────────────

export const SocketEvents = {
  // Connection lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  RECONNECT: "reconnect",
  RECONNECT_ATTEMPT: "reconnect_attempt",
  RECONNECT_ERROR: "reconnect_error",
  RECONNECT_FAILED: "reconnect_failed",

  // Room management (client → server)
  JOIN_USER_ROOM: "joinUserRoom",
  JOIN_CONVERSATION: "joinConversation",
  LEAVE_CONVERSATION: "leaveConversation",

  // Presence (server → client)
  PRESENCE_UPDATE: "presenceUpdate",
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  LAST_SEEN_UPDATE: "lastSeenUpdate",
  AVAILABILITY_UPDATE: "availabilityUpdate",

  // Presence (client → server)
  CHECK_PRESENCE: "checkPresence",
  SUBSCRIBE_PRESENCE: "subscribePresence",
  UNSUBSCRIBE_PRESENCE: "unsubscribePresence",
  AVAILABILITY_CHANGED: "availabilityChanged",

  // Chat messages (client → server)
  NEW_MESSAGE: "newMessage",
  MESSAGE_READ: "messageRead",
  MESSAGE_DELIVERED: "messageDelivered",

  // Chat messages (server → client)
  RECEIVE_MESSAGE: "receiveMessage",
  MESSAGE_DELIVERED_ACK: "messageDelivered",
  DELIVERY_RECEIPT: "deliveryReceipt",
  MESSAGE_READ_UPDATE: "messageReadUpdate",

  // Typing (client → server)
  TYPING: "typing",
  STOP_TYPING: "stopTyping",

  // Typing (server → client)
  USER_TYPING: "userTyping",
  USER_STOPPED_TYPING: "userStoppedTyping",

  // Notifications (client → server)
  NEW_NOTIFICATION: "newNotification",
  MARK_NOTIFICATION_READ: "markNotificationRead",
  UPDATE_UNREAD_COUNT: "updateUnreadCount",
  BROADCAST_NOTIFICATION: "broadcastNotification",

  // Notifications (server → client)
  NOTIFICATION_RECEIVED: "notificationReceived",
  NOTIFICATION_READ_UPDATE: "notificationReadUpdate",
  UNREAD_COUNT_UPDATED: "unreadNotificationCountUpdated",
  ADMIN_ANNOUNCEMENT: "adminAnnouncement",

  // Advanced chat (client → server)
  ADD_REACTION: "addReaction",
  REMOVE_REACTION: "removeReaction",
  REPLY_MESSAGE: "replyMessage",
  EDIT_MESSAGE: "editMessage",
  DELETE_MESSAGE: "deleteMessage",
  PIN_MESSAGE: "pinMessage",
  UNPIN_MESSAGE: "unpinMessage",
} as const;

// ── Types ────────────────────────────────────────────────────────────────

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

export interface SocketAuth {
  userId: string;
  token?: string;
}

type ConnectionState = "disconnected" | "connecting" | "connected";

// ── Singleton state ──────────────────────────────────────────────────────

let socket: Socket | null = null;
let connectionState: ConnectionState = "disconnected";
let currentAuth: SocketAuth | null = null;

/** Whether we are inside a dev environment (useful for logging) */
const isDev = process.env.NODE_ENV === "development";

function log(...args: unknown[]) {
  if (isDev) {
    console.log("[socket]", ...args);
  }
}

function warn(...args: unknown[]) {
  if (isDev) {
    console.warn("[socket]", ...args);
  }
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Create (or return the existing) socket connection.
 *
 * Safe to call multiple times — subsequent calls with the same userId are
 * no-ops. If called with a *different* userId the old socket is torn down
 * first (handles user-switching).
 */
export function connectSocket(auth: SocketAuth): Socket {
  // Guard: if already connected with the same identity, return existing
  if (socket && currentAuth?.userId === auth.userId) {
    if (socket.disconnected) {
      log("Re-connecting existing socket for", auth.userId);
      socket.auth = { userId: auth.userId, token: auth.token };
      socket.connect();
    }
    return socket;
  }

  // If switching users, tear down the old connection first
  if (socket) {
    log("Tearing down old socket (user switch)");
    disconnectSocket();
  }

  currentAuth = auth;
  connectionState = "connecting";

  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    timeout: 20000,
    transports: ["websocket", "polling"],
    auth: {
      userId: auth.userId,
      token: auth.token,
    },
  });

  // ── Lifecycle listeners (registered exactly once) ────────────────────

  socket.on(SocketEvents.CONNECT, () => {
    connectionState = "connected";
    log("Connected ✓  id=", socket?.id);

    // Auto-join the authenticated user's personal room
    socket?.emit(SocketEvents.JOIN_USER_ROOM, auth.userId);
  });

  socket.on(SocketEvents.DISCONNECT, (reason) => {
    connectionState = "disconnected";
    log("Disconnected. Reason:", reason);

    // If the server forced the disconnect (e.g. auth failure), don't retry
    if (reason === "io server disconnect") {
      warn("Server forced disconnect — will not auto-reconnect");
    }
  });

  socket.on(SocketEvents.CONNECT_ERROR, (error) => {
    connectionState = "disconnected";
    warn("Connection error:", error.message);
  });

  socket.io.on(SocketEvents.RECONNECT_ATTEMPT, (attempt) => {
    connectionState = "connecting";
    log(`Reconnect attempt #${attempt}`);
  });

  socket.io.on(SocketEvents.RECONNECT, (attempt) => {
    connectionState = "connected";
    log(`Reconnected after ${attempt} attempt(s)`);

    // Re-join the user room on reconnect
    socket?.emit(SocketEvents.JOIN_USER_ROOM, auth.userId);
  });

  socket.io.on(SocketEvents.RECONNECT_ERROR, (error) => {
    warn("Reconnect error:", error.message);
  });

  socket.io.on(SocketEvents.RECONNECT_FAILED, () => {
    warn("Reconnect failed — all attempts exhausted");
  });

  // ── Initiate connection ──────────────────────────────────────────────

  socket.connect();

  return socket;
}

/**
 * Cleanly disconnect and destroy the singleton.
 *
 * Removes all listeners, nulls the reference, and resets state. Safe to
 * call even when already disconnected.
 */
export function disconnectSocket(): void {
  if (socket) {
    log("Disconnecting socket");

    // Remove ALL listeners to prevent leaks
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();

    socket = null;
    currentAuth = null;
    connectionState = "disconnected";
  }
}

/**
 * Return the current socket instance (or null if not yet connected).
 *
 * Prefer `useSocket()` in React components — this is for imperative code
 * outside the React tree (e.g. API route helpers, utility functions).
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Returns the current connection state as a simple string.
 */
export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Check whether the socket is currently connected.
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}
