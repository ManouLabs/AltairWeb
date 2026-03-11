<template>
    <div class="flex flex-col gap-6 p-6">
        <!-- Logo Upload Skeleton -->
        <div class="flex flex-col items-center gap-2">
            <Skeleton width="6rem" height="6rem" shape="circle" />
            <Skeleton width="4rem" height="0.65rem" />
        </div>

        <!-- GENERAL INFORMATION Section -->
        <div>
            <!-- Supplier Name Skeleton -->
            <div class="mb-4">
                <Skeleton width="100%" height="3rem" borderRadius="8px" />
            </div>

            <!-- Supplier Type Grid Skeleton -->
            <div>
                <Skeleton width="3.5rem" height="0.8rem" class="mb-2" />
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <div v-for="i in 7" :key="i" class="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-surface-200 dark:border-surface-700 min-w-[80px]">
                        <Skeleton width="1.5rem" height="1.5rem" shape="circle" />
                        <Skeleton :width="(3 + Math.random() * 3).toFixed(0) + 'rem'" height="0.5rem" />
                    </div>
                </div>
            </div>
        </div>

        <!-- CONTACT METHODS Section Skeleton -->
        <div>
            <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <Skeleton width="9rem" height="1.1rem" class="mb-4" />
                <div class="flex flex-wrap items-center gap-2">
                    <!-- Existing method chips -->
                    <div v-for="i in 2" :key="i" class="flex items-center gap-1 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-md pl-3 pr-2 py-2">
                        <Skeleton width="1rem" height="1rem" shape="circle" />
                        <Skeleton width="8rem" height="0.85rem" class="ml-1" />
                    </div>
                    <!-- Add button pill -->
                    <div class="flex items-center gap-1.5 border border-dashed border-surface-300 dark:border-surface-600 rounded-md px-3 py-2.5">
                        <Skeleton width="0.75rem" height="0.75rem" shape="circle" />
                        <Skeleton width="4rem" height="0.6rem" />
                    </div>
                </div>
            </div>
        </div>

        <!-- BUSINESS ADDRESS Section Skeleton -->
        <Skeleton width="5rem" height="1.1rem" class="mb-0" />
        <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <div class="flex flex-col gap-4">
                <!-- Street -->
                <Skeleton width="100%" height="3rem" borderRadius="8px" />
                <!-- Region + City row -->
                <div class="grid grid-cols-2 gap-4">
                    <Skeleton width="100%" height="3rem" borderRadius="8px" />
                    <Skeleton width="100%" height="3rem" borderRadius="8px" />
                </div>
            </div>
        </div>

        <!-- Footer Actions Skeleton -->
        <div class="flex justify-end gap-2 mt-4">
            <Skeleton width="5.5rem" height="2.25rem" borderRadius="8px" />
            <Skeleton width="5rem" height="2.25rem" borderRadius="8px" />
        </div>
    </div>
</template>
