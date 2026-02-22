<script setup lang="ts">
import { useQuotaStore } from '@/stores/useQuotaStore';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const quotaStore = useQuotaStore();

const props = defineProps<{
    resource: string;
    used: number;
    limit: number | null;
    percentage: number;
    status: 'danger' | 'warning' | null;
}>();

const label = computed(() => t(`entity.${props.resource}`));

const isDanger = computed(() => props.status === 'danger');

const nextPlanName = computed(() => quotaStore.nextPlan?.name ?? null);

const nextPlanLimit = computed(() => quotaStore.getNextPlanLimit(props.resource));

// Features that the next plan unlocks for this resource
const upgradeFeatures = computed(() => {
    if (!quotaStore.nextPlan) return [];

    const features: string[] = [];
    const next = quotaStore.nextPlan;

    // Show what the next plan offers for the current resource
    const nextLimit = nextPlanLimit.value;
    if (nextLimit !== null && props.limit !== null && nextLimit > props.limit) {
        features.push(t('quota.features.up_to', { count: nextLimit, entity: label.value.toLowerCase() }));
    } else if (nextLimit === null) {
        features.push(t('quota.features.unlimited', { entity: label.value.toLowerCase() }));
    }

    // Show other resource improvements
    const otherResources = ['orders', 'products', 'users', 'shops'].filter((r) => r !== props.resource);
    for (const res of otherResources.slice(0, 2)) {
        const resourceLimit = (next as Record<string, any>)[res];
        if (resourceLimit === null) {
            features.push(t('quota.features.unlimited', { entity: t(`entity.${res}`).toLowerCase() }));
        } else if (resourceLimit) {
            features.push(t('quota.features.up_to', { count: resourceLimit, entity: t(`entity.${res}`).toLowerCase() }));
        }
    }

    return features;
});
</script>

<template>
    <div v-if="status" class="mb-6 rounded-2xl bg-white dark:bg-surface-800" style="border: 2px solid rgba(139, 92, 246, 0.2); box-shadow: 0 4px 24px -4px rgba(139, 92, 246, 0.1)">
        <div class="flex flex-col md:flex-row items-center gap-6 p-6">
            <!-- Rotated Icon Box -->
            <div class="flex-shrink-0 relative w-24 h-24 flex items-center justify-center">
                <!-- Outer normal gray box -->
                <div class="absolute inset-0 rounded-2xl bg-surface-100 dark:bg-surface-700/50" style="box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.08)"></div>
                <!-- Inner gradient box rotated inversely -->
                <div class="relative w-16 h-16 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-purple-600 -rotate-6">
                    <i class="pi pi-lock text-2xl text-white"></i>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 text-center md:text-left">
                <!-- Status Label -->
                <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-3"
                    :class="isDanger ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' : 'bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400'"
                >
                    <i class="pi text-[10px]" :class="isDanger ? 'pi-exclamation-circle' : 'pi-exclamation-triangle'"></i>
                    {{ isDanger ? t('quota.labels.limit_reached') : t('quota.labels.limit_warning') }}
                </span>

                <!-- Main Message -->
                <h3 class="text-xl font-bold text-surface-800 dark:text-white mb-2">
                    <template v-if="isDanger">
                        {{ t('quota.messages.reached_max', { limit: limit }) }}
                        <span class="text-violet-600 dark:text-violet-400">{{ limit }} {{ label.toLowerCase() }}</span
                        >.
                    </template>
                    <template v-else>
                        {{ t('quota.messages.approaching_limit', { used: used, limit: limit, entity: label.toLowerCase() }) }}
                    </template>
                </h3>

                <!-- Description -->
                <p v-if="isDanger && nextPlanName" class="text-sm text-surface-500 dark:text-surface-400 mb-4">
                    {{ t('quota.messages.upgrade_description', { plan: quotaStore.plan?.name, nextPlan: nextPlanName }) }}
                </p>

                <!-- Features from next plan -->
                <div v-if="upgradeFeatures.length > 0" class="flex flex-wrap gap-4 mb-2">
                    <span v-for="(feature, idx) in upgradeFeatures" :key="idx" class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-300">
                        <i class="pi pi-check-circle text-xs text-green-500"></i>
                        {{ feature }}
                    </span>
                </div>
            </div>

            <!-- CTA Button -->
            <div v-if="isDanger && nextPlanName" class="flex-shrink-0">
                <Button
                    :label="t('quota.actions.unlock', { entity: label })"
                    icon="pi pi-bolt"
                    class="!bg-gradient-to-r !from-cyan-400 !via-violet-500 !to-purple-600 !border-0 !text-white hover:!shadow-lg hover:!shadow-violet-500/25 transition-all whitespace-nowrap !rounded-full !px-6"
                />
            </div>
        </div>
    </div>
</template>
