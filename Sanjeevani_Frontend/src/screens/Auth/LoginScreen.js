import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert,
    TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

import { API_BASE_URL } from '../../constants';

const API_URL = `${API_BASE_URL}/login/`;

// Validation
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const validators = {
    username: (v) => {
        if (!v.trim()) return 'Username is required.';
        if (!USERNAME_REGEX.test(v.trim()))
            return 'Invalid username format';
        return null;
    },
    password: (v) => {
        if (!v) return 'Password is required.';
        if (v.length < 6) return 'Minimum 6 characters required';
        return null;
    },
};

const Field = ({
    label, value, onChangeText, onBlur,
    placeholder, secureTextEntry, errorKey,
    rightElement, errors
}) => (
    <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>

        <View style={[
            styles.inputRow,
            errors[errorKey] && styles.inputError
        ]}>
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

        {errors[errorKey] &&
            <Text style={styles.errorText}>{errors[errorKey]}</Text>
        }
    </View>
);

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState({
        username: null,
        password: null,
    });

    const validateField = (field, value) => {
        const error = validators[field](value);
        setErrors(prev => ({ ...prev, [field]: error }));
        return error;
    };

    const validateAll = () => {
        const newErrors = {
            username: validators.username(username),
            password: validators.password(password.trim()),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(e => e === null);
    };

    const handleLogin = async () => {
        if (!validateAll()) return;

        setIsLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userName', username.trim());
                navigation.replace('Home'); // Navigate to Home after login
            } else {
                Alert.alert('Login Failed', data.error || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Error', 'Server not reachable');
        } finally {
            setIsLoading(false);
        }
    };

    const Eye = ({ visible, onPress }) => (
        <TouchableOpacity onPress={onPress} style={{ paddingLeft: 8 }}>
            <Feather name={visible ? 'eye' : 'eye-off'} size={20} />
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>SANJEEVANI</Text>
                    <Text style={styles.subtitle}>Smart Health Assistant</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>

                    <Field
                        label="Username"
                        value={username}
                        placeholder="Enter username"
                        errorKey="username"
                        errors={errors}
                        onChangeText={(v) => {
                            setUsername(v);
                            if (errors.username) validateField('username', v);
                        }}
                        onBlur={() => validateField('username', username)}
                    />

                    <Field
                        label="Password"
                        value={password}
                        placeholder="Enter password"
                        errors={errors} 
                        secureTextEntry={!showPassword}
                        errorKey="password"
                        onChangeText={(v) => {
                            setPassword(v);
                            if (errors.password) validateField('password', v);
                        }}
                        onBlur={() => validateField('password', password)}
                        rightElement={
                            <Eye
                                visible={showPassword}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />

                    {/* Forgot Password Navigation */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotLink}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.disabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Login</Text>
                        }
                    </TouchableOpacity>

                    {/* Register Navigation */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        style={styles.footerLink}
                    >
                        <Text style={styles.linkText}>
                            Don’t have an account?{' '}
                            <Text style={styles.boldGreen}>Register</Text>
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
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },

    header: {
        alignItems: 'center',
        marginBottom: 40,
    },

    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#216c25',
        letterSpacing: 2,
    },

    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },

    form: {
        flex: 1,
    },

    welcomeText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 25,
    },

    fieldWrapper: {
        marginBottom: 14,
    },

    inputLabel: {
        fontSize: 13,
        marginBottom: 6,
        color: '#444',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: '#fafafa',
    },

    inputInner: {
        flex: 1,
        fontSize: 15,
    },

    inputError: {
        borderColor: '#e53935',
    },

    errorText: {
        color: '#e53935',
        fontSize: 12,
    },

    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 15,
    },

    forgotText: {
        fontSize: 13,
        color: '#216c25',
        fontWeight: '600',
    },

    button: {
        backgroundColor: '#216c25',
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    disabled: {
        backgroundColor: '#a5d6a7',
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    footerLink: {
        marginTop: 20,
    },

    linkText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
    },

    boldGreen: {
        color: '#216c25',
        fontWeight: '700',
    },
});

export default LoginScreen;
