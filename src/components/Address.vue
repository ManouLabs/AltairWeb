<script setup>
import { useRegionService } from '@/services/useRegionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// compute which name field to use for labels based on current locale
const localeField = computed(() => {
    const loc = String(locale.value || '').toLowerCase();
    if (loc === 'fr' || loc.startsWith('fr')) return 'name_fr';
    if (loc === 'ar' || loc.startsWith('ar')) return 'name_ar';
    return 'name';
});

const authStore = useAuthStore();
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['update:modelValue', 'change']);

const localAddresses = ref([]);
const regionOptions = ref([]);
const cityOptions = ref([]);

const clone = (v) => JSON.parse(JSON.stringify(v ?? []));

watch(
    () => props.modelValue,
    (newValue) => {
        localAddresses.value = Array.isArray(newValue) ? clone(newValue) : [];
        // reset shared city options when model changes
        cityOptions.value = [];
    },
    { immediate: true }
);

watch(
    localAddresses,
    (newValue) => {
        const payload = clone(newValue);
        const sameAsProp = JSON.stringify(payload) === JSON.stringify(props.modelValue ?? []);
        if (sameAsProp) return;
        emit('update:modelValue', payload);
        emit('change', payload);
    },
    { deep: true }
);

onMounted(async () => {
    try {
        const data = await useRegionService.getAllRegions();
        const regions = data.regions || [];
        regionOptions.value = regions;
    } catch (e) {
        regionOptions.value = [];
    }
});

function createNewAddress() {
    return {
        street: '',
        region: null,
        city: null,
        main: false
    };
}

const addAddress = () => {
    localAddresses.value.push(createNewAddress());
};

const removeAddress = (index) => {
    if (localAddresses.value.length > 1) {
        localAddresses.value.splice(index, 1);
        // shared cityOptions remains as-is (global list)
    }
};

const toggleMain = (index) => {
    localAddresses.value.forEach((a, i) => {
        a.main = i === index;
    });
};

const onFieldBlur = (index, field) => {
    const key = `addresses.${index}.${field}`;
    // basic clearing behavior to match Contact component pattern
    authStore.clearErrors([key]);
};

// Called when a region is selected for a specific address index
const onRegionChange = async (index, regionId) => {
    // clear current city selection for this address
    localAddresses.value[index].city = null;
    // reset shared city options while loading
    cityOptions.value = [];

    if (!regionId) {
        return;
    }

    try {
        const data = await useRegionService.getRegionCities(regionId);
        const cities = data.cities || data || [];
        // set shared city options (no per-index mapping)
        cityOptions.value = cities;
    } catch (e) {
        cityOptions.value = [];
    }
};
</script>

<template>
    <div class="addresses-component">
        <div class="flex justify-end mb-6">
            <Button icon="pi pi-plus" :label="t('address.buttons.add_address')" @click="addAddress" outlined />
        </div>

        <div class="space-y-6">
            <div v-for="(address, index) in localAddresses" :key="index" class="address-card border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900 shadow-sm">
                <div v-if="localAddresses.length > 1" class="flex justify-end mb-4">
                    <Button icon="pi pi-trash" @click="removeAddress(index)" severity="danger" size="small" outlined :title="t('address.buttons.remove')" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div class="col-span-2">
                        <FloatLabel variant="on">
                            <InputText :id="`street_${index}`" v-model="address.street" :disabled="disabled" class="w-full" maxlength="255" @blur="() => onFieldBlur(index, 'street')" />
                            <label :for="`street_${index}`">{{ t('address.labels.street') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.street`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.street`]?.[0]) }}
                        </Message>
                    </div>

                    <div>
                        <FloatLabel variant="on">
                            <Select
                                :id="`region_${index}`"
                                v-model="address.region"
                                filter
                                :options="regionOptions"
                                :optionLabel="localeField"
                                optionValue="id"
                                :disabled="disabled"
                                class="w-full"
                                @change="(e) => onRegionChange(index, e.value)"
                                @blur="() => onFieldBlur(index, 'region')"
                            />
                            <label :for="`region_${index}`">{{ t('address.labels.region') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.region`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.region`]?.[0]) }}
                        </Message>
                    </div>

                    <div>
                        <FloatLabel variant="on">
                            <Select :id="`city_${index}`" :optionLabel="localeField" v-model="address.city" filter :options="cityOptions" optionValue="id" :disabled="disabled" class="w-full" @blur="() => onFieldBlur(index, 'city')" />

                            <label :for="`city_${index}`">{{ t('address.labels.city') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors?.[`addresses.${index}.city`]" severity="error" size="small">
                            {{ t(authStore.errors?.[`addresses.${index}.city`]?.[0]) }}
                        </Message>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <Checkbox :id="`main_${index}`" v-model="address.main" :disabled="disabled" @input="() => toggleMain(index)" />
                    <label :for="`main_${index}`">{{ t('address.labels.main') }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
