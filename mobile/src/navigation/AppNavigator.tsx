import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch } from 'react-redux';
import { Home, Users, BarChart3, User } from 'lucide-react-native';

import HomeScreen from '@screens/home/HomeScreen';
import GroupsScreen from '@screens/groups/GroupsScreen';
import LeaderboardScreen from '@screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import { setPets, setGroups } from '@store/petsSlice';
import { pets, groups } from '../../data/mockData';

const Tab = createBottomTabNavigator();

const AppNavigator: React.FC = () => {
    const dispatch = useDispatch();

    // Initialize data on app start
    useEffect(() => {
        dispatch(setPets(pets));
        dispatch(setGroups(groups));
    }, [dispatch]);

    const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
        switch (routeName) {
            case 'Home':
                return <Home size={size} color={color} />;
            case 'Groups':
                return <Users size={size} color={color} />;
            case 'Leaderboard':
                return <BarChart3 size={size} color={color} />;
            case 'Profile':
                return <User size={size} color={color} />;
            default:
                return <Home size={size} color={color} />;
        }
    };

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) =>
                        getTabBarIcon(route.name, focused, color, size),
                    tabBarActiveTintColor: '#3b82f6',
                    tabBarInactiveTintColor: '#9ca3af',
                    tabBarStyle: {
                        backgroundColor: 'white',
                        borderTopWidth: 1,
                        borderTopColor: '#f3f4f6',
                        paddingBottom: 8,
                        paddingTop: 8,
                        height: 80,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ tabBarLabel: 'Accueil' }}
                />
                <Tab.Screen
                    name="Groups"
                    component={GroupsScreen}
                    options={{ tabBarLabel: 'Groupes' }}
                />
                <Tab.Screen
                    name="Leaderboard"
                    component={LeaderboardScreen}
                    options={{ tabBarLabel: 'Classement' }}
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ tabBarLabel: 'Profil' }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;