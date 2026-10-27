import express from 'express';
import {
	getBooksHandler,
	getBookByIdHandler,
	createBookHandler,
	updateBookHandler,
	deleteBookHandler,
} from './controllers/books.js';
import {
	getAllAuthors,
	getAuthorById,
	createAuthor,
	updateAuthor,
	deleteAuthor,
} from './controllers/authors.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Books
 *     description: Create, read, update, and delete books in the books collection
 *   - name: Authors
 *     description: Create, read, update, and delete authors in the authors collection
 *
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       description: A book document from the books collection.
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId assigned by the database.
 *           example: 6650f1a2b3c4d5e6f7a8b9c0
 *         id:
 *           type: string
 *           description: Application-level book identifier used by GET /books/{id}.
 *           example: b1
 *         title:
 *           type: string
 *           example: The Hobbit
 *         authorId:
 *           type: string
 *           description: The `id` of the book's author in the authors collection.
 *           example: a1
 *         publicationDate:
 *           type: string
 *           format: date
 *           description: Publication date in YYYY-MM-DD format.
 *           example: "1937-09-21"
 *       required:
 *         - _id
 *         - id
 *         - title
 *         - authorId
 *         - publicationDate
 *     BookCreate:
 *       type: object
 *       description: Request body for creating a book. No other fields are allowed.
 *       additionalProperties: false
 *       properties:
 *         id:
 *           type: string
 *           maxLength: 20
 *           example: b4
 *         authorId:
 *           type: string
 *           maxLength: 20
 *           description: Must match the `id` of an existing author.
 *           example: a1
 *         title:
 *           type: string
 *           maxLength: 200
 *           example: Example Book Title
 *         publicationDate:
 *           type: string
 *           format: date
 *           description: A real calendar date in YYYY-MM-DD format.
 *           example: "2026-01-15"
 *       required:
 *         - id
 *         - authorId
 *         - title
 *         - publicationDate
 *     BookUpdate:
 *       type: object
 *       description: Request body for updating a book. Every field is required, and `id` cannot be changed.
 *       additionalProperties: false
 *       properties:
 *         authorId:
 *           type: string
 *           maxLength: 20
 *           description: Must match the `id` of an existing author.
 *           example: a2
 *         title:
 *           type: string
 *           maxLength: 200
 *           example: Updated Book Title
 *         publicationDate:
 *           type: string
 *           format: date
 *           description: A real calendar date in YYYY-MM-DD format.
 *           example: "2026-02-20"
 *       required:
 *         - authorId
 *         - title
 *         - publicationDate
 *     Author:
 *       type: object
 *       description: An author document from the authors collection.
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId assigned by the database.
 *           example: 6650f1a2b3c4d5e6f7a8b9c0
 *         id:
 *           type: string
 *           description: Application-level author identifier used by GET /authors/{id} and by a book's `authorId`.
 *           example: a1
 *         name:
 *           type: string
 *           example: Jane Austen
 *         birthYear:
 *           type: integer
 *           example: 1775
 *       required:
 *         - _id
 *         - id
 *         - name
 *         - birthYear
 *     AuthorCreate:
 *       type: object
 *       description: Request body for creating an author. No other fields are allowed.
 *       additionalProperties: false
 *       properties:
 *         id:
 *           type: string
 *           maxLength: 20
 *           example: a4
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: Example Author Name
 *         birthYear:
 *           type: integer
 *           description: A whole number. Strings such as "1965" are rejected.
 *           example: 1965
 *       required:
 *         - id
 *         - name
 *         - birthYear
 *     AuthorUpdate:
 *       type: object
 *       description: Request body for updating an author. Every field is required, and `id` cannot be changed.
 *       additionalProperties: false
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: Updated Author Name
 *         birthYear:
 *           type: integer
 *           description: A whole number. Strings such as "1970" are rejected.
 *           example: 1970
 *       required:
 *         - name
 *         - birthYear
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *       required:
 *         - message
 */

/**
 * @openapi
 * /books:
 *   get:
 *     tags:
 *       - Books
 *     summary: Get all books
 *     description: Returns every book in the books collection.
 *     responses:
 *       200:
 *         description: Books returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Unable to retrieve books.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.get('/books', getBooksHandler);

/**
 * @openapi
 * /books/{id}:
 *   get:
 *     tags:
 *       - Books
 *     summary: Get a book by id
 *     description: Returns the book whose `id` field matches the path parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The book's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: b1
 *     responses:
 *       200:
 *         description: Book returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Book not found
 *       500:
 *         description: Unable to retrieve book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.get('/books/:id', getBookByIdHandler);

/**
 * @openapi
 * /books:
 *   post:
 *     tags:
 *       - Books
 *     summary: Create a book
 *     description: Creates a book. The `authorId` must match the `id` of an existing author.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookCreate'
 *           example:
 *             id: b4
 *             authorId: a1
 *             title: Example Book Title
 *             publicationDate: "2026-01-15"
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: The request body is invalid or the authorId does not match an existing author. Only the first problem found is returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidJson:
 *                 summary: Body is not valid JSON
 *                 value:
 *                   message: Request body must be valid JSON
 *               notObject:
 *                 summary: Body is not a JSON object
 *                 value:
 *                   message: Request body must be a JSON object
 *               unknownField:
 *                 summary: Field is not allowed
 *                 value:
 *                   message: "Unknown field: _id"
 *               missingField:
 *                 summary: Required field is missing
 *                 value:
 *                   message: title is required
 *               notString:
 *                 summary: Field is not a string
 *                 value:
 *                   message: title must be a string
 *               tooLong:
 *                 summary: Field is too long
 *                 value:
 *                   message: title must be at most 200 characters
 *               invalidDate:
 *                 summary: publicationDate is not a valid date
 *                 value:
 *                   message: publicationDate must be a valid date in YYYY-MM-DD format
 *               unknownAuthor:
 *                 summary: authorId does not match an author
 *                 value:
 *                   message: authorId does not match an existing author
 *       409:
 *         description: A book with this id already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: A book with this id already exists
 *       500:
 *         description: Unable to create book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.post('/books', createBookHandler);

/**
 * @openapi
 * /books/{id}:
 *   put:
 *     tags:
 *       - Books
 *     summary: Update a book by id
 *     description: Updates the book whose `id` field matches the path parameter. The `authorId` must match the `id` of an existing author.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The book's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: b1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookUpdate'
 *           example:
 *             authorId: a2
 *             title: Updated Book Title
 *             publicationDate: "2026-02-20"
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: The request body is invalid or the authorId does not match an existing author. Only the first problem found is returned, and body problems are reported before a missing book.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidJson:
 *                 summary: Body is not valid JSON
 *                 value:
 *                   message: Request body must be valid JSON
 *               notObject:
 *                 summary: Body is not a JSON object
 *                 value:
 *                   message: Request body must be a JSON object
 *               idInBody:
 *                 summary: Body contains id
 *                 value:
 *                   message: id cannot be changed
 *               unknownField:
 *                 summary: Field is not allowed
 *                 value:
 *                   message: "Unknown field: isAdmin"
 *               missingField:
 *                 summary: Required field is missing
 *                 value:
 *                   message: publicationDate is required
 *               notString:
 *                 summary: Field is not a string
 *                 value:
 *                   message: title must be a string
 *               tooLong:
 *                 summary: Field is too long
 *                 value:
 *                   message: title must be at most 200 characters
 *               invalidDate:
 *                 summary: publicationDate is not a valid date
 *                 value:
 *                   message: publicationDate must be a valid date in YYYY-MM-DD format
 *               unknownAuthor:
 *                 summary: authorId does not match an author
 *                 value:
 *                   message: authorId does not match an existing author
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Book not found
 *       500:
 *         description: Unable to update book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.put('/books/:id', updateBookHandler);

/**
 * @openapi
 * /books/{id}:
 *   delete:
 *     tags:
 *       - Books
 *     summary: Delete a book by id
 *     description: Deletes the book whose `id` field matches the path parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The book's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: b1
 *     responses:
 *       204:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Book not found
 *       500:
 *         description: Unable to delete book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.delete('/books/:id', deleteBookHandler);

/**
 * @openapi
 * /authors:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Get all authors
 *     description: Returns every author in the authors collection.
 *     responses:
 *       200:
 *         description: Authors returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Author'
 *       500:
 *         description: Unable to retrieve authors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.get('/authors', getAllAuthors);

/**
 * @openapi
 * /authors/{id}:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Get an author by id
 *     description: Returns the author whose `id` field matches the path parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The author's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: a1
 *     responses:
 *       200:
 *         description: Author returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         description: Author not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Author not found
 *       500:
 *         description: Unable to retrieve author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.get('/authors/:id', getAuthorById);

/**
 * @openapi
 * /authors:
 *   post:
 *     tags:
 *       - Authors
 *     summary: Create an author
 *     description: Creates an author.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthorCreate'
 *           example:
 *             id: a4
 *             name: Example Author Name
 *             birthYear: 1965
 *     responses:
 *       201:
 *         description: Author created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       400:
 *         description: The request body is invalid. Only the first problem found is returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidJson:
 *                 summary: Body is not valid JSON
 *                 value:
 *                   message: Request body must be valid JSON
 *               notObject:
 *                 summary: Body is not a JSON object
 *                 value:
 *                   message: Request body must be a JSON object
 *               unknownField:
 *                 summary: Field is not allowed
 *                 value:
 *                   message: "Unknown field: _id"
 *               missingField:
 *                 summary: Required field is missing
 *                 value:
 *                   message: name is required
 *               notString:
 *                 summary: name is not a string
 *                 value:
 *                   message: name must be a string
 *               tooLong:
 *                 summary: name is too long
 *                 value:
 *                   message: name must be at most 100 characters
 *               notInteger:
 *                 summary: birthYear is not a whole number
 *                 value:
 *                   message: birthYear must be an integer
 *       409:
 *         description: An author with this id already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: An author with this id already exists
 *       500:
 *         description: Unable to create author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.post('/authors', createAuthor);

/**
 * @openapi
 * /authors/{id}:
 *   put:
 *     tags:
 *       - Authors
 *     summary: Update an author by id
 *     description: Updates the author whose `id` field matches the path parameter. The author's `id` cannot be changed.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The author's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: a1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthorUpdate'
 *           example:
 *             name: Updated Author Name
 *             birthYear: 1970
 *     responses:
 *       200:
 *         description: Author updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       400:
 *         description: The request body is invalid. Only the first problem found is returned, and body problems are reported before a missing author.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidJson:
 *                 summary: Body is not valid JSON
 *                 value:
 *                   message: Request body must be valid JSON
 *               notObject:
 *                 summary: Body is not a JSON object
 *                 value:
 *                   message: Request body must be a JSON object
 *               idInBody:
 *                 summary: Body contains id
 *                 value:
 *                   message: id cannot be changed
 *               unknownField:
 *                 summary: Field is not allowed
 *                 value:
 *                   message: "Unknown field: isAdmin"
 *               missingField:
 *                 summary: Required field is missing
 *                 value:
 *                   message: birthYear is required
 *               notString:
 *                 summary: name is not a string
 *                 value:
 *                   message: name must be a string
 *               tooLong:
 *                 summary: name is too long
 *                 value:
 *                   message: name must be at most 100 characters
 *               notInteger:
 *                 summary: birthYear is not a whole number
 *                 value:
 *                   message: birthYear must be an integer
 *       404:
 *         description: Author not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Author not found
 *       500:
 *         description: Unable to update author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.put('/authors/:id', updateAuthor);

/**
 * @openapi
 * /authors/{id}:
 *   delete:
 *     tags:
 *       - Authors
 *     summary: Delete an author by id
 *     description: Deletes the author whose `id` field matches the path parameter. An author who still has books cannot be deleted.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The author's `id` field (not the MongoDB `_id`).
 *         schema:
 *           type: string
 *         example: a1
 *     responses:
 *       204:
 *         description: Author deleted successfully
 *       404:
 *         description: Author not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Author not found
 *       409:
 *         description: One or more books still reference the author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Cannot delete an author who still has books
 *       500:
 *         description: Unable to delete author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */
router.delete('/authors/:id', deleteAuthor);

export default router;
