import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CrudTable({ title, columns }) {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);


  useEffect(() => {
    axios.get("http://localhost:3001/employees")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    if (editingId) {

      axios.put(`http://localhost:3001/employees/${editingId}`, form)
        .then(res => {
          setData(data.map(item => item._id === editingId ? res.data : item));
          setEditingId(null);
          setForm({});
        })
        .catch(err => console.error(err));
    } else {

      axios.post("http://localhost:3001/employees", form)
        .then(res => {
          setData([...data, res.data]);
          setForm({});
        })
        .catch(err => console.error(err));
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item._id);
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3001/employees/${id}`)
      .then(() => {
        setData(data.filter(item => item._id !== id));
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        {columns.map(col => (
          <input
            key={col.accessor}
            type="text"
            name={col.accessor}
            placeholder={col.header}
            value={form[col.accessor] || ""}
            onChange={handleChange}
            className="border px-2 py-1 rounded"
          />
        ))}
        <button
          onClick={handleAdd}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.accessor} className="border px-2 py-1">{col.header}</th>
            ))}
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item._id}>
              {columns.map(col => (
                <td key={col.accessor} className="border px-2 py-1">{item[col.accessor]}</td>
              ))}
              <td className="border px-2 py-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-blue-500 text-white px-2 py-1 mr-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
