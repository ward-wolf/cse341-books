# Issue 6: Add a route to list an author's books

## Description
- Add `GET /authors/:id/books` to return every book that references one author.
- Return `404` when the author does not exist, and an empty array when the author has no books.
- Use the `authorId` index so the route does not scan the whole `books` collection.
- Add Swagger documentation for the route.
- Test the route locally and in the deployed Render application.

## Depends On
- Issue 1
- Issue 5

## Spec
### Goal
Add a route that lists an author's books, so clients do not have to download every book and filter them, and so they can see which books are blocking an author from being deleted.

### Relationship to Books
A book's `authorId` field stores the `id` value of an author document. One author can have many books.

An author cannot be deleted while any book still references that author. The client must delete those books, or update them to reference a different author, before deleting the author. `GET /authors/:id/books` shows which books are blocking the delete.

### Routes

#### GET /authors/:id/books
Purpose: Return every book by one author.

Success:
- Status code: `200`
- Response body: an array of book objects whose `authorId` matches the author's `id`, or an empty array if the author has no books

Errors:
- `404` if no author exists with that id: `Author not found`
- `500` if an unexpected server or database error occurs: `Internal server error`

### Implementation Notes
- `GET /authors/:id/books` looks up the author first so it can return `404` for an unknown author, then finds books by `authorId` using the index.

### Out of Scope
- Pagination: `GET /authors/:id/books` returns every matching book. Pagination can be added later if the collection grows large.

### Swagger Documentation
The Swagger documentation for this route must include:
- The `Authors` tag
- The `id` path parameter
- Every status code listed for this route in this spec, with a response schema and an example, including error response bodies

### Deployment Expectations
After implementation, the route must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test the route from the browser.

## Implementation Guidance
- Add the route to `src/router.js`, so `swagger.js` picks up its JSDoc comments.
- Put the handler in `src/controllers/authors.js`. Reuse the author lookup from Issue 5, and add a function such as `getBooksByAuthorId` to `src/models/books.js` that finds books by `authorId`.

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
- `GET /authors/a1/books` returns 200 with an array that contains only books whose `authorId` is `a1`.
- Each book in the response includes `_id`, `id`, `authorId`, `title`, and `publicationDate`.
- For an author who has no books, the route returns 200 with an empty array.
- `GET /authors/a99/books` returns 404 with `Author not found`.
- After `POST /books` creates a book for an author, that book appears in the author's list.
- After `PUT /books/:id` moves a book to a different author, the book appears only in the new author's list.
- After `DELETE /books/:id`, the deleted book no longer appears in the author's list.
- When the list is not empty, `DELETE /authors/:id` returns 409. After every book in the list is deleted or moved, `DELETE /authors/:id` returns 204.
- The route is documented in Swagger with the `Authors` tag, the `id` path parameter, and every status code.
- The route can be tested locally from `/api-docs`.
- The route can be tested from the deployed Render `/api-docs` page.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
