import { getDb } from "../db/connect.js";

const getAllBooks = async () => {
  const db = getDb();
  const collection = db.collection('books');
  const books = await collection.find({}).toArray();
  return books;
};

const getBookById = async (bookId) => {
  const db = getDb();
  const collection = db.collection('books');
  const book = await collection.findOne({ id: bookId });
  return book;
};

const getBooksByAuthorId = async (authorId) => {
  const db = getDb();
  const collection = db.collection('books');
  const books = await collection.find({ authorId }).toArray();
  return books;
};

const createBook = async (book) => {
  const db = getDb();
  const collection = db.collection('books');
  await collection.insertOne(book);
  return book;
};

const updateBook = async (bookId, updates) => {
  const db = getDb();
  const collection = db.collection('books');
  const book = await collection.findOneAndUpdate(
    { id: bookId },
    { $set: updates },
    { returnDocument: 'after' }
  );
  return book;
};

const deleteBook = async (bookId) => {
  const db = getDb();
  const collection = db.collection('books');
  const result = await collection.deleteOne({ id: bookId });
  return result;
};

const createBookIndexes = async () => {
  const db = getDb();
  const collection = db.collection('books');
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ authorId: 1 });
};

export { getAllBooks, getBookById, getBooksByAuthorId, createBook, updateBook, deleteBook, createBookIndexes };