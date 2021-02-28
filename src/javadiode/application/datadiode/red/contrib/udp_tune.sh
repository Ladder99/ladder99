#!/bin/bash
ifconfig p1p1 192.168.1.2 mtu 9710
arp -s 192.168.1.1 00:25:90:eb:e0:9e
sysctl -w \
  net.core.rmem_max=26214400 \
  net.core.wmem_max=16777216 \
  net.core.rmem_default=524288 \
  net.core.wmem_default=524288 \
  fs.file-max=100000 \
  vm.swappiness=10 \
  net.core.optmem_max=40960 \
  net.core.netdev_max_backlog=50000 \
  net.ipv4.udp_rmem_min=8192 \
  net.ipv4.udp_wmem_min=8192 \
  net.ipv4.conf.all.send_redirects=0 \
  net.ipv4.conf.all.accept_redirects=0 \
  net.ipv4.conf.all.accept_source_route=0 \
  net.ipv4.conf.all.log_martians=1 \
  net.ipv4.neigh.default.gc_thresh1=8192 \
  net.ipv4.neigh.default.gc_thresh1=8192 \
  net.ipv4.neigh.default.gc_thresh1=8192 \
