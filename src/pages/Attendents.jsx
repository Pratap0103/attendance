"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { MapPin, Loader2, Camera, X } from "lucide-react";
import AttendanceHistory from "../components/AttendanceHistory";
import { AuthContext } from "../App";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationData, setLocationData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { currentUser, isAuthenticated } = useContext(AuthContext);

  const salesPersonName = currentUser?.salesPersonName || "Unknown User";
  const userRole = currentUser?.role || "User";

  const SPREADSHEET_ID = "1vh1AoD1ShhyIktbxkakcZ2YA0G3-Jusaku9v7WmDx8o";
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyBYG1KxPjq3RLQcg_Clo3giS9lgGjmBy2JLZ6s2nMEX1z9rIpZZRSgpZnjWZZ-rRNv/exec";

  const formatDateInput = (date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const [formData, setFormData] = useState({
    status: "",
    startDate: formatDateInput(new Date()),
    endDate: "",
    reason: "",
  });

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 p-4 rounded-md text-white z-50 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Use front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      showToast("Camera access denied or not available", "error");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      stopCamera();
    }
  };

  // Fixed image upload function
  // Fixed image upload function
const uploadImageToDrive = async (imageDataUrl) => {
  try {
    setIsUploadingImage(true);
    
    // Extract base64 data from data URL
    const base64Data = imageDataUrl.split(',')[1];
    const fileName = `attendance_${salesPersonName}_${Date.now()}.jpg`;
    
    console.log("Starting image upload...", fileName);
    
    const formData = new FormData();
    formData.append('action', 'uploadFile');
    formData.append('fileName', fileName);
    formData.append('fileData', base64Data);
    formData.append('mimeType', 'image/jpeg');
    formData.append('folderId', '1Id-TCoFmo37mBj6Jjqxo2ag1TXFuMYlh');
    
    const uploadResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    
    // Check if the response is ok
    if (!uploadResponse.ok) {
      throw new Error(`HTTP error! status: ${uploadResponse.status}`);
    }
    
    // Parse the response
    const result = await uploadResponse.json();
    console.log("Upload response:", result);
    
    if (result.success) {
      // Use the viewUrl from the response for better accessibility
      const imageUrl = result.viewUrl || result.downloadUrl || result.fileUrl;
      console.log("Image upload completed successfully:", fileName);
      console.log("Image URL:", imageUrl);
      return imageUrl;
    } else {
      throw new Error(result.error || "Upload failed");
    }
    
  } catch (error) {
    console.error("Image upload error:", error);
    // Return empty string instead of throwing to allow attendance submission to continue
    showToast("Image upload failed, but attendance will be recorded without image", "error");
    return "";
  } finally {
    setIsUploadingImage(false);
  }
};

  const getFormattedAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Error getting formatted address:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

          const formattedAddress = await getFormattedAddress(
            latitude,
            longitude
          );

          const locationInfo = {
            latitude,
            longitude,
            mapLink,
            formattedAddress,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          };

          resolve(locationInfo);
        },
        (error) => {
          const errorMessages = {
            1: "Location permission denied. Please enable location services.",
            2: "Location information unavailable.",
            3: "Location request timed out.",
          };
          reject(
            new Error(errorMessages[error.code] || "An unknown error occurred.")
          );
        },
        options
      );
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.status) newErrors.status = "Status is required";
    
    if (formData.status === "IN" || formData.status === "OUT") {
      if (!capturedImage) {
        newErrors.image = "Please capture an image";
      }
    }
    
    if (formData.status === "Leave") {
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate + "T00:00:00") <
          new Date(formData.startDate + "T00:00:00")
      ) {
        newErrors.endDate = "End date cannot be before start date";
      }
      if (!formData.reason) newErrors.reason = "Reason is required for leave";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAttendanceHistory = async () => {
    if (!isAuthenticated || !currentUser) {
      console.log(
        "Not authenticated or currentUser not available. Skipping history fetch."
      );
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const attendanceSheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Attendance`;
      const response = await fetch(attendanceSheetUrl);
      const text = await response.text();

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonData = text.substring(jsonStart, jsonEnd);
      const data = JSON.parse(jsonData);

      if (!data?.table?.rows) {
        console.warn("No rows found in Attendance sheet.");
        setAttendance([]);
        setIsLoadingHistory(false);
        return;
      }

      const rows = data.table.rows;
      const formattedHistory = rows.map((row) => {
        const salesPerson = row.c?.[9]?.v; // Column J
        let dateTime = row.c?.[1]?.v; // Column B
        let originalTimestamp = row.c?.[0]?.v; // Column A
        const imageUrl = row.c?.[10]?.v; // Column K - Image URL

        if (typeof originalTimestamp === 'string' && originalTimestamp.startsWith('Date(') && originalTimestamp.endsWith(')')) {
            try {
                const dateParts = originalTimestamp.substring(5, originalTimestamp.length - 1).split(',');
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10);
                const day = parseInt(dateParts[2], 10);
                const hour = dateParts[3] ? parseInt(dateParts[3], 10) : 0;
                const minute = dateParts[4] ? parseInt(dateParts[4], 10) : 0;
                const second = dateParts[5] ? parseInt(dateParts[5], 10) : 0;

                const dateObj = new Date(year, month, day, hour, minute, second);
                dateTime = formatDateTime(dateObj);
            } catch (e) {
                console.error("Error parsing original timestamp date string:", originalTimestamp, e);
                dateTime = originalTimestamp;
            }
        }

        const status = row.c?.[3]?.v; // Column D
        const mapLink = row.c?.[7]?.v; // Column H
        const address = row.c?.[8]?.v; // Column I

        return {
          salesPersonName: salesPerson,
          dateTime: dateTime,
          status: status,
          mapLink: mapLink,
          address: address,
          imageUrl: imageUrl, // Add image URL
          _originalTimestamp: originalTimestamp,
        };
      }).filter(Boolean);

      const filteredHistory =
        userRole === "Admin"
          ? formattedHistory
          : formattedHistory.filter(
              (entry) => entry.salesPersonName === salesPersonName
            );

      filteredHistory.sort((a, b) => {
        const parseGvizDate = (dateString) => {
            if (typeof dateString === 'string' && dateString.startsWith('Date(') && dateString.endsWith(')')) {
                const dateParts = dateString.substring(5, dateString.length - 1).split(',');
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10);
                const day = parseInt(dateParts[2], 10);
                const hour = dateParts[3] ? parseInt(dateParts[3], 10) : 0;
                const minute = dateParts[4] ? parseInt(dateParts[4], 10) : 0;
                const second = dateParts[5] ? parseInt(dateParts[5], 10) : 0;
                return new Date(year, month, day, hour, minute, second);
            }
            return new Date(dateString);
        };
        const dateA = parseGvizDate(a._originalTimestamp);
        const dateB = parseGvizDate(b._originalTimestamp);
        return dateB.getTime() - dateA.getTime();
      });

      setAttendance(filteredHistory);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      showToast("Failed to load attendance history.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentUser, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit button clicked!");

    if (!validateForm()) {
      showToast("Please fill in all required fields correctly.", "error");
      return;
    }

    if (!isAuthenticated || !currentUser || !salesPersonName) {
      showToast("User data not loaded. Please try logging in again.", "error");
      return;
    }

    if (formData.status === "OUT") {
      const today = new Date();
      const todayFormattedForComparison = formatDateDDMMYYYY(today);

      const hasClockedInToday = attendance.some((record) => {
        const recordDatePart = record.dateTime ? record.dateTime.split(" ")[0] : "";
        return (
          record.salesPersonName === salesPersonName &&
          record.status === "IN" &&
          recordDatePart === todayFormattedForComparison
        );
      });

      if (!hasClockedInToday) {
        showToast("You must clock IN before you can clock OUT on the same day.", "error");
        return;
      }
    }

    setIsSubmitting(true);
    setIsGettingLocation(true);

    try {
      let currentLocation = null;
      let uploadedImageUrl = "";

      // Get location first
      try {
        currentLocation = await getCurrentLocation();
        console.log("Location captured:", currentLocation);
        setLocationData(currentLocation);
      } catch (locationError) {
        console.error("Location error:", locationError);
        showToast(locationError.message, "error");
        setIsSubmitting(false);
        setIsGettingLocation(false);
        return;
      }

      setIsGettingLocation(false);

      // Upload image if captured
      if (capturedImage && (formData.status === "IN" || formData.status === "OUT")) {
        try {
          console.log("Uploading image...");
          uploadedImageUrl = await uploadImageToDrive(capturedImage);
          console.log("Image uploaded successfully:", uploadedImageUrl);
        } catch (imageError) {
          console.error("Image upload error:", imageError);
          showToast("Failed to upload image, but continuing with attendance...", "error");
          // Continue with attendance submission even if image upload fails
        }
      }

      const currentDate = new Date();
      const timestamp = formatDateTime(currentDate);
      const dateForAttendance =
        formData.status === "IN" || formData.status === "OUT"
          ? formatDateTime(currentDate)
          : formData.startDate
          ? formatDateDDMMYYYY(new Date(formData.startDate + "T00:00:00"))
          : "";

      const endDateForLeave = formData.endDate
        ? formatDateDDMMYYYY(new Date(formData.endDate + "T00:00:00"))
        : "";

      let rowData = Array(11).fill(""); // Columns A-K

      rowData[0] = timestamp; // Column A - Timestamp
      rowData[1] = dateForAttendance; // Column B - Date
      rowData[3] = formData.status; // Column D - Status
      rowData[5] = currentLocation.latitude; // Column F - Latitude
      rowData[6] = currentLocation.longitude; // Column G - Longitude
      rowData[7] = currentLocation.mapLink; // Column H - Map Link
      rowData[8] = currentLocation.formattedAddress; // Column I - Address
      rowData[9] = salesPersonName; // Column J - Sales Person Name
      rowData[10] = uploadedImageUrl; // Column K - Image URL

      if (formData.status === "Leave") {
        rowData[4] = formData.reason; // Column E for Reason
        rowData[2] = endDateForLeave; // Column C for End Date
      }

      console.log("Row data to be submitted:", rowData);

      // Submit attendance data using FormData for better compatibility
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("sheetName", "Attendance");
      formDataToSubmit.append("action", "insert");
      formDataToSubmit.append("rowData", JSON.stringify(rowData));

      console.log("Submitting attendance data...");

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formDataToSubmit,
      });

      // For Apps Script with no-cors, we can't read the response
      // But if we reach here without error, assume success
      console.log("Attendance submission completed");

      showToast(`Your ${formData.status} has been recorded successfully!`);

      // After successful submission, refetch history to update the list
      setTimeout(() => {
        fetchAttendanceHistory();
      }, 2000);

      // Reset form
      setFormData({
        status: "",
        startDate: formatDateInput(new Date()),
        endDate: "",
        reason: "",
      });
      setCapturedImage(null);
      setImageUrl("");
      setLocationData(null);
      
    } catch (error) {
      console.error("Submission error:", error);
      showToast(
        `Error recording data: ${error.message || "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
      setIsGettingLocation(false);
      setIsUploadingImage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset image when status changes
    if (name === "status") {
      setCapturedImage(null);
      setImageUrl("");
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const showLeaveFields = formData.status === "Leave";
  const showImageCapture = formData.status === "IN" || formData.status === "OUT";

  if (!isAuthenticated || !currentUser || !currentUser.salesPersonName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            {!isAuthenticated
              ? "Please log in to view this page."
              : "Loading user data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-0 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-8 py-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Mark Attendance
            </h3>
            <p className="text-emerald-50 text-lg">
              Record your daily attendance or apply for leave
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-8">
            <div className="grid gap-6 lg:grid-cols-1">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                >
                  <option value="">Select status</option>
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="Leave">Leave</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.status}
                  </p>
                )}
              </div>
            </div>

            {/* Image Capture Section */}
            {showImageCapture && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Click Image
                </label>
                
                {!capturedImage ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                      Open Camera
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="w-full max-w-md mx-auto rounded-lg border-2 border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => setCapturedImage(null)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {locationData && (
                      <div className="text-sm text-slate-600 bg-white rounded-lg p-3">
                        <p><strong>Location:</strong> {locationData.formattedAddress}</p>
                        <p><strong>Coordinates:</strong> {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}</p>
                        <p><strong>Accuracy:</strong> {locationData.accuracy}m</p>
                      </div>
                    )}
                  </div>
                )}
                
                {errors.image && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.image}
                  </p>
                )}
              </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Capture Image</h4>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg mb-4"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={captureImage}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {!showLeaveFields && !showImageCapture && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="text-sm font-semibold text-emerald-700 mb-2">
                  Current Date & Time
                </div>
                <div className="text-sm sm:text-2xl font-bold text-emerald-800">
                  {formatDateDisplay(new Date())}
                </div>
              </div>
            )}

            {!showLeaveFields && showImageCapture && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="text-sm font-semibold text-emerald-700 mb-2">
                  Current Date & Time
                </div>
                <div className="text-sm sm:text-2xl font-bold text-emerald-800">
                  {formatDateDisplay(new Date())}
                </div>
                <div className="mt-3 text-sm text-emerald-600">
                  📍 Location will be automatically captured when you submit
                </div>
              </div>
            )}

            {showLeaveFields && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-0 sm:p-6 border border-amber-100 mb-6">
                <div className="text-sm font-semibold text-amber-700 mb-2">
                  Leave Application
                </div>
                <div className="text-lg font-bold text-amber-800">
                  {formatDateDisplay(new Date())}
                </div>
                <div className="mt-3 text-sm text-amber-600">
                  📍 Current location will be captured for leave application
                </div>
              </div>
            )}

            {showLeaveFields && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Enter reason for leave"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium min-h-32 resize-none"
                  />
                  {errors.reason && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={
                isSubmitting ||
                isGettingLocation ||
                isUploadingImage ||
                !currentUser?.salesPersonName
              }
            >
              {isUploadingImage ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading Image...
                </span>
              ) : isGettingLocation ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Getting Location...
                </span>
              ) : isSubmitting ? (
                showLeaveFields ? (
                  "Submitting Leave..."
                ) : (
                  "Marking Attendance..."
                )
              ) : showLeaveFields ? (
                "Submit Leave Request"
              ) : (
                "Mark Attendance"
              )}
            </button>
          </form>
        </div>
      </div>
      <AttendanceHistory
        attendanceData={attendance}
        isLoading={isLoadingHistory}
        userRole={userRole}
      />
    </div>
  );
};

export default Attendance;