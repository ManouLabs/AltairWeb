<script setup>
import { useCityService } from '@/services/useCityService';
import { useRegionService } from '@/services/useRegionService';
import { useAuthStore } from '@/stores/useAuthStore';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    },
    // optional external options; if empty, component will fetch regions
    regionOptions: {
        type: Array,
        default: () => []
    },
    // global city options (rarely used) - per-address city lists are fetched when region selected
    cityOptions: {
        type: Array,
        default: () => []
    }
});
const emit = defineEmits(['update:modelValue', 'change']);

const localAddresses = ref([]);
const fetchedRegionOptions = ref([]);
const cityOptionsMap = ref({}); // map index -> options array

const clone = (v) => JSON.parse(JSON.stringify(v ?? []));

// Sync from parent when modelValue changes
watch(
    () => props.modelValue,
    (newValue) => {
        localAddresses.value = Array.isArray(newValue) ? clone(newValue) : [];
    },
    { immediate: true }
);

// Emit changes when localAddresses change
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

// Watch for region changes per address to fetch cities for that address
watch(
    localAddresses,
    async (newVal, oldVal) => {
        for (let i = 0; i < newVal.length; i++) {
            const newRegion = newVal[i]?.region;
            const oldRegion = oldVal?.[i]?.region;
            if (newRegion && newRegion !== oldRegion) {
                // clear current city selection
                localAddresses.value[i].city = null;
                try {
                    const params = { region_id: newRegion };
                    const data = await useCityService.getCities(params);
                    const options = (data.cities || []).map((c) => ({ value: c.id, label: c.name }));
                    cityOptionsMap.value = { ...cityOptionsMap.value, [i]: options };
                } catch (e) {
                    cityOptionsMap.value = { ...cityOptionsMap.value, [i]: [] };
                }
            }
        }
    },
    { deep: true }
);

// Fetch all regions on mount if not provided via props
onMounted(async () => {
    if (!props.regionOptions || props.regionOptions.length === 0) {
        try {
            const data = await useRegionService.getRegions({});
            const regions = data.regions || [];
            fetchedRegionOptions.value = regions.map((r) => ({ value: r.id, label: r.name }));
        } catch (e) {
            fetchedRegionOptions.value = [];
        }
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
                                :options="regionOptions && regionOptions.length ? regionOptions : fetchedRegionOptions"
                                optionValue="value"
                                optionLabel="label"
                                :disabled="disabled"
                                class="w-full"
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
                            <Select
                                :id="`city_${index}`"
                                v-model="address.city"
                                :options="cityOptionsMap[index] ? cityOptionsMap[index] : cityOptions && cityOptions.length ? cityOptions : []"
                                optionValue="value"
                                optionLabel="label"
                                :disabled="disabled"
                                class="w-full"
                                @blur="() => onFieldBlur(index, 'city')"
                            />
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
