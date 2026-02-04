<script setup>
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { findRecordIndex, humanizeDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const loadingStore = useLoading();
const loadingActiveId = ref(null);
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();

const record = ref(null);
const records = ref([]);
const subscription = ref(null);
const searchQuery = ref('');

const filteredRecords = computed(() => {
    if (!searchQuery.value) return records.value;
    const query = searchQuery.value.toLowerCase();
    return records.value.filter((shop) => {
        // Search in name
        if (shop.name?.toLowerCase().includes(query)) return true;
        // Search in description
        if (shop.description?.toLowerCase().includes(query)) return true;
        // Search in address
        if (shop.addresses?.[0]?.street?.toLowerCase().includes(query)) return true;
        if (shop.addresses?.[0]?.city?.name?.toLowerCase().includes(query)) return true;
        if (shop.addresses?.[0]?.region?.name?.toLowerCase().includes(query)) return true;
        // Search in contacts (phone, email)
        if (shop.contactMethods?.some((c) => c.value?.toLowerCase().includes(query))) return true;
        return false;
    });
});

// Debounced search with loading state
const performSearch = debounce(() => {
    loadingStore.stopDataLoading();
}, 200);

watch(searchQuery, () => {
    loadingStore.startDataLoading();
    performSearch();
});

function subscribeToEcho() {
    const shopsChannel = Echo.private(`data-stream.shops${authStore.user.account_id}`);
    subscription.value = shopsChannel.listen('DataStream', (event) => {
        console.log('Received Echo event for shops:', event);
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event) {
    switch (event.action) {
        case ACTIONS.DELETE:
            event.data.forEach((id) => {
                const index = findRecordIndex(records, id);
                if (index !== -1) records.value.splice(index, 1);
            });
            break;
        case ACTIONS.UPDATE: {
            const index = findRecordIndex(records, event.data.id);
            if (index !== -1) {
                records.value[index] = event.data;
            }
            break;
        }
        case ACTIONS.STORE: {
            const exists = records.value.some((r) => r.id === event.data.id);
            if (!exists) {
                records.value.unshift(event.data);
            }
            break;
        }
        default:
            console.error('Unhandled action', event.action);
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = {
        name: null,
        description: null,
        active: true,
        addresses: [{ street: '', region: null, city: null, main: true }],
        contactMethods: { phone: null, email: null, whatsapp: null, website: null, linkedin: null, tiktok: null, facebook: null, instagram: null },
        file: null
    };
    openDialog();
}

function editRecord(row) {
    authStore.errors = {};
    record.value = row;
    openDialog();
}

const openDialog = () => {
    const isEdit = !!record.value?.id;
    dialog.open(formComponent, {
        props: {
            header: isEdit ? t('common.titles.edit', { entity: t('entity.shop') }) : t('common.titles.add', { entity: t('entity.shop') }),
            style: { width: '50vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        data: { record: record.value, action: isEdit ? ACTIONS.EDIT : ACTIONS.CREATE },
        onClose: (result) => {
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

function confirmDeleteRecord(event, shopIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: shopIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.shops') }) : t('common.confirmations.delete.message', { entity: t('entity.shop') }),
        icon: 'pi pi-info-circle',
        rejectProps: { label: t('common.labels.cancel'), severity: 'secondary', icon: 'pi pi-times', outlined: true },
        acceptProps: { label: t('common.labels.delete'), icon: 'pi pi-trash', severity: 'danger' },
        accept: () => {
            loading.value = true;
            useShopService
                .deleteShops(shopIds)
                .then(() => {
                    shopIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'shop', 'tc');
                    loading.value = false;
                })
                .catch((error) => {
                    console.error('Error deleting shops', error);
                    loading.value = false;
                });
        }
    });
}
function toggleActive(shopId) {
    loadingActiveId.value = shopId;
    loadingStore.startPageLoading();
    useShopService
        .toggleActiveShop(shopId)
        .then((result) => {
            const index = findRecordIndex(records, shopId);
            records.value[index].active = !records.value[index].active;
            showToast('success', ACTIONS.EDIT, 'shop', 'tc');
        })
        .catch((error) => {
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

const fetchRecords = () => {
    loadingStore.startDataLoading();
    useShopService
        .getShops()
        .then((response) => {
            records.value = response.data;
        })
        .catch((error) => {
            console.error('Error fetching shops', error);
        })
        .finally(() => {
            loadingStore.stopDataLoading();
        });
};

function getSocialIcon(type) {
    const iconMap = {
        whatsapp: 'pi pi-whatsapp',
        website: 'pi pi-globe',
        linkedin: 'pi pi-linkedin',
        tiktok: 'pi pi-tiktok',
        facebook: 'pi pi-facebook',
        instagram: 'pi pi-instagram'
    };
    return iconMap[type] || 'pi pi-link';
}

function getSocialLink(contact) {
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
    <div class="card shadow-glow">
        <div class="flex items-center">
            <Toolbar class="w-full" :pt="{ root: { style: 'border:none !important; padding:0 !important;' } }">
                <template #start>
                    <div>
                        <h2 class="text-xl font-bold">{{ t('common.titles.manage', { entity: t('entity.shop') }) }}</h2>
                        <span class="text-gray-500">{{ t('shop.labels.manage_subtitle') }}</span>
                    </div>
                </template>

                <template #end>
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="searchQuery" :placeholder="t('common.placeholders.search')" />
                        </IconField>
                        <Button v-if="authStore.hasPermission('create_shops')" v-tooltip.top="t('common.tooltips.add', { entity: t('entity.shop') })" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" @click="addRecord" outlined />
                    </div>
                </template>
            </Toolbar>
        </div>
    </div>
    <div v-if="loadingStore.isDataLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n">
            <Panel class="border-none h-full">
                <template #header>
                    <div class="flex items-center gap-2">
                        <Skeleton shape="circle" width="80px" height="80px" class="mr-2" />
                        <Skeleton width="120px" height="32px" />
                    </div>
                </template>
                <template #footer>
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <Skeleton width="32px" height="32px" borderRadius="50%" />
                            <Skeleton width="32px" height="32px" borderRadius="50%" />
                            <Skeleton width="32px" height="32px" borderRadius="50%" />
                        </div>
                        <Skeleton width="100px" height="20px" />
                    </div>
                </template>
                <template #icons>
                    <Skeleton width="90px" height="32px" borderRadius="16px" />
                </template>
                <div class="mt-2">
                    <Skeleton width="100%" height="24px" class="mb-2" />
                    <Skeleton width="60%" height="20px" class="mb-2" />
                    <Skeleton width="80%" height="20px" />
                </div>
            </Panel>
        </div>
    </div>
    <div v-else-if="filteredRecords.length > 0" class="card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 shadow-glow">
        <div v-for="record in filteredRecords" :key="record.id">
            <Panel :class="['border-none h-full', record.active ? 'bg-emerald-50 dark:bg-emerald-900' : 'bg-red-50 dark:bg-red-900']">
                <template #header>
                    <div class="flex items-center gap-2">
                        <Image :src="record.files && record.files.length > 0 ? record.files[0].url : '/themes/shop-place-holder.svg'" alt="shop logo" width="80" preview />
                        <div class="flex flex-col">
                            <span class="font-bold text-lg text-surface-700 dark:text-surface-400">{{ record.name }}</span>
                            <span class="text-sm text-surface-500 dark:text-surface-400">{{ humanizeDate(record.created_at, t) }}</span>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-1">
                            <a
                                v-for="(contact, key) in record.contactMethods.filter((c) => ['whatsapp', 'website', 'linkedin', 'tiktok', 'facebook', 'instagram'].includes(c.type))"
                                :key="key"
                                :href="getSocialLink(contact)"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button :icon="getSocialIcon(contact.type)" text rounded severity="secondary" size="small" v-tooltip.top="contact.type.charAt(0).toUpperCase() + contact.type.slice(1)" />
                            </a>
                        </div>
                        <div class="flex items-center gap-2">
                            <Button v-if="authStore.hasPermission('view_shops')" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.shop') })" icon="pi pi-eye" text @click="editRecord(record)" severity="secondary" :disabled="loading" />
                            <Button v-if="authStore.hasPermission('update_shops')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.shop') })" icon="pi pi-pencil" text @click="editRecord(record)" :disabled="loading" />
                            <Button
                                v-if="authStore.hasPermission('delete_shops')"
                                v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.shop') })"
                                icon="pi pi-trash"
                                text
                                severity="danger"
                                @click="confirmDeleteRecord($event, [record.id])"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                </template>
                <template #icons>
                    <ActiveToggleButton :active="record.active" entity="shop" :loading="loadingActiveId === record.id" @toggle="toggleActive(record.id)" />
                </template>

                <div class="mt-2 relative">
                    <div v-if="record.description" class="text-surface-600 dark:text-surface-300">
                        {{ record.description }}
                    </div>
                    <div v-if="record.addresses[0] && record.addresses.length > 0" class="flex space-x-2 items-start mt-4">
                        <i class="pi pi-map-marker text-primary-700 dark:bg-primary-700 dark:text-primary-100 mt-1"></i>
                        <span>{{ record.addresses[0].street }} {{ record.addresses[0].city?.name }} {{ record.addresses[0].region?.name }}</span>
                    </div>
                    <div v-for="(contact, key) in record.contactMethods.filter((c) => ['phone', 'email'].includes(c.type))" :key="key" class="flex space-x-2 items-start mt-2">
                        <i
                            :class="{
                                'pi-phone': contact.type === 'phone',
                                'pi-envelope': contact.type === 'email'
                            }"
                            class="pi text-primary-700 dark:bg-primary-700 dark:text-primary-100 mt-1"
                        />
                        <span class="text-surface-700 dark:text-surface-300">{{ contact.value }}</span>
                    </div>
                </div>
            </Panel>
        </div>
    </div>
    <div class="card flex items-center justify-center shadow-glow" v-else-if="searchQuery && filteredRecords.length === 0">
        <p class="text-surface-700 dark:text-surface-300">{{ t('shop.labels.no_shop_found') }}</p>
    </div>
    <div class="card flex items-center justify-center shadow-glow" v-else>
        <p class="text-surface-700 dark:text-surface-300">{{ t('shop.labels.no_shops') }}</p>
    </div>
</template>
