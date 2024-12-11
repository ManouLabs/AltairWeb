// utilities/helper.js

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

export { extractLazyParams, findRecordIndex };
