<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import apiClient from '@/services/axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const loading = useLoading();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const status = ref('');

onMounted(() => {
    loading.stopPageLoading();
    authStore.clearErrors();
    if (authStore.isLoggedIn) {
        router.push('/admin');
    }
});

const sendResetLink = async () => {
    try {
        authStore.clearErrors();
        status.value = '';
        loading.startFormSending();
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post('/forgot-password', { email: email.value });
        status.value = response.data.status;
    } catch (error) {
        authStore.processError(error, t('forgot_password_page.error'));
    } finally {
        loading.stopFormSending();
    }
};
</script>

<template>
    <div class="font-manrope min-h-screen w-full flex">
        <!-- ======================== LEFT SIDE: HERO ======================== -->
        <div class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden" style="background: linear-gradient(135deg, #06b6d4 0%, #7f13ec 100%)">
            <!-- Decorative blurred shapes -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
            <div class="absolute bottom-0 left-0 w-80 h-80 bg-codly-cyan-500/20 rounded-full blur-[100px]"></div>
            <div class="absolute top-1/3 left-1/4 w-64 h-64 bg-codly-purple-500/20 rounded-full blur-[80px]"></div>

            <!-- Logo -->
            <div class="relative z-10 flex items-center gap-3">
                <div class="w-10 h-10 bg-white rounded-3xl flex items-center justify-center shadow-lg">
                    <i class="pi pi-box text-codly-purple-500 text-lg"></i>
                </div>
                <h2 class="text-2xl font-bold tracking-tight text-white">Codly</h2>
            </div>

            <!-- Main Message -->
            <div class="relative z-10 max-w-md">
                <h1 class="text-5xl font-extrabold leading-tight mb-6 text-white">{{ t('forgot_password_page.hero_title') }}</h1>
                <p class="text-lg text-white/90 leading-relaxed">{{ t('forgot_password_page.hero_description') }}</p>
            </div>

            <!-- Footer: Social Proof -->
            <div class="relative z-10 flex items-center gap-4">
                <div class="flex -space-x-2">
                    <div class="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-codly-purple-400 to-codly-cyan-400 flex items-center justify-center text-xs font-bold">AK</div>
                    <div class="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-codly-cyan-400 to-green-400 flex items-center justify-center text-xs font-bold">SB</div>
                    <div class="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-pink-400 to-codly-purple-400 flex items-center justify-center text-xs font-bold">YE</div>
                </div>
                <p class="text-sm font-medium">Join 2,000+ logistics managers worldwide.</p>
            </div>
        </div>

        <!-- ======================== RIGHT SIDE: FORM ======================== -->
        <div class="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-white dark:bg-surface-950">
            <div class="w-full max-w-[440px] flex flex-col">
                <!-- Mobile Logo -->
                <div class="lg:hidden flex items-center gap-2 mb-8 self-start">
                    <div class="w-8 h-8 bg-codly-purple-500 rounded-lg flex items-center justify-center">
                        <i class="pi pi-box text-white text-sm"></i>
                    </div>
                    <span class="text-xl font-bold text-surface-900 dark:text-white">Codly</span>
                </div>

                <!-- ==================== SUCCESS STATE ==================== -->
                <div v-if="status" class="flex flex-col items-center text-center">
                    <!-- Envelope Icon -->
                    <div class="relative mb-6">
                        <div class="w-24 h-24 rounded-full bg-codly-purple-50 dark:bg-codly-purple-500/10 flex items-center justify-center">
                            <i class="pi pi-envelope text-4xl text-codly-purple-500"></i>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <i class="pi pi-check text-white text-sm font-bold"></i>
                        </div>
                    </div>

                    <!-- Heading -->
                    <h2 class="text-3xl font-extrabold text-surface-900 dark:text-white mb-3">{{ t('forgot_password_page.check_inbox') }}</h2>
                    <p class="text-surface-500 dark:text-surface-400 leading-relaxed mb-8">
                        {{ t('forgot_password_page.sent_to') }}
                        <span class="font-bold text-surface-900 dark:text-white">{{ email }}</span
                        >.
                        {{ t('forgot_password_page.follow_instructions') }}
                    </p>

                    <!-- Resend -->
                    <div class="text-sm text-surface-500 dark:text-surface-400">
                        {{ t('forgot_password_page.didnt_receive') }}
                        <button @click="sendResetLink" :disabled="loading.isFormSending" class="text-codly-purple-500 font-bold hover:underline cursor-pointer ml-1">
                            {{ t('forgot_password_page.resend_link') }}
                        </button>
                    </div>

                    <!-- Back to Login -->
                    <div class="mt-8">
                        <router-link :to="{ name: 'login' }" class="text-codly-purple-500 font-bold hover:underline inline-flex items-center gap-2">
                            <i class="pi pi-arrow-left text-sm"></i>
                            {{ t('forgot_password_page.back_to_login') }}
                        </router-link>
                    </div>
                </div>

                <!-- ==================== FORM STATE ==================== -->
                <template v-else>
                    <!-- Heading -->
                    <div class="mb-10">
                        <h2 class="text-3xl font-extrabold text-surface-900 dark:text-white mb-2">{{ t('forgot_password_page.title') }}</h2>
                        <p class="text-surface-500 dark:text-surface-400">{{ t('forgot_password_page.description') }}</p>
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="sendResetLink" class="space-y-6">
                        <!-- Email Field -->
                        <div>
                            <FloatLabel variant="on" class="w-full">
                                <IconField>
                                    <InputIcon class="pi pi-at" />
                                    <InputText id="email" type="email" v-model="email" class="w-full" :invalid="authStore.errors.email ? true : false" @input="() => authStore.clearErrors(['email'])" />
                                </IconField>
                                <label for="email">{{ t('forgot_password_page.email') }} *</label>
                            </FloatLabel>
                            <Message v-if="authStore.errors.email" severity="error" size="small">{{ authStore.errors.email[0] }}</Message>
                            <Message v-else-if="authStore.errors.general" severity="error" size="small">{{ authStore.errors.general }}</Message>
                        </div>

                        <!-- Submit Button -->
                        <Button
                            type="submit"
                            :label="t('forgot_password_page.send_link')"
                            :loading="loading.isFormSending"
                            icon="pi pi-send"
                            class="w-full !py-3.5 !rounded-lg !font-bold !text-base !shadow-lg !shadow-codly-purple-500/20 hover:!shadow-codly-purple-500/40 !transition-all !duration-200"
                            style="background: linear-gradient(90deg, #7f13ec 0%, #a855f7 100%); border: none"
                        />
                    </form>

                    <!-- Back to Login -->
                    <div class="mt-8 text-center">
                        <router-link :to="{ name: 'login' }" class="text-codly-purple-500 font-bold hover:underline inline-flex items-center gap-2">
                            <i class="pi pi-arrow-left text-sm"></i>
                            {{ t('forgot_password_page.back_to_login') }}
                        </router-link>
                    </div>
                </template>
            </div>

            <!-- Footer Links -->
            <div class="mt-12 lg:mt-24 flex gap-6 text-xs text-surface-400 font-medium">
                <router-link to="/privacy-policy" class="hover:text-codly-purple-500 transition-colors">{{ t('auth.privacy_policy') }}</router-link>
                <router-link to="/terms-of-service" class="hover:text-codly-purple-500 transition-colors">{{ t('auth.terms_of_service') }}</router-link>
            </div>
        </div>
    </div>
</template>
