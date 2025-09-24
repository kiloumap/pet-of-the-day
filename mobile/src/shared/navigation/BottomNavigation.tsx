import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Users, Trophy, Settings } from 'lucide-react-native';
import { Screen } from '@/types';

interface BottomNavigationProps {
    currentScreen: Screen;
    onScreenChange: (screen: Screen) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
                                                               currentScreen,
                                                               onScreenChange,
                                                           }) => {
    const tabs = [
        { id: 'home' as Screen, label: 'Accueil', icon: Home },
        { id: 'groups' as Screen, label: 'Groupes', icon: Users },
        { id: 'leaderboard' as Screen, label: 'Classements', icon: Trophy },
        { id: 'profile' as Screen, label: 'Profil', icon: Settings },
    ];

    return (
        <View style={styles.container}>
            {tabs.map(tab => {
                const IconComponent = tab.icon;
                const isActive = currentScreen === tab.id;

                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onScreenChange(tab.id)}
                    >
                        <IconComponent
                            size={20}
                            color={isActive ? '#3b82f6' : '#6b7280'}
                        />
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 34, // Pour l'encoche iPhone
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    tabActive: {
        backgroundColor: '#eff6ff',
    },
    tabLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    tabLabelActive: {
        color: '#3b82f6',
    },
});

export default BottomNavigation;