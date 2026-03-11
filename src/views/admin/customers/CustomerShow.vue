<script setup lang="ts">
import { useCustomerService } from '@/services/useCustomerService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import dayjs from '@/plugins/dayjs';
import type { CustomerData, Address, City, Region, ContactMethod } from '@/types/customer';
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import InitialsAvatar from '@/components/common/InitialsAvatar.vue';
import { useReputation } from '@/composables/useReputation';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loadingStore = useLoading();
const { t } = useI18n();
const { showToast } = useShowToast();

const customer = ref<CustomerData | null>(null);
const loading = ref(true);

// Block dialog state
const blockDialogVisible = ref(false);
const blockingReason = ref('');

onMounted(async () => {
    try {
        const id = Number(route.params.id);
        const response = await useCustomerService.getCustomer(id);
        customer.value = response.data;
    } catch (error) {
        console.error('Failed to load customer', error);
    } finally {
        loading.value = false;
        loadingStore.stopPageLoading();
    }
});

// --- Helpers (reused from Customers.vue) ---

function getAddressText(addresses: Address[]): string {
    if (!addresses || addresses.length === 0) return '';
    const addr = addresses[0];
    const parts: string[] = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city && typeof addr.city === 'object' && 'name' in addr.city) parts.push((addr.city as City).name);
    if (addr.region && typeof addr.region === 'object' && 'name' in addr.region) parts.push((addr.region as Region).name);
    return parts.join(', ');
}

function getPhone(contactMethods: ContactMethod[]): string | null {
    if (!contactMethods) return null;
    const phone = contactMethods.find((c) => c.type === 'phone');
    return phone?.value || null;
}

function getEmail(contactMethods: ContactMethod[]): string | null {
    if (!contactMethods) return null;
    const email = contactMethods.find((c) => c.type === 'email');
    return email?.value || null;
}

// --- Reputation (from API) ---

const { mapReputation } = useReputation();

const reputation = computed(() => {
    return mapReputation(customer.value?.reputation);
});

// --- Real order stats (from API) ---

const orderStats = computed(() => customer.value?.order_stats ?? {
    total_spent: 0,
    total_orders: 0,
    delivered_orders: 0,
    success_rate: 0,
    avg_order_value: 0,
});

const recentOrders = computed(() => customer.value?.recent_orders ?? []);

// Map order status to PrimeVue Tag severity
function statusSeverity(status: string): string {
    const map: Record<string, string> = {
        pending: 'warn',
        confirmed: 'info',
        shipping: 'info',
        delivered: 'success',
        cancelled: 'danger',
        returned: 'danger',
    };
    return map[status] ?? 'secondary';
}

function statusLabel(status: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
}

const isBlocked = computed(() => customer.value?.status === 'blocked');

const cardClass = computed(() =>
    isBlocked.value
        ? '!shadow-sm !rounded-3xl !border !bg-[#fff1f2] !border-[#ffe4e6] dark:!bg-[rgba(244,63,94,0.08)] dark:!border-[rgba(244,63,94,0.2)]'
        : '!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl'
);

function goBack(): void {
    router.push({ name: 'customers' });
}

function editCustomer(): void {
    router.push({ name: 'customers' });
}

// --- Block / Unblock ---

function openBlockDialog(): void {
    if (!customer.value) return;

    if (customer.value.status === 'blocked') {
        // Unblock directly
        toggleBlock(false);
    } else {
        // Show dialog to get reason
        blockingReason.value = '';
        blockDialogVisible.value = true;
    }
}

async function confirmBlock(): Promise<void> {
    if (blockingReason.value.length < 10) return;
    blockDialogVisible.value = false;
    await toggleBlock(true, blockingReason.value);
}

async function toggleBlock(blocked: boolean, reason?: string): Promise<void> {
    if (!customer.value) return;
    loadingStore.startPageLoading();
    try {
        const res = await useCustomerService.blockCustomer(customer.value.id, blocked, reason);
        customer.value.status = res.data.status;
        customer.value.status_label = res.data.status_label;
        customer.value.blocking_reason = res.data.blocking_reason;
        showToast('success', ACTIONS.UPDATE, 'customer', 'tc');
    } catch (error) {
        showToast('error', ACTIONS.UPDATE, 'customer', 'tc', error);
    } finally {
        loadingStore.stopPageLoading();
    }
}
</script>

<template>
    <div>
        <!-- Page Header (always visible, matches other pages) -->
        <PageHeader icon="pi pi-id-card" icon-color="#8B5CF6" :title="t('common.labels.view') + ' ' + t('entity.customer')" :description="t('customer.labels.manage_subtitle')">
            <template #actions>
                <Button :label="t('customer.show.back_to_customers')" icon="pi pi-arrow-left" outlined severity="secondary" @click="goBack" />
                <Button v-if="customer && authStore.hasPermission('update_customers')" :label="t('customer.show.edit_profile')" icon="pi pi-user-edit" severity="primary" @click="editCustomer" />
            </template>
        </PageHeader>

        <!-- Skeleton Loading -->
        <template v-if="loading">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="space-y-6">
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #content>
                            <div class="flex flex-col items-center gap-4">
                                <Skeleton shape="circle" size="6rem" />
                                <Skeleton width="60%" height="1.5rem" />
                                <Skeleton width="40%" height="1rem" />
                                <Divider />
                                <div class="w-full space-y-3">
                                    <Skeleton width="100%" height="1rem" />
                                    <Skeleton width="100%" height="1rem" />
                                    <Skeleton width="100%" height="1rem" />
                                </div>
                                <Divider />
                                <div class="flex gap-2 w-full">
                                    <Skeleton width="100%" height="2.5rem" />
                                </div>
                            </div>
                        </template>
                    </Card>
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #content>
                            <Skeleton width="40%" height="1rem" class="mb-4" />
                            <div class="space-y-4">
                                <div>
                                    <Skeleton width="100%" height="0.5rem" borderRadius="9999px" />
                                </div>
                                <div>
                                    <Skeleton width="100%" height="0.5rem" borderRadius="9999px" />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <div class="grid grid-cols-3 gap-4">
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl" v-for="n in 3" :key="n">
                            <template #content>
                                <Skeleton width="60%" height="0.75rem" class="mb-3" />
                                <Skeleton width="80%" height="1.5rem" />
                            </template>
                        </Card>
                    </div>
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #content>
                            <Skeleton width="100%" height="16rem" />
                        </template>
                    </Card>
                </div>
            </div>
        </template>

        <!-- Main Content -->
        <template v-else-if="customer">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- LEFT PANEL -->
                <div class="space-y-6">
                    <!-- Profile Card -->
                    <Card :class="cardClass">
                        <template #content>
                            <div class="flex flex-col items-center">
                                <!-- Avatar -->
                                <div class="relative">
                                    <div class="flex items-center justify-center rounded-full !shadow-lg !border-4 !border-white dark:!border-surface-800" style="width: 6rem; height: 6rem">
                                        <InitialsAvatar :name="customer.name" size="lg" class="!w-full !h-full !text-2xl" />
                                    </div>
                                    <!-- Online status indicator -->
                                    <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-surface-800" :class="customer.status === 'active' ? 'bg-green-500' : 'bg-red-500'"></span>
                                </div>

                                <!-- Name & Reputation Tag -->
                                <h2 class="text-lg font-bold m-0 mt-4">{{ customer.name }}</h2>
                                <Tag class="mt-2" :value="reputation.label + ' ' + t('customer.reputation.title')" :style="{ backgroundColor: reputation.bgColor, color: reputation.color, fontWeight: '600' }" rounded />

                                <Divider />

                                <!-- Contact Info -->
                                <div class="w-full space-y-3">
                                    <div class="flex items-center gap-3 text-sm" v-if="getPhone(customer.contactMethods)">
                                        <i class="pi pi-phone text-surface-400 text-sm"></i>
                                        <span class="text-surface-700 dark:text-surface-200 font-medium">{{ getPhone(customer.contactMethods) }}</span>
                                    </div>
                                    <div class="flex items-center gap-3 text-sm" v-if="getAddressText(customer.addresses)">
                                        <i class="pi pi-map-marker text-surface-400 text-sm"></i>
                                        <span class="text-surface-700 dark:text-surface-200 font-medium">{{ getAddressText(customer.addresses) }}</span>
                                    </div>
                                    <div class="flex items-center gap-3 text-sm" v-if="getEmail(customer.contactMethods)">
                                        <i class="pi pi-envelope text-surface-400 text-sm"></i>
                                        <span class="text-surface-700 dark:text-surface-200 font-medium">{{ getEmail(customer.contactMethods) }}</span>
                                    </div>
                                </div>

                                <Divider />

                                <!-- Blocking Reason -->
                                <div v-if="isBlocked && customer.blocking_reason" class="w-full rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 mb-2">
                                    <div class="flex items-start gap-2">
                                        <i class="pi pi-ban text-red-500 text-sm mt-0.5"></i>
                                        <div>
                                            <span class="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">{{ t('customer.columns.blocking_reason') }}</span>
                                            <p class="text-sm text-red-700 dark:text-red-300 mt-1 leading-relaxed">{{ customer.blocking_reason }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex gap-2 w-full">
                                    <Button
                                        v-if="authStore.hasPermission('update_customers')"
                                        :label="customer.status === 'blocked' ? t('customer.show.unblock') : t('customer.show.block')"
                                        :icon="customer.status === 'blocked' ? 'pi pi-lock-open' : 'pi pi-ban'"
                                        :severity="customer.status === 'blocked' ? 'success' : 'danger'"
                                        outlined
                                        class="flex-1"
                                        size="small"
                                        @click="openBlockDialog"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Reputation Summary Card -->
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #title>
                            <span class="text-sm font-bold uppercase tracking-wider">{{ t('customer.show.reputation_summary') }}</span>
                        </template>
                        <template #content>
                            <div class="space-y-4">
                                <!-- Delivered -->
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-xs font-medium text-surface-600 dark:text-surface-300">{{ t('customer.show.delivered_orders') }}</span>
                                        <span class="text-xs font-semibold" :style="{ color: reputation.color }">{{ reputation.percentage !== null ? reputation.percentage + '%' : '-' }}</span>
                                    </div>
                                    <ProgressBar :value="reputation.percentage ?? 0" :showValue="false" style="height: 0.5rem" :pt="{ value: { style: { backgroundColor: reputation.color } } }" />
                                </div>

                                <!-- Failed / Returned -->
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-xs font-medium text-surface-600 dark:text-surface-300">{{ t('customer.show.failed_returned') }}</span>
                                        <span class="text-xs font-semibold text-red-500">{{ reputation.percentage !== null ? 100 - reputation.percentage + '%' : '-' }}</span>
                                    </div>
                                    <ProgressBar :value="reputation.percentage !== null ? 100 - reputation.percentage : 0" :showValue="false" style="height: 0.5rem" severity="danger" />
                                </div>
                            </div>

                            <!-- Reputation note -->
                            <p class="text-xs text-surface-400 dark:text-surface-500 italic mt-4 leading-relaxed">"{{ t('customer.show.reputation_note') }}"</p>
                        </template>
                    </Card>
                </div>

                <!-- RIGHT PANEL -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Total Spent -->
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                            <template #content>
                                <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{ t('customer.show.total_spent') }}</span>
                                <div class="flex items-end gap-2 mt-2">
                                    <span class="text-2xl font-bold">DA {{ orderStats.total_spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                                </div>
                            </template>
                        </Card>

                        <!-- Success Rate -->
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                            <template #content>
                                <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{ t('customer.show.success_rate') }}</span>
                                <div class="flex items-end gap-2 mt-2">
                                    <span class="text-2xl font-bold">{{ orderStats.success_rate }}%</span>
                                </div>
                            </template>
                        </Card>

                        <!-- Avg Order Value -->
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                            <template #content>
                                <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{ t('customer.show.avg_order_value') }}</span>
                                <div class="flex items-end gap-2 mt-2">
                                    <span class="text-2xl font-bold">DA {{ orderStats.avg_order_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <!-- Recent Orders Card -->
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #title>
                            <div class="flex items-center justify-between">
                                <span class="text-base font-bold">{{ t('customer.show.recent_orders') }}</span>
                                <Button :label="t('customer.show.view_all')" text severity="info" size="small" />
                            </div>
                        </template>
                        <template #content>
                            <DataTable v-if="recentOrders.length" :value="recentOrders" size="small" stripedRows>
                                <Column field="reference" :header="t('customer.show.order_id')" class="font-semibold">
                                    <template #body="{ data }">
                                        #{{ data.reference }}
                                    </template>
                                </Column>
                                <Column field="status" :header="t('customer.show.status')">
                                    <template #body="{ data }">
                                        <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
                                    </template>
                                </Column>
                                <Column field="date" :header="t('customer.show.date')">
                                    <template #body="{ data }">
                                        {{ dayjs(data.date).format('ll') }}
                                    </template>
                                </Column>
                                <Column field="total" :header="t('customer.show.amount')" class="text-right">
                                    <template #body="{ data }">
                                        <span class="font-semibold">DA {{ data.total.toFixed(2) }}</span>
                                    </template>
                                </Column>
                            </DataTable>
                            <div v-else class="flex flex-col items-center justify-center py-8 gap-3">
                                <i class="pi pi-shopping-cart text-3xl text-surface-300 dark:text-surface-600"></i>
                                <p class="text-sm text-surface-400">{{ t('customer.show.no_orders_yet') }}</p>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </template>

        <!-- Block Reason Dialog -->
        <Dialog v-model:visible="blockDialogVisible" :header="t('customer.show.block') + ' ' + t('entity.customer')" modal :style="{ width: '28rem' }">
            <div class="space-y-4">
                <p class="text-sm text-surface-600 dark:text-surface-300">{{ t('customer.labels.block_warning') }}</p>
                <Textarea
                    v-model="blockingReason"
                    :placeholder="t('customer.columns.blocking_reason')"
                    rows="3"
                    class="w-full"
                    autofocus
                />
                <small v-if="blockingReason.length > 0 && blockingReason.length < 10" class="text-red-500 text-xs">
                    {{ t('customer.labels.blocking_reason_min') }}
                </small>
            </div>
            <template #footer>
                <Button :label="t('common.labels.cancel')" severity="secondary" outlined @click="blockDialogVisible = false" />
                <Button :label="t('customer.show.block')" icon="pi pi-ban" severity="danger" :disabled="blockingReason.length < 10" @click="confirmBlock" />
            </template>
        </Dialog>
    </div>
</template>
