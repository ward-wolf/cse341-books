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

const createBookIndexes = async () => {
  const db = getDb();
  const collection = db.collection('books');
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ authorId: 1 });
};

export { getAllBooks, getBookById, createBookIndexes };