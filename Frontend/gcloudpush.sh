output=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")

if [ -z "$output" ] || [ "$output" = "none" ] || [ $? -ne 0 ]; then
  gcloud auth login
fi

gcloud auth configure-docker europe-west12-docker.pkg.dev

docker build -t europe-west12-docker.pkg.dev/gruppo-1-456912/gruppo1-repository/frontend-app:latest .
docker tag frontend-app europe-west12-docker.pkg.dev/gruppo-1-456912/gruppo1-repository/frontend-app:latest
docker push europe-west12-docker.pkg.dev/gruppo-1-456912/gruppo1-repository/frontend-app:latest

gcloud artifacts docker images list \
  europe-west12-docker.pkg.dev/gruppo-1-456912/gruppo1-repository
