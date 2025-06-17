import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
    User,
    Settings,
    Bell,
    Shield,
    HelpCircle,
    LogOut,
    ChevronRight,
    Plus
} from 'lucide-react-native';

import { selectPets, selectDailyActions } from '@store/petsSlice';

const ProfileScreen: React.FC = () => {
    const pets = useSelector(selectPets);
    const dailyActions = useSelector(selectDailyActions);
    const myPets = pets.filter(pet => pet.isOwn);

    const handleAddPet = () => {
        // TODO: Implémenter l'ajout d'un nouveau pet
        console.log('Add new pet');
    };

    const MenuItem = ({
                          icon,
                          title,
                          subtitle,
                          onPress,
                          showChevron = true
                      }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        onPress: () => void;
        showChevron?: boolean;
    }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <View style={styles.menuItemText}>
                    <Text style={styles.menuTitle}>{title}</Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {showChevron && <ChevronRight size={20} color="#9ca3af" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>👤 Mon Profil</Text>

                {/* Mes animaux */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mes animaux ({myPets.length})</Text>
                        <TouchableOpacity onPress={handleAddPet} style={styles.addButton}>
                            <Plus size={20} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.petsContainer}>
                        {myPets.map(pet => (
                            <View key={pet.id} style={styles.petCard}>
                                <Text style={styles.petEmoji}>{pet.image}</Text>
                                <Text style={styles.petName}>{pet.name}</Text>
                                <Text style={styles.petBreed}>{pet.breed}</Text>
                                <Text style={styles.petAge}>{pet.age}</Text>
                                <View style={styles.petPoints}>
                                    <Text style={styles.points}>{pet.points}</Text>
                                    <Text style={styles.pointsLabel}>pts aujourd'hui</Text>
                                </View>
                            </View>
                        ))}

                        {myPets.length === 0 && (
                            <View style={styles.noPets}>
                                <Text style={styles.noPetsText}>Aucun animal enregistré</Text>
                                <TouchableOpacity onPress={handleAddPet} style={styles.addFirstPet}>
                                    <Text style={styles.addFirstPetText}>Ajouter mon premier animal</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Statistiques rapides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistiques du jour</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{dailyActions.length}</Text>
                            <Text style={styles.statLabel}>Actions notées</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {myPets.reduce((sum, pet) => sum + pet.points, 0)}
                            </Text>
                            <Text style={styles.statLabel}>Points totaux</Text>
                        </View>
                    </View>
                </View>

                {/* Menu paramètres */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paramètres</Text>

                    <MenuItem
                        icon={<Settings size={20} color="#6b7280" />}
                        title="Paramètres généraux"
                        subtitle="Personnaliser l'application"
                        onPress={() => console.log('Settings')}
                    />

                    <MenuItem
                        icon={<Bell size={20} color="#6b7280" />}
                        title="Notifications"
                        subtitle="Gérer les alertes quotidiennes"
                        onPress={() => console.log('Notifications')}
                    />

                    <MenuItem
                        icon={<Shield size={20} color="#6b7280" />}
                        title="Confidentialité"
                        subtitle="Contrôler vos données"
                        onPress={() => console.log('Privacy')}
                    />

                    <MenuItem
                        icon={<HelpCircle size={20} color="#6b7280" />}
                        title="Aide & Support"
                        subtitle="FAQ et contact"
                        onPress={() => console.log('Help')}
                    />

                    <MenuItem
                        icon={<LogOut size={20} color="#dc2626" />}
                        title="Déconnexion"
                        onPress={() => console.log('Logout')}
                        showChevron={false}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 24,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    addButton: {
        padding: 4,
    },
    petsContainer: {
        gap: 12,
    },
    petCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    petEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    petBreed: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    petAge: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 8,
    },
    petPoints: {
        alignItems: 'center',
    },
    points: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    noPets: {
        alignItems: 'center',
        padding: 24,
    },
    noPetsText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 16,
    },
    addFirstPet: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstPetText: {
        color: 'white',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    menuSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
});

export default ProfileScreen;