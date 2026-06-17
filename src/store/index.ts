import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tool, Reservation, BorrowRecord, Announcement, TimeSlot, DamageReport } from '@/types';
import { currentUser } from '@/data/users';
import { tools as initialTools } from '@/data/tools';
import { reservations as initialReservations } from '@/data/reservations';
import { borrowRecords as initialBorrowRecords } from '@/data/borrowRecords';
import { announcements as initialAnnouncements } from '@/data/announcements';
import { buildings } from '@/data/buildings';
import { categories } from '@/data/categories';

interface AppState {
  currentUser: User;
  tools: Tool[];
  reservations: Reservation[];
  borrowRecords: BorrowRecord[];
  announcements: Announcement[];
  buildings: typeof buildings;
  categories: typeof categories;
  selectedTool: Tool | null;
  isAdminView: boolean;

  setSelectedTool: (tool: Tool | null) => void;
  toggleAdminView: () => void;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'roomNumber'>) => void;
  approveReservation: (id: string) => void;
  rejectReservation: (id: string, reason: string) => void;
  cancelReservation: (id: string) => void;
  borrowTool: (toolId: string, reservationId?: string) => void;
  returnTool: (recordId: string, damageReport?: Omit<DamageReport, 'id' | 'reportedAt' | 'recordId'>) => void;
  getBorrowedCount: () => number;
  getPendingReturnCount: () => number;
  getExpiringSoonCount: () => number;
  getHotTools: () => Tool[];
  getMyReservations: () => Reservation[];
  getMyBorrowRecords: () => BorrowRecord[];
  getMyDeposits: () => { amount: number; status: string; date: string; toolName: string }[];
  getMyCompensations: () => { amount: number; status: string; date: string; toolName: string; description: string }[];
  addBlacklist: (userId: string, reason: string, days: number) => void;
  removeBlacklist: (userId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser,
      tools: initialTools,
      reservations: initialReservations,
      borrowRecords: initialBorrowRecords,
      announcements: initialAnnouncements,
      buildings,
      categories,
      selectedTool: null,
      isAdminView: false,

      setSelectedTool: (tool) => set({ selectedTool: tool }),

      toggleAdminView: () => set((state) => ({ isAdminView: !state.isAdminView })),

      addReservation: (reservationData) => {
        const user = get().currentUser;
        const newReservation: Reservation = {
          ...reservationData,
          id: 'r' + generateId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          roomNumber: user.roomNumber,
        };
        set((state) => ({
          reservations: [...state.reservations, newReservation],
        }));
      },

      approveReservation: (id) => {
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, status: 'approved' as const, approvedAt: new Date().toISOString() } : r
          ),
        }));
      },

      rejectReservation: (id, reason) => {
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, status: 'rejected' as const, rejectedReason: reason } : r
          ),
        }));
      },

      cancelReservation: (id) => {
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, status: 'cancelled' as const } : r
          ),
        }));
      },

      borrowTool: (toolId, reservationId) => {
        const user = get().currentUser;
        const tool = get().tools.find((t) => t.id === toolId);
        if (!tool) return;

        const newRecord: BorrowRecord = {
          id: 'br' + generateId(),
          reservationId,
          userId: user.id,
          userName: user.name,
          roomNumber: user.roomNumber,
          toolId: tool.id,
          toolName: tool.name,
          toolImage: tool.image,
          borrowAt: new Date().toISOString(),
          expectedReturnAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'borrowed',
          depositPaid: tool.deposit,
          rentPaid: tool.dailyRent,
        };

        set((state) => ({
          borrowRecords: [...state.borrowRecords, newRecord],
          tools: state.tools.map((t) =>
            t.id === toolId ? { ...t, availableStock: t.availableStock - 1, borrowCount: t.borrowCount + 1 } : t
          ),
        }));
      },

      returnTool: (recordId, damageReport) => {
        const record = get().borrowRecords.find((r) => r.id === recordId);
        if (!record) return;

        const now = new Date().toISOString();
        const damage = damageReport
          ? {
              ...damageReport,
              id: 'dr' + generateId(),
              recordId,
              reportedAt: now,
            }
          : undefined;

        set((state) => ({
          borrowRecords: state.borrowRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: 'returned' as const,
                  actualReturnAt: now,
                  damageReport: damage,
                }
              : r
          ),
          tools: state.tools.map((t) =>
            t.id === record.toolId ? { ...t, availableStock: t.availableStock + 1 } : t
          ),
        }));
      },

      getBorrowedCount: () => {
        const userId = get().currentUser.id;
        return get().borrowRecords.filter((r) => r.userId === userId && r.status === 'borrowed').length;
      },

      getPendingReturnCount: () => {
        const userId = get().currentUser.id;
        const now = new Date();
        return get().borrowRecords.filter((r) => {
          if (r.userId !== userId || r.status !== 'borrowed') return false;
          const expected = new Date(r.expectedReturnAt);
          return expected >= now;
        }).length;
      },

      getExpiringSoonCount: () => {
        const userId = get().currentUser.id;
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return get().borrowRecords.filter((r) => {
          if (r.userId !== userId || r.status !== 'borrowed') return false;
          const expected = new Date(r.expectedReturnAt);
          return expected >= now && expected <= tomorrow;
        }).length;
      },

      getHotTools: () => {
        return [...get().tools].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 5);
      },

      getMyReservations: () => {
        const userId = get().currentUser.id;
        return get().reservations.filter((r) => r.userId === userId);
      },

      getMyBorrowRecords: () => {
        const userId = get().currentUser.id;
        return get().borrowRecords.filter((r) => r.userId === userId);
      },

      getMyDeposits: () => {
        const userId = get().currentUser.id;
        return get()
          .borrowRecords.filter((r) => r.userId === userId)
          .map((r) => ({
            amount: r.depositPaid,
            status: r.status === 'returned' ? '已退还' : '已缴纳',
            date: r.status === 'returned' ? (r.actualReturnAt || r.borrowAt) : r.borrowAt,
            toolName: r.toolName,
          }));
      },

      getMyCompensations: () => {
        const userId = get().currentUser.id;
        return get()
          .borrowRecords.filter((r) => r.userId === userId && r.damageReport)
          .map((r) => ({
            amount: r.damageReport!.compensationAmount,
            status: r.damageReport!.isPaid ? '已支付' : '待支付',
            date: r.damageReport!.reportedAt,
            toolName: r.toolName,
            description: r.damageReport!.description,
          }));
      },

      addBlacklist: (userId, reason, days) => {
        set((state) => ({
          currentUser:
            state.currentUser.id === userId
              ? {
                  ...state.currentUser,
                  isBlacklisted: true,
                  blacklistReason: reason,
                  blacklistExpiry: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
                }
              : state.currentUser,
        }));
      },

      removeBlacklist: (userId) => {
        set((state) => ({
          currentUser:
            state.currentUser.id === userId
              ? {
                  ...state.currentUser,
                  isBlacklisted: false,
                  blacklistReason: undefined,
                  blacklistExpiry: undefined,
                }
              : state.currentUser,
        }));
      },
    }),
    {
      name: 'tool-sharing-storage',
      partialize: (state) => ({
        reservations: state.reservations,
        borrowRecords: state.borrowRecords,
        tools: state.tools,
        currentUser: state.currentUser,
      }),
    }
  )
);
