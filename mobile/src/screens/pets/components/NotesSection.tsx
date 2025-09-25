import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';

interface PetNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesSectionProps {
  petId: string;
  notes: PetNote[];
  onAddNote: (content: string) => Promise<void>;
  onEditNote: (noteId: string, content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  petId,
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  isLoading = false,
  canEdit = true,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing['2xl'],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
    },
    addButtonText: {
      color: theme.colors.white,
      marginLeft: theme.spacing.xs,
      fontSize: 14,
      fontWeight: '500',
    },
    notesList: {
      maxHeight: 400,
    },
    noteItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    noteDate: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
    },
    noteActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.xs,
    },
    noteContent: {
      ...theme.typography.styles.body,
      color: theme.colors.text.primary,
      lineHeight: 20,
    },
    noteInput: {
      backgroundColor: theme.colors.background.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    inputActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
    },
    cancelButton: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      await onAddNote(noteContent.trim());
      setNoteContent('');
      setIsAddingNote(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('pets.notes.addError'));
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!noteContent.trim()) return;

    try {
      await onEditNote(noteId, noteContent.trim());
      setNoteContent('');
      setEditingNoteId(null);
    } catch (error) {
      Alert.alert(t('common.error'), t('pets.notes.editError'));
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('pets.deleteNote'),
      t('pets.noteDeleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteNote(noteId);
            } catch (error) {
              Alert.alert(t('common.error'), t('pets.notes.deleteError'));
            }
          },
        },
      ]
    );
  };

  const startEditNote = (note: PetNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setIsAddingNote(false);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setIsAddingNote(false);
    setNoteContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('pets.notesSection')}</Text>
        {canEdit && !isAddingNote && !editingNoteId && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingNote(true)}
            testID="add-note-button"
          >
            <Plus size={16} color={theme.colors.white} />
            <Text style={styles.addButtonText}>{t('pets.addNote')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {(isAddingNote || editingNoteId) && (
        <View>
          <TextInput
            style={styles.noteInput}
            value={noteContent}
            onChangeText={setNoteContent}
            placeholder={t('pets.notes.placeholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            testID="note-input"
          />
          <View style={styles.inputActions}>
            <Button
              title={t('common.cancel')}
              onPress={cancelEdit}
              style={styles.cancelButton}
              variant="outline"
            />
            <Button
              title={t('common.save')}
              onPress={
                editingNoteId
                  ? () => handleEditNote(editingNoteId)
                  : handleAddNote
              }
              style={styles.saveButton}
              loading={isLoading}
              testID="save-note-button"
            />
          </View>
        </View>
      )}

      {notes.length === 0 ? (
        <View style={styles.emptyState} testID="notes-empty-state">
          <Text style={styles.emptyText}>{t('pets.notes.empty')}</Text>
          <Text style={styles.emptySubtext}>
            {t('pets.notes.emptyDescription')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.notesList} nestedScrollEnabled>
          {notes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteDate}>
                  {formatDate(note.updatedAt)}
                </Text>
                {canEdit && (
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEditNote(note)}
                      testID={`edit-note-${note.id}`}
                    >
                      <Edit3 size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteNote(note.id)}
                      testID={`delete-note-${note.id}`}
                    >
                      <Trash2 size={16} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.noteContent}>{note.content}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};