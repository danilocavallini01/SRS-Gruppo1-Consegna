variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "europe-west12"
  description = "GCP project region"
}

variable "domain" {
  type        = string
  description = "HTTP domain"
}

variable "cliend_id" {
  type        = string
  description = "client id"
}

variable "client_secret" {
  type        = string
  description = "client secret"
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret"
}

variable "repository_id" {
  description = "ID of the Artifact Registry repository"
  type        = string
  default     = "gruppo1-gar-repo"
}

variable "backend_container_image" {
  type        = string
  description = "Docker image URL for the backend"
}

variable "frontend_container_image" {
  type        = string
  description = "Docker image URL for the frontend"
}

variable "service_account_email" {
  type        = string
  description = "Service account email for images for cloud run"
}

variable "backend_port" {
  type        = number
  default     = 8000
  description = "Serving port of the backend"
}

variable "ip_cidr_range" {
  type        = string
  default     = "10.8.0.0/28"
  description = "Ip CIDR range for VPC"
}

variable "user_shared_folder" {
  description = "folder where the user will save their own files"
  type        = string
  default     = "gruppo1-shared-folder"
}

// TOGGLES
variable "cloud_run_on" {
  type    = bool
  default = false
}

variable "storage_on" {
  type    = bool
  default = false
}

variable "pubsub_on" {
  type    = bool
  default = false
}
