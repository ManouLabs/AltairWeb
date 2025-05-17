<script setup>
import { useUserService } from '@/services/useUserService';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { inject, onMounted, ref } from 'vue';

const { showToast } = useShowToast();
const errors = ref();
const loading = useLoading();
const dialogRef = inject('dialogRef');
const record = ref({});
const action = ref();
const rolesOptions = ref([]);

onMounted(() => {
    record.value = dialogRef.value.data.record;
    rolesOptions.value = dialogRef.value.data.rolesOptions;
    action.value = dialogRef.value.data.action;
});

function saveRecord() {
    record.value.roles = rolesOptions.value[1].map((permission) => permission.id);
    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useUserService.storeUser : (userData) => useUserService.updateUser(record.value.id, userData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            if (error.status != 422) {
                errors.value = error.response.data.errors;
                showToast('error', action.value, 'user', 'tr');
            }
        })
        .finally(() => {
            loading.stopPageLoading();
        });
}
const closeDialog = () => {
    dialogRef.value.close();
};
</script>
<template>
    <form @submit.prevent="saveRecord">
        <div class="flex flex-col gap-8 pt-2">
            <div>
                <FloatLabel variant="on">
                    <label for="name" class="block font-bold mb-3">{{ $t('user.columns.name') }}</label>
                    <InputText :disabled="loading.isPageLoading" id="name" v-model.trim="record.name" autofocus fluid :invalid="errors?.name ? true : false" required />
                </FloatLabel>
                <ErrorMessage field="name" :errors="errors" />
            </div>
            <div>
                <FloatLabel variant="on">
                    <label for="email" class="block font-bold mb-3">{{ $t('user.columns.email') }}</label>
                    <InputText type="email" :disabled="loading.isPageLoading" id="email" v-model.trim="record.email" autofocus fluid :invalid="errors?.email ? true : false" required />
                </FloatLabel>
                <ErrorMessage field="email" :errors="errors" />
            </div>
            <div>
                <FloatLabel variant="on">
                    <Password v-model.trim="record.password" :disabled="loading.isPageLoading" :invalid="errors?.password ? true : false" :required="action === ACTIONS.CREATE" autofocus fluid toggleMask>
                        <template #header>
                            <div class="font-semibold text-xm mb-4">{{ $t('user.columns.password') }}</div>
                        </template>
                        <template #footer>
                            <Divider />
                            <ul class="pl-2 my-0 leading-normal">
                                <li>{{ $t('common.contents.password_requirements.lowercase') }}</li>
                                <li>{{ $t('common.contents.password_requirements.uppercase') }}</li>
                                <li>{{ $t('common.contents.password_requirements.numeric') }}</li>
                                <li>{{ $t('common.contents.password_requirements.minimum_length', { length: 8 }) }}</li>
                            </ul>
                        </template>
                    </Password>
                    <label for="password">{{ $t('user.columns.password') }}</label>
                </FloatLabel>
                <ErrorMessage field="password" :errors="errors" />
            </div>

            <div>
                <FloatLabel variant="on">
                    <Password v-model.trim="record.password_confirmation" :disabled="loading.isPageLoading" :invalid="errors?.password ? true : false" :required="action === ACTIONS.CREATE" autofocus fluid toggleMask name="password_confirmation" />
                    <label for="password_confirmation">{{ $t('user.columns.password_confirmation') }}</label>
                </FloatLabel>
                <ErrorMessage field="password_confirmation" :errors="errors" />
            </div>

            <div>
                <ErrorMessage field="roles" :errors="errors" />
                <PickList
                    required
                    :disabled="loading.isPageLoading"
                    v-model="rolesOptions"
                    dataKey="id"
                    breakpoint="1400px"
                    :showSourceControls="false"
                    :showTargetControls="false"
                    striped
                    :invalid="errors?.roles ? true : false"
                    pt:header:class="bg-blue-500"
                    :pt="{
                        sourceListContainer: { class: errors?.roles ? 'rounded-md border border-red-500' : '' },
                        targetListContainer: { class: errors?.roles ? 'rounded-md border border-red-500' : '' }
                    }"
                >
                    <template #sourceheader>
                        {{ $t('user.placeholders.roles_available') }}
                    </template>
                    <template #targetheader>
                        {{ $t('user.placeholders.roles_selected') }}
                    </template>
                    <template #option="{ option }">
                        {{ option.name }}
                    </template>
                </PickList>
            </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="$t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
