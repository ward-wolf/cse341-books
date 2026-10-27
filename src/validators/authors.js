import { isMissing, checkAllowedFields, checkRequiredString } from './common.js';

// String fields in the order they are validated, with their maximum lengths.
// birthYear is checked after these.
const AUTHOR_STRING_FIELDS = [
  { name: 'id', maxLength: 20, createOnly: true },
  { name: 'name', maxLength: 100 },
];

// Validates a POST or PUT author body. Returns { error } with the first problem found,
// or { value } with the trimmed fields to save.
const validateAuthor = (body, { isUpdate = false } = {}) => {
  const stringFields = AUTHOR_STRING_FIELDS.filter((field) => {
    return !(isUpdate && field.createOnly);
  });
  const allowedFields = [
    ...stringFields.map((field) => {
      return field.name;
    }),
    'birthYear',
  ];

  const fieldError = checkAllowedFields(body, allowedFields, { isUpdate });
  if (fieldError) {
    return { error: fieldError };
  }

  const value = {};

  for (const field of stringFields) {
    const result = checkRequiredString(body, field.name, field.maxLength);
    if (result.error) {
      return { error: result.error };
    }
    value[field.name] = result.value;
  }

  if (isMissing(body.birthYear)) {
    return { error: 'birthYear is required' };
  }

  if (!Number.isInteger(body.birthYear)) {
    return { error: 'birthYear must be an integer' };
  }

  value.birthYear = body.birthYear;

  return { value };
};

export { validateAuthor };
