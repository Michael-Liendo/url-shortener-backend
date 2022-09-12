import * as dotenv from 'dotenv';
dotenv.config();
import Fastify from 'fastify';
import mongoose from 'mongoose';

const fastify = Fastify();

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
    short_url: String,
  }),
);

const isValidUrl = (urlString) => {
  var urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};

fastify.post('/api/shorturl', async (request, reply) => {
  let original_url = request.body.original_url;
  let short_url = request.body.short_url;

  if (!original_url && !short_url) {
    reply.code(406).send({
      status: 'error',
      message:
        'Put the url where it will be redirected, and the short text for the shortened link',
    });

    return;
  }

  if (!isValidUrl(original_url)) {
    return reply.code(406).send({
      status: 'error',
      message: 'Put a valid url',
    });
  }

  let url = await ShortUrlModel.findOne({ original_url });
  let short = await ShortUrlModel.findOne({ short_url });

  if (url) {
    return reply.code(406).send({
      status: 'error',
      message: 'The link already exists',
      original_url: url.original_url,
      short_url: url.short_url,
    });
  } else if (short) {
    return reply.code(406).send({
      status: 'error',
      message: 'The original url already exists',
      original_url: short.original_url,
      short_url: short.short_url,
    });
  } else {
    const newShortener = new ShortUrlModel({
      original_url,
      short_url,
    });

    let saveUrl = await newShortener.save();

    console.log(saveUrl);
    reply.code(202).send({
      status: 'ok',
      message: 'The url was created',
    });
  }
});

fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listening on ${address}`);
});
