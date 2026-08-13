"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  OpenShiftOfferBanner,
  type OpenShiftOffer,
} from "@/components/open-shift-offer-banner";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createRealtimeClient } from "@/lib/realtime";
import { useToast } from "@/lib/toast-context";
import type {
  AppNotification,
  PagedResponse,
  Shift,
  ShiftBoardUpdate,
} from "@/lib/types";

interface RealtimeContextValue {
  connected: boolean;
  unreadCount: number;
  notifications: AppNotification[];
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined,
);

const GONE_FROM_OPEN_BOARD = new Set([
  "SHIFT_CLAIMED",
  "SHIFT_ASSIGNED",
  "SHIFT_HELD",
  "SHIFT_CANCELLED",
  "SHIFT_CONFIRMED",
  "SHIFT_STARTED",
  "SHIFT_COMPLETED",
  "SHIFT_NO_SHOW",
]);

function removeShiftFromOpenCaches(queryClient: QueryClient, shiftId: string) {
  const strip = (data: unknown): unknown => {
    if (!data || typeof data !== "object") return data;
    if (Array.isArray(data)) {
      return (data as Shift[]).filter((s) => s?.id !== shiftId);
    }
    const page = data as PagedResponse<Shift>;
    if (Array.isArray(page.content)) {
      const nextContent = page.content.filter((s) => s?.id !== shiftId);
      if (nextContent.length === page.content.length) return data;
      return {
        ...page,
        content: nextContent,
        totalElements: Math.max(0, (page.totalElements ?? nextContent.length) - 1),
      };
    }
    return data;
  };

  queryClient.setQueriesData({ queryKey: ["shifts"] }, strip);
  queryClient.setQueriesData({ queryKey: ["shifts-open-preview"] }, strip);
}

function shouldDropFromOpenBoard(update: ShiftBoardUpdate): boolean {
  // Partial fills stay claimable — keep on the open board while status is OPEN.
  if (update.status === "OPEN") return false;
  if (update.status && update.status !== "OPEN") return true;
  if (GONE_FROM_OPEN_BOARD.has(update.action)) return true;
  return false;
}

function parseOfferPayload(payload: string | null): Partial<OpenShiftOffer> & {
  status?: string;
  marketplaceSlots?: number;
  action?: string;
} {
  if (!payload) return {};
  try {
    const data = JSON.parse(payload) as {
      shiftId?: string;
      city?: string;
      date?: string;
      qualification?: string;
      payRate?: number;
      status?: string;
      marketplaceSlots?: number;
      action?: string;
    };
    return {
      shiftId: data.shiftId,
      city: data.city,
      date: data.date,
      qualification: data.qualification,
      payRate: data.payRate,
      status: data.status,
      marketplaceSlots: data.marketplaceSlots,
      action: data.action,
    };
  } catch {
    return {};
  }
}

function showBrowserOffer(title: string, body: string, shiftId: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    const n = new Notification(title, {
      body,
      tag: `shift-offer-${shiftId}`,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/caregiver/shifts/${shiftId}`;
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [offer, setOffer] = useState<OpenShiftOffer | null>(null);
  const clientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(
    null,
  );
  const lastOfferId = useRef<string | null>(null);

  const unreadQ = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: getUnreadNotificationCount,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const listQ = useQuery({
    queryKey: ["notifications-me"],
    queryFn: () => getMyNotifications(0, 40),
    enabled: isAuthenticated,
  });

  const invalidateBoards = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["shifts"] });
    void queryClient.invalidateQueries({ queryKey: ["shifts-open-preview"] });
    void queryClient.invalidateQueries({ queryKey: ["owner-shifts"] });
    void queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    void queryClient.invalidateQueries({ queryKey: ["owner-claims"] });
    void queryClient.invalidateQueries({ queryKey: ["shift"] });
    void queryClient.invalidateQueries({ queryKey: ["dash-open"] });
    void queryClient.invalidateQueries({ queryKey: ["dash-claimed"] });
    void queryClient.invalidateQueries({ queryKey: ["dash-confirmed"] });
    void queryClient.invalidateQueries({ queryKey: ["dash-completed"] });
    void queryClient.invalidateQueries({ queryKey: ["dash-claims"] });
    void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["finance-settlements"] });
    void queryClient.invalidateQueries({ queryKey: ["visit"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule-calendar"] });
  }, [queryClient]);

  const presentOffer = useCallback(
    (next: OpenShiftOffer) => {
      if (user?.role !== "CAREGIVER") return;
      if (lastOfferId.current === next.id) return;
      lastOfferId.current = next.id;
      setOffer(next);
      showBrowserOffer(next.title, next.body, next.shiftId);
      window.setTimeout(() => {
        setOffer((current) => (current?.id === next.id ? null : current));
      }, 14_000);
    },
    [user?.role],
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "CAREGIVER" || user?.status === "PENDING_REVIEW") {
      return;
    }
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
  }, [isAuthenticated, user?.role, user?.status]);

  useEffect(() => {
    if (!isAuthenticated || user?.status === "PENDING_REVIEW") {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
      setOffer(null);
      return;
    }

    const client = createRealtimeClient({
      onConnected: () => setConnected(true),
      onDisconnected: () => setConnected(false),
      onShiftBoard: (update: ShiftBoardUpdate) => {
        if (shouldDropFromOpenBoard(update)) {
          removeShiftFromOpenCaches(queryClient, update.shiftId);
          setOffer((current) =>
            current?.shiftId === update.shiftId ? null : current,
          );
        }
        if (update.action === "SHIFT_POSTED" && update.status === "OPEN") {
          // Fresh open listing — refetch so matching filters pick it up.
          invalidateBoards();
          return;
        }
        invalidateBoards();
      },
      onNotification: (n: AppNotification) => {
        void queryClient.invalidateQueries({ queryKey: ["notifications-me"] });
        void queryClient.invalidateQueries({
          queryKey: ["notifications-unread"],
        });

        if (n.type === "SHIFT_POSTED" && user?.role === "CAREGIVER") {
          const extras = parseOfferPayload(n.payload);
          const shiftId = extras.shiftId ?? "";
          if (shiftId) {
            presentOffer({
              id: n.id,
              shiftId,
              title: n.title,
              body: n.body,
              city: extras.city,
              date: extras.date,
              qualification: extras.qualification,
              payRate: extras.payRate,
            });
          } else {
            showToast(n.title, "info");
          }
        } else if (n.type !== "SHIFT_HELD") {
          // Avoid noisy toasts when a shift simply leaves the open board.
          showToast(n.title, "info");
        }

        if (
          n.type === "SHIFT_CLAIMED" ||
          n.type === "SHIFT_ASSIGNED" ||
          n.type === "SHIFT_HELD" ||
          n.type === "SHIFT_CANCELLED" ||
          n.type === "SHIFT_CONFIRMED"
        ) {
          const extras = parseOfferPayload(n.payload);
          // Partial fills remain OPEN — don't strip remaining seats from the board.
          const stillOpen = extras.status === "OPEN";
          if (extras.shiftId && !stillOpen) {
            removeShiftFromOpenCaches(queryClient, extras.shiftId);
            setOffer((current) =>
              current?.shiftId === extras.shiftId ? null : current,
            );
          }
        }

        invalidateBoards();
      },
    });
    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [
    isAuthenticated,
    invalidateBoards,
    presentOffer,
    queryClient,
    showToast,
    user?.role,
    user?.status,
  ]);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      void queryClient.invalidateQueries({ queryKey: ["notifications-me"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
    [queryClient],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    void queryClient.invalidateQueries({ queryKey: ["notifications-me"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  }, [queryClient]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      connected,
      unreadCount: unreadQ.data?.count ?? 0,
      notifications: listQ.data?.content ?? [],
      refresh: () => {
        void listQ.refetch();
        void unreadQ.refetch();
      },
      markRead,
      markAllRead,
    }),
    [
      connected,
      unreadQ.data?.count,
      listQ.data?.content,
      listQ,
      unreadQ,
      markRead,
      markAllRead,
    ],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <OpenShiftOfferBanner offer={offer} onDismiss={() => setOffer(null)} />
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}
