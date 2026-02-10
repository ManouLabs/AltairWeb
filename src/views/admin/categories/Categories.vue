<script setup lang="ts">
import { useFakeStats } from '@/composables/useFakeStats';
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { findRecordIndex } from '@/utilities/helper';
import debounce from 'lodash-es/debounce';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CategoryData } from '@/types/category';
import FormHeader from '@/components/FormHeader.vue';
import CategoriesSkeleton from './partials/CategoriesSkeleton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const loadingStore = useLoading();
const { showToast } = useShowToast();
const { getFakeTotalCount, getFakeSalesImpact, getFakeSalesImpactValue, getFakeAvgPrice, getFakeSubCategoryProductCount, getFakeCategoryReference } = useFakeStats();

const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));

// Data
const record = ref<CategoryData | null>(null);
const records = ref<CategoryData[]>([]);
const searchQuery = ref<string>('');
const selectedKeys = ref<Record<string, boolean>>({});
const loadingActiveId = ref<number | null>(null);
const expandedKeys = ref<Record<string, boolean>>({});
const subscription = ref<any>(null);
const dataLoaded = ref<boolean>(false);

// Count direct children
function countDirectChildren(categoryId: number): number {
    return records.value.filter((c: CategoryData) => c.parent_id === categoryId).length;
}

// Transform categories to tree structure for PrimeVue Tree
const treeNodes = computed(() => {
    const buildTree = (items: CategoryData[], parentId: number | null = null): any[] => {
        return items
            .filter((item: CategoryData) => item.parent_id === parentId)
            .map((item: CategoryData) => {
                const children = buildTree(items, item.id);
                return {
                    key: String(item.id),
                    label: item.name,
                    data: item,
                    children: children.length > 0 ? children : undefined,
                    leaf: children.length === 0
                };
            });
    };

    let filteredItems = records.value;
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filteredItems = records.value.filter((cat: CategoryData) => cat.name?.toLowerCase().includes(query) || cat.description?.toLowerCase().includes(query));
    }

    return buildTree(filteredItems);
});

// Get children of selected category
const selectedChildren = computed<CategoryData[]>(() => {
    if (!record.value) return [];
    return records.value.filter((c: CategoryData) => c.parent_id === record.value!.id);
});

// Debounced search with loading state
const performSearch = debounce((): void => {
    loadingStore.stopDataLoading();
}, 200);

watch(searchQuery, () => {
    loadingStore.startDataLoading();
    performSearch();
});

// Fetch records
function fetchRecords(): void {
    loadingStore.startDataLoading();
    useCategoryService
        .getAllCategories()
        .then((response) => {
            records.value = response.categories || [];
            // Auto-select first category if none selected
            if (!record.value && records.value.length > 0) {
                const rootCategories = records.value.filter((c: CategoryData) => !c.parent_id);
                if (rootCategories.length > 0) {
                    record.value = rootCategories[0];
                    selectedKeys.value = { [String(rootCategories[0].id)]: true };
                    expandedKeys.value = { [String(rootCategories[0].id)]: true };
                }
            }
        })
        .catch((error: any) => {
            console.error('Failed to fetch categories:', error);
        })
        .finally(() => {
            loadingStore.stopDataLoading();
            dataLoaded.value = true;
        });
}

// Toggle active status
function toggleActive(categoryId: number): void {
    loadingActiveId.value = categoryId;
    loadingStore.startPageLoading();
    useCategoryService
        .toggleActiveCategory(categoryId)
        .then(() => {
            const index = findRecordIndex(records, categoryId);
            if (index !== -1) {
                records.value[index].active = !records.value[index].active;
            }
            // Only update record.value separately if it's a different object
            if (record.value && record.value.id === categoryId && (index === -1 || record.value !== records.value[index])) {
                record.value.active = !record.value.active;
            }
            showToast('success', ACTIONS.EDIT, 'category', 'tc');
        })
        .catch((error: any) => {
            if (error?.response?.status === 419 || error?.response?.status === 401) {
                console.error('Session expired, redirecting to login');
            }
            console.error('Error updating category status');
        })
        .finally(() => {
            loadingActiveId.value = null;
            loadingStore.stopPageLoading();
        });
}

// Handle tree node selection
function onNodeSelect(node: any): void {
    record.value = node.data;
}

// Add new root category
function addRootCategory() {
    openForm(null);
}

// Add sub-category to selected
function addSubCategory(): void {
    if (!record.value) return;
    openForm(record.value.id);
}

// Edit category
function editRecord(category: CategoryData | null = null): void {
    const cat = category || record.value;
    if (!cat) return;

    authStore.errors = {};
    dialog.open(formComponent, {
        props: {
            style: { width: '32rem' },
            breakpoints: { '960px': '90vw' },
            modal: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: { ...cat },
            allCategories: records.value.filter((c: CategoryData) => c.id !== cat.id),
            action: ACTIONS.EDIT,
            // Data for FormHeader template
            headerProps: computed(() => ({
                title: t('category.form.title_edit'),
                description: t('category.form.subtitle'),
                icon: record.value?.icon,
                iconColor: record.value?.icon_color
            }))
        },
        onClose: handleFormClose
    });
}

// Open form modal
function openForm(parentId: number | null = null): void {
    authStore.errors = {};
    const newRecord = {
        name: null,
        parent_id: parentId,
        slug: null,
        description: null,
        icon: null,
        icon_color: '#8B5CF6',
        active: true,
        publish: true
    };

    dialog.open(formComponent, {
        props: {
            style: { width: '32rem' },
            breakpoints: { '960px': '90vw' },
            modal: true
        },
        templates: {
            header: markRaw(FormHeader)
        },
        data: {
            record: newRecord,
            allCategories: records.value,
            action: ACTIONS.CREATE,
            // Data for FormHeader template
            headerProps: computed(() => ({
                title: t('category.form.title_new'),
                description: t('category.form.subtitle'),
                icon: 'pi pi-plus-circle',
                iconColor: '#8B5CF6'
            }))
        },
        onClose: handleFormClose
    });
}

// Handle form close
function handleFormClose(result: any): void {
    if (result && result.data?.record?.id) {
        fetchRecords();
        if (result.data.action === ACTIONS.CREATE) {
            showToast('success', ACTIONS.CREATE, 'category', 'tc');
            // Expand parent node if sub-category was created
            if (result.data.record.parent_id) {
                expandedKeys.value[String(result.data.record.parent_id)] = true;
            }
        } else {
            showToast('success', ACTIONS.EDIT, 'category', 'tc');
            if (record.value?.id === result.data.record.id) {
                record.value = result.data.record;
            }
        }
    }
}

// Delete record
function confirmDeleteRecord(category: CategoryData | null = null): void {
    const cat = category || record.value;
    if (!cat) return;

    confirm.require({
        modal: true,
        message: t('common.confirmations.delete.message', { entity: t('entity.category') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.labels.cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: t('common.labels.delete'),
            severity: 'danger'
        },
        accept: () => {
            useCategoryService
                .deleteCategories([cat.id])
                .then(() => {
                    showToast('success', ACTIONS.DELETE, 'category', 'tc');
                    if (record.value?.id === cat.id) {
                        record.value = null;
                        selectedKeys.value = {};
                    }
                    fetchRecords();
                })
                .catch((error: any) => {
                    console.error('Error deleting category:', error);
                });
        }
    });
}

// Export (placeholder)
function exportCategories() {
    showToast('info', 'export', 'categories', 'tc');
}

// Real-time updates
interface EchoEvent {
    action: string;
    data: CategoryData | number[];
}

function handleEchoEvent(event: EchoEvent): void {
    switch (event.action) {
        case ACTIONS.DELETE:
            (event.data as number[]).forEach((id: number) => {
                const index = findRecordIndex(records, id);
                if (index !== -1) records.value.splice(index, 1);
                if (record.value?.id === id) record.value = null;
            });
            break;
        case ACTIONS.UPDATE: {
            const data = event.data as CategoryData;
            const index = findRecordIndex(records, data.id);
            if (index !== -1) {
                records.value[index] = data;
                if (record.value?.id === data.id) record.value = data;
            }
            break;
        }
        case ACTIONS.STORE: {
            const data = event.data as CategoryData;
            const exists = records.value.some((r: CategoryData) => r.id === data.id);
            if (!exists) {
                records.value.unshift(data);
            }
            break;
        }
        default:
            console.error('Unhandled action', event.action);
    }
}

function subscribeToEcho(): void {
    const categoriesChannel = Echo.private(`data-stream.categories${authStore.user.account_id}`);
    subscription.value = categoriesChannel.listen('DataStream', (event: EchoEvent) => {
        console.log('Received Echo event for categories:', event);
        handleEchoEvent(event);
    });
}

onMounted(() => {
    fetchRecords();
    subscribeToEcho();
});

onUnmounted(() => {
    if (subscription.value) subscription.value.stopListening && subscription.value.stopListening('DataStream');
});
</script>

<template>
    <!-- Skeleton Loading State -->
    <CategoriesSkeleton v-if="!dataLoaded" />

    <!-- ===================== ACTUAL CONTENT ===================== -->
    <template v-else>
        <PageHeader icon="pi pi-th-large" icon-color="#8B5CF6" :title="t('category.titles.explorative_management')" :description="t('category.titles.subtitle')">
            <template #actions>
                <Button :label="t('common.labels.export')" icon="pi pi-download" severity="secondary" outlined @click="exportCategories" />
                <Button :label="t('category.form.title_new')" icon="pi pi-plus" @click="addRootCategory" v-if="authStore.hasPermission('create_categories')" />
            </template>
        </PageHeader>

        <!-- Main Content -->
        <div class="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            <!-- Left Panel: Category Tree -->
            <Card class="w-full lg:w-[400px] flex-shrink-0 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden shadow-none !p-0" :pt="{ body: { class: '!p-0' }, content: { class: '!p-0' } }">
                <template #content>
                    <div
                        class="flex items-center justify-center gap-2 font-semibold text-md uppercase tracking-wider text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 py-6 px-5 border-b border-surface-200 dark:border-surface-700"
                    >
                        <i class="pi pi-sitemap text-primary text-base"></i>
                        <span>{{ t('category.titles.category_tree') }}</span>
                    </div>
                    <div class="p-4">
                        <Tree
                            :value="treeNodes"
                            v-model:selectionKeys="selectedKeys"
                            v-model:expandedKeys="expandedKeys"
                            selectionMode="single"
                            @node-select="onNodeSelect"
                            class="!bg-transparent !border-none !p-4"
                            :pt="{ nodeContent: { class: 'py-2.5' } }"
                        >
                            <template #default="{ node }">
                                <div class="flex items-center gap-3 w-full group py-0.5">
                                    <i :class="node.data?.icon || 'pi pi-folder'" class="text-base" :style="{ color: node.data?.icon_color || '#8B5CF6' }"></i>
                                    <span class="flex-1 text-[15px] font-medium group-hover:text-primary transition-colors">{{ node.label }}</span>
                                    <Badge v-if="countDirectChildren(node.data?.id) > 0" :value="countDirectChildren(node.data?.id)" severity="secondary" class="!bg-surface-200 dark:!bg-surface-700 !text-surface-600 dark:!text-surface-300" />
                                </div>
                            </template>
                        </Tree>
                    </div>

                    <!-- Add Root Category Button -->
                    <div
                        class="flex items-center justify-center gap-2 p-4 mx-8 mb-8 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg text-surface-400 dark:text-surface-400 text-md font-semibold cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        @click="addRootCategory"
                        v-if="authStore.hasPermission('create_categories')"
                    >
                        <i class="pi pi-plus-circle text-base"></i>
                        <span>{{ t('category.labels.add_root_category') }}</span>
                    </div>
                </template>
            </Card>

            <!-- Right Panel: Category Details -->
            <div class="flex-1 flex flex-col gap-6" v-if="record">
                <!-- Category Header Card -->
                <Card class="!shadow-sm !border !border-surface-200 dark:!border-surface-700 !rounded-xl p-8">
                    <template #content>
                        <div class="flex justify-between items-start">
                            <div class="flex gap-4">
                                <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25" :style="{ background: `linear-gradient(135deg, #06B6D4, ${record.icon_color || '#8B5CF6'})` }">
                                    <i :class="record.icon || 'pi pi-folder'" class="text-white text-2xl"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-3 mb-1">
                                        <h2 class="text-2xl font-bold m-0 tracking-tight">{{ record.name }}</h2>
                                        <ActiveToggleButton :active="record.active" entity="category" :loading="loadingActiveId === record.id" @toggle="toggleActive(record.id)" />
                                    </div>
                                    <p class="text-surface-500 dark:text-surface-400 m-0 text-sm max-w-md line-clamp-2">
                                        {{ record.description || `Primary category for all ${record.name.toLowerCase()} items and related products.` }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex gap-1" v-if="authStore.hasPermission('update_categories') || authStore.hasPermission('delete_categories')">
                                <Button v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.category') })" icon="pi pi-pencil" severity="secondary" text rounded @click="editRecord()" v-if="authStore.hasPermission('update_categories')" />
                                <Button
                                    v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.category') })"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    rounded
                                    @click="confirmDeleteRecord()"
                                    v-if="authStore.hasPermission('delete_categories')"
                                />
                            </div>
                        </div>

                        <!-- Stats Row -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                            <div class="text-left">
                                <span class="block text-[10px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">{{ t('category.labels.total_products') }}</span>
                                <span class="text-lg font-bold">{{ getFakeTotalCount(record.id).toLocaleString() }}</span>
                            </div>
                            <div class="text-left">
                                <span class="block text-[10px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">{{ t('category.labels.subcategories') }}</span>
                                <span class="text-lg font-bold">{{ selectedChildren.length }}</span>
                            </div>
                            <div class="text-left">
                                <span class="block text-[10px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">{{ t('category.labels.sales_impact') }}</span>
                                <span class="text-lg font-bold" :class="getFakeSalesImpactValue(record.id) >= 0 ? 'text-green-500' : 'text-red-500'">
                                    {{ getFakeSalesImpact(record.id) }}
                                </span>
                            </div>
                            <div class="text-left">
                                <span class="block text-[10px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">{{ t('category.labels.avg_price') }}</span>
                                <span class="text-lg font-bold">{{ getFakeAvgPrice(record.id) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Sub-categories Section -->

                <div class="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 px-4 pt-4">
                    <span>{{ t('category.titles.subcategories_in', { name: record.name }) }}</span>
                    <Button :label="t('category.labels.add_subcategory')" icon="pi pi-plus" text size="small" @click="addSubCategory" v-if="authStore.hasPermission('create_categories')" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- Existing sub-categories -->
                    <Card
                        v-for="child in selectedChildren"
                        :key="child.id"
                        class="cursor-pointer !bg-surface-0 dark:!bg-surface-900 border border-surface-200 dark:border-surface-700 group"
                        :pt="{ content: { class: '!p-4' } }"
                        @click="
                            record = child;
                            selectedKeys = { [String(child.id)]: true };
                        "
                    >
                        <template #content>
                            <div class="flex justify-between items-start mb-4">
                                <Avatar :icon="child.icon || 'pi pi-folder'" shape="square" size="large" :style="{ backgroundColor: (child.icon_color || '#8B5CF6') + '20', color: child.icon_color || '#8B5CF6', borderRadius: '12px' }" />
                                <div class="flex gap-1">
                                    <Button
                                        v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.category') })"
                                        icon="pi pi-pencil"
                                        severity="secondary"
                                        text
                                        rounded
                                        size="small"
                                        @click.stop="editRecord(child)"
                                        v-if="authStore.hasPermission('update_categories')"
                                    />
                                    <Button
                                        v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.category') })"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        rounded
                                        size="small"
                                        @click.stop="confirmDeleteRecord(child)"
                                        v-if="authStore.hasPermission('delete_categories')"
                                    />
                                </div>
                            </div>
                            <h4 class="text-[17px] font-bold m-0 mb-3.5 text-surface-900 dark:text-surface-0">{{ child.name }}</h4>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-surface-500 dark:text-surface-400">{{ getFakeSubCategoryProductCount(child.id) }} {{ t('category.labels.products') }}</span>
                                <Tag :value="'ID: ' + getFakeCategoryReference(child.id)" severity="secondary" class="!text-[10px]" />
                            </div>
                        </template>
                    </Card>

                    <!-- Add New Sub-category Card -->
                    <div
                        class="flex flex-col items-center justify-center gap-2.5 min-h-[160px] cursor-pointer transition-all border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl text-surface-400 dark:text-surface-400 bg-transparent hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 group"
                        @click="addSubCategory"
                        v-if="authStore.hasPermission('create_categories')"
                    >
                        <div class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                            <i class="pi pi-plus text-xl text-surface-500 dark:text-surface-400 group-hover:text-primary transition-colors"></i>
                        </div>
                        <span class="text-sm font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">{{ t('category.labels.new_subcategory') }}</span>
                    </div>
                </div>
            </div>

            <!-- No Selection State -->
            <Card class="flex-1 flex items-center justify-center !shadow-none !bg-transparent" v-else-if="!loadingStore.isDataLoading">
                <template #content>
                    <div class="text-center text-surface-500 dark:text-surface-400 p-12">
                        <i class="pi pi-folder-open text-5xl opacity-30 mb-4"></i>
                        <h3 class="m-0 mb-2 text-surface-900 dark:text-surface-0 text-lg font-semibold">{{ t('category.labels.select_category') }}</h3>
                        <p class="m-0 text-sm">{{ t('category.labels.select_category_hint') }}</p>
                    </div>
                </template>
            </Card>
        </div>
    </template>
</template>

<style scoped></style>
