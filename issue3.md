# Issue 3: Return consistent JSON errors for invalid request bodies and server errors

## Description
- Return a JSON `400` error instead of Express's default HTML error page when a request body is not valid JSON.
- Return a JSON `400` error when a POST or PUT request body is not a JSON object.
- Make every error response use the same `{ "message": "..." }` body.
- Make sure `500` responses never include stack traces or database error details.
- Apply these rules to the existing book routes now, and to the author routes when they are added.
- Deploy the changes to Render and test them from the deployed `/api-docs` page.

## Depends On
- Issue 2

## Spec
### Error Responses
Every error response will have a JSON body with a `message` field that describes the error:

    {
      "message": "Book not found"
    }

When a request has more than one problem, the API returns only the first error it finds, using the order in Request Processing Order.

`500` responses always use the message `Internal server error` and never include stack traces or database error details.

### Request Body Rules
These rules apply to the request body of every POST and PUT route:

- The body must be valid JSON, and it must be a JSON object (not an array, string, or number).

### Request Processing Order
This check is the first step for every POST and PUT request:

1. Request body: the body must be valid JSON and must be a JSON object. Returns `400`.

### Error Messages
- `400` if the body is not valid JSON: `Request body must be valid JSON`
- `400` if the body is not a JSON object: `Request body must be a JSON object`
- `500` if an unexpected server or database error occurs: `Internal server error`

## Implementation Guidance
- In `app.js`, change `express.json()` to `express.json({ strict: false })`. By default, `express.json()` treats a body that is only a JSON string or number as invalid JSON, which would return `Request body must be valid JSON` instead of `Request body must be a JSON object`. With `strict: false`, those bodies are parsed, and the object check below rejects them.
- In `app.js`, add a middleware after `express.json()` and before `app.use(router)`. For POST and PUT requests, if `req.body` is `undefined`, `null`, not an object, or an array, respond with `400` and `Request body must be a JSON object`. In Express 5, `req.body` is `undefined` when a request has no body.
- At the end of `app.js`, after `app.use(router)`, add an error-handling middleware with four arguments (`err, req, res, next`). If `err.type === 'entity.parse.failed'`, respond with `400` and `Request body must be valid JSON`. For any other error, log it with `console.error` and respond with `500` and `Internal server error`.
- Keep the existing `try`/`catch` in each handler. They already return the generic `500` message.
- Because these middlewares are in `app.js`, they also apply to the author routes added in Issue 5.

### Testing Requests Swagger Cannot Send
Swagger UI may refuse to send a malformed or empty request body. If it does, send the request with `curl` from a terminal instead. Replace `<url>` with `http://localhost:<PORT>` or the Render URL:

    curl -i -X POST <url>/books -H "Content-Type: application/json" -d '{"id": "b9"'
    curl -i -X POST <url>/books -H "Content-Type: application/json"

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
- `POST /books` with malformed JSON (for example, a missing closing brace) returns 400 with a JSON body of `{ "message": "Request body must be valid JSON" }`, not an HTML page.
- `PUT /books/:id` with malformed JSON returns 400 with `Request body must be valid JSON`.
- `POST /books` with a JSON array as the body returns 400 with `Request body must be a JSON object`.
- `POST /books` with a JSON string or number as the body returns 400 with `Request body must be a JSON object`.
- `POST /books` with no body returns 400 with `Request body must be a JSON object`.
- `PUT /books/:id` with a JSON array as the body returns 400 with `Request body must be a JSON object`.
- Locally, when a route handler throws an unexpected error (for example, after temporarily adding a `throw` inside a handler), the response is 500 with exactly `{ "message": "Internal server error" }` and no stack trace or database details. The temporary `throw` is removed before committing, and the GitHub pull request diff confirms it is gone.
- Every error response from the book routes has a JSON body with a `message` field.
- The checks work locally and from the deployed Render application.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
