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
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading workspace metrics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl max-w-lg mx-auto text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg">Failed to load dashboard</h3>
          <p className="text-sm mt-1">{error?.message || 'An unexpected error occurred.'}</p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => refetch()}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const { metrics, lowStockItems, recentActivities } = dashboardData || {
    metrics: { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalInventoryValue: 0, totalStockQuantity: 0 },
    lowStockItems: [],
    recentActivities: [],
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time metrics, valuation, and stock alerts across your business.
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
          <Link to="/products">
            <Button variant="primary" size="sm" icon={Plus}>
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={metrics.totalProducts}
          subtitle="Catalog active items"
          icon={Boxes}
          variant="default"
        />
        <StatCard
          title="Inventory Valuation"
          value={`$${Number(metrics.totalInventoryValue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`${metrics.totalStockQuantity} total units on hand`}
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics.lowStockCount}
          subtitle={`Threshold: ≤ ${metrics.defaultThreshold} units default`}
          icon={AlertTriangle}
          variant={metrics.lowStockCount > 0 ? 'amber' : 'default'}
        />
        <StatCard
          title="Out of Stock"
          value={metrics.outOfStockCount}
          subtitle="Zero inventory remaining"
          icon={PackageX}
          variant={metrics.outOfStockCount > 0 ? 'rose' : 'default'}
        />
      </div>

      {/* Low Stock Urgent Warning Banner (If Any) */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required: {metrics.lowStockCount} item{metrics.lowStockCount > 1 ? 's are' : ' is'} below minimum threshold!
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Restock these items to prevent fulfillment delays and stockouts.
              </p>
            </div>
          </div>
          <Link to="/products?filter=low_stock">
            <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 border-none shrink-0">
              View Low Stock Products
            </Button>
          </Link>
        </div>
      )}

      {/* Two Column Layout: Urgent Low Stock & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Low Stock Items */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Low Stock Watchlist</h3>
            </div>
            <Link to="/products?filter=low_stock" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All ({metrics.lowStockCount})
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                All product stock levels are healthy!
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      SKU: {item.sku} {item.category && `• ${item.category}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-rose-600">{item.quantity} in stock</span>
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

        {/* Recent Stock Movement Activities */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Stock Movements</h3>
            </div>
            <Link to="/stock-movements" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All Movements →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No stock movement activity recorded yet.
              </div>
            ) : (
              recentActivities.map((log) => {
                const isPositive = log.quantity_change > 0;
                return (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
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

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={!!selectedProductForAdjust}
        onClose={() => setSelectedProductForAdjust(null)}
        title={`Adjust Stock: ${selectedProductForAdjust?.name}`}
        subtitle={`SKU: ${selectedProductForAdjust?.sku} • Current Quantity: ${selectedProductForAdjust?.quantity}`}
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
            label="Adjustment Reason (Audit Log)"
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Supplier delivery, damage, sale, physical recount"
          />

          {adjustQty !== '' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center font-medium">
              <span>Projected New Stock:</span>
              <span className="font-bold text-slate-900 text-sm">
                {adjustType === 'in'
                  ? selectedProductForAdjust.quantity + (parseInt(adjustQty, 10) || 0)
                  : adjustType === 'out'
                  ? Math.max(0, selectedProductForAdjust.quantity - (parseInt(adjustQty, 10) || 0))
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
              onClick={() => setSelectedProductForAdjust(null)}
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
    </div>
  );
}

