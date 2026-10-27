import {
  getAllAuthors as getAllAuthorsFromDb,
  getAuthorById as getAuthorByIdFromDb,
  createAuthor as createAuthorFromDb,
  updateAuthor as updateAuthorFromDb,
  deleteAuthor as deleteAuthorFromDb,
  authorHasBooks,
} from '../models/authors.js';
import { validateAuthor } from '../validators/authors.js';

const DUPLICATE_KEY_ERROR = 11000;

const getAllAuthors = async (req, res) => {
  try {
    const authors = await getAllAuthorsFromDb();
    return res.status(200).json(authors);
  } catch (error) {
    console.error('GET /authors failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await getAuthorByIdFromDb(id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    return res.status(200).json(author);
  } catch (error) {
    console.error('GET /authors/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createAuthor = async (req, res) => {
  try {
    const { error: validationError, value: newAuthor } = validateAuthor(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const createdAuthor = await createAuthorFromDb(newAuthor);
    return res.status(201).json(createdAuthor);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      return res.status(409).json({ message: 'An author with this id already exists' });
    }

    console.error('POST /authors failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value: updates } = validateAuthor(req.body, { isUpdate: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedAuthor = await updateAuthorFromDb(id, updates);
    if (!updatedAuthor) {
      return res.status(404).json({ message: 'Author not found' });
    }

    return res.status(200).json(updatedAuthor);
  } catch (error) {
    console.error('PUT /authors/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    if (await authorHasBooks(id)) {
      return res.status(409).json({ message: 'Cannot delete an author who still has books' });
    }

    const result = await deleteAuthorFromDb(id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Author not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /authors/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export { getAllAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
