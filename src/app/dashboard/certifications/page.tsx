'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Download, Calendar, Hash, BookOpen, Loader2 } from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  completedAt: string;
  module: {
    id: string;
    title: string;
    moduleId?: string;
  };
}

export default function CertificationsPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      const response = await fetch(`/api/certificates/${cert.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${cert.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const response = await fetch('/api/certificates');
        if (response.ok) {
          const data = await response.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
      }
      setLoading(false);
    }

    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="h1 flex items-center gap-3">
          <Award className="h-8 w-8 text-yellow-500" />
          My Certificates
        </h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          Certificates you&apos;ve earned by completing courses
        </p>
      </header>

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="card preset-filled-surface-100-900 overflow-hidden"
            >
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex items-center gap-3">
                  <Award className="h-10 w-10" />
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">
                      Certificate of Completion
                    </p>
                    <h3 className="font-semibold line-clamp-2">
                      {cert.module?.title || 'Course'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <Hash className="h-4 w-4" />
                  <span className="font-mono">{cert.certificateNumber}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Completed on{' '}
                    {new Date(cert.completedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    onClick={() => handleDownload(cert)}
                    disabled={downloading === cert.id}
                  >
                    {downloading === cert.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card preset-filled-surface-100-900 p-12 text-center">
          <Award className="mx-auto h-16 w-16 text-surface-400 mb-4" />
          <h2 className="h3 mb-2">No Certificates Yet</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Complete courses to earn certificates. Your achievements will appear here.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Browse Courses
          </Link>
        </div>
      )}

      {/* Stats Summary */}
      {certificates.length > 0 && (
        <div className="card preset-filled-surface-100-900 p-6">
          <h2 className="h3 mb-4">Summary</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-500">{certificates.length}</p>
              <p className="text-sm text-surface-500">Certificates Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{certificates.length}</p>
              <p className="text-sm text-surface-500">Courses Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
