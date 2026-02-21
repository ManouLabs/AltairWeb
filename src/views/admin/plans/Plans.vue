<script setup lang="ts">
import ActiveToggleButton from '@/components/ActiveToggleButton.vue';
import { usePlanService } from '@/services/usePlanService';
import type { Plan, PlanFormData } from '@/types/plan';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import FormHeader from '@/components/FormHeader.vue';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

const { t } = useI18n();
const loadingStore = useLoading();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();

const records = ref<Plan[]>([]);
const record = ref<Plan | PlanFormData | null>(null);
const dataLoaded = ref(false);
const loadingActiveId = ref<number | null>(null);
const loadingRecommendedId = ref<number | null>(null);
const subscription = ref<ReturnType<typeof Echo.private> | null>(null);

async function initialize() {
    loadingStore.startPageLoading();
    try {
        const response = await usePlanService.getPlans({ rows: 100, page: 1, sortField: 'id', sortOrder: 1 });
        records.value = response.data;
        dataLoaded.value = true;
    } catch (error) {
        console.error('Error loading plans:', error);
    } finally {
        loadingStore.stopPageLoading();
    }
}

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.plans').listen('DataStream', (event: any) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: any) {
    switch (event.action) {
        case ACTIONS.DELETE:
            handleDelete(event);
            break;
        case ACTIONS.UPDATE:
            handleUpdate(event);
            break;
        case ACTIONS.STORE:
            handleStore(event);
            break;
        default:
            console.error(`Unhandled action: ${event.action}`);
    }
}

function handleDelete(event: any) {
    event.data.forEach((id: number) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    });
}

function handleUpdate(event: any) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
    }
}

function handleStore(event: any) {
    const exists = records.value.some((r) => r.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = {
        name: '',
        icon: null,
        color: null,
        description: '',
        active: true,
        recommended: false,
        orders: 0,
        products: 0,
        users: 0,
        shops: 0,
        roles: 0,
        categories: 0,
        shippers: 0,
        customers: 0,
        contact_methods: 0,
        monthly_price: 0,
        yearly_price: 0,
        level: 1
    } as PlanFormData;
    openDialog();
}

function editRecord(plan: Plan) {
    authStore.errors = {};
    record.value = { ...plan };
    openDialog();
}

const openDialog = () => {
    dialog.open(formComponent, {
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
            record: record.value,
            action: record.value?.id ? ACTIONS.EDIT : ACTIONS.CREATE,
            headerProps: computed(() => ({
                title: record.value?.id ? t('common.titles.edit', { entity: t('entity.plan') }) : t('common.titles.add', { entity: t('entity.plan') }),
                description: t('plan.form.subtitle'),
                icon: record.value?.id ? 'pi pi-book' : 'pi pi-plus-circle',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result: any) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        showToast('success', ACTIONS.CREATE, 'plan', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        showToast('success', ACTIONS.EDIT, 'plan', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function toggleActive(planId: number) {
    loadingActiveId.value = planId;
    loadingStore.startPageLoading();
    usePlanService
        .toggleActivePlan(planId)
        .then(() => {
            const index = findRecordIndex(records, planId);
            records.value[index].active = !records.value[index].active;
            showToast('success', ACTIONS.EDIT, 'plan', 'tc');
        })
        .catch((error) => {
            console.error('Error updating plan status:', error);
        })
        .finally(() => {
            loadingActiveId.value = null;
            loadingStore.stopPageLoading();
        });
}

function toggleRecommended(planId: number) {
    loadingRecommendedId.value = planId;
    loadingStore.startPageLoading();
    usePlanService
        .toggleRecommendedPlan(planId)
        .then((response) => {
            records.value.forEach((p) => {
                p.recommended = false;
            });
            const index = findRecordIndex(records, planId);
            if (index !== -1) {
                records.value[index] = response.data;
            }
            showToast('success', ACTIONS.EDIT, 'plan', 'tc');
        })
        .catch((error) => {
            console.error('Error updating recommended status:', error);
        })
        .finally(() => {
            loadingRecommendedId.value = null;
            loadingStore.stopPageLoading();
        });
}

function confirmDeleteRecord(event: MouseEvent, planId: number) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: t('common.confirmations.delete.message', { entity: t('entity.plan') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.labels.cancel'),
            severity: 'secondary',
            icon: 'pi pi-times',
            outlined: true
        },
        acceptProps: {
            label: t('common.labels.delete'),
            icon: 'pi pi-trash',
            severity: 'danger'
        },
        accept: () => {
            usePlanService
                .deletePlans([planId])
                .then(() => {
                    const index = findRecordIndex(records, planId);
                    if (index !== -1) {
                        records.value.splice(index, 1);
                    }
                    showToast('success', ACTIONS.DELETE, 'plan', 'tc');
                })
                .catch(() => {
                    showToast('error', ACTIONS.DELETE, 'plan', 'tc');
                });
        }
    });
}

function formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-US').format(value);
}

function formatLimit(value: number | null | undefined): string {
    if (value === null || value === undefined) return t('plan.page.unlimited');
    return value.toLocaleString();
}

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <DynamicDialog />

        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                    <span class="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-3xl">
                        <i class="pi pi-credit-card text-primary text-lg"></i>
                    </span>
                    {{ t('entity.plans') }}
                </h1>
                <p class="text-surface-500 dark:text-surface-400 mt-1 text-sm">{{ t('plan.page.subtitle') }}</p>
            </div>
            <Button v-tooltip.top="t('common.tooltips.add', { entity: t('entity.plan') })" :label="`${t('common.labels.new')} ${t('entity.plan')}`" icon="pi pi-plus" :disabled="!dataLoaded" @click="addRecord" />
        </div>

        <!-- Skeleton Loader -->
        <div v-if="!dataLoaded" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div v-for="i in 4" :key="i" class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-8 animate-pulse">
                <div class="flex flex-col items-center mb-6">
                    <div class="w-16 h-16 bg-surface-200 dark:bg-surface-700 rounded-3xl mb-4"></div>
                    <div class="h-6 bg-surface-200 dark:bg-surface-700 rounded w-28 mb-2"></div>
                    <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-44"></div>
                </div>
                <div class="space-y-4 mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
                        <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded flex-1"></div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
                        <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
                        <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
                        <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3"></div>
                    </div>
                </div>
                <div class="h-px bg-surface-200 dark:bg-surface-700 mb-5"></div>
                <div class="flex items-end justify-between mb-5">
                    <div>
                        <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-16 mb-2"></div>
                        <div class="h-9 bg-surface-200 dark:bg-surface-700 rounded w-28"></div>
                    </div>
                    <div class="h-7 bg-surface-200 dark:bg-surface-700 rounded-full w-20"></div>
                </div>
                <div class="flex gap-2 mb-3">
                    <div class="h-11 bg-surface-200 dark:bg-surface-700 rounded-3xl flex-1"></div>
                    <div class="h-11 bg-surface-200 dark:bg-surface-700 rounded-3xl w-11"></div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="records.length === 0" class="flex flex-col items-center justify-center py-20 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700">
            <i class="pi pi-credit-card text-5xl text-surface-300 dark:text-surface-600 mb-4"></i>
            <p class="text-lg font-semibold text-surface-600 dark:text-surface-400">{{ t('plan.page.no_plans') }}</p>
            <p class="text-sm text-surface-400 dark:text-surface-500 mb-6">{{ t('plan.page.no_plans_hint') }}</p>
            <Button :label="t('common.labels.add')" icon="pi pi-plus" severity="primary" @click="addRecord" />
        </div>

        <!-- Plan Cards Grid — 4 per row -->
        <div v-else class="plan-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            <div
                v-for="plan in records"
                :key="plan.id"
                class="plan-card group relative rounded-3xl bg-surface-0 dark:bg-surface-900 transition-all duration-300 overflow-hidden flex flex-col"
                :class="[plan.recommended ? 'recommended-card shadow-xl scale-[1.07] z-10' : 'border border-surface-200 dark:border-surface-700 hover:shadow-md', !plan.active && 'opacity-55']"
            >
                <div class="p-8 pb-0 flex flex-col flex-1">
                    <!-- Icon centered at top -->
                    <div class="flex justify-center mb-5">
                        <div
                            class="w-16 h-16 rounded-2xl flex items-center justify-center"
                            :style="{
                                backgroundColor: (plan.color || '#6366F1') + '14',
                                color: plan.color || '#6366F1'
                            }"
                        >
                            <i :class="plan.icon || 'pi pi-star'" class="text-3xl"></i>
                        </div>
                    </div>

                    <!-- Plan Name centered — bigger -->
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 text-2xl text-center mb-1.5">
                        {{ plan.name }}
                    </h3>

                    <!-- Description centered -->
                    <p class="text-base text-surface-500 dark:text-surface-400 text-center mb-7 leading-relaxed min-h-[48px]">
                        {{ plan.description || '' }}
                    </p>

                    <!-- Feature List with verified checkmark icons — bigger text -->
                    <div class="space-y-4 mb-7 flex-1">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-verified text-lg" :style="{ color: plan.color || '#6366F1' }"></i>
                            <span class="text-base text-surface-700 dark:text-surface-300">
                                <strong>Level {{ plan.level }}</strong>
                            </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="pi pi-verified text-lg" :style="{ color: plan.color || '#6366F1' }"></i>
                            <span class="text-base text-surface-700 dark:text-surface-300"> {{ formatLimit(plan.orders) }} {{ t('plan.columns.orders') }} / {{ t('plan.page.per_month').replace('/', '').trim() }} </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="pi pi-verified text-lg" :style="{ color: plan.color || '#6366F1' }"></i>
                            <span class="text-base text-surface-700 dark:text-surface-300"> {{ formatLimit(plan.shops) }} {{ plan.shops === 1 ? 'Storefront' : 'Storefronts' }} </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="pi pi-verified text-lg" :style="{ color: plan.color || '#6366F1' }"></i>
                            <span class="text-base text-surface-700 dark:text-surface-300"> {{ formatLimit(plan.products) }} {{ t('plan.columns.products') }} </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="pi pi-verified text-lg" :style="{ color: plan.color || '#6366F1' }"></i>
                            <span class="text-base text-surface-700 dark:text-surface-300"> {{ formatLimit(plan.users) }} {{ t('plan.columns.users') }} </span>
                        </div>
                    </div>
                </div>

                <!-- Bottom section -->
                <div class="px-8 pb-7">
                    <!-- Divider -->
                    <div class="border-t border-surface-200 dark:border-surface-700 mb-5"></div>

                    <!-- Pricing + Active toggle row -->
                    <div class="flex items-end justify-between mb-5">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-1.5">
                                {{ t('plan.form.section_pricing') }}
                            </p>
                            <div class="flex items-baseline gap-1">
                                <span class="text-4xl font-black text-surface-900 dark:text-surface-0">
                                    {{ formatPrice(plan.monthly_price) }}
                                </span>
                                <span class="text-lg font-semibold text-surface-400">DA</span>
                                <span class="text-base text-surface-400 font-medium">/mo</span>
                            </div>
                            <p v-if="plan.yearly_price !== null && plan.yearly_price !== undefined" class="text-sm text-surface-400 dark:text-surface-500 mt-0.5">{{ formatPrice(plan.yearly_price) }} DA billed annually</p>
                        </div>
                        <!-- ActiveToggleButton component -->
                        <ActiveToggleButton :active="plan.active" entity="plan" :loading="loadingActiveId === plan.id" @toggle="toggleActive(plan.id)" />
                    </div>

                    <!-- Quick Edit + Recommended — same row -->
                    <div class="flex items-center gap-2">
                        <!-- Quick Edit Button — takes most space -->
                        <button
                            class="quick-edit-btn flex-1 py-3 rounded-3xl font-semibold text-base flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                            :class="[
                                plan.recommended
                                    ? 'recommended-btn text-white shadow-md hover:shadow-lg hover:scale-[1.01]'
                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 bg-[#f1f5f9] dark:bg-surface-800 border-none hover:bg-[#e2e8f0] dark:hover:bg-surface-700'
                            ]"
                            @click="editRecord(plan)"
                        >
                            <i class="pi pi-pencil text-sm"></i>
                            Quick Edit
                        </button>

                        <!-- Star (Recommended) Button -->
                        <Button
                            :icon="plan.recommended ? 'pi pi-star-fill' : 'pi pi-star'"
                            :severity="plan.recommended ? 'warn' : 'secondary'"
                            :outlined="!plan.recommended"
                            rounded
                            v-tooltip.top="t('plan.columns.recommended')"
                            :loading="loadingRecommendedId === plan.id"
                            class="!w-12 !h-12 shrink-0"
                            @click="toggleRecommended(plan.id)"
                        />

                        <!-- Delete Button -->
                        <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="t('common.labels.delete')" class="!w-12 !h-12 shrink-0" @click="confirmDeleteRecord($event, plan.id)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.recommended-card {
    border: 2px solid transparent;
    background-image: linear-gradient(white, white), linear-gradient(135deg, #6366f1, #06b6d4);
    background-origin: border-box;
    background-clip: padding-box, border-box;
}

:root.app-dark .recommended-card {
    background-image: linear-gradient(var(--p-surface-900), var(--p-surface-900)), linear-gradient(135deg, #6366f1, #06b6d4);
}

.recommended-btn {
    background: linear-gradient(135deg, #06b6d4, #6366f1);
}

.recommended-btn:hover {
    background: linear-gradient(135deg, #0891b2, #4f46e5);
}
</style>
