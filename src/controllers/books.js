import { getAllBooks, getBookById, createBook, updateBook, deleteBook } from "../models/books.js";
import { getAuthorById } from "../models/authors.js";
import { validateBook } from "../validators/books.js";

const DUPLICATE_KEY_ERROR = 11000;

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
  const { error: validationError, value: newBook } = validateBook(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const author = await getAuthorById(newBook.authorId);

    if (!author) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const book = await createBook(newBook);
    return res.status(201).json(book);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      return res.status(409).json({ message: 'A book with this id already exists' });
    }

    console.error('POST /books failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateBookHandler = async (req, res) => {
  const requestedId = req.params.id;
  const { error: validationError, value: updates } = validateBook(req.body, { isUpdate: true });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const author = await getAuthorById(updates.authorId);

    if (!author) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const book = await updateBook(requestedId, updates);

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
