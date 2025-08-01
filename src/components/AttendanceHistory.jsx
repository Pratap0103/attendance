import React, { useState } from "react";
import { Loader2, MapPin, Image as ImageIcon, X } from "lucide-react";

const AttendanceHistory = ({ attendanceData, isLoading, userRole }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const headers = [
    "Name",
    "Date & Time", 
    "Status",
    "Map Link",
    "Address",
    "Image" // Added Image column
  ];

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-600 text-lg font-medium">Loading attendance history...</p>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center text-slate-600 font-medium min-h-[200px] flex items-center justify-center">
        No attendance records found.
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-8 py-6">
          <h3 className="text-2xl font-bold text-white mb-2">Attendance History</h3>
          <p className="text-blue-50 text-lg">
            {userRole === "Admin" ? "All records" : "Your records"} are displayed below.
          </p>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="max-h-96 overflow-y-auto shadow-md rounded-md">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {attendanceData.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {record.salesPersonName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.dateTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "IN"
                            ? "bg-green-100 text-green-800"
                            : record.status === "OUT"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.mapLink ? (
                        <a
                          href={record.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" /> View Map
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-slate-700 max-w-xs overflow-hidden text-ellipsis">
                      {record.address || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.imageUrl ? (
                        <button
                          onClick={() => openImageModal(record.imageUrl)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" /> View Image
                        </button>
                      ) : (
                        <span className="text-slate-400">No Image</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h4 className="text-lg font-semibold text-slate-700">Attendance Image</h4>
              <button
                onClick={closeImageModal}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage}
                alt="Attendance"
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-center text-slate-500 p-8" style={{ display: 'none' }}>
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Image could not be loaded</p>
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors mr-2"
              >
                Open in New Tab
              </a>
              <button
                onClick={closeImageModal}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceHistory;