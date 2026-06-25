import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrders, createOrder, updateOrderStatus } from '../services/orderService';
import { getApiError } from '../utils/helpers';

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await getOrders(params);
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const placeOrder = createAsyncThunk('orders/place', async (data, { rejectWithValue }) => {
  try {
    return await createOrder(data);
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const changeOrderStatus = createAsyncThunk(
  'orders/changeStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await updateOrderStatus(id, status);
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading: false,
    submitting: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state) => { state.loading = false; })
      .addCase(placeOrder.pending, (state) => { state.submitting = true; })
      .addCase(placeOrder.fulfilled, (state) => { state.submitting = false; })
      .addCase(placeOrder.rejected, (state) => { state.submitting = false; })
      .addCase(changeOrderStatus.pending, (state) => { state.submitting = true; })
      .addCase(changeOrderStatus.fulfilled, (state) => { state.submitting = false; })
      .addCase(changeOrderStatus.rejected, (state) => { state.submitting = false; });
  },
});

export const selectOrders = (state) => state.orders.items;
export const selectOrdersPagination = (state) => state.orders.pagination;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersSubmitting = (state) => state.orders.submitting;

export default ordersSlice.reducer;
