import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { NavigationType } from "../type";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

// 🔔 Cross-platform alert function
const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require("react-native");
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<NavigationType>();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "38989656430-2nfgk52v7c2hnacsq0ilja1h7oiqqn68.apps.googleusercontent.com",
  });

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      showAlert("Login Failed", error.message || "Something went wrong.");
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken } = response.authentication!;
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential)
        .then(() => {
          console.log("✅ Google login successful");
          showAlert("Success", "Signed in with Google!");
        })
        .catch((err) =>
          showAlert("Login Error", err.message || "Google login failed.")
        );
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Login" onPress={login} />

        <View style={{ marginVertical: 10 }}>
          <Button
            title="Sign in with Google"
            onPress={() => promptAsync()}
            disabled={!request}
            color="#DB4437"
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text style={styles.registerLink}>Register here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  formWrapper: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    borderColor: "#888",
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  registerText: {
    marginTop: 20,
    textAlign: "center",
  },
  registerLink: {
    color: "blue",
    fontWeight: "bold",
  },
});
