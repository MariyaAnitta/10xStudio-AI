import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, FileText, ExternalLink, HardDrive, RefreshCw } from 'lucide-react';

interface FirestoreDoc {
  id: string;
  dishName: string;
  timestamp: string;
}

interface GCSFile {
  name: string;
  publicUrl: string;
}

interface DBInspectorStatus {
  firestoreConnected: boolean;
  firestoreDocuments: FirestoreDoc[];
  gcsConnected: boolean;
  gcsFiles: GCSFile[];
  error: string | null;
}

export default function DBInspectorPage() {
  const [status, setStatus] = useState<DBInspectorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify-storage-db');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        console.error('Failed to query diagnostics API');
      }
    } catch (err) {
      console.error('Error fetching db status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div style={{ padding: '36px', background: '#FAFAFA', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)',
            fontSize: '10px', fontWeight: 700, color: '#7C3AED',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px'
          }}>
            <Database size={10} /> Live Workspace Health
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1E1040', margin: 0 }}>
            Database &amp; GCS Cloud Inspector
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Monitor Firestore data mutations and Google Cloud Storage objects directly from this Sandbox console.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: '12px',
            background: 'white', border: '1px solid #E5E7EB',
            color: '#374151', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <div className="w-10 h-10 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mb-4" />
          <div style={{ color: '#7C3AED', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.1em' }}>QUERYING FIREBASE ADMIN SDK...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Firestore Panel */}
          <div style={{
            background: 'white', borderRadius: '20px', border: '1px solid #EDE9FE',
            padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#10B981'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E1040' }}>Firestore Registry</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '2px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: status?.firestoreConnected ? '#10B981' : '#EF4444' }} />
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                      {status?.firestoreConnected ? 'Connected (tenxds-agents-idp)' : 'Connection Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent Audits &amp; Session Activities
              </div>
              
              {status?.firestoreDocuments && status.firestoreDocuments.length > 0 ? (
                status.firestoreDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '14px', borderRadius: '12px', border: '1px solid #F3F4F6',
                      background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={16} style={{ color: '#8B5CF6' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{doc.dishName}</div>
                        <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>ID: {doc.id}</div>
                      </div>
                    </div>
                    {doc.timestamp && (
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>
                        {new Date(typeof doc.timestamp === 'string' ? doc.timestamp : (doc.timestamp as any)._seconds * 1000).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                  No collection document mutations logged yet.
                </div>
              )}
            </div>
          </div>

          {/* GCS Bucket Panel */}
          <div style={{
            background: 'white', borderRadius: '20px', border: '1px solid #EDE9FE',
            padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#3B82F6'
                }}>
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E1040' }}>GCS Cloud Bucket</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '2px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: status?.gcsConnected ? '#3B82F6' : '#EF4444' }} />
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                      {status?.gcsConnected ? 'Bucket Name: 10xstudio-ai' : 'Storage Restrictive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recently Generated Cloud Assets
              </div>

              {status?.gcsFiles && status.gcsFiles.length > 0 ? (
                status.gcsFiles.map((file) => (
                  <div
                    key={file.name}
                    style={{
                      padding: '14px', borderRadius: '12px', border: '1px solid #F3F4F6',
                      background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '8px', overflow: 'hidden',
                        background: '#ECECF1', flexShrink: 0, border: '1px solid #E5E7EB'
                      }}>
                        <img src={file.publicUrl} alt="" style={{ width: '100%', height: '100%', objectCover: 'cover' }} onError={(e) => {
                          (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.name.replace('generated/', '')}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Prefix: generated/</div>
                      </div>
                    </div>
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px', borderRadius: '8px', background: 'white',
                        border: '1px solid #E5E7EB', color: '#6B7280', display: 'inline-flex',
                        alignItems: 'center', textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                  No media files found in `generated/` storage bucket.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
