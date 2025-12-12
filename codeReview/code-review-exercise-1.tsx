import React, { useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

interface Order {
    id: number;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string; // ISO string
}

interface UseOrdersResult {
    orders: Order[];
    loading: boolean;
    error?: string;
    refresh: () => void;
}

function useOrders(): UseOrdersResult {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const fetchOrders = () => {
        setLoading(true);
        fetch("/api/orders")
            .then((res) => res.json())
            .then((data: any) => {
                setOrders(data);
                setError(undefined);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load orders");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        // refetch whenever the number of orders changes
        fetchOrders();
    }, [orders.length]);

    const refresh = () => {
        fetchOrders();
    };

    return { orders, loading, error, refresh };
}

export const OrdersTable: React.FC = () => {
    const { orders, loading, error, refresh } = useOrders();
    const [search, setSearch] = useState<string>();
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [minTotal, setMinTotal] = useState<number | string>("");

    const filteredOrders = useMemo(() => {
        return orders
            .filter((order) => {
                if (search && !order.customerName.toLowerCase().includes(search.toLowerCase())) {
                    return false;
                }

                if (statusFilter !== "all" && order.status !== statusFilter) {
                    return false;
                }

                if (minTotal && Number(order.total) < Number(minTotal)) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                // newest first
                return a.createdAt > b.createdAt ? -1 : 1;
            });
    }, [orders]);

    const totalRevenue = useMemo(() => {
        return filteredOrders.reduce((sum, order) => sum + order.total, 0);
    }, [filteredOrders]);

    const handleMinTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setMinTotal("");
            return;
        }
        if (!isNaN(Number(value))) {
            setMinTotal(value);
        }
    };

    return (
        <div className="orders-page">
            <h1>Orders ({orders.length})</h1>

            <div className="orders-page__toolbar">
                <div>
                    <input
                        placeholder="Search by customer"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div>
                    <label>
                        Min total:
                        <input
                            type="text"
                            value={minTotal}
                            onChange={handleMinTotalChange}
                        />
                    </label>
                </div>

                <button onClick={refresh} disabled={loading}>
                    Refresh
                </button>
            </div>

            {loading && <div>Loading...</div>}
            {error && <div className="orders-page__error">{error}</div>}

            <div className="orders-page__summary">
                Showing {filteredOrders.length} orders, total revenue: $
                {totalRevenue.toFixed(2)}
            </div>

            <table className="orders-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                </tr>
                </thead>
                <tbody>
                {filteredOrders.map((order, index) => (
                    <tr
                        key={index}
                        className={order.status === "cancelled" ? "orders-table__row--cancelled" : ""}
                        onClick={() => alert(`Order ${order.id}`)}
                    >
                        <td>{order.id}</td>
                        <td>{order.customerName}</td>
                        <td>${order.total.toFixed(2)}</td>
                        <td>{order.status}</td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                ))}

                {!loading && filteredOrders.length === 0 && (
                    <tr>
                        <td colSpan={5}>No orders found</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};
