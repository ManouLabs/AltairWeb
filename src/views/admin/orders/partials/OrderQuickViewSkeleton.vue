<template>
    <div class="flex flex-col gap-5">
        <!-- Header: Status tags + edit button -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Skeleton width="5.5rem" height="1.75rem" borderRadius="1rem" />
                <Skeleton width="5rem" height="1.75rem" borderRadius="1rem" />
            </div>
            <Skeleton width="5.5rem" height="2.5rem" borderRadius="8px" />
        </div>
        <Skeleton width="10rem" height="0.65rem" />

        <Divider />

        <!-- Order Journey Timeline (full width) -->
        <div>
            <Skeleton width="8rem" height="0.9rem" class="mb-3" />
            <div class="flex flex-col gap-4 ml-1">
                <div v-for="i in 3" :key="i" class="flex items-start gap-3">
                    <Skeleton width="1.75rem" height="1.75rem" shape="circle" />
                    <div class="flex-1">
                        <Skeleton width="60%" height="0.75rem" class="mb-1.5" />
                        <Skeleton width="40%" height="0.55rem" class="mb-1" />
                        <Skeleton v-if="i === 2" width="80%" height="0.55rem" />
                    </div>
                </div>
            </div>
        </div>

        <Divider />

        <!-- Summary + Customer side by side -->
        <div class="flex gap-4">
            <!-- Summary Card -->
            <div class="w-full">
                <Skeleton width="5rem" height="0.9rem" class="mb-3" />
                <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col gap-2.5">
                    <div v-for="i in 3" :key="i" class="flex justify-between">
                        <Skeleton width="5rem" height="0.7rem" />
                        <Skeleton width="4.5rem" height="0.7rem" />
                    </div>
                    <Divider class="my-1" />
                    <div class="flex justify-between">
                        <Skeleton width="3rem" height="0.85rem" />
                        <Skeleton width="5.5rem" height="0.85rem" />
                    </div>
                </div>
            </div>
            <!-- Customer Card -->
            <div class="w-full">
                <Skeleton width="5rem" height="0.9rem" class="mb-3" />
                <div class="flex items-start gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-xl">
                    <Skeleton width="2.5rem" height="2.5rem" shape="circle" />
                    <div class="flex-1">
                        <Skeleton width="8rem" height="0.8rem" class="mb-1.5" />
                        <Skeleton width="6rem" height="0.6rem" class="mb-1" />
                        <Skeleton width="9rem" height="0.6rem" class="mb-2" />
                        <Skeleton width="4.5rem" height="1.25rem" borderRadius="1rem" />
                    </div>
                </div>
            </div>
        </div>

        <Divider />

        <!-- Items List (full width) -->
        <div>
            <Skeleton width="5rem" height="0.9rem" class="mb-3" />
            <div class="flex flex-col gap-2">
                <div v-for="i in 2" :key="i" class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-xl">
                    <Skeleton width="2.25rem" height="2.25rem" borderRadius="8px" />
                    <div class="flex-1">
                        <Skeleton width="70%" height="0.75rem" class="mb-1" />
                        <Skeleton width="40%" height="0.55rem" />
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <Skeleton width="4rem" height="0.55rem" />
                        <Skeleton width="3.5rem" height="0.75rem" />
                    </div>
                </div>
            </div>
        </div>

        <Divider />

        <!-- Order Details (full width) -->
        <div>
            <Skeleton width="5rem" height="0.9rem" class="mb-3" />
            <div class="flex flex-col gap-2.5">
                <div v-for="i in 4" :key="i" class="flex items-center justify-between">
                    <Skeleton width="5rem" height="0.7rem" />
                    <Skeleton width="6rem" height="0.7rem" />
                </div>
            </div>
        </div>
    </div>
</template>
