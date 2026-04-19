import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { useAssistantStore, ChatMessage } from '../stores/assistant.store';
import { spacing, radius } from '../theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

export function AssistantSheet() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  const { isOpen, close, messages, isLoading, error, sendMessage, clearHistory } =
    useAssistantStore();

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(0, { damping: 24, stiffness: 200, mass: 0.8 });
      backdropOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, { damping: 22, stiffness: 220, mass: 0.7 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleSuggestion = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'USER';
    return (
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.aiBubble, { backgroundColor: tc.cardBg, borderColor: tc.border }],
          ]}
        >
          {!isUser && (
            <View style={styles.aiLabel}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={[styles.aiLabelText, { color: colors.primary }]}>AI</Text>
            </View>
          )}
          <Text style={[styles.bubbleText, { color: isUser ? colors.white : tc.textPrimary }]}>
            {item.content}
          </Text>
        </View>

        {/* Suggestion chips — only on the last AI message */}
        {!isUser && item.suggestions && item.suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {item.suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.messageWrapper}>
      <View style={[styles.bubble, styles.aiBubble, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        <View style={styles.aiLabel}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={[styles.aiLabelText, { color: colors.primary }]}>AI</Text>
        </View>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
      </View>
    </View>
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 200 }]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom || spacing.lg, backgroundColor: tc.cardBg },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: tc.border }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={16} color={colors.white} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Sportify AI</Text>
              <Text style={[styles.headerSub, { color: tc.textHint }]}>Your sports assistant</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={clearHistory}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerAction}
            >
              <Ionicons name="trash-outline" size={18} color={tc.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={close}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerAction}
            >
              <Ionicons name="close" size={22} color={tc.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={20}
        >
          {messages.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="sparkles" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
                How can I help you?
              </Text>
              <Text style={[styles.emptyText, { color: tc.textHint }]}>
                Ask me to find venues, book a pitch,{'\n'}get fitness tips, or anything else.
              </Text>
              <View style={styles.quickStarters}>
                {['Find a football pitch', 'Book a court for today', 'What sports are nearby?'].map(
                  (s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.chip, { borderColor: tc.border, backgroundColor: tc.surface ?? tc.cardBg }]}
                      onPress={() => handleSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: tc.textSecondary }]}>{s}</Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={isLoading ? renderTypingIndicator : null}
            />
          )}

          {/* Error */}
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Input */}
          <View style={[styles.inputRow, { borderTopColor: tc.border, backgroundColor: tc.cardBg }]}>
            <TextInput
              style={[styles.input, { backgroundColor: tc.inputBg, color: tc.textPrimary }]}
              placeholder="Ask anything..."
              placeholderTextColor={tc.textHint}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    inputText.trim() && !isLoading ? colors.primary : tc.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerAction: {
    padding: 6,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: 8,
    gap: 12,
  },
  messageWrapper: {
    gap: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.card,
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  aiLabelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: 10,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickStarters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
