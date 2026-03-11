<script setup lang="ts">
import { useAttributeService } from '@/services/useAttributeService';
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { attributeSchema } from '@/validations/attribute';
import { validate } from '@/validations/validate';
import { ATTRIBUTE_TYPES } from '@/types/attribute';
import type { AttributeData, AttributeFormData, AttributeValueData } from '@/types/attribute';
import type { CategoryData } from '@/types/category';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, onMounted, reactive, ref } from 'vue';
import { z } from 'zod';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import FormHeader from '@/components/FormHeader.vue';
import CardSection from '@/components/CardSection.vue';
import { Form as PForm } from '@primevue/forms';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();

const isEdit = computed<boolean>(() => !!route.params.id);
const isLoading = ref<boolean>(true);
const allCategories = ref<CategoryData[]>([]);
const formKey = ref<number>(0);

// Form initial values
const initialValues = reactive({
    name: '',
    type: 'dropdown',
    active: true
});

// Values managed separately (not in PrimeVue Form resolver)
const attributeValues = ref<{ id?: number; value: string; color?: string; sort_order: number }[]>([]);
const booleanLabels = reactive({ yes: '', no: '' });

// Category tree keys
const selectedCategoryKeys = ref<Record<string, any>>({});
const expandedKeys = ref<Record<string, boolean>>({});

// Attribute type keys for template iteration
const attributeTypeKeys = Object.keys(ATTRIBUTE_TYPES) as (keyof typeof ATTRIBUTE_TYPES)[];

// Resolver for PrimeVue Form — only covers FormField-managed fields (name, active)
const resolver = zodResolver(
    z.object({
        name: z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(150, { message: 'common.messages.max_length' })),
        active: z.boolean().default(true)
    })
);

// Category search filter
const categorySearch = ref('');

// Tree nodes for TreeSelect
const treeSelectNodes = computed(() => {
    const allItems = allCategories.value;
    const query = categorySearch.value?.toLowerCase();

    // Collect IDs of matching categories and all their ancestors
    const visibleIds = new Set<number>();
    if (query) {
        const matchingIds = allItems.filter((cat: CategoryData) => cat.name?.toLowerCase().includes(query)).map((cat: CategoryData) => cat.id);
        const addAncestors = (id: number) => {
            if (visibleIds.has(id)) return;
            visibleIds.add(id);
            const parent = allItems.find((c: CategoryData) => c.id === id);
            if (parent?.parent_id) addAncestors(parent.parent_id);
        };
        matchingIds.forEach(addAncestors);
    }

    const buildTree = (items: CategoryData[], parentId: number | null = null): any[] => {
        return items
            .filter((item: CategoryData) => item.parent_id === parentId && (!query || visibleIds.has(item.id)))
            .map((item: CategoryData) => {
                const children = buildTree(items, item.id);
                return {
                    key: String(item.id),
                    label: item.name,
                    data: item.id,
                    icon: item.icon || 'pi pi-folder',
                    children: children.length > 0 ? children : undefined
                };
            });
    };
    return buildTree(allItems);
});

// Whether type supports options
const supportsValues = computed(() => {
    return initialValues.type === 'dropdown' || initialValues.type === 'multiselect' || initialValues.type === 'radio' || initialValues.type === 'color';
});

const isColor = computed(() => initialValues.type === 'color');

const isBoolean = computed(() => initialValues.type === 'boolean');

// Add value
function addValue(): void {
    attributeValues.value.push({ value: '', color: isColor.value ? '000000' : undefined, sort_order: attributeValues.value.length });
}

// Remove value
function removeValue(index: number): void {
    attributeValues.value.splice(index, 1);
    attributeValues.value.forEach((v, i) => (v.sort_order = i));
}

// Load categories
async function loadCategories(): Promise<void> {
    try {
        const data = await useCategoryService.getAllCategories();
        allCategories.value = data.categories || [];
    } catch (e) {
        console.error('Failed to load categories');
    }
}

// Load attribute for edit
async function loadAttribute(): Promise<void> {
    if (!isEdit.value) return;
    try {
        loading.startDataLoading();
        const response = await useAttributeService.getAttribute(Number(route.params.id));
        const attribute: AttributeData = response.data;

        initialValues.name = attribute.name;
        initialValues.type = attribute.type;
        initialValues.active = attribute.active;

        // Set values
        if (attribute.values) {
            attributeValues.value = attribute.values.map((v: AttributeValueData) => ({
                id: v.id,
                value: v.value,
                color: v.color ?? undefined,
                sort_order: v.sort_order ?? 0
            }));
        }

        // Set category keys
        if (attribute.categories) {
            const keys: Record<string, { checked: boolean; partialChecked: boolean }> = {};
            attribute.categories.forEach((c: { id: number }) => {
                keys[String(c.id)] = { checked: true, partialChecked: false };
            });
            selectedCategoryKeys.value = keys;
        }

        formKey.value++;
    } catch (error) {
        console.error('Error loading attribute:', error);
        showToast('error', ACTIONS.EDIT, 'attribute', 'tc', error);
    } finally {
        loading.stopDataLoading();
    }
}

const selectedCategoryCount = computed(() => {
    return Object.keys(selectedCategoryKeys.value).filter((k) => selectedCategoryKeys.value[k]?.checked).length;
});

const allExpanded = computed(() => {
    const allKeys = getAllTreeKeys(treeSelectNodes.value);
    return allKeys.length > 0 && allKeys.every((k) => expandedKeys.value[k]);
});

const allSelected = computed(() => {
    const allKeys = getAllTreeKeys(treeSelectNodes.value);
    return allKeys.length > 0 && allKeys.every((k) => selectedCategoryKeys.value[k]?.checked);
});

function getAllTreeKeys(nodes: any[]): string[] {
    let keys: string[] = [];
    for (const node of nodes) {
        keys.push(node.key);
        if (node.children) keys = keys.concat(getAllTreeKeys(node.children));
    }
    return keys;
}

function toggleSelectAll(): void {
    const allKeys = getAllTreeKeys(treeSelectNodes.value);
    if (allSelected.value) {
        selectedCategoryKeys.value = {};
    } else {
        const keys: Record<string, { checked: boolean; partialChecked: boolean }> = {};
        allKeys.forEach((k) => (keys[k] = { checked: true, partialChecked: false }));
        selectedCategoryKeys.value = keys;
    }
}

function toggleExpandAll(): void {
    const allKeys = getAllTreeKeys(treeSelectNodes.value);
    if (allExpanded.value) {
        expandedKeys.value = {};
    } else {
        const keys: Record<string, boolean> = {};
        allKeys.forEach((k) => (keys[k] = true));
        expandedKeys.value = keys;
    }
}

// Form submit
const onFormSubmit = async ({ values }: any): Promise<void> => {

    // Build category_ids from tree keys
    const category_ids = Object.keys(selectedCategoryKeys.value)
        .filter((k) => selectedCategoryKeys.value[k]?.checked)
        .map(Number)
        .filter((n) => !isNaN(n));

    const payload: AttributeFormData = {
        name: values.name,
        type: initialValues.type,
        active: values.active ?? true,
        category_ids,
        values: supportsValues.value ? attributeValues.value : []
    };

    // Frontend Zod validation
    const { ok, errors } = validate(attributeSchema, payload);
    if (!ok) {
        authStore.errors = errors;
        return;
    }

    try {
        loading.startFormSending();
        authStore.errors = {};

        if (isEdit.value) {
            await useAttributeService.updateAttribute(Number(route.params.id), payload);
            showToast('success', ACTIONS.EDIT, 'attribute', 'tc');
        } else {
            await useAttributeService.storeAttribute(payload);
            showToast('success', ACTIONS.CREATE, 'attribute', 'tc');
        }

        router.push({ name: 'attributes' });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        } else {
            showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'attribute', 'tc', error);
        }
    } finally {
        loading.stopFormSending();
    }
};

function goBack(): void {
    router.push({ name: 'attributes' });
}

function handleTypeChange(type: string): void {
    initialValues.type = type;
    authStore.clearErrors(['type']);

    const typesWithOptions = ['dropdown', 'multiselect', 'radio', 'color'];
    if (typesWithOptions.includes(type)) {
        // Auto-add a first empty option so the user sees the options table
        if (attributeValues.value.length === 0) {
            attributeValues.value.push({ value: '', color: type === 'color' ? '000000' : undefined, sort_order: 0 });
        }
    } else {
        // Clear values when switching to a type that doesn't support options
        attributeValues.value = [];
    }
}

onMounted(async () => {
    await loadCategories();
    await loadAttribute();
    // For new attributes, auto-add a first empty option since default type (dropdown) supports values
    if (!isEdit.value && attributeValues.value.length === 0) {
        attributeValues.value.push({ value: '', color: undefined, sort_order: 0 });
    }
    isLoading.value = false;
    loading.stopPageLoading();
});
</script>

<template>
    <div>
        <!-- Page Header -->
        <FormHeader
            :title="isEdit ? t('common.titles.edit', { entity: t('entity.attribute') }) : t('common.titles.add', { entity: t('entity.attribute') })"
            :description="t('attribute.form.subtitle')"
            :icon="isEdit ? 'pi pi-pencil' : 'pi pi-plus-circle'"
            iconColor="#F59E0B"
            class="mb-6"
        >
            <template #actions>
                <Button :label="t('common.labels.cancel')" icon="pi pi-times" severity="secondary" outlined @click="goBack" :disabled="loading.isFormSending" />
                <Button
                    :label="isEdit ? t('common.labels.edit_entity', { entity: t('entity.attribute') }) : t('common.labels.create_entity', { entity: t('entity.attribute') })"
                    :icon="isEdit ? 'pi pi-pencil' : 'pi pi-plus'"
                    type="submit"
                    form="attributeForm"
                    :loading="loading.isFormSending"
                />
            </template>
        </FormHeader>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- LEFT COLUMN -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Basic Information Card -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                    <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                        <Skeleton width="1rem" height="1rem" shape="circle" />
                        <Skeleton width="8rem" height="0.85rem" />
                    </div>
                    <div class="p-5">
                        <!-- Name input -->
                        <div class="flex flex-col gap-1.5 mb-5">
                            <Skeleton width="5rem" height="0.6rem" />
                            <Skeleton width="100%" height="2.75rem" borderRadius="8px" />
                        </div>
                        <!-- Active toggle -->
                        <div class="flex items-center gap-3">
                            <Skeleton width="2.5rem" height="1.25rem" borderRadius="12px" />
                            <Skeleton width="3rem" height="0.75rem" />
                        </div>
                    </div>
                </div>

                <!-- Type & Logic Card -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                    <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                        <Skeleton width="1rem" height="1rem" shape="circle" />
                        <Skeleton width="7rem" height="0.85rem" />
                    </div>
                    <div class="p-5">
                        <!-- Type label -->
                        <Skeleton width="5.5rem" height="0.6rem" class="mb-3" />
                        <!-- Type cards grid -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div v-for="i in 8" :key="i" class="border-2 border-surface-200 dark:border-surface-700 rounded-3xl p-4 flex flex-col items-center gap-2">
                                <Skeleton width="2.5rem" height="2.5rem" borderRadius="8px" />
                                <Skeleton :width="(3 + Math.random() * 3).toFixed(0) + 'rem'" height="0.5rem" />
                            </div>
                        </div>
                        <!-- Options section -->
                        <div class="flex items-center justify-between mb-3 mt-4">
                            <Skeleton width="6rem" height="0.6rem" />
                            <Skeleton width="6rem" height="1.75rem" borderRadius="6px" />
                        </div>
                        <div class="border border-dashed border-surface-200 dark:border-surface-700 rounded-3xl py-6 flex flex-col items-center gap-2">
                            <Skeleton width="2rem" height="2rem" shape="circle" />
                            <Skeleton width="10rem" height="0.7rem" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="flex flex-col gap-6">
                <!-- Assign to Categories Card -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                    <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                        <Skeleton width="1rem" height="1rem" shape="circle" />
                        <Skeleton width="8rem" height="0.85rem" />
                    </div>
                    <div class="p-5">
                        <!-- Search input -->
                        <Skeleton width="100%" height="2.75rem" borderRadius="24px" class="mb-3" />
                        <!-- Tree rows -->
                        <div class="flex flex-col gap-1">
                            <div v-for="i in 6" :key="i" class="flex items-center gap-2 py-2.5" :style="{ paddingLeft: (i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0) + 'rem' }">
                                <Skeleton width="1rem" height="1rem" borderRadius="3px" />
                                <Skeleton width="0.85rem" height="0.85rem" shape="circle" />
                                <Skeleton :width="(4 + Math.random() * 5).toFixed(0) + 'rem'" height="0.7rem" />
                            </div>
                        </div>
                    </div>
                    <!-- Footer -->
                    <div class="flex items-center justify-between bg-surface-50 dark:bg-surface-900 px-5 py-3 border-t border-surface-200 dark:border-surface-700">
                        <Skeleton width="5rem" height="1.5rem" borderRadius="6px" />
                        <Skeleton width="5rem" height="1.5rem" borderRadius="6px" />
                    </div>
                </div>

                <!-- Info Box -->
                <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-3xl p-6">
                    <div class="flex items-start gap-3">
                        <Skeleton width="2rem" height="2rem" borderRadius="8px" />
                        <div class="flex-1 flex flex-col gap-2">
                            <Skeleton width="7rem" height="0.75rem" />
                            <Skeleton width="100%" height="0.6rem" />
                            <Skeleton width="80%" height="0.6rem" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form Content -->
        <PForm v-else :key="formKey" id="attributeForm" v-slot="$form" :initialValues="initialValues" :resolver="resolver" :validateOnBlur="true" @submit="onFormSubmit">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- LEFT COLUMN -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <!-- Basic Information -->
                    <CardSection :title="t('attribute.form.basic_info')" icon="pi pi-info-circle">
                        <FormField v-slot="$field" name="name" class="flex flex-col gap-1.5">
                            <label for="attr_name" class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.display_name') }} *</label>
                            <IconField>
                                <InputIcon class="pi pi-tag" />
                                <InputText
                                    id="attr_name"
                                    name="name"
                                    :disabled="loading.isFormSending"
                                    class="w-full"
                                    :placeholder="t('attribute.form.name_placeholder')"
                                    maxlength="150"
                                    v-bind="$field"
                                    @input="() => authStore.clearErrors(['name'])"
                                    autofocus
                                />
                            </IconField>
                            <Message v-if="$field.invalid || authStore.errors.name" severity="error" size="small">
                                {{ $field.error?.message ? t($field.error.message) : authStore.errors?.name?.[0] }}
                            </Message>
                        </FormField>

                        <FormField v-slot="$field" name="active" class="flex flex-col gap-2 mt-5">
                            <div class="flex items-center gap-3">
                                <ToggleSwitch id="active" name="active" :disabled="loading.isFormSending" v-bind="$field" @change="() => authStore.clearErrors(['active'])" />
                                <label for="active" class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('attribute.form.active') }}</label>
                            </div>
                        </FormField>
                    </CardSection>

                    <!-- Type & Logic -->
                    <CardSection :title="t('attribute.form.type_and_logic')" icon="pi pi-cog">
                        <!-- Attribute Type Cards -->
                        <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-3 block">{{ t('attribute.form.attribute_type') }} *</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div
                                v-for="attrType in attributeTypeKeys"
                                :key="attrType"
                                class="cursor-pointer border-2 rounded-3xl p-4 text-center transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2"
                                :class="[initialValues.type === attrType ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600']"
                                @click="handleTypeChange(attrType)"
                            >
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: ATTRIBUTE_TYPES[attrType]?.color + '15' }">
                                    <i :class="ATTRIBUTE_TYPES[attrType]?.icon" class="text-lg" :style="{ color: ATTRIBUTE_TYPES[attrType]?.color }"></i>
                                </div>
                                <span class="text-[11px] font-bold uppercase tracking-wider" :class="initialValues.type === attrType ? 'text-primary' : 'text-surface-500'">
                                    {{ t(ATTRIBUTE_TYPES[attrType]?.label) }}
                                </span>
                            </div>
                        </div>
                        <Message v-if="authStore.errors?.type?.[0]" severity="error" size="small">{{ t(authStore.errors?.type?.[0]) }}</Message>

                        <!-- Attribute Options -->
                        <div class="mt-4">
                            <div class="flex items-center justify-between mb-3">
                                <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.attribute_options') }}</label>
                                <Button :label="t('attribute.form.add_new_option')" icon="pi pi-plus" size="small" text @click="addValue" :disabled="loading.isFormSending || !supportsValues" />
                            </div>

                            <template v-if="supportsValues">
                                <!-- Options Table -->
                                <div v-if="attributeValues.length === 0" class="text-center py-6 border border-dashed border-surface-200 dark:border-surface-700 rounded-3xl">
                                    <i class="pi pi-list text-2xl text-surface-300 mb-2"></i>
                                    <p class="text-sm text-surface-400">{{ t('attribute.form.no_values') }}</p>
                                </div>
                                <DataTable v-else :value="attributeValues" size="small" class="rounded-3xl overflow-hidden">
                                    <Column header="#" style="width: 50px">
                                        <template #body="{ index }">
                                            <span class="text-surface-400 font-medium">{{ index + 1 }}</span>
                                        </template>
                                    </Column>
                                    <Column :header="t('attribute.form.option_label')" style="min-width: 200px">
                                        <template #body="{ data, index }">
                                            <InputText v-model="data.value" :placeholder="t('attribute.form.value_placeholder')" class="w-full" size="small" :disabled="loading.isFormSending" @input="() => authStore.clearErrors(['values', `values.${index}.value`])" />
                                        </template>
                                    </Column>
                                    <Column v-if="isColor" :header="t('attribute.form.color_value')" style="width: 140px">
                                        <template #body="{ data }">
                                            <div class="flex items-center gap-2">
                                                <ColorPicker v-model="data.color" format="hex" :disabled="loading.isFormSending" />
                                                <InputText v-model="data.color" class="w-full" size="small" maxlength="6" placeholder="FF0000" :disabled="loading.isFormSending" />
                                            </div>
                                        </template>
                                    </Column>
                                    <Column :header="t('attribute.form.actions_col')" style="width: 80px">
                                        <template #body="{ index }">
                                            <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="removeValue(index)" :disabled="loading.isFormSending" />
                                        </template>
                                    </Column>
                                </DataTable>
                                <Message v-if="authStore.errors?.['values']?.[0] || authStore.errors?.['values.0.value']?.[0]" severity="error" size="small" class="mt-2">
                                    {{ t(authStore.errors?.['values']?.[0] || authStore.errors?.['values.0.value']?.[0]) }}
                                </Message>
                            </template>
                            <div v-else-if="isBoolean" class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.yes_label') }}</label>
                                    <InputText v-model="booleanLabels.yes" :placeholder="t('attribute.form.yes_placeholder')" class="w-full" :disabled="loading.isFormSending" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('attribute.form.no_label') }}</label>
                                    <InputText v-model="booleanLabels.no" :placeholder="t('attribute.form.no_placeholder')" class="w-full" :disabled="loading.isFormSending" />
                                </div>
                            </div>
                            <div v-else class="text-center py-6 border border-dashed border-surface-200 dark:border-surface-700 rounded-3xl">
                                <i class="pi pi-info-circle text-2xl text-surface-300 mb-2"></i>
                                <p class="text-sm text-surface-400">{{ t('attribute.form.no_options_needed') }}</p>
                            </div>
                        </div>
                    </CardSection>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="flex flex-col gap-6">
                    <!-- Assign to Categories -->
                    <CardSection :title="t('attribute.form.assign_categories')" icon="pi pi-sitemap">
                        <template #header-actions>
                            <Tag v-if="selectedCategoryCount > 0" :value="selectedCategoryCount + ' ' + t('attribute.form.selected')" severity="info" class="!text-[10px] !py-0.5 !px-2" />
                        </template>
                        <IconField class="mb-3">
                            <InputIcon>
                                <i class="pi pi-search text-surface-400" />
                            </InputIcon>
                            <InputText v-model="categorySearch" :placeholder="t('attribute.form.search_categories')" class="w-full !bg-surface-50 dark:!bg-surface-800/60 !border-surface-200 dark:!border-surface-700 !rounded-3xl" />
                            <InputIcon v-if="categorySearch" class="cursor-pointer" @click="categorySearch = ''">
                                <i class="pi pi-times text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors" />
                            </InputIcon>
                        </IconField>
                        <div class="max-h-[400px] overflow-y-auto">
                            <Tree
                                v-model:selectionKeys="selectedCategoryKeys"
                                v-model:expandedKeys="expandedKeys"
                                :value="treeSelectNodes"
                                selectionMode="checkbox"
                                class="w-full !bg-transparent !border-none !p-0"
                                :metaKeySelection="false"
                                :pt="{ nodeContent: { class: 'py-2.5 gap-2' } }"
                                @node-select="() => authStore.clearErrors(['category_ids'])"
                            />
                        </div>
                        <Message v-if="authStore.errors?.['category_ids']?.[0]" severity="error" size="small" class="mt-2">
                            {{ t(authStore.errors?.['category_ids']?.[0]) }}
                        </Message>
                        <template #footer>
                            <div class="flex items-center justify-between">
                                <Button
                                    :label="allSelected ? t('attribute.form.deselect_all') : t('attribute.form.select_all')"
                                    :icon="allSelected ? 'pi pi-times' : 'pi pi-check-square'"
                                    size="small"
                                    text
                                    severity="secondary"
                                    @click="toggleSelectAll"
                                />
                                <Button :label="allExpanded ? t('attribute.form.collapse_all') : t('attribute.form.expand_all')" :icon="allExpanded ? 'pi pi-minus' : 'pi pi-plus'" size="small" text severity="secondary" @click="toggleExpandAll" />
                            </div>
                        </template>
                    </CardSection>

                    <!-- Mapping Logic Info -->
                    <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-3xl p-6">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="pi pi-info-circle text-white text-sm"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">{{ t('attribute.form.mapping_logic') }}</h3>
                                <p class="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{{ t('attribute.form.mapping_logic_desc') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PForm>
    </div>
</template>
