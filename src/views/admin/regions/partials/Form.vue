<script setup>
import { useRegionService } from '@/services/useRegionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { regionSchema } from '@/validations/region';
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
const schema = regionSchema;

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

    const serviceAction = action.value === ACTIONS.CREATE ? useRegionService.storeRegion : (regionData) => useRegionService.updateRegion(record.value.id, regionData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'region', 'tr');
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
            <!-- Name (English) -->
            <div class="col-span-1">
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
                    <label for="name">{{ t('region.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>

            <!-- Name (Arabic) -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name_ar"
                        v-model="record.name_ar"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :invalid="authStore.errors?.['name_ar']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name_ar'])"
                        @blur="() => onBlurField('name_ar')"
                    />
                    <label for="name_ar">{{ t('region.columns.name_ar') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name_ar']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name_ar']?.[0]) }}
                </Message>
            </div>

            <!-- Name (French) -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name_fr"
                        v-model="record.name_fr"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :invalid="authStore.errors?.['name_fr']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name_fr'])"
                        @blur="() => onBlurField('name_fr')"
                    />
                    <label for="name_fr">{{ t('region.columns.name_fr') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name_fr']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name_fr']?.[0]) }}
                </Message>
            </div>

            <!-- Code -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="code"
                        v-model="record.code"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="3"
                        :invalid="authStore.errors?.['code']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['code'])"
                        @blur="() => onBlurField('code')"
                    />
                    <label for="code">{{ t('region.columns.code') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['code']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['code']?.[0]) }}
                </Message>
            </div>

            <!-- Longitude -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputNumber
                        id="longitude"
                        v-model="record.longitude"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :useGrouping="false"
                        :min-fraction-digits="0"
                        :max-fraction-digits="10"
                        :invalid="authStore.errors?.['longitude']?.[0] ? true : false"
                        @blur="() => onBlurField('longitude')"
                    />
                    <label for="longitude">{{ t('region.columns.longitude') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['longitude']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['longitude']?.[0]) }}
                </Message>
            </div>

            <!-- Latitude -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputNumber
                        id="latitude"
                        v-model="record.latitude"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :useGrouping="false"
                        :min-fraction-digits="0"
                        :max-fraction-digits="10"
                        :invalid="authStore.errors?.['latitude']?.[0] ? true : false"
                        @blur="() => onBlurField('latitude')"
                    />
                    <label for="latitude">{{ t('region.columns.latitude') }}</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['latitude']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['latitude']?.[0]) }}
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
