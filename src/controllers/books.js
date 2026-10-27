import { getAllBooks, getBookById, createBook, updateBook, deleteBook } from "../models/books.js";
import { getAuthorById } from "../models/authors.js";

const DUPLICATE_KEY_ERROR = 11000;

// A field is missing if it is absent, null, or a blank string.
const isMissing = (value) => {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
};

// Returns the first "<field> is required" message, or null if every field is present.
const findMissingField = (body, fields) => {
  const missingField = fields.find((field) => {
    return isMissing(body[field]);
  });
  return missingField ? `${missingField} is required` : null;
};

const getBooksHandler = async (req, res) => {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    console.error('GET /books failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getBookByIdHandler = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const book = await getBookById(requestedId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('GET /books/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createBookHandler = async (req, res) => {
  const body = req.body ?? {};
  const missingFieldMessage = findMissingField(body, ['id', 'authorId', 'title', 'publicationDate']);

  if (missingFieldMessage) {
    return res.status(400).json({ message: missingFieldMessage });
  }

  const { id, authorId, title, publicationDate } = body;

  try {
    const author = await getAuthorById(authorId);

    if (!author) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const book = await createBook({ id, authorId, title, publicationDate });
    return res.status(201).json(book);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      return res.status(400).json({ message: 'A book with this id already exists' });
    }

    console.error('POST /books failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateBookHandler = async (req, res) => {
  const requestedId = req.params.id;
  const body = req.body ?? {};
  const missingFieldMessage = findMissingField(body, ['authorId', 'title', 'publicationDate']);

  if (missingFieldMessage) {
    return res.status(400).json({ message: missingFieldMessage });
  }

  const { authorId, title, publicationDate } = body;

  try {
    const author = await getAuthorById(authorId);

    if (!author) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const book = await updateBook(requestedId, { authorId, title, publicationDate });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('PUT /books/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteBookHandler = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const result = await deleteBook(requestedId);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /books/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export { getBooksHandler, getBookByIdHandler, createBookHandler, updateBookHandler, deleteBookHandler };
