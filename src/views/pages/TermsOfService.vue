<script setup lang="ts">
import { useLoading } from '@/stores/useLoadingStore';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const loading = useLoading();

onMounted(() => {
    loading.stopPageLoading();
});
</script>

<template>
    <div class="font-manrope bg-[#FCFCFD] dark:bg-surface-950 text-surface-900 dark:text-surface-0 min-h-screen">
        <!-- Header -->
        <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800">
            <div class="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                <router-link to="/" class="flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-3xl bg-gradient-to-br from-codly-purple-500 to-codly-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-codly-hover transition-shadow duration-300">
                        <i class="pi pi-box text-white text-lg"></i>
                    </div>
                    <span class="text-2xl font-bold bg-gradient-to-r from-codly-purple-500 to-codly-cyan-500 bg-clip-text text-transparent">Codly</span>
                </router-link>
                <router-link to="/" class="text-sm font-medium text-surface-500 hover:text-codly-purple-500 transition-colors flex items-center gap-2">
                    <i class="pi pi-arrow-left text-xs"></i>
                    {{ t('legal.back_to_home') }}
                </router-link>
            </div>
        </header>

        <!-- Content -->
        <main class="max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
            <!-- Title -->
            <div class="mb-12">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-codly-cyan-500/10 text-codly-cyan-500 dark:text-codly-cyan-400 text-sm font-semibold mb-4">
                    <i class="pi pi-file text-xs"></i>
                    {{ t('legal.terms.badge') }}
                </div>
                <h1 class="text-4xl lg:text-5xl font-extrabold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.title') }}</h1>
                <p class="text-surface-500 dark:text-surface-400">{{ t('legal.terms.last_updated') }}</p>
            </div>

            <!-- Sections -->
            <div class="prose prose-lg dark:prose-invert max-w-none space-y-10">
                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s1_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s1_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s2_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s2_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s3_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed mb-4">{{ t('legal.terms.s3_intro') }}</p>
                    <ul class="space-y-2 text-surface-600 dark:text-surface-400">
                        <li class="flex items-start gap-2"><i class="pi pi-check text-codly-cyan-500 mt-1 text-sm"></i><span>{{ t('legal.terms.s3_item1') }}</span></li>
                        <li class="flex items-start gap-2"><i class="pi pi-check text-codly-cyan-500 mt-1 text-sm"></i><span>{{ t('legal.terms.s3_item2') }}</span></li>
                        <li class="flex items-start gap-2"><i class="pi pi-check text-codly-cyan-500 mt-1 text-sm"></i><span>{{ t('legal.terms.s3_item3') }}</span></li>
                        <li class="flex items-start gap-2"><i class="pi pi-check text-codly-cyan-500 mt-1 text-sm"></i><span>{{ t('legal.terms.s3_item4') }}</span></li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s4_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s4_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s5_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s5_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s6_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s6_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s7_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s7_content') }}</p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ t('legal.terms.s8_title') }}</h2>
                    <p class="text-surface-600 dark:text-surface-400 leading-relaxed">{{ t('legal.terms.s8_content') }}</p>
                </section>
            </div>
        </main>

        <!-- Footer -->
        <footer class="border-t border-surface-200 dark:border-surface-800 py-8">
            <div class="max-w-4xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-sm text-surface-400">© 2026 Codly. {{ t('legal.all_rights_reserved') }}</p>
                <div class="flex gap-6 text-sm text-surface-400">
                    <router-link to="/terms-of-service" class="hover:text-codly-purple-500 transition-colors font-semibold text-codly-purple-500">{{ t('auth.terms_of_service') }}</router-link>
                    <router-link to="/privacy-policy" class="hover:text-codly-purple-500 transition-colors">{{ t('auth.privacy_policy') }}</router-link>
                </div>
            </div>
        </footer>
    </div>
</template>
