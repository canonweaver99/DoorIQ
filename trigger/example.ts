import { task } from "@trigger.dev/sdk/v3";

export const exampleTask = task({
  id: "example-task",
  run: async (payload: { message: string }) => {
    console.log("Example task executed with message:", payload.message);
    return { success: true, message: payload.message };
  },
});

