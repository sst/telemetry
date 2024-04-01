import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as firehose from "@aws-cdk/aws-kinesisfirehose-alpha";
import * as firehoseDest from "@aws-cdk/aws-kinesisfirehose-destinations-alpha";
import * as sst from "sst/constructs";

export default function MainStack({ stack }: sst.StackContext) {
  // Create a Firehose that writes to an S3 bucket
  const bucket = new sst.Bucket(stack, "Bucket");
  const stream = new firehose.DeliveryStream(stack, "Stream", {
    destinations: [new firehoseDest.S3Bucket(bucket.cdk.bucket)],
  });

  // Create a Topic that fanouts to a Lambda function and the Firehose
  const topic = new sst.Topic(stack, "Telemetry", {
    defaults: {
      function: {
        environment: {
          POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
        },
      },
    },
    subscribers: {
      "0": "src/lambda.sendToPostHog",
    },
  });
  const role = new iam.Role(stack, "Role", {
    assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
  });
  stream.grantPutRecords(role);
  new sns.Subscription(stack, "Subscription", {
    topic: topic.cdk.topic,
    endpoint: stream.deliveryStreamArn,
    protocol: sns.SubscriptionProtocol.FIREHOSE,
    subscriptionRoleArn: role.roleArn,
    rawMessageDelivery: true,
  });

  // Create a HTTP API
  const api = new sst.Api(stack, "Api", {
    customDomain: process.env.API_DOMAIN,
    defaults: {
      function: {
        permissions: [topic],
        environment: {
          TOPIC_ARN: topic.topicArn,
        },
      },
    },
    routes: {
      "POST /events": "src/lambda.endpoint",
    },
  });

  // Show the endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
