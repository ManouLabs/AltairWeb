<script setup lang="ts">
import { useCustomerService } from '@/services/useCustomerService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import dayjs from '@/plugins/dayjs';
import type { CustomerData, Address, City, Region, ContactMethod } from '@/types/customer';
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loadingStore = useLoading();
const { t } = useI18n();

const customer = ref<CustomerData | null>(null);
const loading = ref(true);

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

// --- Reputation (fake data — orders module not yet built) ---

interface ReputationData {
    level: 'excellent' | 'good' | 'medium' | 'poor' | 'new';
    label: string;
    percentage: number | null;
    delivered: number;
    returned: number;
    color: string;
    bgColor: string;
}

const reputation = computed<ReputationData>(() => {
    if (!customer.value) {
        return { level: 'new', label: t('customer.reputation.levels.new'), percentage: null, delivered: 0, returned: 0, color: '#64748b', bgColor: '#f1f5f9' };
    }
    const fakeReputations: ReputationData[] = [
        { level: 'excellent', label: t('customer.reputation.levels.excellent'), percentage: 92, delivered: 47, returned: 4, color: '#10b981', bgColor: '#d1fae5' },
        { level: 'good', label: t('customer.reputation.levels.good'), percentage: 78, delivered: 35, returned: 10, color: '#3b82f6', bgColor: '#dbeafe' },
        { level: 'medium', label: t('customer.reputation.levels.medium'), percentage: 56, delivered: 22, returned: 17, color: '#f59e0b', bgColor: '#fef3c7' },
        { level: 'poor', label: t('customer.reputation.levels.low'), percentage: 32, delivered: 8, returned: 17, color: '#ef4444', bgColor: '#fee2e2' },
        { level: 'new', label: t('customer.reputation.levels.new'), percentage: null, delivered: 0, returned: 0, color: '#64748b', bgColor: '#f1f5f9' }
    ];
    return fakeReputations[customer.value.id % fakeReputations.length];
});

// --- Fake order stats (orders module not yet built) ---

interface FakeOrder {
    id: string;
    status: string;
    statusSeverity: string;
    date: string;
    amount: number;
}

const fakeOrders = computed<FakeOrder[]>(() => {
    if (!customer.value) return [];
    return [
        { id: `#ORD-2024-${8831 + customer.value.id}`, status: 'DELIVERED', statusSeverity: 'success', date: '2024-10-24', amount: 240.0 },
        { id: `#ORD-2024-${8822 + customer.value.id}`, status: 'IN TRANSIT', statusSeverity: 'info', date: '2024-10-23', amount: 125.5 },
        { id: `#ORD-2024-${8791 + customer.value.id}`, status: 'DELIVERED', statusSeverity: 'success', date: '2024-10-20', amount: 89.0 },
        { id: `#ORD-2024-${8745 + customer.value.id}`, status: 'FAILED', statusSeverity: 'danger', date: '2024-10-18', amount: 310.2 }
    ];
});

const totalSpent = computed(() => {
    return fakeOrders.value.reduce((sum, o) => sum + o.amount, 0);
});

const successRate = computed(() => {
    if (reputation.value.percentage !== null) return reputation.value.percentage;
    return 0;
});

const avgOrderValue = computed(() => {
    if (fakeOrders.value.length === 0) return 0;
    return totalSpent.value / fakeOrders.value.length;
});

function goBack(): void {
    router.push({ name: 'customers' });
}

function editCustomer(): void {
    // Navigate back to customer list — the edit dialog is triggered from there
    router.push({ name: 'customers' });
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
                    <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                        <template #content>
                            <div class="flex flex-col items-center">
                                <!-- Avatar -->
                                <div class="relative">
                                    <Avatar
                                        icon="pi pi-user"
                                        size="xlarge"
                                        shape="circle"
                                        :style="{ backgroundColor: '#d1fae5', color: '#059669', width: '6rem', height: '6rem', fontSize: '2rem' }"
                                        class="!shadow-lg !border-4 !border-white dark:!border-surface-800"
                                    />
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
                                    <span class="text-2xl font-bold">${{ totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                                    <Tag value="↑ 12%" severity="success" rounded class="!text-xs" />
                                </div>
                            </template>
                        </Card>

                        <!-- Success Rate -->
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                            <template #content>
                                <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{ t('customer.show.success_rate') }}</span>
                                <div class="flex items-end gap-2 mt-2">
                                    <span class="text-2xl font-bold">{{ successRate }}%</span>
                                    <Tag v-if="successRate > 0" value="↓ 4.2%" severity="danger" rounded class="!text-xs" />
                                </div>
                            </template>
                        </Card>

                        <!-- Avg Order Value -->
                        <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-3xl">
                            <template #content>
                                <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{ t('customer.show.avg_order_value') }}</span>
                                <div class="flex items-end gap-2 mt-2">
                                    <span class="text-2xl font-bold">${{ avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
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
                            <DataTable :value="fakeOrders" size="small" stripedRows>
                                <Column field="id" :header="t('customer.show.order_id')" class="font-semibold" />
                                <Column field="status" :header="t('customer.show.status')">
                                    <template #body="{ data }">
                                        <Tag :value="data.status" :severity="data.statusSeverity" />
                                    </template>
                                </Column>
                                <Column field="date" :header="t('customer.show.date')">
                                    <template #body="{ data }">
                                        {{ dayjs(data.date).format('ll') }}
                                    </template>
                                </Column>
                                <Column field="amount" :header="t('customer.show.amount')" class="text-right">
                                    <template #body="{ data }">
                                        <span class="font-semibold">${{ data.amount.toFixed(2) }}</span>
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </div>
            </div>
        </template>
    </div>
</template>
