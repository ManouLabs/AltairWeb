<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const form = ref({
    name: 'John Doe',
    email: 'john@company.com',
    phone: '',
    language: 'en',
    timezone: 'Africa/Algiers'
});

const avatarUrl = ref('/storage/profile/default.png'); // replace with dynamic URL if needed

const languages = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'العربية', value: 'ar' }
];

const timezones = [
    { label: 'Algiers (UTC+1)', value: 'Africa/Algiers' },
    { label: 'Paris (UTC+1)', value: 'Europe/Paris' },
    { label: 'UTC', value: 'UTC' }
];

function onAvatarSelect(event) {
    // preview logic or validation if needed
}

function uploadAvatar({ files }) {
    // upload logic here

    // simulate preview
    const reader = new FileReader();
    reader.onload = () => (avatarUrl.value = reader.result);
    reader.readAsDataURL(files[0]);
}

function saveProfile() {
    // API call here
}

function resetForm() {
    // Reset to original state
}
</script>
<template>
    <div class="p-4 space-y-6">
        <h2 class="text-xl font-semibold">{{ t('myaccount.tabs.profile') }}</h2>

        <div class="flex items-center gap-4">
            <Avatar :image="avatarUrl" shape="circle" size="xlarge" />
            <FileUpload mode="basic" name="avatar" accept="image/*" chooseLabel="Upload Avatar" @select="onAvatarSelect" :auto="true" :customUpload="true" @uploader="uploadAvatar" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label for="name" class="block font-medium mb-1">{{ t('user.columns.name') }}</label>
                <InputText id="name" v-model="form.name" class="w-full" />
            </div>

            <div>
                <label for="email" class="block font-medium mb-1">{{ t('user.columns.email') }}</label>
                <InputText id="email" v-model="form.email" class="w-full" disabled />
            </div>

            <div>
                <label for="phone" class="block font-medium mb-1">{{ t('user.columns.phone') || 'Phone' }}</label>
                <InputText id="phone" v-model="form.phone" class="w-full" />
            </div>

            <div>
                <label for="language" class="block font-medium mb-1">{{ t('common.labels.language') || 'Language' }}</label>
                <Dropdown id="language" v-model="form.language" :options="languages" optionLabel="label" optionValue="value" placeholder="Select Language" class="w-full" />
            </div>

            <div>
                <label for="timezone" class="block font-medium mb-1">Timezone</label>
                <Dropdown id="timezone" v-model="form.timezone" :options="timezones" optionLabel="label" optionValue="value" placeholder="Select Timezone" class="w-full" />
            </div>
        </div>

        <div class="pt-4 flex justify-end gap-2">
            <Button label="Reset" severity="secondary" @click="resetForm" />
            <Button label="Save" icon="pi pi-save" @click="saveProfile" />
        </div>
    </div>
</template>
