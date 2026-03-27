"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  ImageIcon,
  Grid3X3,
  LayoutGrid,
  Plus,
  ShoppingBag,
  X,
  Check,
  Camera,
} from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  isPreloaded: boolean;
  createdAt: string;
}

// Demo pre-loaded images
const demoImages: GalleryImage[] = [
  {
    id: "1",
    url: "",
    filename: "family-portrait.jpg",
    isPreloaded: true,
    createdAt: "2024-03-15",
  },
  {
    id: "2",
    url: "",
    filename: "beach-sunset.jpg",
    isPreloaded: true,
    createdAt: "2024-03-10",
  },
  {
    id: "3",
    url: "",
    filename: "graduation-day.jpg",
    isPreloaded: true,
    createdAt: "2024-02-28",
  },
  {
    id: "4",
    url: "",
    filename: "wedding-ceremony.jpg",
    isPreloaded: true,
    createdAt: "2024-02-14",
  },
  {
    id: "5",
    url: "",
    filename: "baby-first-steps.jpg",
    isPreloaded: true,
    createdAt: "2024-01-20",
  },
  {
    id: "6",
    url: "",
    filename: "holiday-gathering.jpg",
    isPreloaded: true,
    createdAt: "2023-12-25",
  },
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>(demoImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "large">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<"all" | "preloaded" | "uploaded">("all");

  const filteredImages = images.filter((img) => {
    if (filter === "preloaded") return img.isPreloaded;
    if (filter === "uploaded") return !img.isPreloaded;
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedImages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedImages(next);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages: GalleryImage[] = Array.from(files).map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      filename: file.name,
      isPreloaded: false,
      createdAt: new Date().toISOString().split("T")[0],
    }));
    setImages([...newImages, ...images]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Gallery</h1>
          <p className="mt-1 text-gray-500">
            {images.length} photos &middot;{" "}
            {images.filter((i) => i.isPreloaded).length} pre-loaded,{" "}
            {images.filter((i) => !i.isPreloaded).length} uploaded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedImages.size > 0 && (
            <Link href="/shop">
              <Button variant="orange" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop with {selectedImages.size} photo
                {selectedImages.size > 1 ? "s" : ""}
              </Button>
            </Link>
          )}
          <label>
            <Button variant="primary" size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> Upload Photos
            </Button>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["all", "preloaded", "uploaded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all"
                ? "All Photos"
                : f === "preloaded"
                  ? "Pre-loaded"
                  : "Uploaded"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded ${view === "grid" ? "bg-white shadow-sm" : ""}`}
          >
            <Grid3X3 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setView("large")}
            className={`p-1.5 rounded ${view === "large" ? "bg-white shadow-sm" : ""}`}
          >
            <LayoutGrid className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative transition-all duration-200 ${
          isDragging
            ? "ring-2 ring-teal-500 ring-offset-4 rounded-2xl"
            : ""
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-teal-50/90 border-2 border-dashed border-teal-300">
            <div className="text-center">
              <Upload className="h-12 w-12 text-teal-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-teal-700">
                Drop your photos here
              </p>
            </div>
          </div>
        )}

        {/* Image Grid */}
        {filteredImages.length > 0 ? (
          <div
            className={`grid gap-3 ${
              view === "grid"
                ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredImages.map((image) => {
              const isSelected = selectedImages.has(image.id);
              return (
                <div
                  key={image.id}
                  onClick={() => toggleSelect(image.id)}
                  className={`group relative cursor-pointer rounded-xl overflow-hidden transition-all ${
                    view === "grid" ? "aspect-square" : "aspect-[4/3]"
                  } ${
                    isSelected
                      ? "ring-3 ring-teal-500 ring-offset-2"
                      : "hover:ring-2 hover:ring-teal-300 hover:ring-offset-1"
                  }`}
                >
                  {/* Placeholder image */}
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-teal-300" />
                    </div>
                  )}

                  {/* Selection overlay */}
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isSelected
                        ? "bg-teal-600/20"
                        : "bg-black/0 group-hover:bg-black/10"
                    }`}
                  />

                  {/* Checkbox */}
                  <div
                    className={`absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-teal-600 text-white"
                        : "bg-white/80 text-transparent group-hover:text-gray-400 shadow-sm"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>

                  {/* Preloaded badge */}
                  {image.isPreloaded && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-medium bg-white/80 text-gray-600 px-1.5 py-0.5 rounded">
                        Pre-loaded
                      </span>
                    </div>
                  )}

                  {/* Filename */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">
                      {image.filename}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              No photos yet
            </h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              Upload your photos to get started creating beautiful printed
              products.
            </p>
            <label className="mt-6 inline-block">
              <Button variant="primary" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" /> Upload Your First Photo
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          </div>
        )}
      </div>

      {/* Selection Bar */}
      {selectedImages.size > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center">
          <div className="flex items-center gap-4 rounded-2xl bg-gray-900 text-white px-6 py-3 shadow-2xl">
            <span className="text-sm font-medium">
              {selectedImages.size} photo{selectedImages.size > 1 ? "s" : ""}{" "}
              selected
            </span>
            <Link href="/shop">
              <Button variant="orange" size="sm">
                <ShoppingBag className="h-4 w-4 mr-1.5" /> Create Products
              </Button>
            </Link>
            <button
              onClick={() => setSelectedImages(new Set())}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
