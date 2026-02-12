<script setup lang="ts">
defineProps<{
    title: string;
    icon?: string;
    iconColor?: string;
}>();
</script>

<template>
    <Card class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden shadow-none !p-0" :pt="{ body: { class: '!p-0' }, content: { class: '!p-0' } }">
        <template #content>
            <div class="flex items-center gap-2 font-semibold text-md uppercase tracking-wider text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                <i v-if="icon" :class="icon" class="text-base" :style="{ color: iconColor || 'var(--p-primary-color)' }"></i>
                <span>{{ title }}</span>
                <div class="ml-auto flex items-center gap-2">
                    <slot name="header-actions" />
                </div>
            </div>
            <div class="p-5">
                <slot />
            </div>
            <div v-if="$slots.footer" class="bg-surface-50 dark:bg-surface-900 px-5 py-3 border-t border-surface-200 dark:border-surface-700">
                <slot name="footer" />
            </div>
        </template>
    </Card>
</template>
