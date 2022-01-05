# Telemetry [![Seed Status](https://api.seed.run/anomaly/sst-telemetry/stages/prod/build_badge)](https://console.seed.run/anomaly/sst-telemetry)

A [SST app](https://github.com/serverless-stack/serverless-stack) that collects SST telemetry data and sends the events to [Amplitude](http://amplitude.com). It also backs up the events to [AWS S3](https://aws.amazon.com/s3/).

## Architecture

The architecture make uses of an [Api](https://docs.serverless-stack.com/constructs/Api) construct, a [Topic](https://docs.serverless-stack.com/constructs/Topic) construct, a [Bucket](https://docs.serverless-stack.com/constructs/Bucket) construct, and a [Kinesis Firehose](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-kinesisfirehose.DeliveryStream.html) construct.

It works like this:
1. The API endpoint receives the SST telemetry events and sends a message to the `Topic` with the events payload.
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

Then start the Live Lambda Development environment.

``` bash
$ npx sst start
```

## Deploying to Prod

Deploy your service to prod by running.

``` bash
$ npx sst deploy --stage prod
```

## Documentation

Learn more about the Serverless Stack.

- [Docs](https://docs.serverless-stack.com)
- [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
- [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)
