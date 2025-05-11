import { User } from 'types/users.types';

let users: User[] = [];

if (process.env.CLUSTER_MODE) {
  process.on?.('message', (msg: any) => {
    if (msg.type === 'USERS') {
      users = msg.payload;
    }
  });
}

export { users };
