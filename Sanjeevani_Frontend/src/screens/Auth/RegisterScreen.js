import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from "@expo/vector-icons";

import { API_BASE_URL } from '../../constants';

const API_URL = `${API_BASE_URL}/register/`;

// Validation
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validators = {
  username: (v) => {
    if (!v.trim()) return "Username is required.";
    if (!USERNAME_REGEX.test(v.trim()))
      return "3–30 chars (letters, numbers, underscore)";
    return null;
  },
  email: (v) => {
    if (!v.trim()) return "Email is required.";
    if (!EMAIL_REGEX.test(v.trim())) return "Invalid email";
    return null;
  },
  age: (v) => {
    if (!v.trim()) return "Required";
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1 || n > 120) return "1–120 only";
    return null;
  },
  password: (v) => {
    if (!v) return "Password required";
    if (v.length < 8) return "Min 8 chars";
    if (!/[A-Z]/.test(v)) return "1 uppercase needed";
    if (!/[a-z]/.test(v)) return "1 lowercase needed";
    if (!/[0-9]/.test(v)) return "1 number needed";
    if (!/[!@#$%^&*]/.test(v)) return "1 special char needed";
    return null;
  },
  confirmPassword: (v, password) => {
    if (!v) return "Confirm password";
    if (v !== password) return "Passwords mismatch";
    return null;
  },
};

const INITIAL_ERRORS = {
  username: null,
  email: null,
  age: null,
  password: null,
  confirmPassword: null,
};

const Field = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  secureTextEntry,
  errorKey,
  rightElement,
  errors,
}) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>

    <View style={[styles.inputRow, errors[errorKey] && styles.inputError]}>
      <TextInput
        style={styles.inputInner}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      {rightElement}
    </View>

    {errors[errorKey] && (
      <Text style={styles.errorText}>{errors[errorKey]}</Text>
    )}
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  const validateField = (field, value, extra) => {
    const error =
      field === "confirmPassword"
        ? validators.confirmPassword(value.trim(), extra ?? password)
        : validators[field](value.trim());

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const validateAll = () => {
    const newErrors = {
      username: validators.username(username.trim()),
      email: validators.email(email.trim()),
      age: validators.age(age.trim()),
      password: validators.password(password),
      confirmPassword: validators.confirmPassword(
        confirmPassword.trim(),
        password,
      ),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === null);
  };

  const handleRegister = async () => {
    if (!validateAll()) return;

    setIsLoading(true);
    try {
      await axios.post(API_URL, {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        age: parseInt(age),
        gender,
      });

      // Save profile fields KEYED BY USERNAME so data never bleeds across users
      const uname = username.trim();
      await AsyncStorage.multiSet([
        [`userEmail_${uname}`,  email.trim().toLowerCase()],
        [`userAge_${uname}`,    String(parseInt(age))],
        [`userGender_${uname}`, gender],
      ]);

      Alert.alert("Success", `Welcome ${username}!`, [
        { text: "Login Now", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Registration failed. Please check your network and try again.";
      Alert.alert("Registration Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const Eye = ({ visible, onPress }) => (
    <TouchableOpacity onPress={onPress} style={{ paddingLeft: 8 }}>
      <Feather name={visible ? "eye" : "eye-off"} size={20} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SANJEEVANI</Text>
          <Text style={styles.subtitle}>Your Ayurvedic Companion</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="Username"
            value={username}
            placeholder="Enter username"
            errorKey="username"
            errors={errors}
            onChangeText={(v) => {
              setUsername(v);
              if (errors.username) validateField("username", v);
            }}
            onBlur={() => validateField("username", username)}
          />

          <Field
            label="Email"
            value={email}
            placeholder="user@email.com"
            errorKey="email"
            errors={errors}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) validateField("email", v);
            }}
            onBlur={() => validateField("email", email)}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label="Age"
                value={age}
                placeholder="Age"
                errorKey="age"
                errors={errors}
                onChangeText={(v) => {
                  setAge(v);
                  if (errors.age) validateField("age", v);
                }}
                onBlur={() => validateField("age", age)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.half}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.inputRow}>
                <Picker
                  selectedValue={gender}
                  onValueChange={setGender}
                  style={{ flex: 1 }}
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>
          </View>

          <Field
            label="Password"
            value={password}
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            errorKey="password"
            errors={errors}
            onChangeText={(v) => {
  setPassword(v);
  if (errors.password) validateField("password", v);
  if (confirmPassword) validateField("confirmPassword", confirmPassword, v);
}}
            onBlur={() => validateField("password", password)}
            rightElement={
              <Eye
                visible={showPassword}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Field
            label="Confirm Password"
            value={confirmPassword}
            placeholder="Repeat password"
            secureTextEntry={!showConfirm}
            errors={errors}
            errorKey="confirmPassword"
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (errors.confirmPassword) validateField("confirmPassword", v);
            }}
            onBlur={() => validateField("confirmPassword", confirmPassword)}
            rightElement={
              <Eye
                visible={showConfirm}
                onPress={() => setShowConfirm(!showConfirm)}
              />
            }
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.footerLink}
          >
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.boldGreen}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#216c25",
    letterSpacing: 2,
  },

  subtitle: {
    color: "#666",
    marginTop: 5,
  },

  form: {
    flex: 1,
  },

  fieldWrapper: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    color: "#444",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: "#fafafa",
  },

  inputInner: {
    flex: 1,
    fontSize: 15,
  },

  inputError: {
    borderColor: "#e53935",
  },

  errorText: {
    color: "#e53935",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  half: {
    flex: 1,
  },

  button: {
    marginTop: 15,
    backgroundColor: "#216c25",
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  disabled: {
    backgroundColor: "#a5d6a7",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  footerLink: {
    marginTop: 20,
  },

  linkText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },

  boldGreen: {
    color: "#216c25",
    fontWeight: "700",
  },
});

export default RegisterScreen;