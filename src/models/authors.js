import { getDb } from '../db/connect.js';

const getAllAuthors = async () => {
  const db = getDb();
  const collection = db.collection('authors');
  const authors = await collection.find({}).toArray();

  return authors;
};

const getAuthorById = async (id) => {
  const db = getDb();
  const collection = db.collection('authors');
  const author = await collection.findOne({ id });

  return author;
};

const createAuthor = async (author) => {
  const db = getDb();
  const collection = db.collection('authors');
  await collection.insertOne(author);

  return author;
};

const updateAuthor = async (id, author) => {
  const db = getDb();
  const collection = db.collection('authors');
  const updatedAuthor = await collection.findOneAndUpdate(
    { id },
    { $set: author },
    { returnDocument: 'after' }
  );

  return updatedAuthor;
};

const deleteAuthor = async (id) => {
  const db = getDb();
  const collection = db.collection('authors');
  const result = await collection.deleteOne({ id });

  return result;
};

const authorHasBooks = async (id) => {
  const db = getDb();
  const collection = db.collection('books');
  // findOne uses the authorId index and stops at the first matching book.
  const book = await collection.findOne({ authorId: id }, { projection: { _id: 1 } });

  return book !== null;
};

const createAuthorIndexes = async () => {
  const db = getDb();
  const collection = db.collection('authors');
  await collection.createIndex({ id: 1 }, { unique: true });
};

export { getAllAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor, authorHasBooks, createAuthorIndexes };