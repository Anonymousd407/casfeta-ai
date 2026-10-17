import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Eye,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FileText,
  Filter,
  FolderOpen,
  Grid2X2,
  Info,
  Kanban,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Menu,
  ListFilter,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  ScanText,
  Search,
  Share2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Table2,
  Trash2,
  UploadCloud,
  Waypoints,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const sample = `SERVICE AGREEMENT

1. TERM AND RENEWAL
This agreement shall automatically renew for an additional 12 months unless cancelled 60 days before renewal.

2. PAYMENTS
All fees are non-refundable and must be paid in advance.

3. TERMINATION
The vendor may terminate this agreement at its sole discretion without notice.

4. LIABILITY
The customer accepts unlimited liability for all damages arising from the service.

5. DATA
We may share your personal data with any partners for marketing purposes.

6. DISPUTES
Disputes are subject to binding arbitration.`

const severityColor = {
  high: '#b84b59',
  medium: '#b47720',
  low: '#1c8176',
}

const pageMeta = {
  dashboard: { label: 'Overview', eyebrow: 'REVIEW DESK' },
  analyze: { label: 'Analyze contract', eyebrow: 'NEW REVIEW' },
  library: { label: 'Contracts library', eyebrow: 'YOUR DOCUMENTS' },
  history: { label: 'Risk reports', eyebrow: 'EVIDENCE REVIEW' },
  report: { label: 'Risk report', eyebrow: 'EVIDENCE REVIEW' },
  pipeline: { label: 'Review pipeline', eyebrow: 'REVIEW OPERATIONS' },
  settings: { label: 'Settings', eyebrow: 'WORKSPACE' },
}

async function api(path, options = {}) {
  const response = await fetch('/api' + path, options)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // Keep the status message when the server did not return JSON.
    }
    throw new Error(message)
  }
  return response
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const engineLabel = (engine) => engine === 'rules+ai' ? 'Rules + AI' : 'Rules'

function Logo() {
  return (
    <div className="brand" aria-label="CASFETA ContractShield AI">
      <div className="brand-mark"><ShieldCheck size={21} strokeWidth={2.4} /></div>
      <div className="brand-copy">
        <strong>CASFETA <span>AI</span></strong>
        <small>CONTRACTSHIELD</small>
      </div>
    </div>
  )
}

function Badge({ level, children }) {
  return <span className={`badge ${level || ''}`}>{children || level}</span>
}

function IconButton({ label, children, className = '', ...props }) {
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

function EmptyState({ icon: Icon = FileText, title, message, action, actionLabel = 'Start an analysis', compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <div className="empty-mark"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <button type="button" className="text-action" onClick={action}>{actionLabel} <ArrowUpRight size={14} /></button>}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

function ReportLoadingState() {
  return (
    <div className="report-loading" role="status" aria-live="polite">
      <div className="report-loading-mark"><RefreshCw size={20} className="spin" /></div>
      <div>
        <strong>Opening risk report</strong>
        <p>Loading the saved findings and evidence excerpts…</p>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('Service Agreement')
  const [file, setFile] = useState(null)
  const [ai, setAi] = useState(false)
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSource, setReportSource] = useState('')
  const [reportSourceLabel, setReportSourceLabel] = useState('')
  const [activeFinding, setActiveFinding] = useState(0)
  const [historyQuery, setHistoryQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [apiStatus, setApiStatus] = useState('checking')
  const fileRef = useRef(null)
  const searchWrapRef = useRef(null)
  const searchInputRef = useRef(null)

  async function refresh() {
    setHistoryLoading(true)
    try {
      const response = await api('/history')
      setHistory(await response.json())
      setApiStatus('online')
    } catch {
      setApiStatus('offline')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const closeSearch = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', closeSearch)
    return () => document.removeEventListener('mousedown', closeSearch)
  }, [])

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(Boolean(historyQuery.trim()))
      }
    }
    document.addEventListener('keydown', focusSearch)
    return () => document.removeEventListener('keydown', focusSearch)
  }, [historyQuery])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    const high = history.filter((item) => item.level === 'high').length
    const medium = history.filter((item) => item.level === 'medium').length
    const low = history.filter((item) => item.level === 'low').length
    return {
      total: history.length,
      high,
      medium,
      low,
      average: history.length
        ? Math.round(history.reduce((total, item) => total + item.score, 0) / history.length)
        : 0,
      distribution: [
        { name: 'High risk', key: 'high', value: high, color: severityColor.high },
        { name: 'Medium risk', key: 'medium', value: medium, color: severityColor.medium },
        { name: 'Low risk', key: 'low', value: low, color: severityColor.low },
      ],
    }
  }, [history])

  const chartData = useMemo(
    () => history.slice(0, 12).reverse().map((item, index) => ({
      ...item,
      name: `R${index + 1}`,
    })),
    [history],
  )

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    if (!query) return history
    return history.filter((item) => `${item.title} ${item.level} ${item.engine}`.toLowerCase().includes(query))
  }, [history, historyQuery])

  const searchResults = useMemo(() => filteredHistory.slice(0, 5), [filteredHistory])

  function navigate(nextPage) {
    setError('')
    setPage(nextPage)
    setSidebarOpen(false)
    setSearchOpen(false)
    if (['dashboard', 'history', 'library', 'pipeline'].includes(nextPage)) refresh()
  }

  async function shareReport(currentReport) {
    if (!currentReport) return
    const shareText = `CASFETA ContractShield report: ${currentReport.title} (${currentReport.id})`
    try {
      if (navigator.share) {
        await navigator.share({ title: currentReport.title, text: shareText })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        setToast('Report reference copied to the clipboard.')
      } else {
        setToast(shareText)
      }
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError('The report could not be shared from this browser.')
    }
  }

  function selectFile(nextFile) {
    if (!nextFile) return
    setFile(nextFile)
    setError('')
    setDragActive(false)
  }

  function clearFile() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function analyze() {
    setError('')
    const cleanText = text.trim()
    if (!file && cleanText.length < 30) {
      setError('Add at least 30 characters or choose a document.')
      return
    }

    setLoading(true)
    try {
      let response
      if (file) {
        const form = new FormData()
        form.append('file', file)
        response = await api('/analyze/file', { method: 'POST', body: form })
      } else {
        response = await api('/analyze/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, title, use_ai: ai }),
        })
      }

      const data = await response.json()
      setReport(data)
      setReportLoading(false)
      setActiveFinding(0)
      setReportSource(file ? '' : cleanText)
      setReportSourceLabel(file ? file.name : 'Pasted contract text')
      setPage('report')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function openReport(id) {
    setError('')
    setSearchOpen(false)
    setReportLoading(true)
    setReport(null)
    setReportSource('')
    setPage('report')
    try {
      const response = await api(`/reports/${id}`)
      const data = await response.json()
      setReport(data)
      setActiveFinding(0)
      setReportSource('')
      setReportSourceLabel('Stored evidence excerpts')
      setSidebarOpen(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setReportLoading(false)
    }
  }

  async function removeReport(id) {
    if (!window.confirm('Delete this report permanently?')) return
    try {
      await api(`/reports/${id}`, { method: 'DELETE' })
      if (report?.id === id) {
        setReport(null)
        setReportSource('')
        setPage('history')
      }
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const navItems = [
    ['dashboard', LayoutDashboard, 'Overview'],
    ['analyze', ScanText, 'Analyze contract'],
    ['library', FolderOpen, 'Contracts library'],
    ['history', Clock3, 'Risk reports'],
    ['pipeline', Kanban, 'Review pipeline'],
    ['settings', Settings2, 'Settings'],
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Logo />
        <div className="sidebar-rule" />
        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map(([key, Icon, label]) => (
            <button
              type="button"
              key={key}
              className={`nav-item ${page === key || (key === 'history' && page === 'report') ? 'active' : ''}`}
              onClick={() => navigate(key)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {(page === key || (key === 'history' && page === 'report')) && <span className="active-rail" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="note-icon"><FileCheck2 size={16} /></div>
          <div>
            <strong>Evidence first</strong>
            <p>Every indicator stays tied to a source excerpt.</p>
          </div>
        </div>
        <button type="button" className="sidebar-cta" onClick={() => navigate('analyze')}>
          <Plus size={16} /> New analysis
        </button>
        <div className="workspace-profile">
          <div className="profile-avatar">C</div>
          <div>
            <strong>CASFETA Team</strong>
            <span>Local workspace</span>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <IconButton label="Open navigation" className="mobile-only" onClick={() => setSidebarOpen(true)}><Menu size={20} /></IconButton>
            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{pageMeta[page].label}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <div className="search-wrap" ref={searchWrapRef}>
              <label className="global-search">
                <Search size={16} />
                <input
                  ref={searchInputRef}
                  value={historyQuery}
                  onFocus={() => setSearchOpen(Boolean(historyQuery.trim()))}
                  onChange={(event) => { setHistoryQuery(event.target.value); setSearchOpen(true) }}
                  onKeyDown={(event) => { if (event.key === 'Enter') navigate('history'); if (event.key === 'Escape') setSearchOpen(false) }}
                  placeholder="Search contracts or reports"
                  aria-label="Search contracts or reports"
                  aria-expanded={searchOpen}
                  aria-controls="report-search-results"
                />
                <kbd>Ctrl K</kbd>
              </label>
              {searchOpen && historyQuery.trim() && (
                <div id="report-search-results" className="search-popover" role="listbox" aria-label="Matching saved reports">
                  {searchResults.length ? searchResults.map((item) => (
                    <button type="button" role="option" className="search-result" key={item.id} onClick={() => openReport(item.id)}>
                      <span className="document-icon"><FileText size={15} /></span>
                      <span><strong>{item.title}</strong><small>{formatDate(item.created_at)} · {item.score}/100</small></span>
                      <ChevronRight size={14} />
                    </button>
                  )) : <div className="search-empty"><Search size={15} /><span>No saved reports match “{historyQuery.trim()}”.</span></div>}
                  <button type="button" className="search-all" onClick={() => navigate('history')}>View all report history <ArrowUpRight size={13} /></button>
                </div>
              )}
            </div>
            <div className="system-state">
              <span className={`state-dot ${apiStatus}`} />
              <span>{apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Offline' : 'Connecting'}</span>
            </div>
            <IconButton label="Workspace notifications" onClick={() => setToast(apiStatus === 'online' ? 'No new workspace notifications.' : 'Notifications are unavailable while the API is offline.')}><Bell size={17} /></IconButton>
            <div className="top-avatar" aria-label="CASFETA Team">C</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error-banner" role="alert">
              <div className="error-icon"><AlertTriangle size={16} /></div>
              <div><strong>Something needs attention</strong><span>{error}</span></div>
              <IconButton label="Dismiss error" onClick={() => setError('')}><X size={16} /></IconButton>
            </div>
          )}

          {page === 'dashboard' && (
            <OverviewPage
              history={history}
              stats={stats}
              chartData={chartData}
              historyLoading={historyLoading}
              onNavigate={navigate}
              onOpenReport={openReport}
            />
          )}

          {page === 'analyze' && (
            <AnalyzePage
              text={text}
              setText={setText}
              title={title}
              setTitle={setTitle}
              file={file}
              fileRef={fileRef}
              ai={ai}
              setAi={setAi}
              loading={loading}
              dragActive={dragActive}
              setDragActive={setDragActive}
              onSelectFile={selectFile}
              onClearFile={clearFile}
              onAnalyze={analyze}
              onLoadSample={() => { setText(sample); setTitle('Service Agreement'); clearFile(); setError('') }}
            />
          )}

          {page === 'report' && reportLoading && <ReportLoadingState />}

          {page === 'report' && !reportLoading && report && (
            <ReportPage
              report={report}
              source={reportSource}
              sourceLabel={reportSourceLabel}
              activeFinding={activeFinding}
              setActiveFinding={setActiveFinding}
              onBack={() => navigate('history')}
              onAnalyze={() => navigate('analyze')}
              onShare={() => shareReport(report)}
            />
          )}

          {page === 'report' && !reportLoading && !report && (
            <EmptyState
              icon={FileCheck2}
              title="No report selected"
              message="Choose a saved report from your history or start a new analysis."
              action={() => navigate('history')}
              actionLabel="Open history"
            />
          )}

          {page === 'history' && (
            <HistoryPage
              history={filteredHistory}
              total={history.length}
              query={historyQuery}
              loading={historyLoading}
              onRefresh={refresh}
              onNavigate={navigate}
              onOpenReport={openReport}
              onDelete={removeReport}
            />
          )}

          {page === 'library' && (
            <LibraryPage
              history={filteredHistory}
              total={history.length}
              query={historyQuery}
              loading={historyLoading}
              onRefresh={refresh}
              onNavigate={navigate}
              onOpenReport={openReport}
              onDelete={removeReport}
            />
          )}

          {page === 'pipeline' && (
            <ReviewPipelinePage
              history={history}
              loading={historyLoading}
              onRefresh={refresh}
              onNavigate={navigate}
              onOpenReport={openReport}
            />
          )}

          {page === 'settings' && <SettingsPage />}
        </div>

        {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={15} />{toast}</div>}

        <footer className="app-footer">
          <span>© 2026 CASFETA · ContractShield AI</span>
          <span>Educational screening only <ShieldCheck size={13} /></span>
        </footer>
      </main>
    </div>
  )
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}<span /></div>
        <h1>{title}</h1>
        <p className="intro-copy">{description}</p>
      </div>
      {action}
    </div>
  )
}

function OverviewPage({ history, stats, chartData, historyLoading, onNavigate, onOpenReport }) {
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const selectedActivity = chartData.find((item) => item.id === selectedActivityId) || null
  const latestReport = history[0]
  const reviewQueue = history.slice().sort((left, right) => (right.score || 0) - (left.score || 0)).slice(0, 5)

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="eyebrow">WORKSPACE OVERVIEW<span /></div>
          <h1>Contract intelligence<br /><em>for safer decisions.</em></h1>
          <p>Analyze, review and manage contracts with evidence-linked risk detection and practical next steps.</p>
          <button type="button" className="button primary-button" onClick={() => onNavigate('analyze')}><ScanText size={16} /> Analyze contract <ArrowUpRight size={15} /></button>
        </div>
        <div className="dashboard-hero-visual" aria-hidden="true">
          <div className="hero-back-sheet hero-back-sheet-one" />
          <div className="hero-back-sheet hero-back-sheet-two" />
          <div className="hero-document"><div className="hero-document-top"><FileText size={16} /><span>CONTRACTSHIELD</span></div><div className="hero-document-title" /><i /><i /><i className="short" /><div className="hero-document-highlight"><span /><span /></div><div className="hero-document-seal"><ShieldCheck size={18} /></div></div>
          <div className="hero-callout"><ShieldCheck size={14} /> Evidence-linked review</div>
        </div>
      </section>

      <section className="dashboard-kpis" aria-label="Workspace metrics">
        <DashboardMetric icon={FileText} label="Contracts analyzed" value={historyLoading ? <Skeleton className="value-skeleton" /> : stats.total} detail="Saved screening records" tone="teal" />
        <DashboardMetric icon={ShieldAlert} label="High-risk reports" value={historyLoading ? <Skeleton className="value-skeleton" /> : stats.high} detail="Requires closer review" tone="rose" />
        <DashboardMetric icon={BarChart3} label="Average risk score" value={historyLoading ? <Skeleton className="value-skeleton" /> : `${stats.average}/100`} detail="Across saved reports" tone="blue" />
        <DashboardMetric icon={CalendarDays} label="Latest review" value={historyLoading ? <Skeleton className="date-skeleton" /> : latestReport ? formatDate(latestReport.created_at) : '—'} detail={latestReport?.title || 'Nothing reviewed yet'} tone="ochre" />
      </section>

      <section className="dashboard-analytics-grid">
        <div className="panel dashboard-chart-card">
          <div className="panel-heading">
            <div><div className="section-kicker">ANALYSIS ACTIVITY</div><h2>Risk score over time</h2><p>Saved report activity from the local workspace</p></div>
            <div className="chart-context"><Activity size={15} /><span>{chartData.length ? `Last ${chartData.length} reports` : 'No activity'}</span></div>
          </div>
          {historyLoading ? <div className="chart-skeleton"><Skeleton /><Skeleton /><Skeleton /></div> : chartData.length ? (
            <>
              <div className="chart-wrap chart-wrap-command">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -26, bottom: 0 }} onClick={(event) => { const point = event?.activePayload?.[0]?.payload; if (point) setSelectedActivityId(point.id) }}>
                    <defs><linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#268d82" stopOpacity=".26" /><stop offset="100%" stopColor="#268d82" stopOpacity="0" /></linearGradient></defs>
                    <CartesianGrid stroke="#e3e8e8" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#8a9699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8a9699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ActivityTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#1c8176" strokeWidth={2.5} fill="url(#riskFill)" activeDot={{ r: 5, fill: '#b47720', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="activity-selection" aria-live="polite">
                {selectedActivity ? <><div><span className="selection-label">SELECTED REPORT</span><strong>{selectedActivity.title}</strong><span>{formatDate(selectedActivity.created_at)} · {selectedActivity.score}/100 · {selectedActivity.level}</span></div><button type="button" className="text-action" onClick={() => onOpenReport(selectedActivity.id)}>Open report <ArrowUpRight size={13} /></button></> : <span className="selection-hint">Select a point to inspect its report details.</span>}
              </div>
            </>
          ) : (
            <EmptyState compact icon={BarChart3} title="No screening activity" message="Analyze a contract to start building a real report trend." action={() => onNavigate('analyze')} />
          )}
        </div>

        <div className="panel risk-distribution-card">
          <div className="panel-heading">
            <div><div className="section-kicker">RISK DISTRIBUTION</div><h2>Saved screening levels</h2><p>Derived from completed local reports</p></div>
            <ShieldCheck size={18} className="panel-heading-icon" />
          </div>
          {historyLoading ? <div className="donut-skeleton"><Skeleton /><div><Skeleton /><Skeleton /><Skeleton /></div></div> : stats.total ? <div className="risk-distribution-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.distribution} dataKey="value" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3} stroke="#fff" strokeWidth={3}>{stats.distribution.map((item) => <Cell key={item.key} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>{stats.total}</strong><span>Reports</span></div></div><div className="distribution-list">{stats.distribution.map((item) => <div className="distribution-item" key={item.key}><span className="distribution-label"><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}</strong><small>{stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : '0%'}</small></div>)}</div></div> : <EmptyState compact icon={BarChart3} title="No risk distribution" message="Analyze a contract to populate screening levels." action={() => onNavigate('analyze')} />}
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <div className="panel recent-analyses-card">
          <div className="panel-heading"><div><div className="section-kicker">RECENT ANALYSES</div><h2>Saved screening results</h2><p>Open any report to inspect its evidence</p></div><button type="button" className="text-action" onClick={() => onNavigate('library')}>View library <ArrowUpRight size={13} /></button></div>
          {historyLoading ? <div className="recent-skeletons"><Skeleton /><Skeleton /><Skeleton /></div> : history.length ? <div className="dashboard-table"><div className="dashboard-table-head"><span>DOCUMENT</span><span>RISK</span><span>DATE</span><span>MODE</span></div>{history.slice(0, 5).map((item) => <button type="button" key={item.id} className="dashboard-table-row" onClick={() => onOpenReport(item.id)}><span className="dashboard-document"><span className="document-icon"><FileText size={15} /></span><strong>{item.title}</strong></span><Badge level={item.level}>{item.level}</Badge><span>{formatDate(item.created_at)}</span><span className="table-muted">{engineLabel(item.engine)}</span></button>)}</div> : <EmptyState compact icon={FileText} title="No saved reports" message="Your report activity will appear here after the first analysis." action={() => onNavigate('analyze')} />}
        </div>
        <div className="panel review-queue-card">
          <div className="panel-heading"><div><div className="section-kicker">REVIEW QUEUE</div><h2>Highest screening signals</h2><p>Sorted by actual risk score</p></div><button type="button" className="text-action" onClick={() => onNavigate('pipeline')}>Open pipeline <ArrowUpRight size={13} /></button></div>
          {historyLoading ? <div className="recent-skeletons"><Skeleton /><Skeleton /><Skeleton /></div> : reviewQueue.length ? <div className="review-queue-list">{reviewQueue.map((item) => <button type="button" className="review-queue-item" key={item.id} onClick={() => onOpenReport(item.id)}><span className={`queue-score ${item.level}`}>{item.score}</span><span className="recent-copy"><strong>{item.title}</strong><span>{formatDate(item.created_at)} · {engineLabel(item.engine)}</span></span><Badge level={item.level}>{item.level}</Badge><ChevronRight size={14} /></button>)}</div> : <EmptyState compact icon={ClipboardList} title="Nothing in the queue" message="Saved screening results will be ranked here." action={() => onNavigate('analyze')} />}
        </div>
      </section>
    </>
  )
}

function ActivityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return <div className="activity-tooltip"><strong>{item.title}</strong><span>{formatDate(item.created_at)}</span><b>{item.score}/100 · {item.level}</b></div>
}

function CommandKpi({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="command-kpi">
      <div className="kpi-topline"><div className={`stat-icon ${tone}`}><Icon size={17} /></div><span className="kpi-rule" /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail" title={detail}>{detail}</div>
    </div>
  )
}

function DashboardMetric({ icon: Icon, label, value, detail, tone }) {
  return <div className="dashboard-metric"><div className={`metric-icon ${tone}`}><Icon size={17} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small title={detail}>{detail}</small></div></div>
}

function AnalyzePage({ text, setText, title, setTitle, file, fileRef, ai, setAi, loading, dragActive, setDragActive, onSelectFile, onClearFile, onAnalyze, onLoadSample }) {
  return (
    <>
      <PageIntro
        eyebrow="NEW REVIEW"
        title="Analyze a contract"
        description="Upload a document or paste its text. ContractShield returns predefined indicators with the source evidence kept in view."
      />

      <div className="analysis-layout">
        <section className="panel input-panel" aria-busy={loading}>
          <div className="panel-heading input-heading">
            <div><div className="section-kicker">STEP 01 / DOCUMENT</div><h2>Bring in a contract</h2><p>PDF, DOCX or TXT · maximum 5 MB</p></div>
            <span className="step-badge">INPUT</span>
          </div>

          <div className="analysis-mode-strip" aria-label="Analysis mode">
            <div className="mode-indicator"><ShieldCheck size={16} /><span><strong>Rules engine active</strong><small>Evidence-linked pattern screening</small></span></div>
            <span className="mode-divider" />
            <div className="mode-indicator optional"><Sparkles size={16} /><span><strong>AI notes optional</strong><small>Available for pasted text with a configured key</small></span></div>
          </div>

          <input
            ref={fileRef}
            id="contract-file"
            type="file"
            accept=".pdf,.docx,.txt"
            hidden
            onChange={(event) => onSelectFile(event.target.files?.[0])}
          />
          <div
            className={`drop-zone ${file ? 'has-file' : ''} ${dragActive ? 'drag-active' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => { event.preventDefault(); onSelectFile(event.dataTransfer.files?.[0]) }}
            role="button"
            tabIndex={0}
            aria-label={file ? `Selected file ${file.name}. Activate to choose a different file.` : 'Choose a contract file to upload.'}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileRef.current?.click() } }}
          >
            <div className="upload-mark"><UploadCloud size={23} /></div>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <p>{formatBytes(file.size)} selected · ready to scan</p>
              </>
            ) : (
              <>
                <strong>Drop your contract here</strong>
                <p>or <span>browse files</span> from your device</p>
              </>
            )}
          </div>
          {file && <button type="button" className="remove-file" onClick={onClearFile}><X size={13} /> Remove file</button>}

          <div className="input-divider"><span /> <small>OR PASTE TEXT</small> <span /></div>

          <label className="field-label" htmlFor="contract-title">Document title</label>
          <input id="contract-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />

          <div className="field-row">
            <label className="field-label" htmlFor="contract-text">Contract text</label>
            <button type="button" className="text-action" onClick={onLoadSample}>Load sample <ArrowUpRight size={13} /></button>
          </div>
          <textarea
            id="contract-text"
            className="contract-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste the full text of your contract here..."
            rows={12}
            disabled={Boolean(file)}
          />
          <div className="input-meta">
            <span>{file ? 'File upload selected' : `${text.length.toLocaleString()} / 200,000 characters`}</span>
            <span><LockKeyhole size={13} /> Original files are not stored</span>
          </div>

          <div className="ai-option">
            <div className="ai-option-icon"><Sparkles size={18} /></div>
            <div className="ai-option-copy"><strong>AI-assisted notes</strong><p>Optional explanatory questions based only on verified evidence. Requires a server API key.</p></div>
            <label className="toggle" aria-label="Enable AI-assisted notes">
              <input type="checkbox" aria-label="Enable AI-assisted notes" checked={ai} disabled={Boolean(file)} onChange={(event) => setAi(event.target.checked)} />
              <span />
            </label>
          </div>
          {file && ai && <p className="field-note">AI notes are available for pasted text only in this MVP.</p>}

          {loading && (
            <div className="loading-card" role="status">
              <RefreshCw size={17} className="spin" />
              <div><strong>Running evidence scan</strong><span>Reading the document and matching predefined indicators…</span></div>
            </div>
          )}
          <button type="button" className="button primary-button analyze-button" onClick={onAnalyze} disabled={loading || (!file && text.trim().length < 30)}>
            {loading ? <><RefreshCw size={17} className="spin" /> Analyzing contract…</> : <><ScanText size={17} /> Analyze contract <ArrowUpRight size={16} /></>}
          </button>
        </section>

        <aside className="analysis-rail">
          <div className="panel scope-card">
            <div className="rail-icon"><ShieldCheck size={20} /></div>
            <div className="section-kicker">SCREENING SCOPE</div>
            <h2>What we look for</h2>
            <p>Predefined patterns surface language worth a closer read.</p>
            <ul className="scope-list">
              {['Termination rights', 'Automatic renewal', 'Liability exposure', 'Payment restrictions', 'Data sharing', 'Dispute clauses'].map((item) => <li key={item}><Check size={15} />{item}</li>)}
            </ul>
          </div>
          <div className="privacy-card">
            <div className="privacy-head"><LockKeyhole size={16} /><strong>Local-first by design</strong></div>
            <p>Reports and evidence snippets are saved to the local SQLite database. Uploaded originals are processed in memory only.</p>
          </div>
          <div className="disclaimer-card"><Info size={17} /><div><strong>Educational screening</strong><p>Indicators are not legal advice or a conclusion that a contract is safe.</p></div></div>
        </aside>
      </div>
    </>
  )
}

function ReportPage({ report, source, sourceLabel, activeFinding, setActiveFinding, onBack, onAnalyze, onShare }) {
  const [severityFilter, setSeverityFilter] = useState('all')
  const [reportTab, setReportTab] = useState('summary')
  const [paneTab, setPaneTab] = useState('findings')
  useEffect(() => setSeverityFilter('all'), [report.id])
  useEffect(() => { setReportTab('summary'); setPaneTab('findings') }, [report.id])
  const findings = Array.isArray(report.findings) ? report.findings : []
  const visibleFindings = severityFilter === 'all' ? findings : findings.filter((item) => item.severity === severityFilter)
  const selectedFinding = findings[activeFinding]
  const selectedIsVisible = selectedFinding && visibleFindings.includes(selectedFinding)
  const safeActiveIndex = selectedIsVisible ? activeFinding : (visibleFindings.length ? findings.indexOf(visibleFindings[0]) : 0)
  const active = visibleFindings.length ? findings[safeActiveIndex] : null
  const counts = ['high', 'medium', 'low'].map((level) => ({ level, count: findings.filter((item) => item.severity === level).length }))
  const level = report.level || 'low'

  return (
    <>
      <div className="report-toolbar">
        <button type="button" className="back-action" onClick={onBack}><ArrowLeft size={16} /> Back to reports</button>
        <div className="report-actions"><a className="button outline-button" href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer"><Download size={15} /> Download report</a><button type="button" className="button outline-button" onClick={onShare}><Share2 size={15} /> Share</button><button type="button" className="button primary-button" onClick={onAnalyze}><Plus size={15} /> New analysis</button></div>
      </div>

      <div className="report-context"><span>Workspace</span><ChevronRight size={13} /><span>Risk reports</span><ChevronRight size={13} /><strong>{report.title}</strong></div>

      <div className="report-intro">
        <div>
          <div className="eyebrow">EVIDENCE REVIEW<span /></div>
          <h1>{report.title}</h1>
          <p className="intro-copy">Analyzed {formatDateTime(report.created_at)} <span className="dot-separator">·</span> {report.engine || 'rules'} screening</p>
        </div>
      </div>

      <div className="report-tabs" role="tablist" aria-label="Risk report sections">
        {[['summary', 'Executive Summary'], ['findings', 'Risk Findings'], ['clauses', 'Clause Analysis'], ['recommendations', 'Recommendations'], ['full', 'Full Report']].map(([key, label]) => <button type="button" role="tab" aria-selected={reportTab === key} className={reportTab === key ? 'active' : ''} key={key} onClick={() => setReportTab(key)}>{label}</button>)}
      </div>

      {(reportTab === 'summary' || reportTab === 'full') && <section className="report-summary-grid">
        <div className="panel score-card">
          <div className="panel-heading"><div><div className="section-kicker">SCREENING SIGNAL</div><h2>Risk indicator score</h2><p>Heuristic score, not a legal determination</p></div><Badge level={level}>{level} indicators</Badge></div>
          <div className="score-layout">
            <div className="score-ring" style={{ '--score': `${Math.max(0, Math.min(100, report.score || 0))}%`, '--score-color': severityColor[level] || severityColor.low }}><div><strong>{report.score ?? '—'}</strong><span>/ 100</span></div></div>
            <div className="score-copy"><strong>{report.summary}</strong><p>Use the evidence below as a review guide. A score does not determine legal validity or guarantee safety.</p></div>
          </div>
        </div>
        <div className="panel summary-card">
          <div className="section-kicker">REPORT READOUT</div>
          <h2>What the scan found</h2>
          <p className="summary-text">{report.ai_summary || report.summary || 'The screening engine returned no summary.'}</p>
          <div className="count-row">{counts.map(({ level: countLevel, count }) => <div className="count-item" key={countLevel}><strong style={{ color: severityColor[countLevel] }}>{count}</strong><span>{countLevel} priority</span></div>)}</div>
          <div className="engine-row"><div className="engine-icon"><Sparkles size={15} /></div><div><strong>{report.engine === 'rules+ai' ? 'Rules + optional AI notes' : 'Rules-based screening'}</strong><span>{report.ai_status || 'Evidence-backed pattern matching'}</span></div></div>
        </div>
      </section>}

      {(reportTab === 'summary' || reportTab === 'full') && <section className="panel report-metadata">
        <div className="metadata-heading"><div><div className="section-kicker">DOCUMENT METADATA</div><h2>Review context</h2></div><span className="metadata-source"><LockKeyhole size={13} /> Local workspace</span></div>
        <div className="metadata-grid">
          <MetadataCell label="Document" value={report.title || 'Untitled contract'} />
          <MetadataCell label="Reviewed" value={formatDateTime(report.created_at)} />
          <MetadataCell label="Content size" value={Number.isInteger(report.characters) ? `${report.characters.toLocaleString()} characters` : 'Not returned'} />
          <MetadataCell label="Source" value={source ? sourceLabel || 'Pasted contract text' : 'Stored evidence excerpts'} />
          <MetadataCell label="Analysis mode" value={report.engine === 'rules+ai' ? 'Rules + AI notes' : 'Rules only'} />
        </div>
      </section>}

      {(reportTab === 'summary' || reportTab === 'full') && <ReportTopFindings findings={findings} onFocusFinding={(index) => { setActiveFinding(index); setReportTab('findings'); setPaneTab('findings') }} />}

      {(reportTab === 'clauses' || reportTab === 'full') && <ClauseAnalysis findings={findings} onFocusFinding={(index) => { setActiveFinding(index); setReportTab('findings'); setPaneTab('findings') }} />}

      {(reportTab === 'findings' || reportTab === 'full') && <div className="section-heading report-section-heading">
        <div><div className="section-kicker">LINKED REVIEW</div><h2>Document and findings</h2></div>
        <span className="section-note">{visibleFindings.length} of {findings.length} {findings.length === 1 ? 'indicator' : 'indicators'} · select an item to focus its evidence</span>
      </div>}

      {(reportTab === 'findings' || reportTab === 'full') && <section className="report-workspace">
        <ContractViewer source={source} sourceLabel={sourceLabel} findings={findings} visibleFindings={visibleFindings} activeFinding={active ? safeActiveIndex : -1} onSelectFinding={setActiveFinding} />
        <aside className="panel findings-index">
          <div className="findings-heading"><div><div className="section-kicker">FINDING INDEX</div><h2>Flagged clauses <span>{findings.length}</span></h2></div><FileCheck2 size={18} /></div>
          <div className="finding-pane-tabs" role="tablist" aria-label="Finding detail views"><button type="button" role="tab" aria-selected={paneTab === 'findings'} className={paneTab === 'findings' ? 'active' : ''} onClick={() => setPaneTab('findings')}>Findings</button><button type="button" role="tab" aria-selected={paneTab === 'evidence'} className={paneTab === 'evidence' ? 'active' : ''} onClick={() => setPaneTab('evidence')}>Evidence</button><button type="button" role="tab" aria-selected={paneTab === 'ai'} className={paneTab === 'ai' ? 'active' : ''} onClick={() => setPaneTab('ai')}>AI Notes</button></div>
          {paneTab === 'findings' && <>
          {findings.length ? (
            <div className="finding-filter">
              <label htmlFor="severity-filter"><Filter size={14} /><span>Severity</span></label>
              <select id="severity-filter" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                <option value="all">All findings ({findings.length})</option>
                {counts.map(({ level: countLevel, count }) => <option value={countLevel} key={countLevel}>{countLevel[0].toUpperCase() + countLevel.slice(1)} ({count})</option>)}
              </select>
              <span className="filter-result-count">{visibleFindings.length} shown</span>
            </div>
          ) : null}
          {visibleFindings.length ? (
            <div className="finding-list">
              {visibleFindings.map((finding) => {
                const index = findings.indexOf(finding)
                return (
                <button type="button" className={`finding-item ${safeActiveIndex === index ? 'selected' : ''}`} key={`${finding.rule_id || finding.title}-${index}`} onClick={() => setActiveFinding(index)}>
                  <span className="finding-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="finding-item-copy"><strong>{finding.title}</strong><span>{finding.category}</span><em>{finding.excerpt || 'Evidence excerpt unavailable.'}</em></span>
                  <Badge level={finding.severity}>{finding.severity}</Badge>
                </button>
                )
              })}
            </div>
          ) : findings.length ? (
            <EmptyState compact icon={Filter} title={`No ${severityFilter} findings`} message="No saved indicators match this severity filter." action={() => setSeverityFilter('all')} actionLabel="Show all findings" />
          ) : (
            <EmptyState compact icon={CheckCircle2} title="No indicators matched" message="No predefined risk patterns were returned. This does not mean the contract is risk-free." action={onAnalyze} actionLabel="Review another contract" />
          )}
          </>}
          {paneTab === 'evidence' && <EvidenceList findings={visibleFindings} onFocusFinding={(finding) => { setActiveFinding(findings.indexOf(finding)); setPaneTab('findings') }} />}
          {paneTab === 'ai' && <AiNotesPane notes={report.ai_notes} engine={report.engine} />}
        </aside>
      </section>}

      {(reportTab === 'findings' || reportTab === 'full') && active && <FindingDetail finding={active} index={safeActiveIndex} sourceAvailable={Boolean(source)} />}

      {(reportTab === 'recommendations' || reportTab === 'full') && <RecommendationsPanel findings={findings} onFocusFinding={(index) => { setActiveFinding(index); setReportTab('findings'); setPaneTab('findings') }} />}

      {(reportTab === 'summary' || reportTab === 'full') && Array.isArray(report.ai_notes) && report.ai_notes.length > 0 && (
        <section className="panel ai-notes-card">
          <div className="notes-heading"><div className="ai-option-icon"><Sparkles size={17} /></div><div><div className="section-kicker">OPTIONAL ASSISTANCE</div><h2>AI review questions</h2></div></div>
          <p className="notes-disclaimer">These notes are generated from verified findings and are not legal advice.</p>
          <ul>{report.ai_notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul>
        </section>
      )}

      <div className="disclaimer-card report-disclaimer"><Info size={17} /><div><strong>Keep a qualified reviewer in the loop</strong><p>CASFETA surfaces potential concerns for educational review. It does not determine whether a contract is safe or legally enforceable.</p></div></div>
    </>
  )
}

function ReportTopFindings({ findings, onFocusFinding }) {
  return (
    <section className="panel report-top-findings">
      <div className="panel-heading"><div><div className="section-kicker">TOP FINDINGS</div><h2>Priority clauses to review</h2><p>Direct links to the evidence in the document viewer</p></div><FileSearch size={18} className="panel-heading-icon" /></div>
      {findings.length ? <div className="top-findings-list">{findings.slice(0, 3).map((finding, index) => <div className="top-finding" key={`${finding.rule_id || finding.title}-${index}`}><Badge level={finding.severity}>{finding.severity}</Badge><div><strong>{finding.title}</strong><span>{finding.category} · {finding.excerpt || 'Evidence excerpt unavailable.'}</span></div><button type="button" className="text-action" onClick={() => onFocusFinding(index)}>View in document <ArrowUpRight size={13} /></button></div>)}</div> : <EmptyState compact icon={CheckCircle2} title="No indicators matched" message="No predefined risk patterns were returned by the analysis engine." />}
    </section>
  )
}

function ClauseAnalysis({ findings, onFocusFinding }) {
  return (
    <section className="panel clause-analysis-card">
      <div className="panel-heading"><div><div className="section-kicker">CLAUSE ANALYSIS</div><h2>Evidence and rationale</h2><p>Each row is sourced from the saved analysis result.</p></div><ClipboardList size={18} className="panel-heading-icon" /></div>
      {findings.length ? <div className="clause-analysis-list">{findings.map((finding, index) => <article className="clause-analysis-item" key={`${finding.rule_id || finding.title}-${index}`}><div className="clause-analysis-title"><span className={`queue-score ${finding.severity}`}>{String(index + 1).padStart(2, '0')}</span><div><Badge level={finding.severity}>{finding.severity}</Badge><h3>{finding.title}</h3><span>{finding.category}</span></div><button type="button" className="text-action" onClick={() => onFocusFinding(index)}>Focus finding <ArrowUpRight size={13} /></button></div><blockquote>“{finding.excerpt || 'Evidence excerpt unavailable.'}”</blockquote><div className="clause-analysis-columns"><div><strong>Why it matters</strong><p>{finding.explanation || 'No explanation was returned.'}</p></div><div><strong>Suggested next step</strong><p>{finding.recommendation || 'Review with a qualified professional.'}</p></div></div></article>)}</div> : <EmptyState compact icon={ClipboardList} title="No clauses to analyze" message="The saved report contains no returned findings." />}
    </section>
  )
}

function EvidenceList({ findings, onFocusFinding }) {
  return findings.length ? <div className="evidence-list">{findings.map((finding, index) => <button type="button" className="evidence-list-item" key={`${finding.rule_id || finding.title}-${index}`} onClick={() => onFocusFinding(finding)}><span className="evidence-list-icon"><FileCheck2 size={14} /></span><span><strong>{finding.title}</strong><small>{finding.excerpt || 'Evidence excerpt unavailable.'}</small></span><ArrowUpRight size={14} /></button>)}</div> : <EmptyState compact icon={FileSearch} title="No evidence available" message="No findings match the current severity filter." />
}

function AiNotesPane({ notes, engine }) {
  if (Array.isArray(notes) && notes.length) return <div className="ai-pane"><div className="ai-pane-note"><Sparkles size={15} /><span>Generated from verified findings only.</span></div><ul>{notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul></div>
  return <EmptyState compact icon={Sparkles} title="No AI notes returned" message={engine === 'rules+ai' ? 'The optional AI response did not include notes for this report.' : 'This report used rules-only screening. Enable optional AI notes for pasted text when configured.'} />
}

function RecommendationsPanel({ findings, onFocusFinding }) {
  return (
    <section className="panel recommendations-card">
      <div className="panel-heading"><div><div className="section-kicker">RECOMMENDATIONS</div><h2>Suggested next steps</h2><p>Recommendations returned by the analysis engine for each finding.</p></div><ListChecks size={18} className="panel-heading-icon" /></div>
      {findings.length ? <div className="recommendation-list">{findings.map((finding, index) => <div className="recommendation-item" key={`${finding.rule_id || finding.title}-${index}`}><span className={`recommendation-marker ${finding.severity}`}><Check size={14} /></span><div><div className="recommendation-title"><strong>{finding.title}</strong><Badge level={finding.severity}>{finding.severity}</Badge></div><p>{finding.recommendation || 'Review this language with a qualified professional.'}</p></div><button type="button" className="text-action" onClick={() => onFocusFinding(index)}>View evidence <ArrowUpRight size={13} /></button></div>)}</div> : <EmptyState compact icon={ListChecks} title="No recommendations" message="No predefined findings were returned." />}
    </section>
  )
}

function MetadataCell({ label, value }) {
  return <div className="metadata-cell"><span>{label}</span><strong title={value}>{value}</strong></div>
}

function ContractViewer({ source, sourceLabel, findings, visibleFindings, activeFinding, onSelectFinding }) {
  const visibleFindingIndexes = useMemo(() => new Set(visibleFindings.map((finding) => findings.indexOf(finding))), [findings, visibleFindings])
  const segments = useMemo(() => {
    if (!source) return []
    const boundaries = new Set([0, source.length])
    findings.forEach((finding) => {
      if (Number.isInteger(finding.start) && Number.isInteger(finding.end) && finding.start >= 0 && finding.end > finding.start && finding.start < source.length) {
        boundaries.add(Math.min(source.length, finding.start))
        boundaries.add(Math.min(source.length, finding.end))
      }
    })
    const points = [...boundaries].sort((a, b) => a - b)
    return points.slice(0, -1).map((start, index) => {
      const end = points[index + 1]
      const matching = findings.map((finding, findingIndex) => ({ finding, findingIndex })).filter(({ finding, findingIndex }) => visibleFindingIndexes.has(findingIndex) && Number.isInteger(finding.start) && Number.isInteger(finding.end) && finding.start <= start && finding.end >= end)
      return { start, end, text: source.slice(start, end), matches: matching }
    }).filter((segment) => segment.text)
  }, [source, findings, visibleFindingIndexes])

  useEffect(() => {
    if (!source) return
    const activeElement = document.querySelector(`[data-finding-index="${activeFinding}"]`)
    const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
    activeElement?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [activeFinding, source])

  return (
    <section className="panel contract-viewer">
      <div className="viewer-heading">
        <div><div className="section-kicker">SOURCE VIEWER</div><h2>{source ? 'Contract text' : 'Evidence excerpts'}</h2><p>{source ? sourceLabel : 'The original document is not retained after processing.'}</p></div>
        <div className="viewer-status"><span className={source ? 'available' : ''} />{source ? 'Linked source' : 'Excerpt mode'}</div>
      </div>
      {source ? (
        <div className="document-page" aria-label="Contract source text">
          <div className="document-page-head"><span>{sourceLabel || 'Contract source'}</span><span>{source.length.toLocaleString()} characters</span></div>
          <div className="document-text">
            {segments.map((segment, index) => {
              if (!segment.matches.length) return <React.Fragment key={index}>{segment.text}</React.Fragment>
              const match = segment.matches[0]
              return <mark key={index} data-finding-index={match.findingIndex} className={`${match.finding.severity || 'low'} ${match.findingIndex === activeFinding ? 'active' : ''}`} onClick={() => onSelectFinding(match.findingIndex)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectFinding(match.findingIndex) } }} role="button" tabIndex={0} aria-label={`Focus finding ${match.findingIndex + 1}: ${match.finding.title}`}>{segment.text}</mark>
            })}
          </div>
          <div className="document-legend"><span><i className="legend-swatch high" />High</span><span><i className="legend-swatch medium" />Medium</span><span><i className="legend-swatch low" />Low</span><span className="legend-hint">Click a highlight to inspect its finding</span></div>
        </div>
      ) : (
        <div className="excerpt-mode">
          <div className="excerpt-notice"><LockKeyhole size={17} /><div><strong>Original file not stored</strong><p>This preserves the local-first privacy behavior. The report keeps only the evidence excerpts returned by the analysis engine.</p></div></div>
          {visibleFindings.length ? <div className="excerpt-preview"><div className="excerpt-label">SELECTED EVIDENCE · {String(activeFinding + 1).padStart(2, '0')}</div><blockquote>“{findings[activeFinding]?.excerpt || 'Evidence excerpt unavailable.'}”</blockquote><button type="button" className="text-action" onClick={() => onSelectFinding(activeFinding)}>Keep this finding selected <CheckCircle2 size={14} /></button></div> : <EmptyState compact icon={findings.length ? Filter : FileText} title={findings.length ? 'No evidence for this filter' : 'No evidence excerpts'} message={findings.length ? 'Change the severity filter to bring an evidence excerpt into focus.' : 'The report contains no returned finding excerpts.'} />}
        </div>
      )}
    </section>
  )
}

function FindingDetail({ finding, index, sourceAvailable }) {
  return (
    <section className="panel finding-detail">
      <div className="finding-detail-top"><div className="finding-number large">{String(index + 1).padStart(2, '0')}</div><div><div className="section-kicker">SELECTED FINDING · {finding.category}</div><h2>{finding.title}</h2></div><Badge level={finding.severity}>{finding.severity} priority</Badge></div>
      <div className="evidence-block"><div className="evidence-label"><FileCheck2 size={14} /> LINKED EVIDENCE</div><p>“{finding.excerpt || 'Evidence excerpt unavailable.'}”</p><span>{sourceAvailable ? 'Highlighted in the source viewer above.' : 'Stored excerpt from the analysis result.'}</span></div>
      <div className="detail-columns"><div><h3>Why this matters</h3><p>{finding.explanation || 'No explanation was returned by the analysis engine.'}</p></div><div><h3>Suggested next step</h3><p>{finding.recommendation || 'Review this language with a qualified professional.'}</p></div></div>
    </section>
  )
}

function HistoryPage({ history, total, query, loading, onRefresh, onNavigate, onOpenReport, onDelete }) {
  const [levelFilter, setLevelFilter] = useState('all')
  const [engineFilter, setEngineFilter] = useState('all')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const engineOptions = [...new Set(history.map((item) => item.engine).filter(Boolean))]
  const visibleHistory = useMemo(() => {
    const valueFor = (item) => {
      if (sortKey === 'title') return (item.title || '').toLowerCase()
      if (sortKey === 'score') return Number(item.score) || 0
      if (sortKey === 'level') return (item.level || '').toLowerCase()
      if (sortKey === 'engine') return (item.engine || '').toLowerCase()
      return new Date(item.created_at).getTime() || 0
    }
    return history
      .filter((item) => levelFilter === 'all' || item.level === levelFilter)
      .filter((item) => engineFilter === 'all' || item.engine === engineFilter)
      .slice()
      .sort((left, right) => {
        const a = valueFor(left)
        const b = valueFor(right)
        if (a === b) return 0
        const direction = sortDirection === 'asc' ? 1 : -1
        return (a > b ? 1 : -1) * direction
      })
  }, [engineFilter, history, levelFilter, sortDirection, sortKey])

  const hasFilters = levelFilter !== 'all' || engineFilter !== 'all'

  function toggleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextKey === 'created_at' || nextKey === 'score' ? 'desc' : 'asc')
  }

  return (
    <>
      <PageIntro
        eyebrow="RISK REPORTS"
        title="Risk reports"
        description="Open completed screenings, inspect evidence-linked findings, or export a report for review."
        action={<button type="button" className="button primary-button" onClick={() => onNavigate('analyze')}><Plus size={17} /> New analysis</button>}
      />
      <section className="panel history-panel">
        <div className="history-heading"><div><div className="section-kicker">SAVED REPORTS</div><h2>All analyses <span className="heading-count">{total}</span></h2><p>{query ? `Showing matches for “${query}”` : 'Stored in the local database'}</p></div><button type="button" className="button outline-button" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button></div>
        <div className="table-controls">
          <div className="control-label"><ListFilter size={14} /><span>Filter reports</span></div>
          <label className="filter-field"><span>Severity</span><select aria-label="Filter reports by severity" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="all">All levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label className="filter-field"><span>Mode</span><select aria-label="Filter reports by analysis mode" value={engineFilter} onChange={(event) => setEngineFilter(event.target.value)}><option value="all">All modes</option>{engineOptions.map((engine) => <option value={engine} key={engine}>{engine === 'rules+ai' ? 'Rules + AI' : engine}</option>)}</select></label>
          {hasFilters && <button type="button" className="text-action clear-filter" onClick={() => { setLevelFilter('all'); setEngineFilter('all') }}>Clear filters <X size={13} /></button>}
          <span className="results-readout">{visibleHistory.length} of {history.length} shown</span>
        </div>
        {loading ? (
          <div className="history-loading"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : visibleHistory.length ? (
          <div className="history-table-wrap">
            <div className="history-table table-head"><button type="button" className="table-sort" onClick={() => toggleSort('title')}>DOCUMENT <ArrowDownUp size={12} /></button><button type="button" className="table-sort" onClick={() => toggleSort('created_at')}>DATE <ArrowDownUp size={12} /></button><button type="button" className="table-sort" onClick={() => toggleSort('score')}>SCORE <ArrowDownUp size={12} /></button><span>LEVEL</span><span>MODE</span><span>ACTIONS</span></div>
            {visibleHistory.map((item) => (
              <div className="history-table table-row" key={item.id}>
                <div className="history-document"><div className="document-icon"><FileText size={17} /></div><div><strong>{item.title}</strong><span>{engineLabel(item.engine)} screening</span></div></div>
                <span>{formatDate(item.created_at)}</span>
                <strong className="history-score">{item.score}<small>/100</small></strong>
                <span><Badge level={item.level}>{item.level}</Badge></span>
                <span className="engine-chip">{engineLabel(item.engine)}</span>
                <div className="row-actions"><IconButton label={`Open ${item.title}`} onClick={() => onOpenReport(item.id)}><ExternalLink size={15} /></IconButton><IconButton label={`Delete ${item.title}`} className="danger-button" onClick={() => onDelete(item.id)}><Trash2 size={15} /></IconButton></div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={history.length ? Filter : query ? Search : FileText} title={history.length ? 'No reports match these filters' : query ? 'No matching reports' : 'No analyses yet'} message={history.length ? 'Adjust the severity or mode filter to see more saved reports.' : query ? 'Try a different title or clear the search in the top bar.' : 'Start with a sample contract or upload a document to create your first report.'} action={history.length ? () => { setLevelFilter('all'); setEngineFilter('all') } : query ? undefined : () => onNavigate('analyze')} actionLabel={history.length ? 'Clear filters' : 'Start an analysis'} />
        )}
      </section>
    </>
  )
}

function LibraryPage({ history, total, query, loading, onRefresh, onNavigate, onOpenReport, onDelete }) {
  const [librarySearch, setLibrarySearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [windowFilter, setWindowFilter] = useState('all')
  const [sortDirection, setSortDirection] = useState('desc')

  const libraryItems = useMemo(() => {
    const search = `${query} ${librarySearch}`.trim().toLowerCase()
    const cutoff = windowFilter === 'all' ? null : Date.now() - (Number(windowFilter) * 24 * 60 * 60 * 1000)
    return history
      .filter((item) => !search || `${item.title} ${item.level} ${item.engine}`.toLowerCase().includes(search))
      .filter((item) => riskFilter === 'all' || item.level === riskFilter)
      .filter((item) => !cutoff || new Date(item.created_at).getTime() >= cutoff)
      .slice()
      .sort((left, right) => {
        const difference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
        return sortDirection === 'desc' ? -difference : difference
      })
  }, [history, librarySearch, query, riskFilter, sortDirection, windowFilter])

  const filtersActive = riskFilter !== 'all' || windowFilter !== 'all' || Boolean(librarySearch)

  function clearFilters() {
    setLibrarySearch('')
    setRiskFilter('all')
    setWindowFilter('all')
  }

  return (
    <>
      <PageIntro
        eyebrow="CONTRACTS LIBRARY"
        title="Contracts library"
        description="Manage saved screening records and move from a document summary into its evidence-linked risk report."
        action={<button type="button" className="button primary-button" onClick={() => onNavigate('analyze')}><UploadCloud size={16} /> Upload contract</button>}
      />
      <section className="panel library-panel">
        <div className="library-heading"><div><div className="section-kicker">SAVED DOCUMENTS</div><h2>All contracts <span className="heading-count">{total}</span></h2><p>{query ? `Showing matches for “${query}”` : 'Stored in the local SQLite history'}</p></div><button type="button" className="button outline-button" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button></div>
        <div className="library-filter-bar">
          <label className="library-search"><Search size={15} /><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search this library" aria-label="Search contracts library" /></label>
          <label className="filter-field"><span>Risk level</span><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} aria-label="Filter library by risk level"><option value="all">All risk levels</option><option value="high">High risk</option><option value="medium">Medium risk</option><option value="low">Low risk</option></select></label>
          <label className="filter-field"><span>Reviewed</span><select value={windowFilter} onChange={(event) => setWindowFilter(event.target.value)} aria-label="Filter library by review window"><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
          {filtersActive && <button type="button" className="text-action clear-filter" onClick={clearFilters}>Clear filters <X size={13} /></button>}
          <span className="results-readout">{libraryItems.length} of {history.length} shown</span>
        </div>
        {loading ? <div className="library-loading"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div> : libraryItems.length ? (
          <div className="library-table-wrap">
            <div className="library-table library-table-head"><span>DOCUMENT</span><span>TYPE</span><button type="button" className="table-sort" onClick={() => setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}>REVIEWED <ArrowDownUp size={12} /></button><span>RISK LEVEL</span><span>SCORE</span><span>ANALYSIS MODE</span><span>ACTIONS</span></div>
            {libraryItems.map((item) => <div className="library-table library-table-row" key={item.id}><div className="library-document"><span className="document-icon"><FileText size={16} /></span><div><strong>{item.title}</strong><small>{item.id.slice(0, 8)} · saved report</small></div></div><span className="type-label">Contract</span><span>{formatDate(item.created_at)}</span><Badge level={item.level}>{item.level}</Badge><strong className="library-score">{item.score}<small>/100</small></strong><span className="engine-chip">{engineLabel(item.engine)}</span><div className="row-actions"><IconButton label={`View ${item.title}`} onClick={() => onOpenReport(item.id)}><Eye size={15} /></IconButton><IconButton label={`Delete ${item.title}`} className="danger-button" onClick={() => onDelete(item.id)}><Trash2 size={15} /></IconButton></div></div>)}
          </div>
        ) : <EmptyState icon={filtersActive || query ? Search : FolderOpen} title={filtersActive || query ? 'No contracts match' : 'No contracts yet'} message={filtersActive || query ? 'Adjust the library search or filters to find a saved report.' : 'Analyze a contract to create the first saved library record.'} action={filtersActive || query ? clearFilters : () => onNavigate('analyze')} actionLabel={filtersActive || query ? 'Clear filters' : 'Analyze a contract'} />}
      </section>
    </>
  )
}

function ReviewPipelinePage({ history, loading, onRefresh, onNavigate, onOpenReport }) {
  const [laneFilter, setLaneFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const lanes = [
    { key: 'high', label: 'High risk', tone: 'rose', icon: ShieldAlert, description: 'Highest scoring screenings', predicate: (item) => item.level === 'high' },
    { key: 'medium', label: 'Medium risk', tone: 'ochre', icon: AlertTriangle, description: 'Moderate screening signals', predicate: (item) => item.level === 'medium' },
    { key: 'low', label: 'Low risk', tone: 'teal', icon: ShieldCheck, description: 'Lower screening signals', predicate: (item) => item.level === 'low' && Number(item.score) > 0 },
    { key: 'none', label: 'No indicators', tone: 'slate', icon: CheckCircle2, description: 'No predefined matches', predicate: (item) => Number(item.score) === 0 },
  ]
  const activeLanes = laneFilter === 'all' ? lanes : lanes.filter((lane) => lane.key === laneFilter)

  return (
    <>
      <PageIntro
        eyebrow="REVIEW PIPELINE"
        title="Review pipeline"
        description="Triage saved screenings by their actual risk level and open the source evidence behind each result."
        action={<button type="button" className="button primary-button" onClick={() => onNavigate('analyze')}><Plus size={16} /> Add contract</button>}
      />
      <div className="pipeline-notice"><Waypoints size={16} /><span><strong>Screening triage view</strong> Lanes are derived from saved risk levels. Human review status is not persisted by the current API.</span></div>
      <section className="panel pipeline-panel">
        <div className="pipeline-toolbar"><label className="filter-field"><SlidersHorizontal size={14} /><span>Show</span><select value={laneFilter} onChange={(event) => setLaneFilter(event.target.value)} aria-label="Filter review pipeline lanes"><option value="all">All risk lanes</option>{lanes.map((lane) => <option value={lane.key} key={lane.key}>{lane.label}</option>)}</select></label><span className="pipeline-count">{history.length} saved {history.length === 1 ? 'screening' : 'screenings'}</span><button type="button" className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`} aria-label="Grid view" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /></button><button type="button" className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`} aria-label="List view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><Table2 size={15} /></button><button type="button" className="icon-button pipeline-refresh" aria-label="Refresh review pipeline" title="Refresh review pipeline" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button></div>
        {loading ? <div className="pipeline-board pipeline-loading">{lanes.map((lane) => <div className="pipeline-lane" key={lane.key}><Skeleton /><Skeleton /><Skeleton /></div>)}</div> : <div className={`pipeline-board ${viewMode === 'list' ? 'list-view' : ''}`}>{activeLanes.map((lane) => { const LaneIcon = lane.icon; const laneItems = history.filter(lane.predicate); return <section className={`pipeline-lane ${lane.tone}`} key={lane.key}><div className="pipeline-lane-heading"><div><span className="pipeline-lane-title"><LaneIcon size={15} />{lane.label}</span><small>{lane.description}</small></div><strong>{laneItems.length}</strong></div><div className="pipeline-cards">{laneItems.length ? laneItems.map((item) => <button type="button" className="pipeline-card" key={item.id} onClick={() => onOpenReport(item.id)}><div className="pipeline-card-top"><span className="pipeline-card-type"><FileText size={13} />{engineLabel(item.engine)}</span><MoreVertical size={15} /></div><strong>{item.title}</strong><span className="pipeline-card-meta">{formatDate(item.created_at)} · {item.score}/100</span><span className="pipeline-card-footer"><span>{item.id.slice(0, 8)}</span><ArrowUpRight size={13} /></span></button>) : <EmptyState compact icon={lane.icon} title="No saved reports" message="New screenings in this lane will appear here." action={() => onNavigate('analyze')} actionLabel="Add contract" />}</div><button type="button" className="pipeline-add" onClick={() => onNavigate('analyze')}><Plus size={13} /> Add contract</button></section>})}</div>}
      </section>
    </>
  )
}

function SettingsPage() {
  const cards = [
    { icon: Database, eyebrow: 'DATA', title: 'Local-first history', body: 'Analysis summaries and evidence snippets are stored in SQLite. Original uploaded files are processed in memory and are not saved.' },
    { icon: LockKeyhole, eyebrow: 'CREDENTIALS', title: 'API credential safety', body: 'Optional OpenAI access is configured on the server through OPENAI_API_KEY. Keep credentials out of source control.' },
    { icon: ShieldCheck, eyebrow: 'RESPONSIBLE USE', title: 'Educational screening', body: 'Scores are heuristics and do not determine whether a contract is safe or legally enforceable. Decisions require expert review.' },
  ]
  return (
    <>
      <PageIntro eyebrow="WORKSPACE" title="Settings" description="System information and responsible-use controls for this local workspace." />
      <div className="settings-grid">{cards.map(({ icon: Icon, eyebrow, title, body }) => <section className="panel settings-card" key={title}><div className="settings-icon"><Icon size={19} /></div><div className="section-kicker">{eyebrow}</div><h2>{title}</h2><p>{body}</p></section>)}</div>
      <section className="panel settings-note"><CircleHelp size={18} /><div><strong>Need a production deployment?</strong><p>This MVP does not include authentication, multi-user separation, retention controls, rate limits, or OCR for scanned PDFs.</p></div></section>
    </>
  )
}

export default App
