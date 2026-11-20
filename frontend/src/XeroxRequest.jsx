import { useEffect, useState } from 'react';
import {
  getXeroxPricing,
  createXeroxRequest,
} from './api/xeroxApi';

function XeroxRequest({ onBack, onViewHistory }) {
  const [pricing, setPricing] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    colorMode: 'black-and-white',
    printSides: 'single-sided',
    numberOfCopies: '1',
    paperSize: 'A4',
    paymentMethod: 'upi',
    includeOHP: false,
    printRange: 'full',
    startPage: '',
    endPage: '',
  });

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const data = await getXeroxPricing();
        setPricing(data);
      } catch {
        setError('Unable to load Xerox pricing. Please try again.');
      }
    };

    loadPricing();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please select a PDF document.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('The PDF file must be 10 MB or smaller.');
      return;
    }

    if (
      form.printRange === 'selected-pages' &&
      (!form.startPage || !form.endPage ||
        Number(form.startPage) < 1 ||
        Number(form.endPage) < Number(form.startPage))
    ) {
      setError('Please enter a valid page range.');
      return;
    }

    const formData = new FormData();

    formData.append('document', file);
    formData.append('colorMode', form.colorMode);
    formData.append('printSides', form.printSides);
    formData.append('numberOfCopies', form.numberOfCopies);
    formData.append('paperSize', form.paperSize);
    formData.append('paymentMethod', form.paymentMethod);
    formData.append('includeOHP', String(form.includeOHP));
    formData.append('printRange', form.printRange);

    if (form.printRange === 'selected-pages') {
      formData.append('startPage', form.startPage);
      formData.append('endPage', form.endPage);
    }

    try {
      setLoading(true);
      const result = await createXeroxRequest(formData);

      setMessage(result.message || 'Xerox request submitted successfully.');
      setFile(null);
      e.target.reset();

      setForm({
        colorMode: 'black-and-white',
        printSides: 'single-sided',
        numberOfCopies: '1',
        paperSize: 'A4',
        paymentMethod: 'upi',
        includeOHP: false,
        printRange: 'full',
        startPage: '',
        endPage: '',
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to submit your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f0e6] px-5 py-8 text-[#3f2720]">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={onBack}
          className="mb-6 font-semibold text-[#7b1e1e]"
        >
          ← Back to Dashboard
        </button>

        <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm sm:p-8">

          <h1 className="text-3xl font-bold text-[#7b1e1e]">
            Xerox & Printing
          </h1>

          <p className="mt-2 text-gray-500">
            Upload your PDF and choose your printing preferences.
          </p>

          {pricing && (
            <div className="mt-6 rounded-xl bg-[#fffaf4] p-4">
              <h2 className="font-bold">Printing Rates</h2>
              <p className="mt-2 text-sm">
                Black & White: ₹5 single-sided / ₹8 double-sided
              </p>
              <p className="mt-1 text-sm">
                Colour: ₹10 single-sided / ₹15 double-sided
              </p>
              <p className="mt-1 text-sm">
                OHP covers: ₹10 per copy
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Final price is calculated by the server after PDF upload.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            <div>
              <label className="mb-2 block font-semibold">
                Upload PDF (maximum 10 MB)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Print Colour
              </label>
              <select
                name="colorMode"
                value={form.colorMode}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
              >
                <option value="black-and-white">Black & White</option>
                <option value="color">Colour</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Print Sides
              </label>
              <select
                name="printSides"
                value={form.printSides}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
              >
                <option value="single-sided">Single-sided</option>
                <option value="double-sided">Double-sided</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Number of Copies
              </label>
              <input
                type="number"
                name="numberOfCopies"
                min="1"
                max="100"
                value={form.numberOfCopies}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Paper Size
              </label>
              <select
                name="paperSize"
                value={form.paperSize}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
              >
                <option value="A4">A4</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Pages to Print
              </label>
              <select
                name="printRange"
                value={form.printRange}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
              >
                <option value="full">Full Document</option>
                <option value="selected-pages">Selected Pages</option>
              </select>
            </div>

            {form.printRange === 'selected-pages' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-semibold">
                    Start Page
                  </label>
                  <input
                    type="number"
                    name="startPage"
                    min="1"
                    value={form.startPage}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#eadfd2] p-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    End Page
                  </label>
                  <input
                    type="number"
                    name="endPage"
                    min="1"
                    value={form.endPage}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#eadfd2] p-3"
                    required
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="includeOHP"
                checked={form.includeOHP}
                onChange={handleChange}
              />
              <span className="font-medium">Include OHP covers</span>
            </label>

            <div>
              <label className="mb-2 block font-semibold">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#eadfd2] p-3"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pricing}
              className="w-full rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white transition hover:bg-[#641818] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Xerox Request'}
            </button>

            <button
              type="button"
              onClick={onViewHistory}
              className="w-full rounded-xl border border-[#7b1e1e] px-6 py-3 font-semibold text-[#7b1e1e]"
            >
              View My Xerox Requests
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}

export default XeroxRequest;