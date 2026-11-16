import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  PackageX,
  History,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { stockApi } from '../../api/stockApi';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await dashboardApi.getSummary();
      return res.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      return await stockApi.adjustStock(productId, data);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Stock successfully adjusted!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      setSelectedProductForAdjust(null);
      setAdjustQty('');
      setAdjustReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    },
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid non-negative number');
      return;
    }

    adjustMutation.mutate({
      productId: selectedProductForAdjust.id,
      data: {
        type: adjustType,
        quantity: qty,
        reason: adjustReason || null,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium tracking-wide">
            Loading real-time workspace metrics...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-white border border-rose-200/80 p-8 rounded-2xl max-w-lg mx-auto text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Failed to load dashboard metrics</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {error?.message || 'Unable to establish database connection.'}
          </p>
          <div className="mt-5">
            <Button variant="danger" size="sm" onClick={() => refetch()}>
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, lowStockItems, recentActivities } = dashboardData || {
    metrics: {
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalInventoryValue: 0,
      totalStockQuantity: 0,
      defaultThreshold: 10,
    },
    lowStockItems: [],
    recentActivities: [],
  };

  // Calculate inventory distribution percentages
  const total = metrics.totalProducts || 1;
  const outOfStockPct = Math.round((metrics.outOfStockCount / total) * 100);
  const lowStockPct = Math.round((metrics.lowStockCount / total) * 100);
  const healthyPct = Math.max(0, 100 - outOfStockPct - lowStockPct);

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory metrics, valuation, stock alerts, and audit activities.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            icon={RefreshCw}
          >
            Refresh Data
          </Button>
          <Link to="/products">
            <Button variant="primary" size="sm" icon={Plus}>
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={metrics.totalProducts}
          subtitle="Catalog active SKUs"
          icon={Boxes}
          variant="indigo"
        />
        <StatCard
          title="Inventory Valuation"
          value={`$${Number(metrics.totalInventoryValue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`${metrics.totalStockQuantity} units on hand`}
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics.lowStockCount}
          subtitle={`Threshold: ≤ ${metrics.defaultThreshold} units`}
          icon={AlertTriangle}
          variant={metrics.lowStockCount > 0 ? 'amber' : 'default'}
        />
        <StatCard
          title="Out of Stock"
          value={metrics.outOfStockCount}
          subtitle="Zero units on shelf"
          icon={PackageX}
          variant={metrics.outOfStockCount > 0 ? 'rose' : 'default'}
        />
      </div>

      {/* Low Stock Urgent Action Card (if any) */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required: {metrics.lowStockCount} item{metrics.lowStockCount > 1 ? 's are' : ' is'} below minimum threshold
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Restock these products or issue purchase orders to prevent fulfillment delays.
              </p>
            </div>
          </div>
          <Link to="/products?filter=low_stock">
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white border-none shrink-0"
            >
              View Low Stock Items
            </Button>
          </Link>
        </div>
      )}

      {/* Visual Inventory Health Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Inventory Health Distribution</h3>
          </div>
          <span className="text-xs text-slate-400">
            {metrics.totalProducts} Total Registered Products
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${healthyPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Healthy Stock: ${healthyPct}%`}
          />
          <div
            style={{ width: `${lowStockPct}%` }}
            className="bg-amber-500 h-full transition-all duration-500"
            title={`Low Stock: ${lowStockPct}%`}
          />
          <div
            style={{ width: `${outOfStockPct}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`Out of Stock: ${outOfStockPct}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-1 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600">Healthy Stock:</span>
            <span className="font-bold text-slate-900">
              {metrics.totalProducts - metrics.lowStockCount} items ({healthyPct}%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-600">Low Stock Alert:</span>
            <span className="font-bold text-slate-900">
              {metrics.lowStockCount} items ({lowStockPct}%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-600">Out of Stock:</span>
            <span className="font-bold text-slate-900">
              {metrics.outOfStockCount} items ({outOfStockPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Watchlist & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Low Stock Items Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Low Stock Watchlist</h3>
              </div>
              <Link
                to="/products?filter=low_stock"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All ({metrics.lowStockCount})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-800">All stock levels are optimal</p>
                  <p className="text-xs text-slate-400 mt-0.5">No products currently breach the low-stock threshold.</p>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        SKU: {item.sku} {item.category && `• ${item.category}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-600">
                          {item.quantity} in stock
                        </span>
                        <p className="text-[11px] text-slate-400">Min: {item.effective_threshold}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProductForAdjust(item);
                          setAdjustType('in');
                          setAdjustQty('');
                        }}
                      >
                        + Restock
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Stock Movement Activities */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Audit Activities</h3>
              </div>
              <Link
                to="/stock-movements"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">No recent movement records</p>
                  <p className="text-xs text-slate-400 mt-0.5">Stock adjustments and PO receipts will show here.</p>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((log) => {
                  const isPositive = log.quantity_change > 0;
                  return (
                    <div
                      key={log.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {log.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {log.reason ? `"${log.reason}"` : `Type: ${log.type}`} • By {log.user?.name || 'User'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={!!selectedProductForAdjust}
        onClose={() => setSelectedProductForAdjust(null)}
        title={`Quick Restock: ${selectedProductForAdjust?.name}`}
        subtitle={`SKU: ${selectedProductForAdjust?.sku} • Current Stock: ${selectedProductForAdjust?.quantity} units`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setAdjustType('in')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adjustType === 'in'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Stock In (Add)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('out')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adjustType === 'out'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Stock Out (Remove)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('adjustment')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adjustType === 'adjustment'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Set Exact Count
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
            label="Adjustment Reason (Audit Log)"
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Supplier intake, warehouse reconciliation, customer order"
          />

          {adjustQty !== '' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 flex justify-between items-center font-medium">
              <span>Updated Stock Level:</span>
              <span className="font-bold text-slate-900 text-sm">
                {adjustType === 'in'
                  ? (selectedProductForAdjust?.quantity || 0) + (parseInt(adjustQty, 10) || 0)
                  : adjustType === 'out'
                  ? Math.max(0, (selectedProductForAdjust?.quantity || 0) - (parseInt(adjustQty, 10) || 0))
                  : parseInt(adjustQty, 10) || 0}{' '}
                units
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedProductForAdjust(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={adjustMutation.isPending}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
