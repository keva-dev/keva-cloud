#!/usr/bin/env bash
containerName=$1
docker stats "${containerName}" --no-stream --format "{{ json . }}"
