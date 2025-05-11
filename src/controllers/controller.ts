import { IncomingMessage, ServerResponse } from 'http';
import { users } from '../db/data';
import { invalid } from './invalid';
import { isUUID } from '../units/isUUID';
import { validateUser } from '../units/validateUser';
import { v4 as uuid } from 'uuid';
import parseBody from '../units/parseBody';
import { User } from 'types/users.types';

const getUsers = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } catch {
    invalid(req, res, 'Server Error', 500);
  }
};

const getUserById = async (
  req: IncomingMessage,
  res: ServerResponse,
  userId: string,
) => {
  try {
    if (!isUUID(userId)) {
      return invalid(req, res, 'Invalid UUID', 400);
    }
    const user = users.find((user) => user.id === userId);
    if (!user) {
      return invalid(req, res, 'User not found', 404);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } catch {
    invalid(req, res, 'Server Error', 500);
  }
};

const createUser = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const { username, age, hobbies } = await parseBody(req);

    const { isValid, errors } = validateUser({ username, age, hobbies });
    if (!isValid) {
      return invalid(req, res, errors.join(', '), 400);
    }

    const newUser = {
      id: uuid(),
      username,
      age,
      hobbies,
    };
    process.env.CLUSTER_MODE &&
      process.send?.({ type: 'ADD_USER', payload: newUser });
    users.push(newUser);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newUser));
  } catch {
    invalid(req, res, 'Server Error', 500);
  }
};

const updateUser = async (
  req: IncomingMessage,
  res: ServerResponse,
  userId: string,
) => {
  try {
    if (!isUUID(userId)) {
      return invalid(req, res, 'Invalid UUID', 400);
    }
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
      return invalid(req, res, 'User not found', 404);
    }
    const { username, age, hobbies } = await parseBody(req);
    const { isValid, errors } = validateUser({ username, age, hobbies });
    if (!isValid) {
      return invalid(req, res, errors.join(', '), 400);
    }
    const updatedUser = {
      ...users[userIndex],
      username,
      age,
      hobbies,
    } as User;
    process.env.CLUSTER_MODE &&
      process.send?.({ type: 'UPDATE_USER', payload: updatedUser });
    users[userIndex] = updatedUser;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updatedUser));
  } catch {
    invalid(req, res, 'Server Error', 500);
  }
};

const deleteUser = async (
  req: IncomingMessage,
  res: ServerResponse,
  userId: string,
) => {
  try {
    if (!isUUID(userId)) {
      return invalid(req, res, 'Invalid UUID', 400);
    }
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
      return invalid(req, res, 'User not found', 404);
    }
    process.env.CLUSTER_MODE &&
      process.send?.({ type: 'DELETE_USER', payload: userId });
    users.splice(userIndex, 1);
    res.writeHead(204);
    res.end();
  } catch {
    invalid(req, res, 'Server Error', 500);
  }
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
