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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const totalVariantStock = computed(() => {
    if (!product.value?.variants) return 0;
    return product.value.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

const displayStock = computed(() => {
    if (!product.value) return 0;
    return product.value.stock_type === 'variant' ? totalVariantStock.value : product.value.total_stock;
});

const stockSeverity = computed(() => {
    if (!product.value) return 'secondary';
    const stock = displayStock.value;
    if (stock === 0) return 'danger';
    if (stock <= (product.value.low_stock_threshold || 10)) return 'warn';
    return 'success';
});

const margin = computed(() => {
    if (!product.value?.purchase_price || !product.value?.sale_price || product.value.sale_price === 0) return null;
    return (((product.value.sale_price - product.value.purchase_price) / product.value.sale_price) * 100).toFixed(1);
});

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

        <!-- Loading -->
        <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-6">
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <Skeleton height="200px" class="w-full" />
                </div>
            </div>
            <div>
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <Skeleton height="200px" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Content -->
        <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- LEFT COLUMN -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Product Details -->
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <i class="pi pi-info-circle text-primary"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.show.details') }}</h3>
                    </div>

                    <div class="grid grid-cols-2 gap-y-5 gap-x-8">
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.name') }}</label>
                            <p class="text-sm text-surface-800 dark:text-surface-200 font-medium">{{ product.name }}</p>
                        </div>
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.sku_prefix') }}</label>
                            <p class="text-sm text-surface-800 dark:text-surface-200">{{ product.sku_prefix || '—' }}</p>
                        </div>
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.category') }}</label>
                            <Tag v-if="product.category" :value="product.category.name" severity="info" />
                            <span v-else class="text-surface-400 text-sm italic">{{ t('product.labels.no_category') }}</span>
                        </div>
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.status') }}</label>
                            <Tag :value="product.active ? t('common.labels.active') : t('common.labels.inactive')" :severity="product.active ? 'success' : 'warn'" />
                        </div>
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.stock_type') }}</label>
                            <Tag :value="product.stock_type === 'single' ? t('product.form.single_stock') : t('product.form.per_variant')" :severity="product.stock_type === 'variant' ? 'info' : 'secondary'" />
                        </div>
                        <div>
                            <label class="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">{{ t('product.show.created') }}</label>
                            <p class="text-sm text-surface-500">{{ dayjs(product.created_at).format('DD/MM/YYYY HH:mm') }}</p>
                        </div>
                    </div>
                </div>

                <!-- Price & Stock -->
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <i class="pi pi-dollar text-green-500"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.form.price_stock') }}</h3>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-surface-50 dark:bg-surface-700/40 rounded-xl p-4 text-center">
                            <p class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-1">{{ t('product.show.purchase') }}</p>
                            <p class="text-lg font-bold text-surface-800 dark:text-surface-200">{{ formatCurrency(product.purchase_price) }}</p>
                        </div>
                        <div class="bg-surface-50 dark:bg-surface-700/40 rounded-xl p-4 text-center">
                            <p class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-1">{{ t('product.show.sale') }}</p>
                            <p class="text-lg font-bold text-primary">{{ formatCurrency(product.sale_price) }}</p>
                        </div>
                        <div class="bg-surface-50 dark:bg-surface-700/40 rounded-xl p-4 text-center">
                            <p class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-1">{{ t('product.show.margin_label') }}</p>
                            <p class="text-lg font-bold" :class="margin ? 'text-green-600' : 'text-surface-400'">{{ margin ? margin + '%' : '—' }}</p>
                        </div>
                        <div class="bg-surface-50 dark:bg-surface-700/40 rounded-xl p-4 text-center">
                            <p class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-1">{{ t('product.show.stock') }}</p>
                            <Tag :value="displayStock + ' ' + t('product.labels.units')" :severity="stockSeverity" class="!text-base" />
                        </div>
                    </div>
                </div>

                <!-- Variants Table -->
                <div v-if="product.stock_type === 'variant' && product.variants?.length" class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <i class="pi pi-th-large text-blue-500"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.show.variants') }} ({{ product.variants.length }})</h3>
                    </div>

                    <DataTable :value="product.variants" size="small" class="rounded-xl overflow-hidden">
                        <Column :header="t('product.form.sku')">
                            <template #body="{ data }">
                                <span class="font-mono text-sm">{{ data.sku || '—' }}</span>
                            </template>
                        </Column>
                        <Column :header="t('product.form.purchase_price')">
                            <template #body="{ data }">
                                {{ formatCurrency(data.purchase_price) }}
                            </template>
                        </Column>
                        <Column :header="t('product.form.sale_price')">
                            <template #body="{ data }">
                                <span class="font-semibold text-primary">{{ formatCurrency(data.sale_price) }}</span>
                            </template>
                        </Column>
                        <Column :header="t('product.form.stock_col')">
                            <template #body="{ data }">
                                <Tag :value="data.stock + ' ' + t('product.labels.units')" :severity="data.stock === 0 ? 'danger' : data.stock <= (product?.low_stock_threshold || 10) ? 'warn' : 'success'" />
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Attributes -->
                <div v-if="product.attributes?.length" class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <i class="pi pi-sliders-h text-amber-500"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.show.attributes') }} ({{ product.attributes.length }})</h3>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div v-for="attr in product.attributes" :key="attr.id" class="flex items-center gap-3 bg-surface-50 dark:bg-surface-700/40 rounded-lg px-4 py-3">
                            <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 w-32">{{ attr.name }}</span>
                            <div class="flex flex-wrap gap-1.5">
                                <Tag v-for="val in attr.values" :key="val.id" :value="val.value" severity="secondary" class="!text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="flex flex-col gap-6">
                <!-- Product Image -->
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-image text-violet-500"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.form.product_image') }}</h3>
                    </div>
                    <div class="w-full aspect-square rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-800/60">
                        <img v-if="product.image?.url" :src="product.image.url" :alt="product.name" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex items-center justify-center">
                            <i class="pi pi-box text-4xl text-surface-300"></i>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-bolt text-amber-500"></i>
                        <h3 class="text-base font-bold text-surface-800 dark:text-surface-100">{{ t('product.show.quick_actions') }}</h3>
                    </div>
                    <div class="flex flex-col gap-2">
                        <Button v-if="authStore.hasPermission('update_products')" :label="t('common.labels.edit')" icon="pi pi-pencil" severity="primary" class="w-full" @click="editProduct" />
                        <Button :label="t('common.labels.back_to_list')" icon="pi pi-list" severity="secondary" outlined class="w-full" @click="goBack" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
