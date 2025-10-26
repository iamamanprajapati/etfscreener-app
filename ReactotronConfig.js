import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Basic Reactotron configuration
Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: "ETF Screener App",
  })
  .useReactNative() // add all built-in react native plugins
  .connect();
