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

// Auxiliary data for dropdowns
const accounts = ref([]);
const plans = ref([]);

// Validation schema
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

const onFormSubmit = () => {
    if (!validateForm()) {
        return;
    }

    loading.startFormSending();

    // Format dates to strings for the API
    const payload = {
        ...record.value,
        starts_at: record.value.starts_at instanceof Date ? record.value.starts_at.toISOString().split('T')[0] : record.value.starts_at,
        ends_at: record.value.ends_at instanceof Date ? record.value.ends_at.toISOString().split('T')[0] : record.value.ends_at
    };

    const serviceAction = action.value === ACTIONS.CREATE ? useSubscriptionService.storeSubscription : (data) => useSubscriptionService.updateSubscription(record.value.id, data);

    serviceAction(payload)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'subscription', 'tr');
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
    if (record.value.ends_at && typeof record.value.ends_at === 'string') {
        record.value.ends_at = new Date(record.value.ends_at);
    }
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-2 gap-4 pt-2">
            <!-- Account -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <Select
                        id="account_id"
                        v-model="record.account_id"
                        :options="accounts"
                        :optionLabel="(opt) => opt.trade_name || opt.legal_name"
                        optionValue="id"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        :invalid="authStore.errors?.['account_id']?.[0] ? true : false"
                        @change="() => authStore.clearErrors(['account_id'])"
                        filter
                        :filterPlaceholder="t('common.placeholders.search')"
                    />
                    <label for="account_id">{{ t('subscription.columns.account_name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['account_id']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['account_id']?.[0]) }}
                </Message>
            </div>

            <!-- Plan -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <Select
                        id="plan_id"
                        v-model="record.plan_id"
                        :options="plans"
                        optionLabel="name"
                        optionValue="id"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        :invalid="authStore.errors?.['plan_id']?.[0] ? true : false"
                        @change="() => authStore.clearErrors(['plan_id'])"
                    />
                    <label for="plan_id">{{ t('subscription.columns.plan_name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['plan_id']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['plan_id']?.[0]) }}
                </Message>
            </div>

            <!-- Starts At -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <DatePicker
                        id="starts_at"
                        v-model="record.starts_at"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        dateFormat="yy-mm-dd"
                        :invalid="authStore.errors?.['starts_at']?.[0] ? true : false"
                        @date-select="() => authStore.clearErrors(['starts_at'])"
                    />
                    <label for="starts_at">{{ t('subscription.columns.starts_at') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['starts_at']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['starts_at']?.[0]) }}
                </Message>
            </div>

            <!-- Ends At -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <DatePicker
                        id="ends_at"
                        v-model="record.ends_at"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        dateFormat="yy-mm-dd"
                        showButtonBar
                        :invalid="authStore.errors?.['ends_at']?.[0] ? true : false"
                        @date-select="() => authStore.clearErrors(['ends_at'])"
                    />
                    <label for="ends_at">{{ t('subscription.columns.ends_at') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['ends_at']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['ends_at']?.[0]) }}
                </Message>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <Textarea
                        id="notes"
                        v-model="record.notes"
                        :disabled="loading.isFormSending"
                        class="w-full"
                        rows="3"
                        :invalid="authStore.errors?.['notes']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['notes'])"
                        @blur="() => onBlurField('notes')"
                    />
                    <label for="notes">{{ t('subscription.columns.notes') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['notes']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['notes']?.[0]) }}
                </Message>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
