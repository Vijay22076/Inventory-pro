import React from "react";
import { Upload, Button, Tooltip, Tag, Typography } from "antd";
import {
    UploadOutlined,
    StarFilled,
    StarOutlined,
    DeleteOutlined,
    PictureOutlined,
    PlusOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ProductImageUpload = ({
    images = [],
    onAddFiles,
    onRemoveImage,
    onSetCover,
    maxCount = 8,
}) => {
    const handleFileChange = (info) => {
        const fileList = info.fileList || [];
        const rawFiles = fileList
            .map((f) => f.originFileObj)
            .filter(Boolean);

        if (rawFiles.length > 0 && onAddFiles) {
            onAddFiles(rawFiles);
        }
    };

    const primaryImage = images[0];

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                    <PictureOutlined className="text-indigo-600" />
                    Gallery Photos ({images.length} / {maxCount})
                </span>
                <span className="text-[11px] text-gray-400">
                    Max 5MB each • JPG, PNG, WebP
                </span>
            </div>

            {/* Main Primary / Cover Preview */}
            {primaryImage ? (
                <div className="relative w-full h-48 sm:h-52 bg-slate-900 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-sm group">
                    <img
                        src={primaryImage.url}
                        alt="Primary Cover"
                        className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-2.5 left-2.5">
                        <Tag
                            color="gold"
                            className="font-bold flex items-center gap-1 px-2.5 py-0.5 shadow-sm text-xs"
                        >
                            <StarFilled /> Primary Cover Photo
                        </Tag>
                    </div>
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="Remove photo">
                            <Button
                                danger
                                shape="circle"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => onRemoveImage && onRemoveImage(0)}
                                className="shadow-md"
                            />
                        </Tooltip>
                    </div>
                </div>
            ) : (
                <Upload
                    beforeUpload={() => false}
                    multiple={true}
                    accept="image/*"
                    showUploadList={false}
                    onChange={handleFileChange}
                    className="block w-full"
                >
                    <div className="w-full h-44 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/80 hover:border-indigo-400 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                            <UploadOutlined className="text-2xl" />
                        </div>
                        <Text strong className="text-sm text-gray-800 mb-0.5">
                            Click or drag to upload product images
                        </Text>
                        <Text className="text-xs text-gray-500 text-center">
                            Upload multiple images to showcase different angles and features
                        </Text>
                    </div>
                </Upload>
            )}

            {/* Thumbnail Grid */}
            {images.length > 0 && (
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>All Images (First is Cover)</span>
                        <span className="text-gray-400 font-normal">
                            Click ⭐ to set as cover
                        </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                        {images.map((item, index) => {
                            const isPrimary = index === 0;
                            return (
                                <div
                                    key={item.id || index}
                                    className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-slate-50 transition-all group ${
                                        isPrimary
                                            ? "border-amber-400 ring-2 ring-amber-200"
                                            : "border-gray-200 hover:border-indigo-300"
                                    }`}
                                >
                                    <img
                                        src={item.url}
                                        alt={`Product view ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Primary badge */}
                                    {isPrimary ? (
                                        <div className="absolute top-1 left-1 bg-amber-500 text-white p-0.5 rounded shadow">
                                            <StarFilled className="text-[10px]" />
                                        </div>
                                    ) : (
                                        <div className="absolute top-1 left-1 bg-black/60 text-white px-1.5 py-0.2 rounded text-[10px] font-mono">
                                            #{index + 1}
                                        </div>
                                    )}

                                    {/* Action buttons overlay on hover */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                        {!isPrimary && onSetCover && (
                                            <Tooltip title="Set as primary cover">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSetCover(index);
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 text-white flex items-center justify-center shadow-md transition-colors"
                                                >
                                                    <StarOutlined className="text-xs" />
                                                </button>
                                            </Tooltip>
                                        )}
                                        {onRemoveImage && (
                                            <Tooltip title="Remove photo">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveImage(index);
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
                                                >
                                                    <DeleteOutlined className="text-xs" />
                                                </button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add more button tile if under max count */}
                        {images.length < maxCount && (
                            <Upload
                                beforeUpload={() => false}
                                multiple={true}
                                accept="image/*"
                                showUploadList={false}
                                onChange={handleFileChange}
                                className="aspect-square block"
                            >
                                <div className="h-full w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-lg bg-gray-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-1">
                                    <PlusOutlined className="text-base text-gray-500 mb-1" />
                                    <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">
                                        Add Photo
                                    </span>
                                </div>
                            </Upload>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageUpload;
