import { checkAllowedFields, checkRequiredString } from './common.js';

// Fields in the order they are validated, with their maximum lengths.
const BOOK_FIELDS = [
  { name: 'id', maxLength: 20, createOnly: true },
  { name: 'authorId', maxLength: 20 },
  { name: 'title', maxLength: 200 },
  { name: 'publicationDate' },
];

// True for a real calendar date in YYYY-MM-DD format, so 2026-02-30 is rejected.
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Validates a POST or PUT book body. Returns { error } with the first problem found,
// or { value } with the trimmed fields to save.
const validateBook = (body, { isUpdate = false } = {}) => {
  const fields = BOOK_FIELDS.filter((field) => {
    return !(isUpdate && field.createOnly);
  });
  const allowedFields = fields.map((field) => {
    return field.name;
  });

  const fieldError = checkAllowedFields(body, allowedFields, { isUpdate });
  if (fieldError) {
    return { error: fieldError };
  }

  const value = {};

  for (const field of fields) {
    const result = checkRequiredString(body, field.name, field.maxLength);
    if (result.error) {
      return { error: result.error };
    }
    value[field.name] = result.value;
  }

  if (!isValidDate(value.publicationDate)) {
    return { error: 'publicationDate must be a valid date in YYYY-MM-DD format' };
  }

  return { value };
};

export { validateBook };
