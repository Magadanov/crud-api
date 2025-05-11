import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';
import { fork } from 'node:child_process';
import dotenv from 'dotenv';
dotenv.config();

const BASE_PORT = Number(process.env.PORT) || 4000;
const numCPUs = os.availableParallelism();
const workers: { port: number; process: ReturnType<typeof fork> }[] = [];

const users: any[] = [];

if (cluster.isPrimary) {
  console.log(`Master PID ${process.pid} is running`);

  for (let i = 1; i < numCPUs; i++) {
    const port = BASE_PORT + i;
    const worker = fork('dist/index.js', [], {
      env: { PORT: port.toString(), CLUSTER_MODE: 'true' },
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });

    worker.on('message', (msg: any) => {
      if (msg.type === 'GET_USERS') {
        worker.send({ type: 'USERS', payload: users });
      } else if (msg.type === 'ADD_USER') {
        users.push(msg.payload);
        broadcastUsers();
      } else if (msg.type === 'DELETE_USER') {
        const index = users.findIndex((u) => u.id === msg.payload);
        if (index !== -1) users.splice(index, 1);
        broadcastUsers();
      } else if (msg.type === 'UPDATE_USER') {
        const index = users.findIndex((u) => u.id === msg.payload.id);
        if (index !== -1) users[index] = msg.payload;
        broadcastUsers();
      }
    });

    workers.push({ port, process: worker });
  }

  const broadcastUsers = () => {
    for (const w of workers) {
      w.process.send({ type: 'USERS', payload: users });
    }
  };

  let current = 0;

  const balancer = http.createServer((req, res) => {
    const target = workers[current];
    const options = {
      hostname: 'localhost',
      port: target?.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxy.on('error', (err) => {
      res.writeHead(500);
      res.end(`Proxy error: ${(err as Error).message}`);
    });

    req.pipe(proxy, { end: true });

    current = (current + 1) % workers.length;
  });

  balancer.listen(BASE_PORT, () => {
    console.log(`Load balancer listening on port ${BASE_PORT}`);
  });
}
