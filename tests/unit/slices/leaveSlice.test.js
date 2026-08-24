import leaveReducer, {
  fetchLeaves,
  createLeave,
} from '../../../src/store/slices/leaveSlice';

describe('leaveSlice Reducer', () => {
  it('should initialize with correct default state', () => {
    const state = leaveReducer(undefined, { type: 'unknown' });
    expect(state).toHaveProperty('leaves');
    expect(state).toHaveProperty('holidays');
    expect(state).toHaveProperty('leaveMasters');
    expect(Array.isArray(state.leaves)).toBe(true);
  });

  it('should handle fetchLeaves.fulfilled', () => {
    const initialState = {
      leaves: [],
      totalLeaves: 0,
      loading: true,
      error: null,
    };

    const payload = {
      data: [{ id: 'l1', leaveType: 'CASUAL', status: 'PENDING' }],
      pagination: { total: 1 },
    };

    const state = leaveReducer(initialState, {
      type: fetchLeaves.fulfilled.type,
      payload,
    });

    expect(state.leaves).toHaveLength(1);
    expect(state.leaves[0].leaveType).toBe('CASUAL');
    expect(state.totalLeaves).toBe(1);
    expect(state.loading).toBe(false);
  });
});
