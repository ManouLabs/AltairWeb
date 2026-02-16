<script setup>
import { useLoading } from '@/stores/useLoadingStore';
import { onMounted } from 'vue';

const loading = useLoading();

onMounted(() => {
    loading.stopPageLoading();
});
</script>

<template>
    <div>{{ $t('common.titles.dashboard') }}</div>
</template>
