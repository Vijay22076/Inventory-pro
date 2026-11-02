import { ApiError } from "../utils/ApiError.js";

/**
 * Centralized Enterprise Error Handling Middleware
 * Intercepts all operational, validation, database, and system errors
 * and formats them into a predictable, client-friendly JSON structure.
 */
const errorHandler = (err, req, res, _next) => {
    let error = err;

    // 1. If not already an ApiError instance, convert standard errors into ApiError
    if (!(error instanceof ApiError)) {
        let statusCode = error.statusCode || error.status || 500;
        let message = error.message || "Internal Server Error";
        let errors = [];

        // Mongoose Schema Validation Error (e.g., missing required fields, enum failure)
        if (err.name === "ValidationError") {
            statusCode = 400;
            errors = Object.values(err.errors || {}).map((e) => e.message);
            message = errors.length > 0 ? errors.join("; ") : "Schema validation failed";
        }
        // Mongoose CastError (e.g., malformed ObjectId format in URL path)
        else if (err.name === "CastError") {
            statusCode = 400;
            message = `Resource not found. Invalid format for field "${err.path}": ${err.value}`;
        }
        // MongoDB Duplicate Key Error (E11000)
        else if (err.code === 11000) {
            statusCode = 409;
            const field = Object.keys(err.keyValue || {})[0] || "field";
            const val = err.keyValue ? err.keyValue[field] : "";
            message = `Duplicate value '${val}' entered for unique field '${field}'. Please provide a unique value.`;
        }
        // JWT Authentication Errors
        else if (err.name === "JsonWebTokenError") {
            statusCode = 401;
            message = "Authentication failed. Token is invalid or malformed.";
        } else if (err.name === "TokenExpiredError") {
            statusCode = 401;
            message = "Authentication session expired. Please log in again.";
        }
        // Malformed Request JSON Syntax Error (body-parser)
        else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
            statusCode = 400;
            message = "Malformed JSON payload provided in request body.";
        }
        // Multer File Upload Errors
        else if (err.name === "MulterError") {
            statusCode = 400;
            message = `File upload error: ${err.message}`;
        }

        error = new ApiError(statusCode, message, errors, err.stack);
    }

    // 2. Format consistent JSON response envelope
    const responsePayload = {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors || [],
    };

    // Attach debug stack trace only during local development
    if (process.env.NODE_ENV === "development") {
        responsePayload.stack = error.stack;
    }

    // Log unexpected 500 errors to terminal for operational observability
    if (error.statusCode >= 500) {
        console.error(`🚨 [500 Server Error] ${req.method} ${req.originalUrl}:`, err);
    }

    return res.status(error.statusCode).json(responsePayload);
};

export default errorHandler;
