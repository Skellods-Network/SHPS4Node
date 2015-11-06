#!/bin/bash

# Untested, sry. Will do later :)

NODE_COM = "node"
command -v $NODE_COM >/dev/null 2>&1 || {

  NODE_COM = "nodejs"
  command -v $NODE_COM >/dev/null 2>&1 || {

    echo >&2 "Could not find Node.  Aborting.";
    exit 1;
  }
}

eval "$NODE_COM --expose_gc --harmony_proxies SHPS.js"
read -rsp $'Press any key to continue...\n'