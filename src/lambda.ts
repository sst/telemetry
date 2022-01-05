import axios from "axios";
import AWS from "aws-sdk";
import { APIGatewayProxyHandlerV2, SNSHandler } from "aws-lambda";
const sns = new AWS.SNS();

export const endpoint: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    throw new Error("Invalid event body");
  }
  const body = JSON.parse(event.body);
  if (!body.context.sessionId
    || !body.context.projectId
    || !body.context.anonymousId) {
    throw new Error("Missing event context");
  }

  const message = { ...JSON.parse(event.body),
    ingestedTimestamp: Date.now(),
  };
  await sns.publish({
    TopicArn: process.env.TOPIC_ARN,
    Message: JSON.stringify(message),
    MessageStructure: "string",
  }).promise();

  return {
    statusCode: 200,
    body: "ok",
  };
};

export const sendToAmplitude: SNSHandler = async (snsEvent) => {
  const amplitudeEvents: any[] = [];
  snsEvent.Records.forEach(record => {
    const { context, environment, events } = JSON.parse(record.Sns.Message);
    events.forEach((event: any) => {
      amplitudeEvents.push({
        user_id: context.anonymousId,
        event_type: event.name,
        event_properties: {
          ...event.properties,
          projectId: context.projectId,
          sessionId: context.sessionId,
          environment,
        },
      });
    });
  });

  try {
    await axios({
      method: 'post',
      url: "https://api.amplitude.com/2/httpapi",
      data: JSON.stringify({
        api_key: process.env.AMPLITUDE_API_KEY,
        events: amplitudeEvents,
      }),
      timeout: 5000,
    });
  } catch(e: any) {
    console.log(e.response.data)
    throw e;
  }
};
