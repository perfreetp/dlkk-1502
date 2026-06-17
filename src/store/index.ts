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
import { generateDateRange } from '@/utils/date';

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
  toggleAdminView: () => boolean;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'roomNumber'>) => void;
  approveReservation: (id: string) => void;
  rejectReservation: (id: string, reason: string) => void;
  cancelReservation: (id: string) => void;
  borrowTool: (toolId: string, reservationId?: string) => boolean;
  returnTool: (recordId: string, damageReport?: Omit<DamageReport, 'id' | 'reportedAt' | 'recordId'>) => void;
  getBorrowedCount: () => number;
  getPendingReturnCount: () => number;
  getExpiringSoonCount: () => number;
  getOverdueCount: () => number;
  getUnpaidCompensationCount: () => number;
  getPendingApprovalCount: () => number;
  getPendingBorrowCount: () => number;
  getPendingReturnCountAdmin: () => number;
  getHotTools: () => Tool[];
  getMyReservations: () => Reservation[];
  getMyBorrowRecords: () => BorrowRecord[];
  getMyDeposits: () => { amount: number; status: string; date: string; toolName: string }[];
  getMyCompensations: () => { amount: number; status: string; date: string; toolName: string; description: string }[];
  addBlacklist: (userId: string, reason: string, days: number) => void;
  removeBlacklist: (userId: string) => void;
  getToolReservedDates: (toolId: string) => string[];
  getToolReservedTimeSlots: (toolId: string, date: string) => TimeSlot[];
  updateToolStatus: (toolId: string, status: Tool['status']) => void;
  updateToolLocation: (toolId: string, location: string, buildingId?: string, buildingName?: string) => void;
  canReserveTool: (toolId: string, startDate: string, endDate: string, timeSlot: TimeSlot) => boolean;
  payCompensation: (recordId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...(currentUser.role !== 'admin' ? { isAdminView: false } : {}),
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

      toggleAdminView: () => {
        if (get().currentUser.role !== 'admin') return false;
        set((state) => ({ isAdminView: !state.isAdminView }));
        return true;
      },

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
        if (!tool) return false;

        if (user.isBlacklisted) return false;
        if (tool.availableStock <= 0) return false;
        if (tool.status !== 'available') return false;

        if (reservationId) {
          const reservation = get().reservations.find((r) => r.id === reservationId);
          if (!reservation || reservation.status !== 'approved') return false;
          if (reservation.toolId !== toolId) return false;
        }

        let expectedDays = 7;
        if (reservationId) {
          const reservation = get().reservations.find((r) => r.id === reservationId);
          if (reservation) {
            const start = new Date(reservation.startDate);
            const end = new Date(reservation.endDate);
            expectedDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          }
        }

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
          expectedReturnAt: new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000).toISOString(),
          status: 'borrowed',
          depositPaid: tool.deposit,
          rentPaid: tool.dailyRent * expectedDays,
        };

        set((state) => ({
          borrowRecords: [...state.borrowRecords, newRecord],
          tools: state.tools.map((t) =>
            t.id === toolId ? { ...t, availableStock: t.availableStock - 1, borrowCount: t.borrowCount + 1 } : t
          ),
          reservations: reservationId
            ? state.reservations.map((r) =>
                r.id === reservationId ? { ...r, status: 'borrowed' as const } : r
              )
            : state.reservations,
        }));
        return true;
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

      getOverdueCount: () => {
        const userId = get().currentUser.id;
        const now = new Date();
        return get().borrowRecords.filter((r) => {
          if (r.status !== 'borrowed') return false;
          if (!get().isAdminView && r.userId !== userId) return false;
          const expected = new Date(r.expectedReturnAt);
          return expected < now;
        }).length;
      },

      getUnpaidCompensationCount: () => {
        const userId = get().currentUser.id;
        return get()
          .borrowRecords.filter((r) => {
            if (!get().isAdminView && r.userId !== userId) return false;
            return r.damageReport && !r.damageReport.isPaid;
          }).length;
      },

      getPendingApprovalCount: () => {
        return get().reservations.filter((r) => r.status === 'pending').length;
      },

      getPendingBorrowCount: () => {
        return get().reservations.filter((r) => r.status === 'approved').length;
      },

      getPendingReturnCountAdmin: () => {
        return get().borrowRecords.filter((r) => r.status === 'borrowed').length;
      },

      payCompensation: (recordId) => {
        if (!get().isAdminView) return;
        if (get().currentUser.role !== 'admin') return;
        set((state) => ({
          borrowRecords: state.borrowRecords.map((r) =>
            r.id === recordId && r.damageReport
              ? { ...r, damageReport: { ...r.damageReport, isPaid: true } }
              : r
          ),
        }));
      },

      getToolReservedDates: (toolId) => {
        const dates: Set<string> = new Set();
        get()
          .reservations.filter((r) => r.toolId === toolId && (r.status === 'pending' || r.status === 'approved'))
          .forEach((r) => {
            const range = generateDateRange(r.startDate, Math.max(1, Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1));
            range.forEach((d) => dates.add(d));
          });
        get()
          .borrowRecords.filter((r) => r.toolId === toolId && r.status === 'borrowed')
          .forEach((r) => {
            const borrowDate = r.borrowAt.split('T')[0];
            const returnDate = r.expectedReturnAt.split('T')[0];
            const range = generateDateRange(borrowDate, Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(borrowDate).getTime()) / (1000 * 60 * 60 * 24)) + 1));
            range.forEach((d) => dates.add(d));
          });
        return Array.from(dates);
      },

      getToolReservedTimeSlots: (toolId, date) => {
        const slots: Set<TimeSlot> = new Set();
        get()
          .reservations.filter(
            (r) => r.toolId === toolId && (r.status === 'pending' || r.status === 'approved') && date >= r.startDate && date <= r.endDate
          )
          .forEach((r) => {
            if (r.timeSlot === 'fullday') {
              slots.add('morning');
              slots.add('afternoon');
              slots.add('evening');
              slots.add('fullday');
            } else {
              slots.add(r.timeSlot);
              slots.add('fullday');
            }
          });
        get()
          .borrowRecords.filter((r) => r.toolId === toolId && r.status === 'borrowed')
          .forEach((r) => {
            const borrowDate = r.borrowAt.split('T')[0];
            const returnDate = r.expectedReturnAt.split('T')[0];
            if (date >= borrowDate && date <= returnDate) {
              slots.add('morning');
              slots.add('afternoon');
              slots.add('evening');
              slots.add('fullday');
            }
          });
        return Array.from(slots);
      },

      canReserveTool: (toolId, startDate, endDate, timeSlot) => {
        const tool = get().tools.find((t) => t.id === toolId);
        if (!tool || tool.availableStock <= 0 || tool.status !== 'available') return false;

        const datesToCheck = generateDateRange(startDate, Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1));
        
        for (const date of datesToCheck) {
          const reservedSlots = get().getToolReservedTimeSlots(toolId, date);
          const activeReservationsCount = get().reservations.filter(
            (r) => r.toolId === toolId && (r.status === 'pending' || r.status === 'approved') && date >= r.startDate && date <= r.endDate
          ).length;
          const borrowedCount = get().borrowRecords.filter(
            (r) => r.toolId === toolId && r.status === 'borrowed'
          ).length;
          
          if (activeReservationsCount + borrowedCount >= tool.totalStock) {
            return false;
          }
          
          if (timeSlot === 'fullday' && reservedSlots.length > 0) {
            return false;
          }
          if (timeSlot !== 'fullday' && (reservedSlots.includes(timeSlot) || reservedSlots.includes('fullday'))) {
            return false;
          }
        }
        return true;
      },

      updateToolStatus: (toolId, status) => {
        if (!get().isAdminView) return;
        if (get().currentUser.role !== 'admin') return;
        set((state) => ({
          tools: state.tools.map((t) =>
            t.id === toolId ? { ...t, status } : t
          ),
        }));
      },

      updateToolLocation: (toolId, location, buildingId, buildingName) => {
        if (!get().isAdminView) return;
        if (get().currentUser.role !== 'admin') return;
        set((state) => ({
          tools: state.tools.map((t) =>
            t.id === toolId
              ? {
                  ...t,
                  location,
                  buildingId: buildingId ?? t.buildingId,
                  buildingName: buildingName ?? t.buildingName,
                }
              : t
          ),
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
        isAdminView: state.isAdminView,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.currentUser && state.currentUser.role !== 'admin') {
          state.isAdminView = false;
        }
      },
    }
  )
);
