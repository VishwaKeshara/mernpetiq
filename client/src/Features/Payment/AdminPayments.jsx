import React, { useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiSearch, FiCopy } from "react-icons/fi";


const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta?.env?.VITE_API_BASE?.replace(/\/+$/, "")) ||
  "http://localhost:5000";

export default function AdminPayments() {
  // Hard-code the API base for maximum reliability
  const PAYMENT_API = `http://localhost:5000`;

  
  const [source, setSource] = useState("any");
  const [status, setStatus] = useState("any");
  const [refText, setRefText] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");

  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  
  const DEFAULT_LKR_PER_USD = 300;

  
  const formatAmount = (val) => {
    try {
      return new Intl.NumberFormat("en-LK", {
        maximumFractionDigits: 0,
      }).format(Number(val || 0));
    } catch {
      return `${Number(val || 0).toFixed(0)}`;
    }
  };

  
  const fmtAmount = (tx) => {
    if (typeof tx?.amount_lkr === "number" && !Number.isNaN(tx.amount_lkr)) {
      return formatAmount(tx.amount_lkr);
    }
    const usdCents = Number(tx?.amount || 0);
    const usd = usdCents / 100;
    const rate = Number(tx?.exchange_rate_lkr_per_usd) || DEFAULT_LKR_PER_USD;
    const lkr = Math.round(usd * rate);
    return formatAmount(lkr);
  };

  async function fetchTx() {
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (source && source !== "any") params.set("source", source);
      const refClean = refText.trim();
      if (refClean) params.set("ref", refClean);
      const svcClean = serviceText.trim();
      if (svcClean) params.set("service", svcClean);
      if (status && status !== "any") params.set("status", status);
      
      // Now try the real endpoint with query parameters
      console.log("Using direct payments endpoint with filters:", Object.fromEntries(params));
      const url = `${PAYMENT_API}/direct-admin-payments?${params.toString()}`;
      console.log("Fetching payment records from URL:", url);
      
      const res = await fetch(url);
      console.log("Response status:", res.status, res.statusText);
      
      if (!res.ok) {
        console.error("Error response:", res.status, res.statusText);
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Payment data received:", data.length, "records");
      
      if (!Array.isArray(data)) {
        console.error("Unexpected data format:", data);
        throw new Error("Unexpected response");
      }
      
      setRows(data);
      setPage(1);
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message || "Failed to load transactions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTx();
    
  }, []);

  
  const rowsFilteredByDate = useMemo(() => {
    if (!fromDate && !toDate) return rows;

    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return rows.filter((r) => {
      if (!r.createdAt) return false;
      const t = new Date(r.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      return true;
    });
  }, [rows, fromDate, toDate]);

  const allChecked = useMemo(
    () => rowsFilteredByDate.length > 0 && selected.size === rowsFilteredByDate.length,
    [rowsFilteredByDate.length, selected]
  );

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rowsFilteredByDate.map((r) => r._id || r.piId)));
  };

  // Enhanced selection toggle with better logging and validation
  const toggleOne = (id) => {
    if (!id) {
      console.error("Attempted to toggle selection with invalid ID:", id);
      return;
    }
    
    console.log("Toggling selection for ID:", id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        console.log("Removed ID from selection:", id);
      }
      else {
        next.add(id);
        console.log("Added ID to selection:", id, "- Total selected:", next.size + 1);
      }
      return next;
    });
  };

  async function clearSelected() {
    if (selected.size === 0) return;
    
    // Show confirmation dialog
    if (!window.confirm(`Delete ${selected.size} record(s)?`)) return;
    
    try {
      // Get selected IDs and validate them
      const selectedIds = Array.from(selected).filter(id => id);
      console.log("Deleting selected records:", selectedIds);
      
      if (selectedIds.length === 0) {
        throw new Error("No valid IDs selected for deletion");
      }
      
      // Optimistically update UI - remove deleted items from rows
      const remainingRows = rows.filter(row => {
        const rowId = row._id || row.piId;
        return !selectedIds.includes(rowId);
      });
      
      setRows(remainingRows);
      console.log(`Optimistically removed ${rows.length - remainingRows.length} rows from UI`);
      
      // Call API to delete records
      const res = await fetch(`${PAYMENT_API}/direct-admin-payments-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      
      const out = await res.json();
      console.log("Delete response:", out);
      
      if (!res.ok || out.error) {
        throw new Error(out.error || "Delete failed");
      }
      
      // Clear selection
      setSelected(new Set());
      
      // Refresh data from server to ensure consistency
      console.log("Refreshing data from server after delete");
      await fetchTx();
      
    } catch (e) {
      console.error("Error deleting records:", e);
      alert(e.message || "Delete failed");
      
      // Refresh data in case of error to ensure UI is consistent
      await fetchTx();
    }
  }

  function resetFilters() {
    setSource("any");
    setStatus("any");
    setRefText("");
    setServiceText("");
    setFromDate("");
    setToDate("");
    fetchTx();
  }

  function onSearch(e) {
    e?.preventDefault?.();
    fetchTx();
  }

  function handleCopy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => {},
      () => {}
    );
  }

  
  const totalPages = Math.max(Math.ceil(rowsFilteredByDate.length / pageSize), 1);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rowsFilteredByDate.slice(start, start + pageSize);
  }, [rowsFilteredByDate, page, pageSize]);

  function nextPage() {
    setPage((p) => Math.min(p + 1, totalPages));
  }
  function prevPage() {
    setPage((p) => Math.max(p - 1, 1));
  }

  function badgeForStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v === "succeeded") return "bg-green-100 text-green-700";
    if (v === "processing" || v === "requires_action")
      return "bg-yellow-100 text-yellow-700";
    if (v === "canceled" || v === "failed") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  }

  function badgeForSource(s) {
    const v = String(s || "").toLowerCase();
    if (v === "hospital") return "bg-blue-100 text-blue-700";
    if (v === "mart") return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  }

  const SkeletonRow = () => (
    <tr className="border-t animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-6">
  
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Payment Records</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchTx()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
            title="Refresh"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      
      <form
        onSubmit={onSearch}
        className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
      >
        
        <div className="md:col-span-3">
          <label className="block text-sm text-gray-700 mb-1">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
              placeholder="Reference or Payment ID…"
              className="w-full border rounded-md h-10 pl-9 pr-3"
            />
          </div>
        </div>

        
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded-md h-10 px-3"
          >
            <option value="any">Any</option>
            <option value="hospital">Hospital</option>
            <option value="mart">Mart</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md h-10 px-3"
          >
            <option value="any">Any</option>
            <option value="succeeded">Succeeded</option>
            <option value="processing">Processing</option>
            <option value="requires_action">Requires Action</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        
        <div className="md:col-span-3">
          <label className="block text-sm text-gray-700 mb-1">Service</label>
          <input
            value={serviceText}
            onChange={(e) => setServiceText(e.target.value)}
            placeholder="Vaccination, Groom..."
            className="w-full border rounded-md h-10 px-3"
          />
        </div>

        
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Date</label>
          <div className="flex items-center gap-2 flex-nowrap">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 border rounded-md px-3 w-[150px] md:w-[160px] min-w-0"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 border rounded-md px-3 w-[150px] md:w-[160px] min-w-0"
            />
          </div>
        </div>

        
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : "Filter"}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-4 rounded-md border w-full"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {loading ? "Loading..." : `${rowsFilteredByDate.length} result(s)`}
          {error && <span className="text-red-600 ml-3">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearSelected}
            disabled={selected.size === 0}
            className={`h-9 px-4 rounded-md ${
              selected.size
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Delete selected
          </button>
        </div>
      </div>

      
      <div className="mt-4 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-amber-50 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3 text-left">Date & Time</th>
              <th className="px-3 py-3 text-left">Source</th>
              <th className="px-3 py-3 text-left">Reference</th>
              <th className="px-3 py-3 text-left">Description</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-3 py-3 text-left">Currency</th>
              <th className="px-3 py-3 text-left">PI ID</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && rowsFilteredByDate.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                  No records
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((r) => {
                // Make sure we have a valid ID for each record
                let id = null;
                
                // Try to get MongoDB _id first (most reliable)
                if (r._id) {
                  id = r._id;
                } 
                // Fall back to payment intent ID if _id is not available
                else if (r.piId) {
                  id = r.piId;
                }
                
                console.log("Row data:", { 
                  rowId: id, 
                  _id: r._id, 
                  piId: r.piId,
                  hasValidId: !!id
                });
                
                const displayCurrency = (r.display_currency || "lkr").toUpperCase();
                const dateStr = r.createdAt
                  ? new Date(r.createdAt).toLocaleString()
                  : "—";
                const desc =
                  (r.description || "").length > 64
                    ? r.description.slice(0, 61) + "…"
                    : r.description || "—";
                return (
                  <tr key={id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        aria-label={`Select ${id}`}
                      />
                    </td>
                    <td className="px-3 py-3 align-top whitespace-nowrap">{dateStr}</td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${badgeForSource(r.source)}`}>
                        {r.source || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.ref_id || "—"}</span>
                        {r.ref_id && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-200"
                            onClick={() => handleCopy(r.ref_id)}
                            title="Copy reference"
                          >
                            <FiCopy className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">{desc}</td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${badgeForStatus(r.status)}`}>
                        {r.status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-right text-emerald-700 font-semibold">
                      {fmtAmount(r)}
                    </td>
                    <td className="px-3 py-3 align-top uppercase">{displayCurrency}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{r.piId || "—"}</span>
                        {r.piId && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-200"
                            onClick={() => handleCopy(r.piId)}
                            title="Copy PI ID"
                          >
                            <FiCopy className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      
      {!loading && rowsFilteredByDate.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • {rowsFilteredByDate.length} total
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows per page</label>
            <select
              className="h-9 border rounded-md px-2"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={prevPage}
              disabled={page <= 1}
              className={`h-9 px-3 rounded-md border ${
                page <= 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
              }`}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={page >= totalPages}
              className={`h-9 px-3 rounded-md border ${
                page >= totalPages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}