// Simple test file to verify Reactotron is working
import Reactotron from "reactotron-react-native";

// Test Reactotron connection
if (__DEV__) {
  console.log("🧪 Testing Reactotron connection...");
  
  // Test basic logging
  Reactotron.log("Hello from Reactotron!");
  
  // Test custom command
  Reactotron.onCustomCommand({
    command: "test",
    handler: () => {
      Reactotron.log("Custom command received!");
    },
    title: "Test Command",
    description: "A simple test command"
  });
  
  console.log("✅ Reactotron test setup complete");
}
