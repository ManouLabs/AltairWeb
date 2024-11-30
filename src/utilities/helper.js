// utilities/helper.js

function findRecordIndex(records, id) {
    return records.value.findIndex((record) => record.id === id);
}

export { findRecordIndex };
