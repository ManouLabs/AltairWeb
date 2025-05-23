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

export { extractLazyParams, findRecordIndex, formatDate };
