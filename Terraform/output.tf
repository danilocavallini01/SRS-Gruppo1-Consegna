output "cloud_run_frontend_url" {
  description = "URL of the frontend Cloud Run V2 service"
  value       = length(google_cloud_run_v2_service.frontend) > 0 ? google_cloud_run_v2_service.frontend[0].uri : null
}

output "cloud_run_backend_url" {
  description = "URL of the backend Cloud Run V2 service"
  value       = length(google_cloud_run_v2_service.backend) > 0 ? google_cloud_run_v2_service.backend[0].uri : null
}

output "load_balancer_ip" {
  description = "External IP address of the Load Balancer (used to access frontend)"
  value       = length(google_compute_global_address.default) > 0 ? google_compute_global_address.default[0].address : null
}

output "cloud_run_backend" {
  description = "Backend service conditions"
  value       = length(google_cloud_run_v2_service.backend) > 0 ? google_cloud_run_v2_service.backend[0].conditions[0] : null
}

output "cloud_run_frontend" {
  description = "Backend service conditions"
  value       = length(google_cloud_run_v2_service.frontend) > 0 ? google_cloud_run_v2_service.frontend[0].conditions[0] : null
}

output "public_address" {
  description = "Public address of the Project"
  value       = length(google_compute_global_address.default) > 0 ? google_compute_global_address.default[0].address : null
}

output "artifact_registry_repo_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}
