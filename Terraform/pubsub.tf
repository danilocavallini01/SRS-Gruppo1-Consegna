# GCloud PubSub Topic used to push and pull incoming LLM requests from the user
resource "google_pubsub_topic" "default" {
  count = var.pubsub_on ? 1 : 0
  name                       = "llm-requests"
  message_retention_duration = "86600s"
}

resource "google_pubsub_subscription" "default" {
  name  = "llm-requests-subscription"
  count = var.pubsub_on ? 1 : 0
  topic                = google_pubsub_topic.default[0].id
  ack_deadline_seconds = 20
}