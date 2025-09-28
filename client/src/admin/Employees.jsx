import React from "react";
import CrudTable from "../components/CrudTable";

export default function Employees() {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Role", accessor: "role" },
  ];

  return <CrudTable title="User Management - Employees" columns={columns} />;
}
