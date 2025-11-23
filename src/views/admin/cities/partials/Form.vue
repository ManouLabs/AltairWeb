<script setup>
import { useCityService } from '@/services/useCityService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { citySchema } from '@/validations/city';
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
const regionsOptions = ref([]);

// Validation schema
const schema = citySchema;

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

    const serviceAction = action.value === ACTIONS.CREATE ? useCityService.storeCity : (cityData) => useCityService.updateCity(record.value.id, cityData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'city', 'tr');
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
    regionsOptions.value = dialogRef.value.data.regionsOptions;
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
                        maxlength="50"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name'])"
                        @blur="() => onBlurField('name')"
                    />
                    <label for="name">{{ t('city.columns.name') }} *</label>
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
                        maxlength="50"
                        :invalid="authStore.errors?.['name_ar']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name_ar'])"
                        @blur="() => onBlurField('name_ar')"
                    />
                    <label for="name_ar">{{ t('city.columns.name_ar') }} *</label>
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
                        maxlength="50"
                        :invalid="authStore.errors?.['name_fr']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['name_fr'])"
                        @blur="() => onBlurField('name_fr')"
                    />
                    <label for="name_fr">{{ t('city.columns.name_fr') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name_fr']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name_fr']?.[0]) }}
                </Message>
            </div>

            <!-- Postal Code -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="postal_code"
                        v-model="record.postal_code"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        maxlength="20"
                        :invalid="authStore.errors?.['postal_code']?.[0] ? true : false"
                        @input="() => authStore.clearErrors(['postal_code'])"
                        @blur="() => onBlurField('postal_code')"
                    />
                    <label for="postal_code">{{ t('city.columns.postal_code') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['postal_code']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['postal_code']?.[0]) }}
                </Message>
            </div>

            <!-- Region -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <div class="p-float-label w-full">
                        <Select
                            id="region_id"
                            v-model="record.region_id"
                            :options="regionsOptions"
                            optionLabel="name"
                            optionValue="id"
                            :placeholder="t('common.placeholders.select')"
                            :disabled="loading.isPageLoading"
                            class="w-full"
                            :invalid="authStore.errors?.['region_id']?.[0] ? true : false"
                            @blur="() => onBlurField('region_id')"
                            @change="() => authStore.clearErrors(['region_id'])"
                        />
                        <label for="region_id">{{ t('city.columns.region') }} *</label>
                    </div>
                </FloatLabel>
                <Message v-if="authStore.errors?.['region_id']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['region_id']?.[0]) }}
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
                        :max-fraction-digits="7"
                        :invalid="authStore.errors?.['longitude']?.[0] ? true : false"
                        @blur="() => onBlurField('longitude')"
                    />
                    <label for="longitude">{{ t('city.columns.longitude') }}</label>
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
                        :max-fraction-digits="7"
                        :invalid="authStore.errors?.['latitude']?.[0] ? true : false"
                        @blur="() => onBlurField('latitude')"
                    />
                    <label for="latitude">{{ t('city.columns.latitude') }}</label>
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
