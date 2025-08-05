// src/utilities/helper.js

import dayjs from '@/plugins/dayjs';

function findRecordIndex(records, id) {
    return records.value.findIndex((record) => record.id === id);
}

function extractLazyParams(event) {
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

/**
 * Normalize a date selection to YYYY-MM-DD format (used for Calendar filters)
 *
 * @param {Date} e - The selected date event from PrimeVue Calendar
 * @param {Object} filterModel - The filter model object containing a `value` key
 */
function formatDate(e, filterModel) {
    if (e && filterModel) {
        filterModel.value = dayjs(e).format('YYYY-MM-DD');
    }
}

/**
 * Humanize a date string into a more readable format.
 *
 * @param {*} dateString - The date string to humanize.
 * @param {*} locale - The locale to use for formatting.
 * @returns A humanized date string.
 */

const humanizeDate = (dateString, t, locale = 'en-US') => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const formatTime = (d) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });

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
