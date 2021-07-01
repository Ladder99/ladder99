#!/bin/bash
bin/bash
ifconfig p1p1 192.168.1.1 mtu 9710 txqueuelen 1000 up
arp -s 192.168.1.2 00:25:90:c8:3e:96
ip route add default via 192.168.1.1
sysctl -w \
  net.core.wmem_max=26214400 \
  net.core.wmem_default=8388608 \
  fs.file-max=100000 \
  vm.swappiness=10 \
  net.core.optmem_max=40960 \
  net.core.netdev_max_backlog=50000 \
  net.ipv4.udp_mem='8388608 8388608 8388608' \
  net.ipv4.udp_wmem_min=8388608 \
  net.ipv4.conf.all.send_redirects=0 \
  net.ipv4.conf.all.accept_redirects=0 \
  net.ipv4.conf.all.accept_source_route=0 \
  net.ipv4.conf.all.log_martians=1 \
  net.netfilter.nf_conntrack_max=262144 \
  net.nf_conntrack_max=262144

