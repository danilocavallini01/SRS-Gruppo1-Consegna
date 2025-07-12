import fs from 'fs';
import path from 'path';
import { CloudCatalogClient, protos } from '@google-cloud/billing';
import { DOWNLOAD_PATH, FS } from './terraform/run';
import { downloadTerraformState } from './terraform/bucket';
import { GOOGLE_BILLING_CREDENTIALS } from '../secrets';





// Path where default.tfstate will be saved locally
const STATE_FILE = path.join(DOWNLOAD_PATH, FS, 'default.tfstate');

// Initialize Cloud Catalog client with service account key
const catalogClient = new CloudCatalogClient({
  keyFilename: GOOGLE_BILLING_CREDENTIALS,
});

// Interfaces for cost estimation
export interface CostEstimate {
  totalCost: number;
  services: ServiceCost[];
}

export interface ServiceCost {
  name: string;           // e.g., 'services/6F81-5844-456A'
  displayName: string;    // e.g., 'Compute Engine'
  skus: SkuCost[];
}

export interface SkuCost {
  name: string;
  description: string;
  usageUnit: string;
  price: number;
}


const resourceTypeToCatalogService: Record<string, string> = {
  "google_compute_instance": "Compute Engine API",
  "google_compute_disk": "Compute Engine API",
  "google_compute_network": "Compute Engine API",
  "google_compute_firewall": "Compute Engine API",
  "google_compute_address": "Compute Engine API",
  "google_storage_bucket": "Cloud Storage API",
  "google_storage_bucket_object": "Cloud Storage API",
  "google_sql_database_instance": "Cloud SQL Admin API",
  "google_sql_database": "Cloud SQL Admin API",
  "google_sql_user": "Cloud SQL Admin API",
  "google_pubsub_topic": "Cloud Pub/Sub API",
  "google_pubsub_subscription": "Cloud Pub/Sub API",
  "google_bigquery_dataset": "BigQuery API",
  "google_bigquery_table": "BigQuery API",
  "google_cloudfunctions_function": "Cloud Functions API",
  "google_iam_service_account": "Identity and Access Management (IAM) API",
  "google_cloud_run_service": "Cloud Run API",
  "google_dns_managed_zone": "Cloud DNS API",
  "google_dns_record_set": "Cloud DNS API",
  "google_spanner_instance": "Cloud Spanner API",
  "google_spanner_database": "Cloud Spanner API",
  "google_kms_key_ring": "Cloud Key Management Service (KMS) API",
  "google_kms_crypto_key": "Cloud Key Management Service (KMS) API",
  "google_filestore_instance": "Cloud Filestore API",
  "google_logging_project_sink": "Cloud Logging API",
  "google_monitoring_alert_policy": "Cloud Monitoring API",
  "google_monitoring_dashboard": "Cloud Monitoring API",
  "google_vpc_access_connector": "Serverless VPC Access API",
  "google_memcache_instance": "Memorystore for Memcached API",
  "google_redis_instance": "Memorystore for Redis API",
  "google_apikeys_key": "API Keys API",
  "google_firestore_database": "Cloud Firestore API",
  "google_secret_manager_secret": "Secret Manager API",
  "google_secret_manager_secret_version": "Secret Manager API",
  "google_dataflow_job": "Cloud Dataflow API",
  "google_dataproc_cluster": "Cloud Dataproc API",
  "google_ai_platform_model": "AI Platform Training & Prediction API",
  "google_ai_platform_job": "AI Platform Training & Prediction API",
  "google_workflows_workflow": "Workflows API",
  "google_endpoints_service": "Service Management API",
  "google_healthcare_dataset": "Cloud Healthcare API",
  "google_healthcare_dicom_store": "Cloud Healthcare API",
  "google_healthcare_fhir_store": "Cloud Healthcare API",
  "google_healthcare_hl7_v2_store": "Cloud Healthcare API",
  "google_tpu_node": "Cloud TPU API",
  "google_vertex_ai_endpoint": "Vertex AI API",
  "google_vertex_ai_model": "Vertex AI API",
  "google_batch_job": "Batch API",
  "google_game_services_game_server_cluster": "Game Services API",

};

function filterSkus(skus: protos.google.cloud.billing.v1.ISku[], attributes: Record<string, string>): protos.google.cloud.billing.v1.ISku[] {
  return skus.filter((sku) => {
    const desc = sku.description?.toLowerCase() || '';

    return Object.entries(attributes).every(([key, value]) => {
      return desc.includes(value.toLowerCase());
    });
  });
}
function extractResourceAttributes(resource: any): Record<string, string> {
  const attributes = resource.instances?.[0]?.attributes || {};
  const relevant: Record<string, string> = {};

  const keysOfInterest = [
    'region', 'zone', 'machine_type', 'tier', 'class', 'storage_type',
    'location', 'size', 'replication', 'network', 'subnetwork',
    'preemptible', 'disk_type', 'disk_size_gb', 'auto_delete',
    'database_version', 'availability_type', 'backup_enabled',
    'storage_auto_resize', 'node_pool.version', 'node_pool.autoscaling.enabled'
  ];

  for (const key of keysOfInterest) {
    if (attributes[key]) {
      relevant[key] = String(attributes[key]);
    }
  }

  return relevant;
}


/**
 * Estimate costs based on applied Terraform state.
 * Downloads the state file, parses resources, fetches SKUs & prices.
 */
export async function estimateAppliedCosts(
  email: string,
  folderId: number
): Promise<CostEstimate> {
  // Download and parse Terraform state
  await downloadTerraformState(email, folderId);
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Terraform state file not found at ${STATE_FILE}`);
  }
  const raw = fs.readFileSync(STATE_FILE, 'utf8');
  const tfstate: any = JSON.parse(raw);
  const resources = Array.isArray(tfstate.resources) ? tfstate.resources : [];

const resourceTypes = Array.from(
  new Set(
    resources
      .filter((r: any) =>
        typeof r.type === 'string' &&
        String(r.provider || '').toLowerCase().includes('google')
      )
      .map((r: any) => r.type)
  )
);


  // Load Cloud Catalog services catalog once
  const [servicesList] = await catalogClient.listServices();
  // Build map: serviceDomain -> { name, displayName }
  const catalogMap: Record<string, { parent: string; displayName: string }> = {};
  for (const service of servicesList) {
    const nameKey = service.name as string; // e.g.: services/compute.googleapis.com
    const domainKey = service.name!.replace("services/", ""); // e.g.: compute.googleapis.com
    const displayKey = service.displayName as string; // preserve original casing, e.g.: "Compute Engine"
    const displayApiKey = displayKey.endsWith(" API")
      ? displayKey
      : `${displayKey} API`; // e.g.: "Compute Engine API"
    const displayNoApiKey = displayKey.replace(/ API$/, ''); // e.g.: "Compute Engine"

  catalogMap[nameKey] = { parent: nameKey, displayName: service.displayName as string };
  catalogMap[domainKey] = { parent: nameKey, displayName: service.displayName as string };
  catalogMap[displayKey] = { parent: nameKey, displayName: service.displayName as string };
  catalogMap[displayApiKey] = { parent: nameKey, displayName: service.displayName as string };
  catalogMap[displayNoApiKey] = { parent: nameKey, displayName: service.displayName as string };

}
  const result: ServiceCost[] = [];
  let totalCost = 0;
  console.log('Found resource types:', resourceTypes);

for (const resource of resources) {
  const type = resource.type;
  if (typeof type !== 'string') continue;

const domain = resourceTypeToCatalogService[type];


if (!domain) {
  console.warn(`No mapping found for Terraform resource type: ${type}`);
  continue;
}

const entry = catalogMap[domain];
if (!entry) {
  console.warn(`No catalog entry found for domain: ${domain}`);
  continue;
}

console.log(`Fetching SKUs for service: ${domain} (parent: ${entry.parent})`);

  try {
      const [skus] = await catalogClient.listSkus({
       parent: entry.parent });
      const attributes = extractResourceAttributes(resource);
      const filteredSkus = filterSkus(skus, attributes);
      console.log(`SKUs fetched for ${domain}: ${skus.length}`);

    const skuCosts: SkuCost[] = [];
    filteredSkus.forEach((sku) => {
      const price = extractPrice(sku); 
      console.log(`SKU: ${sku.name}`);
      console.log(`Price: ${price}`);
      totalCost += price;
      skuCosts.push({
        name: sku.name || '',
        description: sku.description || '',
        usageUnit: sku.pricingInfo?.[0]?.pricingExpression?.usageUnit || '',
        price: price,
      });
    });

    if (skuCosts.length > 0) {
      result.push({
        name: entry.parent,
        displayName: entry.displayName,
        skus: skuCosts,
      });
    }

  } catch (err) {
    console.error(`Error fetching SKUs for ${domain}:`, err);
    continue;
  }
}


  // Cleanup state file
  try { fs.unlinkSync(STATE_FILE); } catch {}

  return { totalCost, services: result };
}

/**
 * Extract numeric price from a SKU.
 */
function extractPrice(sku: protos.google.cloud.billing.v1.ISku): number {
  const pi = sku.pricingInfo?.[0]?.pricingExpression;
  const tier = pi?.tieredRates?.[0]?.unitPrice;
  if (!tier) return 0;
  const units = Number(tier.units || 0);
  const nanos = Number(tier.nanos || 0) / 1e9;
  return units + nanos;
}
