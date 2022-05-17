#!/usr/bin/env bash
containerName=$1
docker stats "${containerName}" --no-stream \
  --format "{\"container\": \"{{ .Container }}\", \"memory\": { \"raw\": \"{{ .MemUsage }}\", \"percent\": \"{{ .MemPerc }}\"}, \"cpu\": \"{{ .CPUPerc }}\"}"
