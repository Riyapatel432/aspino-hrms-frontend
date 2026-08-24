import authReducer, { setCredentials, logout, initializeAuthFromCookies } from '../../../src/store/slices/authSlice';

describe('authSlice Reducer', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
  };

  it('should return initial state by default', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCredentials', () => {
    const user = { id: 'u1', name: 'HR Admin', role: 'admin' };
    const state = authReducer(initialState, setCredentials({ user }));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { id: 'u1', name: 'HR Admin', role: 'admin' },
      isAuthenticated: true,
    };
    const state = authReducer(loggedInState, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
