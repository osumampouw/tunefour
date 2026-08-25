# infra/

Infrastructure-as-code for Tunefour. Cloud-agnostic by design (see IMPLEMENTATION_PLAN.md).

## Planned contents (later phases)

- `terraform/` — VPC/network, managed Postgres (RDS/Cloud SQL), Redis (ElastiCache/Memorystore),
  object storage bucket + CDN (CloudFront/Cloud CDN), container runtime (ECS/Cloud Run/GKE),
  secret manager, load balancer + TLS.
- `docker/` — production Dockerfiles for `apps/server` and `apps/admin`.
- Deployment manifests / pipelines.

## Local development

Use the root `docker-compose.yml` for Postgres, Redis, and MinIO (S3-compatible):

```bash
docker compose up -d
```

Cloud provider mapping:

| Local (dev)     | AWS              | GCP              |
| --------------- | ---------------- | ---------------- |
| Postgres        | RDS Postgres     | Cloud SQL        |
| Redis           | ElastiCache      | Memorystore      |
| MinIO           | S3               | Cloud Storage    |
| —               | CloudFront (CDN) | Cloud CDN        |
| local processes | ECS / Fargate    | Cloud Run / GKE  |
