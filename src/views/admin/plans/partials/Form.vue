<script setup>
import { usePlanService } from '@/services/usePlanService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { planSchema } from '@/validations/plan';
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

// Validation schema
const schema = planSchema;

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

    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? usePlanService.storePlan : (planData) => usePlanService.updatePlan(record.value.id, planData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'plan', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-2 gap-4 pt-2">
            <!-- Name -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name"
                        v-model="record.name"
                        :disabled="loading.isPageLoading"
                        autofocus
                        class="w-full"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name'])"
                        @blur="() => onBlurField('name')"
                    />
                    <label for="name">{{ t('plan.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>

            <!-- Orders -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputNumber id="orders" v-model="record.orders" :disabled="loading.isPageLoading" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['orders']?.[0] ? true : false" @blur="() => onBlurField('orders')" />
                    <label for="orders">{{ t('plan.columns.orders') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['orders']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['orders']?.[0]) }}
                </Message>
            </div>

            <!-- Products -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputNumber
                        id="products"
                        v-model="record.products"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :useGrouping="false"
                        :min="0"
                        :invalid="authStore.errors?.['products']?.[0] ? true : false"
                        @blur="() => onBlurField('products')"
                    />
                    <label for="products">{{ t('plan.columns.products') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['products']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['products']?.[0]) }}
                </Message>
            </div>

            <!-- Users -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputNumber id="users" v-model="record.users" :disabled="loading.isPageLoading" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['users']?.[0] ? true : false" @blur="() => onBlurField('users')" />
                    <label for="users">{{ t('plan.columns.users') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['users']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['users']?.[0]) }}
                </Message>
            </div>

            <!-- Shops -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputNumber id="shops" v-model="record.shops" :disabled="loading.isPageLoading" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['shops']?.[0] ? true : false" @blur="() => onBlurField('shops')" />
                    <label for="shops">{{ t('plan.columns.shops') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['shops']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['shops']?.[0]) }}
                </Message>
            </div>

            <!-- Price -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputNumber id="price" v-model="record.price" :disabled="loading.isPageLoading" class="w-full" :useGrouping="false" :min="0" :invalid="authStore.errors?.['price']?.[0] ? true : false" @blur="() => onBlurField('price')" />
                    <label for="price">{{ t('plan.columns.price') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['price']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['price']?.[0]) }}
                </Message>
            </div>

            <!-- Active -->
            <div class="col-span-2">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                    <label for="active" class="font-medium">
                        {{ t('plan.columns.active') }}
                    </label>
                </div>
                <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['active']?.[0]) }}
                </Message>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
