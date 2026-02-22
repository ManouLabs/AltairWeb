<script setup>
import { useRegionService } from '@/services/useRegionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const authStore = useAuthStore();
const loading = ref(false);
const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    multiple: { type: Boolean, default: true },
    regions: { type: Array, default: null }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isMultiple = computed(() => props.multiple !== false && props.multiple !== 'false');

const localeField = computed(() => {
    const loc = String(locale.value || '').toLowerCase();
    if (loc === 'fr' || loc.startsWith('fr')) return 'name_fr';
    if (loc === 'ar' || loc.startsWith('ar')) return 'name_ar';
    return 'name';
});

// ---------- state ----------
const regionOptions = ref([]);
const localAddresses = ref([]); // each item: {_key, street, region, city, main}

let keySeed = 0;
const makeKey = () => `addr_${Date.now()}_${keySeed++}`;

const normalizeIn = (arr) => {
    const incoming = Array.isArray(arr) ? arr : [];
    const normalized = incoming.map((a) => ({
        _key: makeKey(),
        street: a?.street ?? '',
        region: typeof a?.region === 'object' && a?.region !== null ? a.region.id : (a?.region ?? null),
        city: typeof a?.city === 'object' && a?.city !== null ? a.city.id : (a?.city ?? null),
        main: typeof a?.main === 'boolean' ? a.main : !isMultiple.value
    }));

    if (!isMultiple.value) {
        // single mode: exactly one row, main always true
        if (normalized.length === 0) normalized.push({ _key: makeKey(), street: '', region: null, city: null, main: true });
        normalized.splice(1);
        normalized[0].main = true;
    } else {
        // multiple mode: ensure at least one "main"
        if (normalized.length > 0 && !normalized.some((x) => x.main)) normalized[0].main = true;
    }

    return normalized;
};

const normalizeOut = (arr) =>
    (Array.isArray(arr) ? arr : []).map((a) => ({
        street: a?.street ?? '',
        region: typeof a?.region === 'object' && a?.region !== null ? a.region.id : (a?.region ?? null),
        city: typeof a?.city === 'object' && a?.city !== null ? a.city.id : (a?.city ?? null),
        main: Boolean(a?.main)
    }));

const isEqualAddresses = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if ((a[i]?.street ?? '') !== (b[i]?.street ?? '') || (a[i]?.region ?? null) !== (b[i]?.region ?? null) || (a[i]?.city ?? null) !== (b[i]?.city ?? null) || Boolean(a[i]?.main) !== Boolean(b[i]?.main)) return false;
    }
    return true;
};

// ---------- cities cache ----------
const citiesCache = ref(new Map()); // regionId -> cities[]
const getCitiesForRegion = async (regionId) => {
    if (!regionId) return [];
    const cache = citiesCache.value;
    if (cache.has(regionId)) return cache.get(regionId);
    loading.value = true;
    try {
        const data = await useRegionService.getRegionCities(regionId);
        const cities = data?.cities ?? data ?? [];
        cache.set(regionId, cities);
        return cities;
    } catch {
        cache.set(regionId, []);
        return [];
    } finally {
        loading.value = false;
    }
};

const cityOptionsFor = (regionId) => {
    if (!regionId) return [];
    return citiesCache.value.get(regionId) ?? [];
};

// ---------- sync IN ----------
const suppressEmit = ref(false);

watch(
    () => props.modelValue,
    async (newVal) => {
        // Skip re-normalization if local data already matches (avoids key regeneration & focus loss)
        const incomingNorm = normalizeOut(newVal);
        const localNorm = normalizeOut(localAddresses.value);
        if (localAddresses.value.length > 0 && isEqualAddresses(incomingNorm, localNorm)) {
            return;
        }

        suppressEmit.value = true;
        const incoming = Array.isArray(newVal) ? newVal : [];

        // Pre-populate cache with cities from incoming data (if included)
        for (const addr of incoming) {
            const region = addr?.region;
            if (region && typeof region === 'object' && region.id && Array.isArray(region.cities)) {
                citiesCache.value.set(region.id, region.cities);
            }
        }

        localAddresses.value = normalizeIn(newVal);

        // Only fetch cities for regions not already in cache
        const regions = [...new Set(localAddresses.value.map((a) => a.region).filter(Boolean))];
        const uncachedRegions = regions.filter((rid) => !citiesCache.value.has(rid));
        await Promise.all(uncachedRegions.map((rid) => getCitiesForRegion(rid)));

        suppressEmit.value = false;

        // Emit normalized data to parent so it has IDs instead of objects
        const payload = normalizeOut(localAddresses.value);
        const propNorm = normalizeOut(props.modelValue);
        if (!isEqualAddresses(payload, propNorm)) {
            emit('update:modelValue', payload);
        }
    },
    { immediate: true, deep: true }
);

// ---------- sync OUT ----------
watch(
    localAddresses,
    (val) => {
        if (suppressEmit.value) return;

        const payload = normalizeOut(val);
        const propNorm = normalizeOut(props.modelValue);

        if (isEqualAddresses(payload, propNorm)) return;

        emit('update:modelValue', payload);
        emit('change', payload);
    },
    { deep: true }
);

// ---------- lifecycle ----------
onMounted(async () => {
    // Use regions from prop if provided, otherwise fetch
    if (props.regions && props.regions.length > 0) {
        regionOptions.value = props.regions;
        return;
    }
    loading.value = true;
    try {
        const data = await useRegionService.getAllRegions();
        regionOptions.value = data?.regions ?? [];
    } catch {
        regionOptions.value = [];
    } finally {
        loading.value = false;
    }
});

// ---------- actions ----------
const addAddress = async () => {
    if (!isMultiple.value) return;
    localAddresses.value.push({ _key: makeKey(), street: '', region: null, city: null, main: localAddresses.value.length === 0 });
};

const removeAddress = (index) => {
    if (!isMultiple.value) return;
    if (localAddresses.value.length <= 1) return;

    const removedWasMain = Boolean(localAddresses.value[index]?.main);
    localAddresses.value.splice(index, 1);

    // keep a main address
    if (removedWasMain && localAddresses.value.length) localAddresses.value[0].main = true;
};

const setMain = (index) => {
    if (!isMultiple.value) return;
    localAddresses.value.forEach((a, i) => (a.main = i === index));
};

const onFieldBlur = (index, field) => {
    authStore.clearErrors([`addresses.${index}.${field}`]);
};

const onRegionChange = async (index, regionId) => {
    const addr = localAddresses.value[index];
    if (!addr) return;

    addr.region = regionId || null;
    addr.city = null;

    if (!addr.region) return;

    const cities = await getCitiesForRegion(addr.region);
    // no need to set a separate options array; template reads from cache
    if (addr.city && !cities.some((c) => c.id === addr.city)) addr.city = null;
};
</script>

<template>
    <div class="addresses-component">
        <div class="space-y-6">
            <div v-for="(address, index) in localAddresses" :key="address._key" class="border border-surface-200 dark:border-surface-700 rounded-xl p-6 bg-surface-0 dark:bg-surface-900">
                <!-- Address header -->
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-map-marker text-primary" />
                        <span class="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-wider">{{ t('address.labels.address') }} {{ index + 1 }}</span>
                    </div>
                    <Button v-if="isMultiple && localAddresses.length > 1" icon="pi pi-trash" @click="removeAddress(index)" severity="danger" text rounded size="small" :title="t('address.buttons.remove')" />
                </div>

                <!-- Fields: Street / Region / City -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Street -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-map-marker" />
                                <InputText :id="`street_${address._key}`" v-model="address.street" class="w-full" maxlength="255" @blur="() => onFieldBlur(index, 'street')" />
                            </IconField>
                            <label :for="`street_${address._key}`">{{ t('address.labels.street') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.street`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.street`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- Region -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <Select
                                :id="`region_${address._key}`"
                                v-model="address.region"
                                filter
                                :options="regionOptions"
                                dropdownIcon="pi pi-map"
                                :optionLabel="localeField"
                                optionValue="id"
                                class="w-full"
                                @change="(e) => onRegionChange(index, e.value)"
                                @blur="() => onFieldBlur(index, 'region')"
                            />
                            <label :for="`region_${address._key}`">{{ t('address.labels.region') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.region`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.region`]?.[0]) }}
                        </Message>
                    </div>

                    <!-- City -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <Select
                                :id="`city_${address._key}`"
                                v-model="address.city"
                                filter
                                dropdownIcon="pi pi-building"
                                :options="cityOptionsFor(address.region)"
                                :optionLabel="localeField"
                                optionValue="id"
                                :disabled="!address.region || loading"
                                :loading="loading"
                                class="w-full"
                                @blur="() => onFieldBlur(index, 'city')"
                            />
                            <label :for="`city_${address._key}`">{{ t('address.labels.city') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.city`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.city`]?.[0]) }}
                        </Message>
                    </div>
                </div>

                <!-- Main Address toggle -->
                <div v-if="isMultiple" class="flex items-center gap-3 mt-4">
                    <ToggleSwitch :modelValue="address.main" @update:modelValue="() => setMain(index)" />
                    <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('address.labels.main') }}</label>
                </div>
            </div>
        </div>

        <!-- Add another address -->
        <div
            v-if="isMultiple"
            class="mt-6 flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl py-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
            @click="addAddress"
        >
            <i class="pi pi-plus-circle text-primary mr-2" />
            <span class="text-sm font-semibold text-primary uppercase tracking-wider">{{ t('address.buttons.add_address') }}</span>
        </div>
    </div>
</template>

<style scoped></style>
