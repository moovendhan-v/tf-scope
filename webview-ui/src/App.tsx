import React, { useState, useEffect } from 'react';
import { TerraformFile, Page } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './components/pages/DashboardPage';
import { FilesPage } from './components/pages/FilesPage';
import { SearchPage } from './components/pages/SearchPage';
import { DiffPage } from './components/pages/DiffPage';
import { CostPage } from './components/pages/CostPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { FileDetailView } from './components/FileDetailView';
import './index.css';

declare global {
  interface Window {
    __tf_scope_FILES__: TerraformFile[];
    __tf_scope_CURRENT_FILE__: TerraformFile | undefined;
    __tf_scope_VIEW__: 'dashboard' | 'fileDetail';
    __tf_scope_ERROR__?: string;
    __vscode__: any;
  }
}

export default function App() {
  const initialFiles: TerraformFile[] = window.__tf_scope_FILES__ || [];
  const initialView = window.__tf_scope_VIEW__ || 'dashboard';
  const currentFileFromExt = window.__tf_scope_CURRENT_FILE__;

  const [files] = useState<TerraformFile[]>(initialFiles);
  const [page, setPage] = useState<Page>(
    initialView === 'fileDetail' && currentFileFromExt ? 'fileDetail' : 'dashboard'
  );
  const [currentFile, setCurrentFile] = useState<TerraformFile | null>(
    currentFileFromExt || null
  );
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPage('search');
      }
      if (e.key === 'Escape' && page === 'fileDetail') {
        setCurrentFile(null);
        setPage('dashboard');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [page]);

  const openFile = (file: TerraformFile) => {
    setCurrentFile(file);
    setPage('fileDetail');
    if (window.__vscode__) {
      window.__vscode__.postMessage({ command: 'openFile', filePath: file.filePath });
    }
  };

  const navigate = (p: Page) => {
    if (p !== 'fileDetail') setCurrentFile(null);
    setPage(p);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--tv-bg)]">
      {page !== 'fileDetail' && (
        <Sidebar
          currentPage={page}
          onNavigate={navigate}
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(v => !v)}
          fileCount={files.length}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {page !== 'fileDetail' && (
          <Topbar title={PAGE_TITLES[page] || page} onSearch={() => navigate('search')} />
        )}
        <div className="flex-1 overflow-hidden relative">
          {page === 'dashboard' && <DashboardPage files={files} onOpenFile={openFile} onNavigate={navigate} />}
          {page === 'files'     && <FilesPage files={files} onOpenFile={openFile} />}
          {page === 'search'    && <SearchPage files={files} onOpenFile={openFile} />}
          {page === 'diff'      && <DiffPage files={files} />}
          {page === 'cost'      && <CostPage files={files} />}
          {page === 'settings'  && <SettingsPage />}
          {page === 'fileDetail' && currentFile && (
            <FileDetailView file={currentFile} onBack={() => navigate('dashboard')} />
          )}
        </div>
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  files:     'Files',
  search:    'Search',
  diff:      'Diff / Compare',
  cost:      'Cost Estimate',
  settings:  'Settings',
};
