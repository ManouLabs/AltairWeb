<script setup lang="ts">
import { useProductService } from '@/services/useProductService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import type { ProductData } from '@/types/product';
import dayjs from '@/plugins/dayjs';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();

const product = ref<ProductData | null>(null);
const isLoading = ref(true);

async function loadProduct(): Promise<void> {
    try {
        const response = await useProductService.getProduct(Number(route.params.id));
        product.value = response.data;
    } catch (error) {
        console.error('Error loading product:', error);
    } finally {
        isLoading.value = false;
        loading.stopPageLoading();
    }
}

function goBack(): void {
    router.push({ name: 'products' });
}

function editProduct(): void {
    router.push({ name: 'product-edit', params: { id: product.value?.id } });
}

function formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' DA';
}

const totalVariantStock = computed(() => {
    if (!product.value?.variants) return 0;
    return product.value.variants.reduce((sum, v) => sum + (v.available_stock ?? v.stock ?? 0), 0);
});

const displayStock = computed(() => {
    if (!product.value) return 0;
    return product.value.stock_type === 'variant' ? totalVariantStock.value : (product.value.available_stock ?? product.value.total_stock);
});

const stockSeverity = computed(() => {
    if (!product.value) return 'secondary';
    const stock = displayStock.value;
    if (stock === 0) return 'danger';
    if (stock <= (product.value.low_stock_threshold || 10)) return 'warn';
    return 'success';
});

const stockPercentage = computed(() => {
    if (!product.value) return 0;
    const stock = displayStock.value;
    const threshold = product.value.low_stock_threshold || 10;
    // Show percentage relative to a reasonable max (10x threshold or 100, whichever is larger)
    const max = Math.max(threshold * 10, 100, stock);
    return Math.min(100, Math.round((stock / max) * 100));
});

const margin = computed(() => {
    if (!product.value?.purchase_price || !product.value?.sale_price || product.value.sale_price === 0) return null;
    return (((product.value.sale_price - product.value.purchase_price) / product.value.sale_price) * 100).toFixed(1);
});

const selectedValues = computed(() => {
    return new Set(product.value?.selected_value_ids || []);
});

function getSelectedValuesForAttr(attr: any): any[] {
    return (attr.values || []).filter((v: any) => selectedValues.value.has(v.id));
}

function isFreFormType(type: string): boolean {
    return ['date', 'text', 'numeric', 'boolean'].includes(type);
}

function getVariantAttributeLabels(variant: any): string[] {
    if (!product.value?.attributes) return [];
    const labels: string[] = [];
    for (const valueId of variant.attribute_values || []) {
        for (const attr of product.value.attributes) {
            const val = (attr.values || []).find((v: any) => v.id === valueId);
            if (val) {
                labels.push(val.value);
                break;
            }
        }
    }
    return labels;
}

onMounted(loadProduct);
</script>

<template>
    <div>
        <!-- Page Header -->
        <PageHeader icon="pi pi-box" icon-color="#8B5CF6" :title="product?.name || t('entity.product')" :description="t('product.show.subtitle')">
            <template #actions>
                <Button :label="t('common.labels.back')" severity="secondary" outlined icon="pi pi-arrow-left" @click="goBack" />
                <Button v-if="authStore.hasPermission('update_products')" :label="t('common.labels.edit')" icon="pi pi-pencil" severity="primary" @click="editProduct" />
            </template>
        </PageHeader>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="flex flex-col gap-6">
            <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-8">
                <div class="flex gap-8">
                    <Skeleton width="280px" height="280px" borderRadius="16px" />
                    <div class="flex-1 flex flex-col gap-4">
                        <Skeleton width="60%" height="32px" />
                        <Skeleton width="40%" height="20px" />
                        <div class="flex gap-4 mt-4">
                            <Skeleton width="150px" height="80px" borderRadius="12px" />
                            <Skeleton width="150px" height="80px" borderRadius="12px" />
                            <Skeleton width="150px" height="80px" borderRadius="12px" />
                        </div>
                        <Skeleton width="100%" height="12px" class="mt-4" borderRadius="6px" />
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton height="200px" borderRadius="16px" />
                <Skeleton height="200px" borderRadius="16px" />
            </div>
        </div>

        <!-- Content -->
        <div v-else-if="product" class="flex flex-col gap-6">
            <!-- HERO CARD: Image + Core Info + Stock -->
            <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden">
                <div class="flex flex-col lg:flex-row">
                    <!-- Product Image -->
                    <div class="lg:w-72 lg:min-h-72 bg-surface-50 dark:bg-surface-900/60 flex items-center justify-center p-6 lg:border-r border-b lg:border-b-0 border-surface-200 dark:border-surface-700">
                        <div class="w-full aspect-square rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800/60 shadow-sm">
                            <img v-if="product.image?.url" :src="product.image.url" :alt="product.name" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center">
                                <i class="pi pi-box text-5xl text-surface-300 dark:text-surface-600"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Info Section -->
                    <div class="flex-1 p-6 lg:p-8 flex flex-col justify-between gap-6">
                        <!-- Top: Name + Meta -->
                        <div>
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <h2 class="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">{{ product.name }}</h2>
                                    <div class="flex items-center gap-3 mt-1.5">
                                        <span v-if="product.sku_prefix" class="font-mono text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-md">{{ product.sku_prefix }}</span>
                                        <Tag v-if="product.category" :value="product.category.name" severity="info" class="!text-xs" />
                                        <Tag :value="product.active ? t('common.labels.active') : t('common.labels.inactive')" :severity="product.active ? 'success' : 'warn'" class="!text-xs" />
                                    </div>
                                </div>
                                <span class="text-[10px] font-medium text-surface-400">{{ dayjs(product.created_at).format('DD/MM/YYYY') }}</span>
                            </div>

                            <!-- Price Cards -->
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                                <div class="bg-surface-50 dark:bg-surface-700/30 rounded-3xl p-4">
                                    <p class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{{ t('product.show.purchase') }}</p>
                                    <p class="text-xl font-extrabold text-surface-800 dark:text-surface-100">{{ formatCurrency(product.purchase_price) }}</p>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-700/30 rounded-3xl p-4">
                                    <p class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{{ t('product.show.sale') }}</p>
                                    <p class="text-xl font-extrabold text-primary">{{ formatCurrency(product.sale_price) }}</p>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-700/30 rounded-3xl p-4">
                                    <p class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{{ t('product.show.margin_label') }}</p>
                                    <p class="text-xl font-extrabold" :class="margin ? 'text-emerald-500' : 'text-surface-400'">{{ margin ? margin + '%' : '—' }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Stock Bar -->
                        <div class="bg-surface-50 dark:bg-surface-700/30 rounded-3xl p-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-box text-xs" :class="stockSeverity === 'success' ? 'text-emerald-500' : stockSeverity === 'warn' ? 'text-amber-500' : 'text-red-500'"></i>
                                    <span class="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{{ t('product.show.stock') }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Tag :value="product.stock_type === 'single' ? t('product.form.single_stock') : t('product.form.per_variant')" :severity="product.stock_type === 'variant' ? 'info' : 'secondary'" class="!text-[9px]" />
                                    <span class="text-[10px] text-surface-400">{{ t('product.form.low_stock_threshold') }}: {{ product.low_stock_threshold }}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="flex-1 h-2.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-500"
                                        :class="stockSeverity === 'success' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : stockSeverity === 'warn' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'"
                                        :style="{ width: stockPercentage + '%' }"
                                    ></div>
                                </div>
                                <span class="text-base font-extrabold text-surface-800 dark:text-surface-100 tabular-nums min-w-[60px] text-right">{{ displayStock }}</span>
                                <span class="text-xs text-surface-400">{{ t('product.labels.units') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECOND ROW: Attributes + Variants side by side -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Attributes Card -->
                <div v-if="product.attributes?.length" class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-6">
                    <div class="flex items-center gap-2 mb-5">
                        <i class="pi pi-sliders-h text-amber-500"></i>
                        <h3 class="text-sm font-bold text-surface-800 dark:text-surface-100 uppercase tracking-wider">{{ t('product.show.attributes') }}</h3>
                        <span class="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-md">{{ product.attributes.length }}</span>
                    </div>

                    <div class="flex flex-col divide-y divide-surface-100 dark:divide-surface-700/50">
                        <div v-for="attr in product.attributes" :key="attr.id" class="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                            <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 w-28 shrink-0 pt-1">{{ attr.name }}</span>
                            <div class="flex flex-wrap gap-1.5 flex-1">
                                <!-- Color type: show swatches -->
                                <template v-if="attr.type === 'color'">
                                    <div
                                        v-for="val in getSelectedValuesForAttr(attr)"
                                        :key="val.id"
                                        v-tooltip.top="val.value"
                                        class="flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600"
                                    >
                                        <span class="inline-block w-4 h-4 rounded-full border border-white dark:border-surface-500 shrink-0 shadow-sm" :style="{ backgroundColor: '#' + (val.color || 'cccccc') }"></span>
                                        <span class="text-xs font-medium text-surface-600 dark:text-surface-300">{{ val.value }}</span>
                                    </div>
                                </template>
                                <!-- Boolean type -->
                                <template v-else-if="attr.type === 'boolean'">
                                    <div v-for="val in getSelectedValuesForAttr(attr)" :key="val.id">
                                        <Tag :value="val.value === 'true' || val.value === '1' ? t('common.labels.yes') : t('common.labels.no')" :severity="val.value === 'true' || val.value === '1' ? 'success' : 'danger'" class="!text-xs" />
                                    </div>
                                </template>
                                <!-- Other types: chips -->
                                <template v-else>
                                    <Tag v-for="val in getSelectedValuesForAttr(attr)" :key="val.id" :value="val.value" severity="secondary" class="!text-xs !font-medium" />
                                </template>
                                <!-- No values -->
                                <span v-if="getSelectedValuesForAttr(attr).length === 0" class="text-xs text-surface-400 italic">—</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Variants Table Card -->
                <div v-if="product.stock_type === 'variant' && product.variants?.length" class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-th-large text-blue-500"></i>
                            <h3 class="text-sm font-bold text-surface-800 dark:text-surface-100 uppercase tracking-wider">{{ t('product.show.variants') }}</h3>
                            <span class="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-md">{{ product.variants.length }}</span>
                        </div>
                    </div>

                    <DataTable :value="product.variants" size="small" class="rounded-3xl overflow-hidden" :rows="10" :paginator="product.variants.length > 10">
                        <Column :header="t('product.show.variants')">
                            <template #body="{ data }">
                                <div class="flex items-center gap-2">
                                    <div class="flex flex-wrap gap-1">
                                        <Tag v-for="(label, idx) in getVariantAttributeLabels(data)" :key="idx" :value="label" severity="secondary" class="!text-[10px]" />
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column :header="t('product.form.sku')">
                            <template #body="{ data }">
                                <span class="font-mono text-xs text-surface-500">{{ data.sku || '—' }}</span>
                            </template>
                        </Column>
                        <Column :header="t('product.form.sale_price')" class="text-right">
                            <template #body="{ data }">
                                <span class="font-semibold text-primary text-sm">{{ formatCurrency(data.sale_price) }}</span>
                            </template>
                        </Column>
                        <Column :header="t('product.form.stock_col')">
                            <template #body="{ data }">
                                <Tag
                                    :value="(data.available_stock ?? data.stock) + ' ' + t('product.labels.units')"
                                    :severity="(data.available_stock ?? data.stock) === 0 ? 'danger' : (data.available_stock ?? data.stock) <= (product?.low_stock_threshold || 10) ? 'warn' : 'success'"
                                    class="!text-xs"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>
