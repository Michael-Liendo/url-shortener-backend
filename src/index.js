import * as dotenv from 'dotenv';
dotenv.config();
import Fastify from 'fastify';
import mongoose from 'mongoose';

const fastify = Fastify({
  logger: true,
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to database'))
  .catch((e) => {
    throw e;
  });

fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Run the server!
fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
