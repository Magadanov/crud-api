import server from './route/route';
import dotenv from 'dotenv';
dotenv.config();

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
