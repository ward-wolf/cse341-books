// A field is missing if it is absent, null, or a blank string.
const isMissing = (value) => {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
};

// Returns an error message for the first field that is not allowed, or null.
// On updates, an id in the body is reported before any other unknown field.
const checkAllowedFields = (body, allowedFields, { isUpdate = false } = {}) => {
  if (isUpdate && Object.hasOwn(body, 'id')) {
    return 'id cannot be changed';
  }

  const unknownField = Object.keys(body).find((field) => {
    return !allowedFields.includes(field);
  });
  return unknownField ? `Unknown field: ${unknownField}` : null;
};

// Checks a required string field. Returns { error } or { value } with the trimmed string.
const checkRequiredString = (body, field, maxLength) => {
  const value = body[field];

  if (isMissing(value)) {
    return { error: `${field} is required` };
  }

  if (typeof value !== 'string') {
    return { error: `${field} must be a string` };
  }

  const trimmed = value.trim();

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { error: `${field} must be at most ${maxLength} characters` };
  }

  return { value: trimmed };
};

export { isMissing, checkAllowedFields, checkRequiredString };
