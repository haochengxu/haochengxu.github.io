// pages/play-lab.tsx 或 pages/play-lab/index.tsx

import React from 'react'
import Link from 'next/link'

const PlayLab = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome to PlayLab!</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/projects/tiny" className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-400">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">📊</div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">项目追踪器</h2>
                                <p className="text-gray-600 text-sm">追踪和管理你的项目迭代</p>
                            </div>
                        </div>
                    </Link>
                    
                    <Link href="/projects/sleep-breath-counter" className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-400">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">⏱️</div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">多段计时器</h2>
                                <p className="text-gray-600 text-sm">呼吸练习和分段计时工具</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PlayLab