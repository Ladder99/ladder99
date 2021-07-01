#!/bin/bash
ifconfig p1p1 192.168.1.2 mtu 9710 txqueuelen 1000 up
arp -s 192.168.1.1 00:25:90:eb:e0:9e
sudo sysctl -w \
  net.core.rmem_max=86214400 \
  net.core.rmem_default=46214400 \
  fs.file-max=2097152 \
  vm.swappiness=10 \
  net.core.optmem_max=80960 \
  net.core.netdev_max_backlog=70000 \
  net.ipv4.udp_mem='26214400 26214400 26214400' \
  net.ipv4.udp_rmem_min=26214400 \
  net.ipv4.conf.all.send_redirects=0 \
  net.ipv4.conf.all.accept_redirects=0 \
  net.ipv4.conf.all.accept_source_route=0 \
  net.ipv4.conf.all.log_martians=1 \
  net.netfilter.nf_conntrack_max=262144 \
  net.nf_conntrack_max=262144

