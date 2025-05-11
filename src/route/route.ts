import http from 'node:http';
import url from 'node:url';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/controller';
import { invalid } from '../controllers/invalid';

const route = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url || '', true);
  const urlPath = pathname?.split('/').filter((path) => path) || [];

  if (pathname?.startsWith('/api/users') && urlPath.length <= 3) {
    const userId = urlPath[2];
    switch (req.method) {
      case 'GET':
        if (userId) {
          return getUserById(req, res, userId);
        } else {
          return getUsers(req, res);
        }
      case 'POST':
        return createUser(req, res);
      case 'PUT':
        if (userId) {
          return updateUser(req, res, userId);
        } else {
          return invalid(
            req,
            res,
            'User ID is required for updating a user',
            400,
          );
        }
      case 'DELETE':
        if (userId) {
          return deleteUser(req, res, userId);
        } else {
          return invalid(
            req,
            res,
            'User ID is required for deleting a user',
            400,
          );
        }
    }
  } else {
    return invalid(req, res, 'Invalid endpoint', 404);
  }
});

export default route;
