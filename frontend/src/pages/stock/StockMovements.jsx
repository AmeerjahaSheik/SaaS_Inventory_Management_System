import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  FileText,
  User,
  Package,
  Layers,
  Info,
  Clock,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockMovementApi } from '../../api/stockMovementApi';
import { productsApi } from '../../api/productsApi';
import { stockMovementFormSchema } from '../../schemas/stockMovementSchemas';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function StockMovements() {
  const queryClient = useQueryClient();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedMovementForDetail, setSelectedMovementForDetail] = useState(null);

  // Form for New Movement
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      productId: '',
      movementType: 'IN',
      quantity: '',
      reason: '',
      referenceNumber: '',
    },
  });

  const watchedProductId = watch('productId');
  const watchedType = watch('movementType');
  const watchedQty = watch('quantity');

  // Fetch Products for the product selector dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products-for-selector'],
    queryFn: async () => {
      const res = await productsApi.getProducts({ limit: 100 });
      return res.data?.products || [];
    },
  });

  const productsList = productsData || [];
  const activeProductObj = productsList.find((p) => p.id === watchedProductId);

  // Fetch Stock Movements Query
  const {
    data: movementsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'stock-movements',
      {
        productId: selectedProductId,
        movementType: selectedType,
        startDate,
        endDate,
        search: searchTerm,
        page: currentPage,
      },
    ],
    queryFn: async () => {
      const res = await stockMovementApi.getMovements({
        productId: selectedProductId,
        movementType: selectedType,
        startDate,
        endDate,
        search: searchTerm,
        page: currentPage,
        limit: 15,
      });
      return res.data;
    },
  });

  // Record Movement Mutation
  const recordMutation = useMutation({
    mutationFn: async (formData) => {
      return await stockMovementApi.createMovement(formData);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Stock movement recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-for-selector'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsRecordModalOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record stock movement.');
    },
  });

  const onRecordSubmit = (data) => {
    recordMutation.mutate(data);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedProductId('');
    setSelectedType('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || selectedProductId || selectedType !== 'ALL' || startDate || endDate;

  const movements = movementsResponse?.movements || [];
  const pagination = movementsResponse?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Calculate live preview stock
  let projectedStock = null;
  if (activeProductObj && watchedQty !== '' && !isNaN(parseInt(watchedQty, 10))) {
    const qtyVal = parseInt(watchedQty, 10);
    if (watchedType === 'IN') {
      projectedStock = activeProductObj.quantity + qtyVal;
    } else if (watchedType === 'OUT') {
      projectedStock = activeProductObj.quantity - qtyVal;
    } else if (watchedType === 'ADJUSTMENT') {
      projectedStock = qtyVal;
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Movements</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit trail of all inventory receipts, dispatches, and stock adjustments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              reset({
                productId: productsList[0]?.id || '',
                movementType: 'IN',
                quantity: '',
                reason: '',
                referenceNumber: '',
              });
              setIsRecordModalOpen(true);
            }}
          >
            Record Movement
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, product, reason, reference..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Product Filter Dropdown */}
          <div>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-700"
            >
              <option value="">All Products</option>
              {productsList.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Dropdown */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="IN">IN (Receipts)</option>
              <option value="OUT">OUT (Dispatches)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Recounts)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                icon={RotateCcw}
                className="w-full text-slate-500 hover:text-slate-800"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Date Range:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Movements Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <Spinner size="lg" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading stock movements...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600">
            <p className="font-semibold">{error?.message || 'Error loading stock movements.'}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ArrowLeftRight}
              title={hasActiveFilters ? 'No movements match your filters' : 'No stock movements recorded'}
              description={
                hasActiveFilters
                  ? 'Try broadening your search term, product selection, or date range.'
                  : 'Start tracking inventory flows by recording an inward receipt, outward dispatch, or recount.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : 'Record First Movement'}
              onAction={
                hasActiveFilters
                  ? handleClearFilters
                  : () => {
                      reset();
                      setIsRecordModalOpen(true);
                    }
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Quantity Changed</th>
                  <th className="py-3.5 px-4">Stock Progression</th>
                  <th className="py-3.5 px-4">Reason / Reference</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {movements.map((m) => {
                  const isPositive = m.movement_type === 'IN';
                  const isNegative = m.movement_type === 'OUT';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedMovementForDetail(m)}
                    >
                      {/* Date / Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">
                          {new Date(m.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Product / SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {m.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {m.product?.sku}
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-4">
                        {m.movement_type === 'IN' ? (
                          <Badge variant="success" className="gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>IN</span>
                          </Badge>
                        ) : m.movement_type === 'OUT' ? (
                          <Badge variant="danger" className="gap-1">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>OUT</span>
                          </Badge>
                        ) : (
                          <Badge variant="info" className="gap-1">
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>ADJUSTMENT</span>
                          </Badge>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-sm ${
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : isNegative ? `-${m.quantity}` : `±${m.quantity}`}
                        </span>
                      </td>

                      {/* Stock Progression */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <span className="font-medium text-slate-500">{m.previous_quantity}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-extrabold text-slate-900">{m.new_quantity}</span>
                          <span className="text-[10px] text-slate-400">units</span>
                        </div>
                      </td>

                      {/* Reason / Reference */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {m.reason || <span className="italic text-slate-400">No reason specified</span>}
                        </div>
                        {m.reference_number && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Ref: {m.reference_number}
                          </span>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {m.creator?.name || 'Administrator'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovementForDetail(m);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
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
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total movements)
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

      {/* Record Stock Movement Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Stock Movement"
        subtitle="Log an inventory intake, dispatch, or physical recount"
      >
        <form onSubmit={handleSubmit(onRecordSubmit)} className="space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Product *
            </label>
            <select
              {...register('productId')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="">-- Choose a Product --</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — {p.quantity} currently in stock
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.productId.message}</p>
            )}
          </div>

          {/* Current Stock Banner */}
          {activeProductObj && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Current Stock Level:</span>
                <span className="font-extrabold text-slate-900 ml-1.5 text-sm">
                  {activeProductObj.quantity} units
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">SKU: {activeProductObj.sku}</span>
            </div>
          )}

          {/* Movement Type Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Movement Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue('movementType', 'IN')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  watchedType === 'IN'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>IN (Add)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('movementType', 'OUT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  watchedType === 'OUT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>OUT (Remove)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('movementType', 'ADJUSTMENT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  watchedType === 'ADJUSTMENT'
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>SET EXACT</span>
              </button>
            </div>
            {errors.movementType && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.movementType.message}</p>
            )}
          </div>

          {/* Quantity Input */}
          <Input
            label={watchedType === 'ADJUSTMENT' ? 'New Exact Stock Level *' : 'Quantity Units *'}
            type="number"
            min="0"
            placeholder={watchedType === 'ADJUSTMENT' ? 'e.g. 50' : 'e.g. 10'}
            error={errors.quantity?.message}
            {...register('quantity')}
          />

          {/* Projected Stock Preview */}
          {projectedStock !== null && (
            <div
              className={`p-3 rounded-xl border text-xs flex justify-between items-center font-medium ${
                projectedStock < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>Projected Balance After Movement:</span>
              <span className="font-extrabold text-sm">
                {projectedStock < 0 ? 'Negative Stock (Not Allowed!)' : `${projectedStock} units`}
              </span>
            </div>
          )}

          {/* Reference Number & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reference # (Optional)"
              placeholder="e.g. PO-8492, INV-001"
              error={errors.referenceNumber?.message}
              {...register('referenceNumber')}
            />

            <Input
              label="Reason / Notes"
              placeholder="e.g. Supplier intake, damaged goods"
              error={errors.reason?.message}
              {...register('reason')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={recordMutation.isPending}
            >
              Confirm & Save Movement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Movement Detail View Modal */}
      <Modal
        isOpen={!!selectedMovementForDetail}
        onClose={() => setSelectedMovementForDetail(null)}
        title="Movement Audit Record"
        subtitle={`ID: ${selectedMovementForDetail?.id}`}
      >
        {selectedMovementForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Product
                </span>
                <span className="font-mono text-slate-500">
                  {selectedMovementForDetail.product?.sku}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {selectedMovementForDetail.product?.name}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400">Previous</p>
                <p className="text-base font-extrabold text-slate-700 mt-1">
                  {selectedMovementForDetail.previous_quantity}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400">Change</p>
                <p
                  className={`text-base font-extrabold mt-1 ${
                    selectedMovementForDetail.movement_type === 'IN'
                      ? 'text-emerald-600'
                      : selectedMovementForDetail.movement_type === 'OUT'
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {selectedMovementForDetail.movement_type === 'IN'
                    ? `+${selectedMovementForDetail.quantity}`
                    : selectedMovementForDetail.movement_type === 'OUT'
                    ? `-${selectedMovementForDetail.quantity}`
                    : `±${selectedMovementForDetail.quantity}`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400">New Balance</p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {selectedMovementForDetail.new_quantity}
                </p>
              </div>
            </div>

            {/* Details List */}
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-medium">Movement Type:</span>
                <span className="font-bold text-slate-800">
                  {selectedMovementForDetail.movement_type}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-medium">Reference Number:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedMovementForDetail.reference_number || 'N/A'}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-medium">Reason / Description:</span>
                <span className="font-semibold text-slate-800">
                  {selectedMovementForDetail.reason || 'None'}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-medium">Recorded Timestamp:</span>
                <span className="text-slate-700">
                  {new Date(selectedMovementForDetail.created_at).toLocaleString()}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-medium">Operator / User:</span>
                <span className="font-bold text-slate-800">
                  {selectedMovementForDetail.creator?.name || 'Administrator'} (
                  {selectedMovementForDetail.creator?.email || 'System'})
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMovementForDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

