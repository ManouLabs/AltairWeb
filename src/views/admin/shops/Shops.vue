<script setup>
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { humanizeDate } from '@/utilities/helper';
import { ACTIONS, useShowToast } from '@/utilities/toast';

import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();

const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();
console.log('Locale in Shops.vue:', t.locale.value);
const record = ref(null);
const records = ref([]);
const subscription = ref(null);

function subscribeToEcho() {
    if (window.Echo) {
        const accountId = authStore.user?.account_id;
        if (!accountId) return;
        subscription.value = window.Echo.private(`data-stream.shops.${accountId}`).listen('DataStream', (event) => {
            handleEchoEvent(event);
        });
    }
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
                records.value[index] = normalizeShop(event.data);
                markHighlight(event.data.id, 'updated');
            }
            break;
        }
        case ACTIONS.STORE: {
            const exists = records.value.some((r) => r.id === event.data.id);
            if (!exists) {
                records.value.unshift(normalizeShop(event.data));
                markHighlight(event.data.id, 'new');
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
        contactMethods: { phone: null, email: null, whatsapp: null, website: null, linkedin: null, tiktok: null },
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
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.shop') }),
            style: { width: '50vw' },
            breakpoints: { '960px': '75vw', '640px': '90vw' },
            modal: true,
            maximizable: true
        },
        data: { record: record.value, action: record.value?.id ? ACTIONS.EDIT : ACTIONS.CREATE },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'shop', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
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
            useShopService
                .deleteShops(shopIds)
                .then(() => {
                    shopIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) records.value.splice(index, 1);
                    });
                    showToast('success', ACTIONS.DELETE, 'shop', 'tc');
                })
                .catch((error) => {
                    console.error('Error deleting shops', error);
                });
        }
    });
}
function toggleActive(shopId) {
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
        });
}
const fetchRecords = () => {
    useShopService
        .getShops()
        .then((response) => {
            records.value = response.data;
            console.log('Fetched shops', response.data);
        })
        .catch((error) => {
            console.error('Error fetching shops', error);
        });
};
onMounted(() => {
    subscribeToEcho();
    fetchRecords();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening && subscription.value.stopListening('DataStream');
});
</script>

<template>
    <div class="card">
        <div class="flex items-center">
            <Toolbar class="w-full" :pt="{ root: { style: 'border:none !important; padding:0 !important;' } }">
                <template #start>
                    <h2 class="text-xl font-bold min-w-40">{{ t('common.titles.manage', { entity: t('entity.shop') }) }}</h2>
                </template>

                <template #end>
                    <div class="flex">
                        <Button v-if="authStore.hasPermission('create_shops')" v-tooltip.top="t('common.tooltips.add', { entity: t('entity.shop') })" :label="t('common.labels.new')" icon="pi pi-plus" severity="primary" @click="addRecord" outlined />
                    </div>
                </template>
            </Toolbar>
        </div>
    </div>
    <div v-for="record in records" :key="record.id" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Panel>
            <template #header>
                <div class="flex items-center gap-2">
                    <Avatar image="/themes/shop-place-holder.svg" size="xlarge" />
                    <span class="font-bold text-lg">{{ record.name }}</span>
                </div>
            </template>
            <template #footer>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <Button v-if="authStore.hasPermission('view_shops')" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.shop') })" icon="pi pi-eye" text @click="editRecord(record)" severity="secondary" />
                        <Button v-if="authStore.hasPermission('update_shops')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.shop') })" icon="pi pi-pencil" text @click="editRecord(record)" />
                        <Button v-if="authStore.hasPermission('delete_shops')" v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.shop') })" icon="pi pi-trash" text severity="danger" @click="confirmDeleteRecord($event, [record.id])" />
                    </div>
                    <div class="text-surface-500 dark:text-surface-400">{{ t('common.labels.created') }} {{ humanizeDate(record.created_at, t) }}</div>
                </div>
            </template>
            <template #icons>
                <Tag
                    :value="record.active ? t('common.labels.active') : t('common.labels.inactive')"
                    :severity="record.active ? 'success' : 'danger'"
                    :icon="record.active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                    rounded
                    size="small"
                    :pt="{ root: { class: 'cursor-pointer' } }"
                    @click="toggleActive(record.id)"
                />
            </template>
            <p class="m-0">
                {{ record.description }}
            </p>
        </Panel>
    </div>
</template>
