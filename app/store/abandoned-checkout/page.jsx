"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import axios from "axios";
import Loading from "@/components/Loading";

export default function AbandonedCheckoutPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [carts, setCarts] = useState([]);
  const [error, setError] = useState("");

  const fetchCarts = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/store/abandoned-checkout", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCarts(Array.isArray(data.carts) ? data.carts : []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Abandoned Checkout</h1>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded mb-4">{error}</div>}

      {carts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 border rounded">No abandoned checkouts yet.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Contact</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Products in Cart</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{c.name || "Guest"}</div>
                  </td>
                  <td className="p-3">
                    <div>{c.email || "-"}</div>
                    <div className="text-xs text-slate-500">{c.phone || "-"}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm max-w-xs">
                      {c.address ? (
                        <div className="space-y-0.5">
                          {c.address.street && <div className="font-medium text-gray-900">{c.address.street}</div>}
                          <div className="text-xs text-slate-600">
                            {c.address.city && <span>{c.address.city}</span>}
                            {c.address.city && c.address.district && <span>, </span>}
                            {c.address.district && <span>{c.address.district}</span>}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.address.state && <span>{c.address.state}</span>}
                            {c.address.pincode && <span> {c.address.pincode}</span>}
                          </div>
                          {c.address.country && <div className="text-xs text-slate-500 font-semibold">{c.address.country}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs">
                      {Array.isArray(c.items) && c.items.length > 0 ? (
                        <div className="space-y-1">
                          {c.items.map((item, idx) => (
                            <div key={idx} className="text-sm bg-slate-50 p-2 rounded">
                              <div className="font-medium text-gray-900">{item.name || 'Product'}</div>
                              <div className="text-xs text-slate-600 flex justify-between">
                                <span>Qty: {item.quantity || 1}</span>
                                <span className="font-semibold">₹{item.price ? item.price.toLocaleString() : '-'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">No items</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{c.currency || "₹"}{c.cartTotal ?? "-"}</td>
                  <td className="p-3">
                    {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}