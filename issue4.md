# Issue 4: Add full validation and Version 2 behavior to the book routes

## Description
- Validate every book request body field for presence, type, length, and format before writing to MongoDB.
- Reject unknown fields, including `_id`, and reject `id` in PUT request bodies.
- Return the exact error messages in the spec, and only the first error found, using the spec's check order.
- Return `409` instead of `400` for a duplicate book `id`, using the unique index instead of a lookup before inserting.
- Confirm PUT uses `findOneAndUpdate` with `$set` and DELETE uses `deleteOne`, so each takes a single database call. Issue 2 already uses these.
- Update the Swagger documentation for every book route to show request schemas and every status code.
- Deploy the changes to Render and test them from the deployed `/api-docs` page.

## Depends On
- Issue 1
- Issue 2
- Issue 3

## Spec
### Data Model
Book documents will be stored in the `books` collection.

Required book fields:
- `id`: string, required, custom id such as `b1`, at most 20 characters
- `authorId`: string, required, references the `id` field of an author document, at most 20 characters
- `title`: string, required, at most 200 characters
- `publicationDate`: string, required, a valid calendar date in `YYYY-MM-DD` format

Server-added field:
- `_id`: MongoDB ObjectId added by the database when the book is created. Clients never send it. It is included in every book response as a string.

Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.

Example book object:

    {
      "_id": "6650f1a2b3c4d5e6f7a8b9c1",
      "id": "b1",
      "authorId": "a1",
      "title": "The Hobbit",
      "publicationDate": "1937-09-21"
    }

### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.

When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.

### Validation Rules
These rules apply to the request body of `POST /books` and `PUT /books/:id`.

- The body must be valid JSON, and it must be a JSON object (not an array, string, or number).
- The body may only contain the fields listed in the Data Model. Any other field, including `_id`, is rejected.
- `PUT /books/:id` may not include `id`. The book's id always comes from the URL and cannot be changed.
- A field counts as missing if it is absent, `null`, or a string that is empty or contains only whitespace.
- Every field must be a JSON string. Numbers, booleans, arrays, and objects are rejected. This also blocks MongoDB query operators such as `{ "$ne": null }` from being sent in place of a value.
- Leading and trailing whitespace is removed from each field before it is validated and saved.
- Fields are checked in this order: `id` (POST only), `authorId`, `title`, `publicationDate`.

### Request Processing Order
The API checks each book request in this order and stops at the first problem:

1. Request body (POST and PUT only): the body must be valid JSON and must be a JSON object. Returns `400`.
2. Allowed fields (POST and PUT only): the body must not contain unknown fields, and a PUT body must not contain `id`. Returns `400`.
3. Field values (POST and PUT only): each field is checked against the Validation Rules, in the order listed there. Returns `400`.
4. Author reference (POST and PUT only): `authorId` must match an existing author. Returns `400`.
5. Database operation: a duplicate `id` returns `409`, and no book with the URL id returns `404`.

For example, `PUT /books/b99` with a missing `title` returns `400`, even if book `b99` does not exist.

An unexpected server or database error at any step returns `500`.

### Routes

#### GET /books
Purpose: Return all books.

Success:
- Status code: `200`
- Response body: an array of book objects, or an empty array if there are no books

Errors:
- `500` if an unexpected server or database error occurs: `Internal server error`

#### GET /books/:id
Purpose: Return one book by its custom id.

Success:
- Status code: `200`
- Response body: the matching book object

Errors:
- `404` if no book exists with that id: `Book not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### POST /books
Purpose: Create a new book.

Request body:

    {
      "id": "b4",
      "authorId": "a1",
      "title": "Example Book Title",
      "publicationDate": "2026-01-15"
    }

Success:
- Status code: `201`
- Response body: the newly created book object, including `_id`

Errors:
- `400` if the body is not valid JSON: `Request body must be valid JSON`
- `400` if the body is not a JSON object: `Request body must be a JSON object`
- `400` if the body contains a field that is not allowed: `Unknown field: <field>` (for example, `Unknown field: _id`)
- `400` if a required field is missing: `<field> is required` (for example, `title is required`)
- `400` if a field is not a string: `<field> must be a string`
- `400` if a field is too long: `<field> must be at most <max> characters` (for example, `title must be at most 200 characters`)
- `400` if `publicationDate` is not a valid date: `publicationDate must be a valid date in YYYY-MM-DD format`
- `400` if the `authorId` does not match an existing author: `authorId does not match an existing author`
- `409` if the `id` already exists: `A book with this id already exists`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### PUT /books/:id
Purpose: Update an existing book.

PUT must include every updatable field (`authorId`, `title`, and `publicationDate`). Partial updates are not supported.

Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

Success:
- Status code: `200`
- Response body: the updated book object, including `id` and `_id`

Errors:
- `400` if the body is not valid JSON: `Request body must be valid JSON`
- `400` if the body is not a JSON object: `Request body must be a JSON object`
- `400` if the body contains `id`: `id cannot be changed`
- `400` if the body contains any other field that is not allowed: `Unknown field: <field>`
- `400` if a required field is missing: `<field> is required`
- `400` if a field is not a string: `<field> must be a string`
- `400` if a field is too long: `<field> must be at most <max> characters`
- `400` if `publicationDate` is not a valid date: `publicationDate must be a valid date in YYYY-MM-DD format`
- `400` if the `authorId` does not match an existing author: `authorId does not match an existing author`
- `404` if no book exists with that id: `Book not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### DELETE /books/:id
Purpose: Delete an existing book.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no book exists with that id: `Book not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

### Implementation Notes
- `POST /books` does not look up the `id` before inserting. It calls `insertOne`, and if MongoDB returns a duplicate key error (code `11000`) from the unique index, the API responds with `409`.
- `PUT /books/:id` uses `findOneAndUpdate` with `$set` on `authorId`, `title`, and `publicationDate` only, so `id` and `_id` never change. It uses the `returnDocument: 'after'` option so the updated book comes back from the same call. If no document is returned, the API responds with `404`. Otherwise it returns the updated book.
- `DELETE /books/:id` uses `deleteOne` without looking up the book first. If `deletedCount` is `0`, the API responds with `404`.

### Out of Scope
- Pagination: `GET /books` returns every book. Pagination can be added later if the collection grows large.

### Swagger Documentation
Swagger must document every book route. For each route, the documentation must include:
- The `Books` tag
- The `id` path parameter, for routes that have one
- For POST and PUT, the request body schema with required fields, types, maximum lengths, the `publicationDate` format, and an example
- Every status code listed for that route in this spec, with a response schema and an example, including error response bodies

### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.

## Implementation Guidance
- Put the validation code in a new `src/validators/` folder, next to `controllers/` and `models/`:
  - `src/validators/common.js` holds helpers that Issue 5 will reuse, such as checking allowed fields and checking a required string with a maximum length.
  - `src/validators/books.js` exports a function such as `validateBook(body, { isUpdate })` that returns the first error message, or `null` if the body is valid. It also returns the trimmed values to save.
  - The controllers call the validator before any database call.
- When checking allowed fields, a PUT body that contains `id` returns `id cannot be changed` before any other field is checked. If the body has more than one unknown field, the API reports the first one in the order they appear in the body.
- To check `publicationDate`, first check that it matches `YYYY-MM-DD` (four digits, dash, two digits, dash, two digits). Then build a date from it and check that the year, month, and day are unchanged, so `2026-02-30` is rejected.
- Change the duplicate key (code `11000`) handling from Issue 2 to respond with `409` instead of `400`.
- In the Swagger comments, add separate request body schemas for create and update (for example, `BookCreate` with `id`, and `BookUpdate` without it). Use `maxLength` for the length limits and `format: date` for `publicationDate`.

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
### GET routes
- `GET /books` returns 200 with an array of books, and each book includes `_id`, `id`, `authorId`, `title`, and `publicationDate`.
- `GET /books/:id` returns 200 with the matching book.
- `GET /books/b99` returns 404 with `Book not found`.

### POST /books
- A valid body returns 201 with the new book, including `_id`.
- A body containing `_id` returns 400 with `Unknown field: _id`.
- A body containing an unlisted field such as `isAdmin` returns 400 with `Unknown field: isAdmin`.
- A body with no `title` returns 400 with `title is required`.
- A body with `"title": null` or `"title": "   "` returns 400 with `title is required`.
- A body with `"title": 42` returns 400 with `title must be a string`.
- A body with `"authorId": { "$ne": null }` returns 400 with `authorId must be a string`.
- A `title` of 201 characters returns 400 with `title must be at most 200 characters`.
- An `id` of 21 characters returns 400 with `id must be at most 20 characters`.
- A `publicationDate` of `2026-02-30` or `01/15/2026` returns 400 with `publicationDate must be a valid date in YYYY-MM-DD format`.
- An `authorId` of `a999` returns 400 with `authorId does not match an existing author`.
- An `id` that already exists, such as `b1`, returns 409 with `A book with this id already exists`.
- A body with `"id": " b5 "` creates a book whose saved `id` is `b5`.
- A body that is missing both `id` and `title` returns only `id is required`.
- A body with an unknown field and a missing `title` returns only the unknown field error.

### PUT /books/:id
- A valid body returns 200 with the updated book, including `id` and `_id`, and a following `GET /books/:id` shows the changes.
- A body containing `id` returns 400 with `id cannot be changed`.
- A body containing both `id` and `isAdmin` returns only `id cannot be changed`.
- A body containing both `isAdmin` and `zzz`, in that order, returns only `Unknown field: isAdmin`.
- A body with no `publicationDate` returns 400 with `publicationDate is required`.
- A body with an `authorId` of `a999` returns 400 with `authorId does not match an existing author`.
- `PUT /books/b99` with a valid body returns 404 with `Book not found`.
- `PUT /books/b99` with a missing `title` returns 400 with `title is required`, not 404.

### DELETE /books/:id
- Deleting an existing book returns 204 with no response body.
- A following `GET /books/:id` for the deleted book returns 404.
- Deleting the same book again returns 404 with `Book not found`.

### Swagger and deployment
- Every book route in Swagger has the `Books` tag, the `id` path parameter where needed, request body schemas with required fields, types, maximum lengths, the date format, and examples.
- Every status code in this spec appears in Swagger for its route, with a response example.
- All book routes can be tested locally from `/api-docs`.
- All book routes can be tested from the deployed Render `/api-docs` page.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
