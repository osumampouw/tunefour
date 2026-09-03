# infra/

Infrastructure-as-code for Tunefour. **Target cloud: Google Cloud Platform (GCP).** The design
stays provider-swappable (see IMPLEMENTATION_PLAN.md and `docs/infra.html`).

## Planned contents (later phases)

- `terraform/` — VPC/network, managed Postgres (**Cloud SQL**), Redis (**Memorystore**),
  object storage bucket + CDN (**Cloud Storage + Cloud CDN**), container runtime
  (**Cloud Run**, or GKE), **Secret Manager**, load balancer + TLS.
- `docker/` — production Dockerfiles for `apps/server` and `apps/admin`
  (built via **Cloud Build**, stored in **Artifact Registry**).
- Deployment manifests / pipelines.

## Local development

Use the root `docker-compose.yml` for Postgres, Redis, and MinIO (S3-compatible):

```bash
docker compose up -d
```

Local → GCP mapping:

| Local (dev)     | GCP (production)      |
| --------------- | --------------------- |
| Postgres        | Cloud SQL             |
| Redis           | Memorystore           |
| MinIO           | Cloud Storage         |
| —               | Cloud CDN             |
| local processes | Cloud Run (or GKE)    |
| `.env`          | Secret Manager        |
| image build     | Cloud Build + Artifact Registry |
