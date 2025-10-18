import React, { useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiSearch, FiCopy } from "react-icons/fi";


const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta?.env?.VITE_API_BASE?.replace(/\/+$/, "")) ||
  "http://localhost:5000";

const PROVINCES = [
  "Western","Central","Southern","Northern","Eastern",
  "North Western","North Central","Uva","Sabaragamuwa",
];

export default function AdminAddresses() {
  
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (province) params.set("province", province);
      params.set("sort", sort);
      params.set("order", order);
      params.set("limit", "1000");
      params.set("page", "1");

      const res = await fetch(`${API_BASE}/api/admin/addresses?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    
  }, [sort, order]);

  function onSearch(e) {
    e?.preventDefault?.();
    load();
  }

  function toggleSort(field) {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(field);
      setOrder("asc");
    }
  }


  const dateFiltered = useMemo(() => {
    if (!fromDate && !toDate) return items;

    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return items.filter((a) => {
      if (!a?.createdAt) return false;
      const t = new Date(a.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      return true;
    });
  }, [items, fromDate, toDate]);

  
  const totalPages = Math.max(Math.ceil(dateFiltered.length / pageSize), 1);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return dateFiltered.slice(start, start + pageSize);
  }, [dateFiltered, page, pageSize]);

  function nextPage() {
    setPage((p) => Math.min(p + 1, totalPages));
  }
  function prevPage() {
    setPage((p) => Math.max(p - 1, 1));
  }

  function joinAddress(a) {
    return [a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
      .filter(Boolean)
      .join(", ");
  }

  function handleCopy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => {},
      () => {}
    );
  }

  const SkeletonRow = () => (
    <tr className="border-t animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-6">
    
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Delivery Details</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
            title="Refresh"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

    
      <form onSubmit={onSearch} className="mt-4 space-y-3">
      
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
          <label className="block md:col-span-6 min-w-0">
            <div className="mb-1 text-sm text-gray-700">Search</div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="First/last/full name, phone, address, city…"
              />
            </div>
          </label>

        
          <label className="block md:col-span-3 min-w-0">
            <div className="mb-1 text-sm text-gray-700">Province</div>
            <select
              className="h-10 w-full rounded-md border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              <option value="">All</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

        
          <div className="md:col-span-3 min-w-0">
            <div className="mb-1 text-sm text-gray-700">Date</div>
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 border rounded-md px-3 flex-1 min-w-0"
              />
              <span className="text-gray-400 shrink-0">—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 border rounded-md px-3 flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6 flex gap-3">
            <button
              type="submit"
              className="h-10 px-5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setProvince("");
                setFromDate("");
                setToDate("");
                load();
              }}
              className="h-10 px-5 rounded-md border"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      </form>

    
      <div className="mt-4 text-sm text-gray-600">
        Showing <b>{dateFiltered.length}</b> result{dateFiltered.length === 1 ? "" : "s"}
        {err && <span className="text-red-600 ml-3">{err}</span>}
      </div>

    
      <div className="mt-3 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-amber-50 text-gray-700 sticky top-0 z-10">
            <tr>
              <Th onClick={() => toggleSort("createdAt")} active={sort === "createdAt"} order={order}>
                Created
              </Th>
              <Th onClick={() => toggleSort("firstName")} active={sort === "firstName"} order={order}>
                Name
              </Th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Address</th>
              <Th onClick={() => toggleSort("city")} active={sort === "city"} order={order}>
                City
              </Th>
              <Th onClick={() => toggleSort("state")} active={sort === "state"} order={order}>
                Province
              </Th>
              <th className="px-4 py-3 text-left">Postal</th>
              <th className="px-4 py-3 text-left">Country</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={8}>
                  No results
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((a) => (
                <tr key={a._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.createdAt ? dtf.format(new Date(a.createdAt)) : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {[a.firstName, a.lastName].filter(Boolean).join(" ") || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{a.phone || "—"}</span>
                      {a.phone && (
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200"
                          onClick={() => handleCopy(a.phone)}
                          title="Copy phone"
                        >
                          <FiCopy className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="block break-words">{joinAddress(a) || "—"}</span>
                      {joinAddress(a) && (
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
                          onClick={() => handleCopy(joinAddress(a))}
                          title="Copy address"
                        >
                          <FiCopy className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.city || "—"}</td>
                  <td className="px-4 py-3">{a.state || "—"}</td>
                  <td className="px-4 py-3">{a.postalCode || "—"}</td>
                  <td className="px-4 py-3">{a.country || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    
      {!loading && dateFiltered.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • {dateFiltered.length} total
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

function Th({ children, onClick, active, order }) {
  return (
    <th
      className="px-4 py-3 text-left select-none cursor-pointer"
      onClick={onClick}
      title="Sort"
    >
      <span className={`inline-flex items-center gap-1 ${active ? "font-semibold" : ""}`}>
        {children}
        {active ? (order === "asc" ? "▲" : "▼") : ""}
      </span>
    </th>
  );
}