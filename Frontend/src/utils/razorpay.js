/**
 * Dynamically loads the official Razorpay Checkout script if not already present
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
            console.warn("Failed to load official Razorpay script");
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

/**
 * Initiates Razorpay checkout with fallback sandbox simulation for local development
 */
export const launchRazorpayCheckout = async ({
    orderData,
    user,
    productName,
    onSuccess,
    onDismiss,
}) => {
    const isMock = orderData.is_mock || (orderData.key_id && orderData.key_id.includes("mock"));

    // If using live or real test keys, attempt official Razorpay Checkout popup
    if (!isMock) {
        const loaded = await loadRazorpayScript();
        if (loaded && window.Razorpay) {
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "InventoryPro",
                description: `Payment for ${productName || "Order"}`,
                image: "/imsLogo.png",
                order_id: orderData.razorpay_order_id,
                handler: function (response) {
                    // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
                    if (onSuccess) {
                        onSuccess(response);
                    }
                },
                prefill: {
                    name: user?.username || user?.name || "Customer",
                    email: user?.email || "",
                    contact: user?.phone || "9923004099",
                },
                theme: {
                    color: "#2563eb",
                },
                modal: {
                    ondismiss: function () {
                        if (onDismiss) onDismiss();
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.error("Razorpay Payment Failed:", response.error);
                if (onDismiss) onDismiss(response.error);
            });
            rzp.open();
            return;
        }
    }

    // Interactive developer fallback simulation when using mock/test keys
    const mockPaymentId = `pay_mock_${Date.now().toString().slice(-8)}`;
    const mockSignature = `sig_mock_${Date.now().toString().slice(-12)}`;

    // Invoke success with simulated payload for complete end-to-end testing
    if (onSuccess) {
        onSuccess({
            razorpay_order_id: orderData.razorpay_order_id,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: mockSignature,
            is_simulated: true,
        });
    }
};

