/**
 * Password validation utilities enforcing strict security requirements:
 * 1. Minimum 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one number (0-9)
 * 5. At least one special character (@ $ ! % * ? & # etc.)
 */

export const getPasswordCriteria = (password = "") => {
    const val = typeof password === "string" ? password : "";
    return [
        {
            key: "length",
            label: "At least 8 characters",
            met: val.length >= 8,
        },
        {
            key: "upper",
            label: "One uppercase letter (A-Z)",
            met: /[A-Z]/.test(val),
        },
        {
            key: "lower",
            label: "One lowercase letter (a-z)",
            met: /[a-z]/.test(val),
        },
        {
            key: "number",
            label: "One number (0-9)",
            met: /[0-9]/.test(val),
        },
        {
            key: "special",
            label: "One special character (@$!%*?&#)",
            met: /[@$!%*?&#^()_+=\-[\]{}|;:'",.<>/`~]/.test(val),
        },
    ];
};

/**
 * Check if a password meets all 5 requirements
 */
export const isPasswordValid = (password = "") => {
    return getPasswordCriteria(password).every((item) => item.met);
};

/**
 * Form validator rule for Ant Design forms
 */
export const validateStrongPassword = (_, value) => {
    if (!value) {
        return Promise.reject(new Error("Please enter your password"));
    }
    const criteria = getPasswordCriteria(value);
    const unmet = criteria.filter((c) => !c.met);
    if (unmet.length > 0) {
        return Promise.reject(
            new Error("Password does not meet all security requirements below")
        );
    }
    return Promise.resolve();
};
