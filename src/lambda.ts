import axios from "axios";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { APIGatewayProxyHandlerV2, SNSHandler } from "aws-lambda";
const sns = new SNSClient();

export const endpoint: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    throw new Error("Invalid event body");
  }
  const body = JSON.parse(event.body);
  if (
    !body.context.sessionId ||
    !body.context.projectId ||
    !body.context.anonymousId
  ) {
    throw new Error("Missing event context");
  }

  const message = { ...JSON.parse(event.body), ingestedTimestamp: Date.now() };
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: JSON.stringify(message),
      MessageStructure: "string",
    })
  );

  return {
    statusCode: 200,
    body: "ok",
  };
};

export const sendToPostHog: SNSHandler = async (snsEvent) => {
  const batch: any[] = [];
  snsEvent.Records.forEach((record) => {
    const { context, environment, events } = JSON.parse(record.Sns.Message);
    events.forEach((event: any) => {
      batch.push({
        distinct_id: context.anonymousId,
        event: event.name,
        properties: {
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
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      url: "https://app.posthog.com/batch",
      data: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        batch,
      }),
      timeout: 5000,
    });
  } catch (e: any) {
    console.log(e.response.data);
    throw e;
  }
};

export const sendToAmplitude: SNSHandler = async (snsEvent) => {
  const amplitudeEvents: any[] = [];
  snsEvent.Records.forEach((record) => {
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
      method: "post",
      url: "https://api.amplitude.com/2/httpapi",
      data: JSON.stringify({
        api_key: process.env.AMPLITUDE_API_KEY,
        events: amplitudeEvents,
      }),
      timeout: 5000,
    });
  } catch (e: any) {
    console.log(e.response.data);
    throw e;
  }
};
