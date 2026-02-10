<script setup lang="ts">
interface Props {
    icon?: string;
    iconColor?: string;
    title: string;
    description?: string | null;
}

withDefaults(defineProps<Props>(), {
    icon: 'pi pi-home',
    iconColor: '#8B5CF6'
});
</script>

<template>
    <div class="datatable-page-header">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" :style="{ backgroundColor: iconColor + '20' }">
                <i :class="icon" class="text-xl" :style="{ color: iconColor }"></i>
            </div>
            <div>
                <h2>{{ title }}</h2>
                <p v-if="description">{{ description }}</p>
            </div>
        </div>
        <div class="header-actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>
