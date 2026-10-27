# Issue 5: Add author CRUD routes

## Description
- Add routes to get all authors, get one author, create an author, update an author, and delete an author.
- Validate author request bodies before writing to MongoDB, using the same rules and error format as the book routes.
- Prevent an author from being deleted while any book still references them.
- Add Swagger documentation for all author routes.
- Test the author routes locally and in the deployed Render application.

## Depends On
- Issue 1
- Issue 3
- Issue 4

## Spec
### Goal
Add an authors resource to the API that supports all CRUD operations for authors. Authors are the documents that books reference through their `authorId` field. Every author route must be documented and testable in Swagger.

### Data Model
Author documents will be stored in the `authors` collection.

Required author fields:
- `id`: string, required, custom id such as `a1`, at most 20 characters
- `name`: string, required, at most 100 characters
- `birthYear`: integer, required, a whole number such as `1892`

Server-added field:
- `_id`: MongoDB ObjectId added by the database when the author is created. Clients never send it. It is included in every author response as a string.

Authors will use custom string ids instead of MongoDB `_id` values for route parameters, following the same pattern as books.

Example author object:

    {
      "_id": "6650f1a2b3c4d5e6f7a8b9c0",
      "id": "a1",
      "name": "J.R.R. Tolkien",
      "birthYear": 1892
    }

### Relationship to Books
A book's `authorId` field stores the `id` value of an author document. One author can have many books.

An author cannot be deleted while any book still references that author. The client must delete those books, or update them to reference a different author, before deleting the author.

An author's `id` cannot be changed, because that would break the `authorId` reference on every one of the author's books.

### Validation Rules
These rules apply to the request body of `POST /authors` and `PUT /authors/:id`.

- The body must be valid JSON, and it must be a JSON object (not an array, string, or number).
- The body may only contain the fields listed in the Data Model. Any other field, including `_id`, is rejected.
- `PUT /authors/:id` may not include `id`. The author's id always comes from the URL and cannot be changed.
- A field counts as missing if it is absent, `null`, or a string that is empty or contains only whitespace.
- `id` and `name` must be JSON strings. Numbers, booleans, arrays, and objects are rejected. This also blocks MongoDB query operators such as `{ "$ne": null }` from being sent in place of a value.
- `birthYear` must be a JSON number with no decimal part. Strings such as `"1892"` are rejected.
- Leading and trailing whitespace is removed from `id` and `name` before they are validated and saved.
- Fields are checked in this order: `id` (POST only), `name`, `birthYear`.

### Error Responses
Every error response will have a JSON body with a `message` field that describes the error:

    {
      "message": "Author not found"
    }

When a request has more than one problem, the API returns only the first error it finds, using the order in Request Processing Order.

`500` responses always use the message `Internal server error` and never include stack traces or database error details.

### Request Processing Order
The API checks each author request in this order and stops at the first problem:

1. Request body (POST and PUT only): the body must be valid JSON and must be a JSON object. Returns `400`.
2. Allowed fields (POST and PUT only): the body must not contain unknown fields, and a PUT body must not contain `id`. Returns `400`.
3. Field values (POST and PUT only): each field is checked against the Validation Rules, in the order listed there. Returns `400`.
4. Book references (DELETE only): if any book still references the author, returns `409`.
5. Database operation: a duplicate `id` returns `409`, and no author with the URL id returns `404`.

For example, `PUT /authors/a99` with a missing `name` returns `400`, even if author `a99` does not exist.

An unexpected server or database error at any step returns `500`.

### Routes

#### GET /authors
Purpose: Return all authors.

Success:
- Status code: `200`
- Response body: an array of author objects, or an empty array if there are no authors

Errors:
- `500` if an unexpected server or database error occurs: `Internal server error`

#### GET /authors/:id
Purpose: Return one author by their custom id.

Success:
- Status code: `200`
- Response body: the matching author object

Errors:
- `404` if no author exists with that id: `Author not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### POST /authors
Purpose: Create a new author.

Request body:

    {
      "id": "a4",
      "name": "Example Author Name",
      "birthYear": 1965
    }

Success:
- Status code: `201`
- Response body: the newly created author object, including `_id`

Errors:
- `400` if the body is not valid JSON: `Request body must be valid JSON`
- `400` if the body is not a JSON object: `Request body must be a JSON object`
- `400` if the body contains a field that is not allowed: `Unknown field: <field>` (for example, `Unknown field: _id`)
- `400` if a required field is missing: `<field> is required` (for example, `name is required`)
- `400` if `id` or `name` is not a string: `<field> must be a string`
- `400` if `id` or `name` is too long: `<field> must be at most <max> characters` (for example, `name must be at most 100 characters`)
- `400` if `birthYear` is not a whole number: `birthYear must be an integer`
- `409` if the `id` already exists: `An author with this id already exists`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### PUT /authors/:id
Purpose: Update an existing author.

PUT must include every updatable field (`name` and `birthYear`). Partial updates are not supported.

Request body:

    {
      "name": "Updated Author Name",
      "birthYear": 1970
    }

Success:
- Status code: `200`
- Response body: the updated author object, including `id` and `_id`

Errors:
- `400` if the body is not valid JSON: `Request body must be valid JSON`
- `400` if the body is not a JSON object: `Request body must be a JSON object`
- `400` if the body contains `id`: `id cannot be changed`
- `400` if the body contains any other field that is not allowed: `Unknown field: <field>`
- `400` if a required field is missing: `<field> is required`
- `400` if `name` is not a string: `name must be a string`
- `400` if `name` is too long: `name must be at most 100 characters`
- `400` if `birthYear` is not a whole number: `birthYear must be an integer`
- `404` if no author exists with that id: `Author not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

#### DELETE /authors/:id
Purpose: Delete an existing author who has no books.

Success:
- Status code: `204`
- Response body: none

Errors:
- `409` if one or more books still reference the author: `Cannot delete an author who still has books`
- `404` if no author exists with that id: `Author not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

### Implementation Notes
- `POST /authors` does not look up the `id` before inserting. It calls `insertOne`, and if MongoDB returns a duplicate key error (code `11000`) from the unique index, the API responds with `409`.
- `PUT /authors/:id` uses `findOneAndUpdate` with `$set` on `name` and `birthYear` only, so `id` and `_id` never change. It uses the `returnDocument: 'after'` option so the updated author comes back from the same call. If no document is returned, the API responds with `404`. Otherwise it returns the updated author.
- `DELETE /authors/:id` first checks for a book with a matching `authorId` using `findOne`. This uses the `authorId` index and stops at the first match instead of loading every book. If no book matches, it calls `deleteOne`, and if `deletedCount` is `0`, the API responds with `404`.

### Out of Scope
- Pagination: `GET /authors` returns every author. Pagination can be added later if the collection grows large.

### Swagger Documentation
Swagger must document every author route. For each route, the documentation must include:
- The `Authors` tag
- The `id` path parameter, for routes that have one
- For POST and PUT, the request body schema with required fields, types, maximum lengths, and an example
- Every status code listed for that route in this spec, with a response schema and an example, including error response bodies

### Deployment Expectations
After implementation, the author routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every author route from the browser.

## Implementation Guidance
- Add the author routes to `src/router.js`. `swagger.js` only scans `./src/router.js` and `./app.js`, so routes in any other file will not appear in Swagger. If you move the author routes to a new file, add that file's path to `apis` in `swagger.js`.
- Put the handlers in `src/controllers/authors.js` and the database functions in `src/models/authors.js`, following the book files.
- Put the validation in `src/validators/authors.js`, reusing the helpers in `src/validators/common.js` from Issue 4. Use `Number.isInteger` to check `birthYear`.
- The valid-JSON and JSON-object checks from Issue 3 are in `app.js`, so they already apply to the author routes.
- When checking allowed fields, a PUT body that contains `id` returns `id cannot be changed` before any other field is checked. If the body has more than one unknown field, the API reports the first one in the order they appear in the body.
- In the Swagger comments, add `Author`, `AuthorCreate`, and `AuthorUpdate` schemas, and an `Authors` tag.

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
### GET routes
- `GET /authors` returns 200 with an array of authors, and each author includes `_id`, `id`, `name`, and `birthYear`.
- `GET /authors/:id` returns 200 with the matching author.
- `GET /authors/a99` returns 404 with `Author not found`.

### POST /authors
- A valid body returns 201 with the new author, including `_id`.
- A body containing `_id` returns 400 with `Unknown field: _id`.
- A body with no `name` returns 400 with `name is required`.
- A body with `"name": null` or `"name": "   "` returns 400 with `name is required`.
- A body with `"name": 42` returns 400 with `name must be a string`.
- A body with `"id": { "$ne": null }` returns 400 with `id must be a string`.
- A `name` of 101 characters returns 400 with `name must be at most 100 characters`.
- An `id` of 21 characters returns 400 with `id must be at most 20 characters`.
- A `birthYear` of `"1892"` or `1892.5` returns 400 with `birthYear must be an integer`.
- An `id` that already exists, such as `a1`, returns 409 with `An author with this id already exists`.
- A body with `"name": " Jane Austen "` creates an author whose saved `name` is `Jane Austen`.
- A body that is missing both `id` and `name` returns only `id is required`.
- A body with malformed JSON returns 400 with `Request body must be valid JSON`.
- A JSON array as the body returns 400 with `Request body must be a JSON object`.

### PUT /authors/:id
- A valid body returns 200 with the updated author, including `id` and `_id`, and a following `GET /authors/:id` shows the changes.
- A body containing `id` returns 400 with `id cannot be changed`.
- A body containing both `id` and `isAdmin` returns only `id cannot be changed`.
- A JSON array as the body returns 400 with `Request body must be a JSON object`.
- A body with no `birthYear` returns 400 with `birthYear is required`.
- `PUT /authors/a99` with a valid body returns 404 with `Author not found`.
- `PUT /authors/a99` with a missing `name` returns 400 with `name is required`, not 404.

### DELETE /authors/:id
- Deleting an author who has books returns 409 with `Cannot delete an author who still has books`, and the author still exists.
- Deleting an author who has no books returns 204 with no response body.
- A following `GET /authors/:id` for the deleted author returns 404.
- Deleting the same author again returns 404 with `Author not found`.

### Book references
- After creating a new author, `POST /books` with that author's `id` as `authorId` succeeds.
- After deleting an author, `POST /books` with that author's `id` as `authorId` returns 400 with `authorId does not match an existing author`.

### Swagger and deployment
- Every author route in Swagger has the `Authors` tag, the `id` path parameter where needed, request body schemas with required fields, types, maximum lengths, and examples.
- Every status code in this spec appears in Swagger for its route, with a response example.
- All author routes can be tested locally from `/api-docs`.
- All author routes can be tested from the deployed Render `/api-docs` page.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
