import http from 'node:http';

export const invalid = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  message?: string,
  statusCode: number = 404,
  contentType: string = 'application/json',
) => {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(JSON.stringify({ message }));
};
