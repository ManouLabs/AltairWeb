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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column Skeleton -->
        <div class="lg:col-span-2 flex flex-col gap-6">
            <!-- Customer Section Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <Skeleton shape="circle" size="1.25rem" />
                    <Skeleton width="10rem" height="1.25rem" />
                </div>
                <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mb-4" />
                <Skeleton width="10rem" height="2.25rem" borderRadius="0.5rem" />
            </div>

            <!-- Products Section Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <Skeleton shape="circle" size="1.25rem" />
                    <Skeleton width="8rem" height="1.25rem" />
                </div>
                <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mb-4" />
                <!-- Fake product rows -->
                <div class="flex flex-col gap-3">
                    <div v-for="n in 2" :key="n" class="flex items-center gap-4 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <Skeleton shape="circle" size="2rem" />
                        <div class="flex-1">
                            <Skeleton width="60%" height="0.875rem" class="mb-1" />
                            <Skeleton width="30%" height="0.75rem" />
                        </div>
                        <Skeleton width="4rem" height="2rem" borderRadius="0.375rem" />
                        <Skeleton width="5rem" height="0.875rem" />
                    </div>
                </div>
            </div>

            <!-- Order Details Section Skeleton -->
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <Skeleton shape="circle" size="1.25rem" />
                    <Skeleton width="9rem" height="1.25rem" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton v-for="n in 4" :key="n" width="100%" height="2.75rem" borderRadius="0.5rem" />
                </div>
                <!-- Shipping type + Source -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                    <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                </div>
                <!-- Status + Payment -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                    <div class="flex gap-2">
                        <Skeleton width="50%" height="2.75rem" borderRadius="0.75rem" />
                        <Skeleton width="50%" height="2.75rem" borderRadius="0.75rem" />
                    </div>
                </div>
                <!-- Note -->
                <Skeleton width="100%" height="5rem" borderRadius="0.5rem" class="mt-4" />
            </div>
        </div>

        <!-- Right Column Skeleton (Pricing) -->
        <div class="lg:col-span-1">
            <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm sticky top-6">
                <div class="flex items-center gap-2 mb-6">
                    <Skeleton shape="circle" size="1.25rem" />
                    <Skeleton width="10rem" height="1.25rem" />
                </div>
                <div class="flex flex-col gap-4">
                    <!-- Subtotal -->
                    <div class="flex items-center justify-between">
                        <Skeleton width="5rem" height="0.875rem" />
                        <Skeleton width="6rem" height="0.875rem" />
                    </div>
                    <Divider />
                    <!-- Discount -->
                    <div class="flex items-center justify-between">
                        <Skeleton width="5rem" height="0.875rem" />
                        <Skeleton width="5rem" height="0.875rem" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                        <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                    </div>
                    <Divider />
                    <!-- Shipping -->
                    <div class="flex items-center justify-between">
                        <Skeleton width="6rem" height="0.875rem" />
                        <Skeleton width="5rem" height="0.875rem" />
                    </div>
                    <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                    <Divider />
                    <!-- Grand Total -->
                    <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
                    <!-- Buttons -->
                    <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mt-2" />
                    <Skeleton width="100%" height="2.25rem" borderRadius="0.5rem" />
                </div>
            </div>
        </div>
    </div>
</template>
