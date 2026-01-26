import { create } from 'zustand';
import { getChatMessages, saveChatMessages, clearChatMessages } from '@/lib/storage';
import type { UIMessage } from 'ai';

// ============================================
// Types
// ============================================

interface ChatState {
  /** Chat messages */
  messages: UIMessage[];
  /** Loading state */
  isLoading: boolean;
}

interface ChatActions {
  /** Load messages from storage */
  load: () => void;
  /** Add a single message */
  addMessage: (message: UIMessage) => void;
  /** Set all messages (for syncing with useChat) */
  setMessages: (messages: UIMessage[]) => void;
  /** Clear all messages */
  clearMessages: () => void;
}

type ChatStore = ChatState & ChatActions;

// ============================================
// Store
// ============================================

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,

  // Actions
  load: () => {
    set({ isLoading: true });

    const savedMessages = getChatMessages();
    const messages = savedMessages ?? [];

    set({ messages, isLoading: false });
  },

  addMessage: (message) => {
    const { messages } = get();
    const newMessages = [...messages, message];

    // Persist to MMKV
    saveChatMessages(newMessages);
    set({ messages: newMessages });
  },

  setMessages: (messages) => {
    // Persist to MMKV
    saveChatMessages(messages);
    set({ messages });
  },

  clearMessages: () => {
    // Clear from MMKV
    clearChatMessages();
    set({ messages: [] });
  },
}));
