import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

const AuthorityDataUpload = () => {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Success
    const [loading, setLoading] = useState(false);
    const [jobData, setJobData] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);

    const handleDownloadTemplate = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/authority-template`);
            if (!res.ok) throw new Error("Failed to download template");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Authority_Template.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success("Template downloaded!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error("Please select an Excel file");

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploaded_by', 'admin');

        try {
            const res = await fetch(`${API_URL}/api/admin/upload-authority-sheet`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.msg);

            // Fetch Preview
            const previewRes = await fetch(`${API_URL}/api/admin/preview-authority-sheet/${data.job_id}`);
            const previewData = await previewRes.json();

            setJobData(previewData.job);
            setPreviewRows(previewData.rows);
            setStep(2);
            toast.success("File processed successfully!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!jobData) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/import-authority-sheet/${jobData.job_id}`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.msg);

            setStep(3);
            toast.success(`Import complete! ${data.processed_rows} rows imported.`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Authority Data Upload</h2>
                    <p className="text-sm text-slate-500">Automated Area Mapping Engine</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 mb-8 text-sm font-semibold">
                <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${step >= 1 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`}>
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs">1</span>
                    Upload
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${step >= 2 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>2</span>
                    Preview
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${step === 3 ? 'bg-green-50 text-green-700' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-400'}`}>3</span>
                    Published
                </div>
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">1. Download Template</h3>
                            <p className="text-sm text-slate-500 mt-1">Download the standard Excel format required for ingestion.</p>
                        </div>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Download .xlsx
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-8 text-center">
                        <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-800 mb-2">2. Upload Filled Data</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Upload the completed template to automatically build the authority routing map for the specified region.</p>
                        
                        <form onSubmit={handleFileUpload} className="flex flex-col items-center gap-4">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                            />
                            <button 
                                type="submit"
                                disabled={!file || loading}
                                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Analyze File"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 2 && jobData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Rows</p>
                            <p className="text-2xl font-black text-slate-800">{jobData.total_rows}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                            <p className="text-xs font-bold text-emerald-600 uppercase">Valid Rows</p>
                            <p className="text-2xl font-black text-emerald-700">{jobData.valid_rows}</p>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                            <p className="text-xs font-bold text-rose-600 uppercase">Errors</p>
                            <p className="text-2xl font-black text-rose-700">{jobData.invalid_rows}</p>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Row</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Area / Ward</th>
                                        <th className="px-4 py-3">ULB</th>
                                        <th className="px-4 py-3">Officer</th>
                                        <th className="px-4 py-3">Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {previewRows.map((row) => (
                                        <tr key={row._id} className={row.validation_status === 'invalid' ? 'bg-rose-50/30' : ''}>
                                            <td className="px-4 py-3 font-mono text-xs">{row.row_index}</td>
                                            <td className="px-4 py-3">
                                                {row.validation_status === 'valid' 
                                                    ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Valid</span>
                                                    : <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Invalid</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {row.normalized_row.area_name || '—'} <br/>
                                                <span className="text-xs font-normal text-slate-500">{row.normalized_row.ward_name || row.normalized_row.ward_number || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3">{row.normalized_row.ulb_name || '—'}</td>
                                            <td className="px-4 py-3">{row.normalized_row.officer_name || '—'}</td>
                                            <td className="px-4 py-3 text-rose-600 text-xs">
                                                {row.validation_errors?.join(', ') || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                        <button 
                            onClick={() => { setStep(1); setFile(null); }}
                            className="px-6 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleImport}
                            disabled={loading || jobData.valid_rows === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Publish to Live Map"}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
                <div className="py-12 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Authority Graph Published!</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        The mapping data has been successfully imported. Citizens submitting complaints in these areas will now automatically be routed to the assigned authorities.
                    </p>
                    <button 
                        onClick={() => { setStep(1); setFile(null); setJobData(null); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold"
                    >
                        Upload Another Region
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthorityDataUpload;
