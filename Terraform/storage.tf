resource "google_storage_bucket" "default" {
  count         = var.storage_on ? 0 : 0
  name          = var.user_shared_folder
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

resource "google_firestore_database" "default" {
  count                   = var.storage_on ? 0 : 0
  project                 = var.project_id
  name                    = "(default)"
  location_id             = var.region
  delete_protection_state = "DELETE_PROTECTION_DISABLED"
  type                    = "FIRESTORE_NATIVE"
}
