import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { getApiError } from '../utils/helpers';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await getProducts(params);
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const addProduct = createAsyncThunk('products/add', async (data, { rejectWithValue }) => {
  try {
    return await createProduct(data);
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const editProduct = createAsyncThunk('products/edit', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updateProduct(id, data);
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const removeProduct = createAsyncThunk('products/remove', async (id, { rejectWithValue }) => {
  try {
    await deleteProduct(id);
    return id;
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading: false,
    submitting: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state) => { state.loading = false; })
      .addCase(addProduct.pending, (state) => { state.submitting = true; })
      .addCase(addProduct.fulfilled, (state) => { state.submitting = false; })
      .addCase(addProduct.rejected, (state) => { state.submitting = false; })
      .addCase(editProduct.pending, (state) => { state.submitting = true; })
      .addCase(editProduct.fulfilled, (state) => { state.submitting = false; })
      .addCase(editProduct.rejected, (state) => { state.submitting = false; })
      .addCase(removeProduct.pending, (state) => { state.submitting = true; })
      .addCase(removeProduct.fulfilled, (state) => { state.submitting = false; })
      .addCase(removeProduct.rejected, (state) => { state.submitting = false; });
  },
});

export const selectProducts = (state) => state.products.items;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsSubmitting = (state) => state.products.submitting;

export default productsSlice.reducer;
