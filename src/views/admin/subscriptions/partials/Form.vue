<script setup>
import { useSubscriptionService } from '@/services/useSubscriptionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { subscriptionSchema } from '@/validations/subscription';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref({});
const dialogRef = inject('dialogRef');
const action = ref();

// Auxiliary data
const accounts = ref([]);
const plans = ref([]);

// AutoComplete
const filteredAccounts = ref([]);
const selectedAccount = ref(null);

const searchAccount = (event) => {
    const query = event.query?.toLowerCase() || '';
    filteredAccounts.value = accounts.value.filter((a) => {
        const legal = (a.legal_name || '').toLowerCase();
        const trade = (a.trade_name || '').toLowerCase();
        const id = String(a.id);
        return legal.includes(query) || trade.includes(query) || id.includes(query);
    });
};

const onAccountSelect = (event) => {
    record.value.account_id = event.value.id;
    authStore.clearErrors(['account_id']);
};

const onAccountClear = () => {
    record.value.account_id = null;
};

const accountLabel = (item) => {
    if (!item) return '';
    const name = item.legal_name || '';
    if (item.trade_name && item.trade_name !== item.legal_name) {
        return `${name} (${item.trade_name})`;
    }
    return name;
};

// Billing period options
const billingPeriodOptions = ref([
    { label: 'subscription.form.monthly', value: 'month' },
    { label: 'subscription.form.yearly', value: 'year' }
]);

// Validation
const schema = subscriptionSchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

// Plan selection
const selectPlan = (planId) => {
    record.value.plan_id = planId;
    authStore.clearErrors(['plan_id']);
};

const onFormSubmit = () => {
    if (!validateForm()) {
        return;
    }

    loading.startFormSending();

    const payload = {
        ...record.value,
        starts_at: record.value.starts_at instanceof Date ? record.value.starts_at.toISOString().split('T')[0] : record.value.starts_at
    };

    const serviceAction = action.value === ACTIONS.CREATE ? useSubscriptionService.storeSubscription : (data) => useSubscriptionService.updateSubscription(record.value.id, data);

    serviceAction(payload)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'subscription', 'tr', error);
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;
    accounts.value = dialogRef.value.data.accounts || [];
    plans.value = dialogRef.value.data.plans || [];

    // Convert date strings to Date objects for DatePicker
    if (record.value.starts_at && typeof record.value.starts_at === 'string') {
        record.value.starts_at = new Date(record.value.starts_at);
    }

    // Default billing_period & quantity
    if (!record.value.billing_period) {
        record.value.billing_period = 'month';
    }
    if (!record.value.quantity) {
        record.value.quantity = 1;
    }

    // Pre-select account for AutoComplete when editing
    if (record.value.account_id) {
        selectedAccount.value = accounts.value.find((a) => a.id === record.value.account_id) || null;
    }
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-5">
        <!-- Section: Select Account -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('subscription.form.select_account') }}
            </p>
            <FloatLabel variant="on" class="w-full">
                <IconField>
                    <InputIcon class="pi pi-search" />
                    <AutoComplete
                        id="account_id"
                        v-model="selectedAccount"
                        :suggestions="filteredAccounts"
                        :optionLabel="accountLabel"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        :invalid="authStore.errors?.['account_id']?.[0] ? true : false"
                        @complete="searchAccount"
                        @item-select="onAccountSelect"
                        @clear="onAccountClear"
                        dropdown
                        forceSelection
                    />
                </IconField>
                <label for="account_id">{{ t('subscription.form.search_account') }} *</label>
            </FloatLabel>
            <Message v-if="authStore.errors?.['account_id']?.[0]" severity="error" size="small">
                {{ t(authStore.errors?.['account_id']?.[0]) }}
            </Message>
        </div>

        <!-- Section: Choose Plan -->
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                {{ t('subscription.form.choose_plan') }}
            </p>
            <div class="grid grid-cols-3 gap-3">
                <div
                    v-for="plan in plans"
                    :key="plan.id"
                    class="flex flex-col items-start text-left gap-1.5 border-2 rounded-xl px-4 py-4 cursor-pointer transition-all duration-150"
                    :class="record.plan_id === plan.id ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_var(--p-primary-color)]' : 'border-surface-200 dark:border-surface-700 hover:border-primary'"
                    @click="selectPlan(plan.id)"
                >
                    <div
                        class="flex items-center justify-center w-10 h-10 rounded-[10px] text-lg mb-1"
                        :style="{
                            backgroundColor: `color-mix(in srgb, ${plan.color || '#8B5CF6'} 14%, transparent)`,
                            color: plan.color || '#8B5CF6'
                        }"
                    >
                        <i :class="plan.icon || 'pi pi-box'"></i>
                    </div>
                    <span class="font-bold text-base text-surface-800 dark:text-surface-100">{{ plan.name }}</span>
                    <span class="text-xs text-surface-400 dark:text-surface-500 leading-snug">{{ plan.description || '—' }}</span>
                    <span class="font-semibold text-sm text-primary mt-1">
                        {{ record.billing_period === 'year' ? plan.yearly_price : plan.monthly_price }} DA / {{ record.billing_period === 'year' ? t('subscription.form.yr') : t('subscription.form.mo') }}
                    </span>
                </div>
            </div>
            <Message v-if="authStore.errors?.['plan_id']?.[0]" severity="error" size="small">
                {{ t(authStore.errors?.['plan_id']?.[0]) }}
            </Message>
        </div>

        <!-- Section: Start Date & Renewal Cycle -->
        <div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <IconField>
                            <InputIcon class="pi pi-calendar" />
                            <DatePicker
                                id="starts_at"
                                v-model="record.starts_at"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                dateFormat="mm/dd/yy"
                                :invalid="authStore.errors?.['starts_at']?.[0] ? true : false"
                                @date-select="() => authStore.clearErrors(['starts_at'])"
                            />
                        </IconField>
                        <label for="starts_at">{{ t('subscription.columns.starts_at') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['starts_at']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['starts_at']?.[0]) }}
                    </Message>
                </div>

                <!-- Renewal Cycle -->
                <div>
                    <SelectButton v-model="record.billing_period" :options="billingPeriodOptions" optionLabel="label" optionValue="value" :allowEmpty="false" class="w-full" :disabled="loading.isFormSending">
                        <template #option="{ option }">
                            {{ t(option.label) }}
                        </template>
                    </SelectButton>
                    <Message v-if="authStore.errors?.['billing_period']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['billing_period']?.[0]) }}
                    </Message>
                </div>

                <!-- Quantity -->
                <div>
                    <FloatLabel variant="on" class="w-full">
                        <InputNumber
                            id="quantity"
                            v-model="record.quantity"
                            class="w-full"
                            :min="1"
                            :useGrouping="false"
                            :disabled="loading.isFormSending"
                            :invalid="authStore.errors?.['quantity']?.[0] ? true : false"
                            @blur="onBlurField('quantity')"
                        />
                        <label for="quantity">{{ t('subscription.form.quantity') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['quantity']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['quantity']?.[0]) }}
                    </Message>
                </div>
            </div>
        </div>

        <!-- Section: Status -->
        <div>
            <div class="flex items-center justify-between border border-surface-200 dark:border-surface-700 rounded-lg px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="pi pi-check-circle text-primary text-lg"></i>
                    <div>
                        <p class="font-semibold text-sm text-surface-800 dark:text-surface-100">{{ t('subscription.form.active_label') }}</p>
                    </div>
                </div>
                <ToggleSwitch v-model="record.active" :disabled="loading.isFormSending" />
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
