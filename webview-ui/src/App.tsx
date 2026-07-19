import React, { useState, useEffect } from 'react';
import { TerraformFile, Page } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './components/pages/DashboardPage';
import { FilesPage } from './components/pages/FilesPage';
import { SearchPage } from './components/pages/SearchPage';
import { DiffPage } from './components/pages/DiffPage';
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
  const initialFiles: TerraformFile[] = (window.__tf_scope_FILES__ && window.__tf_scope_FILES__.length > 0)
    ? window.__tf_scope_FILES__
    : MOCK_FILES;
  const initialView = window.__tf_scope_VIEW__ || 'dashboard';
  const currentFileFromExt = window.__tf_scope_CURRENT_FILE__;

  const [files] = useState<TerraformFile[]>(initialFiles);
  const [page, setPage] = useState<Page>(
    initialView === 'fileDetail' && currentFileFromExt ? 'fileDetail' : 'dashboard'
  );
  const [currentFile, setCurrentFile] = useState<TerraformFile | null>(
    (currentFileFromExt || (initialFiles === MOCK_FILES ? MOCK_FILES[1] : null))
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
  settings:  'Settings',
};

const MOCK_FILES: TerraformFile[] = [
  {
    id: "file-1",
    name: "main.tf",
    filePath: "/Users/deamon/Desktop/tf-scope/samples/aws-vpc-infrastructure/main.tf",
    type: "tf",
    ts: new Date().toISOString(),
    providers: ["AWS"],
    size: 903,
    resources: [
      {
        id: 1,
        type: "aws_vpc",
        name: "main",
        provider: "AWS",
        refs: 2,
        attrs: {
          cidr_block: "10.0.0.0/16",
          enable_dns_hostnames: "true",
          tags: JSON.stringify({ Name: "terraform-visualizer-demo" })
        },
        deps: []
      },
      {
        id: 2,
        type: "aws_subnet",
        name: "public",
        provider: "AWS",
        refs: 1,
        attrs: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "aws_vpc.main.id"
        },
        deps: ["aws_vpc.main"]
      },
      {
        id: 3,
        type: "aws_security_group",
        name: "web_sg",
        provider: "AWS",
        refs: 1,
        attrs: {
          name: "web-sg",
          vpc_id: "aws_vpc.main.id"
        },
        deps: ["aws_vpc.main"]
      },
      {
        id: 4,
        type: "aws_instance",
        name: "web_server",
        provider: "AWS",
        refs: 0,
        attrs: {
          instance_type: "t2.micro",
          subnet_id: "aws_subnet.public.id",
          vpc_security_group_ids: "['aws_security_group.web_sg.id']"
        },
        deps: ["aws_subnet.public", "aws_security_group.web_sg"]
      }
    ]
  },
  {
    id: "file-2",
    name: "terraform.tfstate",
    filePath: "/Users/deamon/Desktop/tf-scope/samples/aws-vpc-infrastructure/terraform.tfstate",
    type: "tfstate",
    ts: new Date().toISOString(),
    providers: ["AWS"],
    size: 3099,
    resources: [
      {
        id: 1,
        type: "aws_vpc",
        name: "main",
        provider: "AWS",
        refs: 2,
        attrs: {
          arn: "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0a1b2c3d4e5f6g7h8",
          cidr_block: "10.0.0.0/16",
          enable_dns_hostnames: "true",
          id: "vpc-0a1b2c3d4e5f6g7h8"
        },
        deps: []
      },
      {
        id: 2,
        type: "aws_subnet",
        name: "public",
        provider: "AWS",
        refs: 1,
        attrs: {
          arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-0i1j2k3l4m5n6o7p8",
          cidr_block: "10.0.1.0/24",
          id: "subnet-0i1j2k3l4m5n6o7p8",
          vpc_id: "vpc-0a1b2c3d4e5f6g7h8"
        },
        deps: ["aws_vpc.main"]
      },
      {
        id: 3,
        type: "aws_security_group",
        name: "web_sg",
        provider: "AWS",
        refs: 1,
        attrs: {
          id: "sg-0q1r2s3t4u5v6w7x8",
          name: "web-sg",
          vpc_id: "vpc-0a1b2c3d4e5f6g7h8"
        },
        deps: ["aws_vpc.main"]
      },
      {
        id: 4,
        type: "aws_instance",
        name: "web_server",
        provider: "AWS",
        refs: 0,
        attrs: {
          id: "i-0y1z2a3b4c5d6e7f8",
          instance_type: "t2.micro",
          subnet_id: "subnet-0i1j2k3l4m5n6o7p8",
          vpc_security_group_ids: "['sg-0q1r2s3t4u5v6w7x8']"
        },
        deps: ["aws_subnet.public", "aws_security_group.web_sg"]
      }
    ]
  },
  {
    id: "file-3",
    name: "plan.json",
    filePath: "/Users/deamon/Desktop/tf-scope/samples/aws-vpc-infrastructure/plan.json",
    type: "plan",
    ts: new Date().toISOString(),
    providers: ["AWS"],
    size: 2183,
    isPlan: true,
    summary: { add: 1, change: 1, destroy: 1, noop: 0 },
    resources: [
      {
        id: 1,
        type: "aws_s3_bucket",
        name: "new_storage",
        provider: "AWS",
        refs: 0,
        attrs: {
          bucket: "TFScope-planned-bucket",
          tags: JSON.stringify({ Environment: "Dev" })
        },
        deps: [],
        change: "create"
      },
      {
        id: 2,
        type: "aws_instance",
        name: "web_server",
        provider: "AWS",
        refs: 0,
        attrs: {
          tags: JSON.stringify({ Name: "Updated-TFScope-Server" })
        },
        deps: [],
        change: "update"
      },
      {
        id: 3,
        type: "aws_subnet",
        name: "old_subnet",
        provider: "AWS",
        refs: 0,
        attrs: {},
        deps: [],
        change: "destroy"
      }
    ]
  },
  {
    id: "file-4",
    name: "static-site-s3/main.tf",
    filePath: "/Users/deamon/Desktop/tf-scope/samples/static-site-s3/main.tf",
    type: "tf",
    ts: new Date().toISOString(),
    providers: ["AWS"],
    size: 925,
    resources: [
      {
        id: 1,
        type: "aws_s3_bucket",
        name: "website",
        provider: "AWS",
        refs: 3,
        attrs: {
          bucket: "TFScope-sample-website-bucket"
        },
        deps: []
      },
      {
        id: 2,
        type: "aws_s3_bucket_public_access_block",
        name: "public_access",
        provider: "AWS",
        refs: 0,
        attrs: {
          bucket: "aws_s3_bucket.website.id"
        },
        deps: ["aws_s3_bucket.website"]
      },
      {
        id: 3,
        type: "aws_s3_bucket_website_configuration",
        name: "config",
        provider: "AWS",
        refs: 0,
        attrs: {
          bucket: "aws_s3_bucket.website.id"
        },
        deps: ["aws_s3_bucket.website"]
      },
      {
        id: 4,
        type: "aws_s3_bucket_policy",
        name: "allow_public",
        provider: "AWS",
        refs: 0,
        attrs: {
          bucket: "aws_s3_bucket.website.id"
        },
        deps: ["aws_s3_bucket.website"]
      }
    ]
  }
];
