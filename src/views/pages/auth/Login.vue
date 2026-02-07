<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useShowToast } from '@/utilities/toast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useShowToast();
const loading = useLoading();
const router = useRouter();
const email = ref('');
const password = ref('');
const authStore = useAuthStore();

// Redirect to admin if already logged in
onMounted(() => {
    if (authStore.isLoggedIn) {
        router.push('/admin');
    }
});

const loginUser = async () => {
    try {
        loading.startFormSending();
        await authStore.login(email.value, password.value);
        authStore.redirectUser();
    } catch (error) {
        showToast('error', 'error', 'login', 'tc');
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
                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <i class="pi pi-box text-codly-purple-500 text-lg"></i>
                </div>
                <h2 class="text-2xl font-bold tracking-tight text-white">Codly</h2>
            </div>

            <!-- Main Message -->
            <div class="relative z-10 max-w-md">
                <h1 class="text-5xl font-extrabold leading-tight mb-6 text-white">Welcome back!</h1>
                <p class="text-lg text-white/90 leading-relaxed">Log in to manage your COD orders, track payments in real-time, and streamline your e-commerce logistics with ease.</p>
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

        <!-- ======================== RIGHT SIDE: LOGIN FORM ======================== -->
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
                    <h2 class="text-3xl font-extrabold text-surface-900 dark:text-white mb-2">{{ $t('login.welcome') }}</h2>
                    <p class="text-surface-500 dark:text-surface-400">{{ $t('login.sign_in_message') || 'Enter your credentials to access your dashboard' }}</p>
                </div>

                <!-- Login Form -->
                <form @submit.prevent="loginUser" class="space-y-6">
                    <!-- Email Field -->
                    <div class="space-y-2">
                        <label for="email" class="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
                            {{ $t('login.email') }}
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                                <i class="pi pi-at text-sm"></i>
                            </span>
                            <InputText
                                id="email"
                                type="email"
                                v-model="email"
                                :invalid="authStore.errors.email ? true : false"
                                required
                                :placeholder="$t('login.email') || 'name@company.com'"
                                class="w-full !pl-10 !py-3.5 !rounded-lg !border-surface-200 dark:!border-surface-700 !bg-surface-50 dark:!bg-surface-900 focus:!ring-2 focus:!ring-codly-purple-500 focus:!border-codly-purple-500 !transition-all !duration-200"
                            />
                        </div>
                        <Message v-if="authStore.errors.email" severity="error" size="small" variant="simple">{{ authStore.errors.email[0] }}</Message>
                    </div>

                    <!-- Password Field -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <label for="password" class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                {{ $t('login.password') }}
                            </label>
                            <a href="#" class="text-sm font-bold text-codly-purple-500 hover:underline transition-all">
                                {{ $t('login.forgot_password') }}
                            </a>
                        </div>
                        <IconField>
                            <InputIcon class="pi pi-key" />
                            <Password
                                id="password"
                                v-model="password"
                                :toggleMask="true"
                                fluid
                                :feedback="false"
                                :invalid="authStore.errors.password ? true : false"
                                required
                                :placeholder="'••••••••'"
                                :pt="{
                                    pcInput: {
                                        root: {
                                            class: '!py-3.5 !rounded-lg !border-surface-200 dark:!border-surface-700 !bg-surface-50 dark:!bg-surface-900 focus:!ring-2 focus:!ring-codly-purple-500 focus:!border-codly-purple-500 !transition-all !duration-200'
                                        }
                                    }
                                }"
                            />
                        </IconField>
                        <Message v-if="authStore.errors.password" severity="error" size="small" variant="simple">{{ authStore.errors.password[0] }}</Message>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center">
                        <Checkbox inputId="remember" :binary="true" class="!mr-2" />
                        <label for="remember" class="text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
                            {{ $t('login.remember_me') || 'Remember this device' }}
                        </label>
                    </div>

                    <!-- Login Button -->
                    <Button
                        type="submit"
                        :label="$t('login.sign_in')"
                        :loading="loading.isFormSending"
                        icon="pi pi-lock"
                        class="w-full !py-3.5 !rounded-lg !font-bold !text-base !shadow-lg !shadow-codly-purple-500/20 hover:!shadow-codly-purple-500/40 !transition-all !duration-200"
                        style="background: linear-gradient(90deg, #7f13ec 0%, #a855f7 100%); border: none"
                    />

                    <!-- Divider -->
                    <div class="relative flex items-center py-2">
                        <div class="flex-grow border-t border-surface-200 dark:border-surface-700"></div>
                        <span class="flex-shrink mx-4 text-surface-400 text-xs font-semibold uppercase tracking-wider">{{ $t('login.or_continue_with') || 'or continue with' }}</span>
                        <div class="flex-grow border-t border-surface-200 dark:border-surface-700"></div>
                    </div>

                    <!-- Social Login -->
                    <div class="grid grid-cols-2 gap-4">
                        <Button outlined class="!px-4 !py-2.5 !rounded-lg !border-surface-200 dark:!border-surface-700 !bg-white dark:!bg-surface-900 hover:!bg-surface-50 dark:hover:!bg-surface-800 !transition-colors">
                            <template #default>
                                <div class="flex items-center justify-center gap-2 w-full">
                                    <i class="pi pi-google text-sm"></i>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">Google</span>
                                </div>
                            </template>
                        </Button>
                        <Button outlined class="!px-4 !py-2.5 !rounded-lg !border-surface-200 dark:!border-surface-700 !bg-white dark:!bg-surface-900 hover:!bg-surface-50 dark:hover:!bg-surface-800 !transition-colors">
                            <template #default>
                                <div class="flex items-center justify-center gap-2 w-full">
                                    <i class="pi pi-facebook text-sm"></i>
                                    <span class="text-sm font-bold text-surface-700 dark:text-surface-300">Facebook</span>
                                </div>
                            </template>
                        </Button>
                    </div>
                </form>

                <!-- Sign Up Link -->
                <div class="mt-12 text-center">
                    <p class="text-surface-600 dark:text-surface-400">
                        {{ $t('login.no_account') || "Don't have an account?" }}
                        <a href="#" class="text-codly-purple-500 font-bold hover:underline">{{ $t('login.sign_up') || 'Sign up for a new account' }}</a>
                    </p>
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

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
