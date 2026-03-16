import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { 
  children: ReactNode;
  resetKey?: string; // 라우트 변경 시 리셋용 key
}
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { 
    super(props); 
    this.state = { hasError: false }; 
  }

  static getDerivedStateFromError(error: Error) { 
    return { hasError: true, error }; 
  }

  // resetKey(라우트)가 바뀌면 에러 상태 리셋
  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) { 
    console.error('ErrorBoundary:', error, info); 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">문제가 발생했습니다</h1>
            <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.history.back()} 
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                뒤로가기
              </button>
              <button 
                onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
