import { SSTConfig } from "sst";
import MainStack from "./MainStack";

export default {
  config(input) {
    return {
      name: "serverless-stack-telemetry",
      region: "us-east-1",
      stage: "dev",
    };
  },
  stacks(app) {
    app.setDefaultRemovalPolicy("destroy");
    app.setDefaultFunctionProps({
      runtime: "nodejs20.x",
    });

    app.stack(MainStack, { id: "main-stack" });
  },
} satisfies SSTConfig;
