import express from 'express';
import { getBooksHandler, getBookByIdHandler } from './controllers/books.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Books
 *     description: Read books from the books collection
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
 *         author:
 *           type: string
 *           example: J.R.R. Tolkien
 *         publicationDate:
 *           type: string
 *           format: date
 *           description: Publication date in YYYY-MM-DD format.
 *           example: "1937-09-21"
 *       required:
 *         - _id
 *         - id
 *         - title
 *         - author
 *         - publicationDate
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

export default router;
