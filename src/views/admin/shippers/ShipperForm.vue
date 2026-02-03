<script setup>
import { useRegionService } from '@/services/useRegionService';
import { useShipperService } from '@/services/useShipperService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { shipperSchema } from '@/validations/shipper';
import { validate, validateField } from '@/validations/validate';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();

const isEdit = computed(() => !!route.params.id);
const regions = ref([]);

const shipperTypes = [
    { label: t('shipper.types.company'), value: 'company' },
    { label: t('shipper.types.individual'), value: 'individual' }
];

const record = ref({
    name: '',
    type: 'company',
    api: '',
    active: false
});

// Region pricing state
const regionPricing = ref([]);

const schema = shipperSchema;

const validateForm = () => {
    const formData = {
        ...record.value,
        region_pricing: regionPricing.value.filter((p) => p.enabled).map((p) => ({ region_id: p.region_id, price: p.price || 0 }))
    };
    const { ok, errors } = validate(schema, formData);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path) => {
    const formData = {
        ...record.value,
        region_pricing: regionPricing.value.filter((p) => p.enabled).map((p) => ({ region_id: p.region_id, price: p.price || 0 }))
    };
    const { ok, errors } = validateField(schema, formData, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

async function loadRegions() {
    try {
        const response = await useRegionService.getAllRegions();
        regions.value = response.regions || [];
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

async function loadShipper() {
    if (!isEdit.value) return;

    try {
        loading.startDataLoading();
        const response = await useShipperService.getShipper(route.params.id);
        const shipper = response.data;

        record.value = {
            id: shipper.id,
            name: shipper.name,
            type: shipper.type,
            api: '',
            active: shipper.active
        };

        // Set region pricing
        if (shipper.region_pricing) {
            regionPricing.value = shipper.region_pricing.map((p) => ({
                region_id: p.region_id,
                price: p.price,
                enabled: true
            }));
        }
    } catch (error) {
        console.error('Error loading shipper:', error);
        showToast('error', ACTIONS.FETCH, 'shipper', 'tc');
    } finally {
        loading.stopDataLoading();
    }
}

// Build region pricing grid with all regions
const regionPricingGrid = computed(() => {
    return regions.value.map((region) => {
        const existing = regionPricing.value.find((p) => p.region_id === region.id);
        return {
            region_id: region.id,
            region_name: region.name,
            region_code: region.code,
            price: existing?.price ?? 0,
            enabled: existing?.enabled ?? false
        };
    });
});

function updateRegionPrice(regionId, price) {
    const idx = regionPricing.value.findIndex((p) => p.region_id === regionId);
    if (idx !== -1) {
        regionPricing.value[idx].price = price;
    }
}

function toggleRegion(regionId, enabled) {
    const idx = regionPricing.value.findIndex((p) => p.region_id === regionId);
    if (enabled) {
        if (idx === -1) {
            regionPricing.value.push({ region_id: regionId, price: 0, enabled: true });
        } else {
            regionPricing.value[idx].enabled = true;
        }
    } else {
        if (idx !== -1) {
            regionPricing.value.splice(idx, 1);
        }
    }
}

const onFormSubmit = async () => {
    if (!validateForm()) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        // Build region_pricing array from enabled regions
        const region_pricing = regionPricing.value
            .filter((p) => p.enabled)
            .map((p) => ({
                region_id: p.region_id,
                price: p.price || 0
            }));

        const payload = {
            name: record.value.name,
            type: record.value.type,
            active: record.value.active,
            region_pricing
        };

        // Only include api if provided
        if (record.value.api) {
            payload.api = record.value.api;
        }

        if (isEdit.value) {
            await useShipperService.updateShipper(route.params.id, payload);
            showToast('success', ACTIONS.EDIT, 'shipper', 'tc');
        } else {
            await useShipperService.storeShipper(payload);
            showToast('success', ACTIONS.CREATE, 'shipper', 'tc');
        }

        router.push({ name: 'shippers' });
    } catch (error) {
        if (error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        }
        showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'shipper', 'tc');
    } finally {
        loading.stopFormSending();
    }
};

function goBack() {
    router.push({ name: 'shippers' });
}

onMounted(async () => {
    await loadRegions();
    await loadShipper();
});
</script>

<template>
    <div>
        <div class="card shadow-glow">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold">
                    {{ isEdit ? t('common.titles.edit', { entity: t('entity.shipper') }) : t('common.titles.add', { entity: t('entity.shipper') }) }}
                </h2>
                <Button :label="t('common.labels.back')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
            </div>

            <form @submit.prevent="onFormSubmit" class="flex flex-col gap-6">
                <!-- Basic Info Section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.basic_info') }}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Type field FIRST -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on" class="w-full">
                                <Select id="type" v-model="record.type" :options="shipperTypes" optionLabel="label" optionValue="value" :disabled="loading.isFormSending" class="w-full" :invalid="!!authStore.errors?.['type']?.[0]" />
                                <label for="type">{{ t('shipper.columns.type') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['type']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['type']?.[0]) }}</Message>
                        </div>

                        <!-- Name field SECOND -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on" class="w-full">
                                <IconField>
                                    <InputIcon class="pi pi-truck" />
                                    <InputText
                                        id="name"
                                        v-model="record.name"
                                        :disabled="loading.isFormSending"
                                        class="w-full"
                                        maxlength="255"
                                        :invalid="!!authStore.errors?.['name']?.[0]"
                                        @input="() => authStore.clearErrors(['name'])"
                                        @blur="() => onBlurField('name')"
                                        autofocus
                                    />
                                </IconField>
                                <label for="name">{{ t('shipper.columns.name') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
                        </div>
                    </div>

                    <!-- Active toggle without Tag -->
                    <div class="mt-6">
                        <div class="flex items-center gap-3">
                            <ToggleSwitch id="active" v-model="record.active" :disabled="loading.isFormSending" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                            <label for="active" class="font-medium">{{ t('shipper.columns.active') }}</label>
                        </div>
                        <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['active']?.[0]) }}</Message>
                    </div>
                </div>

                <!-- API Configuration Section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.api_config') }}</h3>
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on" class="w-full md:w-1/2">
                            <IconField>
                                <InputIcon class="pi pi-key" />
                                <InputText id="api" v-model="record.api" type="password" :disabled="loading.isFormSending" class="w-full" maxlength="500" :placeholder="isEdit ? t('shipper.placeholders.api_unchanged') : ''" />
                            </IconField>
                            <label for="api">{{ t('shipper.labels.api_key') }}</label>
                        </FloatLabel>
                        <small class="text-surface-500">{{ t('shipper.labels.api_hint') }}</small>
                    </div>
                </div>

                <!-- Region Pricing Section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.region_pricing') }}</h3>
                    <DataTable :value="regionPricingGrid" scrollable scrollHeight="400px" size="small" stripedRows>
                        <Column field="region_code" :header="t('shipper.columns.region_code')" style="width: 80px">
                            <template #body="{ data }">
                                <Tag :value="data.region_code" severity="secondary" />
                            </template>
                        </Column>
                        <Column field="region_name" :header="t('shipper.columns.region_name')" style="min-width: 150px" />
                        <Column :header="t('shipper.columns.enabled')" style="width: 100px">
                            <template #body="{ data }">
                                <Checkbox :modelValue="regionPricing.some((p) => p.region_id === data.region_id && p.enabled)" @update:modelValue="toggleRegion(data.region_id, $event)" binary :disabled="loading.isFormSending" />
                            </template>
                        </Column>
                        <Column :header="t('shipper.columns.price')" style="width: 150px">
                            <template #body="{ data }">
                                <InputNumber
                                    :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.price ?? 0"
                                    @update:modelValue="updateRegionPrice(data.region_id, $event)"
                                    :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                    mode="currency"
                                    currency="DZD"
                                    locale="fr-DZ"
                                    size="small"
                                    class="w-full"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-3">
                    <Button :label="t('common.labels.cancel')" icon="pi pi-times" severity="secondary" outlined @click="goBack" :disabled="loading.isFormSending" />
                    <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
                </div>
            </form>
        </div>
    </div>
</template>
