terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------
# BACKEND 
# -----------------------
resource "google_cloud_run_v2_service" "backend" {
  count                = var.cloud_run_on ? 1 : 0
  name                 = "node-backend"
  location             = var.region
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true
  deletion_protection  = false

  template {
    containers {
      image = var.backend_container_image
      ports {
        container_port = var.backend_port
      }

      env {
        name  = "GOOGLE_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_PUBSUB_TOPIC"
        value = "llm-requests"
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.cliend_id
      }
      env {
        name  = "GOOGLE_CLIENT_SECRET"
        value = var.client_secret
      }
      env {
        name  = "GOOGLE_SHARED_USER_BUCKET"
        value = var.user_shared_folder
      }
      env {
        name  = "COOKIE_KEY"
        value = "cookiecloud"
      }
      env {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      }
    }

    service_account = var.service_account_email

    vpc_access {
      connector = google_vpc_access_connector.default[0].id
      egress    = "ALL_TRAFFIC"
    }

    scaling {
      max_instance_count = 3
    }
  }

  depends_on = [
    google_pubsub_topic.default,
    google_vpc_access_connector.default
  ]
}

# -----------------------
# FRONTEND
# -----------------------
resource "google_cloud_run_v2_service" "frontend" {
  count                = var.cloud_run_on ? 1 : 0
  name                 = "react-frontend"
  location             = var.region
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true
  deletion_protection  = false

  template {
    containers {
      image = var.frontend_container_image
      ports {
        container_port = 8080
      }
    }

    service_account = var.service_account_email

    vpc_access {
      connector = google_vpc_access_connector.default[0].id
      egress    = "ALL_TRAFFIC"
    }

    annotations = {
      "run.googleapis.com/invoker-iam-disabled" = "true"
    }

    scaling {
      max_instance_count = 10
    }
  }

  depends_on = [
    google_vpc_access_connector.default,
    google_cloud_run_v2_service.backend
  ]
}

# -----------------------
# NETWORK 
# -----------------------

# Serverless NEG for Load Balancer
# A regional NEG that can support Serverless Products, proxying traffic to external backends and providing traffic to the PSC port mapping endpoints.
resource "google_compute_region_network_endpoint_group" "default" {
  count                 = var.cloud_run_on ? 1 : 0
  name                  = "vpc-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = google_cloud_run_v2_service.frontend[0].name
  }
}

# VPC
# Manages a VPC network or legacy network resource on GCP.
resource "google_compute_network" "default" {
  count                   = var.cloud_run_on ? 1 : 0
  name                    = "frontend-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

# Subnet
resource "google_compute_subnetwork" "default" {
  count         = var.cloud_run_on ? 1 : 0
  name          = "frontend-subnet"
  region        = var.region
  network       = google_compute_network.default[0].id
  ip_cidr_range = var.ip_cidr_range
}

resource "google_vpc_access_connector" "default" {
  count = var.cloud_run_on ? 1 : 0
  name  = "run-vpc"
  subnet {
    name = google_compute_subnetwork.default[0].name
  }
  min_instances = 2
  max_instances = 3
  region        = var.region
}

resource "google_compute_router" "default" {
  count   = var.cloud_run_on ? 1 : 0
  name    = "main-router"
  network = google_compute_network.default[0].name
  region  = var.region
}

resource "google_compute_router_nat" "nat" {
  count                              = var.cloud_run_on ? 1 : 0
  name                               = "main-nat"
  router                             = google_compute_router.default[0].name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Frontend LOAD BALANCER
# A Backend Service defines a group of virtual machines that will serve traffic for load balancing
resource "google_compute_region_backend_service" "default" {
  count                 = var.cloud_run_on ? 1 : 0
  name                  = "frontend-backend-service"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.default.id]
  protocol              = "HTTPS"
  enable_cdn            = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    client_ttl                   = 7200
    max_ttl                      = 10800
    negative_caching             = true
    signed_url_cache_max_age_sec = 7200
  }

  backend {
    group = google_compute_region_network_endpoint_group.default[0].id
    capacity_scaler = 1
  }
}

resource "google_compute_health_check" "default" {
  name = "https-health-check"

  timeout_sec        = 1
  check_interval_sec = 1

  https_health_check {
    port = "443"
  }
}

# Url map
# UrlMaps are used to route requests to a backend service based on rules that you define for the host and path of an incoming URL.
resource "google_compute_url_map" "default" {
  count           = var.cloud_run_on ? 1 : 0
  name            = "frontend-url-map"
  default_service = google_compute_region_backend_service.default[0].id
}

resource "google_compute_target_https_proxy" "default" {
  count            = var.cloud_run_on ? 1 : 0
  name             = "https-proxy"
  url_map          = google_compute_url_map.default[0].id
  ssl_certificates = ["https://www.googleapis.com/compute/v1/projects/gruppo-1-456912/global/sslCertificates/ssl-cert"]
}

# Global forwarding rule
# Global forwarding rules are used to forward traffic to the correct load balancer for HTTP load balancing. Global forwarding rules can only be used for HTTP load balancing.
resource "google_compute_global_forwarding_rule" "default" {
  count                 = var.cloud_run_on ? 1 : 0
  name                  = "frontend-http-rule"
  ip_address            = google_compute_global_address.default[0].id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL"
  target                = google_compute_target_https_proxy.default[0].id
}

resource "google_compute_global_address" "default" {
  count = var.cloud_run_on ? 1 : 0
  name  = "gcpilot-grp1"
}


resource "google_dns_managed_zone" "default" {
  name     = "gruppo1-zone"
  dns_name = "${var.domain}."
}

resource "google_dns_record_set" "default" {
  count        = var.cloud_run_on ? 1 : 0
  name         = "${var.domain}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name

  rrdatas = [google_compute_global_address.default[0].address]
}
