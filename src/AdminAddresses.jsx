// src/AdminAddresses.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4242";
const PROVINCES = [
  "Western","Central","Southern","Northern","Eastern",
  "North Western","North Central","Uva","Sabaragamuwa",
];

export default function AdminAddresses() {
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

      const res = await fetch(`${API_BASE}/api/admin/addresses?` + params.toString());
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // initial load + when sort/order change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, order]);

  function onSearch() {
    load();
  }

  function toggleSort(field) {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(field);
      setOrder("asc");
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10">
      <h1 className="text-2xl font-semibold">Delivery Details</h1>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-3 items-end">
        <label className="block">
          <div className="mb-1 text-sm text-gray-700">Search (first/last or full name, phone, address, city)</div>
          <input
            className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
                                                     />

        </label>

        <label className="block">
          <div className="mb-1 text-sm text-gray-700">Province</div>
          <select
            className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-blue-500"
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

        <button
          type="button"
          onClick={onSearch}
          className="h-11 rounded-md bg-blue-600 px-5 text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing <b>{items.length}</b> result{items.length === 1 ? "" : "s"}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th onClick={() => toggleSort("createdAt")} active={sort === "createdAt"} order={order}>
                Created
              </Th>
              <Th onClick={() => toggleSort("firstName")} active={sort === "firstName"} order={order}>
                First
              </Th>
              <Th onClick={() => toggleSort("lastName")} active={sort === "lastName"} order={order}>
                Last
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
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="px-4 py-6 text-red-600" colSpan={9}>
                  {err}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={9}>
                  No results
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.createdAt ? dtf.format(new Date(a.createdAt)) : ""}
                  </td>
                  <td className="px-4 py-3">{a.firstName}</td>
                  <td className="px-4 py-3">{a.lastName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.phone}</td>
                  <td className="px-4 py-3">
                    {[a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3">{a.city}</td>
                  <td className="px-4 py-3">{a.state}</td>
                  <td className="px-4 py-3">{a.postalCode}</td>
                  <td className="px-4 py-3">{a.country}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
