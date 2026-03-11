<script setup lang="ts">
import { useAttributeService } from '@/services/useAttributeService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { attributeSchema } from '@/validations/attribute';
import { validate, validateField } from '@/validations/validate';
import { ATTRIBUTE_TYPES } from '@/types/attribute';
import type { AttributeFormData } from '@/types/attribute';
import { inject, onMounted, ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();

const record = ref<AttributeFormData>({
    name: null,
    type: null,
    active: true,
    category_ids: [],
    values: []
});

const dialogRef = inject<any>('dialogRef');
const action = ref<string>('');

const schema = attributeSchema;

const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path: string) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

// Whether the selected type supports values
const supportsValues = computed(() => {
    return record.value.type === 'dropdown' || record.value.type === 'multiselect' || record.value.type === 'radio' || record.value.type === 'color';
});

const isColor = computed(() => record.value.type === 'color');
const isBoolean = computed(() => record.value.type === 'boolean');
const booleanLabels = reactive({ yes: '', no: '' });

// Add a new value entry
function addValue(): void {
    record.value.values.push({ value: '', color: isColor.value ? '000000' : undefined, sort_order: record.value.values.length });
}

// Remove a value entry
function removeValue(index: number): void {
    record.value.values.splice(index, 1);
    record.value.values.forEach((v, i) => (v.sort_order = i));
}

// Attribute type keys for template iteration
const attributeTypeKeys = Object.keys(ATTRIBUTE_TYPES) as (keyof typeof ATTRIBUTE_TYPES)[];

function handleTypeChange(type: string): void {
    record.value.type = type;
    authStore.clearErrors(['type']);

    const typesWithOptions = ['dropdown', 'multiselect', 'radio', 'color'];
    if (typesWithOptions.includes(type)) {
        if (record.value.values.length === 0) {
            record.value.values.push({ value: '', color: type === 'color' ? '000000' : undefined, sort_order: 0 });
        }
    } else {
        record.value.values = [];
    }
}

// Category name resolved from the parent context
const categoryName = ref<string>('');

const onFormSubmit = (): void => {
    if (!validateForm()) return;
    loading.startFormSending();

    const formData = { ...record.value };

    // Strip values if the type doesn't support them
    if (!supportsValues.value) {
        formData.values = [];
    }

    useAttributeService
        .storeAttribute(formData as AttributeFormData)
        .then((response) => {
            dialogRef?.value.close({ record: response.data, action: action.value });
        })
        .catch((error: any) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'attribute', 'tr', error);
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

const closeDialog = (): void => dialogRef?.value.close();

onMounted(() => {
    if (!dialogRef?.value) return;

    const incoming = dialogRef.value.data.record || ({} as AttributeFormData);

    record.value = {
        ...record.value,
        ...incoming,
        category_ids: incoming.category_ids || [],
        values: incoming.values || []
    };

    categoryName.value = dialogRef.value.data.categoryName || '';
    action.value = dialogRef.value.data.action;
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
            <!-- Category badge (read-only context) -->
            <div v-if="categoryName" class="col-span-1 flex items-center gap-2">
                <i class="pi pi-folder text-sm text-primary"></i>
                <span class="text-sm text-surface-500 dark:text-surface-400">{{ t('product.form.inline_attr_category_hint') }}</span>
                <Tag :value="categoryName" severity="info" />
            </div>

            <!-- Name -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <IconField>
                        <InputIcon class="pi pi-tag" />
                        <InputText
                            id="name"
                            v-model="record.name"
                            :disabled="loading.isFormSending"
                            class="w-full"
                            maxlength="150"
                            :invalid="authStore.errors?.['name']?.[0] ? true : false"
                            @input="() => authStore.clearErrors(['name'])"
                            @blur="() => onBlurField('name')"
                            autofocus
                        />
                    </IconField>
                    <label for="name">{{ t('attribute.form.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['name']?.[0]) }}</Message>
            </div>

            <!-- Type Selector Cards -->
            <div class="col-span-1">
                <label class="block text-sm font-medium mb-2">{{ t('attribute.form.type') }} *</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div
                        v-for="attrType in attributeTypeKeys"
                        :key="attrType"
                        class="cursor-pointer border rounded-lg p-3 text-center transition-all duration-200 hover:shadow-md"
                        :class="[record.type === attrType ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600']"
                        @click="handleTypeChange(attrType)"
                    >
                        <i :class="ATTRIBUTE_TYPES[attrType]?.icon" class="text-xl mb-1" :style="{ color: ATTRIBUTE_TYPES[attrType]?.color }"></i>
                        <div class="text-xs font-medium mt-1">{{ t(`attribute.types.${attrType}`) }}</div>
                    </div>
                </div>
                <Message v-if="authStore.errors?.['type']?.[0]" severity="error" size="small">{{ t(authStore.errors?.['type']?.[0]) }}</Message>
            </div>

            <!-- Values (for dropdown/multiselect only) -->
            <transition name="fade">
                <div v-if="supportsValues" class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-4 bg-surface-0 dark:bg-surface-900">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-semibold">{{ t('attribute.form.values') }}</h3>
                        <Button :label="t('attribute.form.add_value')" icon="pi pi-plus" size="small" text @click="addValue" :disabled="loading.isFormSending" />
                    </div>
                    <div v-if="record.values.length === 0" class="text-center py-4 text-surface-400 text-sm italic">
                        {{ t('attribute.form.no_values') }}
                    </div>
                    <div v-else class="space-y-2">
                        <div v-for="(val, index) in record.values" :key="index" class="flex items-center gap-2">
                            <span class="text-xs text-surface-400 w-6 text-center">{{ index + 1 }}</span>
                            <InputText v-model="val.value" :placeholder="t('attribute.form.value_placeholder')" class="flex-1" size="small" :disabled="loading.isFormSending" @input="() => authStore.clearErrors(['values', `values.${index}.value`])" />
                            <template v-if="isColor">
                                <ColorPicker v-model="val.color" format="hex" :disabled="loading.isFormSending" />
                                <InputText v-model="val.color" class="w-24" size="small" maxlength="6" placeholder="FF0000" :disabled="loading.isFormSending" />
                            </template>
                            <Button icon="pi pi-times" severity="danger" text rounded size="small" @click="removeValue(index)" :disabled="loading.isFormSending" />
                        </div>
                    </div>
                    <Message v-if="authStore.errors?.['values']?.[0] || authStore.errors?.['values.0.value']?.[0]" severity="error" size="small" class="mt-2">
                        {{ t((authStore.errors?.['values']?.[0] || authStore.errors?.['values.0.value']?.[0]) ?? '') }}
                    </Message>
                </div>
            </transition>

            <!-- Boolean Yes/No Labels -->
            <transition name="fade">
                <div v-if="isBoolean" class="col-span-1 border border-surface-200 dark:border-surface-700 rounded-lg p-4 bg-surface-0 dark:bg-surface-900">
                    <h3 class="text-sm font-semibold mb-3">{{ t('attribute.form.values') }}</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.yes_label') }}</label>
                            <InputText v-model="booleanLabels.yes" :placeholder="t('attribute.form.yes_placeholder')" class="w-full" size="small" :disabled="loading.isFormSending" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.no_label') }}</label>
                            <InputText v-model="booleanLabels.no" :placeholder="t('attribute.form.no_placeholder')" class="w-full" size="small" :disabled="loading.isFormSending" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Active Toggle -->
            <div class="col-span-1 flex items-center gap-3">
                <ToggleSwitch id="active" v-model="record.active" :disabled="loading.isFormSending" />
                <label for="active" class="font-medium">{{ t('attribute.form.active') }}</label>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isFormSending" />
        </div>
    </form>
</template>
