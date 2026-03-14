<script setup lang="ts">
import { usePlanService } from '@/services/usePlanService';
import { useAuthStore } from '@/stores/useAuthStore';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();

const record = defineModel<any>({ required: true });

const plans = ref<any[]>([]);
const loadingPlans = ref(true);

const selectedPlan = computed(() => {
    return plans.value.find((p: any) => p.id === record.value.subscription?.plan_id) || null;
});

const billingPeriodOptions = [
    { value: 'month', label: t('account.plan.monthly') },
    { value: 'year', label: t('account.plan.yearly') }
];

const unitPrice = computed(() => {
    if (!selectedPlan.value) return 0;
    return record.value.subscription?.billing_period === 'year' ? Number(selectedPlan.value.yearly_price || 0) : Number(selectedPlan.value.monthly_price || 0);
});

const totalDue = computed(() => {
    const qty = Number(record.value.subscription?.quantity || 1);
    return unitPrice.value * qty;
});

const billingLabel = computed(() => {
    return record.value.subscription?.billing_period === 'year' ? t('account.plan.per_year') : t('account.plan.per_month');
});

const selectPlan = (planId: number) => {
    if (!record.value.subscription) {
        record.value.subscription = { plan_id: null, billing_period: 'month', quantity: 1, starts_at: new Date() };
    }
    record.value.subscription.plan_id = planId;
    authStore.clearErrors(['subscription.plan_id']);
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price) + ' DA';
};

onMounted(async () => {
    try {
        const response = await usePlanService.getPlans();
        plans.value = response.plans.filter((p: any) => p.active);
    } catch (error) {
        console.error('Error loading plans:', error);
    } finally {
        loadingPlans.value = false;
    }
});
</script>

<template>
    <div class="flex flex-col items-center gap-6">
        <!-- Header -->
        <div class="text-center">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-white uppercase tracking-wider">{{ t('account.plan.choose_plan') }}</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">{{ t('account.plan.choose_plan_subtitle') }}</p>
        </div>

        <!-- Plan cards -->
        <div v-if="loadingPlans" class="flex gap-4 w-full">
            <Skeleton v-for="n in 3" :key="n" height="80px" class="flex-1" />
        </div>
        <div v-else class="flex gap-4 w-full">
            <div
                v-for="plan in plans"
                :key="plan.id"
                :class="[
                    'flex-1 relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    record.subscription?.plan_id === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'border-surface-200 dark:border-surface-700 hover:border-primary/50'
                ]"
                @click="selectPlan(plan.id)"
            >
                <!-- Plan icon -->
                <div class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <i :class="plan.icon || 'pi pi-star'" class="text-primary" />
                </div>

                <!-- Plan details -->
                <div>
                    <p class="text-sm font-bold text-surface-900 dark:text-white">{{ plan.name }}</p>
                    <p class="text-xs text-surface-500">{{ plan.description }}</p>
                </div>
            </div>
        </div>
        <Message v-if="authStore.errors?.['subscription.plan_id']?.[0]" severity="error" size="small" class="w-full">
            {{ t(authStore.errors?.['subscription.plan_id']?.[0]) }}
        </Message>

        <!-- Subscription details (shown when a plan is selected) -->
        <div class="w-full border border-surface-200 dark:border-surface-700 rounded-xl p-6 bg-surface-0 dark:bg-surface-900">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Billing Period -->
                <div class="flex items-center">
                    <SelectButton v-model="record.subscription.billing_period" :options="billingPeriodOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
                </div>

                <!-- Quantity -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-list" />
                            <InputNumber
                                id="quantity"
                                v-model="record.subscription.quantity"
                                :min="1"
                                class="w-full"
                                :invalid="authStore.errors?.['subscription.quantity']?.[0] ? true : false"
                                @input="() => authStore.clearErrors(['subscription.quantity'])"
                            />
                        </IconField>
                        <label for="quantity">{{ t('account.plan.plan_quantity') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['subscription.quantity']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['subscription.quantity']?.[0]) }}
                    </Message>
                </div>

                <!-- Start Date -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-calendar" />
                            <DatePicker
                                id="starts_at"
                                v-model="record.subscription.starts_at"
                                dateFormat="mm/dd/yy"
                                class="w-full"
                                :invalid="authStore.errors?.['subscription.starts_at']?.[0] ? true : false"
                                @date-select="() => authStore.clearErrors(['subscription.starts_at'])"
                            />
                        </IconField>
                        <label for="starts_at">{{ t('account.plan.subscription_start_date') }}</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['subscription.starts_at']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['subscription.starts_at']?.[0]) }}
                    </Message>
                </div>
            </div>

            <!-- Total Due -->
            <div class="flex items-center justify-end mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                <div class="text-right">
                    <span class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('account.plan.total_due_now') }}</span>
                    <p class="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                        {{ formatPrice(totalDue) }}<span class="text-sm font-normal text-surface-400">{{ billingLabel }}</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
