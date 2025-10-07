import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  activeChat: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  activeChat: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
  },
});

export const { setActiveChat, addMessage, setMessages } = chatSlice.actions;
export default chatSlice.reducer;