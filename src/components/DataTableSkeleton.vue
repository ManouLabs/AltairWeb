<script setup>
defineProps({
    columns: {
        type: Number,
        default: 5
    },
    rows: {
        type: Number,
        default: 8
    },
    actionButtons: {
        type: Number,
        default: 2
    },
    hasAvatar: {
        type: Boolean,
        default: false
    },
    hasTagColumn: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <!-- Skeleton DataTable -->
    <div class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
        <!-- Skeleton Toolbar -->
        <div class="flex items-center justify-between px-4 py-6 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
            <div class="flex gap-2">
                <Skeleton width="9rem" height="2.25rem" borderRadius="8px" />
                <Skeleton width="9rem" height="2.25rem" borderRadius="8px" />
            </div>
            <Skeleton width="14rem" height="2.25rem" borderRadius="8px" />
            <Skeleton width="14rem" height="2.25rem" borderRadius="8px" />
        </div>

        <!-- Skeleton Table Header -->
        <div class="skeleton-table-row px-4 py-4 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700" :style="{ gridTemplateColumns: `2.5rem repeat(${columns}, 1fr) 5rem` }">
            <Skeleton width="1.25rem" height="1.25rem" borderRadius="4px" />
            <Skeleton v-for="i in columns" :key="i" :width="5 + (i % 3) * 2 + 'rem'" height="1rem" />
            <Skeleton width="4rem" height="1rem" />
        </div>

        <!-- Skeleton Table Rows -->
        <div v-for="i in rows" :key="i" class="skeleton-table-row px-4 py-3 border-b border-surface-100 dark:border-surface-800" :style="{ gridTemplateColumns: `2.5rem repeat(${columns}, 1fr) 5rem` }">
            <Skeleton width="1.25rem" height="1.25rem" borderRadius="4px" />
            <!-- First Column (optionally with Avatar) -->
            <div class="flex items-center gap-2">
                <Skeleton v-if="hasAvatar" width="2rem" height="2rem" shape="circle" />
                <Skeleton :width="4 + ((i * 7) % 4) + 'rem'" height="0.85rem" />
            </div>
            <!-- Remaining Columns -->
            <template v-for="j in columns - 1" :key="'col-' + j">
                <!-- Tag Column -->
                <div v-if="hasTagColumn && j === columns - 1" class="flex gap-1">
                    <Skeleton width="4rem" height="1.5rem" borderRadius="16px" />
                    <Skeleton v-if="i % 3 === 0" width="3.5rem" height="1.5rem" borderRadius="16px" />
                </div>
                <!-- Regular Column -->
                <Skeleton v-else :width="3 + ((j * i * 3) % 5) + 'rem'" height="0.85rem" />
            </template>
            <!-- Actions -->
            <div class="flex gap-1 justify-end">
                <Skeleton width="2rem" height="2rem" shape="circle" />
                <Skeleton width="2rem" height="2rem" shape="circle" />
            </div>
        </div>

        <!-- Skeleton Pagination -->
        <div class="flex items-center justify-between px-4 py-3">
            <Skeleton width="16rem" height="0.85rem" />
            <div class="flex items-center gap-1">
                <Skeleton v-for="i in 5" :key="i" width="2rem" height="2rem" borderRadius="6px" />
            </div>
            <Skeleton width="6rem" height="2rem" borderRadius="6px" />
        </div>
    </div>
</template>

<style scoped>
.skeleton-table-row {
    display: grid;
    align-items: center;
    gap: 1rem;
}
</style>
