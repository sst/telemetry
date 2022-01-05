import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as firehoseDest from '@aws-cdk/aws-kinesisfirehose-destinations';
import * as sst from "@serverless-stack/resources";
import { isMainThread } from 'worker_threads';

export default class MainStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    // Create a Firehose that writes to an S3 bucket
    const bucket = new sst.Bucket(this, "Bucket");
    const stream = new firehose.DeliveryStream(this, "Stream", {
      destinations: [new firehoseDest.S3Bucket(bucket.s3Bucket)],
    });

    // Create a Topic that fanouts to a Lambda function and the Firehose
    const topic = new sst.Topic(this, "Telemetry", {
      defaultFunctionProps: {
        environment: {
          AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY!,
        },
      },
      subscribers: ["src/lambda.sendToAmplitude"]
    });
    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal('sns.amazonaws.com'),
    });
    stream.grantPutRecords(role);
    new sns.Subscription(this, 'Subscription', {
      topic: topic.snsTopic,
      endpoint: stream.deliveryStreamArn,
      protocol: sns.SubscriptionProtocol.FIREHOSE,
      subscriptionRoleArn: role.roleArn,
      rawMessageDelivery: true,
    });

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      customDomain: process.env.API_DOMAIN,
      defaultFunctionProps: {
        permissions: [topic],
        environment: {
          TOPIC_ARN: topic.topicArn,
        }
      },
      routes: {
        "POST /events": "src/lambda.endpoint",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      "ApiEndpoint": api.url,
    });
  }
}
