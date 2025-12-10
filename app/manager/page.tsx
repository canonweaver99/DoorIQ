'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Lazy load tab components for better performance with error handling
const RepManagement = lazy(() => 
  import('@/components/manager/RepManagement').catch(err => {
    console.error('Failed to load RepManagement:', err)
    return { default: () => <div className="p-8 text-center text-red-400">Failed to load Rep Management</div> }
  })
)
const KnowledgeBase = lazy(() => 
  import('@/components/manager/KnowledgeBase').catch(err => {
    console.error('Failed to load KnowledgeBase:', err)
    return { default: () => <div className="p-8 text-center text-red-400">Failed to load Knowledge Base</div> }
  })
)
const AnalyticsDashboard = lazy(() => 
  import('@/components/manager/AnalyticsDashboard').catch(err => {
    console.error('Failed to load AnalyticsDashboard:', err)
    return { default: () => <div className="p-8 text-center text-red-400">Failed to load Analytics Dashboard</div> }
  })
)
const TrainingVideos = lazy(() => 
  import('@/components/manager/TrainingVideos').catch(err => {
    console.error('Failed to load TrainingVideos:', err)
    return { default: () => <div className="p-8 text-center text-red-400">Failed to load Training Videos</div> }
  })
)

type Tab = 'reps' | 'knowledge' | 'analytics' | 'settings' | 'videos'

const tabs = [
  { id: 'analytics' as Tab, name: 'Analytics', icon: BarChart3 },
  { id: 'reps' as Tab, name: 'Rep Management', icon: UserCog },
  { id: 'knowledge' as Tab, name: 'Knowledge Base', icon: Database },
  { id: 'videos' as Tab, name: 'Training Videos', icon: Video },
  { id: 'settings' as Tab, name: 'Settings', icon: Settings },
]

export default function ManagerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Redirect to dashboard - managers now use dashboard with extra tabs
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    
    // Map old manager tabs to new dashboard tabs
    const tabMap: Record<string, string> = {
      'analytics': 'manager', // Analytics goes to Manager Panel tab
      'reps': 'reps',
      'knowledge': 'knowledge',
      'videos': 'videos',
      'settings': 'settings'
    }
    
    const dashboardTab = tabParam && tabMap[tabParam] ? tabMap[tabParam] : 'manager'
    
    // Redirect to dashboard - tabs are handled by state, not URL params
    router.replace('/dashboard')
  }, [router])
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
    </div>
  )
}

// Legacy component kept for reference but not used
function ManagerPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { trigger } = useHaptic()
  const [timePeriod, setTimePeriod] = useState('30')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Initialize activeTab from URL parameter using lazy initializer to match server render
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam) && tabParam !== 'settings') {
      return tabParam
    }
    return 'analytics'
  })

  // Handle settings tab redirect and update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      // Redirect settings tab to actual settings page
      if (tabParam === 'settings') {
        router.push('/settings')
        return
      }
      if (tabParam !== activeTab) {
        setActiveTab(tabParam)
      }
    }
  }, [searchParams, activeTab, router])

  const handleTabClick = (tabId: Tab) => {
    // Redirect settings tab to actual settings page
    if (tabId === 'settings') {
      router.push('/settings')
      return
    }
    trigger('selection')
    setActiveTab(tabId)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Small delay to show refresh animation
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsRefreshing(false)
    // The pull-to-refresh component will handle the actual refresh
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reps':
        return (
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load Rep Management</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <RepManagement />
          </ErrorBoundary>
        )
      case 'knowledge':
        return (
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load Knowledge Base</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <KnowledgeBase />
          </ErrorBoundary>
        )
      case 'analytics':
        return (
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load Analytics Dashboard</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <AnalyticsDashboard timePeriod={timePeriod} />
          </ErrorBoundary>
        )
      case 'videos':
        return (
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load Training Videos</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <TrainingVideos />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load Analytics Dashboard</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <AnalyticsDashboard timePeriod={timePeriod} />
          </ErrorBoundary>
        )
    }
  }

  // Filter out settings tab for segmented control
  const visibleTabs = tabs.filter(tab => tab.id !== 'settings')

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a]"
      style={{
        paddingTop: isMobile ? `calc(env(safe-area-inset-top) + 1rem)` : '8rem',
        paddingBottom: isMobile ? `calc(env(safe-area-inset-bottom) + 1rem)` : '2rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem',
      }}
    >
      <div className="max-w-[1800px] mx-auto">
        {/* Sticky Header Section - iOS style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`mb-6 ${isMobile ? 'sticky top-0 z-40 pb-4' : ''}`}
          style={{
            paddingTop: isMobile ? 'env(safe-area-inset-top)' : '0',
            background: isMobile 
              ? 'rgba(10, 10, 10, 0.8)' 
              : 'transparent',
            backdropFilter: isMobile ? 'blur(40px) saturate(180%)' : 'none',
            WebkitBackdropFilter: isMobile ? 'blur(40px) saturate(180%)' : 'none',
          }}
        >
          {/* Title & Description */}
          <div>
            <h1 className={`font-bold text-white mb-2 font-space ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              Manager Panel
            </h1>
            <p className={`text-white/70 font-sans ${isMobile ? 'text-sm' : ''}`}>
              Oversee your team performance, manage reps, and track analytics
            </p>
          </div>
        </motion.div>

        {/* Tab Navigation - iOS segmented control on mobile */}
        <div className={`mb-6 ${isMobile ? '' : 'border-b border-[#2a2a2a] pb-2'}`}>
          {isMobile ? (
            <div className="space-y-4">
              <IOSSegmentedControl
                options={visibleTabs.map(tab => ({
                  value: tab.id,
                  label: tab.name,
                  icon: <tab.icon className="w-4 h-4" />
                }))}
                value={activeTab}
                onChange={(value) => handleTabClick(value as Tab)}
                size="md"
              />
              
              {/* Time Period Selector for Analytics - iOS style */}
              {activeTab === 'analytics' && (
                <div className="flex justify-center">
                  <select 
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-xl font-space appearance-none cursor-pointer min-h-[44px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="180">Last 6 Months</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleTabClick(tab.id)}
                      className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 font-space ${
                        isActive
                          ? 'text-white bg-[#1a1a1a]'
                          : 'text-[#888888] hover:text-[#bbbbbb]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                      
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBorder"
                          className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#a855f7]"
                          style={{ boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)' }}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
              
              {/* Time Period Selector - only show for Analytics tab */}
              {activeTab === 'analytics' && (
                <div className="flex items-center">
                  <select 
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="px-5 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm font-space"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="180">Last 6 Months</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Content with smooth transitions and pull-to-refresh on mobile */}
        <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              }>
                {renderTabContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </PullToRefresh>
      </div>
    </div>
  )
}

