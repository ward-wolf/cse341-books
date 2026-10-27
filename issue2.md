# Issue 2: Update Book Collection to reference authors and finish Book API

## Description
- Update the existing book routes so they return and accept the `authorId` field added to book documents in Issue 1.
- Add the remaining CRUD operations for books.
- Validate book request bodies before writing to MongoDB.
- Validate that each submitted `authorId` matches an existing author document.
- Add Swagger documentation for all book routes.
- Test the book routes locally and in the deployed Render application.

## Depends On
- Issue 1

## Note
This issue uses the Version 1 behavior for the book routes. For example, a duplicate `id` returns `400`, and request bodies are only checked for missing fields and an existing `authorId`. Type, length, and format checks, and rejecting unknown fields, are added in Issue 4. Issue 4 updates the book routes to the full Version 2 spec, including returning `409` for a duplicate `id`.

## Spec
### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.

### Data Model
Book documents will be stored in the `books` collection.

Required book fields:
- `id`: string, required, custom id such as `b1`
- `authorId`: string, required, references the `id` field of an author document
- `title`: string, required
- `publicationDate`: string, required

Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.

When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.

### Routes

#### GET /books
Purpose: Return all books.

Success:
- Status code: `200`
- Response body: an array of book objects

Errors:
- `500` if an unexpected server or database error occurs

#### GET /books/:id
Purpose: Return one book by its custom id.

Success:
- Status code: `200`
- Response body: the matching book object

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

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
- Response body: the newly created book object

Errors:
- `400` if a required field is missing
- `400` if the `id` already exists
- `400` if the `authorId` does not match an existing author
- `500` if an unexpected server or database error occurs

#### PUT /books/:id
Purpose: Update an existing book.

Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

Success:
- Status code: `200`
- Response body: the updated book object

Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /books/:id
Purpose: Delete an existing book.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every book route.

### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.

## Implementation Guidance
- Add the new routes to `src/router.js`, the handlers to `src/controllers/books.js`, and the database functions to `src/models/books.js`, following the existing GET routes.
- A field counts as missing if it is absent, `null`, or a string that is empty or contains only whitespace. This is the same rule as Version 2.
- Every error response uses a JSON body of `{ "message": "..." }`. Use these messages, which match Version 2, so Issue 4 does not have to change them:
  - `<field> is required` (for example, `title is required`)
  - `authorId does not match an existing author`
  - `A book with this id already exists`
  - `Book not found`
  - `Internal server error`
- Issue 1 added a unique index on `books.id`, so `insertOne` throws a duplicate key error (code `11000`) when the `id` already exists. Catch that error and respond with `400` and `A book with this id already exists`. Without this, the response would be a `500`. Issue 4 changes this status to `409`.
- `PUT /books/:id` uses `findOneAndUpdate` with `$set` on `authorId`, `title`, and `publicationDate`, and the `returnDocument: 'after'` option. If it returns `null`, respond with `404`. This matches Version 2, so Issue 4 does not have to change it.
- `DELETE /books/:id` uses `deleteOne`. If `deletedCount` is `0`, respond with `404`.
- Add Swagger JSDoc comments in `src/router.js` for the new routes, reusing the existing `Book` and `ErrorResponse` schemas.

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
- Existing `GET /books` responses include `authorId`.
- Existing `GET /books/:id` responses include `authorId`.
- `POST /books` creates a book and returns status 201.
- `POST /books` returns 400 when required fields are missing.
- `POST /books` with an existing `id` returns 400 with `A book with this id already exists`, not 500.
- Every error response has a JSON body with one of the messages listed in Implementation Guidance.
- `POST /books` returns 400 when `authorId` does not match an existing author.
- `PUT /books/:id` updates an existing book.
- `PUT /books/:id` returns 400 when `authorId` does not match an existing author.
- `PUT /books/:id` returns 404 when the book does not exist.
- `DELETE /books/:id` deletes an existing book.
- `DELETE /books/:id` returns 404 when the book does not exist.
- All book routes are documented in Swagger.
- All book routes can be tested locally from `/api-docs`.
- All book routes can be tested from the deployed Render `/api-docs` page.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
