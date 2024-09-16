import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import Navbar from '../component/Navbar';
import styles from '../style';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../component/Footer';
import Swal from 'sweetalert2';

const MyOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [sortOption, setSortOption] = useState('default');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/order/myorder/');
        const ordersData = await Promise.all(
          res.data.map(async (order) => {
            const userRes = await axios.get(`/users/${order.user}`);

            let hotelData = null;

            try{
              const hotelRes = await axios.get(`/hotels/find/${order.hotel._id}`);
              hotelData = hotelRes.data
            } catch (err){
              console.log("No data found: " + err)
            }

            return {
              ...order,
              user: userRes.data,
              hotel: hotelData,
            };
          })
        );
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  const handleProofOfPaymentUpload = async (e, orderId) => {
    const formData = new FormData();
    formData.append('proofImage', e.target.files[0]);

    try {
      await axios.post(`/order/${orderId}/upload-proof`, formData);
      alert('Proof of payment uploaded successfully!');
    } catch (error) {
      alert('Error uploading proof of payment.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user.firstname)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-[3px] rounded-[30px] w-[300px] h-[300px] mt-10 ml-10">
          <h2 className="font-poppins ml-10 mt-10 font-bold text-[40px]">Sorry</h2>
          <p className="font-poppins mt-10 ml-10">
            You are not logged in! <a href="/login">Click here</a> to login page
          </p>
        </div>
      </div>
    );

  return (
    <div className={`${styles.paddingX} ${styles.flexCenter}`}>
      <div className={`${styles.boxWidth}`}>
        <Navbar />
        <div>
          <h1 className="font-poppins mt-5 text-[35px] font-semibold text-gray-900">My Order</h1>

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
                <div className="flex-1 p-5 lg:ml-10 font-poppins">
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
                </div>

                {/* Middle Column: Proof of Payment */}
                <div className="flex-1 p-5 flex flex-col items-center ">
                  {order.proofOfTransfer && order.proofOfTransfer.length > 0 ? (
                    <div>
                    <p className="font-poppins">Thank you, we have received your proof of payment. Please kindly wait if your order has not been confirmed.</p>
                    <img
                      src={`http://localhost:8800${order.proofOfTransfer[0]}`}
                      alt="Proof of Payment"
                      className="max-w-full max-h-[400px] rounded-lg"
                    />
                    </div>
                  ) : (
                    <div>
                      <p className="font-poppins">Please upload your proof of payment.</p>
                      <input
                        type="file"
                        onChange={(e) => handleProofOfPaymentUpload(e, order._id)}
                        className="block mt-5 w-full text-sm font-poppins text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-300 file:text-black-900 hover:file:bg-cyan-400"
                      />
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
                    className="mt-4 font-poppins bg-cyan-300 hover:bg-cyan-400 text-black py-2 px-4 rounded"
            
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

export default MyOrder;
