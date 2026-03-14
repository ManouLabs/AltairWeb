<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useShowToast } from '@/utilities/toast';
import apiClient from '@/services/axios';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const token = ref('');
const email = ref('');
const password = ref('');
const password_confirmation = ref('');

onMounted(() => {
    loading.stopPageLoading();
    authStore.clearErrors();
    if (authStore.isLoggedIn) {
        router.push('/admin');
    }
    token.value = String(route.params.token || '');
    email.value = String(route.query.email || '');
});

const resetPassword = async () => {
    try {
        authStore.clearErrors();
        loading.startFormSending();
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post('/reset-password', {
            token: token.value,
            email: email.value,
            password: password.value,
            password_confirmation: password_confirmation.value
        });
        showToast('success', response.data.status || t('reset_password_page.success'), 'password', 'tc');
        router.push({ name: 'login' });
    } catch (error) {
        authStore.processError(error, t('reset_password_page.error'));
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
                <h1 class="text-5xl font-extrabold leading-tight mb-6 text-white">{{ t('reset_password_page.hero_title') }}</h1>
                <p class="text-lg text-white/90 leading-relaxed">{{ t('reset_password_page.hero_description') }}</p>
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

                <!-- Heading -->
                <div class="mb-10">
                    <h2 class="text-3xl font-extrabold text-surface-900 dark:text-white mb-2">{{ t('reset_password_page.title') }}</h2>
                    <p class="text-surface-500 dark:text-surface-400">{{ t('reset_password_page.description') }}</p>
                </div>

                <!-- Form -->
                <form @submit.prevent="resetPassword" class="space-y-6">
                    <!-- Email Field (readonly, pre-filled) -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-at" />
                                <InputText
                                    id="email"
                                    type="email"
                                    v-model="email"
                                    :invalid="authStore.errors.email ? true : false"
                                    readonly
                                    class="w-full !bg-surface-100 dark:!bg-surface-800 !text-surface-500"
                                />
                            </IconField>
                            <label for="email">{{ t('reset_password_page.email') }}</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors.email" severity="error" size="small">{{ authStore.errors.email[0] }}</Message>
                    </div>

                    <!-- New Password Field -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-lock" />
                                <Password
                                    id="password"
                                    v-model="password"
                                    toggleMask
                                    class="w-full"
                                    inputClass="w-full"
                                    :invalid="authStore.errors.password ? true : false"
                                    @input="() => authStore.clearErrors(['password'])"
                                />
                            </IconField>
                            <label for="password">{{ t('reset_password_page.new_password') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors.password" severity="error" size="small">{{ authStore.errors.password[0] }}</Message>
                    </div>

                    <!-- Confirm Password Field -->
                    <div>
                        <FloatLabel variant="on" class="w-full">
                            <IconField>
                                <InputIcon class="pi pi-shield" />
                                <Password
                                    id="password_confirmation"
                                    v-model="password_confirmation"
                                    :feedback="false"
                                    toggleMask
                                    class="w-full"
                                    inputClass="w-full"
                                    :invalid="authStore.errors.password_confirmation ? true : false"
                                    @input="() => authStore.clearErrors(['password_confirmation'])"
                                />
                            </IconField>
                            <label for="password_confirmation">{{ t('reset_password_page.confirm_password') }} *</label>
                        </FloatLabel>
                        <Message v-if="authStore.errors.password_confirmation" severity="error" size="small">{{ authStore.errors.password_confirmation[0] }}</Message>
                    </div>

                    <!-- Submit Button -->
                    <Button
                        type="submit"
                        :label="t('reset_password_page.reset_button')"
                        :loading="loading.isFormSending"
                        icon="pi pi-lock"
                        class="w-full !py-3.5 !rounded-lg !font-bold !text-base !shadow-lg !shadow-codly-purple-500/20 hover:!shadow-codly-purple-500/40 !transition-all !duration-200"
                        style="background: linear-gradient(90deg, #7f13ec 0%, #a855f7 100%); border: none"
                    />
                </form>

                <!-- Back to Login -->
                <div class="mt-8 text-center">
                    <router-link :to="{ name: 'login' }" class="text-codly-purple-500 font-bold hover:underline inline-flex items-center gap-2">
                        <i class="pi pi-arrow-left text-sm"></i>
                        {{ t('reset_password_page.back_to_login') }}
                    </router-link>
                </div>
            </div>

            <!-- Footer Links -->
            <div class="mt-12 lg:mt-24 flex gap-6 text-xs text-surface-400 font-medium">
                <a href="#" class="hover:text-codly-purple-500 transition-colors">Privacy Policy</a>
                <a href="#" class="hover:text-codly-purple-500 transition-colors">Terms of Service</a>
                <a href="#" class="hover:text-codly-purple-500 transition-colors">Contact Support</a>
            </div>
        </div>
    </div>
</template>

