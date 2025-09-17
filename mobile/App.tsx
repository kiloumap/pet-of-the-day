import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { ThemeProvider } from './src/theme';
import './src/localization/i18n'; // Initialize i18n
import AppNavigator from './src/navigation/AppNavigator';

const PetOfTheDayApp: React.FC = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ThemeProvider>
                    <SafeAreaProvider>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                        <View style={styles.container}>
                            <AppNavigator />
                        </View>
                    </SafeAreaProvider>
                </ThemeProvider>
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