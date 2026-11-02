import React, { Component } from "react";
import { Result, Button } from "antd";
import { ReloadOutlined, HomeOutlined } from "@ant-design/icons";

/**
 * Enterprise React Error Boundary
 * Prevents unexpected client-side JavaScript rendering exceptions from crashing the entire application into a blank white screen.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("🚨 Uncaught React Component Exception:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                        <Result
                            status="500"
                            title="Application Encountered An Unexpected State"
                            subTitle={
                                <div className="text-slate-500 text-sm mt-2">
                                    We apologize for the inconvenience. The system trapped a rendering error safely to protect your active session.
                                </div>
                            }
                            extra={[
                                <Button
                                    key="reload"
                                    type="primary"
                                    icon={<ReloadOutlined />}
                                    onClick={this.handleReload}
                                    className="bg-indigo-600 rounded-xl"
                                >
                                    Reload Page
                                </Button>,
                                <Button
                                    key="home"
                                    icon={<HomeOutlined />}
                                    onClick={this.handleGoHome}
                                    className="rounded-xl"
                                >
                                    Return to Home
                                </Button>,
                            ]}
                        />
                        {import.meta.env?.DEV && this.state.error && (
                            <div className="mt-6 text-left p-4 bg-slate-900 text-red-400 rounded-xl text-xs font-mono overflow-auto max-h-48 border border-slate-800">
                                <strong>Error:</strong> {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
