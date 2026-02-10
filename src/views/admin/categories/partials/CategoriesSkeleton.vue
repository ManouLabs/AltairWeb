<template>
    <!-- Skeleton Page Header -->
    <div class="datatable-page-header">
        <div class="flex items-center gap-4">
            <Skeleton width="3rem" height="3rem" borderRadius="12px" />
            <div class="flex flex-col gap-2">
                <Skeleton width="16rem" height="1.25rem" />
                <Skeleton width="22rem" height="0.85rem" />
            </div>
        </div>
        <div class="flex items-center gap-3">
            <Skeleton width="7rem" height="2.5rem" borderRadius="8px" />
            <Skeleton width="9rem" height="2.5rem" borderRadius="8px" />
        </div>
    </div>

    <!-- Skeleton Main Content -->
    <div class="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        <!-- Skeleton Left Panel: Category Tree -->
        <Card class="w-full lg:w-[400px] flex-shrink-0 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden shadow-none !p-0" :pt="{ body: { class: '!p-0' }, content: { class: '!p-0' } }">
            <template #content>
                <div class="flex items-center justify-center gap-2 py-6 px-5 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                    <Skeleton width="1rem" height="1rem" shape="circle" />
                    <Skeleton width="9rem" height="0.9rem" />
                </div>
                <div class="p-8 flex flex-col gap-1">
                    <div class="flex items-center gap-3 py-2.5" v-for="i in 6" :key="i" :class="{ 'pl-8': i === 2 || i === 3, 'pl-16': i === 5 || i === 6 }">
                        <Skeleton width="1.1rem" height="1.1rem" shape="circle" />
                        <Skeleton :width="(10 + Math.random() * 6).toFixed(0) + 'rem'" height="0.9rem" class="flex-1" />
                        <Skeleton v-if="i === 1 || i === 4" width="1.5rem" height="1.5rem" borderRadius="50%" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Skeleton Right Panel -->
        <div class="flex-1 flex flex-col gap-6">
            <!-- Skeleton Category Header Card -->
            <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-xl p-8">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div class="flex gap-4">
                            <Skeleton width="4rem" height="4rem" borderRadius="16px" />
                            <div>
                                <div class="flex items-center gap-3 mb-2">
                                    <Skeleton width="12rem" height="1.5rem" />
                                    <Skeleton width="5rem" height="1.75rem" borderRadius="16px" />
                                </div>
                                <Skeleton width="20rem" height="0.85rem" />
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <Skeleton width="2.5rem" height="2.5rem" shape="circle" />
                            <Skeleton width="2.5rem" height="2.5rem" shape="circle" />
                        </div>
                    </div>

                    <!-- Skeleton Stats Row -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                        <div class="text-left" v-for="i in 4" :key="i">
                            <Skeleton width="5rem" height="0.6rem" class="mb-2" />
                            <Skeleton width="3.5rem" height="1.25rem" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Skeleton Sub-categories Section -->
            <div class="flex justify-between items-center px-4 pt-4">
                <Skeleton width="14rem" height="0.75rem" />
                <Skeleton width="8rem" height="2rem" borderRadius="8px" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <Card v-for="i in 4" :key="i" class="!bg-surface-0 dark:!bg-surface-900 border border-surface-200 dark:border-surface-700" :pt="{ content: { class: '!p-4' } }">
                    <template #content>
                        <div class="flex justify-between items-start mb-4">
                            <Skeleton width="3rem" height="3rem" borderRadius="12px" />
                            <div class="flex gap-1">
                                <Skeleton width="2rem" height="2rem" shape="circle" />
                                <Skeleton width="2rem" height="2rem" shape="circle" />
                            </div>
                        </div>
                        <Skeleton width="8rem" height="1rem" class="mb-4" />
                        <div class="flex justify-between items-center">
                            <Skeleton width="5rem" height="0.7rem" />
                            <Skeleton width="4rem" height="1.25rem" borderRadius="8px" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>
