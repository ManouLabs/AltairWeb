<script setup>
import { useRegionService } from '@/services/useRegionService';
import { useShipperService } from '@/services/useShipperService';
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { shipperSchema } from '@/validations/shipper';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
const shops = ref([]);
const selectedShopIds = ref([]);

const shipperTypes = [
    { label: t('shipper.types.company'), value: 'company', icon: 'pi pi-building' },
    { label: t('shipper.types.individual'), value: 'individual', icon: 'pi pi-user' }
];

// Initial values for the form
const initialValues = reactive({
    name: '',
    type: 'company',
    api: '',
    active: false
});

// Region pricing state (managed separately from form)
const regionPricing = ref([]);

// Quick Fill state for bulk region pricing
const quickFill = reactive({
    home_delivery_price: 0,
    stop_desk_price: 0,
    return_price: 0
});

// Apply quick fill prices to all regions
function applyToAllRegions() {
    regions.value.forEach((region) => {
        const idx = regionPricing.value.findIndex((p) => p.region_id === region.id);
        if (idx === -1) {
            regionPricing.value.push({
                region_id: region.id,
                home_delivery_price: quickFill.home_delivery_price,
                stop_desk_price: quickFill.stop_desk_price,
                return_price: quickFill.return_price,
                enabled: true
            });
        } else {
            regionPricing.value[idx].home_delivery_price = quickFill.home_delivery_price;
            regionPricing.value[idx].stop_desk_price = quickFill.stop_desk_price;
            regionPricing.value[idx].return_price = quickFill.return_price;
            regionPricing.value[idx].enabled = true;
        }
    });
}

// Zod schema with zodResolver
const resolver = zodResolver(shipperSchema);

async function loadRegions() {
    try {
        const response = await useRegionService.getAllRegions();
        regions.value = response.regions || [];
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

async function loadShops() {
    try {
        const response = await useShopService.getShops();
        shops.value = response.data || [];
    } catch (error) {
        console.error('Error loading shops:', error);
    }
}

async function loadShipper() {
    if (!isEdit.value) return;

    try {
        loading.startDataLoading();
        const response = await useShipperService.getShipper(route.params.id);
        const shipper = response.data;

        // Update initial values
        initialValues.name = shipper.name;
        initialValues.type = shipper.type;
        initialValues.api = '';
        initialValues.active = shipper.active;

        // Set region pricing
        if (shipper.region_pricing) {
            regionPricing.value = shipper.region_pricing.map((p) => ({
                region_id: p.region_id,
                home_delivery_price: p.home_delivery_price,
                stop_desk_price: p.stop_desk_price,
                return_price: p.return_price,
                enabled: true
            }));
        }

        // Set selected shops
        if (shipper.shop_ids) {
            selectedShopIds.value = shipper.shop_ids;
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
            home_delivery_price: existing?.home_delivery_price ?? 0,
            stop_desk_price: existing?.stop_desk_price ?? 0,
            return_price: existing?.return_price ?? 0,
            enabled: existing?.enabled ?? false
        };
    });
});

function updateRegionPrice(regionId, field, value) {
    const idx = regionPricing.value.findIndex((p) => p.region_id === regionId);
    if (idx !== -1) {
        regionPricing.value[idx][field] = value;
    }
}

function toggleRegion(regionId, enabled) {
    const idx = regionPricing.value.findIndex((p) => p.region_id === regionId);
    if (enabled) {
        if (idx === -1) {
            regionPricing.value.push({
                region_id: regionId,
                home_delivery_price: 0,
                stop_desk_price: 0,
                return_price: 0,
                enabled: true
            });
        } else {
            regionPricing.value[idx].enabled = true;
        }
    } else {
        if (idx !== -1) {
            regionPricing.value.splice(idx, 1);
        }
    }
}

const onFormSubmit = async ({ valid, values }) => {
    if (!valid) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        // Build region_pricing array from enabled regions
        const region_pricing = regionPricing.value
            .filter((p) => p.enabled)
            .map((p) => ({
                region_id: p.region_id,
                home_delivery_price: p.home_delivery_price || 0,
                stop_desk_price: p.stop_desk_price || 0,
                return_price: p.return_price || 0
            }));

        const payload = {
            name: values.name,
            type: values.type,
            active: values.active,
            region_pricing,
            shop_ids: selectedShopIds.value
        };

        // Only include api if provided
        if (values.api) {
            payload.api = values.api;
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

// Clear API field when switching to individual type
function handleTypeChange(event) {
    authStore.clearErrors(['type']);
    if (event.value === 'individual') {
        initialValues.api = '';
    }
}

onMounted(async () => {
    await loadRegions();
    await loadShops();
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

            <Form v-slot="$form" :initialValues="initialValues" :resolver="resolver" :validateOnBlur="true" @submit="onFormSubmit" class="flex flex-col gap-6">
                <!-- Basic Info Section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.basic_info') }}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Type field -->
                        <FormField v-slot="$field" name="type" class="flex flex-col gap-2">
                            <FloatLabel variant="on" class="w-full">
                                <Select id="type" name="type" :options="shipperTypes" optionLabel="label" optionValue="value" :disabled="loading.isFormSending" class="w-full" v-bind="$field" @change="handleTypeChange">
                                    <template #value="{ value }">
                                        <div v-if="value" class="flex items-center gap-2">
                                            <i :class="shipperTypes.find((t) => t.value === value)?.icon" />
                                            <span>{{ shipperTypes.find((t) => t.value === value)?.label }}</span>
                                        </div>
                                    </template>
                                    <template #option="{ option }">
                                        <div class="flex items-center gap-2">
                                            <i :class="option.icon" />
                                            <span>{{ option.label }}</span>
                                        </div>
                                    </template>
                                </Select>
                                <label for="type">{{ t('shipper.columns.type') }} *</label>
                            </FloatLabel>
                            <Message v-if="$field.invalid || authStore.errors.type" severity="error" size="small">
                                {{ $field.error?.message ? t($field.error.message) : authStore.errors?.type?.[0] }}
                            </Message>
                        </FormField>

                        <!-- Name field -->
                        <FormField v-slot="$field" name="name" class="flex flex-col gap-2">
                            <FloatLabel variant="on" class="w-full">
                                <IconField>
                                    <InputIcon><i class="pi pi-truck" /></InputIcon>
                                    <InputText id="name" name="name" :disabled="loading.isFormSending" class="w-full" maxlength="255" v-bind="$field" @input="() => authStore.clearErrors(['name'])" autofocus />
                                </IconField>
                                <label for="name">{{ t('shipper.columns.name') }} *</label>
                            </FloatLabel>
                            <Message v-if="$field.invalid || authStore.errors.name" severity="error" size="small">
                                {{ $field.error?.message ? t($field.error.message) : authStore.errors?.name?.[0] }}
                            </Message>
                        </FormField>

                        <!-- Shops field -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on" class="w-full">
                                <MultiSelect
                                    id="shops"
                                    v-model="selectedShopIds"
                                    :options="shops"
                                    optionLabel="name"
                                    optionValue="id"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    display="chip"
                                    filter
                                    :placeholder="t('shipper.placeholders.select_shops')"
                                />
                                <label for="shops">{{ t('shipper.columns.shops') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors.shop_ids" severity="error" size="small">
                                {{ authStore.errors?.shop_ids?.[0] }}
                            </Message>
                        </div>
                    </div>

                    <!-- Active toggle -->
                    <div class="mt-6">
                        <FormField v-slot="$field" name="active" class="flex flex-col gap-2">
                            <div class="flex items-center gap-3">
                                <ToggleSwitch id="active" name="active" :disabled="loading.isFormSending" v-bind="$field" @change="() => authStore.clearErrors(['active'])" />
                                <label for="active" class="font-medium">{{ t('shipper.columns.active') }}</label>
                            </div>
                            <Message v-if="$field.invalid || authStore.errors.active" severity="error" size="small">
                                {{ $field.error?.message ? t($field.error.message) : authStore.errors?.active?.[0] }}
                            </Message>
                        </FormField>
                    </div>
                </div>

                <!-- API Configuration Section (only for company type) -->
                <div v-if="$form.type?.value === 'company'" class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.api_config') }}</h3>
                    <FormField v-slot="$field" name="api" class="flex flex-col gap-2">
                        <FloatLabel variant="on" class="w-full md:w-1/2">
                            <IconField>
                                <InputIcon><i class="pi pi-key" /></InputIcon>
                                <InputText
                                    id="api"
                                    name="api"
                                    type="password"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    maxlength="500"
                                    :placeholder="isEdit ? t('shipper.placeholders.api_unchanged') : ''"
                                    v-bind="$field"
                                    @input="() => authStore.clearErrors(['api'])"
                                />
                            </IconField>
                            <label for="api">{{ t('shipper.labels.api_key') }}</label>
                        </FloatLabel>
                        <small class="text-surface-500">{{ t('shipper.labels.api_hint') }}</small>
                        <Message v-if="$field.invalid || authStore.errors.api" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.api?.[0] }}
                        </Message>
                    </FormField>
                </div>

                <!-- Region Pricing Section -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-lg font-semibold mb-4">{{ t('shipper.labels.region_pricing') }}</h3>

                    <!-- Quick Fill Section -->
                    <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-4 mb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="pi pi-bolt text-primary" />
                            <span class="font-medium">{{ t('shipper.labels.quick_fill') }}</span>
                        </div>
                        <div class="flex flex-wrap items-end gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-sm text-surface-500">{{ t('shipper.columns.home_delivery_price') }}</label>
                                <InputNumber v-model="quickFill.home_delivery_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-28" size="small" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm text-surface-500">{{ t('shipper.columns.stop_desk_price') }}</label>
                                <InputNumber v-model="quickFill.stop_desk_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-28" size="small" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm text-surface-500">{{ t('shipper.columns.return_price') }}</label>
                                <InputNumber v-model="quickFill.return_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-28" size="small" />
                            </div>
                            <Button :label="t('shipper.labels.apply_to_all')" icon="pi pi-check-circle" severity="success" size="small" @click="applyToAllRegions" :disabled="loading.isFormSending" />
                        </div>
                    </div>

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
                        <Column :header="t('shipper.columns.home_delivery_price')" style="width: 150px">
                            <template #body="{ data }">
                                <InputNumber
                                    :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.home_delivery_price ?? 0"
                                    @update:modelValue="updateRegionPrice(data.region_id, 'home_delivery_price', $event)"
                                    :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                    mode="currency"
                                    currency="DZD"
                                    locale="fr-DZ"
                                    size="small"
                                    class="w-full"
                                />
                            </template>
                        </Column>
                        <Column :header="t('shipper.columns.stop_desk_price')" style="width: 150px">
                            <template #body="{ data }">
                                <InputNumber
                                    :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.stop_desk_price ?? 0"
                                    @update:modelValue="updateRegionPrice(data.region_id, 'stop_desk_price', $event)"
                                    :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                    mode="currency"
                                    currency="DZD"
                                    locale="fr-DZ"
                                    size="small"
                                    class="w-full"
                                />
                            </template>
                        </Column>
                        <Column :header="t('shipper.columns.return_price')" style="width: 150px">
                            <template #body="{ data }">
                                <InputNumber
                                    :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.return_price ?? 0"
                                    @update:modelValue="updateRegionPrice(data.region_id, 'return_price', $event)"
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
            </Form>
        </div>
    </div>
</template>
