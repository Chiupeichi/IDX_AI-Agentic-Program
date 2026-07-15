import { handleMessage } from "./conversation";
import { clearSession } from "./session";

async function run() {
  const userId = "test-user";

  clearSession(userId);

  const messages = [
    "Find homes in Irvine",
    "Under $1.2M",
    "Single family",
    "At least 3 beds",
  ];

  for (const message of messages) {
    console.log(`\nUser: ${message}`);

    const response = await handleMessage(userId, message);

    console.log(`Agent: ${response}`);
  }
}

run().catch((error) => {
  console.error("Conversation test failed:", error);
});
