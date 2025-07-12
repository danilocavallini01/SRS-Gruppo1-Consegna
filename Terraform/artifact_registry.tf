resource "google_artifact_registry_repository" "default" {
  count = 0
  provider      = google
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"

  description = "Docker repository for SRS Gruppo1 images"
  mode        = "STANDARD_REPOSITORY"

  docker_config {
    immutable_tags = false
  }

  vulnerability_scanning_config {
    enablement_config = "DISABLED"
  }

  labels = {
    env = "dev"
  }
}