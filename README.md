# Telemetry [![Seed Status](https://api.seed.run/anomaly/sst-telemetry/stages/prod/build_badge)](https://console.seed.run/anomaly/sst-telemetry)

An [SST app](https://github.com/serverless-stack/serverless-stack) that collects telemetry data from the [SST CLI](https://www.npmjs.com/package/@serverless-stack/cli) and sends the events to [Amplitude](http://amplitude.com). It also backs up the events to [AWS S3](https://aws.amazon.com/s3/).

## Architecture

This app uses an [`Api`](https://docs.serverless-stack.com/constructs/Api), [`Topic`](https://docs.serverless-stack.com/constructs/Topic), [`Bucket`](https://docs.serverless-stack.com/constructs/Bucket), and a [`Kinesis Firehose`](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-kinesisfirehose.DeliveryStream.html) construct.

It works like so:

1. The API endpoint receives the SST CLI telemetry events and sends a message to the `Topic` with the events payload.
2. A Lambda function is subscribed to the `Topic` and sends the events to [Amplitude](http://amplitude.com).
3. The `Kinesis Firehose` is also subscribed to the `Topic` and stores the events to the `Bucket`.

## Running Locally

Create a `.env.local` file and add the Amplitude API key.

```
AMPLITUDE_API_KEY=39470db0a7b31c724c027f491f0c33dc
```

Optionally configure a custom domain for the API endpoint.

```
API_DOMAIN=telemetry.domain.com
```

Start by installing the dependencies.

``` bash
$ npm install
```

Then start the [Live Lambda Development environment](https://docs.serverless-stack.com/live-lambda-development).

``` bash
$ npx sst start
```

## Deploying to Prod

Deploy your service to prod by running.

``` bash
$ npx sst deploy --stage prod
```

## CI/CD

This repo also uses [Seed](https://seed.run) for CI/CD deployments.

## Documentation

Learn more about the Serverless Stack.

- [Docs](https://docs.serverless-stack.com)
- [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
- [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)
