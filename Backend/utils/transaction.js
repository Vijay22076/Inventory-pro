import mongoose from "mongoose";

/**
 * Checks if current MongoDB connection supports multi-document transactions.
 * Transactions require a replica set (ReplicaSetWithPrimary) or mongos (Sharded).
 */
export const supportsTransactions = () => {
    try {
        const topologyType =
            mongoose.connection.client?.topology?.description?.type;
        return (
            topologyType === "ReplicaSetWithPrimary" ||
            topologyType === "Sharded"
        );
    } catch {
        return false;
    }
};

/**
 * Runs an async operation with a MongoDB session/transaction if supported.
 * Falls back cleanly to running without a session on standalone instances.
 */
export const runWithOptionalTransaction = async (workFn) => {
    const canUseTx = supportsTransactions();
    let session = null;

    if (canUseTx) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (err) {
            session = null;
        }
    }

    try {
        const result = await workFn(session);
        if (session) {
            await session.commitTransaction();
        }
        return result;
    } catch (err) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (_) {}
        }
        throw err;
    } finally {
        if (session) {
            session.endSession();
        }
    }
};
