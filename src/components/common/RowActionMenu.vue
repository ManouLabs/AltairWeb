<script setup lang="ts">
/**
 * RowActionMenu — 3-dot action menu for DataTable rows
 *
 * Usage:
 * <RowActionMenu
 *   :actions="[
 *     { label: 'View Details', icon: 'pi pi-eye', command: () => viewRecord(data) },
 *     { label: 'Edit', icon: 'pi pi-pencil', command: () => editRecord(data) },
 *     { label: 'Deactivate', icon: 'pi pi-ban', severity: 'warning', command: () => deactivate(data) },
 *     { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', command: () => deleteRecord(data) }
 *   ]"
 * />
 */
import { ref } from 'vue';

interface ActionItem {
    label: string;
    icon?: string;
    severity?: 'danger' | 'warning' | 'success' | 'secondary';
    command: () => void;
    visible?: boolean;
}

defineProps<{
    actions: ActionItem[];
}>();

const menu = ref();
const isOpen = ref(false);

const toggle = (event: Event) => {
    menu.value.toggle(event);
};

const onShow = () => {
    isOpen.value = true;
};

const onHide = () => {
    isOpen.value = false;
};
</script>

<template>
    <div class="row-action-menu">
        <button type="button" class="row-action-trigger" :class="{ 'row-action-trigger--active': isOpen }" aria-haspopup="true" aria-controls="row-action-overlay" @click="toggle">
            <i class="pi pi-ellipsis-h"></i>
        </button>
        <Menu ref="menu" id="row-action-overlay" :model="actions.filter((a) => a.visible !== false)" :popup="true" class="row-action-dropdown" @show="onShow" @hide="onHide">
            <template #item="{ item }">
                <button
                    class="row-action-item"
                    :class="{
                        'row-action-item--danger': item.severity === 'danger',
                        'row-action-item--warning': item.severity === 'warning'
                    }"
                >
                    <i v-if="item.icon" :class="item.icon" />
                    <span>{{ item.label }}</span>
                </button>
            </template>
        </Menu>
    </div>
</template>

<style scoped lang="scss">
.row-action-menu {
    display: flex;
    align-items: center;
    justify-content: center;
}

.row-action-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.15s;

    i {
        font-size: 1rem;
    }

    &:hover {
        background: var(--surface-hover);
        color: var(--text-color);
    }

    &--active {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);

        &:hover {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
        }
    }
}

.row-action-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
        background: var(--surface-hover);
    }

    i {
        font-size: 1rem;
        color: var(--text-color-secondary);
    }

    &--warning {
        color: #f97316;

        i {
            color: #f97316;
        }

        &:hover {
            background: rgba(249, 115, 22, 0.08);
        }
    }

    &--danger {
        color: #ef4444;

        i {
            color: #ef4444;
        }

        &:hover {
            background: rgba(239, 68, 68, 0.08);
        }
    }
}
</style>

<style lang="scss">
/* Global styles for the dropdown overlay */
.row-action-dropdown.p-menu {
    min-width: 11rem;
    padding: 0.5rem 0;
    border-radius: 0.75rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid var(--surface-border);
    overflow: hidden;

    .p-menu-list {
        padding: 0;
    }

    .p-menuitem {
        margin: 0;
    }

    .p-menuitem-content {
        padding: 0;
        border-radius: 0;
    }
}
</style>
