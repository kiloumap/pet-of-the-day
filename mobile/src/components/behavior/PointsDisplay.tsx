import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTranslation } from '../../hooks';
import { useTheme } from '../../theme';
import { PetRanking, DailyScore } from '../../types/behavior';

const { width: screenWidth } = Dimensions.get('window');

interface PointsDisplayProps {
  // Single score mode
  score?: DailyScore;
  totalPoints?: number;
  positiveBehaviors?: number;
  negativeBehaviors?: number;
  
  // Ranking mode
  ranking?: PetRanking;
  
  // Display options
  variant?: 'compact' | 'detailed' | 'card' | 'ranking';
  showBreakdown?: boolean;
  showTrend?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  
  // Styling
  accentColor?: string;
  backgroundColor?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  score,
  totalPoints,
  positiveBehaviors = 0,
  negativeBehaviors = 0,
  ranking,
  variant = 'compact',
  showBreakdown = true,
  showTrend = false,
  animated = false,
  size = 'medium',
  accentColor,
  backgroundColor,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Extract values from score or ranking if provided
  const points = totalPoints ?? score?.totalPoints ?? ranking?.totalPoints ?? 0;
  const positiveCount = positiveBehaviors || score?.positiveBehaviors || ranking?.positiveBehaviors || 0;
  const negativeCount = negativeBehaviors || score?.negativeBehaviors || ranking?.negativeBehaviors || 0;
  const rank = ranking?.rank;
  const isTied = ranking?.isTied ?? false;

  // Color determination
  const getPointsColor = () => {
    if (accentColor) return accentColor;
    if (points > 0) return theme.colors.success;
    if (points < 0) return theme.colors.error;
    return theme.colors.text.secondary;
  };

  const getRankColor = () => {
    if (!rank) return theme.colors.text.secondary;
    if (rank === 1) return theme.colors.warning; // Gold for first place
    if (rank <= 3) return theme.colors.info;     // Blue for top 3
    return theme.colors.text.secondary;
  };

  // Size-based styling
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          pointsText: { fontSize: 18, fontWeight: '600' as const },
          labelText: { fontSize: 12 },
          breakdownText: { fontSize: 11 },
          spacing: theme.spacing.xs,
          padding: theme.spacing.sm,
        };
      case 'large':
        return {
          pointsText: { fontSize: 32, fontWeight: '700' as const },
          labelText: { fontSize: 16 },
          breakdownText: { fontSize: 14 },
          spacing: theme.spacing.md,
          padding: theme.spacing.lg,
        };
      default: // medium
        return {
          pointsText: { fontSize: 24, fontWeight: '600' as const },
          labelText: { fontSize: 14 },
          breakdownText: { fontSize: 12 },
          spacing: theme.spacing.sm,
          padding: theme.spacing.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Render variants
  const renderCompact = () => (
    <View style={[
      styles.container,
      styles.compactContainer,
      {
        backgroundColor: backgroundColor || theme.colors.background.secondary,
        padding: sizeStyles.padding,
      }
    ]}>
      <Text style={[
        styles.pointsText,
        sizeStyles.pointsText,
        { color: getPointsColor() }
      ]}>
        {points > 0 ? '+' : ''}{points}
      </Text>
      <Text style={[
        styles.labelText,
        sizeStyles.labelText,
        { color: theme.colors.text.secondary }
      ]}>
        {t('behavior.points')}
      </Text>
    </View>
  );

  const renderDetailed = () => (
    <View style={[
      styles.container,
      styles.detailedContainer,
      {
        backgroundColor: backgroundColor || theme.colors.background.secondary,
        padding: sizeStyles.padding,
      }
    ]}>
      <View style={styles.mainPoints}>
        <Text style={[
          styles.pointsText,
          sizeStyles.pointsText,
          { color: getPointsColor() }
        ]}>
          {points > 0 ? '+' : ''}{points}
        </Text>
        <Text style={[
          styles.labelText,
          sizeStyles.labelText,
          { color: theme.colors.text.secondary }
        ]}>
          {t('behavior.points')}
        </Text>
      </View>

      {showBreakdown && (positiveCount > 0 || negativeCount > 0) && (
        <View style={[styles.breakdown, { marginTop: sizeStyles.spacing }]}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={[
                styles.breakdownCount,
                sizeStyles.breakdownText,
                { color: theme.colors.success }
              ]}>
                {positiveCount}
              </Text>
              <Text style={[
                styles.breakdownLabel,
                sizeStyles.breakdownText,
                { color: theme.colors.text.secondary }
              ]}>
                {t('behavior.positive')}
              </Text>
            </View>
            
            <View style={[
              styles.separator,
              { backgroundColor: theme.colors.text.tertiary }
            ]} />
            
            <View style={styles.breakdownItem}>
              <Text style={[
                styles.breakdownCount,
                sizeStyles.breakdownText,
                { color: theme.colors.error }
              ]}>
                {negativeCount}
              </Text>
              <Text style={[
                styles.breakdownLabel,
                sizeStyles.breakdownText,
                { color: theme.colors.text.secondary }
              ]}>
                {t('behavior.negative')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderCard = () => (
    <View style={[
      styles.container,
      styles.cardContainer,
      {
        backgroundColor: backgroundColor || theme.colors.background.secondary,
        padding: sizeStyles.padding,
      }
    ]}>
      <LinearGradient
        colors={[
          points > 0 ? theme.colors.success + '20' : theme.colors.error + '20',
          points > 0 ? theme.colors.success + '05' : theme.colors.error + '05',
        ]}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[
            styles.pointsText,
            sizeStyles.pointsText,
            { color: getPointsColor() }
          ]}>
            {points > 0 ? '+' : ''}{points}
          </Text>
          <Text style={[
            styles.labelText,
            sizeStyles.labelText,
            { color: theme.colors.text.secondary }
          ]}>
            {t('behavior.points')}
          </Text>
        </View>

        {showBreakdown && (positiveCount > 0 || negativeCount > 0) && (
          <View style={styles.cardBreakdown}>
            <View style={styles.breakdownBar}>
              <View
                style={[
                  styles.positiveBar,
                  {
                    flex: positiveCount,
                    backgroundColor: theme.colors.success,
                  }
                ]}
              />
              <View
                style={[
                  styles.negativeBar,
                  {
                    flex: negativeCount || 0.1, // Small flex to show even when 0
                    backgroundColor: negativeCount > 0 ? theme.colors.error : 'transparent',
                  }
                ]}
              />
            </View>
            
            <View style={styles.breakdownLabels}>
              <Text style={[
                styles.breakdownText,
                sizeStyles.breakdownText,
                { color: theme.colors.success }
              ]}>
                {positiveCount} {t('behavior.positive')}
              </Text>
              <Text style={[
                styles.breakdownText,
                sizeStyles.breakdownText,
                { color: theme.colors.error }
              ]}>
                {negativeCount} {t('behavior.negative')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderRanking = () => (
    <View style={[
      styles.container,
      styles.rankingContainer,
      {
        backgroundColor: backgroundColor || theme.colors.background.secondary,
        padding: sizeStyles.padding,
      }
    ]}>
      {rank && (
        <View style={[
          styles.rankBadge,
          {
            backgroundColor: getRankColor(),
          }
        ]}>
          <Text style={[
            styles.rankText,
            sizeStyles.labelText,
            { color: theme.colors.white }
          ]}>
            #{rank}{isTied ? '*' : ''}
          </Text>
        </View>
      )}

      <View style={styles.rankingContent}>
        <Text style={[
          styles.pointsText,
          sizeStyles.pointsText,
          { color: getPointsColor() }
        ]}>
          {points > 0 ? '+' : ''}{points}
        </Text>
        
        {showBreakdown && (
          <View style={styles.rankingBreakdown}>
            <Text style={[
              styles.breakdownText,
              sizeStyles.breakdownText,
              { color: theme.colors.text.secondary }
            ]}>
              {positiveCount}↑ {negativeCount}↓
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      borderRadius: 8,
      overflow: 'hidden',
    },
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    detailedContainer: {
      alignItems: 'center',
    },
    cardContainer: {
      position: 'relative',
      minHeight: 100,
    },
    rankingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cardContent: {
      flex: 1,
      zIndex: 1,
    },
    cardHeader: {
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    mainPoints: {
      alignItems: 'center',
    },
    pointsText: {
      textAlign: 'center',
    },
    labelText: {
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    breakdown: {
      width: '100%',
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    breakdownItem: {
      alignItems: 'center',
      flex: 1,
    },
    breakdownCount: {
      fontWeight: '600',
    },
    breakdownLabel: {
      marginTop: 2,
    },
    breakdownText: {
      textAlign: 'center',
    },
    separator: {
      width: 1,
      height: 20,
      marginHorizontal: theme.spacing.sm,
    },
    cardBreakdown: {
      marginTop: theme.spacing.sm,
    },
    breakdownBar: {
      flexDirection: 'row',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: theme.spacing.xs,
    },
    positiveBar: {
      minWidth: 4,
    },
    negativeBar: {
      minWidth: 4,
    },
    breakdownLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rankBadge: {
      borderRadius: 16,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.sm,
    },
    rankText: {
      fontWeight: '700',
    },
    rankingContent: {
      flex: 1,
      alignItems: 'center',
    },
    rankingBreakdown: {
      marginTop: theme.spacing.xs,
    },
  });

  // Render based on variant
  switch (variant) {
    case 'detailed':
      return renderDetailed();
    case 'card':
      return renderCard();
    case 'ranking':
      return renderRanking();
    default:
      return renderCompact();
  }
};

export default PointsDisplay;
