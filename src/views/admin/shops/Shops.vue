<script setup>
import { useShopService } from '@/services/useShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex, humanizeDate } from '@/utilities/helper';
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

const record = ref(null);
const records = ref([]);
const subscription = ref(null);

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
            console.log('Dialog closed with result:', result);
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
    <div v-if="records.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="record in records" :key="record.id">
            <Panel :class="{ 'border-none bg-emerald-50 dark:bg-emerald-900 h-full': record.active, 'border-none bg-red-50 dark:bg-red-900 h-full': !record.active }">
                <template #header>
                    <div class="flex items-center gap-2">
                        <Avatar image="/themes/shop-place-holder.svg" size="xlarge" />
                        <span class="font-bold text-lg text-surface-700 dark:text-surface-400">{{ record.name }}</span>
                    </div>
                </template>
                <template #footer>
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <Button v-if="authStore.hasPermission('view_shops')" v-tooltip.top="t('common.tooltips.view', { entity: t('entity.shop') })" icon="pi pi-eye" text @click="editRecord(record)" severity="secondary" />
                            <Button v-if="authStore.hasPermission('update_shops')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.shop') })" icon="pi pi-pencil" text @click="editRecord(record)" />
                            <Button
                                v-if="authStore.hasPermission('delete_shops')"
                                v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.shop') })"
                                icon="pi pi-trash"
                                text
                                severity="danger"
                                @click="confirmDeleteRecord($event, [record.id])"
                            />
                        </div>
                        <div class="text-surface-500 dark:text-surface-400">{{ t('common.labels.created') }} {{ humanizeDate(record.created_at, t) }}</div>
                    </div>
                </template>
                <template #icons>
                    <Tag
                        :value="record.active ? t('common.labels.active') : t('common.labels.inactive')"
                        :class="record.active ? 'bg-emerald-600' : 'bg-red-600'"
                        class="text-surface-100 dark:text-surface-300 font-bold"
                        :icon="record.active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                        rounded
                        size="small"
                        :pt="{ root: { class: 'cursor-pointer' } }"
                        @click="toggleActive(record.id)"
                        v-tooltip.top="record.active ? t('common.tooltips.deactivate', { entity: t('entity.shop') }) : t('common.tooltips.activate', { entity: t('entity.shop') })"
                    />
                </template>

                <div class="mt-4">
                    <div class="mb-10 text-surface-600 dark:text-surface-300">
                        {{ record.description }}
                    </div>
                    <div v-if="record.addresses && record.addresses.length > 0"><i class="pi pi-map-marker"></i> {{ t('common.labels.address') }} : {{ record.addresses[0].street }} {{ record.addresses[0].street }}</div>
                    <div v-for="(contact, key) in record.contactMethods" :key="key" class="flex space-x-2 items-start mt-2">
                        <i
                            :class="{
                                'pi-phone': contact.type === 'phone',
                                'pi-envelope': contact.type === 'email',
                                'pi-whatsapp': contact.type === 'whatsapp',
                                'pi-globe': contact.type === 'website',
                                'pi-linkedin': contact.type === 'linkedin',
                                'pi-tiktok': contact.type === 'tiktok',
                                'pi-facebook': contact.type === 'facebook',
                                'pi pi-instagram': contact.type === 'instagram'
                            }"
                            class="pi text-primary-700 dark:bg-primary-700 dark:text-primary-100 mt-1"
                        />
                        <span class="text-surface-700 dark:text-surface-300">{{ contact.value }}</span>
                    </div>
                </div>
            </Panel>
        </div>
    </div>
    <div class="card flex items-center justify-center" v-else>
        <p>{{ t('shop.labels.no_shops') }}</p>
    </div>
</template>
