import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  TrendingUp,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../api/productsApi';
import { stockApi } from '../../api/stockApi';
import { productSchema } from '../../schemas/productSchemas';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function ProductList() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [isLowStockOnly, setIsLowStockOnly] = useState(searchParams.get('filter') === 'low_stock');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Stock Adjustment State
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Fetch Products Query
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['products', { search: searchTerm, category: selectedCategory, isLowStock: isLowStockOnly, page: currentPage }],
    queryFn: async () => {
      const res = await productsApi.getProducts({
        search: searchTerm,
        category: selectedCategory,
        is_low_stock: isLowStockOnly,
        page: currentPage,
        limit: 15,
      });
      return res.data;
    },
  });

  // Fetch Categories Query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      return res.data;
    },
  });

  // Fetch Product Stock Logs (when history modal open)
  const { data: stockLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['stock-logs', historyProduct?.id],
    queryFn: async () => {
      if (!historyProduct?.id) return [];
      const res = await stockApi.getStockLogs(historyProduct.id);
      return res.data;
    },
    enabled: !!historyProduct,
  });

  // React Hook Form for Create / Edit Product
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category: '',
      price: '',
      cost_price: '',
      quantity: 0,
      low_stock_threshold: '',
    },
  });

  // Sync with URL search params (e.g. from dashboard banner link)
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'low_stock') {
      setIsLowStockOnly(true);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Populate form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        sku: editingProduct.sku,
        description: editingProduct.description || '',
        category: editingProduct.category || '',
        price: editingProduct.price,
        cost_price: editingProduct.cost_price || '',
        quantity: editingProduct.quantity,
        low_stock_threshold: editingProduct.low_stock_threshold !== null ? editingProduct.low_stock_threshold : '',
      });
    } else {
      reset({
        name: '',
        sku: '',
        description: '',
        category: '',
        price: '',
        cost_price: '',
        quantity: 0,
        low_stock_threshold: '',
      });
    }
  }, [editingProduct, reset]);

  // Create / Update Product Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingProduct) {
        return await productsApi.updateProduct(editingProduct.id, formData);
      }
      return await productsApi.createProduct(formData);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Product saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    },
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      return await productsApi.deleteProduct(productId);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Product deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setDeletingProduct(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    },
  });

  // Stock Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      return await stockApi.adjustStock(productId, data);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Stock successfully adjusted.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setAdjustingProduct(null);
      setAdjustQty('');
      setAdjustReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to adjust stock.');
    },
  });

  const onProductSubmit = (data) => {
    saveProductMutation.mutate(data);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid non-negative integer.');
      return;
    }

    adjustMutation.mutate({
      productId: adjustingProduct.id,
      data: {
        type: adjustType,
        quantity: qty,
        reason: adjustReason || null,
      },
    });
  };

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || { total: 0, page: 1, totalPages: 1 };
  const defaultThreshold = productsData?.defaultThreshold || 10;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products & Stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your catalog, monitor inventory levels, and adjust stock.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
        >
          Add Product
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle Pill */}
        <button
          onClick={() => {
            setIsLowStockOnly(!isLowStockOnly);
            setCurrentPage(1);
          }}
          className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            isLowStockOnly
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <Spinner size="lg" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading inventory...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{error?.message || 'Error loading products.'}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Boxes}
              title={
                searchTerm || selectedCategory || isLowStockOnly
                  ? 'No matching products found'
                  : 'No products in inventory'
              }
              description={
                searchTerm || selectedCategory || isLowStockOnly
                  ? 'Try clearing filters or search terms to see more inventory.'
                  : 'Get started by adding your first product to this organization.'
              }
              actionLabel={
                searchTerm || selectedCategory || isLowStockOnly
                  ? 'Clear Filters'
                  : 'Add Your First Product'
              }
              onAction={() => {
                if (searchTerm || selectedCategory || isLowStockOnly) {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setIsLowStockOnly(false);
                } else {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price / Valuation</th>
                  <th className="py-3.5 px-4">Stock Level</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((product) => {
                  const effectiveThreshold =
                    product.low_stock_threshold !== null
                      ? product.low_stock_threshold
                      : defaultThreshold;
                  const isOutOfStock = product.quantity === 0;
                  const isLow = product.quantity <= effectiveThreshold;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {product.sku}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {product.category ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Uncategorized</span>
                        )}
                      </td>

                      {/* Price & Valuation */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          ${Number(product.price).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Value: ${(Number(product.price) * product.quantity).toFixed(2)}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 text-base">
                          {product.quantity}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">
                          (Min: {effectiveThreshold})
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            title="Adjust Stock"
                            onClick={() => {
                              setAdjustingProduct(product);
                              setAdjustType('in');
                              setAdjustQty('');
                              setAdjustReason('');
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            title="Stock Movement Logs"
                            onClick={() => setHistoryProduct(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Product"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Product"
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle={
          editingProduct
            ? `Update properties for SKU: ${editingProduct.sku}`
            : 'Add a new item to your organization inventory'
        }
      >
        <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-4">
          <Input
            label="Product Name *"
            placeholder="e.g. Wireless Ergonomic Mouse"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU (Stock Keeping Unit) *"
              placeholder="e.g. MOU-WIR-001"
              error={errors.sku?.message}
              {...register('sku')}
            />
            <Input
              label="Category"
              placeholder="e.g. Electronics, Office Supplies"
              error={errors.category?.message}
              {...register('category')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Selling Price ($) *"
              type="number"
              step="0.01"
              placeholder="49.99"
              error={errors.price?.message}
              {...register('price')}
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              placeholder="25.00"
              error={errors.cost_price?.message}
              {...register('cost_price')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Initial Quantity *"
              type="number"
              min="0"
              disabled={!!editingProduct}
              helperText={editingProduct ? 'Use Stock Adjustment to update existing stock' : undefined}
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              placeholder={`Org default (${defaultThreshold})`}
              helperText="Alert triggered when stock falls at or below this value"
              error={errors.low_stock_threshold?.message}
              {...register('low_stock_threshold')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief details or specifications..."
              className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveProductMutation.isPending}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Adjust Stock: ${adjustingProduct?.name}`}
        subtitle={`SKU: ${adjustingProduct?.sku} • Current Stock: ${adjustingProduct?.quantity}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAdjustType('in')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                adjustType === 'in' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Stock In (Add)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('out')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                adjustType === 'out' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Stock Out (Remove)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('adjustment')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                adjustType === 'adjustment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Set Exact
            </button>
          </div>

          <Input
            label={adjustType === 'adjustment' ? 'Exact New Quantity' : 'Units to Adjust'}
            type="number"
            min="0"
            required
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
            placeholder="e.g. 50"
          />

          <Input
            label="Adjustment Reason (Logged for Audit)"
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Physical inventory count, damaged goods, customer return"
          />

          {adjustQty !== '' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center font-medium">
              <span>Projected New Stock:</span>
              <span className="font-bold text-slate-900 text-sm">
                {adjustType === 'in'
                  ? adjustingProduct.quantity + (parseInt(adjustQty, 10) || 0)
                  : adjustType === 'out'
                  ? Math.max(0, adjustingProduct.quantity - (parseInt(adjustQty, 10) || 0))
                  : parseInt(adjustQty, 10) || 0}{' '}
                units
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAdjustingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={adjustMutation.isPending}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock History Audit Logs Modal */}
      <Modal
        isOpen={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        title={`Audit Trail: ${historyProduct?.name}`}
        subtitle={`Historical stock adjustments for SKU: ${historyProduct?.sku}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {isLoadingLogs ? (
            <div className="py-12 text-center">
              <Spinner size="md" />
              <p className="mt-2 text-xs text-slate-500">Loading audit records...</p>
            </div>
          ) : stockLogs.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              No stock movements have been recorded yet for this item.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {stockLogs.map((log) => {
                const isPositive = log.quantity_change > 0;
                return (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {log.reason ? `"${log.reason}"` : `Stock ${log.type}`}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Recorded by {log.user?.name || 'User'} on{' '}
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {log.previous_quantity} → {log.new_quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setHistoryProduct(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Delete Product"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-900">{deletingProduct?.name}</span> (SKU:{' '}
            <span className="font-mono">{deletingProduct?.sku}</span>)? All associated stock
            logs will also be deleted.
          </p>

          <div className="flex justify-end space-x-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeletingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

