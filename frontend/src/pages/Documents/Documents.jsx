import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaFolderOpen,
  FaFileAlt,
  FaPlus,
  FaTrashAlt,
  FaTimes,
  FaDownload,
  FaLink,
  FaBox,
  FaSpinner,
  FaFilePdf,
  FaStamp,
  FaCertificate,
  FaFileInvoice,
  FaQrcode,
  FaSearch,
  FaEye
} from "react-icons/fa";

// Helper to parse serialized document metadata from URL query parameters
function parseDocumentInfo(url) {
  try {
    const parsed = new URL(url);
    const type = parsed.searchParams.get("type") || "Manifest";
    const title = parsed.searchParams.get("title") || "Cargo_Certificate.pdf";
    return { type, title, rawUrl: url };
  } catch (e) {
    // Fallback if URL is not absolute
    if (url && url.includes("?")) {
      const parts = url.split("?");
      const params = new URLSearchParams(parts[1]);
      return {
        type: params.get("type") || "Manifest",
        title: params.get("title") || parts[0].split("/").pop() || "Document.pdf",
        rawUrl: url
      };
    }
    return {
      type: "Manifest",
      title: url ? url.split("/").pop() : "document.pdf",
      rawUrl: url || ""
    };
  }
}

// Helper to serialize document metadata to URL string
function serializeDocumentUrl(baseUrl, type, title) {
  const cleanBase = baseUrl ? baseUrl.split("?")[0] : "https://izqlduvirvvfyfvivtzb.supabase.co/storage/v1/object/public/manifests/doc.pdf";
  return `${cleanBase}?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
}

// Helper to get cargo description text safely
function getCargoText(description) {
  if (!description) return "";
  try {
    const data = JSON.parse(description);
    return data.text || data.description || description;
  } catch (e) {
    return description;
  }
}

function Documents() {
  const { role, permissions } = useAuth();
  const canUpload = ["Super Admin", "Admin", "Customer"].includes(role);
  const canDelete = ["Super Admin", "Admin"].includes(role);

  // Main states
  const [documents, setDocuments] = useState([]);
  const [cargoOptions, setCargoOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals control
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Selection
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  // Form states
  const [formData, setFormData] = useState({
    title: "",
    type: "Manifest",
    file_url: "",
    cargo_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      const docData = await apiService.getDocuments();
      setDocuments(docData || []);

      const cargoData = await apiService.getCargo();
      setCargoOptions(cargoData || []);

    } catch (e) {
      toast.error("Failed to load WMS Documents: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Add Document
  async function handleAddDocument(e) {
    e.preventDefault();
    if (!canUpload) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    if (!formData.file_url.trim() || !formData.cargo_id || !formData.title.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      const serializedUrl = serializeDocumentUrl(formData.file_url.trim(), formData.type, formData.title.trim());

      await apiService.createDocument({
        file_url: serializedUrl,
        cargo_id: formData.cargo_id
      });

      toast.success("Document uploaded and linked successfully!");
      setAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to upload document: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete Document
  async function handleDeleteDocument() {
    if (!canDelete) {
      toast.error("Unauthorized. Admin privileges required.");
      return;
    }
    try {
      setLoading(true);
      await apiService.deleteDocument(selectedDoc.id);

      toast.success("Document link deleted successfully.");
      setDeleteModalOpen(false);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to delete document: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(doc) {
    setSelectedDoc(doc);
    setDeleteModalOpen(true);
  }

  function openPreviewModal(doc) {
    setSelectedDoc(doc);
    setPreviewModalOpen(true);
  }

  function resetForm() {
    setFormData({
      title: "",
      type: "Manifest",
      file_url: "",
      cargo_id: "",
    });
    setSelectedDoc(null);
  }

  function getDocIcon(type) {
    switch (type) {
      case "Customs Declarations":
        return <FaStamp className="text-amber-600 text-lg" />;
      case "Certificate of Origin":
        return <FaCertificate className="text-blue-500 text-lg" />;
      case "Commercial Invoice":
        return <FaFileInvoice className="text-emerald-600 text-lg" />;
      case "Manifest":
      default:
        return <FaFilePdf className="text-red-500 text-lg" />;
    }
  }

  // Filter based on search query and Customer role visibility
  const filteredDocuments = documents.filter((doc) => {
    // Role filter: Customers only see documents linked to their own cargo
    if (role === "Customer" && doc.cargo?.customers?.company_name && !doc.cargo.customers.company_name.toLowerCase().includes("zenith")) {
      return false;
    }

    const docInfo = parseDocumentInfo(doc.file_url);
    const matchesSearch = 
      docInfo.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      docInfo.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cargo?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(doc.id)?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Document Repository</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Upload, inspect, and organize shipping bills, customs declarations, and certificates.</p>
        </div>

        {canUpload && (
          <button
            onClick={() => {
              resetForm();
              // Mock initial link
              setFormData({
                title: "Cargo_Manifest_A.pdf",
                type: "Manifest",
                file_url: "https://izqlduvirvvfyfvivtzb.supabase.co/storage/v1/object/public/manifests/manifest-" + Math.floor(Math.random() * 1000) + ".pdf",
                cargo_id: ""
              });
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-xs transition-colors cursor-pointer"
          >
            <FaPlus />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Search Input bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs transition-colors">
        <div className="relative w-full">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by filename, certificate type, or linked cargo ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />

        </div>
      </div>

      {/* Documents Grid List */}
      {loading && documents.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-xs">
          <FaFolderOpen className="mx-auto text-4xl text-slate-350 dark:text-slate-550 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-350">No documents found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Cargo declarations and invoices will appear here once associated with cargo items.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">Document Details</th>
                  <th className="px-6 py-4">Document Type</th>
                  <th className="px-6 py-4">Associated Cargo Item</th>
                  <th className="px-6 py-4">Direct Link</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-650 dark:text-slate-300">
                {filteredDocuments.map((doc) => {
                  const docInfo = parseDocumentInfo(doc.file_url);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 rounded-lg">
                            {getDocIcon(docInfo.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-850 dark:text-white truncate max-w-xs">{docInfo.title}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Ref ID: {String(doc.id).slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-755 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {docInfo.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {doc.cargo ? (
                          <div className="flex items-center gap-2">
                            <FaBox className="text-slate-400 text-xs shrink-0" />
                            <div className="truncate max-w-xs">
                              <p className="font-semibold text-slate-850 dark:text-white truncate">{getCargoText(doc.cargo.description)}</p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">Cargo ID: {String(doc.cargo_id).slice(0, 8).toUpperCase()}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={docInfo.rawUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-650 dark:text-blue-450 hover:text-blue-755 dark:hover:text-blue-400 font-semibold hover:underline"
                        >
                          <FaLink className="text-xs" />
                          <span>Open Link</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPreviewModal(doc)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-655 dark:text-slate-400 hover:text-blue-650 rounded-lg transition-colors cursor-pointer"
                            title="Interactive Preview"
                          >
                            <FaEye className="text-xs" />
                          </button>
                          
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(doc)}
                              className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-955/30 text-slate-655 dark:text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                              title="Delete Reference"
                            >
                              <FaTrashAlt className="text-xs" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LINK DOCUMENT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Link Logistics Certificate</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Link Cargo Item *</label>
                <select
                  required
                  value={formData.cargo_id}
                  onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Cargo to Associate</option>
                  {cargoOptions.map((c) => (
                    <option key={c.id} value={c.id}>{getCargoText(c.description).slice(0, 50)}... ({String(c.id).slice(0, 6).toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Document Title / File Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith_Declarations_QC.pdf"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Certificate Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Manifest">Manifest Declaration</option>
                    <option value="Customs Declarations">Customs Declarations</option>
                    <option value="Certificate of Origin">Certificate of Origin</option>
                    <option value="Commercial Invoice">Commercial Invoice</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Document URL Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/shipping-manifest.pdf"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-101 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Link Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE PREVIEW MODAL */}
      {previewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-850 dark:text-white text-base">Visual Certificate Preview</h3>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Official Certificate Visual Structure */}
              <div className="border-4 border-slate-100 dark:border-slate-700 p-6 rounded-2xl relative space-y-6 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200">
                {/* Ribbon stamp */}
                <div className="absolute top-4 right-4 flex flex-col items-center gap-1 opacity-80">
                  <FaStamp className="text-3xl text-blue-600 dark:text-blue-500" />
                  <span className="text-[8px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">ORBEM LOGISTICS</span>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">OFFICIAL LOGISTICS RECORD</span>
                  <h4 className="text-lg font-extrabold tracking-tight text-slate-850 dark:text-white uppercase">
                    {parseDocumentInfo(selectedDoc.file_url).type}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">FILE: {parseDocumentInfo(selectedDoc.file_url).title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 dark:border-slate-750 py-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Linked Cargo Item</p>
                    <p className="font-semibold text-slate-800 dark:text-white truncate">{selectedDoc.cargo ? getCargoText(selectedDoc.cargo.description) : "Cargo Asset"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Associated Owner</p>
                    <p className="font-semibold text-slate-800 dark:text-white truncate">{selectedDoc.cargo?.customers?.company_name || "Unassigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Record System ID</p>
                    <p className="font-mono text-slate-700 dark:text-slate-350">{String(selectedDoc.id).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Connection Status</p>
                    <p className="text-emerald-700 dark:text-emerald-450 font-bold">Active SSL Encrypted</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <FaQrcode className="text-4xl text-slate-800 dark:text-white shrink-0 opacity-70" />
                    <div className="text-[9px] text-slate-450 dark:text-slate-500">
                      <p>Scan to verify ledger integrity.</p>
                      <p className="mt-0.5 font-mono">Secured via ORBEM WMS Core.</p>
                    </div>
                  </div>
                  <div className="text-right leading-none">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">RELEASE OFFICER</span>
                    <span className="font-bold text-xs text-slate-655 dark:text-slate-300 block mt-1.5 font-mono">ORBEM-SYS-LOGS</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <a
                  href={parseDocumentInfo(selectedDoc.file_url).rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  <FaDownload className="text-xs" />
                  <span>Open Full PDF / Link</span>
                </a>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DOCUMENT MODAL */}
      {deleteModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Confirm Deletion</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-655 dark:text-slate-400 leading-normal">
                Are you sure you want to delete document link reference <strong className="font-mono text-slate-850 dark:text-white">{String(selectedDoc.id).slice(0, 8).toUpperCase()}</strong>?
                This deletes the reference path from WMS grids.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Reference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
