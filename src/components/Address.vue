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
    multiple: { type: Boolean, default: true }
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
        region: a?.region ?? null,
        city: a?.city ?? null,
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
        region: a?.region ?? null,
        city: a?.city ?? null,
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
        suppressEmit.value = true;
        localAddresses.value = normalizeIn(newVal);

        // warm cache for existing regions
        const regions = [...new Set(localAddresses.value.map((a) => a.region).filter(Boolean))];
        await Promise.all(regions.map((rid) => getCitiesForRegion(rid)));

        // drop invalid cities
        for (const addr of localAddresses.value) {
            if (!addr.region) {
                addr.city = null;
                continue;
            }
            const cities = cityOptionsFor(addr.region);
            if (addr.city && !cities.some((c) => c.id === addr.city)) addr.city = null;
        }

        suppressEmit.value = false;
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
        <div v-if="isMultiple" class="flex justify-end mb-6">
            <Button icon="pi pi-plus" :label="t('address.buttons.add_address')" @click="addAddress" outlined />
        </div>

        <div class="space-y-6">
            <div v-for="(address, index) in localAddresses" :key="address._key" :class="['address-card', { 'border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900 shadow-sm': isMultiple }]">
                <div v-if="isMultiple && localAddresses.length > 1" class="flex justify-end">
                    <Button icon="pi pi-trash" @click="removeAddress(index)" severity="danger" size="small" outlined :title="t('address.buttons.remove')" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="col-span-2">
                        <FloatLabel variant="on">
                            <IconField>
                                <InputIcon class="pi pi-map-marker" />
                                <InputText :id="`street_${address._key}`" v-model="address.street" class="w-full" maxlength="255" @blur="() => onFieldBlur(index, 'street')" />
                                <label :for="`street_${address._key}`">{{ t('address.labels.street') }}</label>
                            </IconField>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.street`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.street`]?.[0]) }}
                        </Message>
                    </div>

                    <div>
                        <FloatLabel variant="on">
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

                    <div>
                        <FloatLabel variant="on">
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

                <div v-if="isMultiple" class="flex items-center space-x-4 mt-4">
                    <Checkbox :id="`main_${address._key}`" :modelValue="address.main" :binary="true" @update:modelValue="() => setMain(index)" />
                    <label :for="`main_${address._key}`">{{ t('address.labels.main') }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
