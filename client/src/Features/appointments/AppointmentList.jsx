import React, { useEffect, useState } from "react";
import { appointmentBaseURL } from "../../axiosinstance";

function AppointmentList() {
  const [appointmentList, setAppointmentList] = useState([]);

  const getAllAppointmentList = async () => {
    try {
      const { data } = await appointmentBaseURL.get("/appointmentList");
      setAppointmentList(data?.appointmentList);
      console.log('appointmentList', data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllAppointmentList();
  }, []);

  return (
    <div className="w-full bg-white divide-y divide-gray-200">
      <div className="w-full">
        <table className="w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Owner Name
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pet Name
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pet Type
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Service
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vet
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
              <th className="tracking-wider px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointmentList?.map((appointment, index) => (
              <tr className="hover:bg-gray-200" key={index}>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.ownerName}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.petName}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.petType}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.service}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.price}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.vet}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.date}</td>
                <td className="px-6 py-3 whitespace-nowrap">{appointment?.time}</td>
                <td className="px-6 py-3 whitespace-nowrap">Edit | Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentList;
