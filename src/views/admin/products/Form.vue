<script setup lang="ts">
import { useProductService } from '@/services/useProductService';
import { useCategoryService } from '@/services/useCategoryService';
import { useAttributeService } from '@/services/useAttributeService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { productSchema } from '@/validations/product';
import type { ProductData, ProductVariantData } from '@/types/product';
import type { CategoryData } from '@/types/category';
import type { AttributeData, AttributeValueData } from '@/types/attribute';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, defineAsyncComponent, markRaw, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDialog } from 'primevue/usedialog';
import FormHeader from '@/components/FormHeader.vue';
import CardSection from '@/components/CardSection.vue';
import { Form as PForm } from '@primevue/forms';

const attributeFormComponent = defineAsyncComponent(() => import('@/views/admin/attributes/inline-form/Form.vue'));
const categoryFormComponent = defineAsyncComponent(() => import('@/views/admin/categories/partials/Form.vue'));

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const dialog = useDialog();
const { showToast } = useShowToast();

const isEdit = computed<boolean>(() => !!route.params.id);
const isLoading = ref<boolean>(true);
const formKey = ref<number>(0);

// All available data
const allCategories = ref<CategoryData[]>([]);
const allAttributes = ref<AttributeData[]>([]);

// Form initial values (used by PrimeVue Form resolver)
const initialValues = reactive({
    name: '',
    sku_prefix: '',
    low_stock_threshold: 10,
    active: true
});

// Fields managed outside the PrimeVue Form (separately tracked)
const selectedCategoryId = ref<number | null>(null);
const stockType = ref<'single' | 'variant'>('single');
const purchasePrice = ref<number | null>(null);
const salePrice = ref<number | null>(null);
const totalStock = ref<number>(0);
const selectedAttributeIds = ref<number[]>([]);
const selectedValueIds = reactive<Record<number, number[]>>({});
const customAttributeValues = reactive<Record<number, any>>({});
const variants = ref<ProductVariantData[]>([]);
const variantsOutOfSync = ref<boolean>(false);
const productImage = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const addAttrPopover = ref();
const existingImageUrl = ref<string | null>(null);
const removeFileFlag = ref<boolean>(false);
const pendingAttributeId = ref<number | null>(null);
const categoryExpandedKeys = ref<Record<string, boolean>>({});

// Variant tree state
const groupByAttributeIndex = ref<number>(0);
const expandedKeys = ref<Record<string, boolean>>({});

// Bulk action state per group
const bulkPrices = reactive<Record<string, number | null>>({});
const bulkStocks = reactive<Record<string, number | null>>({});

// Resolver for PrimeVue Form
const resolver = zodResolver(productSchema);

// Category tree
const categoryNodes = computed(() => {
    const allItems = allCategories.value;
    const buildTree = (items: CategoryData[], parentId: number | null = null): any[] => {
        return items
            .filter((item: CategoryData) => item.parent_id === parentId)
            .map((item: CategoryData) => {
                const children = buildTree(items, item.id);
                return {
                    key: item.id,
                    label: item.name,
                    data: item.id,
                    icon: item.icon || 'pi pi-folder',
                    children: children.length > 0 ? children : undefined
                };
            });
    };
    return buildTree(allItems);
});

// Resolve numeric category ID from PrimeVue TreeSelect's object format { "key": true }
const resolvedCategoryId = computed<number | null>(() => {
    const val = selectedCategoryId.value;
    if (!val) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'object') {
        const keys = Object.keys(val as Record<string, boolean>);
        return keys.length > 0 ? Number(keys[0]) : null;
    }
    return Number(val) || null;
});

// Whether the attribute type has predefined selectable values
function hasValues(type: string): boolean {
    return ['dropdown', 'multiselect', 'color', 'radio'].includes(type);
}

// Available attributes filtered by selected category
const availableAttributes = computed(() => {
    if (!resolvedCategoryId.value) return allAttributes.value;
    return allAttributes.value.filter((attr) => attr.categories?.some((cat: any) => cat.id === resolvedCategoryId.value) || selectedAttributeIds.value.includes(attr.id));
});

// Selected attributes objects
const selectedAttributes = computed(() => {
    return allAttributes.value.filter((attr) => selectedAttributeIds.value.includes(attr.id));
});

// Groupable attributes for the "Group By" dropdown
const groupByOptions = computed(() => {
    return selectedAttributes.value.map((attr, index) => ({
        label: attr.name,
        value: index
    }));
});

// Margin calculated from prices
const margin = computed(() => {
    if (!purchasePrice.value || !salePrice.value || salePrice.value === 0) return null;
    return (((salePrice.value - purchasePrice.value) / salePrice.value) * 100).toFixed(1);
});

// TreeNode structure for PrimeVue TreeTable
interface TreeNode {
    key: string;
    data: any;
    children?: TreeNode[];
}

const treeNodes = computed<TreeNode[]>(() => {
    if (variants.value.length === 0 || selectedAttributes.value.length === 0) return [];

    const groupAttr = selectedAttributes.value[groupByAttributeIndex.value];
    if (!groupAttr) return [];

    const groups: Record<string, TreeNode> = {};

    for (const variant of variants.value) {
        const detail = variant.attribute_details?.find((d) => d.attribute_id === groupAttr.id);
        if (!detail) continue;

        const parentKey = `${groupAttr.id}-${detail.value_id}`;
        if (!groups[parentKey]) {
            groups[parentKey] = {
                key: parentKey,
                data: {
                    isGroup: true,
                    attributeName: groupAttr.name,
                    attributeValue: detail.value,
                    count: 0
                },
                children: []
            };
        }
        const childKey = `${parentKey}-${variant.attribute_values.join('-')}`;
        groups[parentKey].children!.push({
            key: childKey,
            data: {
                isGroup: false,
                variant
            }
        });
        groups[parentKey].data.count++;
    }

    return Object.values(groups);
});

// Watch category change → auto-populate attributes
watch(resolvedCategoryId, (newCatId, oldCatId) => {
    if (isEdit.value && !oldCatId) return;
    if (!newCatId) return;

    const categoryAttrs = allAttributes.value.filter((attr) => attr.categories?.some((cat: any) => cat.id === newCatId));

    selectedAttributeIds.value = categoryAttrs.map((a) => a.id);
    for (const attr of categoryAttrs) {
        selectedValueIds[attr.id] = [];
    }

    variants.value = [];
});

// Load categories
async function loadCategories(): Promise<void> {
    try {
        const data = await useCategoryService.getAllCategories();
        allCategories.value = data.categories || [];
        nextTick(() => expandAllCategoryNodes());
    } catch (e) {
        console.error('Failed to load categories');
    }
}

// Expand all category tree nodes by default
function expandAllCategoryNodes(): void {
    const keys: Record<string, boolean> = {};
    const walk = (nodes: any[]) => {
        for (const node of nodes) {
            keys[node.key] = true;
            if (node.children) walk(node.children);
        }
    };
    walk(categoryNodes.value);
    categoryExpandedKeys.value = keys;
}

// Open category creation dialog
function openCreateCategory(parentId: number | null = null): void {
    authStore.errors = {};
    dialog.open(categoryFormComponent, {
        props: {
            style: { width: '35vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: {
                name: null,
                parent_id: parentId,
                slug: null,
                description: null,
                icon: null,
                icon_color: '#8B5CF6',
                active: true,
                publish: true
            },
            allCategories: allCategories.value,
            action: ACTIONS.CREATE,
            headerProps: computed(() => ({
                title: t('category.form.title_new'),
                description: t('category.form.subtitle'),
                icon: 'pi pi-plus-circle',
                iconColor: '#8B5CF6'
            }))
        },
        onClose: (result) => {
            if (result?.data?.record?.id) {
                const newCat: CategoryData = result.data.record;
                allCategories.value.push(newCat);
                // Auto-select the new category
                selectedCategoryId.value = { [newCat.id]: true } as any;
                nextTick(() => expandAllCategoryNodes());
                showToast('success', ACTIONS.CREATE, 'category', 'tc');
            }
        }
    });
}

// Load attributes
async function loadAttributes(): Promise<void> {
    try {
        const data = await useAttributeService.getAttributes({
            rows: 100,
            page: 1,
            sortField: 'name',
            sortOrder: '1'
        });
        allAttributes.value = data.attributes || [];
    } catch (e) {
        console.error('Failed to load attributes');
    }
}

// Load product for edit mode
async function loadProduct(): Promise<void> {
    if (!isEdit.value) return;
    try {
        loading.startDataLoading();
        const response = await useProductService.getProduct(Number(route.params.id));
        const product: ProductData = response.data;

        initialValues.name = product.name;
        initialValues.sku_prefix = product.sku_prefix || '';
        initialValues.low_stock_threshold = product.low_stock_threshold;
        initialValues.active = product.active;

        selectedCategoryId.value = product.category?.id ? ({ [product.category.id]: true } as any) : null;
        stockType.value = product.stock_type;
        purchasePrice.value = product.purchase_price !== null ? Number(product.purchase_price) : null;
        salePrice.value = product.sale_price !== null ? Number(product.sale_price) : null;
        totalStock.value = product.total_stock;
        selectedAttributeIds.value = product.attributes?.map((a) => a.id) || [];

        // Populate selected value IDs from the stored pivot data
        const selectedSet = new Set<number>((product.selected_value_ids || []).map(Number));
        for (const attr of product.attributes || []) {
            const attrValueIds = (attr.values || []).map((v: any) => v.id);
            selectedValueIds[attr.id] = attrValueIds.filter((id: number) => selectedSet.has(id));

            // Restore custom attribute values for free-form types
            if (!hasValues(attr.type)) {
                const selectedVal = (attr.values || []).find((v: any) => selectedSet.has(v.id));
                if (selectedVal) {
                    if (attr.type === 'date') {
                        customAttributeValues[attr.id] = new Date(selectedVal.value);
                    } else if (attr.type === 'numeric') {
                        customAttributeValues[attr.id] = Number(selectedVal.value);
                    } else if (attr.type === 'boolean') {
                        customAttributeValues[attr.id] = selectedVal.value === 'true' || selectedVal.value === '1';
                    } else {
                        customAttributeValues[attr.id] = selectedVal.value;
                    }
                }
            }
        }

        // Reconstruct attribute_details for each variant from loaded attributes
        // The API returns attribute_values (IDs) but not attribute_details (needed for TreeTable display)
        const loadedVariants = product.variants || [];
        const productAttrs = product.attributes || [];
        variants.value = loadedVariants.map((v: ProductVariantData) => {
            if (!v.attribute_details || v.attribute_details.length === 0) {
                const details: { attribute_id: number; attribute_name: string; value_id: number; value: string }[] = [];
                for (const valueId of v.attribute_values) {
                    for (const attr of productAttrs) {
                        const foundValue = (attr.values || []).find((val: any) => val.id === valueId);
                        if (foundValue) {
                            details.push({
                                attribute_id: attr.id,
                                attribute_name: attr.name,
                                value_id: foundValue.id,
                                value: foundValue.value
                            });
                            break;
                        }
                    }
                }
                return { ...v, attribute_details: details };
            }
            return v;
        });

        if (product.image?.url) {
            existingImageUrl.value = product.image.url;
        }

        formKey.value++;
        // Auto-expand variant tree groups after loading
        if (variants.value.length > 0) {
            nextTick(() => expandAll());
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('error', ACTIONS.EDIT, 'product', 'tc');
    } finally {
        loading.stopDataLoading();
    }
}

// Image handling
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function onImageSelect(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            authStore.errors = { ...authStore.errors, file: [t('product.form.file_too_large', { max: '2MB' })] };
            event.target.value = '';
            return;
        }
        authStore.errors = { ...authStore.errors, file: null };
        productImage.value = file;
        removeFileFlag.value = false;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
}

function removeImage(): void {
    productImage.value = null;
    imagePreview.value = null;
    if (existingImageUrl.value) {
        removeFileFlag.value = true;
    }
    existingImageUrl.value = null;
}

// Add attribute
function addAttribute(attrId: number): void {
    if (!selectedAttributeIds.value.includes(attrId)) {
        selectedAttributeIds.value.push(attrId);
        selectedValueIds[attrId] = [];
    }
}

// Remove attribute
function removeAttribute(attrId: number): void {
    selectedAttributeIds.value = selectedAttributeIds.value.filter((id) => id !== attrId);
    delete selectedValueIds[attrId];
    variants.value = [];
}

// Toggle a single value checkbox
function toggleValue(attrId: number, valueId: number): void {
    if (!selectedValueIds[attrId]) {
        selectedValueIds[attrId] = [];
    }
    const idx = selectedValueIds[attrId].indexOf(valueId);
    if (idx > -1) {
        selectedValueIds[attrId].splice(idx, 1);
    } else {
        selectedValueIds[attrId].push(valueId);
    }
    // Flag that the matrix is out of sync if variants already exist
    if (variants.value.length > 0) {
        variantsOutOfSync.value = true;
    }
}

function isValueSelected(attrId: number, valueId: number): boolean {
    return selectedValueIds[attrId]?.includes(valueId) ?? false;
}

// Open the attribute creation dialog inline
function openCreateAttribute(): void {
    authStore.errors = {};
    dialog.open(attributeFormComponent, {
        props: {
            style: { width: '40vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: {
                name: null,
                type: null,
                active: true,
                category_ids: resolvedCategoryId.value ? [resolvedCategoryId.value] : [],
                values: []
            },
            action: ACTIONS.CREATE,
            categoryName: allCategories.value.find((c) => c.id === resolvedCategoryId.value)?.name || '',
            headerProps: computed(() => ({
                title: t('common.titles.add', { entity: t('entity.attribute') }),
                description: t('attribute.form.subtitle'),
                icon: 'pi pi-plus-circle',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result) => {
            if (result?.data?.record?.id) {
                const newAttr: AttributeData = result.data.record;
                // Add to the global attributes list
                allAttributes.value.push(newAttr);
                // Auto-select it in the product form
                addAttribute(newAttr.id);
                // Auto-check all its values
                if (newAttr.values?.length) {
                    selectedValueIds[newAttr.id] = newAttr.values.map((v: AttributeValueData) => v.id);
                }
                showToast('success', ACTIONS.CREATE, 'attribute', 'tc');
            }
        }
    });
}

// Generate variant matrix using only selected values
async function generateVariantMatrix(): Promise<void> {
    if (selectedAttributeIds.value.length === 0) return;

    if (isEdit.value) {
        try {
            // Collect all selected value IDs across all attributes
            const allSelectedValueIds = selectedAttributeIds.value.flatMap((attrId: number) => selectedValueIds[attrId] || []);
            const response = await useProductService.generateVariants(Number(route.params.id), selectedAttributeIds.value, allSelectedValueIds);
            variants.value = response.variants;
        } catch (e) {
            console.error('Error generating variants');
        }
    } else {
        const attrs = selectedAttributes.value;
        const valueSets = attrs
            .map((attr) => {
                const checkedIds = selectedValueIds[attr.id] || [];
                return (attr.values || [])
                    .filter((v: AttributeValueData) => checkedIds.includes(v.id))
                    .map((v: AttributeValueData) => ({
                        attribute_id: attr.id,
                        attribute_name: attr.name,
                        value_id: v.id,
                        value: v.value
                    }));
            })
            .filter((set) => set.length > 0);

        if (valueSets.length === 0) return;

        let combinations: any[][] = [[]];
        for (const valueSet of valueSets) {
            const temp: any[][] = [];
            for (const existing of combinations) {
                for (const item of valueSet) {
                    temp.push([...existing, item]);
                }
            }
            combinations = temp;
        }

        // Build a lookup of existing variants by their sorted attribute_values key
        const existingMap = new Map<string, ProductVariantData>();
        for (const v of variants.value) {
            const key = [...v.attribute_values].sort().join('-');
            existingMap.set(key, v);
        }

        variants.value = combinations.map((combo) => {
            const newKey = combo
                .map((c: any) => c.value_id)
                .sort()
                .join('-');
            const existing = existingMap.get(newKey);
            return {
                attribute_values: combo.map((c: any) => c.value_id).sort(),
                attribute_details: combo,
                sku:
                    existing?.sku ||
                    (initialValues.sku_prefix ? initialValues.sku_prefix + '-' : '') +
                        combo
                            .map((c: any) => c.value)
                            .join('-')
                            .toUpperCase()
                            .replace(/ /g, '-'),
                purchase_price: existing?.purchase_price ?? (purchasePrice.value || 0),
                sale_price: existing?.sale_price ?? (salePrice.value || 0),
                stock: existing?.stock ?? 0
            };
        });

        groupByAttributeIndex.value = 0;
        expandedKeys.value = {};
        variantsOutOfSync.value = false;
        // Auto-expand all groups after computed recalculates
        nextTick(() => expandAll());
    }
}

// Get child label (non-grouping attribute details)
function getChildLabel(variant: ProductVariantData): string {
    if (!variant.attribute_details) return '';
    const groupAttr = selectedAttributes.value[groupByAttributeIndex.value];
    if (!groupAttr) return '';
    return variant.attribute_details
        .filter((d) => d.attribute_id !== groupAttr.id)
        .map((d) => `${d.attribute_name}: ${d.value}`)
        .join(', ');
}

// Get display label for a variant's attribute values
function getVariantLabel(variant: ProductVariantData): string {
    if (variant.attribute_details) {
        return variant.attribute_details.map((d) => d.value).join(' / ');
    }
    return variant.attribute_values.join(', ');
}

// Expand / Collapse
function expandAll(): void {
    const keys: Record<string, boolean> = {};
    for (const node of treeNodes.value) {
        keys[node.key] = true;
    }
    expandedKeys.value = keys;
}

function collapseAll(): void {
    expandedKeys.value = {};
}

// Bulk actions: apply bulkPrices and bulkStocks to all children in a group
function setAllForGroup(groupKey: string): void {
    const group = treeNodes.value.find((g) => g.key === groupKey);
    if (!group || !group.children) return;
    for (const child of group.children) {
        const variant = child.data.variant;
        if (!variant) continue;
        if (bulkPrices[groupKey] !== null && bulkPrices[groupKey] !== undefined) {
            variant.sale_price = bulkPrices[groupKey]!;
        }
        if (bulkStocks[groupKey] !== null && bulkStocks[groupKey] !== undefined) {
            variant.stock = bulkStocks[groupKey]!;
        }
    }
}

// Remove a variant row
function removeVariant(index: number): void {
    variants.value.splice(index, 1);
}

// Form submit
const onFormSubmit = async ({ valid, values }: any): Promise<void> => {
    if (!valid) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('sku_prefix', values.sku_prefix || '');
        formData.append('low_stock_threshold', String(initialValues.low_stock_threshold));
        formData.append('stock_type', stockType.value);
        formData.append('active', values.active ? '1' : '0');

        if (resolvedCategoryId.value) {
            formData.append('category_id', String(resolvedCategoryId.value));
        }
        formData.append('purchase_price', String(purchasePrice.value ?? 0));
        formData.append('sale_price', String(salePrice.value ?? 0));
        formData.append('total_stock', String(totalStock.value ?? 0));

        // Attributes
        selectedAttributeIds.value.forEach((id, i) => {
            formData.append(`attribute_ids[${i}]`, String(id));
        });

        // Selected attribute values
        let valIdx = 0;
        for (const attrId of selectedAttributeIds.value) {
            const valueIds = selectedValueIds[attrId] || [];
            for (const vid of valueIds) {
                formData.append(`selected_value_ids[${valIdx}]`, String(vid));
                valIdx++;
            }
        }

        // Custom attribute values (text, numeric, date, boolean)
        let customIdx = 0;
        for (const attrId of selectedAttributeIds.value) {
            if (customAttributeValues[attrId] !== undefined && customAttributeValues[attrId] !== null && customAttributeValues[attrId] !== '') {
                const val = customAttributeValues[attrId];
                formData.append(`custom_attribute_values[${customIdx}][attribute_id]`, String(attrId));
                formData.append(`custom_attribute_values[${customIdx}][value]`, val instanceof Date ? val.toISOString().split('T')[0] : String(val));
                customIdx++;
            }
        }

        // Variants
        if (stockType.value === 'variant') {
            variants.value.forEach((v, i) => {
                if (v.id) formData.append(`variants[${i}][id]`, String(v.id));
                v.attribute_values.forEach((av, j) => {
                    formData.append(`variants[${i}][attribute_values][${j}]`, String(av));
                });
                if (v.sku) formData.append(`variants[${i}][sku]`, v.sku);
                formData.append(`variants[${i}][purchase_price]`, String(v.purchase_price));
                formData.append(`variants[${i}][sale_price]`, String(v.sale_price));
                formData.append(`variants[${i}][stock]`, String(v.stock));
            });
        }

        // File
        if (productImage.value) {
            formData.append('file', productImage.value);
        } else if (removeFileFlag.value) {
            formData.append('remove_file', '1');
        }

        if (isEdit.value) {
            await useProductService.updateProduct(Number(route.params.id), formData);
            showToast('success', ACTIONS.EDIT, 'product', 'tc');
        } else {
            await useProductService.storeProduct(formData);
            showToast('success', ACTIONS.CREATE, 'product', 'tc');
        }

        router.push({ name: 'products' });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        } else {
            showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'product', 'tc');
        }
    } finally {
        loading.stopFormSending();
    }
};

function goBack(): void {
    router.push({ name: 'products' });
}

onMounted(async () => {
    await Promise.all([loadCategories(), loadAttributes()]);
    await loadProduct();
    isLoading.value = false;
    loading.stopPageLoading();
});
</script>

<template>
    <div>
        <!-- Page Header -->
        <FormHeader
            :title="isEdit ? t('common.titles.edit', { entity: t('entity.product') }) : t('common.titles.add', { entity: t('entity.product') })"
            :description="t('product.form.subtitle')"
            :icon="isEdit ? 'pi pi-pencil' : 'pi pi-plus-circle'"
            iconColor="#8B5CF6"
            class="mb-6"
        >
            <template #actions>
                <Button :label="t('common.labels.cancel')" icon="pi pi-times" severity="secondary" outlined @click="goBack" :disabled="loading.isFormSending" />
                <Button
                    :label="isEdit ? t('common.labels.edit_entity', { entity: t('entity.product') }) : t('common.labels.create_entity', { entity: t('entity.product') })"
                    :icon="isEdit ? 'pi pi-pencil' : 'pi pi-plus'"
                    type="submit"
                    form="productForm"
                    :loading="loading.isFormSending"
                />
            </template>
        </FormHeader>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="flex flex-col gap-6">
            <!-- TOP ROW: Product Info + Image side by side -->
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Product Information Card -->
                <div class="flex-1 border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                    <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                        <Skeleton width="16px" height="16px" shape="circle" />
                        <Skeleton width="140px" height="14px" />
                    </div>
                    <div class="p-5 flex flex-col gap-6">
                        <!-- Name field (FloatLabel) -->
                        <Skeleton height="48px" class="w-full" />
                        <!-- Category field (FloatLabel) -->
                        <Skeleton height="48px" class="w-full" />
                        <!-- 2-col: SKU + Low stock (FloatLabel) -->
                        <div class="grid grid-cols-2 gap-4">
                            <Skeleton height="48px" class="w-full" />
                            <Skeleton height="48px" class="w-full" />
                        </div>
                        <!-- Toggle switch -->
                        <div class="flex items-center gap-3">
                            <Skeleton width="40px" height="22px" borderRadius="11px" />
                            <Skeleton width="40px" height="14px" />
                        </div>
                    </div>
                </div>

                <!-- Image Card -->
                <div class="lg:w-72 flex-shrink-0 border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                    <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                        <Skeleton width="16px" height="16px" shape="circle" />
                        <Skeleton width="110px" height="14px" />
                    </div>
                    <div class="p-5 flex flex-col items-center gap-4">
                        <Skeleton class="w-full aspect-square" borderRadius="12px" />
                    </div>
                </div>
            </div>

            <!-- Attributes Card (full-width) -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                    <Skeleton width="16px" height="16px" shape="circle" />
                    <Skeleton width="85px" height="14px" />
                </div>
                <div class="p-5 flex flex-col items-center justify-center py-12 gap-4">
                    <Skeleton width="64px" height="64px" shape="circle" />
                    <Skeleton width="260px" height="14px" />
                </div>
            </div>

            <!-- Price & Stock Card (full-width) -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden">
                <div class="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700">
                    <Skeleton width="16px" height="16px" shape="circle" />
                    <Skeleton width="100px" height="14px" />
                </div>
                <div class="p-5 flex flex-col gap-6">
                    <!-- 2-col: Purchase + Sale price (FloatLabel) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton height="48px" class="w-full" />
                        <Skeleton height="48px" class="w-full" />
                    </div>
                    <!-- Stock management label -->
                    <div class="flex flex-col gap-2">
                        <Skeleton width="125px" height="10px" />
                        <!-- 3 stock cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="border-2 border-surface-200 dark:border-surface-700 rounded-3xl px-4 py-4 flex items-center gap-3">
                                <Skeleton width="24px" height="24px" shape="circle" />
                                <div class="flex-1 flex flex-col gap-1.5">
                                    <Skeleton width="80px" height="12px" />
                                    <Skeleton width="140px" height="10px" />
                                </div>
                                <Skeleton width="18px" height="18px" shape="circle" />
                            </div>
                            <div class="border-2 border-surface-200 dark:border-surface-700 rounded-3xl px-4 py-4 flex items-center gap-3">
                                <Skeleton width="24px" height="24px" shape="circle" />
                                <div class="flex-1 flex flex-col gap-1.5">
                                    <Skeleton width="70px" height="12px" />
                                    <Skeleton width="150px" height="10px" />
                                </div>
                                <Skeleton width="18px" height="18px" shape="circle" />
                            </div>
                            <div class="border-2 border-surface-200 dark:border-surface-700 rounded-3xl px-4 py-4 flex flex-col gap-2">
                                <div class="flex items-center gap-2">
                                    <Skeleton width="14px" height="14px" shape="circle" />
                                    <Skeleton width="70px" height="10px" />
                                </div>
                                <Skeleton height="42px" class="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form Content -->
        <PForm v-else :key="formKey" id="productForm" v-slot="$form" :initialValues="initialValues" :resolver="resolver" :validateOnBlur="true" @submit="onFormSubmit">
            <div class="flex flex-col gap-6">
                <!-- TOP ROW: Product Info + Image side by side -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Product Information -->
                    <CardSection :title="t('product.form.product_info')" icon="pi pi-info-circle" class="flex-1">
                        <div class="flex flex-col gap-6">
                            <FormField v-slot="$field" name="name" class="flex flex-col gap-1.5">
                                <FloatLabel variant="on">
                                    <IconField>
                                        <InputIcon class="pi pi-box" />
                                        <InputText id="product_name" name="name" :disabled="loading.isFormSending" class="w-full" maxlength="200" v-bind="$field" @input="() => authStore.clearErrors(['name'])" autofocus />
                                    </IconField>
                                    <label for="product_name">{{ t('product.form.name') }}</label>
                                </FloatLabel>
                                <Message v-if="$field.invalid || authStore.errors.name" severity="error" size="small">
                                    {{ $field.error?.message ? t($field.error.message) : authStore.errors?.name?.[0] }}
                                </Message>
                            </FormField>

                            <div class="flex flex-col gap-1.5">
                                <FloatLabel variant="on">
                                    <TreeSelect id="product_category" v-model="selectedCategoryId" :options="categoryNodes" :expandedKeys="categoryExpandedKeys" class="w-full" :disabled="loading.isFormSending" filter showClear>
                                        <template #footer>
                                            <div
                                                class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg mx-2 mb-2 py-2.5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200"
                                                @click="openCreateCategory(resolvedCategoryId)"
                                            >
                                                <i class="pi pi-plus text-surface-400 text-xs"></i>
                                                <span class="text-xs text-surface-400">{{ t('product.form.create_category') }}</span>
                                            </div>
                                        </template>
                                    </TreeSelect>
                                    <label for="product_category">{{ t('product.form.category') }}</label>
                                </FloatLabel>
                                <Message v-if="authStore.errors.category_id" severity="error" size="small">{{ authStore.errors?.category_id?.[0] }}</Message>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <FormField v-slot="$field" name="sku_prefix" class="flex flex-col gap-1.5">
                                    <FloatLabel variant="on">
                                        <IconField>
                                            <InputIcon class="pi pi-hashtag" />
                                            <InputText id="sku_prefix" name="sku_prefix" :disabled="loading.isFormSending" class="w-full" maxlength="50" v-bind="$field" />
                                        </IconField>
                                        <label for="sku_prefix">{{ t('product.form.sku_prefix') }}</label>
                                    </FloatLabel>
                                </FormField>

                                <FormField v-slot="$field" name="low_stock_threshold" class="flex flex-col gap-1.5">
                                    <FloatLabel variant="on">
                                        <IconField>
                                            <InputIcon class="pi pi-exclamation-triangle" />
                                            <InputNumber id="low_stock" v-model="initialValues.low_stock_threshold" :disabled="loading.isFormSending" class="w-full" :min="0" />
                                        </IconField>
                                        <label for="low_stock">{{ t('product.form.low_stock_threshold') }}</label>
                                    </FloatLabel>
                                </FormField>
                            </div>

                            <FormField v-slot="$field" name="active" class="flex flex-col gap-2">
                                <div class="flex items-center gap-3">
                                    <ToggleSwitch id="active" name="active" :disabled="loading.isFormSending" v-bind="$field" />
                                    <label for="active" class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('common.labels.active') }}</label>
                                </div>
                            </FormField>
                        </div>
                    </CardSection>

                    <!-- RIGHT COLUMN: Image (inside top row) -->
                    <div class="lg:w-72 flex-shrink-0">
                        <CardSection :title="t('product.form.product_image')" icon="pi pi-image">
                            <div class="flex flex-col items-center gap-4">
                                <div
                                    class="w-full aspect-square rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-700 flex items-center justify-center overflow-hidden bg-surface-50 dark:bg-surface-800/60 cursor-pointer hover:border-primary/50 transition-colors"
                                    @click="($refs.imageInput as HTMLInputElement)?.click()"
                                >
                                    <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover rounded-3xl" />
                                    <img v-else-if="existingImageUrl" :src="existingImageUrl" class="w-full h-full object-cover rounded-3xl" />
                                    <div v-else class="text-center">
                                        <i class="pi pi-cloud-upload text-3xl text-surface-300 mb-2"></i>
                                        <p class="text-sm text-surface-400">{{ t('product.form.upload_image') }}</p>
                                        <p class="text-xs text-surface-300 mt-1">{{ t('product.form.image_hint') }}</p>
                                    </div>
                                </div>
                                <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageSelect" />
                                <Button v-if="imagePreview || existingImageUrl" :label="t('product.form.remove_image')" icon="pi pi-trash" severity="danger" text size="small" @click="removeImage" />
                                <Message v-if="authStore.errors.file" severity="error" size="small" :closable="false">{{ authStore.errors.file[0] }}</Message>
                            </div>
                        </CardSection>
                    </div>
                </div>

                <!-- Attributes Section -->
                <CardSection :title="t('product.form.attributes')" icon="pi pi-sliders-h">
                    <!-- State 1: No category selected -->
                    <div v-if="!resolvedCategoryId" class="flex flex-col items-center justify-center py-12 gap-4">
                        <div class="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                            <i class="pi pi-sitemap text-2xl text-surface-300 dark:text-surface-500"></i>
                        </div>
                        <p class="text-sm text-surface-400 text-center max-w-sm">{{ t('product.form.select_category_for_attributes') }}</p>
                    </div>

                    <!-- State 2 & 3: Category selected -->
                    <div v-else class="flex flex-col gap-5">
                        <!-- No attributes available for this category -->
                        <div v-if="availableAttributes.length === 0 && selectedAttributes.length === 0" class="flex flex-col items-center justify-center py-12 gap-4">
                            <div class="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                <i class="pi pi-sliders-h text-2xl text-surface-300 dark:text-surface-500"></i>
                            </div>
                            <p class="text-sm text-surface-400 text-center max-w-sm">{{ t('product.form.no_attributes_for_category') }}</p>
                            <Button :label="t('product.form.create_attribute')" icon="pi pi-plus" severity="secondary" outlined @click="openCreateAttribute" />
                        </div>

                        <!-- Has attributes -->
                        <template v-else>
                            <!-- Attribute cards -->
                            <div class="flex flex-wrap gap-4">
                                <div v-for="(attr, attrIndex) in selectedAttributes" :key="attr.id" class="flex-1 min-w-[220px] border border-surface-200 dark:border-surface-700 rounded-3xl p-5 flex flex-col">
                                    <!-- Header: Name + Grouped by + X -->
                                    <div class="flex items-start justify-between mb-4">
                                        <div class="flex items-center gap-2">
                                            <h3 class="font-bold text-base text-surface-800 dark:text-surface-100">{{ attr.name }}</h3>
                                            <Tag v-if="attrIndex === 0 && stockType === 'variant'" severity="secondary" class="!text-[9px] !px-1.5 !py-0.5 uppercase tracking-wider font-semibold">
                                                <template #default>
                                                    <i class="pi pi-diamond-fill text-[7px] mr-1"></i>
                                                    {{ t('product.form.grouped_by') }}
                                                </template>
                                            </Tag>
                                        </div>
                                        <button class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors p-1" @click="removeAttribute(attr.id)">
                                            <i class="pi pi-times text-sm"></i>
                                        </button>
                                    </div>

                                    <!-- Value-based types: color, dropdown, multiselect, radio -->
                                    <template v-if="hasValues(attr.type)">
                                        <div class="flex flex-wrap gap-2">
                                            <!-- Color swatch design -->
                                            <template v-if="attr.type === 'color'">
                                                <div
                                                    v-for="val in attr.values || []"
                                                    :key="val.id"
                                                    class="cursor-pointer select-none flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1 border-2 transition-all duration-200"
                                                    :class="
                                                        isValueSelected(attr.id, val.id)
                                                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                            : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 hover:shadow-sm'
                                                    "
                                                    @click="toggleValue(attr.id, val.id)"
                                                >
                                                    <span
                                                        class="relative inline-flex items-center justify-center w-6 h-6 rounded-full border border-surface-200 dark:border-surface-500 shrink-0 transition-transform duration-200"
                                                        :class="{ 'scale-110': isValueSelected(attr.id, val.id) }"
                                                        :style="{ backgroundColor: '#' + (val.color || 'ccc') }"
                                                    >
                                                        <i v-if="isValueSelected(attr.id, val.id)" class="pi pi-check text-[10px] drop-shadow-sm" :style="{ color: parseInt(val.color || 'ccc', 16) > 0xaaaaaa ? '#1e293b' : '#ffffff' }"></i>
                                                    </span>
                                                    <span class="text-sm" :class="isValueSelected(attr.id, val.id) ? 'text-primary font-medium' : 'text-surface-600 dark:text-surface-300'">
                                                        {{ val.value }}
                                                    </span>
                                                </div>
                                            </template>
                                            <!-- Default chip design (dropdown, multiselect, radio) -->
                                            <template v-else>
                                                <div
                                                    v-for="val in attr.values || []"
                                                    :key="val.id"
                                                    class="cursor-pointer select-none rounded-full px-4 py-1.5 text-sm border-2 transition-all duration-150"
                                                    :class="
                                                        isValueSelected(attr.id, val.id)
                                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                                            : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500'
                                                    "
                                                    @click="toggleValue(attr.id, val.id)"
                                                >
                                                    {{ val.value }}
                                                </div>
                                            </template>
                                        </div>
                                    </template>

                                    <!-- Free-form input types -->
                                    <template v-else>
                                        <!-- Date type -->
                                        <div v-if="attr.type === 'date'" class="w-full">
                                            <DatePicker v-model="customAttributeValues[attr.id]" dateFormat="yy-mm-dd" showIcon iconDisplay="input" showButtonBar class="w-full" :placeholder="t('product.form.select_date')" />
                                        </div>

                                        <!-- Text type -->
                                        <div v-else-if="attr.type === 'text'" class="w-full">
                                            <InputText v-model="customAttributeValues[attr.id]" class="w-full" :placeholder="t('product.form.enter_value')" />
                                        </div>

                                        <!-- Numeric type -->
                                        <div v-else-if="attr.type === 'numeric'" class="w-full">
                                            <InputNumber v-model="customAttributeValues[attr.id]" class="w-full" :placeholder="t('product.form.enter_value')" :minFractionDigits="0" :maxFractionDigits="2" />
                                        </div>

                                        <!-- Boolean type -->
                                        <div v-else-if="attr.type === 'boolean'" class="flex items-center gap-3">
                                            <ToggleSwitch v-model="customAttributeValues[attr.id]" />
                                            <span class="text-sm text-surface-600 dark:text-surface-300">
                                                {{ customAttributeValues[attr.id] ? t('common.labels.yes') : t('common.labels.no') }}
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <!-- Add another attribute (dashed card) -->
                            <div
                                class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-3xl py-6 px-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200 min-h-[80px]"
                                @click="(e) => addAttrPopover.toggle(e)"
                            >
                                <i class="pi pi-plus text-surface-400 text-sm"></i>
                                <span class="text-sm text-surface-400">{{ t('product.form.add_another_attribute') }}</span>
                            </div>

                            <!-- Popover for attribute selection -->
                            <Popover ref="addAttrPopover">
                                <div class="flex flex-col gap-3 p-1 w-[300px]">
                                    <Select
                                        v-model="pendingAttributeId"
                                        :options="availableAttributes.filter((a) => !selectedAttributeIds.includes(a.id))"
                                        optionLabel="name"
                                        optionValue="id"
                                        :placeholder="t('product.form.select_attribute')"
                                        filter
                                        class="w-full"
                                        @change="
                                            if (pendingAttributeId) {
                                                addAttribute(pendingAttributeId);
                                                pendingAttributeId = null;
                                                addAttrPopover.hide();
                                            }
                                        "
                                    >
                                        <template #option="{ option }">
                                            <div class="flex items-center justify-between w-full gap-3">
                                                <span>{{ option.name }}</span>
                                                <Tag :value="t(`attribute.types.${option.type}`)" severity="secondary" class="text-[10px]" />
                                            </div>
                                        </template>
                                    </Select>
                                    <Divider class="!my-0" />
                                    <button
                                        type="button"
                                        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.03] text-primary text-sm font-medium hover:border-primary/60 hover:bg-primary/[0.07] hover:shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
                                        @click="
                                            addAttrPopover.hide();
                                            openCreateAttribute();
                                        "
                                    >
                                        <i class="pi pi-sparkles text-xs"></i>
                                        {{ t('product.form.create_attribute') }}
                                    </button>
                                </div>
                            </Popover>
                        </template>
                    </div>
                </CardSection>

                <!-- Price & Stock (full width) -->
                <CardSection :title="t('product.form.price_stock')" icon="pi pi-dollar">
                    <div class="flex flex-col gap-6">
                        <!-- 1. PRICES (top) -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1.5">
                                <div v-if="stockType === 'variant'" class="flex flex-col gap-1.5">
                                    <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('product.form.standard_purchase_price') }}</label>
                                    <div class="flex flex-col gap-1 py-2">
                                        <span class="text-sm font-medium text-surface-400">{{ t('product.form.manage_via_variants') }}</span>
                                        <span class="text-[10px] text-surface-300 italic">{{ t('product.form.prices_disabled_note') }}</span>
                                    </div>
                                </div>
                                <FloatLabel v-else variant="on">
                                    <InputNumber id="purchase_price" v-model="purchasePrice" :disabled="loading.isFormSending" mode="currency" currency="DZD" locale="fr-DZ" class="w-full" />
                                    <label for="purchase_price">{{ t('product.form.standard_purchase_price') }}</label>
                                </FloatLabel>
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <div v-if="stockType === 'variant'" class="flex flex-col gap-1.5">
                                    <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('product.form.standard_sale_price') }}</label>
                                    <div class="flex flex-col gap-1 py-2">
                                        <span class="text-sm font-medium text-surface-400">{{ t('product.form.manage_via_variants') }}</span>
                                        <span class="text-[10px] text-surface-300 italic">{{ t('product.form.prices_disabled_note') }}</span>
                                    </div>
                                </div>
                                <FloatLabel v-else variant="on">
                                    <InputNumber id="sale_price" v-model="salePrice" :disabled="loading.isFormSending" mode="currency" currency="DZD" locale="fr-DZ" class="w-full" />
                                    <label for="sale_price">{{ t('product.form.standard_sale_price') }}</label>
                                </FloatLabel>
                            </div>
                        </div>

                        <!-- 2. STOCK MANAGEMENT (3 cards inline) -->
                        <div class="flex flex-col gap-2">
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('product.form.stock_management') }}</label>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <!-- Single Stock card -->
                                <div
                                    class="cursor-pointer border-2 rounded-3xl px-4 py-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                                    :class="[stockType === 'single' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-surface-200 dark:border-surface-700']"
                                    @click="stockType = 'single'"
                                >
                                    <i class="pi pi-box text-xl" :class="stockType === 'single' ? 'text-primary' : 'text-surface-400'"></i>
                                    <div class="flex-1">
                                        <div class="text-sm font-bold" :class="stockType === 'single' ? 'text-primary' : 'text-surface-600 dark:text-surface-300'">
                                            {{ t('product.form.single_stock') }}
                                        </div>
                                        <p class="text-xs text-surface-400 mt-0.5">{{ t('product.form.single_stock_desc') }}</p>
                                    </div>
                                    <i class="pi text-lg" :class="stockType === 'single' ? 'pi-circle-fill text-primary' : 'pi-circle text-surface-300'"></i>
                                </div>

                                <!-- Per Variant card -->
                                <div
                                    class="cursor-pointer border-2 rounded-3xl px-4 py-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                                    :class="[stockType === 'variant' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-surface-200 dark:border-surface-700']"
                                    @click="stockType = 'variant'"
                                >
                                    <i class="pi pi-th-large text-xl" :class="stockType === 'variant' ? 'text-primary' : 'text-surface-400'"></i>
                                    <div class="flex-1">
                                        <div class="text-sm font-bold" :class="stockType === 'variant' ? 'text-primary' : 'text-surface-600 dark:text-surface-300'">
                                            {{ t('product.form.per_variant') }}
                                        </div>
                                        <p class="text-xs text-surface-400 mt-0.5">{{ t('product.form.per_variant_desc') }}</p>
                                    </div>
                                    <i class="pi text-lg" :class="stockType === 'variant' ? 'pi-circle-fill text-primary' : 'pi-circle text-surface-300'"></i>
                                </div>

                                <!-- Total Stock card (disabled when per variant) -->
                                <div
                                    class="border-2 rounded-3xl px-4 py-4 flex flex-col gap-2 transition-all duration-200"
                                    :class="[stockType === 'variant' ? 'border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 opacity-60' : 'border-surface-200 dark:border-surface-700']"
                                >
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-ban text-sm" :class="stockType === 'variant' ? 'text-surface-300' : 'text-surface-400'"></i>
                                        <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('product.form.total_stock') }}</label>
                                    </div>
                                    <div v-if="stockType === 'variant'" class="flex flex-col gap-1">
                                        <span class="text-sm font-medium text-surface-400">{{ t('product.form.manage_via_variants') }}</span>
                                        <span class="text-[10px] text-surface-300 italic">{{ t('product.form.total_stock_disabled_note') }}</span>
                                    </div>
                                    <InputNumber v-else v-model="totalStock" :disabled="loading.isFormSending" class="w-full" :min="0" />
                                </div>
                            </div>
                        </div>

                        <!-- ========================================= -->
                        <!-- 3. VARIANT MATRIX (visible when Per Variant) -->
                        <!-- ========================================= -->
                        <div v-if="stockType === 'variant'" class="flex flex-col gap-6">
                            <!-- Variant Matrix: populated state -->
                            <div v-if="variants.length > 0" class="flex flex-col gap-5">
                                <!-- Header + Controls row -->
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.form.variant_matrix') }}</h4>
                                        <p class="text-xs text-surface-400 mt-0.5">{{ t('product.form.variant_matrix_desc') }}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Button icon="pi pi-plus" :label="t('product.form.expand_all')" text size="small" class="uppercase font-bold tracking-wider text-[11px]" @click="expandAll" />
                                        <Button icon="pi pi-minus" :label="t('product.form.collapse_all')" text size="small" class="uppercase font-bold tracking-wider text-[11px]" @click="collapseAll" />
                                        <Divider v-if="selectedAttributes.length > 1" layout="vertical" class="!mx-1" />
                                        <div class="flex items-center gap-2" v-if="selectedAttributes.length > 1">
                                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider">{{ t('product.form.group_by') }}:</label>
                                            <Select v-model="groupByAttributeIndex" :options="groupByOptions" optionLabel="label" optionValue="value" size="small" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Out-of-sync warning -->
                                <Message v-if="variantsOutOfSync" severity="warn" :closable="false" class="!my-0">
                                    <div class="flex items-center justify-between w-full gap-4">
                                        <span class="text-sm">{{ t('product.form.variants_out_of_sync') }}</span>
                                        <Button :label="t('product.form.regenerate')" icon="pi pi-sync" size="small" severity="warn" @click="generateVariantMatrix" />
                                    </div>
                                </Message>

                                <!-- TreeTable -->
                                <TreeTable :value="treeNodes" v-model:expandedKeys="expandedKeys" class="rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-700">
                                    <!-- Column: Variant Tree (with toggler) -->
                                    <Column :header="t('product.form.variant_tree')" expander style="width: 280px">
                                        <template #body="{ node }">
                                            <template v-if="node.data.isGroup">
                                                <div class="flex items-center gap-2">
                                                    <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: `hsl(${(node.key.charCodeAt(0) * 50) % 360}, 65%, 55%)` }"></span>
                                                    <span class="font-semibold text-sm text-surface-700 dark:text-surface-200">{{ node.data.attributeName }}: {{ node.data.attributeValue }}</span>
                                                    <Tag :value="`${node.data.count} ${t('product.form.n_variants')}`" severity="info" class="ml-1" />
                                                </div>
                                            </template>
                                            <template v-else>
                                                <span class="text-sm text-surface-600 dark:text-surface-300">{{ getChildLabel(node.data.variant) }}</span>
                                            </template>
                                        </template>
                                    </Column>

                                    <!-- Column: SKU -->
                                    <Column :header="t('product.form.sku')" style="min-width: 180px">
                                        <template #body="{ node }">
                                            <template v-if="node.data.isGroup">
                                                <span class="flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-wider">
                                                    <i class="pi pi-bolt text-[10px]"></i>
                                                    {{ t('product.form.bulk_actions') }}
                                                </span>
                                            </template>
                                            <template v-else>
                                                <InputText v-model="node.data.variant.sku" size="small" class="w-full" :disabled="loading.isFormSending" />
                                            </template>
                                        </template>
                                    </Column>

                                    <!-- Column: Price -->
                                    <Column :header="t('product.form.price_col')" style="min-width: 140px">
                                        <template #body="{ node }">
                                            <InputNumber
                                                v-if="node.data.isGroup"
                                                v-model="bulkPrices[node.key]"
                                                size="small"
                                                mode="decimal"
                                                :minFractionDigits="2"
                                                :placeholder="t('product.form.set_price')"
                                                class="w-full"
                                                :inputStyle="{ width: '100%' }"
                                            />
                                            <InputNumber v-else v-model="node.data.variant.sale_price" size="small" mode="decimal" :minFractionDigits="2" class="w-full" :disabled="loading.isFormSending" :inputStyle="{ width: '100%' }" />
                                        </template>
                                    </Column>

                                    <!-- Column: Stock Level -->
                                    <Column :header="t('product.form.stock_col')" style="min-width: 130px">
                                        <template #body="{ node }">
                                            <InputNumber v-if="node.data.isGroup" v-model="bulkStocks[node.key]" size="small" :min="0" :placeholder="t('product.form.set_stock')" class="w-full" :inputStyle="{ width: '100%' }" />
                                            <InputNumber v-else v-model="node.data.variant.stock" size="small" :min="0" class="w-full" :disabled="loading.isFormSending" :inputStyle="{ width: '100%' }" />
                                        </template>
                                    </Column>

                                    <!-- Column: Actions -->
                                    <Column :header="t('product.form.actions_col')" style="width: 100px" class="text-center">
                                        <template #body="{ node }">
                                            <Button v-if="node.data.isGroup" :label="t('product.form.set_all')" size="small" text class="uppercase font-bold tracking-wider text-[11px] text-primary" @click="setAllForGroup(node.key)" />
                                        </template>
                                    </Column>
                                </TreeTable>
                            </div>

                            <!-- Empty state: no variants yet -->
                            <div v-else class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl py-12 px-6 flex flex-col items-center justify-center gap-5">
                                <div class="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                    <i class="pi pi-th-large text-2xl text-surface-300 dark:text-surface-500"></i>
                                </div>
                                <p class="text-sm text-surface-400 text-center max-w-md">{{ t('product.form.no_variants_hint') }}</p>
                                <Button
                                    :label="t('product.form.generate_matrix')"
                                    icon="pi pi-sync"
                                    :disabled="selectedAttributes.length === 0 || loading.isFormSending"
                                    @click="generateVariantMatrix"
                                    class="!bg-gradient-to-r !from-blue-500 !to-purple-500 !border-0 !text-white px-8 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
                                />
                            </div>
                        </div>
                    </div>
                </CardSection>
            </div>
        </PForm>
    </div>
</template>
