<script setup lang="ts">
import { useAttributeService } from '@/services/useAttributeService';
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { attributeSchema, ATTRIBUTE_TYPES } from '@/validations/attribute';
import { validate, validateField } from '@/validations/validate';
import type { AttributeData, AttributeFormData } from '@/types/attribute';
import type { CategoryData } from '@/types/category';
import { inject, onMounted, ref, computed, watch } from 'vue';
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
const allCategories = ref<CategoryData[]>([]);

// TreeSelect uses { [key]: true } object format for v-model
const selectedCategoryKeys = ref<Record<string, boolean>>({});

// Sync selectedCategoryKeys -> record.category_ids
watch(
    selectedCategoryKeys,
    (newVal) => {
        if (!newVal || Object.keys(newVal).length === 0) {
            record.value.category_ids = [];
        } else {
            record.value.category_ids = Object.keys(newVal)
                .map(Number)
                .filter((n) => !isNaN(n));
        }
    },
    { deep: true }
);

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

// Tree options for TreeSelect
const treeSelectNodes = computed(() => {
    const buildTree = (items: CategoryData[], parentId: number | null = null): any[] => {
        return items
            .filter((item: CategoryData) => item.parent_id === parentId)
            .map((item: CategoryData) => {
                const children = buildTree(items, item.id);
                return {
                    key: String(item.id),
                    label: item.name,
                    data: item.id,
                    value: item.id,
                    icon: item.icon || 'pi pi-folder',
                    children: children.length > 0 ? children : undefined
                };
            });
    };
    return buildTree(allCategories.value);
});

// Whether the selected type supports values
const supportsValues = computed(() => {
    return record.value.type === 'dropdown' || record.value.type === 'multiselect';
});

// Add a new value entry
function addValue(): void {
    record.value.values.push({ value: '', sort_order: record.value.values.length });
}

// Remove a value entry
function removeValue(index: number): void {
    record.value.values.splice(index, 1);
    // Reorder sort_order
    record.value.values.forEach((v, i) => (v.sort_order = i));
}

// Type configuration for visual cards
const typeConfig: Record<string, { icon: string; color: string }> = {
    dropdown: { icon: 'pi pi-chevron-down', color: '#3B82F6' },
    text: { icon: 'pi pi-align-left', color: '#64748B' },
    switches: { icon: 'pi pi-toggle-on', color: '#10B981' },
    multiselect: { icon: 'pi pi-list-check', color: '#F59E0B' },
    date: { icon: 'pi pi-calendar', color: '#8B5CF6' },
    numeric: { icon: 'pi pi-hashtag', color: '#06B6D4' },
    boolean: { icon: 'pi pi-check-square', color: '#10B981' },
    file: { icon: 'pi pi-file', color: '#6B7280' }
};

const onFormSubmit = (): void => {
    if (!validateForm()) return;
    loading.startFormSending();

    const formData = { ...record.value };

    // Strip values if the type doesn't support them
    if (!supportsValues.value) {
        formData.values = [];
    }

    const isEdit = action.value === ACTIONS.EDIT;
    const serviceAction = isEdit ? (data: Partial<AttributeFormData>) => useAttributeService.updateAttribute((record.value as AttributeFormData & { id: number }).id, data) : useAttributeService.storeAttribute;

    serviceAction(formData as AttributeFormData)
        .then((response) => {
            dialogRef?.value.close({ record: response.data, action: action.value });
        })
        .catch((error: any) => {
            authStore.processError && authStore.processError(error, t('common.messages.error'));
            showToast('error', action.value, 'attribute', 'tr');
        })
        .finally(() => {
            loading.stopFormSending();
        });
};

const closeDialog = (): void => dialogRef?.value.close();

onMounted(async () => {
    // Load categories for TreeSelect
    try {
        const data = await useCategoryService.getCategories({});
        allCategories.value = data.categories || [];
    } catch (e) {
        console.error('Failed to load categories');
    }

    if (!dialogRef?.value) return;

    const incoming = dialogRef.value.data.record || ({} as AttributeFormData);

    record.value = {
        ...record.value,
        ...incoming,
        category_ids: (incoming as AttributeData).categories?.map((c: { id: number }) => c.id) || incoming.category_ids || [],
        values:
            (incoming as AttributeData).values?.map((v: any) => ({
                id: v.id,
                value: v.value,
                sort_order: v.sort_order ?? 0
            })) ||
            incoming.values ||
            []
    };

    // Set TreeSelect keys from category_ids
    if (record.value.category_ids.length) {
        const keys: Record<string, boolean> = {};
        record.value.category_ids.forEach((id) => {
            keys[String(id)] = true;
        });
        selectedCategoryKeys.value = keys;
    }

    action.value = dialogRef.value.data.action;
});
</script>

<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
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
                        v-for="attrType in ATTRIBUTE_TYPES"
                        :key="attrType"
                        class="cursor-pointer border rounded-lg p-3 text-center transition-all duration-200 hover:shadow-md"
                        :class="[record.type === attrType ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600']"
                        @click="record.type = attrType"
                    >
                        <i :class="typeConfig[attrType]?.icon" class="text-xl mb-1" :style="{ color: typeConfig[attrType]?.color }"></i>
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
                            <InputText v-model="val.value" :placeholder="t('attribute.form.value_placeholder')" class="flex-1" size="small" :disabled="loading.isFormSending" />
                            <Button icon="pi pi-times" severity="danger" text rounded size="small" @click="removeValue(index)" :disabled="loading.isFormSending" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Categories TreeSelect -->
            <div class="col-span-1">
                <FloatLabel variant="on" class="w-full">
                    <TreeSelect
                        id="categories"
                        v-model="selectedCategoryKeys"
                        :options="treeSelectNodes"
                        selectionMode="checkbox"
                        :placeholder="t('attribute.form.select_categories')"
                        class="w-full"
                        :disabled="loading.isFormSending"
                        :metaKeySelection="false"
                        display="chip"
                    />
                    <label for="categories">{{ t('attribute.form.categories') }}</label>
                </FloatLabel>
            </div>

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
