import attendanceReducer, {
  fetchShifts,
  createShift,
  deleteShift,
} from '../../../src/store/slices/attendanceSlice';

describe('attendanceSlice Reducer', () => {
  it('should initialize with default state', () => {
    const state = attendanceReducer(undefined, { type: 'unknown' });
    expect(state).toHaveProperty('shifts');
    expect(state).toHaveProperty('rosters');
    expect(state).toHaveProperty('attendance');
    expect(Array.isArray(state.shifts)).toBe(true);
  });

  it('should handle fetchShifts.fulfilled', () => {
    const initialState = {
      shifts: [],
      totalShifts: 0,
      loading: true,
      error: null,
    };

    const payload = {
      data: [{ id: 's1', name: 'Morning Shift' }],
      pagination: { total: 1 },
    };

    const state = attendanceReducer(initialState, {
      type: fetchShifts.fulfilled.type,
      payload,
    });

    expect(state.shifts).toHaveLength(1);
    expect(state.shifts[0].name).toBe('Morning Shift');
    expect(state.totalShifts).toBe(1);
    expect(state.shiftsLoading).toBe(false);
  });

  it('should handle createShift.fulfilled', () => {
    const initialState = {
      shifts: [],
      totalShifts: 0,
    };

    const newShift = { id: 's2', name: 'Night Shift' };
    const state = attendanceReducer(initialState, {
      type: createShift.fulfilled.type,
      payload: newShift,
    });

    expect(state.shifts).toHaveLength(1);
    expect(state.shifts[0].name).toBe('Night Shift');
    expect(state.totalShifts).toBe(1);
  });
});
