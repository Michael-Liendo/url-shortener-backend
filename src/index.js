import * as dotenv from 'dotenv';
dotenv.config();
import Fastify from 'fastify';
import cors from '@fastify/cors';
import mongoose from 'mongoose';

import createHash from './utils/createHash.js';
import validateUrl from './utils/validateUrl.js';
const fastify = Fastify();

await fastify.register(cors, {
  origin: '*',
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to database'))
  .catch((e) => {
    throw e;
  });

const ShortUrlModel = mongoose.model(
  'ShortUrl',
  new mongoose.Schema({
    original_url: String,
    hash: String,
  }),
);

fastify.post('/new', async (request, reply) => {
  let url = request.body.url;
  let hash = request.body.hash;

  if (!url) {
    return reply.code(400).send({
      status: 'error',
      message: 'Put the url where it will be redirected',
    });
  }

  if (!hash) {
    hash = createHash(16);
  }

  if (!validateUrl(url)) {
    return reply.code(400).send({
      status: 'error',
      message: 'Put a valid url',
    });
  }

  let short = await ShortUrlModel.findOne({ hash });

  if (short) {
    return reply.code(400).send({
      status: 'error',
      message: 'The original url already exists',
      original_url: short.url,
      hash: short.hash,
    });
  } else {
    const newShortener = new ShortUrlModel({
      url,
      hash,
    });

    let saveUrl = await newShortener.save();

    console.log(saveUrl);
    reply.send({
      status: 'ok',
      message: 'The url was created',
    });
  }
});

fastify.post('/api/view-shorturl', async (request, reply) => {
  let original_url = request.body.original_url;
  let hash = request.body.hash;

  let url = await ShortUrlModel.findOne({ original_url });
  let short = await ShortUrlModel.findOne({ hash });

  if (url) {
    return reply.code().send({
      status: 'ok',
      message: 'Yes its original url exists',
      original_url: url.original_url,
      hash: url.hash,
    });
  } else if (short) {
    return reply.code(202).send({
      status: 'ok',
      message: 'Yes your url exists',
      original_url: short.original_url,
      hash: short.hash,
    });
  } else {
    return reply.code(404).send({
      status: 'error',
      message: 'No found url',
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
