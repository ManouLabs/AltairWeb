<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useLoading } from '@/stores/useLoadingStore';
import { usePlanService } from '@/services/usePlanService';
import { computed, onMounted, ref } from 'vue';
import type { Plan } from '@/types/plan';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const loading = useLoading();
const { t } = useI18n();

// App features for the landing page grid
const appFeatures = computed(() => [
    { icon: 'pi pi-shopping-bag', title: t('home.features.f_orders_title'), description: t('home.features.f_orders_desc'), from: 'from-codly-purple-500/20', to: 'to-codly-purple-500/5', iconColor: 'text-codly-purple-500' },
    { icon: 'pi pi-arrows-h', title: t('home.features.f_exchanges_title'), description: t('home.features.f_exchanges_desc'), from: 'from-codly-cyan-500/20', to: 'to-codly-cyan-500/5', iconColor: 'text-codly-cyan-500' },
    { icon: 'pi pi-id-card', title: t('home.features.f_customers_title'), description: t('home.features.f_customers_desc'), from: 'from-amber-500/20', to: 'to-amber-500/5', iconColor: 'text-amber-500' },
    { icon: 'pi pi-shop', title: t('home.features.f_shops_title'), description: t('home.features.f_shops_desc'), from: 'from-green-500/20', to: 'to-green-500/5', iconColor: 'text-green-500' },
    { icon: 'pi pi-truck', title: t('home.features.f_shippers_title'), description: t('home.features.f_shippers_desc'), from: 'from-blue-500/20', to: 'to-blue-500/5', iconColor: 'text-blue-500' },
    { icon: 'pi pi-box', title: t('home.features.f_products_title'), description: t('home.features.f_products_desc'), from: 'from-pink-500/20', to: 'to-pink-500/5', iconColor: 'text-pink-500' },
    { icon: 'pi pi-th-large', title: t('home.features.f_categories_title'), description: t('home.features.f_categories_desc'), from: 'from-indigo-500/20', to: 'to-indigo-500/5', iconColor: 'text-indigo-500' },
    { icon: 'pi pi-sliders-h', title: t('home.features.f_attributes_title'), description: t('home.features.f_attributes_desc'), from: 'from-teal-500/20', to: 'to-teal-500/5', iconColor: 'text-teal-500' },
    { icon: 'pi pi-building', title: t('home.features.f_suppliers_title'), description: t('home.features.f_suppliers_desc'), from: 'from-orange-500/20', to: 'to-orange-500/5', iconColor: 'text-orange-500' },
    { icon: 'pi pi-users', title: t('home.features.f_users_title'), description: t('home.features.f_users_desc'), from: 'from-violet-500/20', to: 'to-violet-500/5', iconColor: 'text-violet-500' },
    { icon: 'pi pi-credit-card', title: t('home.features.f_subscriptions_title'), description: t('home.features.f_subscriptions_desc'), from: 'from-rose-500/20', to: 'to-rose-500/5', iconColor: 'text-rose-500' },
    { icon: 'pi pi-map', title: t('home.features.f_regions_title'), description: t('home.features.f_regions_desc'), from: 'from-emerald-500/20', to: 'to-emerald-500/5', iconColor: 'text-emerald-500' },
]);

// Locale options & flags
const supportedLocales = ref(import.meta.env.VITE_SUPPORTED_LOCALES ? import.meta.env.VITE_SUPPORTED_LOCALES.split(',') : ['fr', 'en', 'ar']);

const setLocale = (locale: string) => {
    layoutStore.setLocale(locale as 'fr' | 'en' | 'ar');
};

// Plans
const plans = ref<Plan[]>([]);
const loadingPlans = ref(true);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price) + ' DA';
};

const getPlanFeatures = (plan: Plan) => {
    const features = [];
    if (plan.orders) features.push({ label: `${plan.orders} orders`, icon: 'pi pi-check' });
    if (plan.products) features.push({ label: `${plan.products} products`, icon: 'pi pi-check' });
    if (plan.users) features.push({ label: `${plan.users} users`, icon: 'pi pi-check' });
    if (plan.shops) features.push({ label: `${plan.shops} shops`, icon: 'pi pi-check' });
    if (plan.shippers) features.push({ label: `${plan.shippers} shippers`, icon: 'pi pi-check' });
    if (plan.customers) features.push({ label: `${plan.customers} customers`, icon: 'pi pi-check' });
    return features;
};

onMounted(async () => {
    authStore.verifySession();
    loading.stopPageLoading();

    try {
        plans.value = await usePlanService.getPublicPlans();
    } catch (error) {
        console.error('Error loading plans:', error);
    } finally {
        loadingPlans.value = false;
    }
});

function smoothScroll(id: string) {
    document.body.click();
    document.querySelector(id)?.scrollIntoView({
        behavior: 'smooth'
    });
}
</script>

<template>
    <div class="font-manrope bg-[#FCFCFD] dark:bg-surface-950 text-surface-900 dark:text-surface-0 overflow-hidden">
        <!-- ======================== HEADER ======================== -->
        <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800">
            <div class="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                <!-- Logo -->
                <a href="#" class="flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-3xl bg-gradient-to-br from-codly-purple-500 to-codly-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-codly-hover transition-shadow duration-300">
                        <i class="pi pi-box text-white text-lg"></i>
                    </div>
                    <span class="text-2xl font-bold bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 bg-clip-text text-transparent">Codly</span>
                </a>

                <!-- Mobile Menu -->
                <Button
                    class="lg:!hidden"
                    text
                    severity="secondary"
                    rounded
                    v-styleclass="{ selector: '#landing-nav', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                >
                    <i class="pi pi-bars !text-2xl"></i>
                </Button>

                <!-- Navigation -->
                <nav
                    id="landing-nav"
                    class="hidden lg:flex items-center gap-8 absolute lg:static top-full left-0 w-full lg:w-auto bg-white/95 dark:bg-surface-950/95 lg:bg-transparent px-6 lg:px-0 py-4 lg:py-0 border-b lg:border-0 border-surface-200 dark:border-surface-800"
                >
                    <ul class="list-none m-0 p-0 flex flex-col lg:flex-row items-start lg:items-center gap-1 lg:gap-1">
                        <li>
                            <a
                                @click="smoothScroll('#hero')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >{{ $t('home.nav.home') }}</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#features')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >{{ $t('home.nav.features') }}</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#tracking')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >{{ $t('home.nav.solutions') }}</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#pricing')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >{{ $t('home.nav.pricing') }}</a
                            >
                        </li>
                    </ul>

                    <div class="flex items-center gap-3 mt-4 lg:mt-0 border-t lg:border-0 border-surface-200 dark:border-surface-800 pt-4 lg:pt-0">
                        <!-- Locale pill switcher -->
                        <div class="locale-switcher">
                            <button v-for="locale in supportedLocales" :key="locale" class="locale-btn" :class="{ active: layoutStore.locale === locale }" @click="setLocale(locale)">
                                {{ locale }}
                            </button>
                        </div>

                        <template v-if="authStore.isLoggedIn">
                            <Button :label="$t('home.nav.dashboard')" icon="pi pi-th-large" as="router-link" to="/admin" rounded class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white"></Button>
                        </template>
                        <template v-else>
                            <Button :label="$t('home.nav.login')" text as="router-link" to="/auth/login" rounded class="!text-surface-700 dark:!text-surface-200 hover:!text-codly-purple-500"></Button>
                            <Button :label="$t('home.nav.get_started')" as="router-link" to="/auth/login" rounded class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white"></Button>
                        </template>
                    </div>
                </nav>
            </div>
        </header>

        <!-- ======================== HERO ======================== -->
        <section id="hero" class="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
            <!-- Background gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-codly-purple-500/5 via-transparent to-codly-cyan-500/5"></div>
            <div class="absolute top-20 right-0 w-[600px] h-[600px] bg-codly-purple-500/10 rounded-full blur-[128px]"></div>
            <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-codly-cyan-500/10 rounded-full blur-[128px]"></div>

            <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <!-- Left: Copy -->
                    <div class="text-center lg:text-left">
                        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-purple-500/10 text-codly-purple-500 dark:text-codly-purple-400 text-sm font-semibold mb-6">
                            <i class="pi pi-sparkles text-xs"></i>
                            <span>{{ $t('home.hero.badge') }}</span>
                        </div>
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-surface-900 dark:text-surface-0 mb-6">
                            <span class="block">{{ $t('home.hero.title_line1') }}</span>
                            <span class="bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 bg-clip-text text-transparent">{{ $t('home.hero.title_line2') }}</span>
                        </h1>
                        <p class="text-lg lg:text-xl text-surface-600 dark:text-surface-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                            {{ $t('home.hero.description') }}
                        </p>
                        <div class="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Button :label="$t('home.hero.cta_trial')" icon="pi pi-arrow-right" iconPos="right" rounded size="large" class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white !px-8 !py-3 !text-lg"></Button>
                            <Button :label="$t('home.hero.cta_demo')" icon="pi pi-play-circle" rounded size="large" outlined class="!border-codly-purple-500/30 !text-codly-purple-500 hover:!bg-codly-purple-500/5 !px-8 !py-3 !text-lg"></Button>
                        </div>
                    </div>

                    <!-- Right: Dashboard Preview -->
                    <div class="relative">
                        <!-- Main card -->
                        <div class="bg-white dark:bg-surface-900 rounded-3xl shadow-codly-card p-6 border border-surface-200 dark:border-surface-800">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <p class="text-sm text-surface-500 dark:text-surface-400 font-medium">{{ $t('home.hero.preview_hub') }}</p>
                                    <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ $t('home.hero.preview_overview') }}</p>
                                </div>
                                <div class="flex gap-2">
                                    <span class="inline-flex px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">{{ $t('home.hero.preview_live') }}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-6">
                                <div class="bg-gradient-to-br from-codly-cyan-500/10 to-codly-cyan-500/5 rounded-2xl p-4 border border-codly-cyan-500/10">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-codly-cyan-500/20 flex items-center justify-center">
                                            <i class="pi pi-check-circle text-codly-cyan-500 text-sm"></i>
                                        </div>
                                    </div>
                                    <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">98.5%</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ $t('home.hero.preview_success_rate') }}</p>
                                </div>
                                <div class="bg-gradient-to-br from-codly-purple-500/10 to-codly-purple-500/5 rounded-2xl p-4 border border-codly-purple-500/10">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-codly-purple-500/20 flex items-center justify-center">
                                            <i class="pi pi-dollar text-codly-purple-500 text-sm"></i>
                                        </div>
                                    </div>
                                    <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">$12.4K</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ $t('home.hero.preview_rto_savings') }}</p>
                                </div>
                            </div>

                            <!-- Progress -->
                            <div class="space-y-3">
                                <div class="flex justify-between text-sm">
                                    <span class="text-surface-600 dark:text-surface-400 font-medium">{{ $t('home.hero.preview_delivery_progress') }}</span>
                                    <span class="text-codly-purple-500 font-semibold">78%</span>
                                </div>
                                <div class="h-2.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 transition-all duration-1000" style="width: 78%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Floating card: Revenue -->
                        <div class="absolute -bottom-6 -left-6 bg-white dark:bg-surface-900 rounded-2xl shadow-codly-card p-4 border border-surface-200 dark:border-surface-800 hidden lg:block">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-3xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                                    <i class="pi pi-arrow-up-right text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">{{ $t('home.hero.preview_revenue_today') }}</p>
                                    <p class="text-lg font-bold text-surface-900 dark:text-surface-0">$4,250</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== TRUST BAR ======================== -->
        <section class="py-12 border-y border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <p class="text-center text-sm font-medium text-surface-500 dark:text-surface-400 mb-8 tracking-wider uppercase">{{ $t('home.trust_bar.title') }}</p>
                <div class="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-40 dark:opacity-30">
                    <span class="text-2xl font-bold text-surface-400">Shopify</span>
                    <span class="text-2xl font-bold text-surface-400">WooCommerce</span>
                    <span class="text-2xl font-bold text-surface-400">Magento</span>
                    <span class="text-2xl font-bold text-surface-400">BigCommerce</span>
                    <span class="text-2xl font-bold text-surface-400">Stripe</span>
                </div>
            </div>
        </section>

        <!-- ======================== FEATURES ======================== -->
        <section id="features" class="py-20 lg:py-28">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="text-center mb-16">
                    <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-purple-500/10 text-codly-purple-500 dark:text-codly-purple-400 text-sm font-semibold mb-4">
                        <i class="pi pi-bolt text-xs"></i> {{ $t('home.features.badge') }}
                    </span>
                    <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ $t('home.features.title') }}</h2>
                    <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">{{ $t('home.features.subtitle') }}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div
                        v-for="(feature, idx) in appFeatures"
                        :key="idx"
                        class="group bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 hover:shadow-codly-hover hover:border-codly-purple-500/20 transition-all duration-300"
                    >
                        <div :class="['w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300', feature.from, feature.to]">
                            <i :class="[feature.icon, 'text-lg', feature.iconColor]"></i>
                        </div>
                        <h3 class="text-base font-bold text-surface-900 dark:text-surface-0 mb-1.5">{{ feature.title }}</h3>
                        <p class="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== SMART TRACKING ======================== -->
        <section id="tracking" class="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/30">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <!-- Left: Visual -->
                    <div class="bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-200 dark:border-surface-800 shadow-codly-card">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div class="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div class="space-y-4">
                            <div class="flex items-center gap-4 p-4 rounded-3xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <i class="pi pi-check text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">{{ $t('home.tracking.delivery_success') }}</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8294 — Casablanca</p>
                                </div>
                                <span class="text-xs text-green-600 dark:text-green-400 font-medium">{{ $t('home.tracking.time_2min') }}</span>
                            </div>
                            <div class="flex items-center gap-4 p-4 rounded-3xl bg-codly-purple-500/5 border border-codly-purple-500/10">
                                <div class="w-10 h-10 rounded-full bg-codly-purple-500 flex items-center justify-center">
                                    <i class="pi pi-truck text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">{{ $t('home.tracking.in_transit') }}</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8295 — Rabat</p>
                                </div>
                                <span class="text-xs text-codly-purple-500 font-medium">{{ $t('home.tracking.time_5min') }}</span>
                            </div>
                            <div class="flex items-center gap-4 p-4 rounded-3xl bg-codly-cyan-500/5 border border-codly-cyan-500/10">
                                <div class="w-10 h-10 rounded-full bg-codly-cyan-500 flex items-center justify-center">
                                    <i class="pi pi-box text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">{{ $t('home.tracking.package_ready') }}</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8296 — Marrakech</p>
                                </div>
                                <span class="text-xs text-codly-cyan-500 font-medium">{{ $t('home.tracking.time_12min') }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Copy -->
                    <div>
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-cyan-500/10 text-codly-cyan-500 dark:text-codly-cyan-400 text-sm font-semibold mb-4">
                            <i class="pi pi-map-marker text-xs"></i> {{ $t('home.tracking.badge') }}
                        </span>
                        <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">{{ $t('home.tracking.title') }}</h2>
                        <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-8">{{ $t('home.tracking.description') }}</p>
                        <ul class="space-y-4">
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">{{ $t('home.tracking.feature_eta') }}</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">{{ $t('home.tracking.feature_sms') }}</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">{{ $t('home.tracking.feature_auto_sms') }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== AUTOMATED PAYOUTS ======================== -->
        <section class="py-20 lg:py-28">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <!-- Left: Copy -->
                    <div class="order-2 lg:order-1">
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-purple-500/10 text-codly-purple-500 dark:text-codly-purple-400 text-sm font-semibold mb-4">
                            <i class="pi pi-wallet text-xs"></i> {{ $t('home.payouts.badge') }}
                        </span>
                        <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">{{ $t('home.payouts.title') }}</h2>
                        <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-8">{{ $t('home.payouts.description') }}</p>
                        <div class="flex gap-6">
                            <div class="text-center">
                                <p class="text-3xl font-bold text-codly-purple-500">{{ $t('home.payouts.settlement_value') }}</p>
                                <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">{{ $t('home.payouts.avg_settlement') }}</p>
                            </div>
                            <div class="w-px bg-surface-200 dark:bg-surface-700"></div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-codly-cyan-500">{{ $t('home.payouts.transparency_value') }}</p>
                                <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">{{ $t('home.payouts.transparency') }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Visual -->
                    <div class="order-1 lg:order-2">
                        <div class="bg-gradient-to-br from-codly-purple-500 to-codly-purple-800 rounded-3xl p-8 text-white shadow-lg">
                            <p class="text-sm opacity-70 font-medium mb-2">{{ $t('home.payouts.available_balance') }}</p>
                            <p class="text-4xl font-extrabold mb-6">$48,290.50</p>
                            <div class="space-y-3 mb-6">
                                <div class="flex justify-between text-sm">
                                    <span class="opacity-70">{{ $t('home.payouts.auto_collections') }}</span>
                                    <span class="font-semibold text-green-300">+$4,290.00</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="opacity-70">{{ $t('home.payouts.processing_fees') }}</span>
                                    <span class="font-semibold text-red-300">-$1,245.50</span>
                                </div>
                            </div>
                            <Button :label="$t('home.payouts.request_transfer')" icon="pi pi-send" rounded class="!bg-codly-cyan-500 !border-codly-cyan-500 hover:!bg-codly-cyan-600 !text-white w-full !font-semibold"></Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== PRICING ======================== -->
        <section id="pricing" class="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/30">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="text-center mb-16">
                    <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-purple-500/10 text-codly-purple-500 dark:text-codly-purple-400 text-sm font-semibold mb-4"> <i class="pi pi-tag text-xs"></i> {{ $t('home.pricing.badge') }} </span>
                    <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ $t('home.pricing.title') }}</h2>
                    <p class="text-lg text-surface-600 dark:text-surface-400">{{ $t('home.pricing.subtitle') }}</p>
                </div>

                <!-- Loading skeleton -->
                <div v-if="loadingPlans" class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                    <div v-for="n in 4" :key="n" class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 flex flex-col gap-4">
                        <Skeleton width="60%" height="24px" />
                        <Skeleton width="80%" height="14px" />
                        <Skeleton width="50%" height="40px" class="mt-2" />
                        <div class="space-y-3 mt-4">
                            <Skeleton v-for="i in 4" :key="i" width="90%" height="14px" />
                        </div>
                        <Skeleton width="100%" height="42px" class="mt-auto" borderRadius="9999px" />
                    </div>
                </div>

                <!-- Plan cards -->
                <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                    <div
                        v-for="plan in plans"
                        :key="plan.id"
                        :class="[
                            'relative rounded-2xl p-8 flex flex-col',
                            plan.recommended
                                ? 'bg-white dark:bg-surface-900 border-2 border-codly-purple-500 shadow-codly-hover'
                                : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:shadow-codly-card transition-all duration-300'
                        ]"
                    >
                        <!-- Recommended badge -->
                        <div v-if="plan.recommended" class="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span class="px-4 py-1.5 rounded-full bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 text-white text-xs font-bold shadow-lg">{{ $t('home.pricing.recommended_badge') }}</span>
                        </div>

                        <!-- Plan icon + name -->
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ backgroundColor: plan.color + '15' }">
                                <i :class="plan.icon || 'pi pi-star'" :style="{ color: plan.color ?? undefined }" class="text-base"></i>
                            </div>
                            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ plan.name }}</h3>
                        </div>

                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">{{ plan.description }}</p>

                        <!-- Price -->
                        <div class="mb-8">
                            <span class="text-4xl font-extrabold text-surface-900 dark:text-surface-0">{{ formatPrice(Number(plan.monthly_price)) }}</span>
                            <span class="text-surface-500 dark:text-surface-400">{{ $t('home.pricing.per_month') }}</span>
                        </div>

                        <!-- Features -->
                        <ul class="space-y-3 mb-8 flex-1">
                            <li v-for="(feature, idx) in getPlanFeatures(plan)" :key="idx" class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                                <i class="pi pi-check text-codly-cyan-500"></i> {{ feature.label }}
                            </li>
                        </ul>

                        <!-- CTA -->
                        <Button
                            :label="$t('home.pricing.cta_get_started')"
                            rounded
                            :class="plan.recommended
                                ? '!bg-gradient-to-r !from-codly-purple-500 !to-codly-cyan-500 !border-0 !text-white hover:!opacity-90 w-full !font-semibold'
                                : '!border-surface-300 dark:!border-surface-600 !text-surface-700 dark:!text-surface-200 hover:!border-codly-purple-500 hover:!text-codly-purple-500 w-full'"
                            :outlined="!plan.recommended"
                        />
                    </div>
                </div>
            </div>
        </section>


        <!-- ======================== FOOTER ======================== -->
        <footer class="bg-gray-900 text-white py-16">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
                    <!-- Brand -->
                    <div class="col-span-2 md:col-span-1">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-codly-purple-500 to-codly-cyan-500 flex items-center justify-center">
                                <i class="pi pi-box text-white text-sm"></i>
                            </div>
                            <span class="text-xl font-bold">Codly</span>
                        </div>
                        <p class="text-gray-400 text-sm leading-relaxed">{{ $t('home.footer.tagline') }}</p>
                    </div>

                    <!-- Product -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">{{ $t('home.footer.product') }}</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.features') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.pricing') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.integrations') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.api') }}</a></li>
                        </ul>
                    </div>

                    <!-- Company -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">{{ $t('home.footer.company') }}</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.about') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.blog') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.careers') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.contact') }}</a></li>
                        </ul>
                    </div>

                    <!-- Resources -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">{{ $t('home.footer.resources') }}</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.documentation') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.help_center') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.community') }}</a></li>
                        </ul>
                    </div>

                    <!-- Legal -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">{{ $t('home.footer.legal') }}</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.privacy') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.terms') }}</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">{{ $t('home.footer.security') }}</a></li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p class="text-gray-500 text-sm">{{ $t('home.footer.copyright') }}</p>
                    <div class="flex gap-4">
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-800 hover:bg-codly-purple-500 flex items-center justify-center transition-colors"><i class="pi pi-twitter text-gray-400 hover:text-white text-sm"></i></a>
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-800 hover:bg-codly-purple-500 flex items-center justify-center transition-colors"><i class="pi pi-linkedin text-gray-400 hover:text-white text-sm"></i></a>
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-800 hover:bg-codly-purple-500 flex items-center justify-center transition-colors"><i class="pi pi-github text-gray-400 hover:text-white text-sm"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.locale-switcher {
    display: flex;
    align-items: center;
    background: var(--surface-hover);
    border-radius: 9999px;
    padding: 0.25rem;
    gap: 0.125rem;
}

.locale-btn {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    background: transparent;
    color: var(--text-color-secondary);
    transition: all 0.15s;
    text-transform: uppercase;
}

.locale-btn.active {
    background: var(--surface-card);
    color: var(--text-color);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.locale-btn:hover:not(.active) {
    color: var(--text-color);
}
</style>
