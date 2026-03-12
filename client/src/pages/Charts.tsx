import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Music, Film, Tv, Mic2, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

interface ChartItem {
  id: string;
  chart_type: string;
  rank: number;
  title_ko: string;
  title_en?: string;
  artist: string;
  platform: string;
  thumbnail_url?: string;
  description: string;
  score?: number;
  chart_date: string;
  youtube_url?: string;
}

interface ApiResponse {
  success: boolean;
  type: string;
  date: string;
  data: ChartItem[];
}

const Charts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('drama');
  const [chartsData, setChartsData] = useState<{ [key: string]: ChartItem[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'drama', label: '🎬 드라마', icon: Tv },
    { id: 'music', label: '🎵 음악', icon: Music },
    { id: 'movie', label: '🎥 영화', icon: Film },
    { id: 'netflix', label: '📺 넷플릭스', icon: Tv },
    { id: 'youtube_korea', label: '▶️ 유튜브', icon: Mic2 },
  ];

  const fetchChartData = async (type: string) => {
    if (chartsData[type]) return; // Already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories?action=charts&type=${type}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setChartsData(prev => ({
          ...prev,
          [type]: data.data
        }));
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(activeTab);
  }, [activeTab]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg transform scale-110';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-md';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className="w-4 h-4 ml-1" />;
    }
    return null;
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'Netflix': 'bg-red-500 text-white',
      'tvN': 'bg-blue-500 text-white',
      'MBC': 'bg-green-500 text-white',
      'JTBC': 'bg-purple-500 text-white',
      'ENA': 'bg-pink-500 text-white',
      'Melon': 'bg-green-600 text-white',
      '극장': 'bg-gray-700 text-white',
      'KBS': 'bg-orange-500 text-white',
      'SBS': 'bg-red-600 text-white'
    };
    return colors[platform] || 'bg-gray-400 text-white';
  };

  const currentData = chartsData[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🏆 인기 차트
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              실시간 드라마, 음악, 영화 랭킹을 한눈에!
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                  }
                `}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">차트 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg inline-block">
              {error}
            </div>
          </div>
        )}

        {/* Charts Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {currentData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`
                      bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6
                      ${item.rank <= 3 ? 'ring-2 ring-blue-200' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg
                        ${getRankStyle(item.rank)}
                      `}>
                        {item.rank}
                        {getRankIcon(item.rank)}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title_ko}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => item.youtube_url && window.open(item.youtube_url, '_blank')}
                            onError={(e) => {
                              // Fallback to gradient if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                                  ${activeTab === 'music' ? '<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' : 
                                   activeTab === 'drama' || activeTab === 'netflix' ? '<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7.15l6 3.15-6 3.15V8.85z"/></svg>' :
                                   '<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'}
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                            {activeTab === 'music' && <Music className="w-6 h-6 text-gray-500" />}
                            {activeTab === 'drama' && <Tv className="w-6 h-6 text-gray-500" />}
                            {activeTab === 'movie' && <Film className="w-6 h-6 text-gray-500" />}
                            {activeTab === 'netflix' && <Tv className="w-6 h-6 text-gray-500" />}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {item.title_ko}
                            </h3>
                            {item.title_en && (
                              <p className="text-sm text-gray-500 mb-2">{item.title_en}</p>
                            )}
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(item.platform)}`}>
                                {item.platform}
                              </span>
                              {item.score && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{item.score}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{item.artist}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-500 text-sm flex-1">{item.description}</p>
                              {item.youtube_url && (
                                <a
                                  href={item.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-full transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                  영상
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Keywords */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  지금 뜨는 키워드
                </h3>
                <div className="space-y-2">
                  {['로맨틱 코미디', '액션 스릴러', 'K-POP', '넷플릭스 오리지널', '사극'].map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{keyword}</span>
                      <span className="text-xs text-green-600 font-medium">+{Math.floor(Math.random() * 50 + 10)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* This Week's New Releases */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  이번주 신작
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-sm">캐셔로</p>
                    <p className="text-xs text-gray-500">Netflix 신작 드라마</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="font-medium text-sm">404 (New Era)</p>
                    <p className="text-xs text-gray-500">키키 신곡 발매</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-3">
                    <p className="font-medium text-sm">왕과 사는 남자</p>
                    <p className="text-xs text-gray-500">극장가 화제작</p>
                  </div>
                </div>
              </div>

              {/* Chart Info */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">차트 정보</h3>
                <p className="text-sm opacity-90">
                  실시간 데이터 기반으로 업데이트되는 인기 콘텐츠 순위입니다.
                </p>
                <p className="text-xs mt-3 opacity-75">
                  마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;