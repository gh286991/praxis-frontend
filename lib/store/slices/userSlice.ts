import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
