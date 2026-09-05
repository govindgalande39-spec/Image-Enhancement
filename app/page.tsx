"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, Download, Trash2 } from "lucide-react";

export default function Page(): JSX.Element {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setQuality(null);
      setShowResults(false);
      setSliderValue(50);
      setProgress(0);
      setIsProcessing(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      intervalRef.current = window.setInterval(() => {
        setProgress((p) => {
          const next = p + Math.floor(Math.random() * 12) + 8; // 8-19
          if (next >= 100) {
            window.clearInterval(intervalRef.current ?? undefined);
            setTimeout(() => {
              setIsProcessing(false);
              setShowResults(true);
              setProgress(100);
            }, 400);
            return 100;
          }
          return next;
        });
      }, 400);

      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [isProcessing]);

  function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    const f = selected[0];
    if (!f.type.startsWith("image/")) return alert("Please upload an image file.");
    setFile(f);
  }

  function onDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function triggerFileInput() {
    inputRef.current?.click();
  }

  function enhanceNow() {
    if (!file) return;
    if (!quality) return alert("Please choose a quality setting before enhancing.");
    setIsProcessing(true);
    setShowResults(false);
    setProgress(0);
  }

  function clearAll() {
    setFile(null);
    setPreview(null);
    setQuality(null);
    setShowResults(false);
    setSliderValue(50);
  }

  async function downloadOriginal() {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <section className="flex items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight">AI Image Enhancement &amp; Face Restoration</h1>
            <p className="mt-2 text-gray-300 max-w-xl">
              Upscale, denoise, and restore facial details with AI-powered models. Drag an image in or click to select to
              get started.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-xl shadow">
            <span className="text-sm text-gray-300">Quick tip:</span>
            <span className="text-sm text-gray-200">Use high-resolution photos for best results.</span>
          </div>
        </section>

        {/* Upload & Controls */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div
            className={`col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 ${dragActive ? "ring-2 ring-indigo-500" : ""}`}
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900">
              {!preview ? (
                <div className="flex flex-col items-center text-center gap-4 px-6">
                  <UploadCloud className="w-12 h-12 text-indigo-400" />
                  <div>
                    <p className="text-lg font-semibold">Drag &amp; drop an image here</p>
                    <p className="text-sm text-gray-400">or</p>
                    <button
                      onClick={triggerFileInput}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-medium shadow"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Select Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/3 h-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-gray-700">
                    <img src={preview} alt="uploaded preview" className="object-contain max-h-56" />
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Ready to enhance</h3>
                        <p className="text-sm text-gray-400">Choose the desired quality settings and start processing.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={clearAll}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-md text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" /> Clear
                        </button>
                        <button
                          onClick={downloadOriginal}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                      </div>
                    </div>

                    {/* Quality Selection panel */}
                    <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-inner">
                      <p className="text-sm text-gray-300 mb-3">Quality Selection</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => setQuality("4k")}
                          className={`flex-1 px-4 py-3 rounded-md text-sm font-medium border ${quality === "4k" ? "bg-indigo-600 border-indigo-500" : "bg-gray-800 border-gray-700"}`}
                        >
                          4K Ultra-Sharp
                        </button>
                        <button
                          onClick={() => setQuality("8k")}
                          className={`flex-1 px-4 py-3 rounded-md text-sm font-medium border ${quality === "8k" ? "bg-indigo-600 border-indigo-500" : "bg-gray-800 border-gray-700"}`}
                        >
                          8K Cinematic
                        </button>
                        <button
                          onClick={() => setQuality("portrait")}
                          className={`flex-1 px-4 py-3 rounded-md text-sm font-medium border ${quality === "portrait" ? "bg-indigo-600 border-indigo-500" : "bg-gray-800 border-gray-700"}`}
                        >
                          Natural Portrait (Preserve Details)
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-400">Selected: <span className="text-gray-100 font-medium">{quality ?? "—"}</span></div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={enhanceNow}
                            disabled={!quality || isProcessing}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold ${!quality ? "bg-gray-600 text-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                              </>
                            ) : (
                              "Enhance Now"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Progress bar / spinner */}
                      {isProcessing && (
                        <div className="mt-4">
                          <div className="w-full h-3 bg-gray-700 rounded overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="text-sm text-gray-400 mt-2">Processing: {progress}%</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto text-xs text-gray-500">Model: AI-Restore v1 • Runtime: simulated</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">Accepted: JPG, PNG, WEBP — Max recommended: 20MB</div>
          </div>

          {/* Right column - Preview summary / actions */}
          <aside className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Session</h4>
                <p className="text-xs text-gray-400">Local preview — no upload to server</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded bg-gray-800 border border-gray-700">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{file ? file.name : "No image selected"}</div>
                <div className="text-xs text-gray-400">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "—"}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  triggerFileInput();
                }}
                className="w-full px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
              >
                Change Image
              </button>
              <button
                onClick={clearAll}
                className="w-full px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
              >
                Clear
              </button>
            </div>

            <div className="mt-auto text-xs text-gray-500">Ready to enhance: <span className="text-gray-200 font-medium">{quality ?? "—"}</span></div>
          </aside>
        </section>

        {/* Results */}
        {showResults && preview && (
          <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">Quality: <span className="text-gray-100 font-medium">{quality}</span></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2 bg-black rounded-lg overflow-hidden p-4">
                <div className="relative w-full h-96 bg-black rounded">
                  {/* Before/After slider */}
                  <img src={preview} alt="before" className="absolute inset-0 w-full h-full object-contain" style={{ filter: "none" }} />

                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${sliderValue}%` }}
                  >
                    <img
                      src={preview}
                      alt="after"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        filter:
                          quality === "4k"
                            ? "contrast(1.08) saturate(1.12)"
                            : quality === "8k"
                            ? "contrast(1.15) saturate(1.18)"
                            : "contrast(1.03) saturate(1.04)",
                      }}
                    />
                  </div>

                  {/* Slider UI */}
                  <div className="absolute left-0 right-0 bottom-6 px-6 flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliderValue}
                      onChange={(e) => setSliderValue(Number(e.target.value))}
                      className="w-full"
                      aria-label="Before after slider"
                    />
                    <div className="w-12 text-right text-xs text-gray-300">{sliderValue}%</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400">Preview Controls</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={() => setSliderValue(0)}
                      className="w-full px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-sm"
                    >
                      Show Before
                    </button>
                    <button
                      onClick={() => setSliderValue(100)}
                      className="w-full px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-sm"
                    >
                      Show After
                    </button>
                    <button
                      onClick={downloadOriginal}
                      className="w-full px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
                    >
                      Download Enhanced
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 text-sm text-gray-400">
                  <p className="font-medium text-gray-200">Processing Details</p>
                  <p className="mt-2">Model: AI-Restore v1 (simulated)</p>
                  <p>Steps: Upscale · Denoise · Face Refinement</p>
                  <p className="mt-2 text-xs text-gray-500">This demo runs locally and only simulates enhancements for the UI preview.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center text-sm text-gray-500">© {new Date().getFullYear()} Image Enhancement — Local demo UI</footer>
      </div>
    </main>
  );
}
