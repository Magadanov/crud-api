import http from 'http';
import { AddressInfo } from 'net';
import route from '../route/route';

describe('API Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  let createdUserId: string;
  let request: (
    method: string,
    path: string,
    data?: object,
  ) => Promise<{ status: number; body: any }>;

  beforeAll((done) => {
    server = route.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://localhost:${port}`;
      done();
    });
    request = (
      method: string,
      path: string,
      data?: object,
    ): Promise<{ status: number; body: any }> =>
      new Promise((resolve) => {
        const body = data ? JSON.stringify(data) : undefined;
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body?.length ?? 0,
          },
        };

        const req = http.request(`${baseUrl}${path}`, options, (res) => {
          let rawData = '';
          res.on('data', (chunk) => (rawData += chunk));
          res.on('end', () => {
            const json = rawData ? JSON.parse(rawData) : undefined;
            resolve({ status: res.statusCode || 500, body: json });
          });
        });

        req.on('error', () => resolve({ status: 500, body: {} }));
        if (body) req.write(body);
        req.end();
      });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET /api/users should return a list of users', async () => {
    const { status, body } = await request('GET', '/api/users');
    expect(status).toBe(200);
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toEqual(0);
  });

  test('POST /api/users → create user', async () => {
    const newUser = { username: 'Alice', age: 25, hobbies: ['reading'] };
    const res = await request('POST', '/api/users', newUser);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(newUser);
    createdUserId = res.body.id;
  });

  test('GET /api/users/:id → should return created user', async () => {
    const res = await request('GET', `/api/users/${createdUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdUserId);
  });

  test('PUT /api/users/:id → update user', async () => {
    const updated = { username: 'Alice_updated', age: 26, hobbies: ['guitar'] };
    const res = await request('PUT', `/api/users/${createdUserId}`, updated);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...updated, id: createdUserId });
  });

  test('DELETE /api/users/:id → delete user', async () => {
    const res = await request('DELETE', `/api/users/${createdUserId}`);
    expect(res.status).toBe(204);
  });

  test('GET /api/users/:id → should return 404 after deletion', async () => {
    const res = await request('GET', `/api/users/${createdUserId}`);
    expect(res.status).toBe(404);
  });
});
