import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit,
  Eye,
  ShoppingBag,
  CheckCircle2,
  Clock,
  RotateCcw,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supplierApi } from '../../api/supplierApi';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { productsApi } from '../../api/productsApi';
import { supplierSchema } from '../../schemas/supplierSchemas';
import { purchaseOrderSchema } from '../../schemas/purchaseOrderSchemas';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import SupplierSelect from '../../components/common/SupplierSelect';

export default function Suppliers() {
  const queryClient = useQueryClient();

  // Active Tab: 'suppliers' or 'purchase-orders'
  const [activeTab, setActiveTab] = useState('suppliers');

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState('');

  // 1. Fetch Suppliers Query
  const {
    data: suppliersData,
    isLoading: isLoadingSuppliers,
    isFetching: isFetchingSuppliers,
  } = useQuery({
    queryKey: ['suppliers', { search: searchTerm, page: currentPage }],
    queryFn: async () => {
      const res = await supplierApi.getSuppliers({
        search: searchTerm,
        page: currentPage,
        limit: pageSize,
      });
      return res.data;
    },
  });

  const suppliers = suppliersData?.suppliers || [];
  const pagination = suppliersData?.pagination || { total: 0, totalPages: 1 };

  // 2. Fetch Purchase Orders Query
  const {
    data: poData,
    isLoading: isLoadingPOs,
  } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await purchaseOrderApi.getPurchaseOrders({ limit: 50 });
      return res.data?.purchaseOrders || [];
    },
  });

  const purchaseOrders = poData || [];

  // 3. Fetch Products for PO line items
  const { data: productsData } = useQuery({
    queryKey: ['products-for-po'],
    queryFn: async () => {
      const res = await productsApi.getProducts({ limit: 100 });
      return res.data?.products || [];
    },
  });

  const availableProducts = productsData || [];

  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: (data) => supplierApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list-all'] });
      toast.success('Supplier added successfully!');
      setIsAddModalOpen(false);
      resetSupplierForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add supplier.');
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => supplierApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list-all'] });
      toast.success('Supplier updated successfully!');
      setEditingSupplier(null);
      resetSupplierForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update supplier.');
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list-all'] });
      toast.success('Supplier deleted successfully.');
      setDeletingSupplier(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete supplier.');
    },
  });

  const createPoMutation = useMutation({
    mutationFn: (data) => purchaseOrderApi.createPurchaseOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(`Purchase order #${res.data?.po_number || ''} created!`);
      setIsPoModalOpen(false);
      resetPoForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create purchase order.');
    },
  });

  const receivePoMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.receivePurchaseOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.message || 'Purchase order received and inventory updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to receive purchase order.');
    },
  });

  // Supplier Form
  const {
    register: registerSupplier,
    handleSubmit: handleSupplierSubmit,
    reset: resetSupplierForm,
    formState: { errors: supplierErrors },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  // Purchase Order Form
  const {
    register: registerPo,
    control: poControl,
    handleSubmit: handlePoSubmit,
    reset: resetPoForm,
    setValue: setPoValue,
    watch: watchPo,
    formState: { errors: poErrors },
  } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      po_number: '',
      expected_delivery_date: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_cost: 0 }],
    },
  });

  const { fields: poItemFields, append: appendPoItem, remove: removePoItem } = useFieldArray({
    control: poControl,
    name: 'items',
  });

  const watchedItems = watchPo('items') || [];
  const poTotalAmount = watchedItems.reduce((acc, curr) => {
    const q = Number(curr.quantity) || 0;
    const c = Number(curr.unit_cost) || 0;
    return acc + q * c;
  }, 0);

  // Open Edit Modal
  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    resetSupplierForm({
      supplier_name: supplier.supplier_name,
      company_name: supplier.company_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
  };

  // Open Create PO Modal
  const openCreatePoModal = (supplierId = '') => {
    setPreselectedSupplierId(supplierId);
    resetPoForm({
      supplier_id: supplierId,
      po_number: '',
      expected_delivery_date: '',
      notes: '',
      items: [{ product_id: availableProducts[0]?.id || '', quantity: 10, unit_cost: Number(availableProducts[0]?.cost_price || 0) }],
    });
    setIsPoModalOpen(true);
  };

  const onSupplierSubmit = (data) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const onPoSubmit = (data) => {
    createPoMutation.mutate(data);
  };

  // Quick helper to fill cost price when product selected
  const handleProductSelect = (index, productId) => {
    setPoValue(`items.${index}.product_id`, productId);
    const prod = availableProducts.find((p) => p.id === productId);
    if (prod && prod.cost_price !== undefined && prod.cost_price !== null) {
      setPoValue(`items.${index}.unit_cost`, Number(prod.cost_price));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-indigo-600" />
            Supplier Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain authorized vendor contacts, track procurement details, and issue purchase orders.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => openCreatePoModal()}
            className="flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            Create Purchase Order
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetSupplierForm({
                supplier_name: '',
                company_name: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Suppliers"
          value={pagination.total}
          icon={Truck}
          color="indigo"
          subtitle="Authorized vendors"
        />
        <StatCard
          title="Active Companies"
          value={suppliers.filter((s) => s.company_name).length}
          icon={Building2}
          color="blue"
          subtitle="Verified corporate entities"
        />
        <StatCard
          title="Pending POs"
          value={purchaseOrders.filter((po) => po.status === 'ORDERED').length}
          icon={Clock}
          color="amber"
          subtitle="Awaiting warehouse intake"
        />
        <StatCard
          title="Fulfilled POs"
          value={purchaseOrders.filter((po) => po.status === 'RECEIVED').length}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Received & stocked"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Suppliers Directory</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            activeTab === 'suppliers' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {pagination.total}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('purchase-orders')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'purchase-orders'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Purchase Orders</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            activeTab === 'purchase-orders' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {purchaseOrders.length}
          </span>
        </button>
      </div>

      {activeTab === 'suppliers' ? (
        /* Suppliers Directory Tab */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by supplier name, company, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200/90 rounded-xl text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>
            {isFetchingSuppliers && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Spinner size="sm" />
                <span>Refreshing suppliers...</span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingSuppliers ? (
              <div className="p-12 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : suppliers.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No suppliers found"
                description={
                  searchTerm
                    ? `No suppliers matched your search "${searchTerm}".`
                    : 'Get started by creating your first vendor record.'
                }
                actionLabel="Add New Supplier"
                onAction={() => {
                  resetSupplierForm();
                  setIsAddModalOpen(true);
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Supplier</th>
                      <th className="py-3.5 px-4">Company</th>
                      <th className="py-3.5 px-4">Contact Information</th>
                      <th className="py-3.5 px-4">Address</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 flex items-center justify-center shrink-0 text-sm shadow-xs">
                              {s.supplier_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {s.supplier_name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {s.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {s.company_name ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {s.company_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">None specified</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {s.email ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${s.email}`}
                                  className="text-indigo-600 hover:text-indigo-700 hover:underline"
                                >
                                  {s.email}
                                </a>
                              </div>
                            ) : null}
                            {s.phone ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`tel:${s.phone}`}
                                  className="hover:text-slate-900"
                                >
                                  {s.phone}
                                </a>
                              </div>
                            ) : null}
                            {!s.email && !s.phone && (
                              <span className="text-slate-400 italic text-xs">No direct contact info</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-500">
                          {s.address ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate">{s.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No address saved</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openCreatePoModal(s.id)}
                              title="Create Purchase Order for this supplier"
                              className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewingSupplier(s)}
                              title="View Supplier Details"
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(s)}
                              title="Edit Supplier"
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingSupplier(s)}
                              title="Delete Supplier"
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} suppliers)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Purchase Orders Tab */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingPOs ? (
              <div className="p-12 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : purchaseOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No purchase orders issued"
                description="Create a purchase order by selecting a supplier and line items."
                actionLabel="Create First PO"
                onAction={() => openCreatePoModal()}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">PO Number</th>
                      <th className="py-3.5 px-4">Supplier</th>
                      <th className="py-3.5 px-4">Order Date</th>
                      <th className="py-3.5 px-4">Items / Products</th>
                      <th className="py-3.5 px-4">Total Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block shadow-2xs">
                            {po.po_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {po.supplier ? po.supplier.supplier_name : 'Unknown Vendor'}
                          </div>
                          {po.supplier?.company_name && (
                            <div className="text-xs text-slate-400">
                              {po.supplier.company_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {po.order_date}
                          </div>
                          {po.expected_delivery_date && (
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Expected: {po.expected_delivery_date}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs space-y-1">
                            {(po.items || []).map((it, idx) => (
                              <div key={idx} className="text-slate-700 flex items-center gap-1.5">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                                  {it.quantity}x
                                </span>{' '}
                                <span className="font-medium text-slate-800">
                                  {it.product ? it.product.name : 'Product'}
                                </span>{' '}
                                <span className="text-slate-400 text-[11px]">
                                  (@ ${Number(it.unit_cost).toFixed(2)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          ${Number(po.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          {po.status === 'RECEIVED' ? (
                            <Badge variant="success" dot>Received & Stocked</Badge>
                          ) : po.status === 'ORDERED' ? (
                            <Badge variant="warning" dot>Ordered / In Transit</Badge>
                          ) : (
                            <Badge variant="default">{po.status}</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {po.status === 'ORDERED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={receivePoMutation.isPending}
                              onClick={() => receivePoMutation.mutate(po.id)}
                              className="text-xs"
                            >
                              Receive Order
                            </Button>
                          )}
                          {po.status === 'RECEIVED' && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Fulfilled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT SUPPLIER MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddModalOpen || !!editingSupplier}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSupplier(null);
          resetSupplierForm();
        }}
        title={editingSupplier ? 'Edit Supplier Details' : 'Add New Authorized Supplier'}
        description="Save supplier credentials and communication channels for vendor procurement."
      >
        <form onSubmit={handleSupplierSubmit(onSupplierSubmit)} className="space-y-4">
          <Input
            label="Supplier Contact Name"
            placeholder="e.g. David Vance"
            required
            {...registerSupplier('supplier_name')}
            error={supplierErrors.supplier_name?.message}
          />

          <Input
            label="Company / Enterprise Name"
            placeholder="e.g. Apex Semiconductor & Silicon Ltd"
            {...registerSupplier('company_name')}
            error={supplierErrors.company_name?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. orders@apexsemicon.com"
              {...registerSupplier('email')}
              error={supplierErrors.email?.message}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +1 (555) 234-5678"
              {...registerSupplier('phone')}
              error={supplierErrors.phone?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Physical / Dispatch Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 420 Tech Way, Suite 300, San Jose, CA 95110"
              {...registerSupplier('address')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Internal Procurement Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Net-30 payment terms, contact for bulk discounts..."
              {...registerSupplier('notes')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSupplier(null);
                resetSupplierForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createSupplierMutation.isPending || updateSupplierMutation.isPending}
            >
              {editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* SUPPLIER DETAILS MODAL */}
      {/* ======================================================== */}
      {viewingSupplier && (
        <Modal
          isOpen={!!viewingSupplier}
          onClose={() => setViewingSupplier(null)}
          title={viewingSupplier.supplier_name}
          description="Detailed supplier profile and contact directory."
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {viewingSupplier.company_name || 'Independent Vendor'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {viewingSupplier.email ? (
                    <a href={`mailto:${viewingSupplier.email}`} className="text-indigo-600 hover:text-indigo-700 hover:underline">
                      {viewingSupplier.email}
                    </a>
                  ) : (
                    <span className="italic text-slate-400">No email</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {viewingSupplier.phone ? (
                    <a href={`tel:${viewingSupplier.phone}`} className="hover:text-slate-900">
                      {viewingSupplier.phone}
                    </a>
                  ) : (
                    <span className="italic text-slate-400">No phone</span>
                  )}
                </div>
              </div>

              {viewingSupplier.address && (
                <div className="flex items-start gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewingSupplier.address}</span>
                </div>
              )}
            </div>

            {viewingSupplier.notes && (
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Procurement Notes
                </span>
                <p className="p-3 bg-white border border-slate-200/80 rounded-xl text-slate-700 text-xs whitespace-pre-wrap shadow-xs">
                  {viewingSupplier.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const s = viewingSupplier;
                  setViewingSupplier(null);
                  openCreatePoModal(s.id);
                }}
                className="flex items-center gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                Create PO for {viewingSupplier.supplier_name}
              </Button>

              <Button
                variant="outline"
                onClick={() => setViewingSupplier(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingSupplier && (
        <Modal
          isOpen={!!deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          title="Delete Supplier Record"
          description="Are you sure you want to remove this vendor?"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 space-y-1">
                <p className="font-semibold">
                  Confirm deletion for &quot;{deletingSupplier.supplier_name}&quot;
                </p>
                <p>
                  This will permanently delete the supplier details. If any purchase orders are currently associated with this vendor, deletion will be safely rejected.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingSupplier(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleteSupplierMutation.isPending}
                onClick={() => deleteSupplierMutation.mutate(deletingSupplier.id)}
              >
                Delete Supplier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* CREATE PURCHASE ORDER MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => {
          setIsPoModalOpen(false);
          resetPoForm();
        }}
        title="Create Purchase Order"
        description="Select an authorized vendor and add catalog line items for replenishment."
      >
        <form onSubmit={handlePoSubmit(onPoSubmit)} className="space-y-4">
          {/* Supplier Selector */}
          <SupplierSelect
            label="Supplier"
            required
            value={watchPo('supplier_id')}
            onChange={(val) => setPoValue('supplier_id', val, { shouldValidate: true })}
            error={poErrors.supplier_id?.message}
            onAddNew={() => {
              setIsPoModalOpen(false);
              setIsAddModalOpen(true);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="PO Number (Optional)"
              placeholder="e.g. PO-202611-001 (auto if blank)"
              {...registerPo('po_number')}
              error={poErrors.po_number?.message}
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              {...registerPo('expected_delivery_date')}
              error={poErrors.expected_delivery_date?.message}
            />
          </div>

          {/* Line items section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">
                Order Line Items
              </label>
              <button
                type="button"
                onClick={() =>
                  appendPoItem({
                    product_id: availableProducts[0]?.id || '',
                    quantity: 10,
                    unit_cost: Number(availableProducts[0]?.cost_price || 0),
                  })
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            {poItemFields.map((field, idx) => (
              <div
                key={field.id}
                className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Item #{idx + 1}</span>
                  {poItemFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoItem(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Product
                    </label>
                    <select
                      value={watchPo(`items.${idx}.product_id`)}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    >
                      <option value="">-- Choose Product --</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...registerPo(`items.${idx}.quantity`)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...registerPo(`items.${idx}.unit_cost`)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand total */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-sm">
            <span className="font-semibold text-indigo-900">Total Purchase Value:</span>
            <span className="text-lg font-black text-indigo-700">
              ${poTotalAmount.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Standard freight delivery, dock inspection required..."
              {...registerPo('notes')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPoModalOpen(false);
                resetPoForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createPoMutation.isPending}
            >
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
