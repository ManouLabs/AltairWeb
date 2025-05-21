<script setup>
import { useLayoutStore } from '@/stores/useLayoutStore';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const layoutStore = useLayoutStore();
const route = useRoute();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

const updateItemKey = () => {
    itemKey.value = props.parentItemKey ? `${props.parentItemKey}-${props.index}` : `${props.index}`;
};

const checkActiveMenu = () => {
    const activeKey = layoutStore.activeMenuItem;
    isActiveMenu.value = activeKey === itemKey.value || (activeKey && activeKey.startsWith(`${itemKey.value}-`));
};

onBeforeMount(() => {
    updateItemKey();
    checkActiveMenu();
});

watch(
    () => layoutStore.activeMenuItem,
    () => {
        checkActiveMenu();
    }
);

function itemClick(event, item) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    // Close mobile/overlay menu
    if ((item.to || item.url) && (layoutStore.staticMenuMobileActive || layoutStore.overlayMenuActive)) {
        layoutStore.onMenuToggle();
    }

    // Run custom command
    if (item.command) {
        item.command({ originalEvent: event, item });
    }

    // Set active menu key
    const nextKey = item.items && isActiveMenu.value ? props.parentItemKey : itemKey.value;
    layoutStore.setActiveMenuItem(nextKey);
}

function checkActiveRoute(item) {
    return route.path === item.to;
}
</script>
<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <!-- Root label -->
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">
            {{ item.label }}
        </div>

        <!-- Non-router link (or parent of submenu) -->
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url || '#'" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i v-if="item.items" class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        </a>

        <!-- Router link (leaf node) -->
        <router-link v-if="item.to && !item.items && item.visible !== false" :to="item.to" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
        </router-link>

        <!-- Submenu -->
        <Transition name="layout-submenu">
            <ul v-if="item.items && item.visible !== false" v-show="root ? true : isActiveMenu" class="layout-submenu">
                <AppMenuItem v-for="(child, i) in item.items" :key="`${itemKey}-${i}`" :item="child" :index="i" :parentItemKey="itemKey" :root="false" />
            </ul>
        </Transition>
    </li>
</template>
