import React, { useEffect, useRef } from "react";
import { Button, QRCode, Modal } from "antd";
import { PrinterOutlined, BarcodeOutlined, QrcodeOutlined } from "@ant-design/icons";
import JsBarcode from "jsbarcode";

/**
 * ProductBarcode Component
 * Renders Code128 1D Barcode and Ant Design 2D QR Code for a given product/SKU.
 */
export const BarcodeSvg = ({ code, height = 45, width = 1.8, fontSize = 12 }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (svgRef.current && code) {
            try {
                JsBarcode(svgRef.current, String(code).trim(), {
                    format: "CODE128",
                    width,
                    height,
                    displayValue: true,
                    fontSize,
                    margin: 4,
                    background: "transparent",
                    lineColor: "#1e293b",
                });
            } catch (err) {
                console.warn("JsBarcode error for code:", code, err);
            }
        }
    }, [code, height, width, fontSize]);

    if (!code) return <span className="text-slate-400 text-xs">No Code</span>;
    return <svg ref={svgRef} className="max-w-full h-auto"></svg>;
};

/**
 * Printable Shelf/Item Label Modal
 */
export const ProductLabelModal = ({ visible, onCancel, product }) => {
    const handlePrint = () => {
        const printContent = document.getElementById("printable-product-label");
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${product?.product_name || "Product"}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                        .label-card { width: 340px; border: 2px dashed #334155; padding: 16px; border-radius: 8px; text-align: center; }
                        .title { font-size: 15px; font-weight: bold; margin-bottom: 4px; color: #0f172a; }
                        .sku { font-family: monospace; font-size: 12px; color: #475569; margin-bottom: 8px; }
                        .price { font-size: 18px; font-weight: 800; color: #1e3a8a; margin: 8px 0; }
                        .flex-row { display: flex; justify-content: space-around; align-items: center; margin-top: 8px; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="label-card">
                        <div class="title">${product?.product_name || "Product"}</div>
                        <div class="sku">SKU: ${product?.product_code || "N/A"}</div>
                        <div class="price">₹${product?.selling_price || product?.buying_price || 0}</div>
                        <div class="flex-row">
                            ${printContent.innerHTML}
                        </div>
                        <div style="font-size: 10px; color: #94a3b8; margin-top: 8px;">InventoryPro WMS Verified</div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!product) return null;

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <BarcodeOutlined className="text-indigo-600" />
                    <span>Product Barcode & QR Label</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Close
                </Button>,
                <Button
                    key="print"
                    type="primary"
                    icon={<PrinterOutlined />}
                    className="bg-indigo-600"
                    onClick={handlePrint}
                >
                    Print Label
                </Button>,
            ]}
            width={480}
        >
            <div className="py-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-base m-0 mb-1">
                        {product.product_name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mb-2">
                        SKU: {product.product_code} • {product.category_id?.category_name || "General"}
                    </div>
                    <div className="text-2xl font-black text-indigo-700 mb-3">
                        ₹{product.selling_price || product.buying_price || 0}
                    </div>

                    <div
                        id="printable-product-label"
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white p-3 rounded-lg border border-slate-200"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                <BarcodeOutlined /> 1D Barcode (Code128)
                            </span>
                            <BarcodeSvg code={product.product_code} height={40} width={1.6} />
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                <QrcodeOutlined /> 2D QR Code
                            </span>
                            <QRCode
                                value={JSON.stringify({
                                    sku: product.product_code,
                                    name: product.product_name,
                                    price: product.selling_price,
                                })}
                                size={80}
                                bordered={false}
                            />
                        </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3">
                        Compatible with standard USB & Bluetooth 1D/2D Barcode Scanners
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BarcodeSvg;

