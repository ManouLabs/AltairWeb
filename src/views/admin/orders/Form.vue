<script setup lang="ts">
import { useOrderService } from '@/services/useOrderService';
import { useProductService } from '@/services/useProductService';
import { useCustomerService } from '@/services/useCustomerService';
import { useShopService } from '@/services/useShopService';
import { useShipperService } from '@/services/useShipperService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { orderSchema } from '@/validations/order';
import { validate, validateField } from '@/validations/validate';
import type { OrderFormData } from '@/types/order';
import { computed, defineAsyncComponent, markRaw, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDialog } from 'primevue/usedialog';
import FormHeader from '@/components/FormHeader.vue';
import InitialsAvatar from '@/components/common/InitialsAvatar.vue';
import ReputationBadge from '@/components/common/ReputationBadge.vue';
import { useReputation } from '@/composables/useReputation';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();

const isEdit = computed(() => !!route.params.id);
const orderId = computed(() => (route.params.id ? Number(route.params.id) : null));

// Lookup data
const shops = ref<any[]>([]);
const shippers = ref<any[]>([]);
const productSearch = ref('');
const filteredProducts = ref<any[]>([]);

// Customer AutoComplete
const dialog = useDialog();
const customerFormComponent = defineAsyncComponent(() => import('@/views/admin/customers/partials/Form.vue'));
const filteredCustomers = ref<any[]>([]);
const customerSearching = ref(false);
const selectedCustomer = ref<any>(null);
const regions = ref<any[]>([]);

const searchCustomer = async (event: any): Promise<void> => {
    const query = event.query?.trim() || '';
    if (!query) {
        filteredCustomers.value = [];
        return;
    }
    customerSearching.value = true;
    try {
        const res = await useCustomerService.getCustomers({ filters: { global: { value: query, matchMode: 'contains' } }, rows: 15 });
        filteredCustomers.value = res.data || [];
    } catch (e) {
        console.error('Customer search failed:', e);
        filteredCustomers.value = [];
    } finally {
        customerSearching.value = false;
    }
};

const onCustomerSelect = (event: any): void => {
    record.value.customer_id = event.value.id;
    selectedCustomer.value = event.value;
    authStore.clearErrors(['customer_id']);
};

const onCustomerClear = (): void => {
    record.value.customer_id = null;
    selectedCustomer.value = null;
};

const getCustomerDetails = (customer: any): { phone: string; email: string; address: string } => {
    const phone = (customer.contactMethods || []).find((cm: any) => cm.type === 'phone')?.value || '—';
    const email = (customer.contactMethods || []).find((cm: any) => cm.type === 'email')?.value || '';
    let address = '';
    if (customer.addresses?.length) {
        const addr = customer.addresses[0];
        const parts: string[] = [];
        if (addr.street) parts.push(addr.street);
        if (addr.city && typeof addr.city === 'object' && addr.city.name) parts.push(addr.city.name);
        else if (addr.city && typeof addr.city === 'string') parts.push(addr.city);
        if (addr.region && typeof addr.region === 'object' && addr.region.name) parts.push(addr.region.name);
        else if (addr.region && typeof addr.region === 'string') parts.push(addr.region);
        address = parts.join(', ');
    }
    return { phone, email, address };
};
const { mapReputation } = useReputation();

// Minimal helper for the inline badge in autocomplete dropdown
function getReputation(customer: any) {
    return mapReputation(customer?.reputation);
}

function openCustomerDialog(): void {
    authStore.errors = {};
    dialog.open(customerFormComponent, {
        props: {
            style: { width: '50vw' },
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
                status: 'active',
                blocking_reason: null,
                addresses: [{ street: '', region: null, city: null, main: true }],
                contactMethods: { phone: null, email: null }
            },
            action: ACTIONS.CREATE,
            regions: regions.value,
            headerProps: computed(() => ({
                title: t('common.titles.add', { entity: t('entity.customer') }),
                description: t('customer.form.subtitle'),
                icon: 'pi pi-user-plus',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result) => {
            if (result?.data?.record?.id) {
                const newCustomer = result.data.record;
                record.value.customer_id = newCustomer.id;
                selectedCustomer.value = newCustomer;
                showToast('success', ACTIONS.CREATE, 'customer', 'tc');
            }
        }
    });
}

// Form state
const record = ref<OrderFormData>({
    customer_id: null,
    shop_id: null,
    shipper_id: null,
    shipping_fee: 0,
    discount_amount: 0,
    discount_percentage: 0,
    shipping_type: 'home_delivery',
    source: null,
    status: 'pending',
    payment_status: 'not_paid',
    note: '',
    items: []
});

const orderReference = ref('');

const shippingTypeOptions = [
    { label: t('order.shipping_types.home_delivery'), value: 'home_delivery', icon: 'pi pi-home' },
    { label: t('order.shipping_types.stop_desk'), value: 'stop_desk', icon: 'pi pi-building' }
];

const paymentStatusOptions = [
    { label: t('order.payment_statuses.not_paid'), value: 'not_paid', icon: 'pi pi-wallet' },
    { label: t('order.payment_statuses.paid'), value: 'paid', icon: 'pi pi-check-circle' }
];

const sourceOptions = [
    { label: 'TikTok', value: 'tiktok', icon: 'pi pi-hashtag' },
    { label: 'WhatsApp', value: 'whatsapp', icon: 'pi pi-whatsapp' },
    { label: 'Facebook', value: 'facebook', icon: 'pi pi-facebook' },
    { label: 'YouCan', value: 'youcan', icon: 'pi pi-shopping-cart' },
    { label: 'Shopify', value: 'shopify', icon: 'pi pi-shopping-bag' },
    { label: 'WooCommerce', value: 'woocommerce', icon: 'pi pi-cart-plus' },
    { label: t('order.sources.direct_website'), value: 'direct_website', icon: 'pi pi-globe' },
    { label: t('order.sources.other'), value: 'other', icon: 'pi pi-ellipsis-h' }
];

const statusOptions = [
    { label: t('order.statuses.pending'), value: 'pending', icon: 'pi pi-clock', color: '#f59e0b' },
    { label: t('order.statuses.confirmed'), value: 'confirmed', icon: 'pi pi-check', color: '#3b82f6' },
    { label: t('order.statuses.shipping'), value: 'shipping', icon: 'pi pi-truck', color: '#8b5cf6' },
    { label: t('order.statuses.delivered'), value: 'delivered', icon: 'pi pi-check-circle', color: '#22c55e' },
    { label: t('order.statuses.cancelled'), value: 'cancelled', icon: 'pi pi-times-circle', color: '#ef4444' },
    { label: t('order.statuses.returned'), value: 'returned', icon: 'pi pi-replay', color: '#f97316' }
];

// Computed totals
const subtotal = computed(() => record.value.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0));
const discountAmount = computed(() => {
    if (record.value.discount_percentage > 0) {
        return Math.round(((subtotal.value * record.value.discount_percentage) / 100) * 100) / 100;
    }
    return record.value.discount_amount;
});
const grandTotal = computed(() => Math.max(0, subtotal.value + record.value.shipping_fee - discountAmount.value));

// Validation
const validateForm = (): boolean => {
    const { ok, errors } = validate(orderSchema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

const onBlurField = (path: string): void => {
    const { ok, errors } = validateField(orderSchema, record.value, path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

// Product search
const searchProduct = async (event: any): Promise<void> => {
    const query = event.query?.trim() || '';
    if (!query) {
        filteredProducts.value = [];
        return;
    }
    try {
        const res = await useProductService.getProducts({ filters: { global: { value: query, matchMode: 'contains' } }, rows: 15 });
        filteredProducts.value = res.products || [];
    } catch (e) {
        console.error('Product search failed:', e);
        filteredProducts.value = [];
    }
};

function addProductFromSearch(product: any): void {
    record.value.items.push({
        product_id: product.id,
        product_variant_id: null,
        product_name: product.name,
        variant_label: null,
        sku: product.sku_prefix || null,
        quantity: 1,
        unit_price: Number(product.sale_price) || 0,
        stock: product.available_stock ?? product.total_stock ?? null
    });
    productSearch.value = '';
}

function addCustomItem(): void {
    record.value.items.push({
        product_id: null,
        product_variant_id: null,
        product_name: 'Custom Item',
        variant_label: null,
        sku: null,
        quantity: 1,
        unit_price: 0
    });
}

function removeItem(index: number): void {
    record.value.items.splice(index, 1);
}

function updateItemQuantity(index: number, delta: number): void {
    const item = record.value.items[index];
    item.quantity = Math.max(1, item.quantity + delta);
}

// Load data
async function loadLookups(): Promise<void> {
    try {
        const [shopRes, shipperRes] = await Promise.all([useShopService.getShops(), useShipperService.getShippers({})]);
        shops.value = shopRes.data || [];
        shippers.value = shipperRes.data || [];
    } catch (error) {
        console.error('Error loading lookups:', error);
    }
}

async function loadOrder(): Promise<void> {
    if (!orderId.value) return;
    try {
        const response = await useOrderService.getOrder(orderId.value);
        const order = response.data;
        orderReference.value = order.reference;
        record.value = {
            customer_id: order.customer?.id || null,
            shop_id: order.shop?.id || null,
            shipper_id: order.shipper?.id || null,
            shipping_fee: Number(order.shipping_fee) || 0,
            discount_amount: Number(order.discount_amount) || 0,
            discount_percentage: Number(order.discount_percentage) || 0,
            shipping_type: order.shipping_type,
            source: order.source,
            status: order.status,
            payment_status: order.payment_status,
            note: order.note || '',
            items: (order.items || []).map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                product_name: item.product_name,
                variant_label: item.variant_label,
                sku: item.sku,
                quantity: item.quantity,
                unit_price: Number(item.unit_price)
            }))
        };
        // Pre-select customer for AutoComplete
        if (order.customer) {
            selectedCustomer.value = order.customer;
        }
    } catch (error) {
        console.error('Error loading order:', error);
    }
}

// Auto-fetch shipping fee
async function fetchShippingFee(): Promise<void> {
    if (!record.value.shipper_id || !record.value.shipping_type) return;
    const customer = selectedCustomer.value;
    const customerAddress = customer?.addresses?.[0];
    const regionId = customerAddress?.region?.id || customerAddress?.region;
    if (!regionId) return;

    try {
        const response = await useOrderService.getShippingFee(record.value.shipper_id, regionId, record.value.shipping_type);
        record.value.shipping_fee = Number(response.shipping_fee) || 0;
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
    }
}

watch(
    () => [record.value.shipper_id, record.value.shipping_type, record.value.customer_id],
    () => {
        fetchShippingFee();
    }
);

// Save
async function saveOrder(): Promise<void> {
    if (!validateForm()) return;

    try {
        loading.startFormSending();
        authStore.errors = {};

        const payload = {
            ...record.value,
            subtotal: subtotal.value,
            discount_amount: discountAmount.value,
            total: grandTotal.value
        };

        if (isEdit.value && orderId.value) {
            await useOrderService.updateOrder(orderId.value, payload);
            showToast('success', ACTIONS.EDIT, 'order', 'tc');
        } else {
            await useOrderService.storeOrder(payload as OrderFormData);
            showToast('success', ACTIONS.CREATE, 'order', 'tc');
        }

        router.push({ name: 'orders' });
    } catch (error: any) {
        if (error?.response?.status === 422 && error?.response?.data?.errors) {
            authStore.errors = error.response.data.errors;
        } else if (error?.response?.status === 403) {
            showToast('error', ACTIONS.CREATE, 'order', 'tc', error);
        } else {
            showToast('error', isEdit.value ? ACTIONS.EDIT : ACTIONS.CREATE, 'order', 'tc', error);
        }
    } finally {
        loading.stopFormSending();
    }
}

onMounted(async () => {
    loading.startPageLoading();
    await loadLookups();
    if (isEdit.value) {
        await loadOrder();
    }
    loading.stopPageLoading();
});
</script>

<template>
    <div class="max-w-[1400px] mx-auto">
        <!-- Skeleton Loading -->
        <template v-if="loading.isPageLoading">
            <!-- Top Bar Skeleton -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Skeleton shape="circle" size="2.5rem" />
                    <div>
                        <Skeleton width="14rem" height="1.5rem" class="mb-1" />
                        <Skeleton width="8rem" height="0.875rem" />
                    </div>
                </div>
                <Skeleton width="5rem" height="1.75rem" borderRadius="9999px" />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column Skeleton -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <!-- Customer Section Skeleton -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <div class="flex items-center gap-2 mb-4">
                            <Skeleton shape="circle" size="1.25rem" />
                            <Skeleton width="10rem" height="1.25rem" />
                        </div>
                        <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mb-4" />
                        <Skeleton width="10rem" height="2.25rem" borderRadius="0.5rem" />
                    </div>

                    <!-- Products Section Skeleton -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <div class="flex items-center gap-2 mb-4">
                            <Skeleton shape="circle" size="1.25rem" />
                            <Skeleton width="8rem" height="1.25rem" />
                        </div>
                        <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mb-4" />
                        <!-- Fake product rows -->
                        <div class="flex flex-col gap-3">
                            <div v-for="n in 2" :key="n" class="flex items-center gap-4 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                                <Skeleton shape="circle" size="2rem" />
                                <div class="flex-1">
                                    <Skeleton width="60%" height="0.875rem" class="mb-1" />
                                    <Skeleton width="30%" height="0.75rem" />
                                </div>
                                <Skeleton width="4rem" height="2rem" borderRadius="0.375rem" />
                                <Skeleton width="5rem" height="0.875rem" />
                            </div>
                        </div>
                    </div>

                    <!-- Order Details Section Skeleton -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <div class="flex items-center gap-2 mb-4">
                            <Skeleton shape="circle" size="1.25rem" />
                            <Skeleton width="9rem" height="1.25rem" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Skeleton v-for="n in 4" :key="n" width="100%" height="2.75rem" borderRadius="0.5rem" />
                        </div>
                        <!-- Shipping type + Source -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                            <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                        </div>
                        <!-- Status + Payment -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" />
                            <div class="flex gap-2">
                                <Skeleton width="50%" height="2.75rem" borderRadius="0.75rem" />
                                <Skeleton width="50%" height="2.75rem" borderRadius="0.75rem" />
                            </div>
                        </div>
                        <!-- Note -->
                        <Skeleton width="100%" height="5rem" borderRadius="0.5rem" class="mt-4" />
                    </div>
                </div>

                <!-- Right Column Skeleton (Pricing) -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm sticky top-6">
                        <div class="flex items-center gap-2 mb-6">
                            <Skeleton shape="circle" size="1.25rem" />
                            <Skeleton width="10rem" height="1.25rem" />
                        </div>
                        <div class="flex flex-col gap-4">
                            <!-- Subtotal -->
                            <div class="flex items-center justify-between">
                                <Skeleton width="5rem" height="0.875rem" />
                                <Skeleton width="6rem" height="0.875rem" />
                            </div>
                            <Divider />
                            <!-- Discount -->
                            <div class="flex items-center justify-between">
                                <Skeleton width="5rem" height="0.875rem" />
                                <Skeleton width="5rem" height="0.875rem" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                                <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                            </div>
                            <Divider />
                            <!-- Shipping -->
                            <div class="flex items-center justify-between">
                                <Skeleton width="6rem" height="0.875rem" />
                                <Skeleton width="5rem" height="0.875rem" />
                            </div>
                            <Skeleton width="100%" height="2rem" borderRadius="0.375rem" />
                            <Divider />
                            <!-- Grand Total -->
                            <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
                            <!-- Buttons -->
                            <Skeleton width="100%" height="2.75rem" borderRadius="0.5rem" class="mt-2" />
                            <Skeleton width="100%" height="2.25rem" borderRadius="0.5rem" />
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Real Content -->
        <template v-else>
            <!-- Top Bar -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="router.push({ name: 'orders' })" />
                    <div>
                        <h1 class="text-xl font-bold text-surface-800 dark:text-surface-100">
                            {{ isEdit ? t('common.titles.edit', { entity: t('entity.order') }) : t('common.labels.create_entity', { entity: t('entity.order') }) }}
                        </h1>
                        <p class="text-sm text-surface-500 dark:text-surface-400" v-if="orderReference">{{ orderReference }}</p>
                    </div>
                </div>
                <Tag v-if="isEdit" :value="t(`order.statuses.${record.status}`)" :severity="record.status === 'delivered' ? 'success' : record.status === 'cancelled' || record.status === 'returned' ? 'danger' : 'info'" class="text-sm" />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column (2/3) -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <!-- Customer Section -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                            <i class="pi pi-user text-primary"></i>
                            {{ t('order.sections.customer_info') }}
                        </h3>

                        <!-- Customer AutoComplete (full width) -->
                        <div class="mb-4 flex items-center gap-2 mb-8">
                            <AutoComplete
                                v-model="selectedCustomer"
                                :suggestions="filteredCustomers"
                                optionLabel="name"
                                :placeholder="t('order.labels.search_customer')"
                                :disabled="loading.isFormSending"
                                :loading="customerSearching"
                                fluid
                                :minLength="1"
                                class="flex-1"
                                :invalid="!!authStore.errors?.['customer_id']?.[0]"
                                @complete="searchCustomer"
                                @item-select="onCustomerSelect"
                                @clear="onCustomerClear"
                            >
                                <template #option="{ option }">
                                    <div class="flex items-start gap-3 py-2 w-full">
                                        <!-- Avatar -->
                                        <InitialsAvatar :name="option.name" />
                                        <!-- Info -->
                                        <div class="flex-1 min-w-0">
                                            <!-- Name + Reputation badge -->
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class="font-semibold text-sm">{{ option.name }}</span>
                                                <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none" :style="{ color: getReputation(option).color, backgroundColor: getReputation(option).bgColor }">
                                                    {{ getReputation(option).label }}
                                                </span>
                                            </div>
                                            <!-- Contact details -->
                                            <div class="flex items-center gap-3 text-[11px] text-surface-400 mb-1.5">
                                                <span class="flex items-center gap-1"><i class="pi pi-phone text-[10px]"></i> {{ getCustomerDetails(option).phone }}</span>
                                                <span v-if="getCustomerDetails(option).email" class="flex items-center gap-1"><i class="pi pi-envelope text-[10px]"></i> {{ getCustomerDetails(option).email }}</span>
                                            </div>
                                            <div v-if="getCustomerDetails(option).address" class="text-[11px] text-surface-400 flex items-center gap-1 mb-1.5"><i class="pi pi-map-marker text-[10px]"></i> {{ getCustomerDetails(option).address }}</div>
                                            <!-- Reputation bar -->
                                            <ReputationBadge :reputation="option.reputation" size="sm" />
                                        </div>
                                    </div>
                                </template>
                            </AutoComplete>
                            <Message v-if="authStore.errors?.['customer_id']?.[0]" severity="error" size="small">{{ authStore.errors?.['customer_id']?.[0] }}</Message>
                            <Button v-if="!selectedCustomer" :label="t('order.labels.or_create_new')" icon="pi pi-user-plus" severity="primary" class="" @click="openCustomerDialog" />
                        </div>

                        <!-- Customer Info Card (after selection) -->
                        <div v-if="selectedCustomer && selectedCustomer.id" class="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 mb-8">
                            <!-- Header: avatar + name + close -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="relative">
                                        <InitialsAvatar :name="selectedCustomer.name" size="lg" />
                                        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full"></span>
                                    </div>
                                    <span class="font-bold text-surface-800 dark:text-surface-100">{{ selectedCustomer.name }}</span>
                                </div>
                                <Button
                                    icon="pi pi-times"
                                    text
                                    rounded
                                    size="small"
                                    severity="secondary"
                                    @click="
                                        onCustomerClear();
                                        selectedCustomer = null;
                                    "
                                />
                            </div>

                            <!-- Body: Customer Details (left) + Reputation (right) -->
                            <div class="flex items-start gap-6">
                                <!-- Left: Contact Info -->
                                <div class="flex-1 flex flex-col gap-2 text-xs text-surface-600 dark:text-surface-300">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-phone text-surface-400 text-[11px]"></i>
                                        <span>{{ getCustomerDetails(selectedCustomer).phone }}</span>
                                    </div>
                                    <div v-if="getCustomerDetails(selectedCustomer).email" class="flex items-center gap-2">
                                        <i class="pi pi-envelope text-surface-400 text-[11px]"></i>
                                        <span>{{ getCustomerDetails(selectedCustomer).email }}</span>
                                    </div>
                                    <div v-if="getCustomerDetails(selectedCustomer).address" class="flex items-center gap-2">
                                        <i class="pi pi-map-marker text-surface-400 text-[11px]"></i>
                                        <span>{{ getCustomerDetails(selectedCustomer).address }}</span>
                                    </div>
                                </div>

                                <!-- Right: Reputation -->
                                <div class="w-1/2">
                                    <ReputationBadge :reputation="selectedCustomer.reputation" size="md" />
                                </div>
                            </div>
                        </div>

                        <!-- Shop, Shipper, Shipping Type, Source -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Shop -->
                            <div>
                                <FloatLabel variant="on" class="w-full">
                                    <Select
                                        id="shop_id"
                                        v-model="record.shop_id"
                                        :options="shops"
                                        optionLabel="name"
                                        optionValue="id"
                                        dropdownIcon="pi pi-shopping-bag"
                                        :disabled="loading.isFormSending"
                                        class="w-full"
                                        filter
                                        :invalid="!!authStore.errors?.['shop_id']?.[0]"
                                        @change="
                                            () => {
                                                authStore.clearErrors(['shop_id']);
                                                onBlurField('shop_id');
                                            }
                                        "
                                    >
                                        <template #value="{ value }">
                                            <div v-if="value" class="flex items-center gap-2">
                                                <img v-if="shops.find((s: any) => s.id === value)?.files?.[0]?.url" :src="shops.find((s: any) => s.id === value)?.files?.[0]?.url" alt="shop logo" class="w-6 h-6 rounded object-cover" />
                                                <i v-else class="pi pi-shopping-bag text-sm text-surface-400"></i>
                                                <span>{{ shops.find((s: any) => s.id === value)?.name }}</span>
                                            </div>
                                        </template>
                                        <template #option="{ option }">
                                            <div class="flex items-center gap-2">
                                                <img v-if="option.files?.[0]?.url" :src="option.files[0].url" alt="shop logo" class="w-6 h-6 rounded object-cover" />
                                                <i v-else class="pi pi-shopping-bag text-sm text-surface-400"></i>
                                                <span>{{ option.name }}</span>
                                            </div>
                                        </template>
                                    </Select>
                                    <label for="shop_id">{{ t('order.columns.shop') }}</label>
                                </FloatLabel>
                                <Message v-if="authStore.errors?.['shop_id']?.[0]" severity="error" size="small">{{ authStore.errors?.['shop_id']?.[0] }}</Message>
                            </div>

                            <!-- Shipper -->
                            <div>
                                <FloatLabel variant="on" class="w-full">
                                    <Select
                                        id="shipper_id"
                                        v-model="record.shipper_id"
                                        :options="shippers"
                                        optionLabel="name"
                                        optionValue="id"
                                        dropdownIcon="pi pi-truck"
                                        :disabled="loading.isFormSending"
                                        class="w-full"
                                        filter
                                        :invalid="!!authStore.errors?.['shipper_id']?.[0]"
                                        @change="
                                            () => {
                                                authStore.clearErrors(['shipper_id']);
                                                onBlurField('shipper_id');
                                            }
                                        "
                                    >
                                        <template #value="{ value }">
                                            <div v-if="value" class="flex items-center gap-2">
                                                <i class="pi pi-truck text-sm text-surface-400"></i>
                                                <span>{{ shippers.find((s: any) => s.id === value)?.name }}</span>
                                            </div>
                                        </template>
                                        <template #option="{ option }">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-truck text-sm text-surface-400"></i>
                                                <span>{{ option.name }}</span>
                                            </div>
                                        </template>
                                    </Select>
                                    <label for="shipper_id">{{ t('order.columns.shipper') }}</label>
                                </FloatLabel>
                                <Message v-if="authStore.errors?.['shipper_id']?.[0]" severity="error" size="small">{{ authStore.errors?.['shipper_id']?.[0] }}</Message>
                            </div>

                            <!-- Shipping Type -->
                            <div>
                                <SelectButton
                                    v-model="record.shipping_type"
                                    :options="shippingTypeOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    :allowEmpty="false"
                                    :pt="{
                                        root: { class: 'flex gap-2 border-none bg-transparent' },
                                        pcToggleButton: {
                                            root: ({ context }: any) => ({
                                                class: [
                                                    'flex-1 flex items-center justify-center gap-2 !rounded-xl !border-2 transition-all duration-200',
                                                    context.active ? '!border-primary !bg-primary/5 dark:!bg-primary/10 shadow-sm' : '!border-surface-200 dark:!border-surface-700 hover:!border-surface-300 !bg-transparent'
                                                ]
                                            })
                                        }
                                    }"
                                >
                                    <template #option="{ option }">
                                        <i :class="option.icon" class="text-base" />
                                        <span class="text-xs font-bold uppercase tracking-wider">{{ option.label }}</span>
                                    </template>
                                </SelectButton>
                            </div>

                            <!-- Source with icon -->
                            <div>
                                <FloatLabel variant="on" class="w-full">
                                    <Select
                                        id="source"
                                        v-model="record.source"
                                        :options="sourceOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        :disabled="loading.isFormSending"
                                        class="w-full"
                                        :invalid="!!authStore.errors?.['source']?.[0]"
                                        @change="
                                            () => {
                                                authStore.clearErrors(['source']);
                                                onBlurField('source');
                                            }
                                        "
                                    >
                                        <template #value="{ value }">
                                            <div v-if="value" class="flex items-center gap-2">
                                                <i :class="sourceOptions.find((s) => s.value === value)?.icon" class="text-sm"></i>
                                                <span>{{ sourceOptions.find((s) => s.value === value)?.label }}</span>
                                            </div>
                                        </template>
                                        <template #option="{ option }">
                                            <div class="flex items-center gap-2">
                                                <i :class="option.icon" class="text-sm text-surface-500"></i>
                                                <span>{{ option.label }}</span>
                                            </div>
                                        </template>
                                    </Select>
                                    <label for="source">{{ t('order.columns.source') }}</label>
                                </FloatLabel>
                                <Message v-if="authStore.errors?.['source']?.[0]" severity="error" size="small">{{ authStore.errors?.['source']?.[0] }}</Message>
                            </div>
                        </div>
                    </div>

                    <!-- Products Section -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold flex items-center gap-2">
                                <i class="pi pi-box text-primary"></i>
                                {{ t('order.sections.order_products') }}
                            </h3>
                        </div>

                        <!-- Product Search Bar -->
                        <div class="mb-4">
                            <div class="flex items-center border-2 border-primary/30 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                                <div class="flex items-center gap-2 px-4 text-surface-400">
                                    <i class="pi pi-search text-sm"></i>
                                </div>
                                <AutoComplete
                                    v-model="productSearch"
                                    :suggestions="filteredProducts"
                                    optionLabel="name"
                                    :placeholder="t('order.placeholders.scan_or_search')"
                                    class="flex-1 border-none"
                                    :pt="{ pcInputText: { root: { class: 'border-none shadow-none w-full' } } }"
                                    @complete="searchProduct"
                                    @item-select="(e: any) => addProductFromSearch(e.value)"
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
                                                :value="(option.available_stock ?? option.total_stock ?? 0) > 0 ? `${option.available_stock ?? option.total_stock} ${t('common.labels.in_stock')}` : t('common.labels.out_of_stock')"
                                                :severity="(option.available_stock ?? option.total_stock ?? 0) > 5 ? 'success' : (option.available_stock ?? option.total_stock ?? 0) > 0 ? 'warn' : 'danger'"
                                                class="text-[10px]"
                                            />
                                        </div>
                                    </template>
                                </AutoComplete>
                                <Button label="ENTER" severity="secondary" text size="small" class="mr-2 font-bold text-xs" @click="" />
                            </div>
                        </div>

                        <!-- Products Table -->
                        <div v-if="record.items.length > 0" class="overflow-x-auto">
                            <table class="w-full text-sm table-fixed">
                                <thead>
                                    <tr class="border-b border-surface-200 dark:border-surface-700">
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-10">#</th>
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider">{{ t('order.columns.product') }}</th>
                                        <th class="text-left py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-24">{{ t('order.columns.sku') }}</th>
                                        <th class="text-center py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-28">{{ t('order.columns.qty') }}</th>
                                        <th class="text-right py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-32">{{ t('order.columns.price') }}</th>
                                        <th class="text-right py-3 px-2 font-semibold text-surface-500 dark:text-surface-400 uppercase text-xs tracking-wider w-28">{{ t('order.columns.item_total') }}</th>
                                        <th class="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in record.items" :key="index" class="border-b border-surface-100 dark:border-surface-800">
                                        <td class="py-4 px-2 text-surface-400 font-medium">{{ index + 1 }}</td>
                                        <td class="py-4 px-2">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                    <i class="pi pi-box text-sm text-surface-400"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-semibold text-surface-800 dark:text-surface-100 truncate">{{ item.product_name || 'Custom Item' }}</span>
                                                        <Tag
                                                            v-if="item.stock !== undefined && item.stock !== null"
                                                            :value="item.stock > 0 ? `${item.stock}` : t('common.labels.out_of_stock')"
                                                            :severity="item.stock > 5 ? 'success' : item.stock > 0 ? 'warn' : 'danger'"
                                                            class="text-[10px]"
                                                        />
                                                    </div>
                                                    <div v-if="item.variant_label" class="text-xs text-surface-400">{{ item.variant_label }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2">
                                            <span class="text-xs font-mono text-surface-500 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ item.sku || '—' }}</span>
                                        </td>
                                        <td class="py-4 px-2">
                                            <div class="flex items-center justify-center gap-0">
                                                <button
                                                    type="button"
                                                    class="w-8 h-8 flex items-center justify-center rounded-l-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                                                    @click="updateItemQuantity(index, -1)"
                                                    :disabled="item.quantity <= 1"
                                                >
                                                    <i class="pi pi-minus text-[10px]"></i>
                                                </button>
                                                <div class="w-10 h-8 flex items-center justify-center border-y border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 font-bold text-sm">{{ item.quantity }}</div>
                                                <button
                                                    type="button"
                                                    class="w-8 h-8 flex items-center justify-center rounded-r-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                                                    @click="updateItemQuantity(index, 1)"
                                                >
                                                    <i class="pi pi-plus text-[10px]"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2 text-right">
                                            <InputNumber v-model="item.unit_price" mode="currency" currency="DZD" locale="fr-DZ" class="w-28" size="small" :min="0" />
                                        </td>
                                        <td class="py-4 px-2 text-right font-bold text-surface-800 dark:text-surface-100">{{ (item.quantity * item.unit_price).toLocaleString('fr-DZ') }} DA</td>
                                        <td class="py-4 px-2 text-center">
                                            <button type="button" class="text-surface-400 hover:text-red-500 transition-colors cursor-pointer" @click="removeItem(index)">
                                                <i class="pi pi-times text-sm"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <!-- Scan to add row -->
                                    <tr class="text-surface-300 dark:text-surface-600">
                                        <td class="py-4 px-2">{{ record.items.length + 1 }}</td>
                                        <td colspan="6" class="py-4 px-2 italic text-sm">{{ t('order.placeholders.scan_to_add') }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Empty state -->
                        <div v-else class="text-center py-6 text-surface-400">
                            <p class="text-sm">{{ t('order.messages.no_products') }}</p>
                        </div>

                        <Message v-if="authStore.errors?.['items']?.[0]" severity="error" size="small" class="mt-2">{{ t(authStore.errors?.['items']?.[0]) }}</Message>
                    </div>

                    <!-- Order Details Section -->
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm">
                        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                            <i class="pi pi-file-edit text-primary"></i>
                            {{ t('order.sections.order_details') }}
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Status with icon -->
                            <div>
                                <FloatLabel variant="on" class="w-full">
                                    <Select id="status" v-model="record.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="loading.isFormSending" class="w-full">
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
                                    <label for="status">{{ t('order.columns.status') }}</label>
                                </FloatLabel>
                            </div>

                            <!-- Payment Status -->
                            <div>
                                <SelectButton
                                    v-model="record.payment_status"
                                    :options="paymentStatusOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    :allowEmpty="false"
                                    :pt="{
                                        root: { class: 'flex gap-2 border-none bg-transparent' },
                                        pcToggleButton: {
                                            root: ({ context }: any) => {
                                                const isActive = context.active;
                                                const isPaid = record.payment_status === 'paid';
                                                return {
                                                    class: [
                                                        'flex-1 flex items-center justify-center gap-2 !rounded-xl !border-2 transition-all duration-200',
                                                        isActive && isPaid
                                                            ? '!border-green-500 !bg-green-50 dark:!bg-green-900/20 !text-green-700 dark:!text-green-400 shadow-sm'
                                                            : isActive && !isPaid
                                                              ? '!border-amber-500 !bg-amber-50 dark:!bg-amber-900/20 !text-amber-700 dark:!text-amber-400 shadow-sm'
                                                              : '!border-surface-200 dark:!border-surface-700 hover:!border-surface-300 !bg-transparent !text-surface-400'
                                                    ]
                                                };
                                            },
                                            label: { class: '!text-inherit' },
                                            icon: { class: '!text-inherit' }
                                        }
                                    }"
                                >
                                    <template #option="{ option }">
                                        <i :class="option.icon" class="text-base" />
                                        <span class="text-xs font-bold uppercase">{{ option.label }}</span>
                                    </template>
                                </SelectButton>
                            </div>
                        </div>

                        <!-- Note -->
                        <div class="mt-4">
                            <FloatLabel variant="on" class="w-full">
                                <Textarea id="note" v-model="record.note" :disabled="loading.isFormSending" class="w-full" rows="3" autoResize @blur="() => onBlurField('note')" />
                                <label for="note">{{ t('order.columns.note') }}</label>
                            </FloatLabel>
                        </div>
                    </div>
                </div>

                <!-- Right Column (1/3) — Pricing Summary -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 shadow-sm sticky top-6">
                        <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
                            <i class="pi pi-calculator text-primary"></i>
                            {{ t('order.sections.pricing_summary') }}
                        </h3>

                        <div class="flex flex-col gap-4">
                            <!-- Subtotal -->
                            <div class="flex items-center justify-between">
                                <span class="text-surface-600 dark:text-surface-400">{{ t('order.labels.subtotal') }}</span>
                                <span class="font-semibold">{{ subtotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <Divider />

                            <!-- Discount -->
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-surface-600 dark:text-surface-400">{{ t('order.labels.discount') }}</span>
                                    <span class="text-red-500 font-semibold">-{{ discountAmount.toLocaleString('fr-DZ') }} DA</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <InputNumber v-model="record.discount_percentage" suffix="%" :min="0" :max="100" size="small" :placeholder="t('order.placeholders.percentage')" class="w-full" @blur="() => onBlurField('discount_percentage')" />
                                    <InputNumber
                                        v-model="record.discount_amount"
                                        mode="currency"
                                        currency="DZD"
                                        locale="fr-DZ"
                                        :min="0"
                                        size="small"
                                        :placeholder="t('order.placeholders.amount')"
                                        class="w-full"
                                        :disabled="record.discount_percentage > 0"
                                        @blur="() => onBlurField('discount_amount')"
                                    />
                                </div>
                            </div>

                            <Divider />

                            <!-- Shipping Fee -->
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-surface-600 dark:text-surface-400">{{ t('order.labels.shipping_fee') }}</span>
                                    <span class="font-semibold">{{ record.shipping_fee.toLocaleString('fr-DZ') }} DA</span>
                                </div>
                                <InputNumber v-model="record.shipping_fee" mode="currency" currency="DZD" locale="fr-DZ" :min="0" size="small" class="w-full" @blur="() => onBlurField('shipping_fee')" />
                            </div>

                            <Divider />

                            <!-- Grand Total -->
                            <div class="flex items-center justify-between bg-primary/5 dark:bg-primary/10 rounded-lg px-4 py-3">
                                <span class="text-lg font-bold text-primary">{{ t('order.labels.grand_total') }}</span>
                                <span class="text-xl font-black text-primary">{{ grandTotal.toLocaleString('fr-DZ') }} DA</span>
                            </div>

                            <!-- Action Button -->
                            <Button :label="isEdit ? t('common.labels.update') : t('order.labels.create_order')" :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'" class="w-full mt-2" :loading="loading.isFormSending" @click="saveOrder" />

                            <Button :label="t('common.labels.cancel')" icon="pi pi-times" class="w-full" severity="secondary" text @click="router.push({ name: 'orders' })" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
