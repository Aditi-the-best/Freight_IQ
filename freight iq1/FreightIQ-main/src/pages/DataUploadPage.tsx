import { useState } from "react";

const UPLOAD_ENDPOINT =
  "https://nrilqcptdoedgotbhzpn.supabase.co/functions/v1/upload-csv";

type UploadType = "vessel" | "berth";

export default function DataUploadPage() {
  const [vesselFile, setVesselFile] = useState<File | null>(null);
  const [berthFile, setBerthFile] = useState<File | null>(null);
  const [passcode, setPasscode] = useState("");

  const [vesselStatus, setVesselStatus] = useState("");
  const [berthStatus, setBerthStatus] = useState("");
  const [uploading, setUploading] = useState<UploadType | null>(null);

  const uploadFile = async (type: UploadType, file: File | null) => {
    if (!file) {
      const message = `Please choose a ${type} CSV file first.`;
      type === "vessel"
        ? setVesselStatus(message)
        : setBerthStatus(message);
      return;
    }

    if (!passcode.trim()) {
      const message = "Please enter the upload passcode.";
      type === "vessel"
        ? setVesselStatus(message)
        : setBerthStatus(message);
      return;
    }

    setUploading(type);
    type === "vessel" ? setVesselStatus("") : setBerthStatus("");

    try {
      const formData = new FormData();
      formData.append("passcode", passcode);
      formData.append("type", type);
      formData.append("file", file);

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed.");
      }

      const message = `✓ Upload successful — ${result.rows_processed} rows processed.`;

      if (type === "vessel") {
        setVesselStatus(message);
        setVesselFile(null);
      } else {
        setBerthStatus(message);
        setBerthFile(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed.";

      type === "vessel"
        ? setVesselStatus(`✕ ${message}`)
        : setBerthStatus(`✕ ${message}`);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: "#0ecad4" }}
        >
          Data Management
        </div>

        <h1
          className="text-2xl font-semibold"
          style={{
            color: "#e8f1f8",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Data Upload
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}
        >
          Upload the latest vessel and berth CSV files. Existing historical
          snapshots are preserved.
        </p>
      </div>

      {/* Passcode */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          background: "#0c1828",
          border: "1px solid rgba(14,202,212,0.12)",
        }}
      >
        <label
          className="block text-xs font-medium mb-2"
          style={{ color: "#94b8d0" }}
        >
          Upload passcode
        </label>

        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter upload passcode"
          className="w-full max-w-md rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{
            background: "#08121f",
            color: "#e8f1f8",
            border: "1px solid rgba(14,202,212,0.15)",
          }}
        />

        <p
          className="mt-2 text-xs"
          style={{ color: "#49677f" }}
        >
          The passcode is sent securely to the upload service and is not
          stored in the frontend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vessel upload */}
        <UploadCard
          title="Vessel Snapshots"
          description="Upload the latest vessel snapshot CSV."
          file={vesselFile}
          status={vesselStatus}
          uploading={uploading === "vessel"}
          onFileChange={setVesselFile}
          onUpload={() => uploadFile("vessel", vesselFile)}
          accept=".csv,text/csv"
        />

        {/* Berth upload */}
        <UploadCard
          title="Berth Operations"
          description="Upload the latest berth operations CSV."
          file={berthFile}
          status={berthStatus}
          uploading={uploading === "berth"}
          onFileChange={setBerthFile}
          onUpload={() => uploadFile("berth", berthFile)}
          accept=".csv,text/csv"
        />
      </div>
    </div>
  );
}

interface UploadCardProps {
  title: string;
  description: string;
  file: File | null;
  status: string;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  accept: string;
}

function UploadCard({
  title,
  description,
  file,
  status,
  uploading,
  onFileChange,
  onUpload,
  accept,
}: UploadCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#0c1828",
        border: "1px solid rgba(14,202,212,0.12)",
      }}
    >
      <h2
        className="text-base font-semibold"
        style={{
          color: "#e8f1f8",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {title}
      </h2>

      <p
        className="mt-1 mb-5 text-xs"
        style={{ color: "#5a7d96" }}
      >
        {description}
      </p>

      <label
        className="flex items-center justify-center w-full rounded-lg px-4 py-8 cursor-pointer"
        style={{
          border: "1px dashed rgba(14,202,212,0.25)",
          background: "rgba(14,202,212,0.025)",
        }}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        <div className="text-center">
          <div
            className="text-sm"
            style={{ color: "#94b8d0" }}
          >
            {file ? file.name : "Choose CSV file"}
          </div>

          <div
            className="text-xs mt-1"
            style={{ color: "#49677f" }}
          >
            {file ? "File selected" : "CSV files only"}
          </div>
        </div>
      </label>

      <button
        type="button"
        onClick={onUpload}
        disabled={uploading}
        className="w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          background: "#0ecad4",
          color: "#07121d",
        }}
      >
        {uploading ? "Uploading…" : `Upload ${title}`}
      </button>

      {status && (
        <div
          className="mt-4 text-xs"
          style={{
            color: status.startsWith("✓") ? "#4ade80" : "#f87171",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
