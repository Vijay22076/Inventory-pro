import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem("inventorypro_cart");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("inventorypro_cart", JSON.stringify(cartItems));
        } catch (e) {
            console.error("Failed to persist cart to localStorage:", e);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        if (!product || !product._id) return;
        const availableStock = product.available_stock ?? product.stock ?? 0;

        if (availableStock <= 0) {
            toast.error("This product is currently out of stock");
            return;
        }

        setCartItems((prevItems) => {
            const existingIndex = prevItems.findIndex((i) => i.product._id === product._id);

            if (existingIndex > -1) {
                const currentQty = prevItems[existingIndex].quantity;
                const newQty = currentQty + quantity;

                if (newQty > availableStock) {
                    toast.error(`Only ${availableStock} units available in regional warehouse`);
                    return prevItems;
                }

                const updated = [...prevItems];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: newQty,
                    product, // update with latest product snapshot
                };
                toast.success(`Updated ${product.product_name} quantity in cart (${newQty})`);
                return updated;
            } else {
                if (quantity > availableStock) {
                    toast.error(`Only ${availableStock} units available in regional warehouse`);
                    return prevItems;
                }
                toast.success(`Added ${product.product_name} to cart`);
                return [...prevItems, { product, quantity }];
            }
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.product._id === productId) {
                    const availableStock = item.product.available_stock ?? item.product.stock ?? 999;
                    if (newQuantity > availableStock) {
                        toast.error(`Maximum available stock is ${availableStock}`);
                        return { ...item, quantity: availableStock };
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((i) => i.product._id !== productId));
        toast.success("Item removed from cart");
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const subTotal = cartItems.reduce(
        (sum, item) => sum + (item.product.selling_price || 0) * (item.quantity || 1),
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                totalItems,
                subTotal,
                isCartOpen,
                openCart: () => setIsCartOpen(true),
                closeCart: () => setIsCartOpen(false),
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export default CartContext;

