<script setup lang="ts">
import { useRegionService } from '@/services/useRegionService';
import { useShipperService } from '@/services/useShipperService';
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { shipperSchema } from '@/validations/shipper';
import type { ShipperData, RegionPricing as RegionPricingType } from '@/types/shipper';
import type { Region } from '@/types/region';
import type { ShopData } from '@/types/shop';
type Shop = ShopData;
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();

const isEdit = computed<boolean>(() => !!route.params.id);
const isLoading = ref<boolean>(true);
const regions = ref<Region[]>([]);
const shops = ref<Shop[]>([]);
const selectedShopIds = ref<number[]>([]);
const formKey = ref<number>(0);

interface ShipperType {
    label: string;
    value: 'company' | 'individual';
    icon: string;
}

const shipperTypes: ShipperType[] = [
    { label: t('shipper.types.company'), value: 'company', icon: 'pi pi-building' },
    { label: t('shipper.types.individual'), value: 'individual', icon: 'pi pi-user' }
];

interface InitialValues {
    name: string;
    type: 'company' | 'individual';
    api: string;
    active: boolean;
}

// Initial values for the form
const initialValues = reactive<InitialValues>({
    name: '',
    type: 'company',
    api: '',
    active: true
});

interface RegionPricingEntry {
    region_id: number;
    home_delivery_price: number;
    stop_desk_price: number;
    return_price: number;
    enabled: boolean;
}

// Region pricing state (managed separately from form)
const regionPricing = ref<RegionPricingEntry[]>([]);

interface QuickFill {
    home_delivery_price: number;
    stop_desk_price: number;
    return_price: number;
}

// Quick Fill state for bulk region pricing
const quickFill = reactive<QuickFill>({
    home_delivery_price: 0,
    stop_desk_price: 0,
    return_price: 0
});

// Apply quick fill prices to all regions
function applyToAllRegions(): void {
    regions.value.forEach((region: Region) => {
        const idx = regionPricing.value.findIndex((p: RegionPricingEntry) => p.region_id === region.id);
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

async function loadRegions(): Promise<void> {
    try {
        const response = await useRegionService.getAllRegions();
        regions.value = response.regions || [];
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

async function loadShops(): Promise<void> {
    try {
        const response = await useShopService.getShops();
        shops.value = response.data || [];
        // Auto-select all shops for new shippers
        if (!isEdit.value) {
            selectedShopIds.value = shops.value.map((shop: Shop) => shop.id);
        }
    } catch (error) {
        console.error('Error loading shops:', error);
    }
}

async function loadShipper(): Promise<void> {
    if (!isEdit.value) return;

    try {
        loading.startDataLoading();
        const response = await useShipperService.getShipper(Number(route.params.id));
        const shipper: ShipperData = response.data;

        // Update initial values
        initialValues.name = shipper.name;
        initialValues.type = shipper.type;
        initialValues.api = '';
        initialValues.active = shipper.active;

        // Set region pricing
        if (shipper.region_pricing) {
            regionPricing.value = shipper.region_pricing.map((p: RegionPricingType) => ({
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

        // Force form to re-render with new initial values
        formKey.value++;
    } catch (error) {
        console.error('Error loading shipper:', error);
        showToast('error', ACTIONS.FETCH, 'shipper', 'tc');
    } finally {
        loading.stopDataLoading();
    }
}

interface RegionPricingGridEntry {
    region_id: number;
    region_name: string;
    region_code: string;
    home_delivery_price: number;
    stop_desk_price: number;
    return_price: number;
    enabled: boolean;
}

// Build region pricing grid with all regions
const regionPricingGrid = computed<RegionPricingGridEntry[]>(() => {
    return regions.value.map((region: Region) => {
        const existing = regionPricing.value.find((p: RegionPricingEntry) => p.region_id === region.id);
        return {
            region_id: region.id,
            region_name: region.name,
            region_code: String(region.code),
            home_delivery_price: existing?.home_delivery_price ?? 0,
            stop_desk_price: existing?.stop_desk_price ?? 0,
            return_price: existing?.return_price ?? 0,
            enabled: existing?.enabled ?? false
        };
    });
});

function updateRegionPrice(regionId: number, field: keyof Pick<RegionPricingEntry, 'home_delivery_price' | 'stop_desk_price' | 'return_price'>, value: number): void {
    const idx = regionPricing.value.findIndex((p: RegionPricingEntry) => p.region_id === regionId);
    if (idx !== -1) {
        regionPricing.value[idx][field] = value;
    }
}

function toggleRegion(regionId: number, enabled: boolean): void {
    const idx = regionPricing.value.findIndex((p: RegionPricingEntry) => p.region_id === regionId);
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

interface FormSubmitEvent {
    valid: boolean;
    values: {
        name: string;
        type: 'company' | 'individual';
        api?: string;
        active: boolean;
    };
}

interface ShipperPayload {
    name: string;
    type: 'company' | 'individual';
    active: boolean;
    region_pricing: Omit<RegionPricingEntry, 'enabled'>[];
    shop_ids: number[];
    api?: string;
}

const onFormSubmit = async ({ valid, values }: FormSubmitEvent): Promise<void> => {
    if (!valid) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        // Build region_pricing array from enabled regions
        const region_pricing = regionPricing.value
            .filter((p: RegionPricingEntry) => p.enabled)
            .map((p: RegionPricingEntry) => ({
                region_id: p.region_id,
                home_delivery_price: p.home_delivery_price || 0,
                stop_desk_price: p.stop_desk_price || 0,
                return_price: p.return_price || 0
            }));

        const payload: ShipperPayload = {
            name: values.name,
            type: values.type,
            active: values.active,
            region_pricing,
            shop_ids: selectedShopIds.value
        };

        // Only include api if provided AND type is company
        if (values.type === 'company' && values.api) {
            payload.api = values.api;
        }

        if (isEdit.value) {
            await useShipperService.updateShipper(Number(route.params.id), payload);
            showToast('success', ACTIONS.EDIT, 'shipper', 'tc');
        } else {
            await useShipperService.storeShipper(payload);
            showToast('success', ACTIONS.CREATE, 'shipper', 'tc');
        }

        router.push({ name: 'shippers' });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            // Validation error - display inline errors, no toast needed
            authStore.errors = error.response.data.errors;
        } else {
            // Other errors - show toast
            showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'shipper', 'tc');
        }
    } finally {
        loading.stopFormSending();
    }
};

function goBack(): void {
    router.push({ name: 'shippers' });
}

interface TypeChangeEvent {
    value: 'company' | 'individual';
}

// Clear API field when switching to individual type
function handleTypeChange(event: TypeChangeEvent): void {
    authStore.clearErrors(['type']);
    if (event.value === 'individual') {
        initialValues.api = '';
    }
}

onMounted(async () => {
    // Load regions and shops in parallel first, then load shipper
    await Promise.all([loadRegions(), loadShops()]);
    await loadShipper();
    isLoading.value = false;
});
</script>

<template>
    <div>
        <!-- Page Header (outside card) -->
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
                {{ isEdit ? t('common.titles.edit', { entity: t('entity.shipper') }) : t('common.titles.add', { entity: t('entity.shipper') }) }}
            </h1>
            <Button :label="t('common.labels.back')" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="flex flex-col gap-6">
            <!-- Basic Info Skeleton -->
            <div class="card">
                <Skeleton width="150px" height="16px" class="mb-6" />
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton height="48px" class="w-full" />
                    <Skeleton height="48px" class="w-full" />
                    <Skeleton height="48px" class="w-full" />
                </div>
                <div class="mt-6 flex items-center gap-3">
                    <Skeleton width="44px" height="24px" borderRadius="16px" />
                    <Skeleton width="60px" height="20px" />
                </div>
            </div>

            <!-- API Config Skeleton -->
            <div class="card">
                <Skeleton width="150px" height="16px" class="mb-6" />
                <Skeleton height="48px" class="w-full md:w-1/3" />
                <Skeleton width="280px" height="14px" class="mt-2" />
            </div>

            <!-- Region Pricing Skeleton -->
            <div class="card">
                <Skeleton width="150px" height="16px" class="mb-6" />
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 mb-6">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <Skeleton width="24px" height="24px" shape="circle" />
                            <div>
                                <Skeleton width="220px" height="16px" class="mb-1" />
                                <Skeleton width="280px" height="12px" />
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <Skeleton width="100px" height="36px" />
                            <Skeleton width="100px" height="36px" />
                            <Skeleton width="100px" height="36px" />
                            <Skeleton width="140px" height="36px" />
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-0">
                    <Skeleton height="44px" class="w-full" />
                    <Skeleton height="44px" class="w-full" />
                    <Skeleton height="44px" class="w-full" />
                    <Skeleton height="44px" class="w-full" />
                </div>
            </div>

            <!-- Actions Skeleton -->
            <div class="flex justify-end gap-3">
                <Skeleton width="100px" height="42px" />
                <Skeleton width="120px" height="42px" />
            </div>
        </div>

        <!-- Actual Form -->
        <Form v-else :key="formKey" v-slot="$form" :initialValues="initialValues" :resolver="resolver" :validateOnBlur="true" @submit="onFormSubmit" class="flex flex-col gap-6">
            <!-- Basic Info Section -->
            <div class="card">
                <h2 class="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider mb-6">{{ t('shipper.labels.basic_info') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Type field -->
                    <FormField v-slot="$field" name="type" class="flex flex-col gap-1.5">
                        <label for="type" class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('shipper.columns.type') }} *</label>
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
                        <Message v-if="$field.invalid || authStore.errors.type" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.type?.[0] }}
                        </Message>
                    </FormField>

                    <!-- Name field -->
                    <FormField v-slot="$field" name="name" class="flex flex-col gap-1.5">
                        <label for="name" class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('shipper.columns.name') }} *</label>
                        <IconField>
                            <InputIcon><i class="pi pi-user" /></InputIcon>
                            <InputText
                                id="name"
                                name="name"
                                :disabled="loading.isFormSending"
                                class="w-full"
                                :placeholder="t('shipper.placeholders.enter_name')"
                                maxlength="255"
                                v-bind="$field"
                                @input="() => authStore.clearErrors(['name'])"
                                autofocus
                            />
                        </IconField>
                        <Message v-if="$field.invalid || authStore.errors.name" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.name?.[0] }}
                        </Message>
                    </FormField>

                    <!-- Shops field -->
                    <div class="flex flex-col gap-1.5">
                        <label for="shops" class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('shipper.columns.shops') }} *</label>
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
                            <label for="active" class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('shipper.columns.active') }}</label>
                        </div>
                        <Message v-if="$field.invalid || authStore.errors.active" severity="error" size="small">
                            {{ $field.error?.message ? t($field.error.message) : authStore.errors?.active?.[0] }}
                        </Message>
                    </FormField>
                </div>
            </div>

            <!-- API Configuration Section (only for company type) -->
            <div v-if="$form.type?.value === 'company'" class="card">
                <h2 class="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider mb-6">{{ t('shipper.labels.api_config') }}</h2>
                <FormField v-slot="$field" name="api" class="flex flex-col gap-1.5 max-w-md">
                    <label for="api" class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('shipper.labels.api_key') }}</label>
                    <IconField>
                        <InputIcon><i class="pi pi-key" /></InputIcon>
                        <InputText id="api" name="api" type="password" :disabled="loading.isFormSending" class="w-full" maxlength="500" placeholder="••••••••••••••••" v-bind="$field" @input="() => authStore.clearErrors(['api'])" />
                    </IconField>
                    <small class="text-[11px] text-surface-400">{{ t('shipper.labels.api_hint') }}</small>
                    <Message v-if="$field.invalid || authStore.errors.api" severity="error" size="small">
                        {{ $field.error?.message ? t($field.error.message) : authStore.errors?.api?.[0] }}
                    </Message>
                </FormField>
            </div>

            <!-- Region Pricing Section -->
            <div class="card">
                <h2 class="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider mb-6">{{ t('shipper.labels.region_pricing') }}</h2>

                <!-- Quick Fill Section -->
                <div class="bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl p-4 mb-6">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-bolt text-primary text-lg" />
                            <div>
                                <p class="text-sm font-bold text-surface-900 dark:text-white">{{ t('shipper.labels.quick_fill') }}</p>
                                <p class="text-xs text-surface-500">{{ t('shipper.labels.quick_fill_hint') }}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <InputNumber v-model="quickFill.home_delivery_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-24" size="small" :placeholder="t('shipper.columns.home_delivery_short')" />
                            <InputNumber v-model="quickFill.stop_desk_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-24" size="small" :placeholder="t('shipper.columns.stop_desk_short')" />
                            <InputNumber v-model="quickFill.return_price" :min="0" mode="decimal" :disabled="loading.isFormSending" inputClass="w-24" size="small" :placeholder="t('shipper.columns.return_short')" />
                            <Button :label="t('shipper.labels.apply_to_all')" icon="pi pi-check-circle" size="small" @click="applyToAllRegions" :disabled="loading.isFormSending" />
                        </div>
                    </div>
                </div>

                <DataTable :value="regionPricingGrid" scrollable scrollHeight="400px" size="small">
                    <Column field="region_code" :header="t('shipper.columns.code')" style="width: 80px">
                        <template #body="{ data }">
                            <span class="font-medium">{{ data.region_code }}</span>
                        </template>
                    </Column>
                    <Column field="region_name" :header="t('shipper.columns.region')" style="min-width: 150px">
                        <template #body="{ data }">
                            <span class="font-medium text-surface-900 dark:text-white">{{ data.region_name }}</span>
                        </template>
                    </Column>
                    <Column :header="t('shipper.columns.enabled')" style="width: 100px">
                        <template #body="{ data }">
                            <Checkbox :modelValue="regionPricing.some((p) => p.region_id === data.region_id && p.enabled)" @update:modelValue="toggleRegion(data.region_id, $event)" binary :disabled="loading.isFormSending" />
                        </template>
                    </Column>
                    <Column :header="t('shipper.columns.home_delivery_da')" style="width: 160px">
                        <template #body="{ data }">
                            <InputNumber
                                :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.home_delivery_price ?? 0"
                                @update:modelValue="updateRegionPrice(data.region_id, 'home_delivery_price', $event)"
                                :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                mode="decimal"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                suffix=" DA"
                                size="small"
                                inputClass="w-full"
                            />
                        </template>
                    </Column>
                    <Column :header="t('shipper.columns.stop_desk_da')" style="width: 160px">
                        <template #body="{ data }">
                            <InputNumber
                                :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.stop_desk_price ?? 0"
                                @update:modelValue="updateRegionPrice(data.region_id, 'stop_desk_price', $event)"
                                :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                mode="decimal"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                suffix=" DA"
                                size="small"
                                inputClass="w-full"
                            />
                        </template>
                    </Column>
                    <Column :header="t('shipper.columns.return_da')" style="width: 160px">
                        <template #body="{ data }">
                            <InputNumber
                                :modelValue="regionPricing.find((p) => p.region_id === data.region_id)?.return_price ?? 0"
                                @update:modelValue="updateRegionPrice(data.region_id, 'return_price', $event)"
                                :disabled="!regionPricing.some((p) => p.region_id === data.region_id && p.enabled) || loading.isFormSending"
                                mode="decimal"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                suffix=" DA"
                                size="small"
                                inputClass="w-full"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
                <Button :label="t('common.labels.cancel')" severity="secondary" outlined @click="goBack" :disabled="loading.isFormSending" />
                <Button :label="t('shipper.labels.save_shipper')" type="submit" :loading="loading.isFormSending" />
            </div>
        </Form>
    </div>
</template>
