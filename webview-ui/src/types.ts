export interface TerraformResource {
  id: number;
  type: string;
  name: string;
  provider: string;
  refs: number;
  attrs: Record<string, string>;
  deps: string[];
  change?: 'create' | 'update' | 'destroy' | 'noop';
}

export interface TerraformFile {
  id: string;
  name: string;
  filePath: string;
  type: 'tf' | 'tfstate' | 'plan';
  ts: string;
  providers: string[];
  resources: TerraformResource[];
  isPlan?: boolean;
  summary?: { add: number; change: number; destroy: number; noop: number };
  workspaceId?: string;
  size: number;
}

export type ViewMode = 'list' | 'graph' | 'cost' | 'raw';
export type Page = 'dashboard' | 'files' | 'search' | 'diff' | 'cost' | 'settings' | 'fileDetail';

export const COST_MAP: Record<string, { base: number; unit: string; note: string }> = {
  aws_instance: { base: 8.47, unit: 'mo', note: 't3.micro on-demand' },
  aws_db_instance: { base: 12.41, unit: 'mo', note: 'db.t3.micro' },
  aws_rds_cluster: { base: 29.20, unit: 'mo', note: 'Aurora serverless' },
  aws_elasticache_cluster: { base: 11.52, unit: 'mo', note: 'cache.t3.micro' },
  aws_s3_bucket: { base: 0.023, unit: 'GB/mo', note: 'Standard storage' },
  aws_vpc: { base: 0, unit: 'mo', note: 'No charge' },
  aws_subnet: { base: 0, unit: 'mo', note: 'No charge' },
  aws_security_group: { base: 0, unit: 'mo', note: 'No charge' },
  aws_internet_gateway: { base: 0, unit: 'mo', note: 'No charge' },
  aws_route_table: { base: 0, unit: 'mo', note: 'No charge' },
  aws_lb: { base: 16.20, unit: 'mo', note: 'ALB baseline' },
  aws_cloudfront_distribution: { base: 0.01, unit: '10k req', note: 'Price per request' },
  aws_lambda_function: { base: 0.20, unit: '1M req', note: 'On-demand' },
  aws_ecs_service: { base: 0, unit: 'mo', note: 'Fargate compute extra' },
  aws_eks_cluster: { base: 72, unit: 'mo', note: 'Cluster fee only' },
  aws_sqs_queue: { base: 0.40, unit: '1M req', note: 'Standard queue' },
  aws_sns_topic: { base: 0.50, unit: '1M pub', note: 'Standard messages' },
  aws_cloudwatch_log_group: { base: 0.50, unit: 'GB ingested', note: 'Log ingestion' },
  aws_iam_role: { base: 0, unit: 'mo', note: 'No charge' },
  aws_iam_policy: { base: 0, unit: 'mo', note: 'No charge' },
  aws_route53_zone: { base: 0.50, unit: 'mo', note: 'Per hosted zone' },
  aws_acm_certificate: { base: 0, unit: 'mo', note: 'No charge' },
  aws_eip: { base: 3.65, unit: 'mo', note: 'Idle EIP' },
  aws_nat_gateway: { base: 32.40, unit: 'mo', note: 'NAT gateway' },
  aws_key_pair: { base: 0, unit: 'mo', note: 'No charge' },
};
