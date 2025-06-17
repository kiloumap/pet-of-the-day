import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from '@/store';
import AppNavigator from '@navigation/AppNavigator';

const PetOfTheDayApp: React.FC = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <SafeAreaProvider>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <View style={styles.container}>
                        <AppNavigator />
                    </View>
                </SafeAreaProvider>
            </PersistGate>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
});

export default PetOfTheDayApp;