import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';
import Navbar from '../component/Navbar';
import styles from '../style';
import Swal from 'sweetalert2';
import Footer from '../component/Footer';
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/order/orders/');
        const ordersData = await Promise.all(res.data.map(async (order) => {
          const userRes = await axios.get(`/users/${order.user}`);
          let hotelData =  null;

          try{
            const hotelRes = await axios.get(`/hotels/find/${order.hotel}`);
            hotelData = hotelRes.data
          } catch (err){
            console.log("No data found: " + err)
          }
          
          return {
            ...order,
            user: userRes.data,
            hotel: hotelData
          };
        }));
        setOrders(ordersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleConfirm = async (orderId) => {
    try {
      const res = await axios.patch(`/order/confirm/${orderId}`);
      setOrders(orders.map(order => order._id === orderId ? res.data : order));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      const res = await axios.patch(`/order/cancel/${orderId}`);
      setOrders(orders.map(order => order._id === orderId ? res.data : order));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`/order/delete/${orderId}`);
      setOrders(orders.filter(order => order._id !== orderId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);
    let sortedOrders = [...orders];

    switch (option) {
      case 'newest':
        sortedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        break;
      case 'oldest':
        sortedOrders.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        break;
      case 'canceledTrue':
        sortedOrders = orders.filter(order => order.canceled === true);
        break;
      case 'canceledFalse':
        sortedOrders = orders.filter(order => order.canceled === false);
        break;
      case 'confirmedTrue':
        sortedOrders = orders.filter(order => order.confirmed === true);
        break;
      case 'confirmedFalse':
        sortedOrders = orders.filter(order => order.confirmed === false);
        break;
      default:
        sortedOrders = [...orders];
    }

    setFilteredOrders(sortedOrders);
  };

  const handleDownloadPDF = (order) => {
    const doc = new jsPDF();
    if (!order.hotel || !order.hotel.name) {
      Swal.fire({
        title: "Failed",
        text: "Failed to download the receipt, due to villa you ordered is deleted from database. if you still need a receipt, please contact us.",
        icon: "error"
      });
      return; // Exit the function if the hotel name is null
    }
    doc.setFontSize(20);
    doc.text('Order Details', 10, 10);
    doc.text('Villa Nyaman', 10, 20);

    doc.setFontSize(12);
    doc.text(`Order ID: ${order._id}`, 10, 30);
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 10, 36);
    doc.text(`Villa Name: ${order.hotel.name} Villa Title: ${order.hotel.title}`, 10, 42);
    doc.text(`Start Date: ${new Date(order.startDate).toLocaleDateString()}`, 10, 48);
    doc.text(`End Date: ${new Date(order.endDate).toLocaleDateString()}`, 10, 54);
    doc.text(`Total: Rp. ${order.total}`, 10, 60);
    doc.text(`Confirmed: ${order.confirmed ? 'Yes' : 'No'}`, 10, 66);
    doc.text(`Canceled: ${order.canceled ? 'Yes' : 'No'}`, 10, 72);

    doc.text(`Sold to:`, 10, 80);
    doc.text(`First Name: ${order.user.firstname}`, 10, 86);
    doc.text(`Last Name: ${order.user.lastname}`, 10, 92);
    doc.text(`Email: ${order.user.email}`, 10, 98);
    doc.text(`Passport No: ${order.user.passportNo}`, 10, 104);
    doc.text(`Country: ${order.user.country}`, 10, 110);
    doc.text(`Phone: ${order.user.phone}`, 10, 116);

    doc.text(`Notes:`, 10, 124);
    doc.text(`1. Your order is not considered as "paid" if your order hasn't been confirmed.`, 10, 130);
    doc.text(`2. All purchase cannot be refunded.`, 10, 136);
    doc.text(`3. Reschedule only allowed 3 days (72 hours) before check in time with a fee of Rp. 100.000 (8 USD).`, 10, 142);
    doc.text(`4. Reschedule is only allowed once.`, 10, 148);
    doc.text(`5. Order is considered as valid if it is registered in villanyaman.com/searchorder/`, 10, 154);
    doc.text(`6. This is a computer generated receipt, no signature required.`, 10, 160);
    doc.save(`order_${order._id}.pdf`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="font-poppins">Error: {error}</p>;

  return (
    <div className={`${styles.paddingX} ${styles.flexCenter}`}>
      <div className={`${styles.boxWidth}`}>
        <Navbar />
        <div>
          <h1 className="font-poppins mt-5 text-[35px] font-semibold text-gray-900">All order</h1>

          {/* Dropdown for sorting/filtering */}
          <div className="mt-4">
            <label htmlFor="sort" className="font-poppins text-lg">Sort/Filter by: </label>
            <select
              id="sort"
              className="ml-2 p-2 border rounded"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="default">Default</option>
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
              <option value="canceledTrue">Show Canceled Orders</option>
              <option value="canceledFalse">Show Active Orders</option>
              <option value="confirmedTrue">Show Confirmed Orders</option>
              <option value="confirmedFalse">Show Unconfirmed Orders</option>
            </select>
          </div>

          {/* Orders List */}
          <div className="mt-6 border-t border-gray-100">
            {filteredOrders.map((order) => (
              <div key={order._id} className="py-6 border-[3px] mt-5 rounded-[20px] border-gray-200 flex flex-col md:flex-row">
                
                {/* Left Column: Order and User Information */}
                <div className="flex-1 p-5 font-poppins lg:ml-10">
                  <h2 className="text-lg font-medium text-gray-900">Order ID: {order._id}</h2>
                  <p className="text-sm text-gray-600">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900">User Information</h3>
                    <p>First Name: {order.user.firstname}</p>
                    <p>Last Name: {order.user.lastname}</p>
                    <p>Email: {order.user.email}</p>
                    <p>Passport No: {order.user.passportNo}</p>
                    <p>Country: {order.user.country}</p>
                    <p>Phone: {order.user.phone}</p>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900">Order Details</h3>
                    <p>Start Date: {new Date(order.startDate).toLocaleDateString()}</p>
                    <p>End Date: {new Date(order.endDate).toLocaleDateString()}</p>
                    {/* Error handling if the order.hotel.name or order.hotel.title is null, it will show a message instead */}
                    {order.hotel && order.hotel.name ? (
                      <>
                        <p>Villa Name: {order.hotel.name}</p>
                        <p>Villa Title: {order.hotel.title}</p>
                      </>
                    ) : (
                      <p className="text-red-500">Unable to show villa information, it is possible that the villa has been deleted.</p>
                    )}

                    <p>Rooms: {order.roomNumber}</p>
                    <p>Total: Rp. {order.total}</p>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900">Status</h3>
                    <p>Confirmed: {order.confirmed ? 'Yes' : 'No'}</p>
                    <p>Canceled: {order.canceled ? 'Yes' : 'No'}</p>
                  </div>

<div className="mt-4 ml-10 flex space-x-4">
                  <button 
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => 
                      
                      Swal.fire({
                        title: "Confirm Order",
                        text: "Are you sure you want to confirm this order?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Continue"
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleConfirm(order._id)
                          Swal.fire({
                            title: "Confirmed!",
                            text: "Order has been confirmed!",
                            icon: "success"
                          });
                        }
                      })
                      
                      }
                  >
                    Confirm
                  </button>
                  <button 
                    className="bg-orange-500 text-white px-4 py-2 rounded"
                    onClick={() => 
                      
                      Swal.fire({
                        title: "Cancel Order",
                        text: "Are you sure you want to cancel this order?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Continue"
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleCancel(order._id)
                          Swal.fire({
                            title: "Canceled!",
                            text: "Order has been canceled!",
                            icon: "success"
                          });
                        }
                      })

                     }
                  >
                    Cancel
                  </button>
                  <button 
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => 
                      
                      Swal.fire({
                        title: "Delete Order",
                        text: "Are you sure you want to delete this order?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Continue"
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleDelete(order._id)
                          Swal.fire({
                            title: "Deleted!",
                            text: "Order has been deleted from database!",
                            icon: "success"
                          });
                        }
                      })
                      
                      }
                  >
                    Delete
                  </button>
                </div>

                </div>

                {/* Middle Column: Proof of Payment */}
                <div className="flex-1 p-5 flex flex-col items-center ">
                  {order.proofOfTransfer && order.proofOfTransfer.length > 0 ? (
                    <div>
                    <p className="font-poppins">Proof of payment provided by customer</p>
                    <img
                      src={`http://localhost:8800${order.proofOfTransfer[0]}`}
                      alt="Proof of Payment"
                      className="max-w-full max-h-[400px] rounded-lg"
                    />
                    </div>
                  ) : (
                    <div>
                      <p className="font-poppins">Customer has not upload their proof of payment</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Hotel Image and PDF Download */}
                <div className="flex-1 p-5 flex flex-col items-center justify-center">
                {order.hotel && order.hotel.photos && order.hotel.photos.length > 0 ? (
                    <img
                      src={`http://localhost:8800${order.hotel.photos[0]}`}
                      alt="Hotel"
                      className="max-w-full max-h-[400px] rounded-lg"
                    />
                  ) : (
                    <p className="font-poppins">No image available</p>
                  )}
                  <button
                    className="mt-4 font-poppins bg-cyan-300 hover:bg-cyan-400  text-black py-2 px-4 rounded"
                    onClick={() => handleDownloadPDF(order)}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer/>
      </div>
    </div>


  );
};

export default Orders;
