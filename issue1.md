# Issue 1: Migrate Week 01 data to the authors model and add database indexes

## Description
- By hand in MongoDB Atlas Data Explorer, create the `authors` collection and add one author document for each different author in the Week 01 books, with ids in alphabetical order by last name.
- By hand in Atlas, update each existing book to replace its `author` name with an `authorId` that references its author document.
- Create the database indexes for the `books` and `authors` collections when the server starts.
- Run the migration on every database the app uses, including the one the deployed Render application connects to.
- Update the Swagger `Book` schema so it lists `authorId` instead of `author`.
- Deploy the index code and Swagger update to Render.

## Depends On
- None

## Spec
### Data Migration from Week 01
Week 01 book documents store the author's name in an `author` field and have no `authorId`. These books do not meet the Week 02 rules, so they must be migrated before the Week 02 routes are used. The migration must be run on every database the app uses, including the one the deployed Render application connects to.

1. Find every distinct `author` value in the `books` collection.
2. Create one author document for each name, with ids `a1`, `a2`, `a3`, and so on. Each author's `birthYear` must be filled in by hand.
3. For each book, use `$set` to set `authorId` to the matching author's `id`, and use `$unset` to remove the `author` field.
4. Check that every book has an `authorId` that matches an existing author, and that no book still has an `author` field.
5. Start the server, which creates the indexes. If the unique index on `books.id` or `authors.id` cannot be created because two documents share an id, fix the duplicates and restart.

### Author Data Model
Author documents will be stored in the `authors` collection.

Required author fields:
- `id`: string, required, custom id such as `a1`, at most 20 characters
- `name`: string, required, at most 100 characters
- `birthYear`: integer, required, a whole number such as `1892`

Server-added field:
- `_id`: MongoDB ObjectId added by the database when the author is created. Clients never send it. It is included in every author response as a string.

Example author object:

    {
      "_id": "6650f1a2b3c4d5e6f7a8b9c0",
      "id": "a1",
      "name": "J.R.R. Tolkien",
      "birthYear": 1892
    }

### Changes to Book Documents
Changes from Week 01: the `author` field (the author's name) is replaced by `authorId`.

Example book object after migration:

    {
      "_id": "6650f1a2b3c4d5e6f7a8b9c1",
      "id": "b1",
      "authorId": "a1",
      "title": "The Hobbit",
      "publicationDate": "1937-09-21"
    }

### Indexes
Indexes on the `books` collection:
- A unique index on `id`, so the database itself prevents two books from having the same id, even when two requests arrive at the same moment
- An index on `authorId`, so finding an author's books does not scan the whole collection

Indexes on the `authors` collection:
- A unique index on `id`, so the database itself prevents two authors from having the same id, even when two requests arrive at the same moment

The indexes are created when the server starts. MongoDB's `createIndex` does nothing if the index already exists, so this is safe on every restart.

## How to Run the Migration
There are only three books, so the migration is done by hand in MongoDB Atlas Data Explorer instead of with a script. Author ids are assigned in alphabetical order by the author's last name, so `a1` is the author whose last name comes first. If two authors have the same last name, sort them by first name. If two books have the same author, they share one author document.

1. In Data Explorer, open the `books` collection and write down the `author` value of every book.
2. Make a list of the different authors, sorted alphabetically by last name, and give them ids in that order: `a1`, `a2`, `a3`, and so on.
3. Create the `authors` collection and insert one document for each author in the list, for example:
   - `{ "id": "a1", "name": "<first author alphabetically>", "birthYear": <year> }`

   Make sure `birthYear` is saved as a number (Atlas shows it as `Int32`), not as a string.
4. Edit each book document: add an `authorId` string field set to its author's id from the list, and delete the `author` field.
5. Check the results: filtering `books` with `{ "author": { "$exists": true } }` returns no documents, and every book's `authorId` matches an author's `id`.
6. Check the `MONGODB_URI` and `MONGODB_DB_NAME` environment variables in the Render dashboard. If Render uses a different database than your local `.env`, repeat steps 1-5 on that database, using the same author ids.

## Implementation Guidance
- Create the indexes in `startServer` in `server.js`, after `connectToDb()` and before `app.listen()`, so the server does not accept requests until the indexes exist. If index creation fails, the existing `catch` logs the error and stops the server.
- In the Swagger comments in `src/router.js`, update the `Book` schema: replace the `author` property with `authorId` (string, example `a1`) in both `properties` and `required`.

## Deployment Steps
1. Run `npm run swagger` to regenerate `swagger.json` from the JSDoc comments.
2. Commit the code changes and the updated `swagger.json` on a feature branch, and push the branch to GitHub.
3. Open a pull request on GitHub, merge it into `main`, and delete the branch.
4. Render deploys automatically when it detects the update to `main`. After the deploy finishes, check Render and run the test plan against the deployed `/api-docs` page.

## Test Plan
- The `authors` collection contains one document for each different author in the Week 01 books, with ids `a1`, `a2`, `a3`, and so on in alphabetical order by last name.
- Each book's `authorId` points to the author whose name was in that book's old `author` field.
- Every author document has a string `name` and an integer `birthYear` (shown as `Int32` in Atlas).
- Every book has an `authorId` that matches an existing author's `id`.
- No book still has an `author` field.
- `GET /books` and `GET /books/:id` responses include `authorId` and do not include `author`.
- The server starts without errors, and the MongoDB Atlas Indexes tab shows a unique index on `books.id`, an index on `books.authorId`, and a unique index on `authors.id`.
- Restarting the server does not cause an index error.
- The `Book` schema on the Swagger page lists `authorId` and does not list `author`.
- Inserting a second book or author with an existing `id` directly in MongoDB Atlas is rejected with a duplicate key error.
- The migration has been run on the database used by the deployed Render application, and the deployed `GET /books` responses include `authorId`.
- `swagger.json` was regenerated with `npm run swagger` and committed with the code changes.
- The changes were merged into `main` through a GitHub pull request, and the branch was deleted.
- The Render deploy of the merged `main` commit finished successfully.
