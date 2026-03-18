<template>
    <!-- Top Bar Skeleton -->
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
            <Skeleton shape="circle" size="2.5rem" />
            <div>
                <Skeleton width="14rem" height="1.5rem" class="mb-1" />
                <Skeleton width="8rem" height="0.875rem" />
            </div>
        </div>
        <Skeleton width="5rem" height="1.75rem" borderRadius="9999px" />
    </div>

    <div class="grid grid-cols-12 gap-6">
        <!-- Left Column Skeleton -->
        <div class="col-span-12 lg:col-span-9 flex flex-col gap-4">
            <!-- Item Card Skeletons -->
            <div v-for="n in 3" :key="n" class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <Skeleton shape="circle" size="1.25rem" />
                        <Skeleton width="10rem" height="1rem" />
                    </div>
                    <Skeleton width="10rem" height="2rem" borderRadius="0.375rem" />
                </div>
                <div class="grid grid-cols-11 gap-3">
                    <div class="col-span-5">
                        <div class="rounded-xl border-2 border-surface-200 dark:border-surface-700 p-4">
                            <Skeleton width="6rem" height="0.625rem" class="mb-3" />
                            <div class="flex items-start gap-3">
                                <Skeleton width="3.5rem" height="3.5rem" borderRadius="0.5rem" />
                                <div class="flex-1">
                                    <Skeleton width="80%" height="0.875rem" class="mb-1" />
                                    <Skeleton width="40%" height="0.75rem" class="mb-1" />
                                    <Skeleton width="5rem" height="0.875rem" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1 flex items-center justify-center">
                        <Skeleton shape="circle" size="2.25rem" />
                    </div>
                    <div class="col-span-5">
                        <div class="rounded-xl border-2 border-surface-200 dark:border-surface-700 p-4">
                            <Skeleton width="8rem" height="0.625rem" class="mb-3" />
                            <Skeleton width="100%" height="2.5rem" borderRadius="0.375rem" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Products Section Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <Skeleton shape="circle" size="1.25rem" />
                    <Skeleton width="10rem" height="1.25rem" />
                </div>
                <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
            </div>
        </div>

        <!-- Right Column Skeleton (Summary) -->
        <div class="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm">
                <Skeleton width="10rem" height="1.25rem" class="mb-4" />
                <div class="flex flex-col gap-3">
                    <div v-for="n in 4" :key="n" class="flex items-center justify-between">
                        <Skeleton width="7rem" height="0.875rem" />
                        <Skeleton width="5rem" height="0.875rem" />
                    </div>
                    <Divider />
                    <div class="flex items-center justify-between">
                        <Skeleton width="8rem" height="0.875rem" />
                        <Skeleton width="5rem" height="0.875rem" />
                    </div>
                    <Divider />
                    <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
                    <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mt-2" />
                </div>
            </div>
            <!-- Customer Card Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-3">
                    <Skeleton shape="circle" size="2.5rem" />
                    <div class="flex-1">
                        <Skeleton width="60%" height="0.875rem" class="mb-1" />
                        <Skeleton width="40%" height="0.75rem" />
                    </div>
                </div>
            </div>
            <!-- Note Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm">
                <Skeleton width="4rem" height="0.875rem" class="mb-2" />
                <Skeleton width="100%" height="5rem" borderRadius="0.5rem" />
            </div>
        </div>
    </div>
</template>
