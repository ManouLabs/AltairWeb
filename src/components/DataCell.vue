<!-- DataCell.vue -->
<script setup>
import { useLoading } from '@/stores/useLoadingStore';

const loading = useLoading();
</script>

<template>
    <div>
        <Skeleton v-if="loading.isDataLoading" class="m-4" />
        <slot v-else></slot>
    </div>
</template>
