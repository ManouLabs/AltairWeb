<script setup lang="ts">
import CustomerCard from '@/components/common/CustomerCard.vue';
import { useExchangeService } from '@/services/useExchangeService';
import { useProductService } from '@/services/useProductService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { ExchangeData, ExchangeItemFormData } from '@/types/exchange';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/axios';
import ExchangeFormSkeleton from './partials/ExchangeFormSkeleton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const loading = useLoading();
const router = useRouter();
const route = useRoute();
const { showToast } = useShowToast();

const exchangeId = computed(() => (route.params.id ? Number(route.params.id) : null));
const isEdit = computed(() => !!exchangeId.value);

const exchange = ref<ExchangeData | null>(null);
const exchangeRef = ref('');
const orderRef = ref('');
const orderId = ref<number | null>(null);
const shippingFee = ref(0);
const note = ref('');
const status = ref('pending');

// Items
const items = ref<ExchangeItemFormData[]>([]);

// Product search for new products (AutoComplete)
const newProductSearch = ref('');
const filteredNewProducts = ref<any[]>([]);

// Product search for replacement items (AutoComplete)
const replacementSearch = ref('');
const filteredReplacementProducts = ref<any[]>([]);

// New products added to exchange (separate from order items)
const newProducts = ref<{ product_id: number; product_name: string; sku: string | null; quantity: number; unit_price: number; stock?: number | null }[]>([]);

// Actions options
const actionOptions = computed(() => [
    { label: t('exchange.actions.kept'), value: 'kept' },
    { label: t('exchange.actions.exchange'), value: 'exchange' },
    { label: t('exchange.actions.return_for_credit'), value: 'return_for_credit' }
]);

const reasonOptions = computed(() => [
    { label: t('exchange.reasons.wrong_item_sent'), value: 'wrong_item_sent' },
    { label: t('exchange.reasons.defective'), value: 'defective' },
    { label: t('exchange.reasons.no_longer_needed'), value: 'no_longer_needed' },
    { label: t('exchange.reasons.wrong_size'), value: 'wrong_size' },
    { label: t('exchange.reasons.other'), value: 'other' }
]);

const conditionOptions = computed(() => [
    { label: t('exchange.conditions.restock_like_new'), value: 'restock_like_new' },
    { label: t('exchange.conditions.damaged'), value: 'damaged' },
    { label: t('exchange.conditions.unopened'), value: 'unopened' }
]);

const statusOptions = [
    { label: t('order.statuses.pending'), value: 'pending', icon: 'pi pi-clock', color: '#f59e0b' },
    { label: t('order.statuses.confirmed'), value: 'confirmed', icon: 'pi pi-check', color: '#3b82f6' },
    { label: t('order.statuses.in_preparation'), value: 'in_preparation', icon: 'pi pi-cog', color: '#6366f1' },
    { label: t('order.statuses.in_dispatch'), value: 'in_dispatch', icon: 'pi pi-send', color: '#8b5cf6' },
    { label: t('order.statuses.shipping'), value: 'shipping', icon: 'pi pi-truck', color: '#8b5cf6' },
    { label: t('order.statuses.delivered'), value: 'delivered', icon: 'pi pi-check-circle', color: '#22c55e' },
    { label: t('order.statuses.cancelled'), value: 'cancelled', icon: 'pi pi-times-circle', color: '#ef4444' },
    { label: t('order.statuses.returned'), value: 'returned', icon: 'pi pi-replay', color: '#f97316' },
    { label: t('order.statuses.exchanged'), value: 'exchanged', icon: 'pi pi-arrows-h', color: '#eab308' }
];

// Customer info
const customer = ref<any>(null);

async function loadExchange(): Promise<void> {
    if (!exchangeId.value) return;
    try {
        const result = await useExchangeService.getExchange(exchangeId.value);
        exchange.value = result.data;
        exchangeRef.value = result.data.reference;
        orderId.value = result.data.order_id;
        orderRef.value = result.data.order?.reference || '';
        shippingFee.value = Number(result.data.exchange_shipping_fee) || 0;
        note.value = result.data.note || '';
        status.value = result.data.status || 'draft';
        customer.value = result.data.order?.customer || null;

        // Map items
        items.value = (result.data.items || []).map((item) => ({
            order_item_id: item.order_item_id,
            action: item.action,
            reason: item.reason,
            condition: item.condition,
            returning_product_id: item.returning_product_id,
            returning_variant_id: item.returning_variant_id,
            returning_product_name: item.returning_product_name,
            returning_sku: item.returning_sku,
            returning_price: item.returning_price,
            replacement_product_id: item.replacement_product_id,
            replacement_variant_id: item.replacement_variant_id,
            replacement_product_name: item.replacement_product_name,
            replacement_sku: item.replacement_sku,
            replacement_price: item.replacement_price,
            replacement_quantity: item.replacement_quantity || 1,
            replacement_stock: null,
            quantity: item.quantity
        }));
    } catch (error) {
        showToast('error', ACTIONS.STORE, 'exchange', 'tc', error);
    }
}

async function loadOrderForExchange(): Promise<void> {
    const queryOrderId = route.query.order_id ? Number(route.query.order_id) : null;
    if (!queryOrderId) return;

    try {
        const response = await apiClient.get(`/api/admin/orders/${queryOrderId}`);
        const order = response.data.data;
        orderId.value = order.id;
        orderRef.value = order.reference || '';
        customer.value = order.customer || null;

        // Pre-fill items from order items — default all to "kept"
        items.value = (order.items || []).map((item: any) => ({
            order_item_id: item.id,
            action: 'kept',
            reason: null,
            condition: null,
            returning_product_id: item.product_id,
            returning_variant_id: item.product_variant_id,
            returning_product_name: item.product_name,
            returning_sku: item.sku || item.variant_label || null,
            returning_price: item.unit_price,
            replacement_product_id: null,
            replacement_variant_id: null,
            replacement_product_name: null,
            replacement_sku: null,
            replacement_price: null,
            replacement_quantity: 1,
            replacement_stock: null,
            quantity: item.quantity
        }));
    } catch (error) {
        showToast('error', ACTIONS.STORE, 'exchange', 'tc', error);
    }
}

// Search products for replacement (AutoComplete @complete handler)
function getProductStock(product: any): number {
    if (product.stock_type === 'variant' && product.variants?.length) {
        return product.variants.reduce((sum: number, v: any) => sum + (v.available_stock ?? v.stock ?? 0), 0);
    }
    return product.available_stock ?? product.total_stock ?? 0;
}

const searchReplacementProduct = async (event: any): Promise<void> => {
    const query = event.query?.trim() || '';
    try {
        const res = await useProductService.getProductsList(query || undefined, query ? 15 : 5);
        filteredReplacementProducts.value = res.products || [];
    } catch {
        filteredReplacementProducts.value = [];
    }
};

function selectReplacement(itemIndex: number, product: any): void {
    const item = items.value[itemIndex];
    item.replacement_product_id = product.id;
    item.replacement_product_name = product.name;
    item.replacement_sku = product.sku_prefix || product.sku || null;
    item.replacement_price = Number(product.sale_price || product.price) || 0;
    item.replacement_quantity = 1;
    item.replacement_stock = getProductStock(product);
    item.replacement_variant_id = null;
    replacementSearch.value = '';
}

// New product search (same as Order Form)
const searchNewProduct = async (event: any): Promise<void> => {
    const query = event.query?.trim() || '';
    try {
        const res = await useProductService.getProductsList(query || undefined, query ? 15 : 5);
        filteredNewProducts.value = res.products || [];
    } catch {
        filteredNewProducts.value = [];
    }
};

function addNewProductFromSearch(product: any): void {
    newProducts.value.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku_prefix || product.sku || null,
        quantity: 1,
        unit_price: Number(product.sale_price || product.price) || 0,
        stock: getProductStock(product)
    });
    newProductSearch.value = '';
}

function removeNewProduct(index: number): void {
    newProducts.value.splice(index, 1);
}

function updateNewProductQty(index: number, delta: number): void {
    const item = newProducts.value[index];
    item.quantity = Math.max(1, item.quantity + delta);
}

// Summary calculations
const keptItems = computed(() => items.value.filter((i) => i.action === 'kept'));
const exchangeItems = computed(() => items.value.filter((i) => i.action === 'exchange'));
const returnedItems = computed(() => items.value.filter((i) => i.action === 'return_for_credit'));

const keptTotal = computed(() => keptItems.value.reduce((sum, i) => sum + (Number(i.returning_price) || 0) * i.quantity, 0));
const exchangeOutTotal = computed(() => exchangeItems.value.reduce((sum, i) => sum + (Number(i.returning_price) || 0) * i.quantity, 0));
const exchangeInTotal = computed(() => exchangeItems.value.reduce((sum, i) => sum + (Number(i.replacement_price) || 0) * (i.replacement_quantity || 1), 0));
const returnedTotal = computed(() => returnedItems.value.reduce((sum, i) => sum + (Number(i.returning_price) || 0) * i.quantity, 0));

const newProductsTotal = computed(() => newProducts.value.reduce((sum, p) => sum + p.quantity * p.unit_price, 0));

const subtotalAdjustment = computed(() => exchangeInTotal.value - exchangeOutTotal.value + newProductsTotal.value);
const codBalanceDue = computed(() => subtotalAdjustment.value - returnedTotal.value + shippingFee.value);

// Validation errors
const hasErrors = computed(() => Object.keys(authStore.errors).length > 0);
const errorMessages = computed(() => {
    const msgs: string[] = [];
    for (const [key, value] of Object.entries(authStore.errors)) {
        if (Array.isArray(value)) msgs.push(...value);
    }
    return msgs;
});

async function submitExchange(): Promise<void> {
    try {
        loading.startFormSending();
        authStore.errors = {};

        const payload = {
            order_id: orderId.value!,
            exchange_shipping_fee: shippingFee.value,
            note: note.value,
            status: status.value,
            items: items.value,
            new_products: newProducts.value.map((np) => ({
                product_id: np.product_id,
                quantity: np.quantity,
                unit_price: np.unit_price
            }))
        };

        if (isEdit.value) {
            await useExchangeService.updateExchange(exchangeId.value!, payload);
            showToast('success', ACTIONS.UPDATE, 'exchange', 'tc');
        } else {
            await useExchangeService.storeExchange(payload);
            showToast('success', ACTIONS.STORE, 'exchange', 'tc');
        }
        router.push({ name: 'exchanges' });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        } else {
            showToast('error', isEdit.value ? ACTIONS.UPDATE : ACTIONS.STORE, 'exchange', 'tc', error);
        }
    } finally {
        loading.stopFormSending();
    }
}

function goBack(): void {
    if (orderId.value) {
        router.push({ name: 'order-edit', params: { id: orderId.value } });
    } else {
        router.push({ name: 'exchanges' });
    }
}

function getActionBadgeSeverity(action: string): string {
    const map: Record<string, string> = { kept: 'success', exchange: 'info', return_for_credit: 'danger' };
    return map[action] || 'secondary';
}

function getActionBadgeLabel(action: string): string {
    return t(`exchange.badges.${action}`);
}

onMounted(async () => {
    loading.startPageLoading();
    if (isEdit.value) {
        await loadExchange();
    } else {
        await loadOrderForExchange();
    }
    loading.stopPageLoading();
});
</script>

<template>
    <div class="max-w-[1400px] mx-auto">
        <!-- Skeleton Loading -->
        <template v-if="loading.isPageLoading">
            <ExchangeFormSkeleton />
        </template>

        <!-- Real Content -->
        <template v-else>
            <!-- Top Bar -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="goBack" />
                    <div>
                        <h1 class="text-xl font-bold text-surface-800 dark:text-surface-100">
                            {{ isEdit ? t('common.titles.edit', { entity: t('entity.exchange') }) : t('exchange.form.title') }}
                        </h1>
                        <p class="text-sm text-surface-500 dark:text-surface-400" v-if="orderRef">{{ t('exchange.form.order_ref', { ref: orderRef }) }}</p>
                    </div>
                </div>
                <Tag v-if="exchangeRef" :value="`REF: #${exchangeRef}`" severity="secondary" class="text-sm" />
            </div>

            <!-- Validation Errors Banner -->
            <Message v-if="hasErrors" severity="error" class="mb-4" :closable="false">
                <ul class="list-disc list-inside text-sm">
                    <li v-for="(msg, idx) in errorMessages" :key="idx">{{ msg }}</li>
                </ul>
            </Message>

            <div class="grid grid-cols-12 gap-6">
                <!-- Main Content -->
                <div class="col-span-12 lg:col-span-9 flex flex-col gap-4">
                    <!-- Item Cards -->
                    <div v-for="(item, index) in items" :key="index" class="rounded-xl overflow-hidden shadow-sm flex" :class="item.action === 'kept' ? 'border border-surface-200 dark:border-surface-700' : ''">
                        <!-- Gradient / Solid left bar for exchange & return -->
                        <div v-if="item.action === 'exchange'" class="w-1 flex-shrink-0" style="background: linear-gradient(to bottom, #22d3ee, #6366f1, #a855f7)"></div>
                        <div v-else-if="item.action === 'return_for_credit'" class="w-1 flex-shrink-0 bg-red-500"></div>

                        <!-- Card content -->
                        <div class="flex-1 bg-surface-0 dark:bg-surface-900">
                            <!-- KEPT item — minimal card -->
                            <div v-if="item.action === 'kept'" class="p-5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                            <i class="pi pi-box text-surface-400 text-lg"></i>
                                        </div>
                                        <div>
                                            <p class="font-semibold text-surface-800 dark:text-surface-100">{{ item.returning_product_name || t('entity.product') }}</p>
                                            <p class="text-xs text-surface-400 mt-0.5">
                                                <span v-if="item.returning_sku">{{ item.returning_sku }}</span>
                                            </p>
                                            <div class="flex items-center gap-2 mt-1.5">
                                                <Tag :value="getActionBadgeLabel(item.action)" :severity="getActionBadgeSeverity(item.action)" class="!text-xs" />
                                                <span class="font-semibold text-sm">{{ Number(item.returning_price || 0).toLocaleString('fr-DZ') }} DA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Select v-model="item.action" :options="actionOptions" optionLabel="label" optionValue="value" class="w-44" size="small" />
                                </div>
                            </div>

                            <!-- EXCHANGE item — expanded card with returning + replacement -->
                            <div v-else-if="item.action === 'exchange'" class="p-5">
                                <!-- Header -->
                                <div class="flex items-center justify-between mb-5">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-arrow-right-arrow-left text-indigo-500"></i>
                                        <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ t('exchange.form.exchange_in_progress') }}</span>
                                    </div>
                                    <Select v-model="item.action" :options="actionOptions" optionLabel="label" optionValue="value" class="w-44" size="small" />
                                </div>

                                <div class="grid grid-cols-12 gap-3 items-stretch">
                                    <!-- Returning Item -->
                                    <div class="col-span-3">
                                        <div class="rounded-xl border-2 border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-950/30 h-full">
                                            <div class="flex items-center justify-between mb-3">
                                                <p class="text-[10px] uppercase tracking-widest font-bold text-red-500 dark:text-red-400">{{ t('exchange.form.returning_item') }}</p>
                                                <i class="pi pi-minus-circle text-red-400 text-sm"></i>
                                            </div>
                                            <div class="flex items-start gap-3">
                                                <div class="w-14 h-14 rounded-lg bg-white dark:bg-surface-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <i class="pi pi-box text-surface-400 text-lg"></i>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="font-bold text-sm text-surface-800 dark:text-surface-100 truncate">{{ item.returning_product_name || 'N/A' }}</p>
                                                    <p class="text-xs text-surface-400 mt-0.5">{{ item.returning_sku || '' }}</p>
                                                    <p class="text-sm font-bold text-red-600 mt-1">-{{ Number(item.returning_price || 0).toLocaleString('fr-DZ') }} DA</p>
                                                </div>
                                            </div>

                                            <!-- Reason -->
                                            <div class="mt-4 pt-3 border-t border-red-200 dark:border-red-800/50">
                                                <label class="text-[10px] uppercase tracking-wider text-surface-400 font-semibold mb-1.5 block">{{ t('exchange.form.reason') }}</label>
                                                <Select v-model="item.reason" :options="reasonOptions" optionLabel="label" optionValue="value" :placeholder="t('exchange.form.select_reason')" class="w-full" size="small" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Arrow -->
                                    <div class="col-span-1 flex items-center justify-center">
                                        <div class="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center shadow-sm">
                                            <i class="pi pi-arrow-right text-surface-400 text-sm"></i>
                                        </div>
                                    </div>

                                    <!-- Replacement Item -->
                                    <div class="col-span-8">
                                        <div class="rounded-xl border-2 border-teal-200 dark:border-teal-800 p-4 bg-teal-50 dark:bg-teal-950/30 h-full">
                                            <p class="text-[10px] uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400 mb-3">{{ t('exchange.form.replacement_item') }}</p>
                                            <div v-if="item.replacement_product_name" class="overflow-x-auto">
                                                <table class="w-full text-sm table-fixed">
                                                    <thead>
                                                        <tr class="border-b border-surface-200 dark:border-surface-700">
                                                            <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-5">#</th>
                                                            <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-60">{{ t('order.columns.product') }}</th>
                                                            <th class="text-center py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-28">{{ t('order.columns.qty') }}</th>
                                                            <th class="text-center py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-32">{{ t('order.columns.price') }}</th>
                                                            <th class="text-right py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-24">{{ t('order.columns.item_total') }}</th>
                                                            <th class="w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr class="border-b border-surface-100 dark:border-surface-800">
                                                            <td class="py-4 px-2 text-surface-400 font-medium">1</td>
                                                            <td class="py-4 px-2">
                                                                <div class="flex items-center gap-3">
                                                                    <div class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                                        <i class="pi pi-box text-sm text-surface-400"></i>
                                                                    </div>
                                                                    <div class="min-w-0">
                                                                        <div class="flex items-center gap-2">
                                                                            <span class="font-semibold text-surface-800 dark:text-surface-100 truncate">{{ item.replacement_product_name }}</span>
                                                                            <Tag
                                                                                v-if="item.replacement_stock !== undefined && item.replacement_stock !== null"
                                                                                :value="item.replacement_stock > 0 ? `${item.replacement_stock}` : t('common.labels.out_of_stock')"
                                                                                :severity="item.replacement_stock > 5 ? 'success' : item.replacement_stock > 0 ? 'warn' : 'danger'"
                                                                                class="text-[10px]"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td class="py-4 px-2">
                                                                <InputNumber
                                                                    v-model="item.replacement_quantity"
                                                                    showButtons
                                                                    buttonLayout="horizontal"
                                                                    :min="1"
                                                                    :step="1"
                                                                    size="small"
                                                                    :style="{ width: '5rem' }"
                                                                    :pt="{ pcInputText: { root: { class: 'text-center font-bold', style: 'width: 3rem; padding: 0.25rem;' } } }"
                                                                >
                                                                    <template #incrementbuttonicon>
                                                                        <span class="pi pi-plus text-sm" />
                                                                    </template>
                                                                    <template #decrementbuttonicon>
                                                                        <span class="pi pi-minus text-sm" />
                                                                    </template>
                                                                </InputNumber>
                                                            </td>
                                                            <td class="py-4 px-2 text-center">
                                                                <InputNumber
                                                                    v-model="item.replacement_price"
                                                                    mode="currency"
                                                                    currency="DZD"
                                                                    locale="fr-DZ"
                                                                    :style="{ width: '8rem' }"
                                                                    :pt="{ pcInputText: { root: { style: 'width: 100%' } } }"
                                                                    size="small"
                                                                    :min="0"
                                                                />
                                                            </td>
                                                            <td class="py-4 px-2 text-right font-bold text-surface-800 dark:text-surface-100">{{ ((item.replacement_quantity || 1) * (item.replacement_price || 0)).toLocaleString('fr-DZ') }} DA</td>
                                                            <td class="py-4 px-2 text-center">
                                                                <Button
                                                                    icon="pi pi-times"
                                                                    text
                                                                    rounded
                                                                    severity="danger"
                                                                    size="small"
                                                                    @click="
                                                                        item.replacement_product_id = null;
                                                                        item.replacement_product_name = null;
                                                                        item.replacement_sku = null;
                                                                        item.replacement_price = null;
                                                                        item.replacement_quantity = 1;
                                                                        item.replacement_stock = null;
                                                                    "
                                                                />
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div v-else>
                                                <div class="flex items-center border-2 border-primary/30 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                                                    <div class="flex items-center gap-2 px-3 text-surface-400">
                                                        <i class="pi pi-search text-xs"></i>
                                                    </div>
                                                    <AutoComplete
                                                        v-model="replacementSearch"
                                                        :suggestions="filteredReplacementProducts"
                                                        optionLabel="name"
                                                        :placeholder="t('exchange.form.search_product')"
                                                        class="flex-1 border-none"
                                                        :pt="{ pcInputText: { root: { class: 'border-none shadow-none w-full' } }, dropdown: { class: '!border-surface-0 dark:border-surface-600 bg-surface-50 dark:bg-surface-900' } }"
                                                        @complete="searchReplacementProduct"
                                                        @item-select="(e: any) => selectReplacement(index, e.value)"
                                                        dropdown
                                                        forceSelection
                                                    >
                                                        <template #option="{ option }">
                                                            <div class="flex items-center gap-3 py-1 w-full">
                                                                <div class="w-8 h-8 rounded bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                                    <i class="pi pi-box text-xs text-surface-400"></i>
                                                                </div>
                                                                <div class="flex-1 min-w-0">
                                                                    <div class="font-semibold text-sm">{{ option.name }}</div>
                                                                    <div class="text-xs text-surface-400">{{ option.sku_prefix || '—' }} · {{ Number(option.sale_price || 0).toLocaleString('fr-DZ') }} DA</div>
                                                                </div>
                                                                <Tag
                                                                    :value="getProductStock(option) > 0 ? `${getProductStock(option)} ${t('common.labels.in_stock')}` : t('common.labels.out_of_stock')"
                                                                    :severity="getProductStock(option) > 5 ? 'success' : getProductStock(option) > 0 ? 'warn' : 'danger'"
                                                                    class="text-[10px]"
                                                                />
                                                            </div>
                                                        </template>
                                                    </AutoComplete>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- RETURN FOR CREDIT item -->
                            <div v-else-if="item.action === 'return_for_credit'" class="p-5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                                            <i class="pi pi-undo text-red-500 text-lg"></i>
                                        </div>
                                        <div>
                                            <p class="font-semibold text-surface-800 dark:text-surface-100">{{ item.returning_product_name || t('entity.product') }}</p>
                                            <p class="text-xs text-surface-400 mt-0.5">
                                                <span v-if="item.returning_sku">{{ item.returning_sku }}</span>
                                            </p>
                                            <div class="flex items-center gap-2 mt-1.5">
                                                <Tag :value="t('exchange.badges.returned')" severity="danger" class="!text-xs" />
                                                <Tag :value="getActionBadgeLabel(item.action)" severity="warn" class="!text-xs" />
                                                <span class="font-semibold text-sm text-red-600">-{{ Number(item.returning_price || 0).toLocaleString('fr-DZ') }} DA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Select v-model="item.action" :options="actionOptions" optionLabel="label" optionValue="value" class="w-44" size="small" />
                                </div>

                                <!-- Reason + Condition -->
                                <div class="flex gap-4 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                                    <div class="flex-1">
                                        <label class="text-[10px] uppercase tracking-wider text-surface-400 font-semibold mb-1.5 block">{{ t('exchange.form.reason') }}</label>
                                        <Select v-model="item.reason" :options="reasonOptions" optionLabel="label" optionValue="value" :placeholder="t('exchange.form.select_reason')" class="w-full" size="small" />
                                    </div>
                                    <div class="flex-1">
                                        <label class="text-[10px] uppercase tracking-wider text-surface-400 font-semibold mb-1.5 block">{{ t('exchange.form.condition') }}</label>
                                        <Select v-model="item.condition" :options="conditionOptions" optionLabel="label" optionValue="value" :placeholder="t('exchange.form.select_condition')" class="w-full" size="small" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- end card content wrapper -->
                    </div>

                    <!-- New Products Section (like Order Form) -->
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold flex items-center gap-2">
                                <i class="pi pi-plus-circle text-primary"></i>
                                {{ t('exchange.form.add_extra_product') }}
                            </h3>
                        </div>

                        <!-- Product Search Bar (AutoComplete like Order Form) -->
                        <div class="mb-4">
                            <div class="flex items-center border-2 border-primary/30 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                                <div class="flex items-center gap-2 px-4 text-surface-400">
                                    <i class="pi pi-search text-sm"></i>
                                </div>
                                <AutoComplete
                                    v-model="newProductSearch"
                                    :suggestions="filteredNewProducts"
                                    optionLabel="name"
                                    :placeholder="t('order.placeholders.scan_or_search')"
                                    class="flex-1 border-none"
                                    :pt="{ pcInputText: { root: { class: 'border-none shadow-none w-full' } }, dropdown: { class: '!border-surface-0 dark:border-surface-600 bg-surface-50 dark:bg-surface-900' } }"
                                    @complete="searchNewProduct"
                                    @item-select="(e: any) => addNewProductFromSearch(e.value)"
                                    dropdown
                                    forceSelection
                                >
                                    <template #option="{ option }">
                                        <div class="flex items-center gap-3 py-1 w-full">
                                            <div class="w-8 h-8 rounded bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                <i class="pi pi-box text-xs text-surface-400"></i>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="font-semibold text-sm">{{ option.name }}</div>
                                                <div class="text-xs text-surface-400">{{ option.sku_prefix || '—' }} · {{ Number(option.sale_price || 0).toLocaleString('fr-DZ') }} DA</div>
                                            </div>
                                            <Tag
                                                :value="getProductStock(option) > 0 ? `${getProductStock(option)} ${t('common.labels.in_stock')}` : t('common.labels.out_of_stock')"
                                                :severity="getProductStock(option) > 5 ? 'success' : getProductStock(option) > 0 ? 'warn' : 'danger'"
                                                class="text-[10px]"
                                            />
                                        </div>
                                    </template>
                                </AutoComplete>
                                <Button label="ENTER" severity="secondary" text size="small" class="mr-2 font-bold text-xs" />
                            </div>
                        </div>

                        <!-- New Products Table -->
                        <div v-if="newProducts.length > 0" class="overflow-x-auto">
                            <table class="w-full text-sm table-fixed">
                                <thead>
                                    <tr class="border-b border-surface-200 dark:border-surface-700">
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-10">#</th>
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider">{{ t('order.columns.product') }}</th>
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-28">{{ t('order.columns.sku') }}</th>
                                        <th class="text-center py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-36">{{ t('order.columns.qty') }}</th>
                                        <th class="text-center py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-36">{{ t('order.columns.price') }}</th>
                                        <th class="text-right py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-36">{{ t('order.columns.item_total') }}</th>
                                        <th class="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(np, idx) in newProducts" :key="idx" class="border-b border-surface-100 dark:border-surface-800">
                                        <td class="py-4 px-2 text-surface-400 font-medium">{{ idx + 1 }}</td>
                                        <td class="py-4 px-2">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                    <i class="pi pi-box text-sm text-surface-400"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-semibold text-surface-800 dark:text-surface-100 truncate">{{ np.product_name }}</span>
                                                        <Tag
                                                            v-if="np.stock !== undefined && np.stock !== null"
                                                            :value="np.stock > 0 ? `${np.stock}` : t('common.labels.out_of_stock')"
                                                            :severity="np.stock > 5 ? 'success' : np.stock > 0 ? 'warn' : 'danger'"
                                                            class="text-[10px]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2">
                                            <span class="text-xs font-mono text-surface-500 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ np.sku || '—' }}</span>
                                        </td>
                                        <td class="py-4 px-2">
                                            <InputNumber
                                                v-model="np.quantity"
                                                showButtons
                                                buttonLayout="horizontal"
                                                :min="1"
                                                :step="1"
                                                size="small"
                                                :style="{ width: '7rem' }"
                                                :pt="{ pcInputText: { root: { class: 'text-center font-bold', style: 'width: 3rem; padding: 0.25rem;' } } }"
                                            >
                                                <template #incrementbuttonicon>
                                                    <span class="pi pi-plus text-[10px]" />
                                                </template>
                                                <template #decrementbuttonicon>
                                                    <span class="pi pi-minus text-[10px]" />
                                                </template>
                                            </InputNumber>
                                        </td>
                                        <td class="py-4 px-2 text-center">
                                            <InputNumber v-model="np.unit_price" mode="currency" currency="DZD" locale="fr-DZ" :style="{ width: '10rem' }" :pt="{ pcInputText: { root: { style: 'width: 100%' } } }" size="small" :min="0" />
                                        </td>
                                        <td class="py-4 px-2 text-right font-bold text-surface-800 dark:text-surface-100">{{ (np.quantity * np.unit_price).toLocaleString('fr-DZ') }} DA</td>
                                        <td class="py-4 px-2 text-center">
                                            <Button icon="pi pi-times" text rounded severity="danger" size="small" @click="removeNewProduct(idx)" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Empty state -->
                        <div v-else class="text-center py-4 text-surface-400">
                            <p class="text-sm">{{ t('order.placeholders.scan_or_search') }}</p>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-span-12 lg:col-span-3 flex flex-col gap-4">
                    <!-- Exchange Status -->
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-5">
                        <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">{{ t('exchange.columns.status') }}</h3>
                        <Select v-model="status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full">
                            <template #value="{ value }">
                                <div v-if="value" class="flex items-center gap-2">
                                    <i :class="statusOptions.find((s) => s.value === value)?.icon" :style="{ color: statusOptions.find((s) => s.value === value)?.color }" class="text-sm"></i>
                                    <span>{{ statusOptions.find((s) => s.value === value)?.label }}</span>
                                </div>
                            </template>
                            <template #option="{ option }">
                                <div class="flex items-center gap-2">
                                    <i :class="option.icon" :style="{ color: option.color }" class="text-sm"></i>
                                    <span>{{ option.label }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>

                    <!-- Exchange Summary -->
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-5">
                        <h3 class="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">{{ t('exchange.form.exchange_summary') }}</h3>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-surface-600 dark:text-surface-300">
                                    <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                    {{ t('exchange.form.kept_items', { count: keptItems.length }) }}
                                </span>
                                <span class="text-sm font-semibold">{{ keptTotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm text-surface-600 dark:text-surface-300">
                                    <span class="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                    {{ t('exchange.form.exchange_out', { count: exchangeItems.length }) }}
                                </span>
                                <span class="text-sm font-semibold text-red-500">-{{ exchangeOutTotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm text-surface-600 dark:text-surface-300">
                                    <span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {{ t('exchange.form.exchange_in', { count: exchangeItems.length }) }}
                                </span>
                                <span class="text-sm font-semibold text-green-500">+{{ exchangeInTotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm text-surface-600 dark:text-surface-300">
                                    <span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                    {{ t('exchange.form.returned_items', { count: returnedItems.length }) }}
                                </span>
                                <span class="text-sm font-semibold text-red-500">-{{ returnedTotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <Divider />

                            <div class="flex justify-between items-center">
                                <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">{{ t('exchange.form.subtotal_adjustment') }}</span>
                                <span class="text-sm font-semibold" :class="{ 'text-red-500': subtotalAdjustment < 0, 'text-green-500': subtotalAdjustment > 0 }">
                                    {{ subtotalAdjustment > 0 ? '+' : '' }}{{ subtotalAdjustment.toLocaleString('fr-DZ') }} DA
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">{{ t('exchange.form.exchange_shipping') }}</span>
                                <InputNumber v-model="shippingFee" :min="0" size="small" class="w-28" suffix=" DA" :invalid="!!authStore.errors?.['exchange_shipping_fee']?.[0]" />
                            </div>
                            <Message v-if="authStore.errors?.['exchange_shipping_fee']?.[0]" severity="error" size="small">
                                {{ authStore.errors['exchange_shipping_fee'][0] }}
                            </Message>

                            <Divider />

                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-xs uppercase font-bold tracking-wider text-surface-500">{{ t('exchange.form.cod_balance_due') }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-bold" :class="{ 'text-red-500': codBalanceDue < 0, 'text-green-600': codBalanceDue >= 0 }">{{ codBalanceDue.toLocaleString('fr-DZ') }} DA</p>
                                    <p v-if="codBalanceDue < 0" class="text-xs text-blue-500 mt-0.5">{{ t('exchange.form.refund_to_credit') }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Confirm Button -->
                        <Button
                            :label="t('exchange.form.confirm_process')"
                            icon="pi pi-check-circle"
                            severity="primary"
                            class="w-full mt-5 !py-3 !text-base"
                            :loading="loading.isFormSending"
                            :disabled="loading.isFormSending"
                            @click="submitExchange"
                        />
                        <p class="text-xs text-surface-400 text-center mt-2">{{ t('exchange.form.confirm_description') }}</p>
                    </div>

                    <!-- Customer Card -->
                    <div v-if="customer" class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-5">
                        <CustomerCard :customer="customer" size="md" />
                    </div>

                    <!-- Note -->
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-5">
                        <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">{{ t('exchange.form.note') }}</h3>
                        <Textarea v-model="note" rows="3" class="w-full" :placeholder="t('exchange.form.note_placeholder')" />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
