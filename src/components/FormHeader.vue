<script setup lang="ts">
import { computed, inject } from 'vue';

interface Props {
    icon?: string | null;
    iconColor?: string | null;
    title?: string;
    description?: string | null;
}

const props = defineProps<Props>();
const dialogRef = inject<any>('dialogRef', null);

// Reactive data from dialog data if available, otherwise from props
const headerData = computed(() => {
    if (dialogRef?.value?.data?.headerProps) {
        return dialogRef.value.data.headerProps;
    }
    return props;
});

const iconBgColor = computed(() => {
    const color = headerData.value.iconColor;
    if (!color) return '#3B82F620';
    // If it's a hex color, append transparency
    if (color.startsWith('#')) {
        return color + '20';
    }
    return color;
});
</script>

<template>
    <div class="flex items-center justify-between gap-4 py-1 w-full">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors duration-300" :style="{ backgroundColor: iconBgColor }">
                <i :class="headerData.icon || 'pi pi-pencil'" class="text-xl transition-all duration-300" :style="{ color: headerData.iconColor || '#3B82F6' }"></i>
            </div>
            <div class="flex flex-col gap-0.5">
                <h3 class="m-0 text-lg font-bold tracking-tight text-surface-900 dark:text-surface-0">
                    {{ headerData.title }}
                </h3>
                <p v-if="headerData.description" class="m-0 text-xs text-surface-500 dark:text-surface-400">
                    {{ headerData.description }}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<style scoped></style>
