import React, { useState, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import PetSelector from '../PetSelector';
import ActionButton from '../ActionButton';
import { Pet, Action, Multiplier } from '../../../types';
import { getActionsByAge, calculatePoints, getAgeGroup, multipliers } from '@/constants/dogRewardsSystem';
import { addAction, addMultipleBadges, selectDailyActions, selectEarnedBadges } from '@/store/petsSlice';
import { BadgeEngine } from '@/utils/badgeEngine';

interface ActionModalProps {
    visible: boolean;
    pets: Pet[];
    onClose: () => void;
    onSelectAction: (actionId: number, petId: number, finalPoints: number) => void;
}

interface ActionModalProps {
    visible: boolean;
    pets: Pet[];
    onClose: () => void;
    onSelectAction: (actionId: number, petId: number, finalPoints: number) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
                                                     visible,
                                                     pets,
                                                     onClose,
                                                     onSelectAction,
                                                 }) => {
    const dispatch = useDispatch();
    const dailyActions = useSelector(selectDailyActions);
    const earnedBadges = useSelector(selectEarnedBadges);
    const [selectedPet, setSelectedPet] = useState<number | null>(null);
    const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);

    const availableActions = useMemo(() => {
        if (!selectedPet) return [];

        const pet = pets.find(p => p.id === selectedPet);
        if (!pet) return [];

        const ageGroup = getAgeGroup(pet.ageInMonths);
        return getActionsByAge(ageGroup);
    }, [selectedPet, pets]);

    const handleActionPress = (action: Action) => {
        if (!selectedPet) {
            Alert.alert('Erreur', 'Veuillez sélectionner un chien');
            return;
        }

        const pet = pets.find(p => p.id === selectedPet);
        if (!pet) return;

        const finalPoints = calculatePoints(action.points, selectedMultipliers);

        const newAction = {
            petId: selectedPet,
            actionId: action.id,
            points: finalPoints,
            timestamp: new Date().toISOString(),
            actionText: action.text,
        };

        dispatch(addAction(newAction));

        const badgeEngine = new BadgeEngine(earnedBadges, [...dailyActions, newAction]);
        const newBadges = badgeEngine.detectNewBadges(pet, newAction);

        if (newBadges.length > 0) {
            dispatch(addMultipleBadges(newBadges));
        }

        onSelectAction(action.id, selectedPet, finalPoints);

        setSelectedPet(null);
        setSelectedMultipliers([]);
        onClose();
    };

    const handleMultiplierToggle = (multiplierName: string) => {
        setSelectedMultipliers(prev =>
            prev.includes(multiplierName)
                ? prev.filter(m => m !== multiplierName)
                : [...prev, multiplierName]
        );
    };

    const handleClose = () => {
        setSelectedPet(null);
        setSelectedMultipliers([]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Noter une action</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <PetSelector
                        pets={pets.filter(p => p.isOwn)}
                        selectedPet={selectedPet}
                        onPetSelect={setSelectedPet}
                    />

                    {selectedPet && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Modificateurs (optionnel)</Text>
                            <View style={styles.multipliersContainer}>
                                {multipliers.map((multiplier) => (
                                    <TouchableOpacity
                                        key={multiplier.name}
                                        onPress={() => handleMultiplierToggle(multiplier.name)}
                                        style={[
                                            styles.multiplierChip,
                                            selectedMultipliers.includes(multiplier.name) && styles.selectedMultiplier
                                        ]}
                                    >
                                        <Text style={[
                                            styles.multiplierText,
                                            selectedMultipliers.includes(multiplier.name) && styles.selectedMultiplierText
                                        ]}>
                                            {multiplier.name} (×{multiplier.factor})
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {selectedPet && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Actions disponibles</Text>
                            <View style={styles.actionsContainer}>
                                {availableActions.map((action) => {
                                    const finalPoints = calculatePoints(action.points, selectedMultipliers);
                                    return (
                                        <ActionButton
                                            key={action.id}
                                            action={action}
                                            onPress={() => handleActionPress(action)}
                                            finalPoints={finalPoints}
                                            showOriginalPoints={selectedMultipliers.length > 0}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {!selectedPet && (
                        <View style={styles.placeholder}>
                            <Text style={styles.placeholderText}>
                                Sélectionnez d'abord un de vos chiens pour voir les actions disponibles
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    multipliersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    multiplierChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: 'white',
    },
    selectedMultiplier: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    multiplierText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    selectedMultiplierText: {
        color: '#3b82f6',
    },
    actionsContainer: {
        gap: 8,
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    placeholderText: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
});

export default ActionModal;