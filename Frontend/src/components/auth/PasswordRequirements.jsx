import React from "react";
import { CheckCircleFilled, CloseCircleOutlined } from "@ant-design/icons";
import { getPasswordCriteria } from "../../utils/passwordValidator";

/**
 * UI Component displaying dynamic password checklist
 * Automatically updates checkmarks and micro strength progress bar as user types
 */
const PasswordRequirements = ({ password = "", showTitle = true, className = "" }) => {
    const criteria = getPasswordCriteria(password);
    const metCount = criteria.filter((c) => c.met).length;

    const strengthLabel =
        metCount === 5 ? "Strong" : metCount >= 3 ? "Medium" : metCount >= 1 ? "Weak" : "Too Short";

    const strengthColor =
        metCount === 5
            ? "bg-emerald-500"
            : metCount >= 3
            ? "bg-amber-400"
            : "bg-rose-400";

    return (
        <div
            className={`p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 text-xs space-y-2 mt-2 transition-all ${className}`}
        >
            {showTitle && (
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                    <span>Password must contain:</span>
                    <span
                        className={`text-[11px] font-bold ${
                            metCount === 5
                                ? "text-emerald-600"
                                : metCount >= 3
                                ? "text-amber-600"
                                : "text-slate-400"
                        }`}
                    >
                        {strengthLabel} ({metCount}/5)
                    </span>
                </div>
            )}

            {/* Micro strength bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                <div
                    className={`h-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${(metCount / 5) * 100}%` }}
                />
            </div>

            {/* Dynamic Checklist items */}
            <div className="space-y-1.5 pt-1">
                {criteria.map((item) => (
                    <div
                        key={item.key}
                        className={`flex items-center gap-2 transition-colors duration-200 ${
                            item.met ? "text-emerald-700 font-medium" : "text-slate-400"
                        }`}
                    >
                        {item.met ? (
                            <CheckCircleFilled className="text-emerald-500 text-sm shrink-0 transition-transform scale-110" />
                        ) : (
                            <CloseCircleOutlined className="text-slate-300 text-sm shrink-0" />
                        )}
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordRequirements;
