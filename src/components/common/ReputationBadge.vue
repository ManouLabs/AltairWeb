<script setup lang="ts">
import { useReputation, type ReputationData } from '@/composables/useReputation';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { mapReputation } = useReputation();

const props = withDefaults(
    defineProps<{
        /** Raw reputation object from the API (level, percentage, delivered, returned) */
        reputation?: { level: string; percentage: number | null; delivered: number; returned: number } | null;
        /** Display size variant */
        size?: 'sm' | 'md' | 'lg';
    }>(),
    {
        reputation: null,
        size: 'md'
    }
);

const rep = computed<ReputationData>(() => mapReputation(props.reputation));

import { computed } from 'vue';
</script>

<template>
    <!-- SM: compact inline — bar + label + stats -->
    <div v-if="size === 'sm'" class="rep-sm">
        <div class="rep-sm-bar" :style="{ backgroundColor: rep.bgColor }">
            <div class="rep-sm-bar-fill" :style="{ width: (rep.percentage ?? 0) + '%', backgroundColor: rep.color }"></div>
        </div>
        <span class="rep-sm-label" :style="{ color: rep.color }">{{ rep.label }}</span>
        <div v-if="rep.level !== 'new'" class="rep-sm-stats">
            <span class="rep-sm-stat-delivered"><i class="pi pi-check-circle"></i>{{ rep.delivered }}</span>
            <span class="rep-sm-stat-returned"><i class="pi pi-times-circle"></i>{{ rep.returned }}</span>
        </div>
        <span v-else class="rep-sm-no-history">{{ t('customer.reputation.labels.no_history') }}</span>
    </div>

    <!-- MD: medium — label + percentage, wider bar, stats -->
    <div v-else-if="size === 'md'" class="rep-md">
        <div class="rep-md-header">
            <span class="rep-md-label" :style="{ color: rep.color }">
                {{ rep.label }}
                <template v-if="rep.percentage !== null">({{ rep.percentage }}%)</template>
            </span>
        </div>
        <div class="rep-md-bar" :style="{ backgroundColor: rep.bgColor }">
            <div class="rep-md-bar-fill" :style="{ width: (rep.percentage ?? 0) + '%', backgroundColor: rep.color }"></div>
        </div>
        <div v-if="rep.level !== 'new'" class="rep-md-stats">
            <span class="rep-md-stat-delivered"><i class="pi pi-check-circle"></i> {{ rep.delivered }}</span>
            <span class="rep-md-stat-returned"><i class="pi pi-times-circle"></i> {{ rep.returned }}</span>
        </div>
        <div v-else class="rep-md-no-history">{{ t('customer.reputation.labels.no_history') }}</div>
    </div>

    <!-- LG: full — label + percentage header, progress bar, stats row -->
    <div v-else class="reputation-cell">
        <div class="reputation-header">
            <span class="reputation-label" :style="{ color: rep.color }">
                {{ rep.label }}
                <template v-if="rep.percentage !== null">({{ rep.percentage }}%)</template>
            </span>
        </div>
        <div class="reputation-bar" :style="{ backgroundColor: rep.bgColor }">
            <div class="reputation-bar-fill" :style="{ width: rep.percentage !== null ? rep.percentage + '%' : '0%', backgroundColor: rep.color }"></div>
        </div>
        <div v-if="rep.level !== 'new'" class="reputation-stats">
            <span class="stat-delivered"><i class="pi pi-check-circle"></i>{{ rep.delivered }}</span>
            <span class="stat-returned"><i class="pi pi-times-circle"></i>{{ rep.returned }}</span>
        </div>
        <div v-else class="reputation-no-history">{{ t('customer.reputation.labels.no_history') }}</div>
    </div>
</template>

<style scoped>
/* ===== SM (compact inline) ===== */
.rep-sm {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.rep-sm-bar {
    flex: 1;
    height: 6px;
    border-radius: 9999px;
    overflow: hidden;
}

.rep-sm-bar-fill {
    height: 100%;
    border-radius: 9999px;
}

.rep-sm-label {
    font-size: 9px;
    font-weight: 600;
    flex-shrink: 0;
}

.rep-sm-stats {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 9px;
    flex-shrink: 0;
}

.rep-sm-stat-delivered {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #16a34a;
}

.rep-sm-stat-delivered i {
    font-size: 8px;
}

.rep-sm-stat-returned {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #ef4444;
}

.rep-sm-stat-returned i {
    font-size: 8px;
}

.rep-sm-no-history {
    font-size: 10px;
    color: #94a3b8;
    font-style: italic;
}

/* ===== MD (medium) ===== */
.rep-md {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.rep-md-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.125rem;
}

.rep-md-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.rep-md-bar {
    width: 100%;
    height: 8px;
    border-radius: 9999px;
    overflow: hidden;
}

.rep-md-bar-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.5s ease;
}

.rep-md-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.375rem;
    font-size: 0.75rem;
}

.rep-md-stat-delivered {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #16a34a;
}

.rep-md-stat-delivered i {
    font-size: 10px;
}

.rep-md-stat-returned {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #ef4444;
}

.rep-md-stat-returned i {
    font-size: 10px;
}

.rep-md-no-history {
    font-size: 0.75rem;
    color: #94a3b8;
    font-style: italic;
    margin-top: 0.375rem;
}
</style>
