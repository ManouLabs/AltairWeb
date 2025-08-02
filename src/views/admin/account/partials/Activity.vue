<script setup>
import { useMyAccountService } from '@/services/useMyAccountService';
import { useLoading } from '@/stores/useLoadingStore';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loading = useLoading();

const activities = ref([{}, {}, {}, {}]); // Placeholder for initial loading state
const getActivityIconAndColor = (activity) => {
    switch (activity.log_name) {
        case 'user_log':
            return { icon: 'pi pi-user', color: 'var(--primary-color)' };
        default:
            return { icon: 'pi pi-info-circle', color: '#9E9E9E' };
    }
};
const humanizeDate = (dateString, locale = 'en-US') => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const formatTime = (d) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });

    if (diffDays === 0) {
        return `${t('common.labels.today')}, ${formatTime(date)}`;
    } else if (diffDays === 1) {
        return `${t('common.labels.yesterday')}, ${formatTime(date)}`;
    } else if (diffDays < 7) {
        return `${t('common.labels.days_ago', { count: diffDays })}, ${formatTime(date)}`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${t('common.labels.weeks_ago', { count: weeks })}, ${formatTime(date)}`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `${t('common.labels.months_ago', { count: months })}, ${formatTime(date)}`;
    }
};

onMounted(async () => {
    loading.startDataLoading();
    try {
        const response = await useMyAccountService.getActivities();
        activities.value = response.activities || [];
        activities.value = activities.value.map((activity) => ({
            ...activity,
            ...getActivityIconAndColor(activity),
            created_at: humanizeDate(activity.created_at)
        }));
    } catch (error) {
        console.error('Error fetching activities:', error);
    } finally {
        loading.stopDataLoading();
    }
});
</script>
<template>
    <div class="px-0 py-5">
        <h2 class="text-xl font-bold text-center md:text-left">{{ t('myaccount.labels.activity') }}</h2>
        <span class="text-gray-400 block text-center md:text-left">{{ t('myaccount.labels.activity_description') }}</span>
        <Timeline :value="activities" align="left" class="customized-timeline mt-6 w-full">
            <template #marker="slotProps">
                <span v-if="loading.isDataLoading" class="flex w-8 h-8 items-center justify-center rounded-full z-10 shadow-sm">
                    <Skeleton shape="circle" size="2rem" />
                </span>
                <span v-else class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm" :style="{ backgroundColor: slotProps.item.color }">
                    <i :class="slotProps.item.icon"></i>
                </span>
            </template>
            <template #content="slotProps">
                <div v-if="loading.isDataLoading" class="flex flex-col gap-2">
                    <Skeleton height="20px" width="66%" />
                    <Skeleton height="16px" width="33%" />
                    <Skeleton height="40px" width="100%" class="mb-4" />
                </div>
                <div class="flex flex-col">
                    <div v-if="slotProps.item.event && slotProps.item.description" class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-base">{{ slotProps.item.description }}</span>
                        <span
                            class="inline-block text-white text-xs font-medium px-2 py-1 rounded-full shadow"
                            :class="{
                                'bg-primary': slotProps.item.event === 'created',
                                'bg-blue-500': slotProps.item.event === 'updated',
                                'bg-red-500': slotProps.item.event === 'deleted',
                                'bg-primary': !['created', 'updated', 'deleted'].includes(slotProps.item.event)
                            }"
                        >
                            {{ t('common.labels.' + slotProps.item.event) }}
                        </span>
                    </div>
                    <div class="text-sm text-gray-500 mb-2 font-bold -mt-2">
                        {{ slotProps.item.created_at }}
                    </div>
                    <!-- Show attribute changes if present -->
                    <div v-if="slotProps.item.properties && slotProps.item.properties.attributes && slotProps.item.properties.old" class="bg-gray-50 rounded p-3 text-sm">
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
        <div v-if="!loading.isDataLoading && activities.length === 0" class="text-center text-gray-400 mt-8">
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
