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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
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
    // Using Alert dynamically to avoid import error on web
    const { Alert } = require("react-native");
    Alert.alert(title, message);
  }
};

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation<NavigationType>();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "38989656430-2nfgk52v7c2hnacsq0ilja1h7oiqqn68.apps.googleusercontent.com",
  });

  // Google Sign-Up
  useEffect(() => {
    if (response?.type === "success") {
      const { idToken } = response.authentication!;
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const usernameFromEmail = user.email?.split("@")[0] || "user";

          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            username: usernameFromEmail,
            createdAt: new Date(),
            provider: "google",
          });

          console.log("✅ Google sign-up success");
          showAlert("Success", "Signed up with Google!");
        })
        .catch((err) =>
          showAlert("Google Sign-Up Failed", err.message || "An error occurred.")
        );
    }
  }, [response]);

  // Check if username exists
  const isUsernameTaken = async (uname: string) => {
    const q = query(
      collection(db, "users"),
      where("username", "==", uname.trim())
    );
    const result = await getDocs(q);
    return !result.empty;
  };

  // Register with Email/Password
  const register = async () => {
    if (!username || !email || !password || !confirmPassword) {
      return showAlert("Error", "Please fill in all fields.");
    }

    if (password !== confirmPassword) {
      return showAlert("Error", "Passwords do not match.");
    }

    const taken = await isUsernameTaken(username);
    if (taken) {
      return showAlert("Username Taken", "Please choose a different username.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username.trim(),
        createdAt: new Date(),
        provider: "email",
      });

      showAlert("Success", "Account created!");
    } catch (error: any) {
      showAlert("Registration Failed", error.message || "An error occurred.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

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

        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button title="Register" onPress={register} />

        <View style={{ marginVertical: 10 }}>
          <Button
            title="Sign up with Google"
            onPress={() => promptAsync()}
            disabled={!request}
            color="#DB4437"
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.registerText}>
            Already have an account?{" "}
            <Text style={styles.registerLink}>Login here</Text>
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
