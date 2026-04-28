import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';

import { API_BASE_URL } from '../../constants';

const FORGOT_PASSWORD_URL = `${API_BASE_URL}/forgot-password/`;

const { width } = Dimensions.get('window');

// Email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const validateEmail = (email) => {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Invalid email address.';
  return null;
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateAndSetError = (value) => {
    const error = validateEmail(value);
    setEmailError(error);
    return error;
  };

  const handleSubmit = async () => {
    const error = validateAndSetError(email);
    if (error) return;

    setIsLoading(true);
    try {
      const response = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      Alert.alert(
        'Connection Error',
        'Cannot reach server. Check backend & internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SANJEEVANI</Text>
          <Text style={styles.subtitle}>Smart Health Assistant</Text>
        </View>

        <View style={styles.form}>

          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Check your inbox!</Text>
              <Text style={styles.successMessage}>
                A reset link has been sent to{' '}
                <Text style={styles.boldGreen}>{email.trim()}</Text>
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>Email Address</Text>

              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (emailError) validateAndSetError(val);
                }}
                onBlur={() => validateAndSetError(email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {emailError && (
                <Text style={styles.errorText}>{emailError}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  (isLoading || !!emailError || !email.trim()) && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !!emailError || !email.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: width * 0.12,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },

  header: {
    alignItems: 'center',
    marginBottom: width * 0.1,
  },

  title: {
    fontSize: width * 0.08,
    fontWeight: '900',
    color: '#216c25',
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 5,
  },

  form: {
    flex: 1,
  },

  backButton: {
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: '#216c25',
    fontWeight: '500',
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#000',
    marginBottom: 12,
  },

  inputError: {
    borderColor: '#D32F2F',
  },

  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#216c25',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  disabledButton: {
    backgroundColor: '#A5D6A7',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#216c25',
    marginBottom: 8,
  },

  successMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  boldGreen: {
    color: '#216c25',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
