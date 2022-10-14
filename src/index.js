import * as dotenv from 'dotenv';
dotenv.config();
import Fastify from 'fastify';
import cors from '@fastify/cors';
import mongoose from 'mongoose';

import createHash from './utils/createHash.js';
import validateUrl from './utils/validateUrl.js';
const fastify = Fastify();

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to database'))
  .catch((e) => {
    throw e;
  });

const ShortUrlModel = mongoose.model(
  'ShortUrl',
  new mongoose.Schema(
    {
      original_url: String,
      hash: String,
      expires_at: Date,
    },
    { timestamps: true },
  ).index({ expiresAt: 1 }, { expireAfterSeconds: 864000000 }),
);

fastify.post('/new', async (request, reply) => {
  let original_url = request.body.url;
  let hash = request.body.hash;
  const today = new Date();
  const expires_at = new Date();
  expires_at.setDate(today.getDate() + 10);

  if (!original_url) {
    return reply.code(400).send({
      status: 'error',
      message: 'Put the url where it will be redirected',
    });
  }

  if (!validateUrl(original_url)) {
    return reply.code(400).send({
      status: 'error',
      message: `Provided URL is not valid: ${original_url}`,
    });
  }

  if (!hash) {
    hash = createHash(16);
  }

  let short = await ShortUrlModel.findOne({ hash });

  if (short) {
    return reply.code(400).send({
      status: 'error',
      message: 'The hash already exists, try again',
      url: short.original_url,
      hash: short.hash,
    });
  } else {
    const newShortener = new ShortUrlModel({
      original_url,
      hash,
      expires_at,
    });

    let saveUrl = await newShortener.save();

    console.log(saveUrl);
    reply.send({
      status: 'ok',
      message: 'The url was created',
      original_url,
      hash,
      expires_at,
    });
  }
});

fastify.get('/:hash', async (request, reply) => {
  let hash = request.params.hash;
  let shortener = await ShortUrlModel.findOne({ hash });

  if (shortener) {
    reply.status(200).send(shortener);
  } else {
    reply.status(404).send({
      status: 'error',
      message: 'Url no found',
    });
  }
});

fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Run the server!
fastify.listen({ port: process.env.PORT }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listening on ${address}`);
});
