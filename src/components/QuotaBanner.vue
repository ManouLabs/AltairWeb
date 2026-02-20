<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    resource: string;
    used: number;
    limit: number | null;
    percentage: number;
    status: 'danger' | 'warning' | null;
}>();

const message = computed(() => {
    if (props.limit === null) return '';
    const label = props.resource.charAt(0).toUpperCase() + props.resource.slice(1);
    if (props.status === 'danger') {
        return `You've reached the maximum of ${props.limit} ${label.toLowerCase()}. Upgrade your plan to add more.`;
    }
    return `You're using ${props.used} of ${props.limit} ${label.toLowerCase()} (${props.percentage}%).`;
});

const severity = computed(() => {
    if (props.status === 'danger') return 'error';
    if (props.status === 'warning') return 'warn';
    return 'info';
});

const icon = computed(() => {
    if (props.status === 'danger') return 'pi pi-ban';
    return 'pi pi-exclamation-triangle';
});
</script>

<template>
    <Message v-if="status" :severity="severity" :icon="icon" :closable="false" class="mb-4">
        {{ message }}
    </Message>
</template>
