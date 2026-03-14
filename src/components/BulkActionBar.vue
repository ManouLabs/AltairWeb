<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export interface BulkActionOption {
    label: string;
    value: string;
    icon?: string;
    severity?: string;
}

export interface BulkAction {
    key: string;
    label: string;
    icon?: string;
    severity?: string;
    type?: 'button' | 'select';
    options?: BulkActionOption[];
}

const severityColorMap: Record<string, string> = {
    success: 'var(--p-green-500)',
    info: 'var(--p-blue-500)',
    warn: 'var(--p-yellow-500)',
    danger: 'var(--p-red-500)',
    secondary: 'var(--p-surface-500)',
    contrast: 'var(--p-surface-900)'
};

const props = withDefaults(
    defineProps<{
        selectedCount: number;
        entityLabel: string;
        actions?: BulkAction[];
        showDelete?: boolean;
    }>(),
    {
        actions: () => [],
        showDelete: true
    }
);

const emit = defineEmits<{
    (e: 'action', payload: { key: string; value?: string }): void;
    (e: 'delete'): void;
}>();

const { t } = useI18n();

const isVisible = computed(() => props.selectedCount > 0);

// Track select model values so we can reset after action
const selectModels = ref<Record<string, string | null>>({});

function onSelectAction(action: BulkAction, value: string): void {
    emit('action', { key: action.key, value });
    selectModels.value[action.key] = null;
}
</script>

<template>
    <Transition name="bulk-bar">
        <div v-if="isVisible" class="fixed top-48 left-1/2 -translate-x-1/2 z-50">
            <div class="flex items-center text-xl gap-3 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl px-8 py-3.5">
                <!-- Selected count -->
                <div class="flex items-center gap-2 pr-3 border-r border-surface-200 dark:border-surface-700">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center bg-primary">
                        <i class="pi pi-check text-white text-sm"></i>
                    </div>
                    <span class="text-lg font-medium text-surface-700 dark:text-surface-200 whitespace-nowrap"> {{ selectedCount }} {{ entityLabel }} {{ t('common.labels.bulk_selected') }} </span>
                </div>

                <!-- Action buttons -->
                <template v-for="action in actions" :key="action.key">
                    <!-- Select type action (dropdown) -->
                    <Select
                        v-if="action.type === 'select'"
                        v-model="selectModels[action.key]"
                        :options="action.options"
                        optionLabel="label"
                        optionValue="value"
                        :placeholder="action.label"
                        size="small"
                        class="min-w-36"
                        @update:modelValue="(val: string) => onSelectAction(action, val)"
                    >
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i v-if="option.icon" :class="option.icon" class="text-sm w-4 mt-0.5 text-center flex-shrink-0" :style="option.severity ? { color: severityColorMap[option.severity] || '' } : {}" />
                                <span v-else-if="option.severity" class="rounded-full flex-shrink-0" :style="{ backgroundColor: severityColorMap[option.severity] || 'var(--p-surface-400)' }" />
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                    </Select>

                    <!-- Button type action -->
                    <Button v-else :label="action.label" :icon="action.icon" :severity="(action.severity as any) || 'secondary'" size="small" outlined @click="emit('action', { key: action.key })" />
                </template>

                <!-- Delete button (safeguard handled by parent pages) -->
                <Button v-if="showDelete" v-tooltip.top="t('common.labels.delete_selected', { entity: entityLabel })" icon="pi pi-trash" severity="danger" size="small" text rounded @click="emit('delete')" />
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.bulk-bar-enter-active,
.bulk-bar-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bulk-bar-enter-from,
.bulk-bar-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>
