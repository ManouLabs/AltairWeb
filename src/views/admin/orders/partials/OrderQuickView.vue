<script setup lang="ts">
import InitialsAvatar from '@/components/common/InitialsAvatar.vue';
import ReputationBadge from '@/components/common/ReputationBadge.vue';
import { useOrderHelpers } from '@/composables/useOrderHelpers';
import { useOrderService } from '@/services/useOrderService';
import type { OrderActivity, OrderData } from '@/types/order';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import OrderQuickViewSkeleton from './OrderQuickViewSkeleton.vue';

const { t } = useI18n();
const router = useRouter();

const props = defineProps<{
    orderId: number | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const order = ref<OrderData | null>(null);
const activities = ref<OrderActivity[]>([]);
const loading = ref(false);

// ── Fetch order + activities when orderId changes ──────────
watch(
    () => props.orderId,
    async (id) => {
        if (!id) return;
        loading.value = true;
        order.value = null;
        activities.value = [];

        try {
            const [orderRes, actRes] = await Promise.all([useOrderService.getOrder(id), useOrderService.getOrderActivities(id)]);
            order.value = orderRes.data;
            activities.value = actRes.activities;
        } catch (error) {
            console.error('Failed to load order details', error);
        } finally {
            loading.value = false;
        }
    }
);

// ── Helpers ─────────────────────────────────────────────────
function editOrder(): void {
    visible.value = false;
    if (order.value) {
        router.push({ name: 'order-edit', params: { id: order.value.id } });
    }
}

function formatCurrency(value: number | string): string {
    return Number(value).toLocaleString('fr-DZ') + ' DA';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatShortDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const { statusSeverity, statusIcon, paymentSeverity, paymentIcon, sourceIcon, shippingTypeIcon } = useOrderHelpers();

// ── Timeline helpers ────────────────────────────────────────
function timelineColor(event: string): string {
    if (event === 'created') return '#10B981';
    if (event === 'updated') return '#3B82F6';
    if (event === 'deleted') return '#EF4444';
    return '#6B7280';
}

function timelineIcon(event: string): string {
    if (event === 'created') return 'pi pi-plus-circle';
    if (event === 'updated') return 'pi pi-pencil';
    if (event === 'deleted') return 'pi pi-trash';
    return 'pi pi-info-circle';
}

function changedFields(activity: OrderActivity): { field: string; oldVal: unknown; newVal: unknown }[] {
    const attrs = activity.properties?.attributes ?? {};
    const old = activity.properties?.old ?? {};
    const fields: { field: string; oldVal: unknown; newVal: unknown }[] = [];

    for (const key of Object.keys(attrs)) {
        if (old[key] !== undefined && old[key] !== attrs[key]) {
            fields.push({ field: key, oldVal: old[key], newVal: attrs[key] });
        }
    }
    return fields;
}

function getCustomerPhone(order: OrderData): string | null {
    if (order.customer?.phone) return order.customer.phone;
    const phoneMethod = order.customer?.contactMethods?.find((c: any) => c.type === 'mobile' || c.type === 'phone');
    return phoneMethod?.value ?? null;
}

function getCustomerEmail(order: OrderData): string | null {
    if (order.customer?.email) return order.customer.email;
    const emailMethod = order.customer?.contactMethods?.find((c: any) => c.type === 'email');
    return emailMethod?.value ?? null;
}
</script>

<template>
    <Drawer v-model:visible="visible" position="right" :header="order?.reference ?? '...'" :style="{ width: '32rem' }" :blockScroll="true">
        <!-- Skeleton while loading -->
        <OrderQuickViewSkeleton v-if="loading" />

        <!-- Content when loaded -->
        <div v-else-if="order" class="flex flex-col gap-5">
            <!-- ── Header: Status + Reference + Date ────────────── -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Tag :value="t(`order.statuses.${order.status}`)" :severity="statusSeverity(order.status)" :icon="statusIcon(order.status)" class="!py-1.5 !px-2.5 !capitalize" />
                    <Tag :value="t(`order.payment_statuses.${order.payment_status}`)" :severity="paymentSeverity(order.payment_status)" :icon="paymentIcon(order.payment_status)" class="!py-1.5 !px-2.5 !capitalize" />
                </div>
                <Button :label="t('order.quick_view.edit_order')" icon="pi pi-pencil" severity="primary" @click="editOrder" />
            </div>
            <div class="text-xs text-surface-400">{{ formatDate(order.created_at) }}</div>

            <Divider />

            <!-- ── Order Journey (Timeline) ─────────────────────── -->
            <div class="w-full">
                <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3"><i class="pi pi-history mr-1.5"></i>{{ t('order.quick_view.order_journey') }}</h4>
                <div v-if="activities.length === 0" class="text-sm text-surface-400 italic py-2">
                    {{ t('order.quick_view.no_activities') }}
                </div>
                <Timeline v-else :value="activities" align="left" class="ml-1 customized-timeline">
                    <template #marker="{ item }">
                        <span class="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs" :style="{ backgroundColor: timelineColor(item.event) }">
                            <i :class="timelineIcon(item.event)"></i>
                        </span>
                    </template>
                    <template #content="{ item }">
                        <div class="mb-3">
                            <div class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ item.description }}</div>
                            <div class="text-[11px] text-surface-400 mt-0.5">{{ formatShortDate(item.created_at) }} · {{ item.causer }}</div>
                            <!-- Changed fields -->
                            <div v-if="changedFields(item).length" class="mt-1.5 flex flex-col gap-1">
                                <div v-for="change in changedFields(item)" :key="change.field" class="text-[11px] flex items-center gap-1 text-surface-500 dark:text-surface-400">
                                    <span class="font-medium capitalize">{{ change.field.replace(/_/g, ' ') }}:</span>
                                    <span class="line-through text-surface-400">{{ change.oldVal }}</span>
                                    <i class="pi pi-arrow-right text-[9px]"></i>
                                    <span class="font-semibold text-surface-700 dark:text-surface-200">{{ change.newVal }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Timeline>
            </div>
            <Divider />
            <div class="flex gap-4">
                <!-- ── Summary Card ─────────────────────────────────── -->
                <div class="w-full">
                    <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3"><i class="pi pi-calculator mr-1.5"></i>{{ t('order.quick_view.summary') }}</h4>
                    <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col gap-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-surface-500">{{ t('order.columns.subtotal') }}</span>
                            <span>{{ formatCurrency(order.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-surface-500">{{ t('order.columns.shipping_fee') }}</span>
                            <span>{{ formatCurrency(order.shipping_fee) }}</span>
                        </div>
                        <div v-if="Number(order.discount_amount) > 0" class="flex justify-between text-sm">
                            <span class="text-surface-500">{{ t('order.quick_view.discount') }}{{ order.discount_percentage ? ` (${order.discount_percentage}%)` : '' }}</span>
                            <span class="text-red-500">-{{ formatCurrency(order.discount_amount) }}</span>
                        </div>
                        <Divider class="my-1" />
                        <div class="flex justify-between text-sm font-bold">
                            <span>{{ t('order.quick_view.grand_total') }}</span>
                            <span class="text-primary">{{ formatCurrency(order.total) }}</span>
                        </div>
                    </div>
                </div>
                <!-- ── Customer Card ────────────────────────────────── -->
                <div v-if="order.customer" class="w-full">
                    <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3"><i class="pi pi-user mr-1.5"></i>{{ t('order.quick_view.customer') }}</h4>
                    <div class="flex items-start gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-xl">
                        <InitialsAvatar :name="order.customer.name" size="lg" />
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm text-surface-800 dark:text-surface-100">{{ order.customer.name }}</div>
                            <div class="flex flex-col gap-0.5 mt-1 text-xs text-surface-500">
                                <span v-if="getCustomerPhone(order)" class="flex items-center gap-1"> <i class="pi pi-phone text-[10px]"></i> {{ getCustomerPhone(order) }} </span>
                                <span v-if="getCustomerEmail(order)" class="flex items-center gap-1 truncate"> <i class="pi pi-envelope text-[10px]"></i> {{ getCustomerEmail(order) }} </span>
                            </div>
                            <div class="mt-2">
                                <ReputationBadge :reputation="order.customer.reputation as any" size="sm" />
                            </div>
                            <!-- Address -->
                            <div v-if="order.customer.addresses?.length" class="mt-2 text-xs text-surface-400 flex items-start gap-1">
                                <i class="pi pi-map-marker text-[10px] mt-0.5"></i>
                                <span>{{ order.customer.addresses[0].street }}{{ order.customer.addresses[0].city ? ', ' + order.customer.addresses[0].city.name : '' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Divider />

            <!-- ── Items List ───────────────────────────────────── -->
            <div>
                <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3"><i class="pi pi-box mr-1.5"></i>{{ t('order.quick_view.items') }} ({{ order.items?.length ?? 0 }})</h4>
                <div class="flex flex-col gap-2">
                    <div v-for="item in order.items" :key="item.id" class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-xl">
                        <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800">
                            <i class="pi pi-box text-surface-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{{ item.product_name }}</div>
                            <div class="text-[11px] text-surface-400 flex items-center gap-2">
                                <span v-if="item.variant_label">{{ item.variant_label }}</span>
                                <span v-if="item.sku" class="font-mono">{{ item.sku }}</span>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <div class="text-xs text-surface-500">{{ item.quantity }} × {{ formatCurrency(item.unit_price) }}</div>
                            <div class="text-sm font-semibold">{{ formatCurrency(item.total) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <Divider />

            <!-- ── Order Details ────────────────────────────────── -->
            <div>
                <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3"><i class="pi pi-info-circle mr-1.5"></i>{{ t('order.quick_view.details') }}</h4>
                <div class="flex flex-col gap-2.5 text-sm">
                    <div v-if="order.source" class="flex items-center justify-between">
                        <span class="text-surface-500">{{ t('order.quick_view.source') }}</span>
                        <span class="flex items-center gap-1.5">
                            <i :class="sourceIcon(order.source)" class="text-surface-500"></i>
                            {{ t(`order.sources.${order.source}`) }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-surface-500">{{ t('order.quick_view.shipping_type') }}</span>
                        <span class="flex items-center gap-1.5">
                            <i :class="shippingTypeIcon(order.shipping_type)" class="text-surface-500"></i>
                            {{ t(`order.shipping_types.${order.shipping_type}`) }}
                        </span>
                    </div>
                    <div v-if="order.shop" class="flex items-center justify-between">
                        <span class="text-surface-500">{{ t('order.quick_view.shop') }}</span>
                        <span class="flex items-center gap-1.5">
                            <i class="pi pi-shop text-surface-500"></i>
                            {{ order.shop.name }}
                        </span>
                    </div>
                    <div v-if="order.shipper" class="flex items-center justify-between">
                        <span class="text-surface-500">{{ t('order.quick_view.shipper') }}</span>
                        <span class="flex items-center gap-1.5">
                            <i class="pi pi-truck text-surface-500"></i>
                            {{ order.shipper.name }}
                        </span>
                    </div>
                    <div v-if="order.tracking" class="flex items-center justify-between">
                        <span class="text-surface-500">{{ t('order.quick_view.tracking') }}</span>
                        <span class="font-mono text-xs">{{ order.tracking }}</span>
                    </div>
                    <div v-if="order.note" class="mt-1">
                        <span class="text-surface-500 block mb-1">{{ t('order.quick_view.note') }}</span>
                        <div class="text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 rounded-lg p-2.5 italic">
                            {{ order.note }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Drawer>
</template>
<style lang="scss">
@media screen and (max-width: 960px) {
    ::v-deep(.customized-timeline) {
        .p-timeline-event:nth-child(even) {
            flex-direction: row;

            .p-timeline-event-content {
                text-align: left;
            }
        }

        .p-timeline-event-opposite {
            flex: 0;
        }
    }
}
.customized-timeline .p-timeline-event-opposite {
    display: none !important;
}
</style>
