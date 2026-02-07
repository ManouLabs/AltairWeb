<script setup>
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore();

function smoothScroll(id) {
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
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-codly-purple-500 to-codly-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-codly-hover transition-shadow duration-300">
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
                                >Home</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#features')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >Features</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#tracking')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >Solutions</a
                            >
                        </li>
                        <li>
                            <a
                                @click="smoothScroll('#pricing')"
                                class="px-4 py-2 text-surface-600 dark:text-surface-300 hover:text-codly-purple-500 dark:hover:text-codly-purple-400 font-medium cursor-pointer transition-colors rounded-lg hover:bg-codly-purple-500/5"
                                >Pricing</a
                            >
                        </li>
                    </ul>

                    <div class="flex items-center gap-3 mt-4 lg:mt-0 border-t lg:border-0 border-surface-200 dark:border-surface-800 pt-4 lg:pt-0">
                        <template v-if="authStore.isLoggedIn">
                            <Button label="Dashboard" icon="pi pi-th-large" as="router-link" to="/admin" rounded class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white"></Button>
                        </template>
                        <template v-else>
                            <Button label="Login" text as="router-link" to="/auth/login" rounded class="!text-surface-700 dark:!text-surface-200 hover:!text-codly-purple-500"></Button>
                            <Button label="Get Started" as="router-link" to="/auth/login" rounded class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white"></Button>
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
                            <span>Simplify Cash on Delivery</span>
                        </div>
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-surface-900 dark:text-surface-0 mb-6">
                            <span class="block">Simplify Your</span>
                            <span class="bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 bg-clip-text text-transparent">COD Workflow</span>
                        </h1>
                        <p class="text-lg lg:text-xl text-surface-600 dark:text-surface-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                            Automate deliveries, track shipments in real-time, and manage payouts — all from one powerful platform built for e-commerce.
                        </p>
                        <div class="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Button label="Start Free Trial" icon="pi pi-arrow-right" iconPos="right" rounded size="large" class="!bg-codly-purple-500 !border-codly-purple-500 hover:!bg-codly-purple-600 !text-white !px-8 !py-3 !text-lg"></Button>
                            <Button label="Book a Demo" icon="pi pi-play-circle" rounded size="large" outlined class="!border-codly-purple-500/30 !text-codly-purple-500 hover:!bg-codly-purple-500/5 !px-8 !py-3 !text-lg"></Button>
                        </div>
                    </div>

                    <!-- Right: Dashboard Preview -->
                    <div class="relative">
                        <!-- Main card -->
                        <div class="bg-white dark:bg-surface-900 rounded-3xl shadow-codly-card p-6 border border-surface-200 dark:border-surface-800">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <p class="text-sm text-surface-500 dark:text-surface-400 font-medium">Logistics Hub</p>
                                    <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">Overview</p>
                                </div>
                                <div class="flex gap-2">
                                    <span class="inline-flex px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Live</span>
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
                                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">Success Rate</p>
                                </div>
                                <div class="bg-gradient-to-br from-codly-purple-500/10 to-codly-purple-500/5 rounded-2xl p-4 border border-codly-purple-500/10">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-codly-purple-500/20 flex items-center justify-center">
                                            <i class="pi pi-dollar text-codly-purple-500 text-sm"></i>
                                        </div>
                                    </div>
                                    <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">$12.4K</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">RTO Savings</p>
                                </div>
                            </div>

                            <!-- Progress -->
                            <div class="space-y-3">
                                <div class="flex justify-between text-sm">
                                    <span class="text-surface-600 dark:text-surface-400 font-medium">Delivery Progress</span>
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
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                                    <i class="pi pi-arrow-up-right text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Revenue Today</p>
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
                <p class="text-center text-sm font-medium text-surface-500 dark:text-surface-400 mb-8 tracking-wider uppercase">Trusted by leading e-commerce platforms</p>
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
                        <i class="pi pi-bolt text-xs"></i> Built for E-commerce Scale
                    </span>
                    <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">Why E-commerce Leaders Choose Codly</h2>
                    <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">Our platform is built to handle the unique challenges of cash-on-delivery logistics at scale.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div class="group bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 hover:shadow-codly-hover hover:border-codly-purple-500/20 transition-all duration-300">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-codly-purple-500/20 to-codly-purple-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-shield text-2xl text-codly-purple-500"></i>
                        </div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-3">Bulletproof Reliability</h3>
                        <p class="text-surface-600 dark:text-surface-400 leading-relaxed">99.9% uptime guaranteed. Your deliveries never stop, with redundant systems and real-time failover.</p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="group bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 hover:shadow-codly-hover hover:border-codly-cyan-500/20 transition-all duration-300">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-codly-cyan-500/20 to-codly-cyan-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-bolt text-2xl text-codly-cyan-500"></i>
                        </div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-3">Incredible Speed</h3>
                        <p class="text-surface-600 dark:text-surface-400 leading-relaxed">Process thousands of orders per second with our optimized pipeline. No delays, no bottlenecks.</p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="group bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 hover:shadow-codly-hover hover:border-codly-purple-500/20 transition-all duration-300">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-codly-purple-500/20 to-codly-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-sync text-2xl text-codly-purple-500"></i>
                        </div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-3">Total Automation</h3>
                        <p class="text-surface-600 dark:text-surface-400 leading-relaxed">Automate payouts, label printing, and customer notifications with our end-to-end automation suite.</p>
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
                            <div class="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <i class="pi pi-check text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">Successful Delivery</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8294 — Casablanca</p>
                                </div>
                                <span class="text-xs text-green-600 dark:text-green-400 font-medium">2 min ago</span>
                            </div>
                            <div class="flex items-center gap-4 p-4 rounded-xl bg-codly-purple-500/5 border border-codly-purple-500/10">
                                <div class="w-10 h-10 rounded-full bg-codly-purple-500 flex items-center justify-center">
                                    <i class="pi pi-truck text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">In Transit</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8295 — Rabat</p>
                                </div>
                                <span class="text-xs text-codly-purple-500 font-medium">5 min ago</span>
                            </div>
                            <div class="flex items-center gap-4 p-4 rounded-xl bg-codly-cyan-500/5 border border-codly-cyan-500/10">
                                <div class="w-10 h-10 rounded-full bg-codly-cyan-500 flex items-center justify-center">
                                    <i class="pi pi-box text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">Package Ready</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">Order #8296 — Marrakech</p>
                                </div>
                                <span class="text-xs text-codly-cyan-500 font-medium">12 min ago</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Copy -->
                    <div>
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-cyan-500/10 text-codly-cyan-500 dark:text-codly-cyan-400 text-sm font-semibold mb-4">
                            <i class="pi pi-map-marker text-xs"></i> Advanced Analytics
                        </span>
                        <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">Smart Tracking for Peace of Mind</h2>
                        <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-8">Give your customers and team real-time visibility. Our predictive tracking combines powerful data to reduce RTO rates by up to 40%.</p>
                        <ul class="space-y-4">
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">Real-time delivery ETAs</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">Auto SMS/WhatsApp updates</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full bg-codly-cyan-500/20 flex items-center justify-center flex-shrink-0"><i class="pi pi-check text-codly-cyan-500 text-xs"></i></div>
                                <span class="text-surface-700 dark:text-surface-300 font-medium">Automated SMS/WhatsApp updates</span>
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
                            <i class="pi pi-wallet text-xs"></i> Financial Autopilot
                        </span>
                        <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">Automated Payouts, No More Waiting</h2>
                        <p class="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-8">Stop chasing delivery partners for your money. Codly reconciles every cent and automates payouts directly to your bank account twice a week.</p>
                        <div class="flex gap-6">
                            <div class="text-center">
                                <p class="text-3xl font-bold text-codly-purple-500">2 Days</p>
                                <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">Avg. Settlement</p>
                            </div>
                            <div class="w-px bg-surface-200 dark:bg-surface-700"></div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-codly-cyan-500">100%</p>
                                <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">Transparency</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Visual -->
                    <div class="order-1 lg:order-2">
                        <div class="bg-gradient-to-br from-codly-purple-500 to-codly-purple-800 rounded-3xl p-8 text-white shadow-lg">
                            <p class="text-sm opacity-70 font-medium mb-2">Available Balance</p>
                            <p class="text-4xl font-extrabold mb-6">$48,290.50</p>
                            <div class="space-y-3 mb-6">
                                <div class="flex justify-between text-sm">
                                    <span class="opacity-70">Automatic Collections</span>
                                    <span class="font-semibold text-green-300">+$4,290.00</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="opacity-70">Processing Fees</span>
                                    <span class="font-semibold text-red-300">-$1,245.50</span>
                                </div>
                            </div>
                            <Button label="Request Transfer Now" icon="pi pi-send" rounded class="!bg-codly-cyan-500 !border-codly-cyan-500 hover:!bg-codly-cyan-600 !text-white w-full !font-semibold"></Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== PRICING ======================== -->
        <section id="pricing" class="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/30">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="text-center mb-16">
                    <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-purple-500/10 text-codly-purple-500 dark:text-codly-purple-400 text-sm font-semibold mb-4"> <i class="pi pi-tag text-xs"></i> Simple Pricing </span>
                    <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">Simple, Transparent Pricing</h2>
                    <p class="text-lg text-surface-600 dark:text-surface-400">Scale your business with plans that grow with you. No hidden fees.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <!-- Starter -->
                    <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 hover:shadow-codly-card transition-all duration-300 flex flex-col">
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">Starter</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">Perfect for growing stores</p>
                        <div class="mb-8">
                            <span class="text-4xl font-extrabold text-surface-900 dark:text-surface-0">$49</span>
                            <span class="text-surface-500 dark:text-surface-400">/month</span>
                        </div>
                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Up to 500 deliveries/mo</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Basic tracking</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Email support</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> 1 shipper integration</li>
                        </ul>
                        <Button label="Get Started" rounded outlined class="!border-surface-300 dark:!border-surface-600 !text-surface-700 dark:!text-surface-200 hover:!border-codly-purple-500 hover:!text-codly-purple-500 w-full"></Button>
                    </div>

                    <!-- Growth Pro (highlighted) -->
                    <div class="relative bg-white dark:bg-surface-900 rounded-2xl p-8 border-2 border-codly-purple-500 shadow-codly-hover flex flex-col">
                        <div class="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span class="px-4 py-1.5 rounded-full bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 text-white text-xs font-bold shadow-lg">Most Popular</span>
                        </div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">Growth Pro</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">For scaling businesses</p>
                        <div class="mb-8">
                            <span class="text-4xl font-extrabold text-surface-900 dark:text-surface-0">$149</span>
                            <span class="text-surface-500 dark:text-surface-400">/month</span>
                        </div>
                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Unlimited deliveries</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Advanced tracking + analytics</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Priority support</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Multi-shipper integration</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Automated payouts</li>
                        </ul>
                        <Button label="Get Started" rounded class="!bg-gradient-to-r !from-codly-purple-500 !to-codly-cyan-500 !border-0 !text-white hover:!opacity-90 w-full !font-semibold"></Button>
                    </div>

                    <!-- Enterprise -->
                    <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800 hover:shadow-codly-card transition-all duration-300 flex flex-col">
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">Enterprise</h3>
                        <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">Tailor-made for your logistics</p>
                        <div class="mb-8">
                            <span class="text-4xl font-extrabold text-surface-900 dark:text-surface-0">Custom</span>
                        </div>
                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Everything in Pro</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Custom API integration</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> Dedicated account manager</li>
                            <li class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300"><i class="pi pi-check text-codly-cyan-500"></i> SLA guarantee</li>
                        </ul>
                        <Button label="Contact Sales" rounded outlined class="!border-surface-300 dark:!border-surface-600 !text-surface-700 dark:!text-surface-200 hover:!border-codly-purple-500 hover:!text-codly-purple-500 w-full"></Button>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======================== TESTIMONIALS ======================== -->
        <section class="py-20 lg:py-28">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">Trusted by 2,500+ Merchants</h2>
                    <p class="text-lg text-surface-600 dark:text-surface-400">Real results from businesses like yours.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800">
                        <div class="flex gap-1 mb-4">
                            <i class="pi pi-star-fill text-yellow-400" v-for="n in 5" :key="n"></i>
                        </div>
                        <p class="text-surface-700 dark:text-surface-300 leading-relaxed mb-6">"Codly reduced our RTO rate by 35% in the first month. The automated tracking notifications alone saved us hours of customer support."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-codly-purple-500 to-codly-cyan-500 flex items-center justify-center text-white font-bold text-sm">AK</div>
                            <div>
                                <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">Ahmed K.</p>
                                <p class="text-xs text-surface-500 dark:text-surface-400">CEO, FastDrop</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800">
                        <div class="flex gap-1 mb-4">
                            <i class="pi pi-star-fill text-yellow-400" v-for="n in 5" :key="n"></i>
                        </div>
                        <p class="text-surface-700 dark:text-surface-300 leading-relaxed mb-6">"The payout automation is a game-changer. We used to spend days reconciling — now it's all handled automatically."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-codly-cyan-500 to-green-400 flex items-center justify-center text-white font-bold text-sm">SB</div>
                            <div>
                                <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">Sara B.</p>
                                <p class="text-xs text-surface-500 dark:text-surface-400">Founder, E-Store MA</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-800">
                        <div class="flex gap-1 mb-4">
                            <i class="pi pi-star-fill text-yellow-400" v-for="n in 5" :key="n"></i>
                        </div>
                        <p class="text-surface-700 dark:text-surface-300 leading-relaxed mb-6">"We integrated 3 different shippers in under an hour. The API is incredibly well-documented and the dashboard is beautiful."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-codly-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm">YE</div>
                            <div>
                                <p class="font-semibold text-surface-900 dark:text-surface-0 text-sm">Youssef E.</p>
                                <p class="text-xs text-surface-500 dark:text-surface-400">CTO, ShipRight</p>
                            </div>
                        </div>
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
                        <p class="text-gray-400 text-sm leading-relaxed">Simplifying COD logistics for e-commerce businesses everywhere.</p>
                    </div>

                    <!-- Product -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">Product</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Integrations</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">API</a></li>
                        </ul>
                    </div>

                    <!-- Company -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">Company</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">About</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Careers</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <!-- Resources -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">Resources</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Documentation</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Help Center</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Community</a></li>
                        </ul>
                    </div>

                    <!-- Legal -->
                    <div>
                        <h4 class="font-semibold mb-4 text-sm tracking-wider uppercase text-gray-300">Legal</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Terms</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white text-sm transition-colors">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p class="text-gray-500 text-sm">&copy; 2026 Codly. All rights reserved.</p>
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
