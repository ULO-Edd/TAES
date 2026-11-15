import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { supabase } from "@/lib/supabase";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const navigation = useNavigation();
   const { session } = useAuth();

  useEffect(() => {
    if (session) {
      router.replace("/(tabs)");
    }
  }, [session, router]);

  const clearInputs = () => {
    setEmail("");
    setPassword("");
  };

  const handleLogin = async () => {
    if (email === "" || password === "") {
      setError("Please enter both username and password.");
    } else {
      setError("");

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        setError("Invalid credentials. Please try again.");
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "(tabs)" }], // must match your Stack.Screen name
          }),
        );
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require("@/assets/images/Bisca.png")} // Use your image's path
        style={styles.logo} // We'll add this style
      />
      <ThemedText style={styles.title}>Welcome to Bisca!</ThemedText>
      <ThemedView style={styles.formContainer}>
        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          theme={{ roundness: 15 }}
          left={<TextInput.Icon icon="account" />}
          testID="username_input"
        />

        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          theme={{ roundness: 15 }}
          left={<TextInput.Icon icon="lock" />}
          testID="password_input"
        />
        {error ? (
          <ThemedText style={styles.errorText} testID="error_text">
            {error}
          </ThemedText>
        ) : null}
      </ThemedView>

      <Pressable
        style={styles.button}
        onPress={async () => {
          await handleLogin();
          clearInputs();
        }}
        testID="login_button"
      >
        <ThemedText style={styles.buttonText}>Login</ThemedText>
      </Pressable>
      <Pressable
        style={[styles.button, styles.guestButton]}
        onPress={() => {
          console.log("Playing as Guest");
          router.push("/(tabs)");
        }}
        testID="guest_button"
      >
        <ThemedText style={styles.buttonText}>Play as Guest</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: "contain", // Ensures the image scales nicely
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  formContainer: {
    width: "90%", // This gives our inputs a width
  },

  button: {
    backgroundColor: "#FF3B30", // A standard red color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "90%", // Match the input width
    marginTop: 15, // Add some space before the next button
  },
  guestButton: {
    backgroundColor: "#8E8E93", // A standard gray color
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF3B30", // Use your app's red color
    marginTop: 5,
    marginLeft: 10, // Align it a bit with the inputs
  },
});
