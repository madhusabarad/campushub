import { useEffect, useMemo, useState } from 'react'

const DEFAULT_RATES = {
    printRates: {
        'black-and-white': {
            'single-sided': 5,
            'double-sided': 8,
        },
        color: {
            'single-sided': 10,
            'double-sided': 15,
        },
    },
    ohpSheetPrice: 5,
    maximumCopies: 100,
    maximumUploadSizeMB: 10,
}

const STATUS_BADGES = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    accepted: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    printing: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    'ready-for-pickup': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

function Xerox({ onBack, userRole = 'student' }) {
    const isStudent = userRole === 'student'

    const [rates, setRates] = useState(DEFAULT_RATES)
    const [file, setFile] = useState(null)
    const [fileError, setFileError] = useState('')

    const [colorMode, setColorMode] = useState('black-and-white')
    const [printSides, setPrintSides] = useState('single-sided')
    const [numberOfCopies, setNumberOfCopies] = useState(1)
    const [printRange, setPrintRange] = useState('full')
    const [startPage, setStartPage] = useState(1)
    const [endPage, setEndPage] = useState(1)
    const [estimatedPages, setEstimatedPages] = useState(1)
    const [includeOHP, setIncludeOHP] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('cash')

    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submittedOrder, setSubmittedOrder] = useState(null)

    const [myRequests, setMyRequests] = useState([])
    const [loadingRequests, setLoadingRequests] = useState(false)
    const [requestsError, setRequestsError] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Fetch live pricing rates from backend
    useEffect(() => {
        let cancelled = false

        async function fetchPricing() {
            try {
                const res = await fetch('/api/xerox/pricing')
                const data = await res.json()
                if (!cancelled && data.success) {
                    setRates((prev) => ({
                        ...prev,
                        ...data,
                    }))
                }
            } catch {
                // Fall back to DEFAULT_RATES safely
            }
        }

        fetchPricing()

        return () => {
            cancelled = true
        }
    }, [])

    // Load student's previous/active requests
    useEffect(() => {
        if (!isStudent) return

        let cancelled = false
        const token = localStorage.getItem('campushub_token')
        if (!token) return

        async function fetchRequests() {
            try {
                const res = await fetch('/api/xerox/my-requests', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                const data = await res.json()
                if (!cancelled) {
                    if (data.success && Array.isArray(data.requests)) {
                        setMyRequests(data.requests)
                    } else if (!res.ok) {
                        setRequestsError(data.message || 'Unable to load your requests.')
                    }
                }
            } catch {
                if (!cancelled) {
                    setRequestsError('Network error loading your requests.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingRequests(false)
                }
            }
        }

        fetchRequests()

        return () => {
            cancelled = true
        }
    }, [isStudent, refreshTrigger])

    const handleManualRefresh = () => {
        setLoadingRequests(true)
        setRequestsError('')
        setRefreshTrigger((c) => c + 1)
    }

    // File selection & validation
    const handleFileChange = (e) => {
        const selected = e.target.files?.[0]
        setFileError('')
        setSubmitError('')

        if (!selected) {
            setFile(null)
            return
        }

        const extension = selected.name.split('.').pop()?.toLowerCase()
        if (extension !== 'pdf' && selected.type !== 'application/pdf') {
            setFileError('Only PDF documents are allowed.')
            setFile(null)
            return
        }

        const maxBytes = (rates.maximumUploadSizeMB || 10) * 1024 * 1024
        if (selected.size > maxBytes) {
            setFileError(`PDF exceeds the maximum upload size of ${rates.maximumUploadSizeMB || 10} MB.`)
            setFile(null)
            return
        }

        setFile(selected)
    }

    // Dynamic price calculation matching backend calculateXeroxPrice()
    const priceBreakdown = useMemo(() => {
        const modeRates = rates?.printRates?.[colorMode] || DEFAULT_RATES.printRates[colorMode]
        const rate = modeRates?.[printSides] || (colorMode === 'color' ? 10 : 5)

        const copies = Math.min(
            rates.maximumCopies || 100,
            Math.max(1, Number(numberOfCopies) || 1)
        )

        const pages = printRange === 'selected-pages'
            ? Math.max(1, (Math.max(1, Number(endPage) || 1) - Math.max(1, Number(startPage) || 1) + 1))
            : Math.max(1, Number(estimatedPages) || 1)

        const unitsPerCopy = printSides === 'single-sided' ? pages : Math.ceil(pages / 2)
        const printingCost = unitsPerCopy * rate * copies
        const ohpCost = includeOHP ? 2 * (rates.ohpSheetPrice || 5) * copies : 0
        const total = printingCost + ohpCost

        return {
            rate,
            copies,
            pages,
            unitsPerCopy,
            printingCost,
            ohpCost,
            total,
        }
    }, [rates, colorMode, printSides, numberOfCopies, printRange, startPage, endPage, estimatedPages, includeOHP])

    // Handle order submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitError('')
        setSubmittedOrder(null)

        if (!isStudent) {
            setSubmitError('Only registered students can submit Xerox requests.')
            return
        }

        if (!file) {
            setFileError('Please select a PDF document to upload.')
            return
        }

        if (printRange === 'selected-pages') {
            const s = Number(startPage)
            const ep = Number(endPage)
            if (!Number.isSafeInteger(s) || s < 1) {
                setSubmitError('Start page must be a positive integer.')
                return
            }
            if (!Number.isSafeInteger(ep) || ep < s) {
                setSubmitError('End page must be greater than or equal to start page.')
                return
            }
        }

        const token = localStorage.getItem('campushub_token')
        if (!token) {
            setSubmitError('You must be logged in to submit an order.')
            return
        }

        const formData = new FormData()
        formData.append('document', file)
        formData.append('colorMode', colorMode)
        formData.append('printSides', printSides)
        formData.append('numberOfCopies', String(numberOfCopies))
        formData.append('paperSize', 'A4')
        formData.append('printRange', printRange)
        if (printRange === 'selected-pages') {
            formData.append('startPage', String(startPage))
            formData.append('endPage', String(endPage))
        }
        formData.append('includeOHP', String(includeOHP))
        formData.append('paymentMethod', paymentMethod)

        setSubmitting(true)

        try {
            const res = await fetch('/api/xerox', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const data = await res.json()

            if (!res.ok || data.success === false) {
                throw new Error(data.message || 'Unable to submit Xerox request.')
            }

            setSubmittedOrder(data.request || data)
            setFile(null)
            // Refresh previous requests list
            setRefreshTrigger((c) => c + 1)
        } catch (err) {
            setSubmitError(err.message || 'Submission failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-text pb-16 pt-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                {/* Header & Back Button */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-background cursor-pointer"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                            Xerox &amp; Printing Service
                        </h1>
                        <p className="mt-1 text-sm text-muted-text">
                            Upload documents, configure your print settings, get instant price estimates, and place your order.
                        </p>
                    </div>
                </div>

                {!isStudent && (
                    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        <p className="font-semibold">Notice for Faculty &amp; Staff:</p>
                        <p className="mt-1">
                            Xerox and printing request submission is currently restricted to registered students. You may view service rates and options below.
                        </p>
                    </div>
                )}

                {/* Success Order Confirmation Banner */}
                {submittedOrder && (
                    <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">✓</span>
                                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                                        Xerox Request Submitted Successfully!
                                    </h3>
                                </div>
                                <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                                    Your request has been queued for printing. You can track its status below.
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                                    <div className="rounded-xl border border-border bg-surface p-3">
                                        <p className="text-muted-text uppercase tracking-wider">Request ID</p>
                                        <p className="font-bold text-text">
                                            {submittedOrder._id ? submittedOrder._id.slice(-8).toUpperCase() : 'PENDING'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-surface p-3">
                                        <p className="text-muted-text uppercase tracking-wider">Estimated Price</p>
                                        <p className="font-bold text-primary">
                                            ₹{submittedOrder.estimatedPrice}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-surface p-3">
                                        <p className="text-muted-text uppercase tracking-wider">Payment Method</p>
                                        <p className="font-bold capitalize text-text">
                                            {submittedOrder.paymentMethod} ({submittedOrder.paymentStatus || 'pending'})
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-surface p-3">
                                        <p className="text-muted-text uppercase tracking-wider">Status</p>
                                        <span className="inline-block mt-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800 px-2 py-0.5 font-semibold text-amber-800 uppercase text-[10px]">
                                            {submittedOrder.status || 'pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSubmittedOrder(null)}
                                className="text-xs text-muted-text hover:text-text cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
                        {/* 1. Document Upload Card */}
                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-text">
                                1. Upload PDF Document
                            </h2>
                            <p className="text-xs text-muted-text mt-0.5">
                                Only PDF files up to {rates.maximumUploadSizeMB || 10} MB are accepted.
                            </p>

                            <div className="mt-4">
                                <label
                                    htmlFor="document-upload"
                                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${file
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-border bg-surface-muted/30 hover:bg-surface-hover'
                                        }`}
                                >
                                    <div className="text-3xl">📄</div>
                                    <p className="mt-2 text-sm font-semibold text-text">
                                        {file ? file.name : 'Click to select or drop your PDF document here'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-text">
                                        {file
                                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for upload`
                                            : 'Accepts .pdf files only (Max 10 MB)'}
                                    </p>
                                    <input
                                        id="document-upload"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={!isStudent || submitting}
                                    />
                                </label>

                                {fileError && (
                                    <p className="mt-2 text-xs font-semibold text-danger">
                                        ⚠ {fileError}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. Print Configuration Card */}
                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-text">
                                2. Print Specifications
                            </h2>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {/* Color Mode */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text">
                                        Color Mode
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('black-and-white')}
                                            className={`rounded-xl border p-3 text-center text-xs font-bold transition cursor-pointer ${colorMode === 'black-and-white'
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-surface-muted/40 text-text hover:bg-surface-hover'
                                                }`}
                                        >
                                            Black &amp; White
                                            <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                                ₹{rates.printRates['black-and-white']['single-sided']}/page
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('color')}
                                            className={`rounded-xl border p-3 text-center text-xs font-bold transition cursor-pointer ${colorMode === 'color'
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-surface-muted/40 text-text hover:bg-surface-hover'
                                                }`}
                                        >
                                            Color
                                            <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                                ₹{rates.printRates.color['single-sided']}/page
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Print Sides */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-text">
                                        Print Sides
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPrintSides('single-sided')}
                                            className={`rounded-xl border p-3 text-center text-xs font-bold transition cursor-pointer ${printSides === 'single-sided'
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-surface-muted/40 text-text hover:bg-surface-hover'
                                                }`}
                                        >
                                            Single-sided
                                            <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                                1 side per sheet
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPrintSides('double-sided')}
                                            className={`rounded-xl border p-3 text-center text-xs font-bold transition cursor-pointer ${printSides === 'double-sided'
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-surface-muted/40 text-text hover:bg-surface-hover'
                                                }`}
                                        >
                                            Double-sided
                                            <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                                Front &amp; Back (Saves paper)
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Number of Copies */}
                                <div>
                                    <label
                                        htmlFor="number-of-copies"
                                        className="block text-xs font-bold uppercase tracking-wider text-muted-text"
                                    >
                                        Number of Copies (1–{rates.maximumCopies || 100})
                                    </label>
                                    <input
                                        id="number-of-copies"
                                        type="number"
                                        min="1"
                                        max={rates.maximumCopies || 100}
                                        value={numberOfCopies}
                                        onChange={(e) => setNumberOfCopies(Math.max(1, Number(e.target.value) || 1))}
                                        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>

                                {/* Paper Size */}
                                <div>
                                    <label
                                        htmlFor="paper-size-select"
                                        className="block text-xs font-bold uppercase tracking-wider text-muted-text"
                                    >
                                        Paper Size
                                    </label>
                                    <select
                                        id="paper-size-select"
                                        disabled
                                        className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-muted-text cursor-not-allowed"
                                    >
                                        <option value="A4">A4 Standard (Supported)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Print Range */}
                            <div className="mt-5 border-t border-border pt-5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-text">
                                    Page Selection Range
                                </label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
                                        <input
                                            type="radio"
                                            name="printRange"
                                            value="full"
                                            checked={printRange === 'full'}
                                            onChange={() => setPrintRange('full')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>Full Document</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
                                        <input
                                            type="radio"
                                            name="printRange"
                                            value="selected-pages"
                                            checked={printRange === 'selected-pages'}
                                            onChange={() => setPrintRange('selected-pages')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>Selected Page Range</span>
                                    </label>
                                </div>

                                {printRange === 'full' ? (
                                    <div className="mt-3">
                                        <label
                                            htmlFor="estimated-pages-input"
                                            className="block text-xs text-muted-text"
                                        >
                                            Estimated total pages in document (for live price preview):
                                        </label>
                                        <input
                                            id="estimated-pages-input"
                                            type="number"
                                            min="1"
                                            value={estimatedPages}
                                            onChange={(e) => setEstimatedPages(Math.max(1, Number(e.target.value) || 1))}
                                            className="mt-1 w-32 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-3 flex items-center gap-3">
                                        <div>
                                            <label
                                                htmlFor="start-page-input"
                                                className="block text-xs text-muted-text"
                                            >
                                                Start Page:
                                            </label>
                                            <input
                                                id="start-page-input"
                                                type="number"
                                                min="1"
                                                value={startPage}
                                                onChange={(e) => setStartPage(Math.max(1, Number(e.target.value) || 1))}
                                                className="mt-1 w-28 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="end-page-input"
                                                className="block text-xs text-muted-text"
                                            >
                                                End Page:
                                            </label>
                                            <input
                                                id="end-page-input"
                                                type="number"
                                                min={startPage}
                                                value={endPage}
                                                onChange={(e) => setEndPage(Math.max(1, Number(e.target.value) || 1))}
                                                className="mt-1 w-28 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Binding Options */}
                            <div className="mt-5 border-t border-border pt-5">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeOHP}
                                        onChange={(e) => setIncludeOHP(e.target.checked)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-text">
                                            Add OHP Transparent Cover / Binding
                                        </p>
                                        <p className="text-xs text-muted-text">
                                            Includes 1 front &amp; 1 back protective transparent OHP sheet (+₹{2 * (rates.ohpSheetPrice || 5)} per copy).
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Payment Method */}
                            <div className="mt-5 border-t border-border pt-5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-text">
                                    Payment Method
                                </label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={() => setPaymentMethod('cash')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>Cash on Pickup</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="upi"
                                            checked={paymentMethod === 'upi'}
                                            onChange={() => setPaymentMethod('upi')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>UPI</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {submitError && (
                            <div className="rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 p-4 text-xs font-semibold text-red-800">
                                ⚠ {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!isStudent || submitting || !file}
                            className={`w-full rounded-2xl py-4 text-center font-bold text-white shadow-md transition cursor-pointer ${!isStudent || submitting || !file
                                ? 'bg-surface-muted text-muted-text cursor-not-allowed shadow-none'
                                : 'bg-primary hover:bg-primary-hover'
                                }`}
                        >
                            {submitting
                                ? 'Submitting Xerox Request...'
                                : `Place Xerox Order (₹${priceBreakdown.total})`}
                        </button>
                    </form>

                    {/* Sidebar: Live Price Estimation & Order Summary */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                            <h3 className="text-base font-bold text-text">
                                Price Estimation
                            </h3>
                            <p className="text-xs text-muted-text mt-0.5">
                                Real-time estimate based on backend pricing rules.
                            </p>

                            <div className="mt-4 space-y-3 text-xs text-muted-text">
                                <div className="flex justify-between">
                                    <span>Selected pages</span>
                                    <span className="font-semibold text-text">{priceBreakdown.pages}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Physical sheets per copy</span>
                                    <span className="font-semibold text-text">{priceBreakdown.unitsPerCopy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rate per {printSides === 'single-sided' ? 'page' : 'sheet'}</span>
                                    <span className="font-semibold text-text">₹{priceBreakdown.rate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Number of copies</span>
                                    <span className="font-semibold text-text">{priceBreakdown.copies}</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2">
                                    <span>Base Printing Cost</span>
                                    <span className="font-semibold text-text">₹{priceBreakdown.printingCost}</span>
                                </div>
                                {includeOHP && (
                                    <div className="flex justify-between text-accent font-medium">
                                        <span>OHP Binding (2 sheets × ₹5 × {priceBreakdown.copies})</span>
                                        <span className="font-semibold text-text">+₹{priceBreakdown.ohpCost}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-border pt-3 text-sm font-bold text-primary">
                                    <span>Total Estimated Price</span>
                                    <span>₹{priceBreakdown.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Order History / Status Card */}
                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-text">
                                    My Xerox Requests
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleManualRefresh}
                                    className="text-xs text-primary hover:underline cursor-pointer"
                                    disabled={loadingRequests}
                                >
                                    {loadingRequests ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>

                            {requestsError && (
                                <p className="mt-2 text-xs text-danger">{requestsError}</p>
                            )}

                            <div className="mt-4 space-y-3">
                                {myRequests.length === 0 ? (
                                    <p className="text-xs text-muted-text">
                                        No recent Xerox requests found.
                                    </p>
                                ) : (
                                    myRequests.slice(0, 5).map((req) => (
                                        <div
                                            key={req._id}
                                            className="rounded-xl border border-border bg-surface-muted/30 p-3 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-text">
                                                    ID: {req._id.slice(-6).toUpperCase()}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_BADGES[req.status] || 'bg-surface-muted text-muted-text border-border'
                                                        }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-muted-text">
                                                {req.numberOfCopies} copy · {req.colorMode === 'color' ? 'Color' : 'B&W'} · {req.printSides}
                                            </p>
                                            <div className="mt-1 flex items-center justify-between text-text">
                                                <span>₹{req.estimatedPrice} ({req.paymentMethod})</span>
                                                <span className="text-[10px] text-muted-text">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Xerox
