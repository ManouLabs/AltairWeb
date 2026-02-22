// src/stores/useQuotaStore.ts
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';

interface QuotaItem {
    resource: string;
    used: number;
    limit: number | null;
    percentage: number;
    canCreate: boolean;
}

interface PlanInfo {
    name: string;
    level: number;
}

interface NextPlanInfo {
    name: string;
    orders: number | null;
    products: number | null;
    users: number | null;
    shops: number | null;
}

interface QuotaState {
    quotas: QuotaItem[];
    plan: PlanInfo | null;
    nextPlan: NextPlanInfo | null;
    loaded: boolean;
    loading: boolean;
}

export const useQuotaStore = defineStore('quota', {
    state: (): QuotaState => ({
        quotas: [],
        plan: null,
        nextPlan: null,
        loaded: false,
        loading: false
    }),

    getters: {
        getQuota:
            (state) =>
            (resource: string): QuotaItem | undefined =>
                state.quotas.find((q) => q.resource === resource),

        canCreate:
            (state) =>
            (resource: string): boolean => {
                const quota = state.quotas.find((q) => q.resource === resource);
                return quota?.canCreate ?? true;
            },

        getUsage:
            (state) =>
            (resource: string): number => {
                const quota = state.quotas.find((q) => q.resource === resource);
                return quota?.used ?? 0;
            },

        getLimit:
            (state) =>
            (resource: string): number | null => {
                const quota = state.quotas.find((q) => q.resource === resource);
                return quota?.limit ?? null;
            },

        getPercentage:
            (state) =>
            (resource: string): number => {
                const quota = state.quotas.find((q) => q.resource === resource);
                return quota?.percentage ?? 0;
            },

        /**
         * Returns 'danger' (>=100%), 'warning' (>=80%), or null
         */
        getStatus:
            (state) =>
            (resource: string): 'danger' | 'warning' | null => {
                const quota = state.quotas.find((q) => q.resource === resource);
                if (!quota || quota.limit === null) return null;
                if (quota.percentage >= 100) return 'danger';
                if (quota.percentage >= 80) return 'warning';
                return null;
            },

        /**
         * Get what the next plan offers for a specific resource
         */
        getNextPlanLimit:
            (state) =>
            (resource: string): number | null => {
                if (!state.nextPlan) return null;
                return (state.nextPlan as Record<string, any>)[resource] ?? null;
            }
    },

    actions: {
        async fetchQuotas(): Promise<void> {
            if (this.loading) return;
            this.loading = true;
            try {
                const response = await apiClient.get('/api/admin/quotas');
                this.quotas = response.data.quotas ?? [];
                this.plan = response.data.plan ?? null;
                this.nextPlan = response.data.nextPlan ?? null;
                this.loaded = true;
            } catch (error) {
                console.error('Failed to fetch quotas', error);
            } finally {
                this.loading = false;
            }
        },

        /** Refresh quotas silently (no loading flag for smoother UX) */
        async refreshQuotas(): Promise<void> {
            try {
                const response = await apiClient.get('/api/admin/quotas');
                this.quotas = response.data.quotas ?? [];
                this.plan = response.data.plan ?? null;
                this.nextPlan = response.data.nextPlan ?? null;
            } catch {
                // Silently fail on refresh
            }
        }
    }
});
