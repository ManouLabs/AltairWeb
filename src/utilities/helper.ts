// src/utilities/helper.ts

import dayjs from '@/plugins/dayjs';
import type { Ref } from 'vue';

interface DataRecord {
    id: number | string;
    [key: string]: unknown;
}

interface FilterModel {
    value: string | null;
}

interface LazyEvent {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
    page?: number;
}

interface LazyParams {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
    page?: number;
}

type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

function findRecordIndex(records: Ref<DataRecord[]>, id: number | string): number {
    return records.value.findIndex((record) => record.id === id);
}

function extractLazyParams(event: LazyEvent): LazyParams {
    const { first, rows, sortField, sortOrder, filters, page } = event;

    return {
        first,
        rows,
        sortField,
        sortOrder,
        filters,
        page
    };
}

function formatDate(e: Date | string | null, filterModel: FilterModel | null): void {
    if (e && filterModel) {
        filterModel.value = dayjs(e).format('YYYY-MM-DD');
    }
}

const humanizeDate = (dateString: string, t: TranslateFunction, locale: string = 'en-US'): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const formatTime = (d: Date): string => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });

    if (diffDays === 0) {
        return `${t('common.labels.today')}, ${formatTime(date)}`;
    } else if (diffDays === 1) {
        return `${t('common.labels.yesterday')}, ${formatTime(date)}`;
    } else if (diffDays < 7) {
        return `${t('common.labels.days_ago', { count: diffDays })}, ${formatTime(date)}`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${t('common.labels.weeks_ago', { count: weeks })}, ${formatTime(date)}`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `${t('common.labels.months_ago', { count: months })}, ${formatTime(date)}`;
    }
};

export { extractLazyParams, findRecordIndex, formatDate, humanizeDate };
export type { LazyParams, LazyEvent, DataRecord, FilterModel, TranslateFunction };
