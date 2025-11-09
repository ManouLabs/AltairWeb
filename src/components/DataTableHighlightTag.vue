<!-- DataTableHighlightTag.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
    state: { type: String, default: 'new' }
});

const visible = computed(() => props.state);
const severity = computed(() => (props.state === 'new' ? 'success' : props.state === 'updated' ? 'info' : undefined));
const label = computed(() => (props.state ? String(props.state).toUpperCase() : ''));
</script>

<template>
    <Tag v-if="visible" :value="label" :severity="severity" rounded size="small" />
</template>
