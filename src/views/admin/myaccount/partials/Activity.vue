<script setup lang="ts">
import { useMyAccountService } from '@/services/useMyAccountService';
import { useLoading } from '@/stores/useLoadingStore';
import { humanizeDate } from '@/utilities/helper';
import type { Activity, PaginationMeta } from '@/types/myaccount';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loadingStore = useLoading();

interface ActivityWithUI extends Activity {
    icon: string;
    color: string;
}

const activities = ref<ActivityWithUI[]>([]);
const isInitialLoading = ref<boolean>(true);
const isLoadingMore = ref<boolean>(false);
const currentPage = ref<number>(1);
const hasMorePages = ref<boolean>(true);
const scrollContainer = ref<HTMLElement | null>(null);

const getActivityIconAndColor = (activity: Activity): { icon: string; color: string } => {
    switch (activity.log_name) {
        case 'user_log':
            return { icon: 'pi pi-user', color: 'bg-blue-500' };
        case 'role_log':
            return { icon: 'pi pi-shield', color: 'bg-sky-600' };
        case 'shop_log':
            return { icon: 'pi pi-shop', color: 'bg-green-500' };
        case 'shipper_log':
            return { icon: 'pi pi-truck', color: 'bg-orange-500' };
        default:
            return { icon: 'pi pi-info-circle', color: 'bg-gray-600' };
    }
};

const transformActivities = (rawActivities: Activity[]): ActivityWithUI[] => {
    return rawActivities.map((activity: Activity) => ({
        ...activity,
        ...getActivityIconAndColor(activity),
        created_at: humanizeDate(activity.created_at, t)
    })) as ActivityWithUI[];
};

const fetchActivities = async (page: number = 1): Promise<void> => {
    try {
        const response = await useMyAccountService.getActivities(page);
        const rawActivities = response.activities || [];
        const transformedActivities = transformActivities(rawActivities);

        if (page === 1) {
            activities.value = transformedActivities;
        } else {
            activities.value = [...activities.value, ...transformedActivities];
        }

        // Check if there are more pages
        if (response.meta) {
            hasMorePages.value = response.meta.current_page < response.meta.last_page;
        } else {
            // If no meta, assume no more pages if we got less than expected
            hasMorePages.value = rawActivities.length >= 10;
        }
    } catch (error) {
        console.error('Error fetching activities:', error);
        hasMorePages.value = false;
    }
};

const loadMore = async (): Promise<void> => {
    if (isLoadingMore.value || !hasMorePages.value) return;

    isLoadingMore.value = true;
    loadingStore.startPageLoading();
    currentPage.value++;

    try {
        await fetchActivities(currentPage.value);
    } finally {
        isLoadingMore.value = false;
        loadingStore.stopPageLoading();
    }
};

const handleScroll = (event: Event): void => {
    const target = event.target as HTMLElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    // Load more when within 100px of bottom
    if (scrollBottom < 100 && hasMorePages.value && !isLoadingMore.value) {
        loadMore();
    }
};

onMounted(async () => {
    loadingStore.startPageLoading();
    isInitialLoading.value = true;

    try {
        await fetchActivities(1);
    } finally {
        isInitialLoading.value = false;
        loadingStore.stopPageLoading();
    }
});
</script>
<template>
    <div class="px-0 py-5">
        <h2 class="text-xl font-bold text-center md:text-left">{{ t('myaccount.labels.activity') }}</h2>
        <span class="text-gray-400 block text-center md:text-left">{{ t('myaccount.labels.activity_description') }}</span>

        <!-- Scrollable container for infinite scroll -->
        <div ref="scrollContainer" class="mt-6 max-h-[500px] overflow-y-auto pr-2" @scroll="handleScroll">
            <!-- Initial loading skeletons -->
            <Timeline v-if="isInitialLoading" :value="[{}, {}, {}, {}]" align="left" class="customized-timeline w-full">
                <template #marker>
                    <span class="flex w-8 h-8 items-center justify-center rounded-full z-10 shadow-sm">
                        <Skeleton shape="circle" size="2rem" />
                    </span>
                </template>
                <template #content>
                    <div class="flex flex-col gap-2">
                        <Skeleton height="20px" width="66%" />
                        <Skeleton height="16px" width="33%" />
                        <Skeleton height="40px" width="100%" class="mb-4" />
                    </div>
                </template>
            </Timeline>

            <!-- Actual timeline content -->
            <Timeline v-else :value="activities" align="left" class="customized-timeline w-full">
                <template #marker="slotProps">
                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm" :class="slotProps.item.color">
                        <i :class="slotProps.item.icon"></i>
                    </span>
                </template>
                <template #content="slotProps">
                    <div class="flex flex-col">
                        <div v-if="slotProps.item.event && slotProps.item.description" class="flex items-center gap-2 mb-2">
                            <span class="font-semibold text-base">{{ slotProps.item.description }}</span>
                            <span
                                class="inline-block text-white text-xs font-medium px-2 py-1 rounded-full shadow"
                                :class="{
                                    'bg-primary': slotProps.item.event === 'created',
                                    'bg-blue-500': slotProps.item.event === 'updated',
                                    'bg-red-500': slotProps.item.event === 'deleted'
                                }"
                            >
                                {{ t('common.labels.' + slotProps.item.event) }}
                            </span>
                        </div>
                        <div class="text-sm text-gray-500 mb-2 font-bold -mt-2">
                            {{ slotProps.item.created_at }}
                        </div>
                        <!-- Show attribute changes if present -->
                        <div v-if="slotProps.item.properties && slotProps.item.properties.attributes && slotProps.item.properties.old" class="bg-gray-50 dark:bg-surface-800 rounded p-3 text-sm">
                            <div v-for="(newValue, key) in slotProps.item.properties.attributes" :key="key" class="mb-1">
                                <span class="font-medium">{{ key }}:</span>
                                <span class="text-amber-600 ml-1">{{ slotProps.item.properties.old[key] }}</span>
                                <span v-if="slotProps.item.properties.old[key]" class="text-gray-400 mx-1">→</span>
                                <span v-if="slotProps.item.properties.old[key]" class="text-primary">{{ newValue }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Timeline>

            <!-- Loading more indicator -->
            <div v-if="isLoadingMore" class="flex justify-center py-4">
                <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
            </div>

            <!-- End of list indicator -->
            <div v-if="!hasMorePages && activities.length > 0 && !isInitialLoading" class="text-center text-gray-400 py-4 text-sm">
                {{ t('common.labels.end_of_list') }}
            </div>
        </div>

        <!-- No activities message -->
        <div v-if="!isInitialLoading && activities.length === 0" class="text-center text-gray-400 mt-8">
            {{ t('myaccount.labels.no_activities') }}
        </div>
    </div>
</template>
<style lang="scss">
@media screen and (max-width: 960px) {
    ::v-deep(.customized-timeline) {
        .p-timeline-event:nth-child(even) {
            flex-direction: row;

            .p-timeline-event-content {
                text-align: left;
            }
        }

        .p-timeline-event-opposite {
            flex: 0;
        }
    }
}
.customized-timeline .p-timeline-event-opposite {
    display: none !important;
}
</style>
