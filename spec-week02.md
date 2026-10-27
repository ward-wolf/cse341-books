# Books API Week 02 Spec - Version 2

## Feature 1: Book CRUD Operations and Author References

### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.

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

Changes from Week 01: the `author` field (the author's name) is replaced by `authorId`. Existing books must be updated as described in Data Migration from Week 01.

Indexes on the `books` collection:
- A unique index on `id`, so the database itself prevents two books from having the same id, even when two requests arrive at the same moment
- An index on `authorId`, so finding an author's books does not scan the whole collection

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

### Error Responses
Every error response will have a JSON body with a `message` field that describes the error:

    {
      "message": "Book not found"
    }

When a request has more than one problem, the API returns only the first error it finds, using the order in Request Processing Order.

`500` responses always use the message `Internal server error` and never include stack traces or database error details.

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
- The indexes are created when the server starts. MongoDB's `createIndex` does nothing if the index already exists, so this is safe on every restart.
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

## Feature 2: Author CRUD Operations

### Goal
Add an authors resource to the API that supports all CRUD operations for authors, plus a route that lists an author's books. Authors are the documents that books reference through their `authorId` field. Every author route must be documented and testable in Swagger.

### Data Model
Author documents will be stored in the `authors` collection.

Required author fields:
- `id`: string, required, custom id such as `a1`, at most 20 characters
- `name`: string, required, at most 100 characters
- `birthYear`: integer, required, a whole number such as `1892`

Server-added field:
- `_id`: MongoDB ObjectId added by the database when the author is created. Clients never send it. It is included in every author response as a string.

Authors will use custom string ids instead of MongoDB `_id` values for route parameters, following the same pattern as books.

Indexes on the `authors` collection:
- A unique index on `id`, so the database itself prevents two authors from having the same id, even when two requests arrive at the same moment

Example author object:

    {
      "_id": "6650f1a2b3c4d5e6f7a8b9c0",
      "id": "a1",
      "name": "J.R.R. Tolkien",
      "birthYear": 1892
    }

### Relationship to Books
A book's `authorId` field stores the `id` value of an author document. One author can have many books.

An author cannot be deleted while any book still references that author. The client must delete those books, or update them to reference a different author, before deleting the author. `GET /authors/:id/books` shows which books are blocking the delete.

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

#### GET /authors/:id/books
Purpose: Return every book by one author.

Success:
- Status code: `200`
- Response body: an array of book objects whose `authorId` matches the author's `id`, or an empty array if the author has no books

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
- The index is created when the server starts. MongoDB's `createIndex` does nothing if the index already exists, so this is safe on every restart.
- `POST /authors` does not look up the `id` before inserting. It calls `insertOne`, and if MongoDB returns a duplicate key error (code `11000`) from the unique index, the API responds with `409`.
- `PUT /authors/:id` uses `findOneAndUpdate` with `$set` on `name` and `birthYear` only, so `id` and `_id` never change. It uses the `returnDocument: 'after'` option so the updated author comes back from the same call. If no document is returned, the API responds with `404`. Otherwise it returns the updated author.
- `DELETE /authors/:id` first checks for a book with a matching `authorId` using `findOne`. This uses the `authorId` index and stops at the first match instead of loading every book. If no book matches, it calls `deleteOne`, and if `deletedCount` is `0`, the API responds with `404`.
- `GET /authors/:id/books` looks up the author first so it can return `404` for an unknown author, then finds books by `authorId` using the index.

### Out of Scope
- Pagination: `GET /authors` and `GET /authors/:id/books` return every matching document. Pagination can be added later if the collections grow large.

### Swagger Documentation
Swagger must document every author route. For each route, the documentation must include:
- The `Authors` tag
- The `id` path parameter, for routes that have one
- For POST and PUT, the request body schema with required fields, types, maximum lengths, and an example
- Every status code listed for that route in this spec, with a response schema and an example, including error response bodies

### Deployment Expectations
After implementation, the author routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every author route from the browser.

## Data Migration from Week 01
Week 01 book documents store the author's name in an `author` field and have no `authorId`. These books do not meet the Week 02 rules, so they must be migrated before the Week 02 routes are used. The migration must be run on every database the app uses, including the one the deployed Render application connects to.

1. Find every distinct `author` value in the `books` collection.
2. Create one author document for each name, with ids `a1`, `a2`, `a3`, and so on. Each author's `birthYear` must be filled in by hand.
3. For each book, use `$set` to set `authorId` to the matching author's `id`, and use `$unset` to remove the `author` field.
4. Check that every book has an `authorId` that matches an existing author, and that no book still has an `author` field.
5. Start the server, which creates the indexes. If the unique index on `books.id` or `authors.id` cannot be created because two documents share an id, fix the duplicates and restart.
