<script setup>
import { useFakeStats } from '@/composables/useFakeStats';
import { useCategoryService } from '@/services/useCategoryService';
import { useAuthStore } from '@/stores/useAuthStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const { showToast } = useShowToast();
const { getFakeTotalCount, getFakeSalesImpact, getFakeSalesImpactValue, getFakeAvgPrice, getFakeSubCategoryProductCount, getFakeCategoryReference } = useFakeStats();

const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));

// Data
const allCategories = ref([]);
const selectedCategory = ref(null);
const selectedKeys = ref({});
const expandedKeys = ref({});
const loading = ref(true);
const subscription = ref(null);

// Count direct children
function countDirectChildren(categoryId) {
    return allCategories.value.filter((c) => c.parent_id === categoryId).length;
}

// Transform categories to tree structure for PrimeVue Tree
const treeNodes = computed(() => {
    const buildTree = (items, parentId = null) => {
        return items
            .filter((item) => item.parent_id === parentId)
            .map((item) => {
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
    return buildTree(allCategories.value);
});

// Get children of selected category
const selectedChildren = computed(() => {
    if (!selectedCategory.value) return [];
    return allCategories.value.filter((c) => c.parent_id === selectedCategory.value.id);
});

// Fetch categories
async function fetchCategories() {
    loading.value = true;
    try {
        const response = await useCategoryService.getAllCategories();
        allCategories.value = response.categories || [];

        // Auto-select first category if none selected
        if (!selectedCategory.value && allCategories.value.length > 0) {
            const rootCategories = allCategories.value.filter((c) => !c.parent_id);
            if (rootCategories.length > 0) {
                selectedCategory.value = rootCategories[0];
                selectedKeys.value = { [String(rootCategories[0].id)]: true };
                expandedKeys.value = { [String(rootCategories[0].id)]: true };
            }
        }
    } catch (error) {
        console.error('Failed to fetch categories:', error);
    } finally {
        loading.value = false;
    }
}

// Handle tree node selection
function onNodeSelect(node) {
    selectedCategory.value = node.data;
}

// Add new root category
function addRootCategory() {
    openForm(null);
}

// Add sub-category to selected
function addSubCategory() {
    if (!selectedCategory.value) return;
    openForm(selectedCategory.value.id);
}

// Edit category
function editCategory(category = null) {
    const cat = category || selectedCategory.value;
    if (!cat) return;

    authStore.errors = {};
    dialog.open(formComponent, {
        props: {
            header: t('category.form.title_edit'),
            style: { width: '32rem' },
            breakpoints: { '960px': '90vw' },
            modal: true
        },
        data: {
            record: { ...cat },
            allCategories: allCategories.value.filter((c) => c.id !== cat.id),
            action: ACTIONS.EDIT
        },
        onClose: handleFormClose
    });
}

// Open form modal
function openForm(parentId = null) {
    authStore.errors = {};
    const newRecord = {
        name: '',
        parent_id: parentId,
        slug: null,
        description: null,
        icon: 'pi pi-folder',
        icon_color: '#8B5CF6',
        active: true,
        publish: true
    };

    dialog.open(formComponent, {
        props: {
            header: t('category.form.title_new'),
            style: { width: '32rem' },
            breakpoints: { '960px': '90vw' },
            modal: true
        },
        data: {
            record: newRecord,
            allCategories: allCategories.value,
            action: ACTIONS.CREATE
        },
        onClose: handleFormClose
    });
}

// Handle form close
function handleFormClose(result) {
    if (result && result.data?.record?.id) {
        fetchCategories();
        if (result.data.action === ACTIONS.CREATE) {
            showToast('success', ACTIONS.CREATE, 'category', 'tc');
            // Expand parent node if sub-category was created
            if (result.data.record.parent_id) {
                expandedKeys.value[String(result.data.record.parent_id)] = true;
            }
        } else {
            showToast('success', ACTIONS.EDIT, 'category', 'tc');
            if (selectedCategory.value?.id === result.data.record.id) {
                selectedCategory.value = result.data.record;
            }
        }
    }
}

// Delete category
function confirmDelete(category = null) {
    const cat = category || selectedCategory.value;
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
        accept: async () => {
            try {
                await useCategoryService.deleteCategories([cat.id]);
                showToast('success', ACTIONS.DELETE, 'category', 'tc');
                if (selectedCategory.value?.id === cat.id) {
                    selectedCategory.value = null;
                    selectedKeys.value = {};
                }
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    });
}

// Export (placeholder)
function exportCategories() {
    showToast('info', 'export', 'categories', 'tc');
}

// Real-time updates
function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.category' + window.tenantId).listen('DataStream', () => {
        fetchCategories();
    });
}

onMounted(() => {
    fetchCategories();
    subscribeToEcho();
});

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div class="categories-page">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ t('category.titles.explorative_management') }}</h1>
                <p class="page-subtitle">{{ t('category.titles.subtitle') }}</p>
            </div>
            <div class="header-actions">
                <Button :label="t('common.labels.export')" icon="pi pi-download" severity="secondary" outlined @click="exportCategories" />
                <Button :label="t('category.form.title_new')" icon="pi pi-plus" @click="addRootCategory" v-if="authStore.hasPermission('create_categories')" />
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Panel: Category Tree -->
            <Card class="tree-panel">
                <template #title>
                    <div class="tree-header">
                        <i class="pi pi-sitemap"></i>
                        <span>{{ t('category.titles.category_tree') }}</span>
                    </div>
                </template>
                <template #content>
                    <div v-if="!loading">
                        <Tree :value="treeNodes" v-model:selectionKeys="selectedKeys" v-model:expandedKeys="expandedKeys" selectionMode="single" @node-select="onNodeSelect" class="category-tree">
                            <template #default="{ node }">
                                <div class="tree-node">
                                    <i :class="node.data?.icon || 'pi pi-folder'" class="tree-node-icon" :style="{ color: node.data?.icon_color || '#8B5CF6' }"></i>
                                    <span class="node-label">{{ node.label }}</span>
                                    <Badge v-if="countDirectChildren(node.data?.id) > 0" :value="countDirectChildren(node.data?.id)" severity="secondary" />
                                </div>
                            </template>
                        </Tree>
                    </div>
                    <div v-else class="flex items-center justify-center p-8">
                        <ProgressSpinner style="width: 40px; height: 40px" />
                    </div>

                    <!-- Add Root Category Button -->
                    <div class="add-root-btn" @click="addRootCategory" v-if="authStore.hasPermission('create_categories')">
                        <i class="pi pi-plus-circle"></i>
                        <span>{{ t('category.labels.add_root_category') }}</span>
                    </div>
                </template>
            </Card>

            <!-- Right Panel: Category Details -->
            <div class="details-container" v-if="selectedCategory">
                <!-- Category Header Card -->
                <Card class="category-header-card">
                    <template #content>
                        <div class="category-header-top">
                            <div class="category-info">
                                <div class="category-icon-box" :style="{ background: `linear-gradient(135deg, #06B6D4, ${selectedCategory.icon_color || '#8B5CF6'})` }">
                                    <i :class="selectedCategory.icon || 'pi pi-folder'" class="icon-white"></i>
                                </div>
                                <div class="category-details">
                                    <div class="category-title-row">
                                        <h2 class="category-name">{{ selectedCategory.name }}</h2>
                                        <Tag :value="selectedCategory.active ? t('common.labels.active') : t('common.labels.inactive')" :severity="selectedCategory.active ? 'success' : 'danger'" />
                                    </div>
                                    <p class="category-description">
                                        {{ selectedCategory.description || `Primary category for all ${selectedCategory.name.toLowerCase()} items and related products.` }}
                                    </p>
                                </div>
                            </div>
                            <div class="category-actions" v-if="authStore.hasPermission('update_categories') || authStore.hasPermission('delete_categories')">
                                <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editCategory()" v-if="authStore.hasPermission('update_categories')" />
                                <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete()" v-if="authStore.hasPermission('delete_categories')" />
                            </div>
                        </div>

                        <!-- Stats Row -->
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-label">{{ t('category.labels.total_products') }}</span>
                                <span class="stat-value">{{ getFakeTotalCount(selectedCategory.id).toLocaleString() }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">{{ t('category.labels.subcategories') }}</span>
                                <span class="stat-value">{{ selectedChildren.length }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">{{ t('category.labels.sales_impact') }}</span>
                                <span class="stat-value" :class="getFakeSalesImpactValue(selectedCategory.id) >= 0 ? 'positive' : 'negative'">
                                    {{ getFakeSalesImpact(selectedCategory.id) }}
                                </span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">{{ t('category.labels.avg_price') }}</span>
                                <span class="stat-value">{{ getFakeAvgPrice(selectedCategory.id) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Sub-categories Section -->
                <Card class="subcategories-card">
                    <template #title>
                        <div class="section-header">
                            <span>{{ t('category.titles.subcategories_in', { name: selectedCategory.name }) }}</span>
                            <Button :label="t('category.labels.add_subcategory')" icon="pi pi-plus" text size="small" @click="addSubCategory" v-if="authStore.hasPermission('create_categories')" />
                        </div>
                    </template>
                    <template #content>
                        <div class="subcategories-grid">
                            <!-- Existing sub-categories -->
                            <Card
                                v-for="child in selectedChildren"
                                :key="child.id"
                                class="subcategory-card"
                                @click="
                                    selectedCategory = child;
                                    selectedKeys = { [String(child.id)]: true };
                                "
                            >
                                <template #content>
                                    <div class="subcat-header">
                                        <div class="subcat-icon-box" :style="{ backgroundColor: (child.icon_color || '#8B5CF6') + '15' }">
                                            <i :class="child.icon || 'pi pi-folder'" :style="{ color: child.icon_color || '#8B5CF6' }"></i>
                                        </div>
                                        <div class="subcat-actions">
                                            <Button icon="pi pi-pencil" severity="secondary" text rounded size="small" @click.stop="editCategory(child)" v-if="authStore.hasPermission('update_categories')" />
                                            <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click.stop="confirmDelete(child)" v-if="authStore.hasPermission('delete_categories')" />
                                        </div>
                                    </div>
                                    <h4 class="subcat-name">{{ child.name }}</h4>
                                    <div class="subcat-footer">
                                        <span class="subcat-products">{{ getFakeSubCategoryProductCount(child.id) }} {{ t('category.labels.products') }}</span>
                                        <Tag :value="'ID: ' + getFakeCategoryReference(child.id)" severity="secondary" />
                                    </div>
                                </template>
                            </Card>

                            <!-- Add New Sub-category Card -->
                            <div class="add-subcategory-card" @click="addSubCategory" v-if="authStore.hasPermission('create_categories')">
                                <div class="add-icon-circle">
                                    <i class="pi pi-plus"></i>
                                </div>
                                <span>{{ t('category.labels.new_subcategory') }}</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- No Selection State -->
            <Card class="empty-state-card" v-else-if="!loading">
                <template #content>
                    <div class="empty-content">
                        <i class="pi pi-folder-open"></i>
                        <h3>{{ t('category.labels.select_category') }}</h3>
                        <p>{{ t('category.labels.select_category_hint') }}</p>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.categories-page {
    padding: 1.5rem 2rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.page-subtitle {
    color: var(--text-color-secondary);
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.main-content {
    display: flex;
    gap: 1.5rem;
    min-height: 600px;
}

// Tree Panel
.tree-panel {
    width: 300px;
    flex-shrink: 0;
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    overflow: hidden;

    :deep(.p-card-title) {
        padding: 0;
        margin: 0;
    }

    :deep(.p-card-body) {
        padding: 0;
    }

    :deep(.p-card-content) {
        padding: 0;
    }
}

.tree-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-color-secondary);
    background-color: var(--surface-100);
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--surface-border);

    i {
        font-size: 1rem;
        color: var(--primary-color);
    }
}

:deep(.category-tree) {
    background: transparent;
    border: none;
    padding: 0.75rem;

    .p-tree-node-content {
        padding: 0.625rem 0.875rem;
        border-radius: 8px;
        margin-bottom: 2px;

        &:hover {
            background: var(--surface-100);
        }

        &.p-tree-node-selected {
            background: var(--primary-color);

            .node-label {
                color: white;
            }

            .tree-node-icon {
                color: white !important;
            }

            :deep(.p-badge) {
                background: rgba(255, 255, 255, 0.25);
                color: white;
            }
        }
    }

    .p-tree-toggler {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: 0.25rem;
    }

    .p-tree-node-children {
        padding-left: 1.25rem;
    }
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
}

.tree-node-icon {
    font-size: 1rem;
}

.node-label {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 500;
}

.add-root-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    margin: 0.75rem;
    margin-top: 0.5rem;
    border: 2px dashed var(--surface-300);
    border-radius: 8px;
    color: var(--text-color-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;

    i {
        font-size: 1rem;
    }

    &:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: var(--primary-50);
    }
}

// Details Container
.details-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

// Category Header Card
.category-header-card {
    :deep(.p-card-content) {
        padding: 1.5rem;
    }
}

.category-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.category-info {
    display: flex;
    gap: 1rem;
}

.category-icon-box {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.icon-white {
    color: white;
    font-size: 1.5rem;
}

.category-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
}

.category-name {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.01em;
}

.category-description {
    color: var(--text-color-secondary);
    margin: 0;
    font-size: 0.875rem;
    max-width: 400px;
}

.category-actions {
    display: flex;
    gap: 0.25rem;
}

// Stats Row
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--surface-border);
}

.stat-item {
    text-align: left;
}

.stat-label {
    display: block;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.125rem;
    font-weight: 700;

    &.positive {
        color: var(--green-500);
    }

    &.negative {
        color: var(--red-500);
    }
}

// Subcategories Card
.subcategories-card {
    flex: 1;

    :deep(.p-card-title) {
        padding-bottom: 0;
    }
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
    padding: 1rem 1rem 0;
}

.subcategories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.subcategory-card {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    :deep(.p-card-content) {
        padding: 1rem;
    }
}

.subcat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.subcat-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-100);

    i {
        font-size: 1.25rem;
        color: var(--text-color-secondary);
    }
}

.subcat-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;

    .subcategory-card:hover & {
        opacity: 1;
    }
}

.subcat-name {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0 0 0.875rem 0;
    color: var(--text-color);
}

.subcat-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.subcat-products {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

// Add Subcategory Card
.add-subcategory-card {
    border: 2px dashed var(--surface-300);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    min-height: 160px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-color-secondary);
    background: transparent;

    .add-icon-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--surface-100);
        display: flex;
        align-items: center;
        justify-content: center;

        i {
            font-size: 1.25rem;
            color: var(--text-color-secondary);
        }
    }

    span {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    &:hover {
        border-color: var(--primary-color);
        background: var(--primary-50);

        .add-icon-circle {
            background: var(--primary-100);

            i {
                color: var(--primary-color);
            }
        }

        span {
            color: var(--primary-color);
        }
    }
}

// Empty State
.empty-state-card {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-content {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 3rem;

    i {
        font-size: 3rem;
        opacity: 0.3;
        margin-bottom: 1rem;
    }

    h3 {
        margin: 0 0 0.5rem;
        color: var(--text-color);
    }

    p {
        margin: 0;
        font-size: 0.875rem;
    }
}

// Responsive
@media (max-width: 1024px) {
    .main-content {
        flex-direction: column;
    }

    .tree-panel {
        width: 100%;
    }

    .stats-row {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
