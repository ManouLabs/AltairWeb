<script setup>
const props = defineProps({
    text: { type: String, required: true },
    frozen: { type: Boolean, default: false },
    reorderTooltip: { type: String, default: '' },
    lockTooltip: { type: String, default: '' },
    unlockTooltip: { type: String, default: '' }
});

const emit = defineEmits(['toggle']);
const onToggle = () => emit('toggle');
</script>

<template>
    <div class="flex justify-between w-full items-center">
        <div v-tooltip.top="reorderTooltip" :class="{ 'font-bold': props.frozen }">{{ props.text }}</div>
        <Button v-tooltip.top="props.frozen ? props.unlockTooltip : props.lockTooltip" :icon="props.frozen ? 'pi pi-lock' : 'pi pi-lock-open'" text @click="onToggle" severity="contrast" />
    </div>
</template>
