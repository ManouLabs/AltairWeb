<script setup>
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { shopSchema } from '@/validations/shop';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();
const { t } = useI18n();

const record = ref({});
const dialogRef = inject('dialogRef');
const action = ref();

const syncStatusFromActive = () => {
    if (!record.value) return;
    record.value.status = record.value.active ? 'active' : 'inactive';
};

const schema = shopSchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

const onFormSubmit = () => {
    // keep backwards compatibility if API still expects `status`
    syncStatusFromActive();

    if (!validateForm()) return;
    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useShopService.storeShop : (data) => useShopService.updateShop(record.value.id, data);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'shop', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => dialogRef.value.close();

onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;

    // normalize incoming record so UI always uses `active`
    if (record.value && typeof record.value.active !== 'boolean') {
        record.value.active = record.value.status === 'active';
    }
    syncStatusFromActive();
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name"
                        v-model="record.name"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="150"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name'])"
                        @blur="() => onBlurField('name')"
                        autofocus
                    />
                    <label for="name">{{ t('shop.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
            </div>

            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <Textarea
                        id="description"
                        v-model="record.description"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="500"
                        rows="4"
                        :invalid="authStore.errors?.['description']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['description'])"
                        @blur="() => onBlurField('description')"
                    />
                    <label for="description">{{ t('shop.columns.description') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['description']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['description']?.[0]) }}</Message>
            </div>

            <div class="col-span-1">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :disabled="loading.isPageLoading" :class="{ 'p-invalid': authStore.errors?.active }" @change="() => (syncStatusFromActive(), onBlurField('active'))" />
                    <label for="active" class="font-medium">
                        {{ t('shop.columns.active') }}
                    </label>
                </div>
                <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['active']?.[0]) }}</Message>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
