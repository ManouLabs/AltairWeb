<script setup lang="ts">
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex, humanizeDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import type { ShopData, ShopFormData, ContactMethod } from '@/types/shop';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import FormHeader from '@/components/FormHeader.vue';

const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const loadingStore = useLoading();
const loadingActiveId = ref<number | null>(null);
const loading = ref<boolean>(false);
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();

const record = ref<ShopData | ShopFormData | null>(null);
const records = ref<ShopData[]>([]);
const subscription = ref<any>(null);
const searchQuery = ref<string>('');
const dataLoaded = ref<boolean>(false);
const regions = ref<any[]>([]);

const filteredRecords = computed<ShopData[]>(() => {
    if (!searchQuery.value) return records.value;
    const query = searchQuery.value.toLowerCase();
    return records.value.filter((shop: ShopData) => {
        // Search in name
        if (shop.name?.toLowerCase().includes(query)) return true;
        // Search in description
        if (shop.description?.toLowerCase().includes(query)) return true;
        // Search in address
        if (shop.addresses?.[0]?.street?.toLowerCase().includes(query)) return true;
        const city = shop.addresses?.[0]?.city;
        const region = shop.addresses?.[0]?.region;
        if (city && typeof city === 'object' && 'name' in city && city.name?.toLowerCase().includes(query)) return true;
        if (region && typeof region === 'object' && 'name' in region && region.name?.toLowerCase().includes(query)) return true;
        // Search in contacts (phone, email)
        if (shop.contactMethods?.some((c: ContactMethod) => c.value?.toLowerCase().includes(query))) return true;
        return false;
    });
});

// Debounced search with loading state
const performSearch = debounce((): void => {
    loadingStore.stopDataLoading();
}, 200);

import { watch } from 'vue';
watch(searchQuery, () => {
    loadingStore.startDataLoading();
    performSearch();
});

interface EchoEvent {
    action: string;
    data: ShopData | number[];
}

function subscribeToEcho(): void {
    const shopsChannel = Echo.private(`data-stream.shops${authStore.user.account_id}`);
    subscription.value = shopsChannel.listen('DataStream', (event: EchoEvent) => {
        console.log('Received Echo event for shops:', event);
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event: EchoEvent): void {
    switch (event.action) {
        case ACTIONS.DELETE:
            (event.data as number[]).forEach((id: number) => {
                const index = findRecordIndex(records, id);
                if (index !== -1) records.value.splice(index, 1);
            });
            break;
        case ACTIONS.UPDATE: {
            const data = event.data as ShopData;
            const index = findRecordIndex(records, data.id);
            if (index !== -1) {
                records.value[index] = data;
            }
            break;
        }
        case ACTIONS.STORE: {
            const data = event.data as ShopData;
            const exists = records.value.some((r: ShopData) => r.id === data.id);
            if (!exists) {
                records.value.unshift(data);
            }
            break;
        }
        default:
            console.error('Unhandled action', event.action);
    }
}

function addRecord(): void {
    authStore.errors = {};
    record.value = {
        name: null,
        description: null,
        active: true,
        addresses: [{ street: '', region: null, city: null, main: true }],
        contactMethods: { phone: null, email: null, whatsapp: null, website: null, linkedin: null, tiktok: null, facebook: null, instagram: null },
        files: null
    } as ShopFormData;
    openDialog();
}

function editRecord(row: ShopData): void {
    authStore.errors = {};
    record.value = row;
    openDialog();
}

const openDialog = (): void => {
    const isEdit = !!(record.value as ShopData)?.id;
    dialog.open(formComponent, {
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
            record: record.value,
            action: isEdit ? ACTIONS.EDIT : ACTIONS.CREATE,
            regions: regions.value,
            headerProps: computed(() => ({
                title: isEdit ? t('common.titles.edit', { entity: t('entity.shop') }) : t('common.titles.add', { entity: t('entity.shop') }),
                description: t('shop.form.subtitle'),
                icon: (record.value as ShopData)?.id ? 'pi pi-shop' : 'pi pi-plus-circle',
                iconColor: '#3B82F6'
            }))
        },
        onClose: (result: any) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        showToast('success', ACTIONS.CREATE, 'shop', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        showToast('success', ACTIONS.EDIT, 'shop', 'tc');
                        break;
                    }
                }
            }
        }
    });
};

function confirmDeleteRecord(event: MouseEvent, shopIds: number[]): void {
    confirm.require({
        modal: true,
        target: event.currentTarget as HTMLElement,
        message: shopIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.shops') }) : t('common.confirmations.delete.message', { entity: t('entity.shop') }),
        icon: 'pi pi-info-circle',
        rejectProps: { label: t('common.labels.cancel'), severity: 'secondary', icon: 'pi pi-times', outlined: true },
        acceptProps: { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger' },
        accept: () => {
            loading.value = true;
            loadingStore.startPageLoading();
            useShopService
                .deleteShops(shopIds)
                .then(() => {
                    shopIds.forEach((id: number) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'shop', 'tc');
                })
                .catch((error: any) => {
                    console.error('Error deleting shops', error);
                })
                .finally(() => {
                    loading.value = false;
                    loadingStore.stopPageLoading();
                });
        }
    });
}

function toggleActive(shopId: number): void {
    loadingActiveId.value = shopId;
    loadingStore.startPageLoading();
    useShopService
        .toggleActiveShop(shopId)
        .then(() => {
            const index = findRecordIndex(records, shopId);
            records.value[index].active = !records.value[index].active;
            showToast('success', ACTIONS.EDIT, 'shop', 'tc');
        })
        .catch((error: any) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error updating shop status');
        })
        .finally(() => {
            loadingActiveId.value = null;
            loadingStore.stopPageLoading();
        });
}

const fetchRecords = (): void => {
    loadingStore.startDataLoading();
    useShopService
        .getShops()
        .then((response) => {
            records.value = response.data;
            regions.value = response.regions || [];
        })
        .catch((error: any) => {
            console.error('Error fetching shops', error);
        })
        .finally(() => {
            loadingStore.stopDataLoading();
            loadingStore.stopPageLoading();
            dataLoaded.value = true;
        });
};

function getSocialIcon(type: string): string {
    const iconMap: Record<string, string> = {
        whatsapp: 'pi pi-whatsapp',
        website: 'pi pi-globe',
        linkedin: 'pi pi-linkedin',
        tiktok: 'pi pi-tiktok',
        facebook: 'pi pi-facebook',
        instagram: 'pi pi-instagram'
    };
    return iconMap[type] || 'pi pi-link';
}

function getSocialLink(contact: ContactMethod): string {
    const value = contact.value;
    if (!value) return '#';

    switch (contact.type) {
        case 'whatsapp':
            // Remove any non-digits and create WhatsApp link
            return `https://wa.me/${value.replace(/\D/g, '')}`;
        case 'website':
            // Add https if not present
            return value.startsWith('http') ? value : `https://${value}`;
        case 'linkedin':
            return value.startsWith('http') ? value : `https://linkedin.com/in/${value}`;
        case 'tiktok':
            return value.startsWith('http') ? value : `https://tiktok.com/@${value}`;
        case 'facebook':
            return value.startsWith('http') ? value : `https://facebook.com/${value}`;
        case 'instagram':
            return value.startsWith('http') ? value : `https://instagram.com/${value}`;
        default:
            return value;
    }
}

onMounted(() => {
    subscribeToEcho();
    fetchRecords();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening && subscription.value.stopListening('DataStream');
});
</script>

<template>
    <!-- Page Header -->
    <PageHeader icon="pi pi-shop" icon-color="#8B5CF6" :title="t('common.titles.manage', { entity: t('entity.shop') })" :description="t('shop.labels.manage_subtitle')">
        <template #actions>
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="searchQuery" :placeholder="t('common.placeholders.search')" class="w-80" />
            </IconField>
            <Button
                v-if="authStore.hasPermission('create_shops')"
                v-tooltip.top="t('common.tooltips.add', { entity: t('entity.shop') })"
                :label="`${t('common.labels.new')} ${t('entity.shop')}`"
                icon="pi pi-plus"
                :disabled="!dataLoaded"
                @click="addRecord"
            />
        </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loadingStore.isDataLoading" class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="flex flex-col rounded-3xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 relative overflow-hidden">
            <div class="p-6 flex-1">
                <!-- Header: Icon + Name/Date inline, Toggle on right -->
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <Skeleton width="56px" height="56px" borderRadius="16px" />
                        <div class="flex flex-col gap-2">
                            <Skeleton width="140px" height="20px" />
                            <Skeleton width="100px" height="14px" />
                        </div>
                    </div>
                    <Skeleton width="80px" height="32px" borderRadius="20px" />
                </div>
                <!-- Description -->
                <Skeleton width="100%" height="40px" class="mt-4" borderRadius="8px" />
                <!-- Contacts -->
                <div class="mt-4 space-y-2">
                    <Skeleton width="75%" height="16px" />
                    <Skeleton width="55%" height="16px" />
                    <Skeleton width="45%" height="16px" />
                </div>
            </div>
            <div class="flex items-center justify-between px-6 py-4 border-t border-surface-200 dark:border-surface-700">
                <div class="flex gap-2">
                    <Skeleton width="28px" height="28px" borderRadius="50%" />
                    <Skeleton width="28px" height="28px" borderRadius="50%" />
                </div>
                <div class="flex gap-1">
                    <Skeleton width="32px" height="32px" borderRadius="8px" />
                    <Skeleton width="32px" height="32px" borderRadius="8px" />
                    <Skeleton width="32px" height="32px" borderRadius="8px" />
                </div>
            </div>
        </div>
    </div>

    <!-- Shops Grid -->
    <div v-else-if="filteredRecords.length > 0" class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div
            v-for="shop in filteredRecords"
            :key="shop.id"
            class="group flex flex-col rounded-3xl border relative overflow-hidden"
            :class="[shop.active ? 'bg-[#f0fdf4] border-[#d1fae5] dark:bg-[rgba(16,185,129,0.08)] dark:border-[rgba(16,185,129,0.2)]' : 'bg-[#fff1f2] border-[#ffe4e6] dark:bg-[rgba(244,63,94,0.08)] dark:border-[rgba(244,63,94,0.2)]']"
        >
            <!-- Card Body -->
            <div class="p-6 flex-1">
                <!-- Header: Logo + Name/Date on same line, Toggle on right -->
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-0 dark:bg-surface-900 shadow-sm border"
                            :class="[shop.active ? 'text-[#10b981] border-[#d1fae5] dark:border-[rgba(16,185,129,0.3)]' : 'text-[#f43f5e] border-[#fecdd3] dark:border-[rgba(244,63,94,0.3)]']"
                        >
                            <Image v-if="shop.files && shop.files.length > 0" :src="shop.files[0].url" alt="shop logo" width="40" preview class="rounded-lg" />
                            <i v-else class="pi pi-shopping-bag text-2xl"></i>
                        </div>
                        <div class="flex flex-col">
                            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 m-0 leading-tight">{{ shop.name }}</h3>
                            <p class="flex items-center gap-1.5 mt-1 text-[11px] text-surface-500 dark:text-surface-400 font-medium">
                                <i class="pi pi-calendar text-xs text-surface-400"></i>
                                {{ t('shop.labels.since') }} {{ humanizeDate(shop.created_at, t) }}
                            </p>
                        </div>
                    </div>
                    <ActiveToggleButton :active="shop.active" entity="shop" :loading="loadingActiveId === shop.id" @toggle="toggleActive(shop.id)" />
                </div>

                <!-- Description -->
                <p v-if="shop.description" class="mt-4 text-xs text-surface-500 dark:text-surface-400 italic leading-relaxed">"{{ shop.description }}"</p>

                <!-- Contact Details -->
                <div class="mt-4 flex flex-col gap-2.5">
                    <!-- Address -->
                    <div v-if="shop.addresses && shop.addresses.length > 0 && shop.addresses[0]" class="flex items-start gap-3 text-[13px] text-surface-500 dark:text-surface-400">
                        <i class="pi pi-map-marker text-lg text-surface-400 mt-px"></i>
                        <span
                            >{{ shop.addresses[0].street }}<template v-if="shop.addresses[0].city && typeof shop.addresses[0].city === 'object' && 'name' in shop.addresses[0].city">, {{ shop.addresses[0].city.name }}</template
                            ><template v-if="shop.addresses[0].region && typeof shop.addresses[0].region === 'object' && 'name' in shop.addresses[0].region">, {{ shop.addresses[0].region.name }}</template></span
                        >
                    </div>
                    <!-- Email -->
                    <template v-for="(contact, key) in shop.contactMethods?.filter((c: ContactMethod) => c.type === 'email')" :key="'email-' + key">
                        <div class="flex items-start gap-3 text-[13px] text-surface-500 dark:text-surface-400">
                            <i class="pi pi-envelope text-lg text-surface-400 mt-px"></i>
                            <span>{{ contact.value }}</span>
                        </div>
                    </template>
                    <!-- Phone -->
                    <template v-for="(contact, key) in shop.contactMethods?.filter((c: ContactMethod) => c.type === 'phone')" :key="'phone-' + key">
                        <div class="flex items-start gap-3 text-[13px] text-surface-500 dark:text-surface-400">
                            <i class="pi pi-phone text-lg text-surface-400 mt-px"></i>
                            <span class="font-medium text-surface-700 dark:text-surface-200">{{ contact.value }}</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Card Footer -->
            <div class="flex items-center justify-between px-6 py-4 border-t" :class="[shop.active ? 'border-[rgba(16,185,129,0.1)]' : 'border-[rgba(244,63,94,0.1)]']">
                <!-- Left: Social Links -->
                <div class="flex items-center gap-3">
                    <div class="flex gap-2">
                        <a
                            v-for="(contact, key) in shop.contactMethods?.filter((c: ContactMethod) => ['whatsapp', 'website', 'linkedin', 'tiktok', 'facebook', 'instagram'].includes(c.type))"
                            :key="key"
                            :href="getSocialLink(contact)"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="w-7 h-7 flex items-center justify-center text-surface-500 dark:text-surface-400 rounded-full transition-all duration-150 hover:text-primary hover:bg-primary/10"
                            v-tooltip.top="contact.type.charAt(0).toUpperCase() + contact.type.slice(1)"
                        >
                            <i :class="getSocialIcon(contact.type)" class="text-sm"></i>
                        </a>
                    </div>
                </div>

                <!-- Right: Action Buttons -->
                <div class="flex items-center gap-1">
                    <Button
                        v-if="authStore.hasPermission('view_shops')"
                        v-tooltip.top="t('common.tooltips.view', { entity: t('entity.shop') })"
                        icon="pi pi-eye"
                        text
                        rounded
                        severity="secondary"
                        class="!w-8 !h-8"
                        @click="editRecord(shop)"
                        :disabled="loading"
                    />
                    <Button v-if="authStore.hasPermission('update_shops')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.shop') })" icon="pi pi-pencil" text rounded class="!w-8 !h-8" @click="editRecord(shop)" :disabled="loading" />
                    <Button
                        v-if="authStore.hasPermission('delete_shops')"
                        v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.shop') })"
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        class="!w-8 !h-8"
                        @click="confirmDeleteRecord($event, [shop.id])"
                        :disabled="loading"
                    />
                </div>
            </div>
        </div>
    </div>

    <!-- No Results (Search) -->
    <div v-else-if="dataLoaded && searchQuery && filteredRecords.length === 0" class="flex flex-col items-center justify-center py-16 px-8 bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm">
        <i class="pi pi-search text-4xl text-surface-300 mb-4"></i>
        <p class="text-surface-500 dark:text-surface-400 text-sm">{{ t('shop.labels.no_shop_found') }}</p>
    </div>

    <!-- No Shops -->
    <div v-else-if="dataLoaded && filteredRecords.length === 0" class="flex flex-col items-center justify-center py-16 px-8 bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm">
        <i class="pi pi-shopping-bag text-4xl text-surface-300 mb-4"></i>
        <p class="text-surface-500 dark:text-surface-400 text-sm">{{ t('shop.labels.no_shops') }}</p>
    </div>
</template>
